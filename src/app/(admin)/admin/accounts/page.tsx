"use client";

import React, { useState, useEffect } from 'react';
import { getLedgerEntries, getFinancialSummary, createLedgerEntry } from '@/lib/accountsService';
import type { LedgerEntry, FinancialSummary } from '@/lib/firestoreService';
import { PlusIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon } from '@heroicons/react/24/outline';

import { useSearchParams } from 'next/navigation';

export default function AccountsPage() {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [dateRange] = useState({
        start: new Date(new Date().setDate(1)), // First day of month
        end: new Date()
    });

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const loadData = async () => {
        setLoading(true);
        const [entriesData, summaryData] = await Promise.all([
            getLedgerEntries(dateRange.start, dateRange.end),
            getFinancialSummary('monthly', dateRange.start, dateRange.end)
        ]);
        setEntries(entriesData);
        setSummary(summaryData);
        setLoading(false);
    };

    const handleCreateEntry = async (formData: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
        await createLedgerEntry(formData);
        setShowModal(false);
        loadData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'transactions' ? 'All Transactions' : 'Accounts Overview'}
                    </h1>
                    <p className="text-gray-600">
                        {activeTab === 'transactions'
                            ? 'Detailed list of income and expenses'
                            : 'Financial transactions and summary'
                        }
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Add Entry
                </button>
            </div>

            {/* Content based on Tab */}
            {activeTab === 'overview' ? (
                <>
                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Income</p>
                                        <p className="text-2xl font-bold text-green-600">${summary.totalIncome.toFixed(2)}</p>
                                    </div>
                                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Expenses</p>
                                        <p className="text-2xl font-bold text-red-600">${summary.totalExpenses.toFixed(2)}</p>
                                    </div>
                                    <ArrowTrendingDownIcon className="h-8 w-8 text-red-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Net Profit</p>
                                        <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ${summary.netProfit.toFixed(2)}
                                        </p>
                                    </div>
                                    <BanknotesIcon className="h-8 w-8 text-blue-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Receivables</p>
                                        <p className="text-2xl font-bold text-orange-600">${summary.accountsReceivable.toFixed(2)}</p>
                                    </div>
                                    <BanknotesIcon className="h-8 w-8 text-orange-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Transactions Preview */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                            <a href="/admin/accounts?tab=transactions" className="text-sm text-[#FF6A00] hover:underline">View All</a>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {entries.slice(0, 5).map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.date.toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${entry.entryType === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {entry.entryType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.category.replace(/_/g, ' ')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs" title={entry.description}>{entry.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <span className={entry.entryType === 'income' ? 'text-green-600' : 'text-red-600'}>
                                                    {entry.entryType === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* Transactions Tab Content */
                <div className="bg-white rounded-lg shadow">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {entry.date.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${entry.entryType === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {entry.entryType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {entry.category.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={entry.entryType === 'income' ? 'text-green-600' : 'text-red-600'}>
                                                {entry.entryType === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {entry.paymentMethod || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <TransactionModal
                    onClose={() => setShowModal(false)}
                    onSave={handleCreateEntry}
                />
            )}
        </div>
    );
}

function TransactionModal({
    onClose,
    onSave
}: {
    onClose: () => void;
    onSave: (data: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
    const [formData, setFormData] = useState({
        date: new Date(),
        entryType: 'income' as LedgerEntry['entryType'],
        category: 'other' as LedgerEntry['category'],
        amount: 0,
        description: '',
        paymentMethod: 'cash' as LedgerEntry['paymentMethod'],
        createdBy: 'admin',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={formData.entryType}
                            onChange={(e) => setFormData({ ...formData, entryType: e.target.value as LedgerEntry['entryType'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value as LedgerEntry['category'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                        >
                            <option value="room_booking">Room Booking</option>
                            <option value="food_beverage">Food & Beverage</option>
                            <option value="services">Services</option>
                            <option value="facilities">Facilities</option>
                            <option value="salary">Salary</option>
                            <option value="utilities">Utilities</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="supplies">Supplies</option>
                            <option value="marketing">Marketing</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as LedgerEntry['paymentMethod'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="online">Online</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
