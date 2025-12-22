"use client";

import React, { useState, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    CalendarIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';
import {
    getAllBookings,
    Booking,
    addFolioTransaction,
    getTransactionCodes,
    TransactionCode
} from '@/lib/firestoreService';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';

export default function InsertTransactionPage() {
    const { adminUser } = useAdminRole();
    const { showToast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<'charge' | 'payment' | 'allowance'>('charge');
    const [code, setCode] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [reference, setReference] = useState('');
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transactionCodes, setTransactionCodes] = useState<TransactionCode[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [bookingsData, codesData] = await Promise.all([
                    getAllBookings(),
                    getTransactionCodes()
                ]);
                // Filter active bookings usually
                setBookings(bookingsData.filter(b => b.status === 'checked_in' || b.status === 'confirmed'));
                setTransactionCodes(codesData);

                // Set default code if available
                if (codesData.length > 0) {
                    setCode(codesData[0].code);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Filter available codes based on selected type
    const availableCodes = transactionCodes.filter(tc => {
        if (type === 'charge') return tc.type === 'charge';
        if (type === 'payment') return tc.type === 'payment';
        if (type === 'allowance') return tc.type === 'adjustment';
        return false;
    });

    // Update selected code when type changes
    useEffect(() => {
        if (availableCodes.length > 0) {
            setCode(availableCodes[0].code);
        } else {
            setCode('');
        }
    }, [type, transactionCodes]);

    const filteredBookings = bookings.filter(b => {
        const firstName = b.guestDetails?.firstName || '';
        const lastName = b.guestDetails?.lastName || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        const bookingId = (b.bookingId || '').toLowerCase();
        const term = searchTerm.toLowerCase();

        return fullName.includes(term) || bookingId.includes(term);
    });

    const handleSubmit = async () => {
        if (!selectedBooking) {
            showToast("Please select a folio/booking first", "error");
            return;
        }
        if (amount <= 0) {
            showToast("Amount must be greater than 0", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            await addFolioTransaction({
                bookingId: selectedBooking.id,
                date: new Date(date),
                type,
                code,
                description: comments || code,
                amount,
                reference,
                userId: adminUser?.id || 'unknown'
            });
            showToast("Transaction Posted Successfully", "success");
            // Reset form
            setAmount(0);
            setReference('');
            setComments('');
        } catch (error) {
            showToast("Failed to post transaction", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-lg font-bold text-gray-800">Insert Transaction</h1>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">

                    <div className="mb-8 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Folio / Guest</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5"
                                placeholder="Search by name, room or booking ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setSelectedBooking(null)} // Clear selection to search again
                            />
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                        </div>

                        {/* Dropdown Results */}
                        {searchTerm && !selectedBooking && (
                            <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-y-auto overflow-x-hidden sm:text-sm">
                                {loading && <div className="p-2 text-center">Loading...</div>}
                                {!loading && filteredBookings.length === 0 && (
                                    <div className="p-2 text-center text-gray-500">No guests found</div>
                                )}
                                {filteredBookings.map(booking => (
                                    <div
                                        key={booking.id}
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setSearchTerm(`${booking.guestDetails?.firstName || ''} ${booking.guestDetails?.lastName || ''} - ${booking.roomNumber || 'Unallocated'} (#${booking.bookingId})`);
                                        }}
                                        className="cursor-pointer select-none relative py-2 pl-3 pr-4 hover:bg-blue-50 border-b border-gray-50 last:border-0"
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium text-gray-900 break-words pr-2 text-sm">{booking.guestDetails?.firstName || ''} {booking.guestDetails?.lastName || ''}</span>
                                            <span className="text-gray-500 text-xs whitespace-nowrap shrink-0 bg-gray-100 px-1.5 py-0.5 rounded">Room: {booking.roomNumber || 'N/A'}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate mt-0.5">{booking.bookingId} • {booking.status}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Transaction Form (Only show if booking selected) */}
                    {selectedBooking ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                            {/* Date */}
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                                <div className="relative rounded-md shadow-sm">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* Type */}
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    <option value="charge">Charge</option>
                                    <option value="payment">Payment</option>
                                    <option value="allowance">Allowance</option>
                                </select>
                            </div>

                            {/* Transaction Code */}
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Code / Particular</label>
                                <select
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    {availableCodes.length === 0 && <option value="">No codes available</option>}
                                    {availableCodes.map(tc => (
                                        <option key={tc.code} value={tc.code}>
                                            {tc.code} - {tc.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Reference / Supplement */}
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Reference / Supplement</label>
                                <input
                                    type="text"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Receipt No / Supplement..."
                                />
                            </div>

                            {/* Comments */}
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Comments</label>
                                <textarea
                                    rows={3}
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Add notes here..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => { setSelectedBooking(null); setAmount(0); }}
                                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                                >
                                    <BanknotesIcon className="mr-2 h-5 w-5" />
                                    Post Transaction
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Folio Selected</h3>
                            <p className="mt-1 text-sm text-gray-500">Search and select a guest folio to post a transaction.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
