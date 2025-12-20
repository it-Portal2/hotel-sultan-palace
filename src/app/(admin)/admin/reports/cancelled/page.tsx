"use client";

import React, { useState, useEffect } from 'react';
import ReportFilters, { ReportFilterState } from '@/components/admin/reports/ReportFilters';
import { getAllBookings, Booking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

export default function CancelledReportPage() {
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
            // 1. Must be cancelled
            if (b.status !== 'cancelled') return false;

            // 2. Filter by Updated At (assuming that's when it was cancelled)
            const cancelledDate = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
            if (cancelledDate < start || cancelledDate > end) return false;

            return true;
        });

        setFilteredBookings(result);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-light text-gray-900">Cancelled Reservations</h1>

            <ReportFilters
                title="Cancelled Reservation"
                reportType="cancellation"
                onFilterChange={handleFilterChange}
            />

            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Cancellation Report</h3>
                    <span className="text-xs text-gray-500">{filteredBookings.length} records found</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-red-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-red-900 uppercase">Res. No</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-red-900 uppercase">Guest Name</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-red-900 uppercase">Arrival</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-red-900 uppercase">Cancelled Date</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-red-900 uppercase">Total Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-red-900 uppercase">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No cancelled reservations found for this period.
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-xs font-mono text-gray-900">{b.bookingId || b.id.substring(0, 8)}</td>
                                        <td className="px-4 py-3 text-xs text-gray-900 font-bold">
                                            {b.guestDetails.firstName} {b.guestDetails.lastName}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {new Date(b.checkIn).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {new Date(b.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-gray-900">
                                            ${b.totalAmount}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-red-600 italic">
                                            Cancelled by Admin
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
