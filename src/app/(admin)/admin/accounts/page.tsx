"use client";

import React, { useState, useEffect } from 'react';
import { getLedgerEntries, getFinancialSummary, createLedgerEntry, getSalesInvoices, getPurchaseBills } from '@/lib/accountsService';
import type { LedgerEntry, FinancialSummary, Booking, PurchaseOrder } from '@/lib/firestoreService';
import { PlusIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon, DocumentTextIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import AccountEntryDrawer from '@/components/admin/accounts/AccountEntryDrawer';
import { useSearchParams } from 'next/navigation';
import { updatePurchaseOrder } from '@/lib/inventoryService';
import { useToast } from '@/context/ToastContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import BookingDetailsDrawer from '@/components/admin/bookings/BookingDetailsDrawer';
import PurchaseOrderDrawer from '@/components/admin/inventory/PurchaseOrderDrawer';
import { getSuppliers, getInventoryItems } from '@/lib/inventoryService';
import type { Supplier, InventoryItem } from '@/lib/firestoreService';

export default function AccountsPage() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'bills' | 'transactions'>('overview');
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [invoices, setInvoices] = useState<Booking[]>([]);
    const [bills, setBills] = useState<PurchaseOrder[]>([]);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showBookingDrawer, setShowBookingDrawer] = useState(false);
    const [selectedBill, setSelectedBill] = useState<PurchaseOrder | null>(null);
    const [showBillDrawer, setShowBillDrawer] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [payBillId, setPayBillId] = useState<string | null>(null);

    // Filters
    const [dateFilter, setDateFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

    const fetchData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate = new Date();

            // Calculate start date based on filter
            if (dateFilter === 'daily') startDate.setDate(now.getDate() - 1);
            else if (dateFilter === 'weekly') startDate.setDate(now.getDate() - 7);
            else if (dateFilter === 'monthly') startDate.setMonth(now.getMonth() - 1);
            else startDate.setFullYear(now.getFullYear() - 1);

            // Fetch Summary
            const summaryData = await getFinancialSummary(dateFilter, startDate, now);
            setSummary(summaryData);

            // Fetch Entries (limit to recent 50 for performance, or by date)
            const entriesData = await getLedgerEntries(startDate, now);
            setEntries(entriesData);

            // Fetch Invoices (Sales)
            const invoicesData = await getSalesInvoices(startDate, now);
            setInvoices(invoicesData);

            // Fetch Bills (Purchases)
            const billsData = await getPurchaseBills(startDate, now);
            setBills(billsData);

            // Fetch Suppliers & Items for Drawer context
            // We do this in parallel to avoid waterfalls
            const [suppliersData, itemsData] = await Promise.all([
                getSuppliers(),
                getInventoryItems()
            ]);
            setSuppliers(suppliersData);
            setInventoryItems(itemsData);
        } catch (error) {
            console.error("Error fetching accounts data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateFilter]);

    const handleCreateEntry = async (data: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
        setIsSubmitting(true);
        try {
            await createLedgerEntry(data);
            setIsDrawerOpen(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error creating entry:", error);
            alert("Failed to create entry. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkPaid = (bill: PurchaseOrder) => {
        setPayBillId(bill.id);
    };

    const confirmPayment = async () => {
        if (!payBillId) return;
        try {
            // Mark as 'bank_transfer' or prompt user. For now default to 'bank_transfer' or 'cash'
            await updatePurchaseOrder(payBillId, { paymentMethod: 'bank_transfer', status: 'received' });
            // Note: status might already be 'received', paymentMethod is what tracks payment

            showToast("Bill marked as paid", "success");
            fetchData();
        } catch (error) {
            console.error(error);
            showToast("Failed to update payment status", "error");
        } finally {
            setPayBillId(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'TZS', // Assuming TZS or USD based on previous context, using generic symbol for now
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Finance & Accounts</h1>
                    <p className="text-sm text-gray-500">Manage income, expenses, and financial overview</p>
                </div>
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors shadow-sm font-medium"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Entry
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200 w-fit">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${activeTab === 'invoices'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Guest Invoices
                </button>
                <button
                    onClick={() => setActiveTab('bills')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${activeTab === 'bills'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <ShoppingBagIcon className="w-4 h-4 mr-2" />
                    Vendor Bills
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'transactions'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    Transactions
                </button>
            </div>

            {/* Filter (Only shown in Overview for now, but affects both fetches) */}
            <div className="flex justify-end">
                <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="block w-40 rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm bg-white shadow-sm"
                >
                    <option value="daily">Last 24 Hours</option>
                    <option value="weekly">Last 7 Days</option>
                    <option value="monthly">Last 30 Days</option>
                    <option value="yearly">Last Year</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <>
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && summary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Summary Cards */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Income</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.totalIncome)}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-full">
                                    <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(summary.totalExpenses)}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-full">
                                    <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Net Profit</p>
                                    <p className={`text-2xl font-bold mt-1 ${summary.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                        {formatCurrency(summary.netProfit)}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-full">
                                    <BanknotesIcon className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>

                            {/* Charts or Breakdowns can go here */}
                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Income Breakdown */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Breakdown</h3>
                                    <div className="space-y-3">
                                        {Object.entries(summary.incomeBreakdown).length === 0 ? (
                                            <p className="text-gray-500 text-sm">No income data for this period.</p>
                                        ) : (
                                            Object.entries(summary.incomeBreakdown).map(([category, amount]) => (
                                                <div key={category} className="flex items-center justify-between text-sm">
                                                    <span className="capitalize text-gray-600">{category.replace('_', ' ')}</span>
                                                    <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Expense Breakdown */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                                    <div className="space-y-3">
                                        {Object.entries(summary.expenseBreakdown).length === 0 ? (
                                            <p className="text-gray-500 text-sm">No expense data for this period.</p>
                                        ) : (
                                            Object.entries(summary.expenseBreakdown).map(([category, amount]) => (
                                                <div key={category} className="flex items-center justify-between text-sm">
                                                    <span className="capitalize text-gray-600">{category.replace('_', ' ')}</span>
                                                    <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INVOICES TAB (Active Sales) */}
                    {activeTab === 'invoices' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Guest Checkout Invoices</h3>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                    Generated from Bookings
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 text-left tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Guest Name</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Room</th>
                                            <th className="px-6 py-3 text-center tracking-wider">Nights</th>
                                            <th className="px-6 py-3 text-right tracking-wider">Total Amount</th>
                                            <th className="px-6 py-3 text-center tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invoices.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                    No invoices found for this period.
                                                </td>
                                            </tr>
                                        ) : (
                                            invoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(inv.checkOut).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {inv.guestDetails ? `${inv.guestDetails.firstName} ${inv.guestDetails.lastName}` : 'Guest'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {inv.roomNumber || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                                        {(() => {
                                                            const start = new Date(inv.checkIn).getTime();
                                                            const end = new Date(inv.checkOut).getTime();
                                                            if (isNaN(start) || isNaN(end)) return '-';
                                                            const nights = Math.ceil((end - start) / (1000 * 3600 * 24));
                                                            return nights > 0 ? nights : 1;
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                                                        {formatCurrency(inv.totalAmount || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                            inv.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {inv.paymentStatus || 'pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedBooking(inv);
                                                                setShowBookingDrawer(true);
                                                            }}
                                                            className="text-orange-600 hover:text-orange-900"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* BILLS TAB (Purchase Orders) */}
                    {activeTab === 'bills' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Vendor Purchase Bills</h3>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                    Generated from Purchase Orders
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 text-left tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left tracking-wider">PO Number</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Supplier</th>
                                            <th className="px-6 py-3 text-center tracking-wider">Items</th>
                                            <th className="px-6 py-3 text-right tracking-wider">Total Cost</th>
                                            <th className="px-6 py-3 text-center tracking-wider">Pay Status</th>
                                            <th className="px-6 py-3 text-right tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {bills.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                    No purchase bills found.
                                                </td>
                                            </tr>
                                        ) : (
                                            bills.map((bill) => (
                                                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                                        {bill.poNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {bill.supplierName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                                        {bill.items?.length || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
                                                        {formatCurrency(bill.totalAmount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${bill.paymentMethod ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {bill.paymentMethod ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2">
                                                            {!bill.paymentMethod && (
                                                                <button
                                                                    onClick={() => handleMarkPaid(bill)}
                                                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded text-xs border border-green-200"
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBill(bill);
                                                                    setShowBillDrawer(true);
                                                                }}
                                                                className="text-orange-600 hover:text-orange-900"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TRANSACTIONS TAB */}
                    {activeTab === 'transactions' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 text-left tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Ref #</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Type / Category</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Entity (Payer/Payee)</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Details</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Method</th>
                                            <th className="px-6 py-3 text-right tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-center tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {entries.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                                    No transactions found.
                                                </td>
                                            </tr>
                                        ) : (
                                            entries.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(entry.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                        {entry.referenceNumber || entry.invoiceNumber || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${entry.entryType === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {entry.entryType}
                                                        </span>
                                                        <div className="text-xs text-gray-500 mt-1 capitalize">{entry.category.replace('_', ' ')}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                        {entry.payerOrPayee || entry.referenceId || 'N/A'}
                                                        {entry.department && (entry.entryType === 'expense') && (
                                                            <div className="text-xs text-gray-500 capitalize">{entry.department.replace('_', ' ')} Dept</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={entry.description}>
                                                        {entry.description}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                        {entry.paymentMethod?.replace('_', ' ') || '-'}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${entry.entryType === 'income' ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {entry.entryType === 'expense' ? '-' : '+'}{formatCurrency(entry.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {entry.status === 'void' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Void</span>
                                                        ) : entry.status === 'pending' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Cleared</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )
            }

            {/* Booking Details Drawer */}
            {
                selectedBooking && (
                    <BookingDetailsDrawer
                        isOpen={showBookingDrawer}
                        onClose={() => {
                            setShowBookingDrawer(false);
                            setTimeout(() => setSelectedBooking(null), 300);
                        }}
                        booking={selectedBooking}
                        onUpdate={fetchData}
                        onCancelBooking={() => { }}
                    />
                )
            }

            {/* Vendor Bill Drawer */}
            <PurchaseOrderDrawer
                isOpen={showBillDrawer}
                onClose={() => {
                    setShowBillDrawer(false);
                    setTimeout(() => setSelectedBill(null), 300);
                }}
                onSave={fetchData}
                po={selectedBill}
                suppliers={suppliers}
                inventoryItems={inventoryItems}
            />

            <AccountEntryDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleCreateEntry}
            />

            <ConfirmationModal
                isOpen={!!payBillId}
                onClose={() => setPayBillId(null)}
                onConfirm={confirmPayment}
                title="Record Payment"
                message="Are you sure you want to mark this vendor bill as PAID? This currently assumes a standard Bank Transfer."
                confirmText="Mark as Paid"
                type="info"
            />
        </div >
    );
}
