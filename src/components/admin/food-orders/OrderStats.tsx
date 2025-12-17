import React from 'react';
import {
    ClipboardDocumentCheckIcon,
    ClockIcon,
    CheckCircleIcon,
    ShoppingBagIcon
} from '@heroicons/react/24/outline';

interface OrderStatsProps {
    stats: {
        total: number;
        pending: number;
        delivered: number;
    };
}

export default function OrderStats({ stats }: OrderStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
                </div>
            </div>

            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Pending Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-50 group-hover:bg-yellow-100 transition-colors">
                    <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
            </div>

            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Delivered</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.delivered}</p>
                </div>
                <div className="p-3 bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                    <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                </div>
            </div>
        </div>
    );
}
