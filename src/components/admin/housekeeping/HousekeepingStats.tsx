import React from 'react';
import { ClipboardDocumentCheckIcon, ClockIcon, PlayCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface HousekeepingStatsProps {
    stats: {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
    };
}

export default function HousekeepingStats({ stats }: HousekeepingStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-gray-50">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-600" />
                </div>
            </div>

            <div className="bg-white p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-50">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
            </div>

            <div className="bg-white p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
                <div className="p-3 bg-blue-50">
                    <PlayCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
            </div>

            <div className="bg-white p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
                <div className="p-3 bg-green-50">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
            </div>
        </div>
    );
}
