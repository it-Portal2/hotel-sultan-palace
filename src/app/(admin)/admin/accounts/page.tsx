
"use client";

import React, { useState, useEffect } from 'react';
import {

    PlusIcon,
    Cog6ToothIcon,

} from '@heroicons/react/24/outline';
import { collection, query, orderBy, onSnapshot, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LedgerEntry, PurchaseOrder, Booking, Supplier, InventoryItem } from '@/lib/firestoreService';
import { getLedgerEntries, createLedgerEntry, getSalesInvoices, getPurchaseBills } from '@/lib/accountsService';
import AccountEntryDrawer from '@/components/admin/accounts/AccountEntryDrawer';
import { useToast } from '@/context/ToastContext';
import InvoiceViewModal from '@/components/admin/finance/InvoiceViewModal';
import PurchaseOrderDrawer from '@/components/admin/inventory/PurchaseOrderDrawer';
import { updatePurchaseOrder, getSuppliers, getInventoryItems } from '@/lib/inventoryService';
import { useSearchParams } from 'next/navigation';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// New Analytics Imports
import { getProfitLossStatement, getBalanceSheet, type ProfitLossStatement, type BalanceSheet } from '@/lib/financeAnalytics';
import FinanceDashboard from '@/components/admin/accounts/FinanceDashboard';
import ExchangeRateDrawer from '@/components/admin/accounts/ExchangeRateDrawer';

export default function AccountsPage() {
    const { showToast } = useToast();
    const searchParams = useSearchParams(); // Keep existing searchParams
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'bills' | 'expenses' | 'transactions'>('overview');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Financial Data State
    const [plStatement, setPlStatement] = useState<ProfitLossStatement | null>(null);
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
    const [isFinanceLoading, setIsFinanceLoading] = useState(true);
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

    // Existing State...
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]); // Renamed from 'entries'
    const [invoices, setInvoices] = useState<Booking[]>([]);
    const [bills, setBills] = useState<PurchaseOrder[]>([]);
    // Removed 'summary' state as it's replaced by plStatement/balanceSheet for overview
    const [loading, setLoading] = useState(true); // Keep existing loading state
    // Removed 'isSubmitting' as it's not in the new block, but might be used later. Re-adding for safety.
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Invoices State
    const [selectedInvoice, setSelectedInvoice] = useState<Booking | null>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    const [selectedBill, setSelectedBill] = useState<PurchaseOrder | null>(null);
    const [showBillDrawer, setShowBillDrawer] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]); // Simplified type for now
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [payBillId, setPayBillId] = useState<string | null>(null);

    // Filters
    const [dateFilter, setDateFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [currencySettings, setCurrencySettings] = useState<{ baseCurrency: string; rates: Record<string, number> }>({ baseCurrency: 'USD', rates: {} });

    // Helper: Fetch Finance Settings (Rates)
    const fetchSettings = async () => {
        if (!db) return;
        try {
            const docRef = doc(db, 'settings', 'finance');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setCurrencySettings({
                    baseCurrency: data.baseCurrency || 'USD',
                    rates: data.exchangeRates || {}
                });
            }
        } catch (e) {
            console.error("Error fetching settings:", e);
        }
    };

    // Sync Tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['overview', 'invoices', 'bills', 'transactions', 'expenses'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    // List of keys to exclude from "New Entry" button
    const hideNewEntryTabs = ['overview', 'invoices', 'bills', 'transactions'];

    // Fetch Financial Analytics
    useEffect(() => {
        if (activeTab === 'overview') {
            const fetchAnalytics = async () => {
                setIsFinanceLoading(true);
                try {
                    const now = new Date();
                    let startDate = new Date();

                    // Calculate start date based on filter
                    if (dateFilter === 'daily') startDate.setDate(now.getDate() - 1);
                    else if (dateFilter === 'weekly') startDate.setDate(now.getDate() - 7);
                    else if (dateFilter === 'monthly') startDate.setMonth(now.getMonth() - 1);
                    else startDate.setFullYear(now.getFullYear() - 1);

                    // Fetch Settings & Data in parallel
                    await fetchSettings();
                    const [pl, bs] = await Promise.all([
                        getProfitLossStatement(startDate, now),
                        getBalanceSheet() // Balance Sheet is usually a snapshot of "Now", but arguably could be historical. Keeping "Now" for simplicity unless historical BS is requested.
                    ]);
                    setPlStatement(pl);
                    setBalanceSheet(bs);
                } catch (error) {
                    console.error("Failed to fetch analytics", error);
                } finally {
                    setIsFinanceLoading(false);
                }
            };
            fetchAnalytics();
        }
    }, [activeTab, dateFilter]); // Added dateFilter dependency

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

            await fetchSettings(); // Ensure we have rates for lists too if needed later

            // Fetch Entries (limit to recent 50 for performance, or by date)
            const entriesData = await getLedgerEntries(startDate, now);
            setLedgerEntries(entriesData);

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
            currency: currencySettings.baseCurrency || 'USD',
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 capitalize">
                        {activeTab === 'overview' ? 'Finance Overview' :
                            activeTab === 'invoices' ? 'Guest Invoices (AR)' :
                                activeTab === 'bills' ? 'Accounts Payable' :
                                    activeTab === 'expenses' ? 'Daily Expenses' : 'Transactions'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {activeTab === 'overview' ? 'Financial performance summary' :
                            activeTab === 'invoices' ? 'Manage guest checkout invoices' :
                                activeTab === 'bills' ? 'View and pay pending vendor bills' :
                                    activeTab === 'expenses' ? 'Track daily operational expenses and receipts' : 'View all financial transactions'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Date Picker / Filter for Overview and others */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="block w-40 rounded-lg border-gray-200 py-2 pl-3 pr-10 text-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer"
                    >
                        <option value="daily">Last 24 Hours</option>
                        <option value="weekly">Last 7 Days</option>
                        <option value="monthly">Last 30 Days</option>
                        <option value="yearly">Last Year</option>
                    </select>

                    {activeTab === 'overview' && (
                        <button
                            onClick={() => setShowSettingsDrawer(true)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Finance Settings & Exchange Rates"
                        >
                            <Cog6ToothIcon className="w-6 h-6" />
                        </button>
                    )}
                    {/* Only show 'New Entry' for Expenses tab as Invoices come from Bookings and Bills from POs */}
                    {activeTab === 'expenses' && (
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors shadow-sm font-medium"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            New Expense
                        </button>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'overview' ? (
                <FinanceDashboard
                    pl={plStatement}
                    bs={balanceSheet}
                    loading={isFinanceLoading}
                    dateRange={dateFilter === 'monthly' ? 'Last 30 Days' : dateFilter === 'weekly' ? 'Last 7 Days' : dateFilter === 'yearly' ? 'Last Year' : 'Last 24 Hours'}
                    currencySettings={currencySettings}
                />
            ) : (
                <>
                    {/* Filters Row (Only for lists) - Removing the button group in favor of the global dropdown above for consistency */}
                </>
            )}

            {activeTab !== 'overview' && (
                // Render Lists for other tabs
                <div className="space-y-4">
                    {/* ... existing table rendering logic ... */}
                    {/* We need to be careful not to hide the tables for invoices/bills/expenses */}
                    {/* The original code just dumped grids here. I need to wrap them effectively. */}
                    {/* Actually, it's safer to just inject the dashboard ABOVE the existing content if activeTab=overview, 
                      and HIDE the existing content if activeTab=overview. */}
                </div>
            )}

            {/* 
               WAIT. The tool `replace_file_content` replaces a specific block. 
               The original file had Stat Cards + Grid of cards right after the header. 
               I should replace the Stat Cards section with the condition:
               If overview -> FinanceDashboard
               Else -> StatCards (maybe? or just hide them)
            */}



            {/* Filter removed (moved to header) */}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <>


                    {/* EXPENSES TAB */}
                    {activeTab === 'expenses' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Daily Expenses</h3>
                                <div className="text-sm text-gray-500">
                                    Total: <span className="font-bold text-red-600">
                                        {formatCurrency(ledgerEntries.filter(e => e.entryType === 'expense').reduce((sum, e) => sum + e.amount, 0))}
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 text-left tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Payee / Details</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Method</th>
                                            <th className="px-6 py-3 text-right tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-center tracking-wider">Receipt</th>
                                            <th className="px-6 py-3 text-center tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {ledgerEntries.filter(e => e.entryType === 'expense').length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                    No expenses found for this period.
                                                </td>
                                            </tr>
                                        ) : (
                                            ledgerEntries.filter(e => e.entryType === 'expense').map((entry) => (
                                                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(entry.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-red-50 text-red-700">
                                                            {entry.category.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <div className="font-medium">{entry.payerOrPayee || entry.vendor || '-'}</div>
                                                        <div className="text-xs text-gray-500">{entry.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                        {entry.paymentMethod?.replace('_', ' ') || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
                                                        {formatCurrency(entry.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {entry.attachmentUrl ? (
                                                            <button
                                                                onClick={() => window.open(entry.attachmentUrl, '_blank')}
                                                                className="text-orange-600 hover:text-orange-900 text-xs font-medium border border-orange-200 bg-orange-50 px-2 py-1 rounded"
                                                            >
                                                                View Receipt
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {entry.status === 'cleared' ? (
                                                            <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">Paid</span>
                                                        ) : (
                                                            <span className="text-yellow-600 text-xs font-medium bg-yellow-50 px-2 py-0.5 rounded-full capitalize">{entry.status}</span>
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
                                                        {inv.guestDetails ? `${inv.guestDetails.firstName} ${inv.guestDetails.lastName} ` : 'Guest'}
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
                                                        <span className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - medium capitalize ${inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                            inv.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                            } `}>
                                                            {inv.paymentStatus || 'pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedInvoice(inv);
                                                                setShowInvoiceModal(true);
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
                                                        <span className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - medium capitalize ${bill.paymentMethod ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            } `}>
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
                                        {ledgerEntries.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                                    No transactions found.
                                                </td>
                                            </tr>
                                        ) : (
                                            ledgerEntries.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(entry.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                        {entry.referenceNumber || entry.invoiceNumber || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - medium capitalize ${entry.entryType === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            } `}>
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
                                                    <td className={`px - 6 py - 4 whitespace - nowrap text - sm text - right font - bold ${entry.entryType === 'income' ? 'text-green-600' : 'text-red-600'
                                                        } `}>
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

            {/* Invoice View Modal */}
            {selectedInvoice && showInvoiceModal && (
                <InvoiceViewModal
                    booking={selectedInvoice}
                    onClose={() => {
                        setShowInvoiceModal(false);
                        setTimeout(() => setSelectedInvoice(null), 300);
                    }}
                />
            )}

            {/* Vendor Bill Drawer (Read Only in Finance) */}
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
                readonly={true}
                onMarkPaid={selectedBill && !selectedBill.paymentMethod ? () => handleMarkPaid(selectedBill) : undefined}
            />

            <ExchangeRateDrawer
                isOpen={showSettingsDrawer}
                onClose={() => setShowSettingsDrawer(false)}
                onRatesUpdated={() => {
                    fetchSettings();
                    if (activeTab !== 'overview') {
                        fetchData();
                    }
                }}
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
