"use client";

import React, { useState, useEffect } from 'react';
import ReportFilters, { ReportFilterState } from '@/components/admin/reports/ReportFilters';
import { getAllBookings, Booking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { UserMinusIcon, CalendarDaysIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function NoShowReportPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getAllBookings();
            setBookings(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        }
    };

    const handleFilterChange = (filters: ReportFilterState) => {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);

        let result = bookings.filter(b => {
            // 1. Must be No Show
            if (b.status !== 'no_show') return false;

            // 2. Filter by CheckIn Date (When they were SUPPOSED to arrive)
            const arrivalDate = new Date(b.checkIn);
            if (arrivalDate < start || arrivalDate > end) return false;

            return true;
        });

        // Sort by Arrival Date (Oldest First potentially, or Newest)
        result.sort((a, b) => {
            const dateA = new Date(a.checkIn);
            const dateB = new Date(b.checkIn);
            return dateB.getTime() - dateA.getTime();
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

    const totalRevenueImpact = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

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
                        <h2 className="text-2xl font-bold text-gray-900">No Show Report</h2>
                        <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 print:space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">No Show Reservations</h1>
                        <p className="text-sm text-gray-500">Tracking guests who failed to arrive.</p>
                    </div>
                </div>

                <div className="print:hidden">
                    <ReportFilters
                        title="Filter No Shows"
                        reportType="no_show"
                        onFilterChange={handleFilterChange}
                    />
                </div>

                {/* KPI Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                    <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                            <CurrencyDollarIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Revenue Impact</p>
                            <h3 className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenueImpact)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
                            <UserMinusIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total No Shows</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {filteredBookings.length} Guests
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden print:shadow-none print:border-gray-200 print:rounded-none">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center print:bg-white print:border-gray-300">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse print:hidden"></div>
                            <h3 className="font-bold text-gray-800">No Show Log</h3>
                        </div>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 print:border-0">
                            {filteredBookings.length} Records
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-orange-50/30 print:bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Guest / Company</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Source / Agent</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Planned Arrival</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Planned Departure</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Billing Status</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black text-right">Total Value</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black text-center">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                                            No no-show reservations found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((b) => {
                                        const isPaid = (b.paidAmount || 0) >= b.totalAmount;
                                        const hasPenalty = b.paymentStatus === 'paid' || b.paymentStatus === 'partial' || (b.paidAmount || 0) > 0;
                                        const source = b.source ? b.source.replace('_', ' ').toUpperCase() : 'DIRECT';
                                        const agent = b.travelAgentId || 'None';

                                        return (
                                            <tr key={b.id} className="hover:bg-orange-50/30 transition-colors group print:hover:bg-transparent">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-orange-700 transition-colors print:text-black">
                                                            {b.guestDetails.lastName}, {b.guestDetails.firstName}
                                                        </span>
                                                        {b.companyId && (
                                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-0.5 print:text-black print:bg-transparent print:border print:border-gray-300">
                                                                {b.companyId}
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
                                                <td className="px-6 py-4 text-xs text-gray-600 print:text-black">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400 print:hidden" />
                                                        {new Date(b.checkIn).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 print:text-black">
                                                    {new Date(b.checkOut).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isPaid ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 border border-green-200 print:border-black print:bg-white print:text-black">
                                                            Fully Paid / Retention
                                                        </span>
                                                    ) : hasPenalty ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 print:border-black print:bg-white print:text-black">
                                                            Partial / Retention
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 border border-red-200 print:border-black print:bg-white print:text-black">
                                                            Not Charged
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold font-mono text-gray-900 print:text-black">
                                                        {formatCurrency(b.totalAmount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs text-gray-500 italic max-w-[150px] inline-block truncate print:text-black print:whitespace-normal">
                                                        {b.notes || 'Guest did not arrive'}
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
                    <p className="italic">Night Auditor</p>
                </div>
                <div className="text-xs text-gray-400 text-right">
                    <p>Confidential • Internal Use Only</p>
                </div>
            </div>
        </div>
    );
}
