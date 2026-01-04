"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PrinterIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Booking } from '@/lib/firestoreService';

interface FolioDetailsDrawerProps {
    booking: Booking | null;
    open: boolean;
    onClose: () => void;
}

export default function FolioDetailsDrawer({ booking, open, onClose }: FolioDetailsDrawerProps) {
    if (!booking) return null;

    const totalAmount = booking.totalAmount || 0;
    const paidAmount = booking.paidAmount || 0;
    const balance = totalAmount - paidAmount;

    // Simulate folio items if not present
    // In real app, booking.subCollections.transactions would be fetched
    // We will show a breakdown based on what we have
    const roomTotal = booking.rooms?.reduce((acc, r) => acc + (r.price || 0), 0) || 0;
    // Assuming 5 nights stay (mock) or calculate
    const nights = 1; // Simplify for now

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-out duration-500 sm:duration-500"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in duration-500 sm:duration-500"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                                    <div className="flex h-full flex-col bg-white shadow-2xl">
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white shadow-sm z-10">
                                            <div>
                                                <Dialog.Title className="text-lg font-bold">Folio Details</Dialog.Title>
                                                <p className="text-xs text-gray-400 font-mono">#{booking.bookingId}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button className="p-2 hover:bg-gray-800 rounded-full transition-colors" title="Print Folio">
                                                    <PrinterIcon className="h-5 w-5 text-gray-300" />
                                                </button>
                                                <button className="p-2 hover:bg-gray-800 rounded-full transition-colors" title="Email Folio">
                                                    <EnvelopeIcon className="h-5 w-5 text-gray-300" />
                                                </button>
                                                <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full transition-colors">
                                                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                                            {/* Guest Info Card */}
                                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 border-b pb-2">Guest Information</h3>
                                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                                    <div>
                                                        <span className="block text-gray-500 text-xs">Guest Name</span>
                                                        <span className="font-semibold text-gray-900">{booking.guestDetails?.firstName} {booking.guestDetails?.lastName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500 text-xs">Phone</span>
                                                        <span className="font-semibold text-gray-900">{booking.guestDetails?.phone}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500 text-xs">Email</span>
                                                        <span className="font-semibold text-gray-900">{booking.guestDetails?.email}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500 text-xs">Nationality</span>
                                                        <span className="font-semibold text-gray-900">{(booking.guestDetails as any)?.nationality || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Charges Table */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Charges & Payments</h3>
                                                </div>
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-gray-500 bg-gray-50 uppercase font-medium">
                                                        <tr>
                                                            <th className="px-6 py-3">Date</th>
                                                            <th className="px-6 py-3">Description</th>
                                                            <th className="px-6 py-3 text-right">Debit (₹)</th>
                                                            <th className="px-6 py-3 text-right">Credit (₹)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {/* Room Charge Simulation */}
                                                        <tr>
                                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(booking.checkIn).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 font-medium text-gray-900">Room Charge ({booking.rooms?.[0]?.allocatedRoomType})</td>
                                                            <td className="px-6 py-4 text-right text-gray-900 font-mono">{(booking.totalAmount || 0).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                        </tr>
                                                        {/* Payment Simulation */}
                                                        {(booking.paidAmount || 0) > 0 && (
                                                            <tr className="bg-emerald-50/30">
                                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(booking.checkIn).toLocaleDateString()}</td>
                                                                <td className="px-6 py-4 font-medium text-emerald-700">Payment Received</td>
                                                                <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                                <td className="px-6 py-4 text-right text-emerald-700 font-bold font-mono">{(booking.paidAmount || 0).toLocaleString()}</td>
                                                            </tr>
                                                        )}
                                                        {/* Balance Row */}
                                                        <tr className="bg-gray-50 font-bold">
                                                            <td colSpan={2} className="px-6 py-4 text-right text-gray-900 uppercase tracking-wide text-xs">Total Balance Due</td>
                                                            <td className="px-6 py-4 text-right text-red-600 font-mono text-base border-t-2 border-gray-200" colSpan={2}>
                                                                ₹{balance.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
