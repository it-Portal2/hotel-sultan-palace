import React, { useEffect, useState } from 'react';
import {
    CubeIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import type { InventoryItem, InventoryTransaction } from '@/lib/firestoreService';
import { getInventoryTransactions } from '@/lib/inventoryService';

interface InventoryOverviewTabProps {
    items: InventoryItem[];
    loading: boolean;
    onNavigateToItems: () => void;
}

export default function InventoryOverviewTab({ items, loading, onNavigateToItems }: InventoryOverviewTabProps) {
    const [recentTransactions, setRecentTransactions] = useState<InventoryTransaction[]>([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            const data = await getInventoryTransactions();
            setRecentTransactions(data.slice(0, 5)); // Top 5
        };
        fetchTransactions();
    }, []);

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading overview...</div>;
    }

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
    const lowStockItems = items.filter(i => i.currentStock <= i.minStockLevel);

    // Calculate category distribution
    const categoryCount: Record<string, number> = {};
    items.forEach(item => {
        const cat = item.category || 'other';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow duration-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Inventory Value</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                            <CurrencyDollarIcon className="w-3 h-3" />
                            Real-time Valuation
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow duration-200">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Items (SKUs)</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</h3>
                        <p className="text-xs text-gray-500 mt-2"> across {Object.keys(categoryCount).length} categories</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <CubeIcon className="w-6 h-6 text-purple-600" />
                    </div>
                </div>

                <div
                    className={`p-6 shadow-sm border flex items-start justify-between cursor-pointer transition-colors ${lowStockItems.length > 0 ? 'bg-orange-50 border-orange-100 hover:bg-orange-100' : 'bg-white border-gray-100'
                        }`}
                    onClick={onNavigateToItems}
                >
                    <div>
                        <p className={`text-sm font-medium ${lowStockItems.length > 0 ? 'text-orange-700' : 'text-gray-500'}`}>
                            Low Stock Alerts
                        </p>
                        <h3 className={`text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-orange-700' : 'text-gray-900'}`}>
                            {lowStockItems.length}
                        </h3>
                        <p className={`text-xs mt-2 ${lowStockItems.length > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                            items need reordering
                        </p>
                    </div>
                    <div className={`p-3 ${lowStockItems.length > 0 ? 'bg-orange-100' : 'bg-gray-50'}`}>
                        <ExclamationTriangleIcon className={`w-6 h-6 ${lowStockItems.length > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions Feed */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ClipboardDocumentListIcon className="w-5 h-5 text-gray-500" />
                            Recent Activity
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((tx) => (
                                <div key={tx.id} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{tx.itemName}</span>
                                        <span className="text-xs text-gray-500 capitalize">
                                            {tx.transactionType.replace('_', ' ')} • {new Date(tx.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-bold ${tx.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-500 text-sm">No recent transactions.</div>
                        )}
                    </div>
                </div>

                {/* Low Stock List (Simplified) */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-orange-50/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                            Critical Stock
                        </h3>
                        <button onClick={onNavigateToItems} className="text-sm text-orange-600 font-medium hover:underline">View All</button>
                    </div>
                    {lowStockItems.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {lowStockItems.slice(0, 5).map(item => (
                                <div key={item.id} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                        <span className="text-xs text-gray-500">Min: {item.minStockLevel}</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-600 flex flex-col items-end">
                                        {item.currentStock} {item.unit}
                                        <span className="text-[10px] text-red-400 font-normal">Current</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500 text-sm">All stock levels are healthy.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
