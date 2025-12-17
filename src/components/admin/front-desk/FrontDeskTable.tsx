import React from 'react';
import { Booking } from '@/lib/firestoreService';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';

interface FrontDeskTableProps {
    bookings: Booking[];
    isReadOnly: boolean;
    onCheckIn: (booking: Booking) => void;
    onCheckOut: (booking: Booking) => void;
}

export default function FrontDeskTable({ bookings, isReadOnly, onCheckIn, onCheckOut }: FrontDeskTableProps) {
    if (bookings.length === 0) {
        return (
            <div className="text-center py-16 bg-white border border-gray-100 shadow-sm">
                <p className="text-gray-500">No active bookings found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Room Allocation</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stay Dates</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-mono font-bold text-gray-900">{booking.bookingId || booking.id.slice(0, 8)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">
                                        {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">{booking.guestDetails.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {booking.rooms[0]?.allocatedRoomType ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            Room {booking.rooms[0].allocatedRoomType}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                            Unassigned
                                        </span>
                                    )}
                                    {booking.rooms[0]?.suiteType && (
                                        <div className="text-xs text-gray-400 mt-1">{booking.rooms[0].suiteType}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        In: <span className="font-semibold">{new Date(booking.checkIn).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Out: {new Date(booking.checkOut).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${booking.status === 'checked_in'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                                        }`}>
                                        {booking.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {!isReadOnly && (
                                        <div className="flex justify-end gap-2">
                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={() => onCheckIn(booking)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all shadow-sm shadow-blue-200"
                                                >
                                                    <UserPlusIcon className="h-4 w-4" />
                                                    Check In
                                                </button>
                                            )}
                                            {booking.status === 'checked_in' && (
                                                <button
                                                    onClick={() => onCheckOut(booking)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 text-xs font-bold transition-all shadow-sm shadow-gray-200"
                                                >
                                                    <UserMinusIcon className="h-4 w-4" />
                                                    Check Out
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
