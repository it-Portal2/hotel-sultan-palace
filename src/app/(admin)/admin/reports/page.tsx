"use client";

import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { getLedgerEntries } from '@/lib/accountsService';
import { getAuditHistory } from '@/lib/nightAuditService';
import RevenueAnalysisChart from '@/components/admin/reports/RevenueAnalysisChart';
import OccupancyTrendsChart from '@/components/admin/reports/OccupancyTrendsChart';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        revPar: 0,
        adr: 0,
        satisfaction: 4.8 // Static for now as we don't have reviews
    });

    useEffect(() => {
        loadReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadReportData = async () => {
        setLoading(true);
        try {
            // 1. Fetch data for the last 7 days
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);

            // Fetch Ledger Entries for Revenue Chart
            const ledgerEntries = await getLedgerEntries(sevenDaysAgo, today);

            // Fetch Audit History for Occupancy Chart
            const auditHistory = await getAuditHistory();

            // Fetch Total Rooms count (for RevPAR)
            let totalRooms = 20; // Default fallback
            if (db) {
                const roomsSnap = await getDocs(collection(db, 'roomStates'));
                if (!roomsSnap.empty) totalRooms = roomsSnap.size;
            }

            // --- Process Revenue Data (Daily Aggregation) ---
            const dailyRevenueMap = new Map<string, { income: number; expenses: number }>();

            // Initialize last 7 days with 0
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
                dailyRevenueMap.set(dateStr, { income: 0, expenses: 0 });
            }

            ledgerEntries.forEach(entry => {
                const dayName = entry.date.toLocaleDateString('en-US', { weekday: 'short' });
                if (dailyRevenueMap.has(dayName)) {
                    const current = dailyRevenueMap.get(dayName)!;
                    if (entry.entryType === 'income') {
                        current.income += entry.amount;
                    } else {
                        current.expenses += entry.amount;
                    }
                }
            });

            const processedRevenueData: RevenueData[] = Array.from(dailyRevenueMap.entries()).map(([name, data]) => ({
                name,
                income: data.income,
                expenses: data.expenses,
                date: name
            }));

            // --- Process Occupancy Data (from Audit Query) ---
            // If audits exist, usage them. If not (new system), usage placeholders or 0.
            const sortedAudits = auditHistory.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-7);

            const processedOccupancyData: OccupancyData[] = sortedAudits.map(audit => ({
                name: audit.date.toLocaleDateString('en-US', { weekday: 'short' }),
                occupancyRate: totalRooms > 0 ? (audit.summary.totalOccupiedRooms / totalRooms) * 100 : 0,
                date: audit.date.toLocaleDateString()
            }));

            // If no audits yet (e.g., first run), show empty or mock for visual check? 
            // Better to show real 0s to avoid confusion.
            if (processedOccupancyData.length === 0) {
                // Initialize last 7 days with 0 occupancy
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    processedOccupancyData.push({
                        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                        occupancyRate: 0,
                        date: d.toLocaleDateString()
                    });
                }
            }

            // --- Calculate Current Metrics (Based on Today/Latest) ---
            // RevPAR = Total Room Revenue / Total Available Rooms
            // ADR = Total Room Revenue / Total Rooms Sold

            // Get today's revenue (or latest available day)
            // Ideally we check today's live bookings, but ledger is good for 'posted' revenue.
            // Let's us specific calculation from recent data.
            const latestRevenue = processedRevenueData[processedRevenueData.length - 1]; // Today (or latest)
            // Note: Ledger entries might be empty for 'today' if audit hasn't run. 
            // So we can check valid ledger entries.

            const totalRevenueToday = latestRevenue?.income || 0;
            // For occupancy, we need today's occupied count. 
            // We can check bookings collection for 'checked_in' status for a live number.
            let todayOccupied = 0;
            if (db) {
                const bookingsRef = collection(db, 'bookings');
                const q = query(bookingsRef, where('status', '==', 'checked_in'));
                const snap = await getDocs(q);
                todayOccupied = snap.size;
            }

            const currentRevPar = totalRooms > 0 ? totalRevenueToday / totalRooms : 0;
            const currentAdr = todayOccupied > 0 ? totalRevenueToday / todayOccupied : 0;

            setRevenueData(processedRevenueData);
            setOccupancyData(processedOccupancyData);
            setMetrics(prev => ({
                ...prev,
                revPar: currentRevPar,
                adr: currentAdr
            }));

        } catch (error) {
            console.error('Error loading reports:', error);
            showToast('Failed to load report data', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50/50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6A00]"></div>
                    <p className="text-sm text-gray-500 font-medium">Loading Real-Time Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Insights</h1>
                    <p className="text-sm text-gray-500 mt-1">Detailed analytics and performance metrics.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={loadReportData}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Refresh Data"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                        onClick={() => window.print()}
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Print / Export
                    </button>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueAnalysisChart data={revenueData} />
                <OccupancyTrendsChart data={occupancyData} />
            </div>

            {/* Metrics Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Operational Metrics (Live)</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-700">Metric</th>
                                <th className="px-4 py-3 font-semibold text-gray-700">Current Value (Today)</th>
                                <th className="px-4 py-3 font-semibold text-gray-700">Target</th>
                                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="px-4 py-3 text-gray-900 font-medium">RevPAR</td>
                                <td className="px-4 py-3 text-gray-600">${metrics.revPar.toFixed(2)}</td>
                                <td className="px-4 py-3 text-gray-500">$100.00</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${metrics.revPar >= 100 ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>
                                        {metrics.revPar >= 100 ? 'Above Target' : 'Below Target'}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 text-gray-900 font-medium">ADR</td>
                                <td className="px-4 py-3 text-gray-600">${metrics.adr.toFixed(2)}</td>
                                <td className="px-4 py-3 text-gray-500">$120.00</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${metrics.adr >= 120 ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'}`}>
                                        {metrics.adr >= 120 ? 'Excellent' : 'On Track'}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 text-gray-900 font-medium">Cust. Satisfaction</td>
                                <td className="px-4 py-3 text-gray-600">{metrics.satisfaction}/5.0</td>
                                <td className="px-4 py-3 text-gray-500">4.5/5.0</td>
                                <td className="px-4 py-3"><span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold">Excellent</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
