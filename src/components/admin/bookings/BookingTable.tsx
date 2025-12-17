import React from 'react';
import { Booking } from '@/lib/firestoreService';
import { CalendarDaysIcon, UserIcon } from '@heroicons/react/24/outline';

interface BookingTableProps {
    bookings: Booking[];
    loading: boolean;
    onSelect: (booking: Booking) => void;
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

export default function BookingTable({
    bookings,
    loading,
    onSelect,
    page,
    pageSize,
    total,
    onPageChange
}: BookingTableProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const statusColors = {
        confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        pending: 'bg-amber-100 text-amber-800 border-amber-200',
        cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
        checked_in: 'bg-blue-100 text-blue-800 border-blue-200',
        checked_out: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    if (loading) {
        return (
            <div className="bg-white shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-spin h-10 w-10 border-b-2 border-[#FF6A00] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading bookings...</p>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="bg-white shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 flex items-center justify-center mb-4">
                    <CalendarDaysIcon className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rooms & Guests</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {bookings.map((b) => {
                            const guests = b.guests || { adults: 0, children: 0, rooms: 1 };
                            const createdDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);

                            return (
                                <tr
                                    key={b.id}
                                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                    onClick={() => onSelect(b)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="mr-3 p-2 bg-gray-50 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
                                                <CalendarDaysIcon className="h-5 w-5 text-gray-400 group-hover:text-[#FF6A00] transition-colors" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 font-mono">#{b.bookingId || b.id.slice(0, 8)}</div>
                                                <div className="text-xs text-gray-500">{createdDate.toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="mr-3">
                                                {/* Avatar placeholder */}
                                                <div className="h-8 w-8 bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {b.guestDetails?.firstName?.[0] || 'G'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{b.guestDetails?.firstName} {b.guestDetails?.lastName}</div>
                                                <div className="text-xs text-gray-500">{b.guestDetails?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">{new Date(b.checkIn).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500 flex items-center">
                                            <span className="mx-1">to</span> {new Date(b.checkOut).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-700">
                                            {guests.rooms} Room{guests.rooms > 1 ? 's' : ''}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {guests.adults} Adults, {guests.children} Kids
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="text-sm font-bold text-gray-900">${b.totalAmount?.toLocaleString() || 0}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium border ${statusColors[b.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                            {b.status === 'checked_in' ? 'Checked In' :
                                                b.status === 'checked_out' ? 'Checked Out' :
                                                    b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelect(b);
                                            }}
                                            className="text-gray-400 hover:text-[#FF6A00] font-medium transition-colors p-2 hover:bg-[#FF6A00]/10"
                                        >
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-900">{(page - 1) * pageSize + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * pageSize, total)}</span> of <span className="font-semibold text-gray-900">{total}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        className={`px-3 py-1.5 text-sm font-medium transition-all ${page <= 1
                            ? 'text-gray-300 bg-transparent cursor-not-allowed'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'
                            }`}
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            // Logic to show reasonable page numbers could be complex, keeping simple for now
                            // Just showing 1..5 or based on current page
                            let p = i + 1;
                            if (totalPages > 5 && page > 3) p = page - 2 + i;
                            if (p > totalPages) return null;

                            return (
                                <button
                                    key={p}
                                    onClick={() => onPageChange(p)}
                                    className={`w-8 h-8 flex items-center justify-center text-sm font-medium transition-all ${p === page
                                        ? 'bg-[#FF6A00] text-white shadow-md shadow-[#FF6A00]/20'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {p}
                                </button>
                            )
                        })}
                    </div>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                        className={`px-3 py-1.5 text-sm font-medium transition-all ${page >= totalPages
                            ? 'text-gray-300 bg-transparent cursor-not-allowed'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
