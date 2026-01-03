"use client";

import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { getLedgerEntries } from '@/lib/accountsService';
import { getRooms } from '@/lib/firestoreService';
import RevenueAnalysisChart from '@/components/admin/reports/RevenueAnalysisChart';
import OccupancyTrendsChart from '@/components/admin/reports/OccupancyTrendsChart';
import DailyReportTable from '@/components/admin/reports/DailyReportTable';
import { ArrowPathIcon, CalendarDaysIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LedgerEntry } from '@/lib/firestoreService';

// Interfaces for chart data
interface RevenueData {
    name: string;
    income: number;
    expenses: number;
    date: string;
}

interface OccupancyData {
    name: string;
    occupancyRate: number;
    date: string;
}

export default function ReportsPage() {
    const { isReadOnly } = useAdminRole();
    const { showToast } = useToast();

    // State
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [loading, setLoading] = useState(true);

    // Chart Data
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);

    // Daily Report Data
    const [dailyReport, setDailyReport] = useState({
        rooms: {
            total: 0,
            ood: 0,
            available: 0,
            rented: 0,
            vacant: 0,
            comp: 0,
            houseUse: 0,
            dayUse: 0,
            occupancyPercentage: 0
        },
        guests: {
            adults: 0,
            children: 0,
            arrivals: 0,
            departures: 0,
            inHouse: 0,
            dayUse: 0,
            walkIn: 0
        },
        revenue: {
            roomRevenue: 0,
            tax: 0,
            fb: 0,
            other: 0,
            totalRevenue: 0,
            payments: 0,
            adr: 0,
            revPar: 0
        }
    });

    useEffect(() => {
        loadReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            // === 1. Setup Dates ===
            const targetDate = new Date(selectedDate);
            const targetDateStart = new Date(targetDate);
            targetDateStart.setHours(0, 0, 0, 0);
            const targetDateEnd = new Date(targetDate);
            targetDateEnd.setHours(23, 59, 59, 999);

            // For Charts: Last 7 Days range
            const chartEndDate = new Date();
            const chartStartDate = new Date();
            chartStartDate.setDate(chartEndDate.getDate() - 7);

            // === 2. Fetch Data ===

            // A. Get Total Rooms Dynamically from PHYSICAL Inventory
            // First try roomStates (Physical Rooms)
            let totalRoomCount = 15; // Fallback default as per user request (Garden:6, Imp:5, Occ:4)

            if (db) {
                try {
                    const roomStatesSnap = await getDocs(collection(db, 'roomStates'));
                    if (!roomStatesSnap.empty) {
                        totalRoomCount = roomStatesSnap.size;
                    } else {
                        // If roomStates empty, consider falling back to default 15
                        console.warn('roomStates collection empty, falling back to default 15');
                        totalRoomCount = 15;
                    }
                } catch (e) {
                    console.warn('Failed to fetch roomStates', e);
                }
            }

            // B. Ledger Entries (Revenue)
            const ledgerEntries = await getLedgerEntries(targetDateStart, targetDateEnd);

            // C. Bookings (Occupancy)
            let bookingsSnap: any = [];
            if (db) {
                const bookingsRef = collection(db, 'bookings');
                const q = query(bookingsRef);
                bookingsSnap = await getDocs(q);
            }

            // === 3. Process Daily Report Data ===

            let dailyRooms = {
                total: totalRoomCount,
                ood: 0,
                rented: 0,
                comp: 0,
                houseUse: 0,
                available: 0,
                vacant: 0,
                dayUse: 0,
                occupancyPercentage: 0
            };
            let dailyGuests = {
                adults: 0,
                children: 0,
                arrivals: 0,
                departures: 0,
                walkIn: 0,
                inHouse: 0,
                dayUse: 0
            };
            let dailyRevenue = {
                roomRevenue: 0,
                tax: 0,
                fb: 0,
                other: 0,
                payments: 0,
                totalRevenue: 0,
                adr: 0,
                revPar: 0
            };

            // -- Process Bookings --
            bookingsSnap.forEach((doc: any) => {
                const booking = doc.data();

                // Parse Dates
                let checkIn: Date;
                let checkOut: Date;
                const data = booking as any;

                if (data.checkInDate?.seconds) {
                    checkIn = (data.checkInDate as Timestamp).toDate();
                } else if (data.checkInDate) {
                    checkIn = new Date(data.checkInDate);
                } else {
                    checkIn = new Date();
                }

                if (data.checkOutDate?.seconds) {
                    checkOut = (data.checkOutDate as Timestamp).toDate();
                } else if (data.checkOutDate) {
                    checkOut = new Date(data.checkOutDate);
                } else {
                    checkOut = new Date();
                }

                // Set times to boundary for comparison
                checkIn.setHours(0, 0, 0, 0);
                checkOut.setHours(0, 0, 0, 0);
                const target = new Date(selectedDate);
                target.setHours(0, 0, 0, 0);

                // Check Overlap
                const isOccupying = target >= checkIn && target < checkOut;
                const isArrival = target.getTime() === checkIn.getTime();
                const isDeparture = target.getTime() === checkOut.getTime();
                const isMaintenance = booking.status === 'maintenance' || booking.type === 'maintenance';

                if (isOccupying) {
                    if (isMaintenance) {
                        dailyRooms.ood++;
                    } else if (booking.status !== 'cancelled' && booking.status !== 'no_show') {
                        dailyRooms.rented++;
                        // Add Guests
                        dailyGuests.adults += Number(booking.adults || 0);
                        dailyGuests.children += Number(booking.children || 0);
                        dailyGuests.inHouse += (Number(booking.adults || 0) + Number(booking.children || 0));

                        // Guest Source logic (mock)
                        if (booking.source === 'walk_in') dailyGuests.walkIn++;
                    }
                }

                if (isArrival && booking.status !== 'cancelled') dailyGuests.arrivals++;
                if (isDeparture && booking.status !== 'cancelled') dailyGuests.departures++;
            });

            // -- Process Revenue (Ledger) --
            // Sum per category
            ledgerEntries.forEach(entry => {
                if (entry.entryType === 'income') {
                    const category = entry.category as string;

                    if (category === 'Room Charge' || category === 'room_booking' || category === 'room_charge') {
                        dailyRevenue.roomRevenue += entry.amount;
                    } else if (category === 'Tax' || category === 'tax') {
                        dailyRevenue.tax += entry.amount;
                    } else if (category === 'food_beverage' || ['Food', 'Beverage', 'Restaurant', 'Bar'].includes(category)) {
                        dailyRevenue.fb += entry.amount;
                    } else {
                        dailyRevenue.other += entry.amount; // Services, Laundry etc
                    }

                    // Count payments roughly
                    if (entry.category === 'Payment' || entry.description?.toLowerCase().includes('payment')) {
                        dailyRevenue.payments += entry.amount;
                    }
                }
            });

            // Calculate Totals
            dailyRevenue.totalRevenue = dailyRevenue.roomRevenue + dailyRevenue.tax + dailyRevenue.fb + dailyRevenue.other;
            dailyRooms.available = dailyRooms.total - dailyRooms.ood;
            dailyRooms.vacant = dailyRooms.available - dailyRooms.rented;
            dailyRooms.occupancyPercentage = dailyRooms.total > 0 ? (dailyRooms.rented / dailyRooms.total) * 100 : 0;

            dailyRevenue.adr = dailyRooms.rented > 0 ? dailyRevenue.roomRevenue / dailyRooms.rented : 0;
            dailyRevenue.revPar = dailyRooms.total > 0 ? dailyRevenue.roomRevenue / dailyRooms.total : 0;

            setDailyReport({
                rooms: dailyRooms,
                guests: dailyGuests,
                revenue: dailyRevenue
            });


            // === 4. Chart Data ===
            const chartLedger = await getLedgerEntries(chartStartDate, chartEndDate);
            const dailyRevenueMap = new Map<string, { income: number; expenses: number }>();

            // Initialize map for last 7 days to ensure x-axis continuity
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                if (!dailyRevenueMap.has(dayName)) dailyRevenueMap.set(dayName, { income: 0, expenses: 0 });
            }

            chartLedger.forEach(entry => {
                const dayName = entry.date.toLocaleDateString('en-US', { weekday: 'short' });
                if (dailyRevenueMap.has(dayName)) {
                    const current = dailyRevenueMap.get(dayName)!;
                    if (entry.entryType === 'income') current.income += entry.amount;
                    else current.expenses += entry.amount;
                }
            });

            const processedRevenueData = Array.from(dailyRevenueMap.entries()).map(([name, data]) => ({
                name, income: data.income, expenses: data.expenses, date: name
            })).reverse();

            setRevenueData(processedRevenueData);
            setOccupancyData([]); // Todo: Implement Occupancy history

        } catch (error) {
            console.error('Error loading reports:', error);
            showToast('Failed to load report data', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 space-y-4 pb-8 font-sans print:bg-white print:p-0 print:space-y-0">

            {/* === PRINT ONLY HEADER === */}
            <div className="hidden print:block mb-8">
                <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        {/* Placeholder Logo */}
                        <div className="h-16 w-16 bg-gray-900 text-white flex items-center justify-center rounded-lg">
                            <span className="text-2xl font-bold">SP</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Sultan Palace</h1>
                            <p className="text-sm text-gray-600 font-medium tracking-widest uppercase">Luxury Hotel & Resort</p>
                            <p className="text-xs text-gray-500 mt-1">123 Coastal Road, Paradise Bay • +1 (555) 123-4567</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-900">Manager's Flash Report</h2>
                        <p className="text-sm text-gray-600">Date: <span className="font-mono font-bold">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                        <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>

            {/* Compact Header (Screen Only) */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-3 shadow-sm/50 backdrop-blur-md bg-white/95 print:hidden">
                <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            Reports & Analytics
                        </h1>
                        <p className="text-xs text-gray-400">Real-time performance metrics</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none w-36 shadow-sm"
                            />
                        </div>

                        <button
                            onClick={loadReportData}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors border border-gray-200 bg-white shadow-sm"
                            title="Refresh"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                        </button>

                        <button
                            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
                            onClick={() => window.print()}
                        >
                            <PrinterIcon className="h-3.5 w-3.5" />
                            <span>Print Report</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto px-6 mt-6 print:px-0 print:m-0 print:max-w-none">

                {/* Dashboard Grid - Stacked Layout */}
                {loading ? (
                    <div className="h-96 flex items-center justify-center bg-white rounded-lg border border-gray-200">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-400">Updating dashboard...</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-500 print:space-y-6">

                        {/* 1. Top Section: Daily Flash Report (Full Width) */}
                        <div className="space-y-4 print:space-y-2">
                            <div className="flex items-center justify-between print:hidden">
                                <div className="flex items-center gap-2">
                                    <span className="h-6 w-1.5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full shadow-sm"></span>
                                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                        Operational Overview
                                    </h2>
                                </div>
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                                    Live Metrics
                                </span>
                            </div>
                            <DailyReportTable data={dailyReport} />
                        </div>

                        {/* 2. Bottom Section: Charts (Side-by-Side) */}
                        <div className="space-y-4 break-inside-avoid print:break-inside-avoid">
                            <div className="flex items-center gap-2 print:hidden">
                                <span className="h-6 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full shadow-sm"></span>
                                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                    Performance Trends
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                                {/* Revenue Chart Card */}
                                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-lg transition-all duration-300 group print:shadow-none print:border print:border-gray-200 print:rounded-lg print:p-4">
                                    <div className="flex items-center justify-between mb-6 print:mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors print:text-black">Revenue Analysis</h3>
                                            <p className="text-xs text-gray-400 font-medium print:text-gray-600">Income vs Expenses (7 Days)</p>
                                        </div>
                                    </div>
                                    <div className="h-[350px] w-full print:h-[250px]">
                                        <RevenueAnalysisChart data={revenueData} />
                                    </div>
                                </div>

                                {/* Occupancy Chart Card */}
                                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-lg transition-all duration-300 group print:shadow-none print:border print:border-gray-200 print:rounded-lg print:p-4">
                                    <div className="flex items-center justify-between mb-6 print:mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors print:text-black">Occupancy Trend</h3>
                                            <p className="text-xs text-gray-400 font-medium print:text-gray-600">Room Utilization (7 Days)</p>
                                        </div>
                                    </div>
                                    <div className="h-[350px] w-full flex items-center justify-center print:h-[250px]">
                                        {occupancyData.length > 0 ? (
                                            <OccupancyTrendsChart data={occupancyData} />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-100 rounded-xl w-full h-full bg-gray-50/50 print:bg-white print:border-gray-300">
                                                <div className="bg-gray-50 p-3 rounded-full mb-3 print:hidden">
                                                    <CalendarDaysIcon className="h-8 w-8 text-gray-300" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-500">No sufficient history for trends</span>
                                                <p className="text-xs text-gray-400 mt-1 max-w-[200px] print:hidden">Data will appear after 24 hours of activity</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* === PRINT ONLY FOOTER === */}
            <div className="hidden print:flex mt-12 pt-8 border-t border-gray-200 justify-between items-end break-inside-avoid">
                <div className="text-xs text-gray-400">
                    <p>Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    <p>Confidential • Internal Use Only</p>
                </div>
                <div className="flex gap-16">
                    <div className="text-center">
                        <div className="w-48 border-b-2 border-gray-300 mb-2 h-8"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Night Auditor</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b-2 border-gray-300 mb-2 h-8"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">General Manager</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
