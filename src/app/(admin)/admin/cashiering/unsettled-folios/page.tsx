"use client";

import React, { useState, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    InboxIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getAllBookings, Booking } from '@/lib/firestoreService';

export default function UnsettledFoliosPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const allBookings = await getAllBookings();
            // Filter logic: In real app, "Unsettled" means balance != 0
            // Since we might not have a dedicated balance field on all bookings, we simulate or use total - paid if available.
            // For now, let's assume all "Checked In" or "Confirmed" with outstanding balance are unsettled.
            const unsettled = allBookings.filter(b => {
                // Mock balance calculation if not present
                const balance = (b.totalAmount || 0) - (b.paidAmount || 0); // specific fields dependent on Booking type
                return balance !== 0;
            });
            setBookings(unsettled);
        } catch (error) {
            console.error("Failed to load bookings", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBookings = bookings.filter(b =>
        (b.guestDetails?.firstName + ' ' + b.guestDetails?.lastName).toLowerCase().includes(search.toLowerCase()) ||
        b.bookingId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-lg font-semibold text-gray-800">Unsettled Folios</h1>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-1.5 text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                        />
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Folio#</th>
                                <th className="px-4 py-3">Reservation#</th>
                                <th className="px-4 py-3">Guest Name</th>
                                <th className="px-4 py-3">Arrival</th>
                                <th className="px-4 py-3">Departure</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                                            <InboxIcon className="h-12 w-12 mb-2 stroke-1" />
                                            <span>No Unsettled Folios</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map(b => {
                                    const balance = (b.totalAmount || 0) - (b.paidAmount || 0);
                                    return (
                                        <tr key={b.id} className="hover:bg-blue-50/50">
                                            <td className="px-4 py-3 text-gray-900 font-medium">#{b.id.substr(0, 6).toUpperCase()}</td>
                                            <td className="px-4 py-3 text-gray-600">{b.bookingId}</td>
                                            <td className="px-4 py-3 text-blue-600 hover:underline cursor-pointer">
                                                {b.guestDetails?.firstName} {b.guestDetails?.lastName}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{new Date(b.checkIn).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-gray-600">{new Date(b.checkOut).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium 
                                                    ${b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        b.status === 'checked_in' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {b.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">
                                                ${balance.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
