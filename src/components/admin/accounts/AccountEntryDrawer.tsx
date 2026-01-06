import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, BanknotesIcon, CalendarIcon, UserIcon, DocumentTextIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { LedgerEntry } from '@/lib/firestoreService';

interface AccountEntryDrawerProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function AccountEntryDrawer({ open, onClose, onSave }: AccountEntryDrawerProps) {
    // Form State
    const [entryType, setEntryType] = useState<LedgerEntry['entryType']>('income');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<LedgerEntry['category']>('other');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<LedgerEntry['paymentMethod']>('cash');

    // New Fields
    const [referenceNumber, setReferenceNumber] = useState('');
    const [payerOrPayee, setPayerOrPayee] = useState('');
    const [department, setDepartment] = useState<LedgerEntry['department']>('accounts');
    const [status, setStatus] = useState<LedgerEntry['status']>('cleared');

    // Reset form when opening
    useEffect(() => {
        if (open) {
            setEntryType('income');
            setDate(new Date().toISOString().split('T')[0]);
            setCategory('other');
            setAmount('');
            setDescription('');
            setPaymentMethod('cash');
            setReferenceNumber('');
            setPayerOrPayee('');
            setDepartment('accounts');
            setStatus('cleared');
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            date: new Date(date),
            entryType,
            category,
            amount: parseFloat(amount),
            description,
            paymentMethod,
            referenceNumber,
            payerOrPayee,
            department: entryType === 'expense' ? department : undefined,
            status,
            createdBy: 'admin', // In real app, get from auth context
        });
    };

    return (
        <Transition.Root show={open} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" />

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={React.Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">

                                        {/* Header */}
                                        <div className="bg-[#FF6A00] px-4 py-6 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <Dialog.Title className="text-base font-semibold leading-6 text-white">
                                                    New Financial Entry
                                                </Dialog.Title>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="relative rounded-md bg-[#FF6A00] text-orange-100 hover:text-white focus:outline-none"
                                                        onClick={onClose}
                                                    >
                                                        <span className="absolute -inset-2.5" />
                                                        <span className="sr-only">Close panel</span>
                                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-1">
                                                <p className="text-sm text-orange-100">
                                                    Record a new income or expense transaction.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="relative flex-1 px-4 py-6 sm:px-6 space-y-6">

                                            {/* Transaction Type */}
                                            <div>
                                                <label className="text-sm font-medium text-gray-900 block mb-2">Transaction Type</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEntryType('income')}
                                                        className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${entryType === 'income'
                                                                ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500'
                                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        Income
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEntryType('expense')}
                                                        className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${entryType === 'expense'
                                                                ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        Expense
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Date, Category, Amount */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <input
                                                            type="date"
                                                            required
                                                            value={date}
                                                            onChange={(e) => setDate(e.target.value)}
                                                            className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                            <span className="text-gray-500 sm:text-sm">$</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            step="0.01"
                                                            value={amount}
                                                            onChange={(e) => setAmount(e.target.value)}
                                                            className="block w-full rounded-md border-gray-300 pl-7 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm font-semibold"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                                <select
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value as any)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                                >
                                                    {entryType === 'income' ? (
                                                        <>
                                                            <option value="room_booking">Room Booking</option>
                                                            <option value="food_beverage">Food & Beverage</option>
                                                            <option value="services">Services (Spa/Laundry)</option>
                                                            <option value="other">Other Income</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="salary">Salary</option>
                                                            <option value="utilities">Utilities</option>
                                                            <option value="maintenance">Maintenance</option>
                                                            <option value="supplies">Supplies</option>
                                                            <option value="marketing">Marketing</option>
                                                            <option value="food_beverage">F&B Cost</option>
                                                            <option value="other">Other Expense</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>

                                            {/* Details Section */}
                                            <div className="border-t border-gray-200 pt-4">
                                                <h4 className="text-sm font-medium text-gray-900 mb-3">Transaction Details</h4>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Reference No. / Invoice #</label>
                                                        <div className="mt-1 flex rounded-md shadow-sm">
                                                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                                                #
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={referenceNumber}
                                                                onChange={(e) => setReferenceNumber(e.target.value)}
                                                                className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                                                placeholder="e.g. INV-2024-001"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            {entryType === 'income' ? 'Payer Name (From)' : 'Payee Name (To)'}
                                                        </label>
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                                <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={payerOrPayee}
                                                                onChange={(e) => setPayerOrPayee(e.target.value)}
                                                                className="block w-full rounded-md border-gray-300 pl-10 px-3 py-2 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                                                placeholder={entryType === 'income' ? "Guest Name / Company" : "Vendor / Staff Name"}
                                                            />
                                                        </div>
                                                    </div>

                                                    {entryType === 'expense' && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Department</label>
                                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                                </div>
                                                                <select
                                                                    value={department}
                                                                    onChange={(e) => setDepartment(e.target.value as any)}
                                                                    className="block w-full rounded-md border-gray-300 pl-10 px-3 py-2 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                                                >
                                                                    <option value="accounts">Accounts / General</option>
                                                                    <option value="front_office">Front Office</option>
                                                                    <option value="housekeeping">Housekeeping</option>
                                                                    <option value="kitchen">Kitchen / F&B</option>
                                                                    <option value="maintenance">Maintenance</option>
                                                                    <option value="hr">HR</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                                        <div className="mt-1">
                                                            <textarea
                                                                rows={3}
                                                                required
                                                                value={description}
                                                                onChange={(e) => setDescription(e.target.value)}
                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2"
                                                                placeholder="Enter transaction details..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Details */}
                                            <div className="border-t border-gray-200 pt-4">
                                                <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Info</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Method</label>
                                                        <select
                                                            value={paymentMethod}
                                                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                                        >
                                                            <option value="cash">Cash</option>
                                                            <option value="card">Card</option>
                                                            <option value="bank_transfer">Bank Transfer</option>
                                                            <option value="cheque">Cheque</option>
                                                            <option value="online">Online</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                                        <select
                                                            value={status}
                                                            onChange={(e) => setStatus(e.target.value as any)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                                        >
                                                            <option value="cleared">Cleared / Paid</option>
                                                            <option value="pending">Pending</option>
                                                            <option value="void">Void</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Footer */}
                                        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-6 sm:px-6">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    type="button"
                                                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                                    onClick={onClose}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="inline-flex justify-center rounded-md bg-[#FF6A00] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#FF6A00]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6A00]"
                                                >
                                                    Save Entry
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
