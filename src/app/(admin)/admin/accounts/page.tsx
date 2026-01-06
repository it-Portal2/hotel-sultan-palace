"use client";

import React, { useState, useEffect } from 'react';
import { getLedgerEntries, getFinancialSummary, createLedgerEntry } from '@/lib/accountsService';
import type { LedgerEntry, FinancialSummary } from '@/lib/firestoreService';
import { PlusIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import AccountEntryDrawer from '@/components/admin/accounts/AccountEntryDrawer';
import { useSearchParams } from 'next/navigation';

export default function AccountsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            )}

            {/* Drawer */}
            <AccountEntryDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleCreateEntry}
            />
        </div>
    );
}
