import React from 'react';
import {
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

interface BookingStatsProps {
    stats: {
        total: number;
        pending: number;
        confirmed: number;
        cancelled: number;
    };
}

export default function BookingStats({ stats }: BookingStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg group-hover:bg-yellow-100 transition-colors">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
            </div>
        </div>
    );
}
