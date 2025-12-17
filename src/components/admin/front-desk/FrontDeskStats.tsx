import React from 'react';
import { UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline';

interface FrontDeskStatsProps {
    stats: {
        checkInReady: number;
        checkedIn: number;
    };
}

export default function FrontDeskStats({ stats }: FrontDeskStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Arrivals Today</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.checkInReady}</p>
                </div>
                <div className="p-3 bg-blue-50">
                    <UserPlusIcon className="h-8 w-8 text-blue-600" />
                </div>
            </div>

            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">In-House Guests</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.checkedIn}</p>
                </div>
                <div className="p-3 bg-green-50">
                    <UsersIcon className="h-8 w-8 text-green-600" />
                </div>
            </div>
        </div>
    );
}
