import React, { useState, useEffect } from 'react';
import { getInventoryTransactions, getInventoryDepartments, getInventoryItems } from '@/lib/inventoryService';
import type { InventoryTransaction, Department, InventoryItem } from '@/lib/firestoreService';
import {
    ArrowDownTrayIcon,
    ChartPieIcon,
    ClockIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 10;

export default function InventoryReportsTab() {
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [itemsMap, setItemsMap] = useState<Record<string, InventoryItem>>({});
    
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'history' | 'usage'>('usage');

    const [currentPageHistory, setCurrentPageHistory] = useState(1);
    const [currentPageUsage, setCurrentPageUsage] = useState(1);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [txData, depts, items] = await Promise.all([
                getInventoryTransactions(),
                getInventoryDepartments(),
                getInventoryItems(),
            ]);

            setTransactions(txData);
            setDepartments(depts);

            const iMap: Record<string, InventoryItem> = {};
            items.forEach(i => iMap[i.id] = i);
            setItemsMap(iMap);
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

    const getLocationName = (slug?: string) => {
        if (!slug) return '—';
        const dept = departments.find(d => d.slug === slug);
        return dept ? dept.name : slug;
    };

    const getItemUnit = (tx: InventoryTransaction) => {
        if (tx.unit) return tx.unit;
        const mappedItem = itemsMap[tx.inventoryItemId];
        return mappedItem?.unit || '';
    };

    // Calculate Usage Summary
    const usageSummary = React.useMemo(() => {
        const summary: Record<string, { name: string, quantity: number, cost: number }> = {};

        transactions.forEach(tx => {
            // Filter: Only count usage/waste/transfer_out/sales_deduction as consumption
            if (['usage', 'waste', 'transfer_out', 'sales_deduction'].includes(tx.transactionType)) {
                if (!summary[tx.inventoryItemId]) {
                    summary[tx.inventoryItemId] = {
                        name: tx.itemName,
                        quantity: 0,
                        cost: 0
                    };
                }
                const qty = Math.abs(tx.quantity); // Ensure positive
                summary[tx.inventoryItemId].quantity += qty;
                summary[tx.inventoryItemId].cost += (tx.unitCost || 0) * qty;
            }
        });

        return Object.values(summary).sort((a, b) => b.cost - a.cost); // Sort by highest cost
    }, [transactions]);

    // Pagination
    const paginatedHistory = transactions.slice((currentPageHistory - 1) * ITEMS_PER_PAGE, currentPageHistory * ITEMS_PER_PAGE);
    const paginatedUsage = usageSummary.slice((currentPageUsage - 1) * ITEMS_PER_PAGE, currentPageUsage * ITEMS_PER_PAGE);

    const totalHistoryPages = Math.ceil(transactions.length / ITEMS_PER_PAGE) || 1;
    const totalUsagePages = Math.ceil(usageSummary.length / ITEMS_PER_PAGE) || 1;

    const handleExport = () => {
        // Simple CSV Export of current view
        let headers = [];
        let rows = [];

        if (activeTab === 'history') {
            headers = ['Date', 'Location', 'Item', 'Type', 'Quantity', 'Unit', 'Unit Cost', 'Total Cost', 'Stock After', 'Performed By', 'Reason'];
            rows = transactions.map(t => [
                new Date(t.createdAt).toLocaleString(),
                getLocationName(t.locationId),
                t.itemName,
                t.transactionType,
                t.quantity.toString(),
                getItemUnit(t),
                (t.unitCost || 0).toFixed(2),
                (t.totalCost || 0).toFixed(2),
                t.newStock.toString(),
                t.performedBy,
                `"${t.reason || ''}"`
            ]);
        } else {
            headers = ['Item Name', 'Total Consumed', 'Total Cost'];
            rows = usageSummary.map(s => [
                s.name,
                s.quantity.toString(),
                s.cost.toFixed(2)
            ]);
        }

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `inventory_${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-1 max-w-md">
                <button
                    onClick={() => { setActiveTab('usage'); setCurrentPageUsage(1); }}
                    className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeTab === 'usage'
                        ? 'bg-orange-50 text-[#FF6A00] shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <ChartPieIcon className="w-4 h-4" />
                    Usage Summary
                </button>
                <button
                    onClick={() => { setActiveTab('history'); setCurrentPageHistory(1); }}
                    className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeTab === 'history'
                        ? 'bg-orange-50 text-[#FF6A00] shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <ClockIcon className="w-4 h-4" />
                    Transaction Log
                </button>
            </div>

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">
                        {activeTab === 'usage' ? 'Consumption Summary' : 'Transaction Log'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {activeTab === 'usage'
                            ? 'Aggregated usage and waste by item.'
                            : 'Detailed log of all stock movements.'}
                    </p>
                </div>
                <button
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    onClick={handleExport}
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
                    {activeTab === 'history' ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock After</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {loading ? (
                                    <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">Loading transactions...</td></tr>
                                ) : paginatedHistory.length === 0 ? (
                                    <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">No transactions found.</td></tr>
                                ) : (
                                    paginatedHistory.map((trans) => (
                                        <tr key={trans.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {new Date(trans.createdAt).toLocaleDateString()} <span className="text-xs">{new Date(trans.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                                                    {getLocationName(trans.locationId)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {trans.itemName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full ${getTypeColor(trans.transactionType)}`}>
                                                    {trans.transactionType.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap font-bold text-right ${trans.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {trans.quantity > 0 ? '+' : ''}{parseFloat(trans.quantity.toFixed(3))} <span className="text-xs font-normal ml-0.5">{getItemUnit(trans)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="font-medium text-gray-900">${(trans.totalCost || 0).toFixed(2)}</div>
                                                <div className="text-xs text-gray-400">@ ${(trans.unitCost || 0).toFixed(2)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 font-mono">
                                                {parseFloat(trans.newStock.toFixed(3))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {trans.performedBy}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={trans.reason}>
                                                {trans.reason || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Consumed</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {loading ? (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">Calculating usage...</td></tr>
                                ) : paginatedUsage.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No usage recorded yet.</td></tr>
                                ) : (
                                    paginatedUsage.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-orange-600">
                                                {item.quantity.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-600">
                                                ${item.cost.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* Pagination Footer */}
                {((activeTab === 'history' && totalHistoryPages > 1) || (activeTab === 'usage' && totalUsagePages > 1)) && !loading && (
                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-medium">{(activeTab === 'history' ? currentPageHistory : currentPageUsage) * ITEMS_PER_PAGE - ITEMS_PER_PAGE + 1}</span> to{' '}
                            <span className="font-medium">
                                {Math.min((activeTab === 'history' ? currentPageHistory : currentPageUsage) * ITEMS_PER_PAGE, activeTab === 'history' ? transactions.length : usageSummary.length)}
                            </span>{' '}
                            of <span className="font-medium">{activeTab === 'history' ? transactions.length : usageSummary.length}</span> results
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => activeTab === 'history' ? setCurrentPageHistory(p => Math.max(1, p - 1)) : setCurrentPageUsage(p => Math.max(1, p - 1))}
                                disabled={(activeTab === 'history' ? currentPageHistory : currentPageUsage) === 1}
                                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
                            >
                                <ChevronLeftIcon className="w-4 h-4 mr-1" /> Prev
                            </button>
                            <button
                                onClick={() => activeTab === 'history' ? setCurrentPageHistory(p => Math.min(totalHistoryPages, p + 1)) : setCurrentPageUsage(p => Math.min(totalUsagePages, p + 1))}
                                disabled={(activeTab === 'history' ? currentPageHistory : currentPageUsage) === (activeTab === 'history' ? totalHistoryPages : totalUsagePages)}
                                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
                            >
                                Next <ChevronRightIcon className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
