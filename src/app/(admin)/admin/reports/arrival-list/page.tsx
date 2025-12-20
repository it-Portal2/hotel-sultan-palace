"use client";

import React, { useState, useEffect } from 'react';
import ReportFilters, { ReportFilterState } from '@/components/admin/reports/ReportFilters';
import { getAllBookings, Booking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

export default function ArrivalListPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    // Initial load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAllBookings();
            setBookings(data);
            // Initial filter will happen when user clicks Report, or we can default to today
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
            // 1. Filter by Arrival Date
            const arrival = new Date(b.checkIn);
            if (arrival < start || arrival > end) return false;

            // 2. Filter by Cancelled status (Arrival list excludes cancelled usually, unless specified)
            if (b.status === 'cancelled') return false;

            // 3. Dropdown Filters (Note: In real app, booking needs these fields. We match best effort)
            // Assuming booking has these fields or we use notes/tags. 
            // For now, if no field exists, we might ignore or match exact if field added to booking.
            // Since we just added the Master Data but didn't update Booking schema to link them yet, 
            // this is a placeholder for future linking. For now we only filter by what we have.

            // Example: if (filters.travelAgentId && b.travelAgentId !== filters.travelAgentId) return false;

            return true;
        });

        setFilteredBookings(result);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-light text-gray-900">Arrival List</h1>

            <ReportFilters
                title="Arrival List"
                reportType="arrival"
                onFilterChange={handleFilterChange}
            />

            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Report Data</h3>
                    <span className="text-xs text-gray-500">{filteredBookings.length} records found</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase">Res. No</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase">Guest</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase">Room</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase">Rate</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase">Arrival</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase">Departure</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No arrivals found for selected criteria.
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
                                            {b.rooms[0]?.allocatedRoomType || 'Unassigned'}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-green-700">
                                            ${b.totalAmount}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {new Date(b.checkIn).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {new Date(b.checkOut).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                                ${b.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                    b.status === 'checked_in' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                                {b.status}
                                            </span>
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
