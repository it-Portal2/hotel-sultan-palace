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
    PaymentItem
} from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { useAdminRole } from '@/context/AdminRoleContext';

// --- Invoice Form Component to Match Image 2 ---
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
    const [showNameError, setShowNameError] = useState(false);
    const [paymentType, setPaymentType] = useState(initialData?.paymentType || 'Cash/Bank');
    const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'Booking.com Virtual Card');
    const [voucherNo] = useState(initialData?.voucherNo || 'New');

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
        discountType: undefined,
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
            discountType: newCharge.discountType,
            discountValue: newCharge.discountValue,
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-2 border-b">
                    <h2 className="text-sm font-semibold text-gray-700">Add</h2>
                    <button onClick={onClose}><XMarkIcon className="h-5 w-5 text-gray-400 hover:text-red-500" /></button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* Top Form Grid */}
                    <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                        {/* Row 1 */}
                        <div className="col-span-3">
                            <label className="block text-[11px] text-gray-600 mb-1">Contact Type</label>
                            <select
                                value={contactType}
                                onChange={(e) => setContactType(e.target.value as any)}
                                className="block w-full border-gray-300 text-xs py-1.5 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Guest">Guest</option>
                                <option value="City Ledger">City Ledger</option>
                                <option value="Walk-in">Walk-in</option>
                            </select>
                        </div>

                        <div className="col-span-3 relative">
                            <label className="block text-[11px] text-red-500 mb-1">* Name</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => { setGuestName(e.target.value); setShowNameError(false); }}
                                    className={`block w-full border text-xs py-1.5 focus:ring-blue-500 focus:border-blue-500 ${showNameError ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Full Name"
                                />
                                <button className="bg-white border border-l-0 border-gray-300 px-2 text-gray-500"><UserCircleIcon className="h-4 w-4" /></button>
                                <button className="bg-white border border-l-0 border-gray-300 px-2 text-gray-500"><MagnifyingGlassIcon className="h-4 w-4" /></button>
                            </div>
                            {showNameError && <span className="text-[10px] text-red-500 absolute -bottom-4 left-0">Name is required.</span>}
                        </div>

                        <div className="col-span-2">
                            <label className="block text-[11px] text-red-500 mb-1">* Voucher Number</label>
                            <input type="text" value={voucherNo} disabled className="block w-full border-gray-200 bg-gray-50 text-gray-400 text-xs py-1.5" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-[11px] text-gray-600 mb-1">Voucher Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="block w-full border-gray-300 text-gray-700 text-xs py-1.5 focus:ring-blue-500 focus:border-blue-500 rounded-sm shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-[11px] text-gray-600 mb-1">Prepared By</label>
                            <input
                                type="text"
                                value={initialData?.preparedBy || currentUser || 'Unknown'}
                                disabled
                                className="block w-full border-gray-200 bg-gray-50 text-gray-500 text-xs py-1.5 rounded-sm"
                            />
                        </div>

                        {/* Row 2 */}
                        <div className="col-span-2">
                            <label className="block text-[11px] text-gray-600 mb-2">Payment Type</label>
                            <div className="flex gap-4 items-center h-8">
                                <label className="inline-flex items-center text-xs text-gray-700">
                                    <input type="radio" checked={paymentType === 'Cash/Bank'} onChange={() => setPaymentType('Cash/Bank')} className="text-blue-600 h-3 w-3 mr-1.5" />
                                    Cash/Bank
                                </label>
                                <label className="inline-flex items-center text-xs text-gray-700">
                                    <input type="radio" checked={paymentType === 'City Ledger'} onChange={() => setPaymentType('City Ledger')} className="text-blue-600 h-3 w-3 mr-1.5" />
                                    City Ledger
                                </label>
                            </div>
                        </div>

                        <div className="col-span-3">
                            <label className="block text-[11px] text-red-500 mb-1">* Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="block w-full border-gray-300 text-xs py-1.5 focus:ring-blue-500 focus:border-blue-500"
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
                    <div className="mt-8">
                        <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase">CHARGES</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="w-8"></th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2 w-16">Sr. No</th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2 w-24">Ref. No</th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2 w-64">Particular</th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2">Comments</th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2 w-32">Amount($)</th>
                                    <th className="w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Existing Charges */}
                                {charges.map((row, idx) => (
                                    <tr key={row.id} className="border-b border-gray-100">
                                        <td className="py-2"><input type="checkbox" className="h-3 w-3 rounded border-gray-300" /></td>
                                        <td className="text-xs text-gray-600">{idx + 1}</td>
                                        <td className="text-xs text-gray-600">{row.refNo || 'New'}</td>
                                        <td className="text-xs text-gray-600">{row.particular}</td>
                                        <td className="text-xs text-gray-600">{row.comments}</td>
                                        <td className="text-xs text-gray-600">${row.amount.toFixed(2)}</td>
                                        <td><button onClick={() => handleRemoveCharge(row.id)}><TrashIcon className="h-4 w-4 text-red-400" /></button></td>
                                    </tr>
                                ))}

                                {/* Input Row - Row 1 */}
                                <tr>
                                    <td className="pt-4"><input type="checkbox" className="h-3 w-3 rounded border-gray-300" /></td>
                                    <td className="pt-4 text-xs text-gray-400"></td>
                                    <td className="pt-4"><input type="text" value="New" disabled className="w-full text-xs border bg-gray-50 border-gray-300 px-2 py-1.5 text-gray-400" /></td>
                                    <td className="pt-4 pr-2">
                                        <select
                                            className="w-full text-xs border border-gray-300 px-2 py-1.5 text-gray-700"
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
                                    <td className="pt-4 pr-2">
                                        <input
                                            type="text"
                                            placeholder="Comments"
                                            className="w-full text-xs border border-gray-300 px-2 py-1.5"
                                            value={newCharge.comments}
                                            onChange={(e) => setNewCharge({ ...newCharge, comments: e.target.value })}
                                        />
                                    </td>
                                    <td className="pt-4 flex items-center">
                                        <span className="text-xs text-red-500 mr-1">$</span>
                                        <input
                                            type="number"
                                            className="w-full text-xs border border-red-300 px-2 py-1.5 text-right text-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            value={newCharge.amount}
                                            onChange={(e) => setNewCharge({ ...newCharge, amount: Number(e.target.value) })}
                                        />
                                    </td>
                                    <td className="pt-4 pl-2 text-right">
                                        <button
                                            onClick={handleAddCharge}
                                            className="px-3 py-1.5 text-xs text-blue-500 border border-blue-500 rounded hover:bg-blue-50"
                                        >
                                            Add
                                        </button>
                                    </td>
                                </tr>

                                {/* Input Row - Row 2 (Discount, Tax, Qty) */}
                                <tr>
                                    <td colSpan={3}></td>
                                    <td colSpan={4} className="pt-2 pb-4">
                                        <div className="flex items-center justify-end gap-6">
                                            {/* Tax Checkbox */}
                                            <div className="flex flex-col items-end">
                                                <div className="h-[28px]"></div> {/* Spacer for alignment */}
                                                <label className="inline-flex items-center text-xs text-gray-700 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={newCharge.isTaxInclusive}
                                                        onChange={(e) => setNewCharge({ ...newCharge, isTaxInclusive: e.target.checked })}
                                                        className="text-blue-600 h-3 w-3 mr-1.5 rounded border-gray-300"
                                                    />
                                                    Rate Inclusive Tax
                                                </label>
                                            </div>

                                            {/* Discount */}
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-0.5">Discount</label>
                                                <div className="flex w-32">
                                                    <select className="text-[10px] border border-gray-300 border-r-0 py-1 px-1 w-16 bg-gray-50 text-gray-700">
                                                        <option>-Select-</option>
                                                        <option>%</option>
                                                        <option>$</option>
                                                    </select>
                                                    <input type="text" className="text-xs border border-gray-300 w-full py-1 px-2 disabled:bg-gray-50 bg-gray-50" disabled />
                                                </div>
                                            </div>

                                            {/* Qty */}
                                            <div>
                                                <label className="block text-[10px] text-gray-500 mb-0.5">Qty</label>
                                                <input
                                                    type="number"
                                                    value={newCharge.qty}
                                                    onChange={(e) => setNewCharge({ ...newCharge, qty: Number(e.target.value) })}
                                                    className="text-xs border border-gray-300 w-16 py-1 px-2 text-gray-700"
                                                />
                                            </div>

                                            <div className="w-16"></div> {/* Spacer for Add Button column */}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="mt-2">
                            <button className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 bg-gray-50 rounded shadow-sm hover:bg-gray-100">
                                Tax Operation
                            </button>
                        </div>
                    </div>

                    {/* Payments Section */}
                    <div className="mt-8">
                        <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase">PAYMENTS</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="w-8"></th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2 w-16">Sr. No</th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2 w-24">Ref. No</th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2 w-48">Type</th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2">Comments</th>
                                    <th className="text-[11px] font-bold text-gray-600 pb-2 w-32">Amount($)</th>
                                    <th className="w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Existing Payments */}
                                {payments.map((row, idx) => (
                                    <tr key={row.id} className="border-b border-gray-100">
                                        <td className="py-2"><input type="checkbox" className="h-3 w-3 rounded border-gray-300" /></td>
                                        <td className="text-xs text-gray-600">{idx + 1}</td>
                                        <td className="text-xs text-gray-600">{row.refNo}</td>
                                        <td className="text-xs text-gray-600">{row.type}</td>
                                        <td className="text-xs text-gray-600">{row.comments}</td>
                                        <td className="text-xs text-gray-600">${row.amount.toFixed(2)}</td>
                                        <td><button onClick={() => handleRemovePayment(row.id)}><TrashIcon className="h-4 w-4 text-red-400" /></button></td>
                                    </tr>
                                ))}

                                {/* Payment Input Row */}
                                <tr>
                                    <td className="pt-2"><input type="checkbox" className="h-3 w-3 rounded border-gray-300" /></td>
                                    <td className="pt-2 text-xs text-gray-400"></td>
                                    <td className="pt-2"><input type="text" disabled className="w-full text-xs border bg-gray-50 border-gray-300 px-2 py-1.5 text-gray-400" /></td>
                                    <td className="pt-2 pr-2">
                                        <select
                                            className="w-full text-xs border border-gray-300 px-2 py-1.5 text-gray-700"
                                            value={newPayment.type}
                                            onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                                        >
                                            <option value="">-Select-</option>
                                            <option>Cash</option>
                                            <option>Booking.com Virtual Card</option>
                                            <option>Credit Card (Visa)</option>
                                            <option>Credit Card (Mastercard)</option>
                                            <option>Credit Card (Amex)</option>
                                            <option>Bank Transfer</option>
                                            <option>Cheque</option>
                                        </select>
                                    </td>
                                    <td className="pt-2 pr-2">
                                        <input
                                            type="text"
                                            placeholder="Comments"
                                            className="w-full text-xs border border-gray-300 px-2 py-1.5"
                                            value={newPayment.comments}
                                            onChange={(e) => setNewPayment({ ...newPayment, comments: e.target.value })}
                                        />
                                    </td>
                                    <td className="pt-2 flex items-center">
                                        <span className="text-xs text-gray-500 mr-1">$</span>
                                        <input
                                            type="number"
                                            className="w-full text-xs border border-gray-300 px-2 py-1.5 text-right"
                                            value={newPayment.amount}
                                            onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                                        />
                                    </td>
                                    <td className="pt-2 pl-2 text-right">
                                        <button
                                            onClick={handleAddPayment}
                                            className="px-3 py-1.5 text-xs text-blue-500 border border-blue-500 rounded hover:bg-blue-50"
                                        >
                                            Add
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-white flex justify-end items-center gap-4">
                    <div className="text-xs font-bold text-red-500">
                        Balance : {balance.toFixed(0)}
                    </div>
                    <button onClick={onClose} className="px-6 py-1.5 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-1.5 bg-[#007bff] text-white rounded text-xs font-medium hover:bg-blue-600 shadow-sm"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Main Page Component ---
export default function IncidentalInvoicePage() {
    const { showToast } = useToast();
    const { adminUser } = useAdminRole();
    const [invoices, setInvoices] = useState<IncidentalInvoice[]>([]);
    const [search, setSearch] = useState('');
    const [showVoid, setShowVoid] = useState(false);
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

    const handleAddNew = () => {
        setSelectedInvoice(null);
        setIsFormOpen(true);
    };

    const filteredInvoices = invoices.filter(inv => {
        if (!showVoid && inv.status === 'void') return false;
        const q = search.toLowerCase();
        return inv.voucherNo.toLowerCase().includes(q) || inv.guestName.toLowerCase().includes(q);
    });

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-100">
            {/* Top Bar */}
            <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-800">Incidental Invoice</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by Voucher no./Name/Type"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 pr-4 py-1.5 text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 w-64"
                        />
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-2.5 top-2" />
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 py-1.5 text-sm">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <input type="date" className="border-none p-0 text-xs focus:ring-0" />
                        <span className="text-gray-400 mx-1">→</span>
                        <input type="date" className="border-none p-0 text-xs focus:ring-0" />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" className="rounded text-blue-600" checked={!showVoid} onChange={(e) => setShowVoid(!e.target.checked)} />
                        Hide Void
                    </label>

                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-1 bg-white border border-blue-500 text-blue-600 px-3 py-1.5 rounded text-sm hover:bg-blue-50 font-medium"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add New
                    </button>
                </div>
            </div>

            {/* Split Pane Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: List */}
                <div className="w-80 bg-white border-r flex flex-col">
                    <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">Invoice Details</span>
                        <span className="text-xs font-bold text-gray-500 uppercase">Amount</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                                <div className="w-12 h-12 mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">Inbox</span>
                                </div>
                                <span className="text-sm">No Data</span>
                            </div>
                        ) : (
                            filteredInvoices.map(inv => (
                                <div
                                    key={inv.id}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className={`p-3 border-b cursor-pointer hover:bg-blue-50 ${selectedInvoice?.id === inv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-sm text-gray-900">{inv.voucherNo}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${inv.balance === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {inv.balance === 0 ? 'Paid' : 'Due'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 truncate">{inv.guestName}</div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-[10px] text-gray-400">{new Date(inv.date).toLocaleDateString()}</span>
                                        <span className="font-bold text-sm text-gray-800">${inv.totalAmount}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Detail or Empty State */}
                <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
                    {selectedInvoice && !isFormOpen ? (
                        // View Mode (For now, re-opening Edit form for simplicity as requested "Add/View" flow usually merges)
                        // But matching the image "Click on voucher to view details", I'll show a simple details card or standard empty state if nothing selected.
                        // Actually, user flow implies clicking list shows details. 
                        // To save time and complexity, I will make "Clicking row" open the "Edit Form" or a "ReadOnly Layout".
                        // For now, let's keep the "Empty State" behavior if nothing selected, but if selected, show Details.
                        <div className="bg-white shadow rounded-lg p-8 max-w-2xl w-full">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h2 className="text-xl font-bold">{selectedInvoice.voucherNo}</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                                        <PencilIcon className="h-4 w-4" /> Edit
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-xs text-gray-500">Guest Name</label>
                                    <div className="font-medium">{selectedInvoice.guestName}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Date</label>
                                    <div className="font-medium">{new Date(selectedInvoice.date).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Total Amount</label>
                                    <div className="font-bold text-lg">${selectedInvoice.totalAmount}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Balance</label>
                                    <div className={`font-bold text-lg ${selectedInvoice.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>${selectedInvoice.balance}</div>
                                </div>
                            </div>

                            <h3 className="font-bold text-sm border-b pb-2 mb-2">Charges</h3>
                            <table className="w-full text-sm mb-6">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="font-normal pb-2">Particular</th>
                                        <th className="font-normal pb-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoice.charges.map(c => (
                                        <tr key={c.id}>
                                            <td className="py-1">{c.particular}</td>
                                            <td className="text-right py-1">${c.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <h3 className="font-bold text-sm border-b pb-2 mb-2">Payments</h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="font-normal pb-2">Method</th>
                                        <th className="font-normal pb-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoice.payments.map(p => (
                                        <tr key={p.id}>
                                            <td className="py-1">{p.type}</td>
                                            <td className="text-right py-1">${p.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <p className="mb-4">Click on the voucher to view the details <br /> OR</p>
                            <button
                                onClick={handleAddNew}
                                className="bg-white border border-blue-500 text-blue-600 px-4 py-2 rounded shadow-sm hover:bg-blue-50 font-medium"
                            >
                                + Add New
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
        </div>
    );
}
