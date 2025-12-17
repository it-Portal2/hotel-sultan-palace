import React from 'react';
import {
    CubeIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import type { InventoryItem } from '@/lib/firestoreService';

interface InventoryOverviewTabProps {
    items: InventoryItem[];
    loading: boolean;
    onNavigateToItems: () => void;
}

export default function InventoryOverviewTab({ items, loading, onNavigateToItems }: InventoryOverviewTabProps) {
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
                <div className="bg-white p-6 shadow-sm border border-gray-100 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Inventory Value</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <ArrowTrendingUpIcon className="w-3 h-3" />
                            +2.5% vs last month
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50">
                        <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 shadow-sm border border-gray-100 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Items (SKUs)</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</h3>
                        <p className="text-xs text-gray-500 mt-2"> across {Object.keys(categoryCount).length} categories</p>
                    </div>
                    <div className="p-3 bg-purple-50">
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

            {/* Low Stock Detailed List */}
            {lowStockItems.length > 0 && (
                <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-orange-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                                Critical Low Stock Items
                            </h3>
                            <p className="text-sm text-gray-500">These items are below their minimum stock level.</p>
                        </div>
                        <button
                            onClick={onNavigateToItems}
                            className="text-sm font-medium text-orange-600 hover:text-orange-700"
                        >
                            View All Inventory →
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500">Item Name</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Current Stock</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Min Level</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {lowStockItems.slice(0, 5).map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-3 text-red-600 font-bold">{item.currentStock} {item.unit}</td>
                                        <td className="px-6 py-3 text-gray-500">{item.minStockLevel} {item.unit}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                                                Restock Now
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
