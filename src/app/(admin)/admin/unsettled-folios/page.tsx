"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    MagnifyingGlassIcon,
    InboxIcon,
    ArrowPathIcon,
    EyeIcon,
    CreditCardIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { getAllBookings, Booking } from '@/lib/firestoreService';
import FolioDetailsDrawer from '@/components/admin/front-desk/FolioDetailsDrawer';
import SettlementModal from '@/components/admin/front-desk/SettlementModal';

export default function UnsettledFoliosPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('query') || '');
    const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
    const [selectedBookingForSettlement, setSelectedBookingForSettlement] = useState<Booking | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const allBookings = await getAllBookings();
            // Filter logic: In real app, "Unsettled" means balance != 0
            const unsettled = allBookings.filter(b => {
                const balance = (b.totalAmount || 0) - (b.paidAmount || 0);
                return Math.abs(balance) > 0.01; // Not zero
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
        <div className="space-y-6 pb-20 p-4 md:p-6 w-full animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
                        Unsettled Folios
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track and collect outstanding balances from guest bookings.</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-all"
                >
                    <ArrowPathIcon className="h-5 w-5" />
                    Refresh List
                </button>
            </div>

            {/* Search - Sharp & Minimal */}
            <div className="max-w-md w-full relative">
                <input
                    type="text"
                    placeholder="Search by Guest Name or Folio #..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-transparent border-b-2 border-gray-300 focus:border-[#FF6A00] outline-none text-gray-900 placeholder:text-gray-400 font-medium transition-colors rounded-none focus:ring-0"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-2 top-3.5" />
            </div>

            {/* Content */}
            {/* Content */}
            <div className="bg-white border border-t border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Guest & Folio</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Room Allocation</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stay Duration</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-8 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Outstanding Balance</th>
                                <th className="px-8 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-[#FF6A00] rounded-full"></div>
                                            <span>Loading unsettled folios...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                                            <InboxIcon className="h-12 w-12 mb-2 stroke-1 text-gray-300" />
                                            <span className="text-gray-500 font-medium">No Unsettled Folios Found</span>
                                            <span className="text-xs text-gray-400 mt-1">All accounts are settled.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map(b => {
                                    const balance = (b.totalAmount || 0) - (b.paidAmount || 0);
                                    return (
                                        <tr key={b.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-sm">{b.guestDetails?.firstName} {b.guestDetails?.lastName}</span>
                                                    <span className="text-xs text-gray-500 font-mono mt-1">#{b.bookingId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {b.rooms && b.rooms.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {b.rooms.map((r, i) => (
                                                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                                {r.allocatedRoomType || r.type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-xs text-gray-600 font-medium flex flex-col gap-0.5">
                                                    <span>In: {new Date(b.checkIn).toLocaleDateString()}</span>
                                                    <span>Out: {new Date(b.checkOut).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                    ${b.status === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                        b.status === 'checked_in' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                            b.status === 'checked_out' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                                                    {b.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="font-bold text-red-600 tabular-nums text-sm">
                                                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setSelectedBookingForDetails(b)}
                                                        className="text-gray-500 hover:text-[#FF6A00] font-semibold text-xs border border-gray-200 hover:border-[#FF6A00] px-3 py-1.5 rounded-lg transition-all bg-white"
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedBookingForSettlement(b)}
                                                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
                                                    >
                                                        <CreditCardIcon className="h-3.5 w-3.5" />
                                                        Settle
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <FolioDetailsDrawer
                booking={selectedBookingForDetails}
                open={!!selectedBookingForDetails}
                onClose={() => setSelectedBookingForDetails(null)}
            />

            <SettlementModal
                booking={selectedBookingForSettlement}
                open={!!selectedBookingForSettlement}
                onClose={() => setSelectedBookingForSettlement(null)}
                onPaymentSuccess={loadData}
            />
        </div>
    );
}
