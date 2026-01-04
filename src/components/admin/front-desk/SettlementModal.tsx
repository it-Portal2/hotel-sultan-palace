"use client";

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, BanknotesIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { Booking, updateBooking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

interface SettlementModalProps {
    booking: Booking | null;
    open: boolean;
    onClose: () => void;
    onPaymentSuccess?: () => void;
}

export default function SettlementModal({ booking, open, onClose, onPaymentSuccess }: SettlementModalProps) {
    const { showToast } = useToast();
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    React.useEffect(() => {
        if (open && booking) {
            const bal = (booking.totalAmount || 0) - (booking.paidAmount || 0);
            setAmount(bal > 0 ? bal.toString() : '');
        }
    }, [open, booking]);

    if (!booking) return null;

    const balance = (booking.totalAmount || 0) - (booking.paidAmount || 0);

    const handleSettle = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const paymentAmount = parseFloat(amount);
            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                showToast("Please enter a valid amount", "error");
                setProcessing(false);
                return;
            }

            const newPaidAmount = (booking.paidAmount || 0) + paymentAmount;
            const newBalance = (booking.totalAmount || 0) - newPaidAmount;

            // Determine new payment status
            let newStatus: 'pending' | 'partial' | 'paid' = 'partial';
            if (newBalance <= 1) newStatus = 'paid';
            else if (newPaidAmount === 0) newStatus = 'pending';

            await updateBooking(booking.id, {
                paidAmount: newPaidAmount,
                paymentStatus: newStatus,
                paymentDate: new Date(),
                paymentMethod: method
            });

            showToast(`Payment of ₹${amount} recorded successfully.`, 'success');
            onPaymentSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Payment failed. Please try again.', 'error');
        } finally {
            setProcessing(false);
        }
    };


    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                {/* Header */}
                                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 leading-6 flex items-center gap-2">
                                        <BanknotesIcon className="h-6 w-6 text-green-600" />
                                        Settle Account
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400">
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSettle} className="p-6 space-y-6">
                                    {/* Balance Card */}
                                    <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                                        <p className="text-sm text-red-600 font-medium uppercase tracking-wide">Outstanding Balance</p>
                                        <p className="text-3xl font-extrabold text-red-700 mt-1">₹{balance.toLocaleString()}</p>
                                    </div>

                                    {/* Payment Input */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Payment Amount (₹)</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max={balance} // Can't overpay in this modal logic usually
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                className="block w-full rounded-lg border-gray-300 py-3 text-lg font-bold text-gray-900 focus:ring-green-500 focus:border-green-500 transition-shadow"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setMethod('cash')}
                                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border font-medium text-sm transition-all ${method === 'cash' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                                >
                                                    <BanknotesIcon className="h-5 w-5" /> Cash
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMethod('card')}
                                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border font-medium text-sm transition-all ${method === 'card' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                                >
                                                    <CreditCardIcon className="h-5 w-5" /> Card / UPI
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Remarks</label>
                                            <textarea
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                                                rows={2}
                                                placeholder="Transaction reference, receipt no..."
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full rounded-xl border border-transparent bg-gray-900 py-3.5 px-4 text-sm font-bold text-white shadow-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-all uppercase tracking-wide"
                                    >
                                        {processing ? 'Processing Payment...' : 'Confirm Payment'}
                                    </button>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
