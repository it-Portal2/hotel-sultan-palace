import React, { useState, useEffect } from 'react';
import { getInventoryTransactions } from '@/lib/inventoryService';
import type { InventoryTransaction } from '@/lib/firestoreService';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function InventoryReportsTab() {
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getInventoryTransactions();
            setTransactions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'purchase': return 'bg-green-100 text-green-700';
            case 'transfer_in': return 'bg-blue-100 text-blue-700';
            case 'adjustment': return 'bg-purple-100 text-purple-700';
            case 'usage': return 'bg-gray-100 text-gray-700';
            case 'waste': return 'bg-red-100 text-red-700';
            case 'transfer_out': return 'bg-orange-100 text-orange-700';
            case 'sales_deduction': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
                    <p className="text-sm text-gray-500">Log of all stock movements (adjustments, purchases, usage).</p>
                </div>
                <button
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 text-sm font-medium transition-colors"
                    onClick={() => { alert('Export feature pending') }}
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock After</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading transactions...</td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No transactions found.</td>
                                </tr>
                            ) : (
                                transactions.map((trans) => (
                                    <tr key={trans.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {trans.createdAt.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {trans.itemName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold ${getTypeColor(trans.transactionType)}`}>
                                                {trans.transactionType.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap font-bold text-sm ${trans.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {trans.quantity > 0 ? '+' : ''}{trans.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {trans.newStock}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {trans.performedBy}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {trans.reason || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
