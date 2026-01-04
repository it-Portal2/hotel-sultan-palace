"use client";

import React, { useState, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    UserIcon,
    BuildingOfficeIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';
import { getAllBookings, Booking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

export default function InsertTransactionPage() {
    const { showToast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    // Form state
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('food_beverage');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await getAllBookings();
            setBookings(data.filter(b => b.status === 'checked_in' || b.status === 'stay_over'));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostCharge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBooking || !amount || !description) return;
        setIsSubmitting(true);
        try {
            await import('@/lib/firestoreService').then(mod => mod.addTransaction({
                bookingId: selectedBooking.id,
                amount: parseFloat(amount),
                type: 'charge',
                category: category,
                description: description,
                date: new Date(),
                reference: `MANUAL-${Date.now()}`,
                userId: 'Admin',
                code: 'MANUAL_CHARGE'
            }));

            showToast(`Successfully posted ₹${amount} to Room ${selectedBooking.rooms?.[0]?.allocatedRoomType || 'Unassigned'}`, 'success');
            setAmount('');
            setDescription('');
            setCategory('food_beverage');
            setSelectedBooking(null);
        } catch (error) {
            console.error(error);
            showToast('Failed to post charge', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredBookings = bookings.filter(b =>
        (b.guestDetails?.firstName + ' ' + b.guestDetails?.lastName).toLowerCase().includes(search.toLowerCase()) ||
        (b.bookingId || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-64px)] w-full bg-gray-50/50">
            {/* Left Panel: Guest Search (Sidebar Style) */}
            <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 h-[400px] md:h-full">
                <div className="p-5 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-1">
                        <UserIcon className="h-5 w-5 text-[#FF6A00]" />
                        Select Guest
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">Choose a guest to charge.</p>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search Name or Folio..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#FF6A00] outline-none transition-all placeholder:text-gray-400 font-medium rounded-sm"
                            autoFocus
                        />
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Loading guests...</div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No guests found.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredBookings.map(b => (
                                <div
                                    key={b.id}
                                    onClick={() => setSelectedBooking(b)}
                                    className={`group p-4 cursor-pointer transition-all border-l-4 ${selectedBooking?.id === b.id
                                        ? 'bg-orange-50 border-[#FF6A00]'
                                        : 'border-transparent hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-bold text-sm ${selectedBooking?.id === b.id ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {b.guestDetails?.firstName} {b.guestDetails?.lastName}
                                        </span>
                                        <span className="text-[10px] font-mono bg-white border border-gray-200 px-1.5 py-0.5 text-gray-500">
                                            #{(b.bookingId || '').slice(-4)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <div className="flex items-center gap-1">
                                            <BuildingOfficeIcon className="h-3 w-3" />
                                            <span>Room {b.rooms?.[0]?.allocatedRoomType || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Transaction Voucher Form */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FA] p-8 items-center justify-center">
                {!selectedBooking ? (
                    <div className="text-center text-gray-400 opacity-60">
                        <BanknotesIcon className="h-24 w-24 mx-auto mb-4 stroke-1" />
                        <h3 className="text-xl font-medium">No Account Selected</h3>
                        <p className="text-sm mt-2">Select a guest from the left to create a transaction.</p>
                    </div>
                ) : (
                    <div className="w-full max-w-2xl bg-white shadow-2xl border border-gray-200 flex flex-col animate-scale-in origin-center">
                        {/* Voucher Header */}
                        <div className="bg-[#2C3E50] text-white p-6 flex justify-between items-start print:bg-white print:text-black">
                            <div>
                                <h1 className="text-2xl font-bold tracking-widest uppercase mb-1">Transaction Voucher</h1>
                                <p className="text-xs text-gray-300 uppercase tracking-wide">Incidental Charge Record</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-mono font-bold text-[#FF6A00]">POSTING</div>
                                <div className="text-xs text-gray-400 mt-1 font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                            </div>
                        </div>

                        {/* Guest Details Bar */}
                        <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider">Guest Name</span>
                                    <span className="font-bold text-gray-900 text-lg">{selectedBooking.guestDetails?.firstName} {selectedBooking.guestDetails?.lastName}</span>
                                </div>
                                <div className="h-8 w-px bg-gray-300 mx-2"></div>
                                <div>
                                    <span className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider">Room No.</span>
                                    <span className="font-bold text-gray-900 text-lg">{selectedBooking.rooms?.[0]?.allocatedRoomType || 'Unassigned'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider text-right">Date</span>
                                <span className="font-mono text-gray-700">{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Form Content */}
                        <form onSubmit={handlePostCharge} className="p-8 space-y-8">

                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Category</label>
                                    <div className="relative">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-gray-300 py-2 pr-8 text-gray-900 font-medium focus:border-[#FF6A00] focus:outline-none rounded-none transition-colors appearance-none cursor-pointer hover:border-gray-400"
                                        >
                                            <option value="food_beverage">Food & Beverage</option>
                                            <option value="laundry">Laundry Service</option>
                                            <option value="spa">Spa & Wellness</option>
                                            <option value="transport">Transportation</option>
                                            <option value="misc">Miscellaneous</option>
                                            <option value="room_service">Room Service</option>
                                            <option value="mini_bar">Mini Bar</option>
                                        </select>
                                        <div className="absolute right-0 top-3 pointer-events-none">
                                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-2 text-gray-400 font-light text-lg">₹</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className="w-full pl-6 py-2 bg-transparent border-b-2 border-gray-300 text-gray-900 text-xl font-bold focus:border-[#FF6A00] focus:outline-none rounded-none placeholder:text-gray-300 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Description / Particulars</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter item details..."
                                    className="w-full py-2 bg-transparent border-b-2 border-gray-300 text-gray-900 font-medium focus:border-[#FF6A00] focus:outline-none rounded-none placeholder:text-gray-300 transition-colors"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Verification</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="text-xs text-gray-400 italic">
                                    Includes tax & service charges where applicable.
                                </div>
                            </div>

                        </form>

                        {/* Footer Actions */}
                        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedBooking(null)}
                                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200 transition-colors rounded-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePostCharge}
                                disabled={isSubmitting}
                                className="px-8 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl rounded-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Processing...' : (
                                    <>
                                        Confirm & Post Charge
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
