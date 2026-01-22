"use client";

import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PrinterIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Booking, getFoodOrder, getFolioTransactions, getGuestService, getIncidentalInvoices, FoodOrder, GuestService, IncidentalInvoice } from '@/lib/firestoreService';

interface FolioDetailsDrawerProps {
    booking: Booking | null;
    open: boolean;
    onClose: () => void;
}

export default function FolioDetailsDrawer({ booking, open, onClose }: FolioDetailsDrawerProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
    const [guestServices, setGuestServices] = useState<GuestService[]>([]);
    const [posInvoices, setPosInvoices] = useState<IncidentalInvoice[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && booking) {
            fetchData();
        }
    }, [open, booking]);

    const fetchData = async () => {
        if (!booking) return;
        setLoading(true);
        try {
            // Fetch Transactions
            const trans = await getFolioTransactions(booking.id);
            setTransactions(trans);

            // Fetch Food Orders
            if (booking.foodOrderIds && booking.foodOrderIds.length > 0) {
                const orders = await Promise.all(booking.foodOrderIds.map(id => getFoodOrder(id)));
                // Filter valid, non-cancelled orders
                // Logic: Include unpaid orders too (they might be charged to room).
                // Previously filtered by `paymentStatus !== 'paid'` which hid receptionist orders.
                const validOrders = orders.filter(o =>
                    o !== null &&
                    o.status !== 'cancelled' &&
                    o.status !== 'voided'
                ) as FoodOrder[];
                setFoodOrders(validOrders);
            } else {
                setFoodOrders([]);
            }

            // Fetch Guest Services
            if (booking.guestServiceIds && booking.guestServiceIds.length > 0) {
                const services = await Promise.all(booking.guestServiceIds.map(id => getGuestService(id)));
                // Filter: Exclude cancelled
                const validServices = services.filter(s =>
                    s !== null &&
                    s.status !== 'cancelled'
                ) as GuestService[];
                setGuestServices(validServices);
            } else {
                setGuestServices([]);
            }

            // Fetch POS / Incidental Invoices
            const allInvoices = await getIncidentalInvoices();
            const validPosInvoices = allInvoices.filter(inv =>
                inv.bookingId === booking.id &&
                inv.status !== 'void'
            );
            setPosInvoices(validPosInvoices);

        } catch (error) {
            console.error("Error fetching folio details", error);
        } finally {
            setLoading(false);
        }
    };

    if (!booking) return null;

    // --- CALCULATIONS ---
    // 1. Room Charges
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const roomTotal = booking.rooms?.reduce((acc, r) => acc + (r.price || 0), 0) * nights;

    // 1b. Meal Plan Charges
    const mealPlanTotal = booking.rooms?.reduce((acc, r) => acc + (r.mealPlanPrice || 0), 0) * nights;

    // 2. Food Charges (Unpaid / Charged to Room)
    const foodTotal = foodOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

    // 3. Service Charges
    const serviceTotal = guestServices.reduce((acc, s) => acc + (s.totalAmount || s.amount || 0), 0);

    // 3b. POS Charges
    const posTotal = posInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    // Note: If POS was paid by cash, we need to credit it below.
    const posPayments = posInvoices.reduce((acc, inv) => acc + (inv.totalPaid || 0), 0);

    // 4. Transactions (Charges & Payments)
    // Deduplication: Filter out transactions that are already accounted for in Food Orders or Guest Services
    // Assumption: System generated transactions for services start with 'SVC-' or 'ORD-' or are linked via ID.
    // Ideally we match by ID, but reference pattern is a good backup.
    const serviceTransactionIds = new Set(guestServices.map(s => s.transactionId).filter(Boolean));
    const foodTransactionIds = new Set(foodOrders.map(f => (f as any).transactionId).filter(Boolean)); // If food orders have transaction link

    const uniqueTransactions = transactions.filter(t => {
        if (t.type !== 'charge') return true; // Keep payments

        // 1. Direct Link Check
        if (serviceTransactionIds.has(t.id)) return false;

        // 2. Reference Prefix Check (SVC-XXXXXX)
        if (t.reference?.startsWith('SVC-') && guestServices.some(s => t.reference?.includes(s.id.slice(-6).toUpperCase()))) return false;
        if (t.reference?.startsWith('ORD-') && foodOrders.some(f => f.orderNumber && t.reference?.includes(f.orderNumber))) return false;


        const isServiceDuplicate = guestServices.some(s => {
            const serviceName = (s.serviceType || '').toLowerCase().replace('_', ' ');
            const txDesc = (t.description || '').toLowerCase();
            return txDesc.includes(serviceName) || txDesc.includes('service charge');

        });

        if (isServiceDuplicate && t.category !== 'room_charge') return false;

        return true;
    });

    const otherCharges = uniqueTransactions.filter(t => t.type === 'charge').reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalPayments = uniqueTransactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + (t.amount || 0), 0);

    const unaccountedPaidAmount = Math.max(0, (booking.paidAmount || 0) - totalPayments);
    // Include POS payments in total payments to offset the debit if paid
    const allPayments = totalPayments + unaccountedPaidAmount + posPayments;

    const grossTotal = roomTotal + mealPlanTotal + foodTotal + serviceTotal + posTotal + otherCharges;
    const storedTotal = booking.totalAmount || grossTotal;

    let discountAmount = booking.discount?.amount || 0;
    let isImpliedDiscount = false;



    const grandTotal = grossTotal - discountAmount;
    const balance = grandTotal - allPayments;

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
                                                </div>
                                            </div>

                                            {/* Charges Table */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Charges & Payments</h3>
                                                    {loading && <span className="text-xs text-orange-500 font-medium">Syncing...</span>}
                                                </div>
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-gray-500 bg-gray-50 uppercase font-medium">
                                                        <tr>
                                                            <th className="px-6 py-3">Description</th>
                                                            <th className="px-6 py-3 text-right">Debit (₹)</th>
                                                            <th className="px-6 py-3 text-right">Credit (₹)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {/* Room Charge */}
                                                        <tr>
                                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                                Room Charge ({booking.rooms?.[0]?.allocatedRoomType}) x {nights} Night(s)
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-gray-900 font-mono">{roomTotal.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                        </tr>

                                                        {/* Meal Plan Charges */}
                                                        {mealPlanTotal > 0 && (
                                                            <tr>
                                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                                    Meal Plan Charges ({booking.rooms?.[0]?.mealPlan || 'Meal Plan'}) x {nights} Night(s)
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-gray-900 font-mono">{mealPlanTotal.toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                            </tr>
                                                        )}

                                                        {/* Discount / Adjustment */}
                                                        {discountAmount > 0 && (
                                                            <tr className="bg-green-50/30">
                                                                <td className="px-6 py-4 font-medium text-green-700">
                                                                    {booking.discount?.code ? `Discount Applied (${booking.discount.code})` : 'System Adjustment / Discount'}
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                                <td className="px-6 py-4 text-right text-green-700 font-bold font-mono">{discountAmount.toLocaleString()}</td>
                                                            </tr>
                                                        )}

                                                        {/* Food Orders (Orange tint) */}
                                                        {foodOrders.map(order => (
                                                            <tr key={order.id} className="bg-orange-50/20">
                                                                <td className="px-6 py-4 text-gray-900">
                                                                    <span className="block font-medium">Restaurant Order #{order.orderNumber}</span>
                                                                    <span className="text-xs text-gray-500">{new Date((order as any).createdAt).toLocaleString()}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-gray-900 font-mono">{(order.totalAmount || 0).toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                            </tr>
                                                        ))}

                                                        {/* Guest Services (Blue tint) */}
                                                        {guestServices.map(service => (
                                                            <tr key={service.id} className="bg-blue-50/20">
                                                                <td className="px-6 py-4 text-gray-900">
                                                                    <span className="block font-medium capitalize">Service: {service.serviceType?.replace('_', ' ') || 'Guest Service'}</span>
                                                                    <span className="text-xs text-gray-500">{service.description}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-gray-900 font-mono">{(service.totalAmount || service.amount || 0).toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                            </tr>
                                                        ))}

                                                        {/* POS Invoices (Purple tint) */}
                                                        {posInvoices.map(inv => (
                                                            <React.Fragment key={inv.id}>
                                                                {/* Charge Line */}
                                                                <tr className="bg-purple-50/20">
                                                                    <td className="px-6 py-4 text-gray-900">
                                                                        <span className="block font-medium">POS Invoice: {inv.voucherNo}</span>
                                                                        <span className="text-xs text-gray-500">
                                                                            {new Date(inv.date).toLocaleDateString()}
                                                                            {inv.totalPaid >= inv.totalAmount ? ' (Paid)' : inv.totalPaid > 0 ? ' (Partial)' : ''}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right text-gray-900 font-mono">{inv.totalAmount.toLocaleString()}</td>
                                                                    <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                                </tr>
                                                                {/* Payment Line (if any) */}
                                                                {inv.totalPaid > 0 && (
                                                                    <tr className="bg-purple-50/20">
                                                                        <td className="px-6 py-4 text-gray-500 text-xs italic pl-10">
                                                                            Payment for {inv.voucherNo}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                                        <td className="px-6 py-4 text-right text-purple-700 font-mono">{inv.totalPaid.toLocaleString()}</td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        ))}

                                                        {/* Other Transactions */}
                                                        {uniqueTransactions.map(t => (
                                                            <tr key={t.id} className={t.type === 'payment' ? 'bg-emerald-50/30' : ''}>
                                                                <td className="px-6 py-4 text-gray-900">
                                                                    <span className="block font-medium">{t.description}</span>
                                                                    <span className="text-xs text-gray-500">{new Date(t.date).toLocaleString()}</span>
                                                                </td>
                                                                {t.type === 'payment' ? (
                                                                    <>
                                                                        <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                                        <td className="px-6 py-4 text-right text-emerald-700 font-bold font-mono">{t.amount.toLocaleString()}</td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <td className="px-6 py-4 text-right text-gray-900 font-mono">{t.amount.toLocaleString()}</td>
                                                                        <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        ))}

                                                        {/* Initial Booking Payment (Only if not fully covered by transactions) */}
                                                        {unaccountedPaidAmount > 0 && (
                                                            <tr className="bg-emerald-50/30">
                                                                <td className="px-6 py-4 font-medium text-emerald-800">Advance Deposit / Initial Payment</td>
                                                                <td className="px-6 py-4 text-right text-gray-400 font-mono">-</td>
                                                                <td className="px-6 py-4 text-right text-emerald-700 font-bold font-mono">{unaccountedPaidAmount.toLocaleString()}</td>
                                                            </tr>
                                                        )}

                                                        {/* Summary Rows */}
                                                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-100">
                                                            <td className="px-6 py-4 text-right uppercase text-xs tracking-wide">Total Billed</td>
                                                            <td className="px-6 py-4 text-right text-gray-900">{grandTotal.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right text-gray-400">-</td>
                                                        </tr>
                                                        <tr className="bg-gray-50 font-bold">
                                                            <td className="px-6 py-4 text-right uppercase text-xs tracking-wide">Total Paid</td>
                                                            <td className="px-6 py-4 text-right text-gray-400">-</td>
                                                            <td className="px-6 py-4 text-right text-emerald-700">{allPayments.toLocaleString()}</td>
                                                        </tr>

                                                        {/* Balance Row */}
                                                        <tr className="bg-gray-100 font-bold border-t-2 border-gray-200">
                                                            <td className="px-6 py-4 text-right uppercase text-xs tracking-wide">Net Balance Due</td>
                                                            <td className="px-6 py-4 text-right text-red-600 text-xl" colSpan={2}>
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
