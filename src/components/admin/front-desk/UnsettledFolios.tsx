import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    MagnifyingGlassIcon,
    InboxIcon,
    ArrowPathIcon,
    EyeIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import { getAllBookings, Booking } from '@/lib/firestoreService';

export default function UnsettledFolios() {
    const router = useRouter();
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
            const unsettled = allBookings.filter(b => {
                const balance = (b.totalAmount || 0) - (b.paidAmount || 0);
                return balance > 0.01 || balance < -0.01; // Not zero
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
        <div className="flex flex-col h-full">
            {/* Header / Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search by Guest Name or Folio #..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border-gray-300 rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00] w-full shadow-sm"
                    />
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                </div>
                <button
                    onClick={loadData}
                    className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-500 shadow-sm transition-colors"
                    title="Refresh List"
                >
                    <ArrowPathIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Folio #</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Guest Name</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Room</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Arrival</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Departure</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Balance</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-[#FF6A00] rounded-full"></div>
                                            <span>Loading unsettled folios...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>
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
                                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">#{b.bookingId}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{b.guestDetails?.firstName} {b.guestDetails?.lastName}</div>
                                                <div className="text-xs text-gray-500">{b.guestDetails?.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {/* Logic to show room numbers */}
                                                {b.rooms && b.rooms.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {b.rooms.map((r, i) => (
                                                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                {r.allocatedRoomType || r.type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{new Date(b.checkIn).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{new Date(b.checkOut).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                    ${b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        b.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                                            b.status === 'checked_out' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {b.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-red-600 tabular-nums">
                                                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => router.push(`/admin/bookings?query=${b.bookingId}`)}
                                                        className="p-1.5 text-gray-400 hover:text-[#FF6A00] hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <EyeIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => router.push('/admin/checkout')}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all transform active:scale-95"
                                                        title="Go to Checkout"
                                                    >
                                                        <CreditCardIcon className="h-3.5 w-3.5" />
                                                        Pay
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
        </div>
    );
}
