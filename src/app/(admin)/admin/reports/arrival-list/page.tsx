"use client";

import React, { useState, useEffect } from 'react';
import ReportFilters, { ReportFilterState } from '@/components/admin/reports/ReportFilters';
import { getAllBookings, Booking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { PrinterIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAdminRole } from '@/context/AdminRoleContext';

export default function ArrivalListPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { adminUser } = useAdminRole();

    // Initial load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAllBookings();
            setBookings(data);
            // Don't auto-filter immediately, wait for user or initial filter effect
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filters: ReportFilterState) => {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);

        let result = bookings.filter(b => {
            // 1. Strict Filter by Arrival Date
            const arrival = new Date(b.checkIn);
            // We want to see people ARRIVING on this day
            // Check overlap for general occupancy? No, Arrival List is specifically for Check-Ins.
            // So arrival date must be within range.
            arrival.setHours(0, 0, 0, 0);

            if (arrival < start || arrival > end) return false;

            // 2. Filter by Cancelled status (Arrival list excludes cancelled usually)
            if (b.status === 'cancelled') return false;

            return true;
        });

        // Sort by Room Number (if allocated) or Guest Name
        result.sort((a, b) => {
            const roomA = a.rooms[0]?.allocatedRoomType || '';
            const roomB = b.rooms[0]?.allocatedRoomType || '';
            if (roomA && roomB) return roomA.localeCompare(roomB);
            return a.guestDetails.lastName.localeCompare(b.guestDetails.lastName);
        });

        setFilteredBookings(result);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans print:bg-white print:p-0">
            {/* === PRINT ONLY HEADER === */}
            <div className="hidden print:block mb-8">
                <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-gray-900 text-white flex items-center justify-center rounded-lg">
                            <span className="text-2xl font-bold">SP</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Sultan Palace</h1>
                            <p className="text-sm text-gray-600 font-medium tracking-widest uppercase">Luxury Hotel & Resort</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-900">Expected Arrivals</h2>
                        <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Screen Header */}
            <div className="space-y-6 print:space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Arrival List</h1>
                        <p className="text-sm text-gray-500">Expected check-ins and room allocations.</p>
                    </div>
                </div>

                <div className="print:hidden">
                    <ReportFilters
                        title="Filter Arrivals"
                        reportType="arrival"
                        onFilterChange={handleFilterChange}
                    />
                </div>


                <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden print:shadow-none print:border-gray-200 print:rounded-none">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center print:bg-white print:border-gray-300">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse print:hidden"></div>
                            <h3 className="font-bold text-gray-800">Check-In Schedule</h3>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 print:border-0">
                            {filteredBookings.length} Guests Expected
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-gray-50 print:bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Guest / Company</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Source / Agent</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Room / Plan</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Pax</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">ETA</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Departure</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black text-right">Balance</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black text-center print:w-24">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">
                                            No arrivals found for the selected date range.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((b) => {
                                        const bookedType = b.rooms[0]?.suiteType || b.rooms[0]?.type || 'Standard';
                                        const allocated = b.rooms[0]?.allocatedRoomType;
                                        const ratePlan = b.rooms[0]?.ratePlan || 'BAR'; // Best Available Rate
                                        const paid = b.paidAmount || 0;
                                        const balance = b.totalAmount - paid;
                                        const source = b.source ? b.source.replace('_', ' ').toUpperCase() : 'DIRECT';
                                        const agent = b.travelAgentId || 'None';

                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50/80 transition-colors group print:hover:bg-transparent">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors print:text-black">
                                                            {b.guestDetails.lastName}, {b.guestDetails.firstName}
                                                        </span>
                                                        {b.companyId && (
                                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-0.5 print:text-black print:bg-transparent print:border print:border-gray-300">
                                                                {b.companyId} {/* TODO: Lookup Company Name */}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400 font-mono mt-0.5 print:text-gray-600">
                                                            #{b.bookingId || b.id.substring(0, 6).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-700 print:text-black">{source}</span>
                                                        {agent !== 'None' && (
                                                            <span className="text-[10px] text-blue-600 print:text-black">{agent}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        {allocated ? (
                                                            <span className="text-sm font-bold text-emerald-600 print:text-black">{allocated}</span>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic print:text-gray-500">Unassigned</span>
                                                        )}
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-wide print:text-gray-600">{bookedType}</span>
                                                        <span className="text-[10px] font-mono text-gray-500 print:text-gray-600">({ratePlan})</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700 print:bg-transparent print:border print:border-gray-300 print:text-black">
                                                        {b.guests.adults}A / {b.guests.children}C
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-gray-500 print:text-black">
                                                        <ClockIcon className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-medium">14:00</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 print:text-black">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400 print:hidden" />
                                                        {new Date(b.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-sm font-bold font-mono ${balance > 0 ? 'text-red-600' : 'text-emerald-600'} print:text-black`}>
                                                            {formatCurrency(balance)}
                                                        </span>
                                                        {balance > 0 && (
                                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide print:text-gray-600">Due</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset
                                                     ${b.status === 'confirmed' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                            b.status === 'checked_in' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                                'bg-gray-50 text-gray-600 ring-gray-500/10'} print:ring-1 print:ring-black print:bg-white print:text-black`}>
                                                        {b.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* === PRINT ONLY FOOTER === */}
            <div className="hidden print:flex mt-auto pt-8 border-t border-gray-300 justify-between items-end break-inside-avoid">
                <div className="text-xs text-gray-500">
                    <p>Verified By:</p>
                    <div className="h-8 border-b border-gray-300 w-48 mb-1"></div>
                    <p className="italic">Front Desk Officer</p>
                </div>
                <div className="text-xs text-gray-400 text-right">
                    <p>Confidential • Internal Use Only</p>
                </div>
            </div>
        </div>
    );
}
