"use client";

import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    CalendarIcon,
    TrashIcon,
    PencilIcon,
    XMarkIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';
import {
    IncidentalInvoice,
    getIncidentalInvoices,
    addIncidentalInvoice,
    updateIncidentalInvoice,
    InvoiceItem,
    PaymentItem,
    getAllBookings,
    getMasterData,
    Booking,
    Company,
    getSystemLocks,
    SystemLock
} from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { useAdminRole } from '@/context/AdminRoleContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { LockClosedIcon } from '@heroicons/react/24/outline';

// --- Invoice Form Component ---
interface InvoiceFormProps {
    onClose: () => void;
    onSave: () => void;
    initialData?: IncidentalInvoice | null;
    currentUser?: string;
}

function InvoiceForm({ onClose, onSave, initialData, currentUser }: InvoiceFormProps) {
    const { showToast } = useToast();

    // Basic Fields
    const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [contactType, setContactType] = useState<'Guest' | 'City Ledger' | 'Walk-in'>('Guest');
    const [guestName, setGuestName] = useState(initialData?.guestName || '');
    const [bookingId, setBookingId] = useState(initialData?.bookingId || '');
    const [companyId, setCompanyId] = useState(initialData?.companyId || '');
    const [showNameError, setShowNameError] = useState(false);
    const [paymentType, setPaymentType] = useState(initialData?.paymentType || 'Cash/Bank');
    const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'Booking.com Virtual Card');
    const [voucherNo] = useState(initialData?.voucherNo || 'New');

    // Smart Search State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        // Clear linked IDs if contact type changes
        if (contactType === 'Walk-in') {
            setBookingId('');
            setCompanyId('');
        }
    }, [contactType]);



    const [activeLock, setActiveLock] = useState<SystemLock | null>(null);

    // Handle Name Input & Search
    const handleNameChange = async (val: string) => {
        setGuestName(val);
        setShowNameError(false);
        setBookingId('');
        setCompanyId('');
        setActiveLock(null); // Clear lock on change

        if (val.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        // ... existing search logic ...
        if (contactType === 'Guest') {
            setIsSearching(true);
            try {
                // Fetch all bookings and filter locally
                const bookings = await getAllBookings();
                // ...
                const matches = bookings.filter(b =>
                    b.status === 'checked_in' &&
                    (
                        (b.guestDetails.firstName + ' ' + b.guestDetails.lastName).toLowerCase().includes(val.toLowerCase()) ||
                        (b.roomNumber || '').toLowerCase().includes(val.toLowerCase())
                    )
                );
                // ...
                setSuggestions(matches.map(b => ({
                    id: b.id,
                    title: `${b.guestDetails.firstName} ${b.guestDetails.lastName}`,
                    subtitle: `Room: ${b.roomNumber || 'N/A'}`,
                    type: 'booking',
                    data: b
                })));
                setShowSuggestions(true);
            } catch (e) {
                console.error("Error searching guests", e);
            } finally {
                setIsSearching(false);
            }
        }
        // ... company search logic ...
        else if (contactType === 'City Ledger') {
            // ... existing logic ...
            setIsSearching(true);
            try {
                const companies = await getMasterData('companies') as Company[];
                const matches = companies.filter(c =>
                    c.isActive &&
                    c.name.toLowerCase().includes(val.toLowerCase())
                );
                setSuggestions(matches.map(c => ({
                    id: c.id,
                    title: c.name,
                    subtitle: `Contact: ${c.contactPerson || 'N/A'}`,
                    type: 'company',
                    data: c
                })));
                setShowSuggestions(true);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        }
    };

    const selectSuggestion = async (item: any) => {
        setGuestName(item.title);
        setActiveLock(null);

        if (item.type === 'booking') {
            setBookingId(item.id);
            // Check for locks
            const locks = await getSystemLocks();
            const lock = locks.find(l => l.resourceId === item.id);
            if (lock) setActiveLock(lock);
        } else if (item.type === 'company') {
            setCompanyId(item.id);
            // Check for locks (future proofing, though current lock UI might not support picking companies yet)
            const locks = await getSystemLocks();
            const lock = locks.find(l => l.resourceId === item.id);
            if (lock) setActiveLock(lock);
        }
        setShowSuggestions(false);
    };

    // Tables
    const [charges, setCharges] = useState<InvoiceItem[]>(initialData?.charges || []);
    const [payments, setPayments] = useState<PaymentItem[]>(initialData?.payments || []);

    // Charge Input State
    const [newCharge, setNewCharge] = useState<Partial<InvoiceItem>>({
        particular: 'Extra Charges : Bar',
        comments: '',
        amount: 0,
        qty: 1,
        isTaxInclusive: true,
        discountType: null,
        discountValue: 0
    });

    const [newPayment, setNewPayment] = useState<Partial<PaymentItem>>({
        type: '',
        comments: '',
        amount: 0
    });

    const [loading, setLoading] = useState(false);

    // Derived Totals
    const totalCharges = charges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalPayments = payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const balance = totalCharges - totalPayments;

    const handleAddCharge = () => {
        // Allow adding even if amount is 0, but usually check for particular
        if (!newCharge.particular) return;

        setCharges([...charges, {
            id: Math.random().toString(36).substr(2, 9),
            srNo: charges.length + 1,
            refNo: '',
            particular: newCharge.particular!,
            comments: newCharge.comments,
            amount: Number(newCharge.amount),
            qty: Number(newCharge.qty),
            discountType: newCharge.discountType || null,
            discountValue: newCharge.discountValue || 0,
            isTaxInclusive: newCharge.isTaxInclusive || false
        }]);
        // Reset input, keep some defaults
        setNewCharge({
            ...newCharge,
            amount: 0,
            comments: '',
            particular: 'Extra Charges : Bar',
            qty: 1
        });
    };

    const handleAddPayment = () => {
        if (!newPayment.amount) return;
        setPayments([...payments, {
            id: Math.random().toString(36).substr(2, 9),
            srNo: payments.length + 1,
            type: newPayment.type!,
            comments: newPayment.comments,
            amount: Number(newPayment.amount)
        }]);
        setNewPayment({ ...newPayment, amount: 0, comments: '', type: '' });
    };

    const handleRemoveCharge = (id: string) => setCharges(charges.filter(c => c.id !== id));
    const handleRemovePayment = (id: string) => setPayments(payments.filter(p => p.id !== id));

    const handleSubmit = async () => {
        if (!guestName) {
            setShowNameError(true);
            return;
        }
        setLoading(true);
        try {
            const payload = {
                voucherNo: voucherNo === 'New' ? `INV-${Date.now().toString().substr(-6)}` : voucherNo,
                date: new Date(date).toISOString(),
                contactType,
                guestName,
                bookingId,
                companyId,
                paymentType,
                paymentMethod,
                charges,
                payments,
                subTotal: totalCharges,
                taxAmount: 0,
                totalAmount: totalCharges,
                totalPaid: totalPayments,
                balance,
                preparedBy: initialData?.preparedBy || currentUser || 'Unknown',
                status: 'active' as const,
                createdAt: new Date()
            };

            if (initialData?.id) {
                await updateIncidentalInvoice(initialData.id, payload);
                showToast('Invoice updated successfully', 'success');
            } else {
                await addIncidentalInvoice(payload as any);
                showToast('Invoice created successfully', 'success');
            }
            onSave();
        } catch (error) {
            console.error(error);
            showToast('Failed to save invoice', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 overflow-hidden z-[60] pointer-events-auto">
            <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 opacity-100" onClick={onClose} />

            <div className="absolute inset-y-0 right-0 w-full max-w-5xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData?.id ? 'Edit Incidental Invoice' : 'New Incidental Invoice'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">Create or manage incidental charges for guests or walk-ins</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-500 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Top Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6 mb-8">
                        {/* Row 1 */}
                        <div className="col-span-1 md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Contact Type</label>
                            <select
                                value={contactType}
                                onChange={(e) => setContactType(e.target.value as any)}
                                className="block w-full border-gray-300 text-sm py-2.5 px-3 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none bg-white transition-colors"
                            >
                                <option value="Guest">Guest</option>
                                <option value="City Ledger">City Ledger</option>
                                <option value="Walk-in">Walk-in</option>
                            </select>
                        </div>

                        <div className="col-span-1 md:col-span-3 relative">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                {contactType === 'Guest' ? 'Guest Name / Room' : contactType === 'City Ledger' ? 'Company Name' : 'Customer Name'} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={guestName}
                                    onChange={e => handleNameChange(e.target.value)}
                                    onFocus={() => { if (guestName.length >= 2) handleNameChange(guestName); }}
                                    className={`block w-full text-sm border ${showNameError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#FF6A00] focus:ring-[#FF6A00]'} py-2.5 px-4 rounded-none transition-colors bg-gray-50 focus:bg-white`}
                                    placeholder={contactType === 'Guest' ? "Search In-House Guest..." : "Enter Name..."}
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white shadow-lg border border-gray-100 max-h-60 overflow-auto rounded-b-md">
                                        {suggestions.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => selectSuggestion(item)}
                                                className="px-4 py-2 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0"
                                            >
                                                <div className="font-medium text-sm text-gray-900">{item.title}</div>
                                                <div className="text-xs text-gray-500">{item.subtitle}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {contactType !== 'Walk-in' && (
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6A00]">
                                        <MagnifyingGlassIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {(bookingId || companyId) && (
                                <div className="mt-1 text-xs text-green-600 flex items-center">
                                    <UserCircleIcon className="w-3 h-3 mr-1" />
                                    Linked to {contactType} Record
                                </div>
                            )}
                            {activeLock && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3 animate-fadeIn">
                                    <LockClosedIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-red-800">Folio Locked</h4>
                                        <p className="text-xs text-red-600 mt-1">
                                            This folio has been locked by <strong>{activeLock.lockedBy}</strong>.<br />
                                            Reason: {activeLock.description}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {showNameError && <span className="text-[10px] text-red-500 absolute -bottom-4 left-0 font-medium">Name is required.</span>}
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Voucher No</label>
                            <input type="text" value={voucherNo} readOnly className="block w-full border-gray-200 bg-gray-50 text-gray-700 text-sm py-2.5 px-3 rounded-none font-mono" />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="block w-full border-gray-300 text-gray-700 text-sm py-2.5 px-3 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Prepared By</label>
                            <input
                                type="text"
                                value={initialData?.preparedBy || currentUser || 'Unknown'}
                                readOnly
                                className="block w-full border-gray-200 bg-gray-50 text-gray-700 text-sm py-2.5 px-3 rounded-none"
                            />
                        </div>

                        {/* Row 2 */}
                        <div className="col-span-1 md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Payment Type</label>
                            <div className="flex gap-4 items-center h-10 border border-gray-300 px-3 bg-gray-50">
                                <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                                    <input type="radio" checked={paymentType === 'Cash/Bank'} onChange={() => setPaymentType('Cash/Bank')} className="text-[#FF6A00] focus:ring-[#FF6A00] h-4 w-4 mr-2" />
                                    Cash/Bank
                                </label>
                                <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                                    <input type="radio" checked={paymentType === 'City Ledger'} onChange={() => setPaymentType('City Ledger')} className="text-[#FF6A00] focus:ring-[#FF6A00] h-4 w-4 mr-2" />
                                    City Ledger
                                </label>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-3">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex">
                                Payment Method <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="block w-full border-gray-300 text-sm py-2 px-3 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none bg-gray-50 focus:bg-white"
                            >
                                <option>Booking.com Virtual Card</option>
                                <option>Cash</option>
                                <option>City Ledger</option>
                                <option>Credit Card (Visa)</option>
                                <option>Credit Card (Amex)</option>
                                <option>MasterCard</option>
                                <option>Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    {/* Charges Section */}
                    <div className="bg-white border border-gray-100 shadow-sm mb-6 overflow-hidden">
                        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Charges</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] divide-y divide-gray-200">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                                    <tr className="text-left">
                                        <th className="py-3 px-4 w-12 text-center whitespace-nowrap">#</th>
                                        <th className="py-3 px-4 w-24 whitespace-nowrap">Ref. No</th>
                                        <th className="py-3 px-4 w-64 whitespace-nowrap">Particular</th>
                                        <th className="py-3 px-4 whitespace-nowrap">Comments</th>
                                        <th className="py-3 px-4 w-32 text-right whitespace-nowrap">Amount ($)</th>
                                        <th className="py-3 px-4 w-16 whitespace-nowrap"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {/* Existing Charges */}
                                    {charges.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 text-center text-xs text-gray-500 whitespace-nowrap">{idx + 1}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 font-mono whitespace-nowrap">{row.refNo || '-'}</td>
                                            <td className="py-3 px-4 text-sm text-gray-800 font-medium whitespace-nowrap">{row.particular}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{row.comments}</td>
                                            <td className="py-3 px-4 text-sm text-gray-800 font-medium text-right whitespace-nowrap">${row.amount.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <button onClick={() => handleRemoveCharge(row.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Input Row */}
                                    <tr className="bg-blue-50/20">
                                        <td className="p-4 text-center text-xs text-gray-400 font-bold whitespace-nowrap">+</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="text-xs text-gray-400 font-mono italic">Auto</span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <select
                                                className="w-full text-sm border-gray-300 rounded-none focus:ring-[#FF6A00] focus:border-[#FF6A00] py-2 px-3 bg-white"
                                                value={newCharge.particular}
                                                onChange={(e) => setNewCharge({ ...newCharge, particular: e.target.value })}
                                            >
                                                <option>Extra Charges : Bar</option>
                                                <option>Extra Charges : Breakfast</option>
                                                <option>Extra Charges : Lunch</option>
                                                <option>Extra Charges : Dinner</option>
                                                <option>Extra Charges : Laundry</option>
                                                <option>Extra Charges : Mini Bar</option>
                                                <option>Extra Charges : Telephone</option>
                                                <option>Extra Charges : Transport</option>
                                                <option>Room Charge</option>
                                                <option>Early Check-in Charge</option>
                                                <option>Late Check-out Charge</option>
                                                <option>Tourism Tax</option>
                                                <option>Miscellaneous</option>
                                            </select>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                placeholder="Add details..."
                                                className="w-full text-sm border-gray-300 rounded-none focus:ring-[#FF6A00] focus:border-[#FF6A00] py-2 px-3 bg-white"
                                                value={newCharge.comments}
                                                onChange={(e) => setNewCharge({ ...newCharge, comments: e.target.value })}
                                            />
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full text-sm border-gray-300 rounded-none focus:ring-[#FF6A00] focus:border-[#FF6A00] py-2 pl-6 pr-3 text-right font-medium bg-white"
                                                    value={newCharge.amount}
                                                    onChange={(e) => setNewCharge({ ...newCharge, amount: Number(e.target.value) })}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={handleAddCharge}
                                                className="px-4 py-2 text-xs bg-white text-[#FF6A00] border border-[#FF6A00] hover:bg-orange-50 font-bold tracking-wide transition-colors uppercase"
                                            >
                                                Add
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Options Row */}
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={6} className="px-6 py-3 border-t border-gray-100 whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-6 text-sm">
                                                <label className="inline-flex items-center text-gray-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={newCharge.isTaxInclusive}
                                                        onChange={(e) => setNewCharge({ ...newCharge, isTaxInclusive: e.target.checked })}
                                                        className="text-[#FF6A00] focus:ring-[#FF6A00] h-4 w-4 mr-2 rounded border-gray-300"
                                                    />
                                                    Rate Inclusive Tax
                                                </label>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500 font-medium">Qty:</span>
                                                    <input
                                                        type="number"
                                                        value={newCharge.qty}
                                                        onChange={(e) => setNewCharge({ ...newCharge, qty: Number(e.target.value) })}
                                                        className="w-16 h-8 text-sm border-gray-300 focus:ring-[#FF6A00] focus:border-[#FF6A00] text-center bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payments Section */}
                    <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Payments</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] divide-y divide-gray-200">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                                    <tr className="text-left">
                                        <th className="py-3 px-4 w-12 text-center whitespace-nowrap">#</th>
                                        <th className="py-3 px-4 w-24 whitespace-nowrap">Ref. No</th>
                                        <th className="py-3 px-4 w-48 whitespace-nowrap">Type</th>
                                        <th className="py-3 px-4 whitespace-nowrap">Comments</th>
                                        <th className="py-3 px-4 w-32 text-right whitespace-nowrap">Amount ($)</th>
                                        <th className="py-3 px-4 w-16 whitespace-nowrap"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {/* Existing Payments */}
                                    {payments.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 text-center text-xs text-gray-500 whitespace-nowrap">{idx + 1}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 font-mono whitespace-nowrap">{row.refNo || '-'}</td>
                                            <td className="py-3 px-4 text-sm text-gray-800 font-medium whitespace-nowrap">{row.type}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{row.comments}</td>
                                            <td className="py-3 px-4 text-sm text-green-700 font-medium text-right whitespace-nowrap">${row.amount.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <button onClick={() => handleRemovePayment(row.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Payment Input Row */}
                                    <tr className="bg-blue-50/20">
                                        <td className="p-4 text-center text-xs text-gray-400 font-bold whitespace-nowrap">+</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="text-xs text-gray-400 font-mono italic">Auto</span>
                                        </td>
                                        <td className="p-4 pr-2 whitespace-nowrap">
                                            <select
                                                className="w-full text-sm border-gray-300 rounded-none focus:ring-[#FF6A00] focus:border-[#FF6A00] py-2 px-3 bg-white"
                                                value={newPayment.type}
                                                onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                                            >
                                                <option value="">Select Method</option>
                                                <option>Cash</option>
                                                <option>Booking.com Virtual Card</option>
                                                <option>Credit Card (Visa)</option>
                                                <option>Credit Card (Mastercard)</option>
                                                <option>Credit Card (Amex)</option>
                                                <option>Bank Transfer</option>
                                                <option>Cheque</option>
                                            </select>
                                        </td>
                                        <td className="p-4 pr-2 whitespace-nowrap">
                                            <input
                                                type="text"
                                                placeholder="Add payment details..."
                                                className="w-full text-sm border-gray-300 rounded-none focus:ring-[#FF6A00] focus:border-[#FF6A00] py-2 px-3 bg-white"
                                                value={newPayment.comments}
                                                onChange={(e) => setNewPayment({ ...newPayment, comments: e.target.value })}
                                            />
                                        </td>
                                        <td className="p-4 flex items-center whitespace-nowrap">
                                            <div className="relative w-full">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full text-sm border-gray-300 rounded-none focus:ring-[#FF6A00] focus:border-[#FF6A00] py-2 pl-6 pr-3 text-right font-medium bg-white"
                                                    value={newPayment.amount}
                                                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={handleAddPayment}
                                                className="px-4 py-2 text-xs bg-white text-green-600 border border-green-600 hover:bg-green-50 font-bold tracking-wide transition-colors uppercase"
                                            >
                                                Recieve
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>



                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex flex-col md:flex-row justify-between items-center z-10 gap-4">
                    <div className="flex flex-wrap gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-start">
                        <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-0.5">Total Charges</span>
                            <span className="text-lg font-bold text-gray-900">${totalCharges.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-0.5">Total Paid</span>
                            <span className="text-lg font-bold text-green-600">${totalPayments.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-0.5">Balance Due</span>
                            <span className={`text-lg font-bold ${balance > 0 ? 'text-red-500' : 'text-gray-900'}`}>${balance.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button onClick={onClose} className="flex-1 md:flex-none px-6 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors rounded-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !!activeLock}
                            className={`flex-1 md:flex-none px-8 py-2.5 text-white font-medium transition-colors shadow-sm rounded-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6A00] disabled:opacity-50 disabled:cursor-not-allowed
                                ${!!activeLock ? 'bg-gray-400 hover:bg-gray-500' : 'bg-[#FF6A00] hover:bg-[#e66000]'}`}
                        >
                            {loading ? 'Saving...' : !!activeLock ? 'Folio Locked' : 'Save Invoice'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}

// --- Main Page Component ---
export default function IncidentalInvoices() {
    const { showToast } = useToast();
    const { adminUser } = useAdminRole();
    const [invoices, setInvoices] = useState<IncidentalInvoice[]>([]);
    const [search, setSearch] = useState('');
    const [showVoid, setShowVoid] = useState(false);

    // Void Modal State
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [invoiceToVoid, setInvoiceToVoid] = useState<string | null>(null);

    const [selectedInvoice, setSelectedInvoice] = useState<IncidentalInvoice | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getIncidentalInvoices();
            setInvoices(data);
        } catch (error) {
            showToast('Failed to load invoices', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (inv: IncidentalInvoice) => {
        setSelectedInvoice(inv);
        setIsFormOpen(true);
    };

    const handleVoid = (id: string) => {
        setInvoiceToVoid(id);
        setShowVoidModal(true);
    };

    const confirmVoid = async () => {
        if (!invoiceToVoid) return;

        try {
            const success = await updateIncidentalInvoice(invoiceToVoid, { status: 'void', updatedAt: new Date() }, { user: adminUser?.name || 'Admin', ip: '127.0.0.1' });
            if (success) {
                showToast('Invoice voided successfully', 'success');
                setInvoices(prev => prev.map(inv => inv.id === invoiceToVoid ? { ...inv, status: 'void' } : inv));
                // If the selected invoice is the one being voided, we update the selected invoice object as well
                if (selectedInvoice && selectedInvoice.id === invoiceToVoid) {
                    setSelectedInvoice({ ...selectedInvoice, status: 'void' });
                }
            } else {
                showToast('Failed to void invoice', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error voiding invoice', 'error');
        } finally {
            setShowVoidModal(false);
            setInvoiceToVoid(null);
        }
    };

    const handleAddNew = () => {
        setSelectedInvoice(null);
        setIsFormOpen(true);
    };

    const filteredInvoices = invoices.filter(inv => {
        if (!showVoid && inv.status === 'void') return false;
        const q = search.toLowerCase();
        return (inv.voucherNo || '').toLowerCase().includes(q) || (inv.guestName || '').toLowerCase().includes(q);
    });

    return (
        <div className="flex flex-col bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden min-h-[600px]">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-100 px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Incidental Invoices</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage POS and extra charges</p>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 text-sm border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] w-full md:w-64 transition-all"
                        />
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap">
                            <CalendarIcon className="h-4 w-4 text-gray-500 shrink-0" />
                            <input type="date" className="bg-transparent border-none p-0 text-xs focus:ring-0 text-gray-700 font-medium" />
                            <span className="text-gray-400 mx-1">to</span>
                            <input type="date" className="bg-transparent border-none p-0 text-xs focus:ring-0 text-gray-700 font-medium" />
                        </div>
                    </div>

                    <button
                        onClick={handleAddNew}
                        className="flex items-center justify-center gap-2 bg-[#FF6A00] text-white px-5 py-2.5 rounded-lg hover:bg-[#e66000] font-medium text-sm transition-all shadow-md shadow-orange-500/20 w-full md:w-auto active:scale-95 transform duration-150"
                    >
                        <PlusIcon className="h-5 w-5" />
                        New Invoice
                    </button>
                </div>
            </div>

            {/* Split Pane Layout */}
            <div className="flex flex-col lg:flex-row flex-1">
                {/* Left Panel: List */}
                <div className="w-full lg:w-96 bg-white border-r border-gray-100 flex flex-col h-[500px] lg:h-auto overflow-hidden">
                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoices List</span>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors select-none">
                                <input type="checkbox" className="rounded text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300" checked={!showVoid} onChange={(e) => setShowVoid(!e.target.checked)} />
                                Hide Void
                            </label>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6A00] mb-3"></div>
                                Loading...
                            </div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="p-10 flex flex-col items-center justify-center text-gray-400 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                    <UserCircleIcon className="w-8 h-8 text-gray-300" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">No Invoices Found</span>
                                <p className="text-xs mt-1 text-gray-500">Create a new invoice above</p>
                            </div>
                        ) : (
                            filteredInvoices.map(inv => (
                                <div
                                    key={inv.id}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group relative ${selectedInvoice?.id === inv.id
                                        ? 'bg-[#FF6A00]/5 border-[#FF6A00] shadow-sm'
                                        : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
                                        }`}
                                >
                                    {selectedInvoice?.id === inv.id && (
                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#FF6A00] rounded-r-full"></div>
                                    )}
                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div>
                                            <span className="font-bold text-sm text-gray-900 block font-mono tracking-tight">{inv.voucherNo || 'N/A'}</span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <CalendarIcon className="h-3 w-3" />
                                                {inv.date ? new Date(inv.date).toLocaleDateString() : 'No Date'}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${inv.balance === 0
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-orange-50 text-orange-700'
                                            }`}>
                                            {inv.balance === 0 ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 mb-3 pl-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${selectedInvoice?.id === inv.id ? 'bg-[#FF6A00]' : 'bg-gray-400'}`}>
                                            {(inv.guestName || 'G').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium truncate">{inv.guestName || 'Unknown Guest'}</span>
                                    </div>

                                    <div className="flex justify-between items-end border-t border-gray-100/50 pt-2.5 mt-2 pl-2">
                                        <span className="text-xs text-gray-400 font-medium">{inv.charges?.length || 0} items</span>
                                        <span className="font-bold text-base text-gray-900 tracking-tight">${(inv.totalAmount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Detail or Empty State */}
                <div className="flex-1 bg-gray-50/30 flex items-start justify-center p-4 lg:p-8 min-h-[500px]">
                    {selectedInvoice && !isFormOpen ? (
                        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl p-0 max-w-5xl w-full border border-gray-100 overflow-hidden">
                            {/* Detail Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-mono">{selectedInvoice.voucherNo}</h2>
                                        <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${selectedInvoice.balance === 0
                                            ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                                            : 'bg-red-50 text-red-600 ring-1 ring-red-100'
                                            }`}>
                                            {selectedInvoice.balance === 0 ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        Created on <span className="font-medium text-gray-700">{selectedInvoice.date ? new Date(selectedInvoice.createdAt || selectedInvoice.date).toLocaleDateString() : 'N/A'}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        by <span className="font-medium text-gray-700">{selectedInvoice.preparedBy || 'System'}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {selectedInvoice.status !== 'void' && (
                                        <button
                                            onClick={() => handleVoid(selectedInvoice.id)}
                                            className="group flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200 shadow-sm rounded-xl hover:bg-red-100 text-red-700 font-medium transition-all"
                                        >
                                            <TrashIcon className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                                            <span>Void</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsFormOpen(true)}
                                        className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-medium transition-all"
                                    >
                                        <PencilIcon className="h-4 w-4 text-gray-400 group-hover:text-[#FF6A00] transition-colors" />
                                        <span>Edit Invoice</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-8">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                    <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 block">Guest</label>
                                        <div className="font-bold text-gray-900 text-lg line-clamp-1" title={selectedInvoice.guestName}>{selectedInvoice.guestName}</div>
                                        <div className="text-xs text-blue-600 font-medium mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">{selectedInvoice.contactType}</div>
                                    </div>
                                    <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 block">Date</label>
                                        <div className="font-bold text-gray-900 text-lg">{selectedInvoice.date ? new Date(selectedInvoice.date).toLocaleDateString() : 'N/A'}</div>
                                        <div className="text-xs text-gray-400 mt-1">Date of Issue</div>
                                    </div>
                                    <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 block">Payment</label>
                                        <div className="font-bold text-gray-900 text-lg line-clamp-1">{selectedInvoice.paymentMethod || 'N/A'}</div>
                                        <div className="text-xs text-gray-500 mt-1">{selectedInvoice.paymentType || 'N/A'}</div>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-[#FF6A00] to-[#FF4500] rounded-xl shadow-lg shadow-orange-200 text-white transform hover:scale-105 transition-transform duration-200">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/70 mb-2 block">Total Amount</label>
                                        <div className="font-bold text-2xl tracking-tight">${(selectedInvoice.totalAmount || 0).toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                    {/* Charges Table */}
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-3 font-bold text-gray-900 text-lg">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                                <span className="w-2 h-2 bg-[#FF6A00] rounded-full"></span>
                                            </div>
                                            Charges
                                        </h3>
                                        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                                        <th className="px-5 py-4">Particular</th>
                                                        <th className="px-5 py-4 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {(selectedInvoice.charges || []).map(c => (
                                                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-5 py-4 text-gray-700">
                                                                <div className="font-semibold text-gray-900">{c.particular}</div>
                                                                {c.comments && <div className="text-xs text-gray-500 mt-1">{c.comments}</div>}
                                                            </td>
                                                            <td className="px-5 py-4 text-right font-bold text-gray-900 font-mono">${(c.amount || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    {(selectedInvoice.charges || []).length === 0 && (
                                                        <tr>
                                                            <td colSpan={2} className="px-5 py-8 text-center text-gray-400 text-xs italic">No charges added yet</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Payments Table */}
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-3 font-bold text-gray-900 text-lg">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            </div>
                                            Payments
                                        </h3>
                                        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50/80 border-b border-gray-100 text-left text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                                        <th className="px-5 py-4">Method</th>
                                                        <th className="px-5 py-4 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {(selectedInvoice.payments || []).map(p => (
                                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-5 py-4 text-gray-700">
                                                                <div className="font-semibold text-gray-900">{p.type}</div>
                                                                {p.comments && <div className="text-xs text-gray-500 mt-1">{p.comments}</div>}
                                                            </td>
                                                            <td className="px-5 py-4 text-right font-bold text-green-600 font-mono">${(p.amount || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    {(selectedInvoice.payments || []).length === 0 && (
                                                        <tr>
                                                            <td colSpan={2} className="px-5 py-8 text-center text-gray-400 text-xs italic">No payments received</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-8 flex justify-end">
                                            <div className="bg-gray-900 text-white rounded-2xl p-6 w-full shadow-2xl shadow-gray-200">
                                                <div className="flex justify-between items-center mb-2 text-gray-400 text-xs uppercase tracking-widest font-bold">
                                                    <span>Balance Due</span>
                                                </div>
                                                <div className="text-4xl font-bold tracking-tight mb-4">${selectedInvoice.balance.toFixed(2)}</div>
                                                <div className="text-sm text-gray-400 border-t border-gray-800 pt-4 flex justify-between items-center">
                                                    <span>Total Billed</span>
                                                    <span className="text-white font-mono">${selectedInvoice.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-10 py-32 text-center opacity-80">
                            <div className="relative mb-8 group">
                                <div className="absolute inset-0 bg-[#FF6A00]/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 relative z-10">
                                    <CalendarIcon className="h-10 w-10 text-[#FF6A00]" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Select an Invoice</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                                Select an invoice from the list to view its details, manage charges, and process payments, or create a new one to get started.
                            </p>
                            <button
                                onClick={handleAddNew}
                                className="px-8 py-3.5 bg-[#FF6A00] text-white rounded-xl hover:bg-[#e66000] font-bold text-sm transition-all shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Create New Invoice
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <InvoiceForm
                    onClose={() => setIsFormOpen(false)}
                    onSave={() => {
                        setIsFormOpen(false);
                        loadData();
                    }}
                    initialData={selectedInvoice}
                    currentUser={adminUser?.name}
                />
            )}

            {/* Void Confirmation Modal */}
            <ConfirmationModal
                isOpen={showVoidModal}
                onClose={() => setShowVoidModal(false)}
                onConfirm={confirmVoid}
                title="Void Invoice"
                message="Are you sure you want to VOID this invoice? This action cannot be undone."
                confirmText="Void Invoice"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
