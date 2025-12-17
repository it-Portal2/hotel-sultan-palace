import React from 'react';
import {
    BuildingOfficeIcon,
    CalendarDaysIcon,
    CurrencyDollarIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

interface StatsOverviewProps {
    totalRooms: number;
    totalBookings: number;
    revenueThisMonth: number;
    revenueTotal: number;
}

export default function StatsOverview({
    totalRooms,
    totalBookings,
    revenueThisMonth,
    revenueTotal
}: StatsOverviewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total Rooms */}
            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Rooms</p>
                    <p className="text-3xl font-bold text-gray-800">{totalRooms}</p>
                </div>
                <div className="p-3 bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </div>

            {/* Total Bookings */}
            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-800">{totalBookings}</p>
                </div>
                <div className="p-3 bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                    <CalendarDaysIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </div>

            {/* Revenue (Month) */}
            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-500 mb-1">Revenue (Month)</p>
                    <p className="text-3xl font-bold text-gray-800">${revenueThisMonth.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-amber-50 group-hover:bg-amber-100 transition-colors">
                    <CurrencyDollarIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </div>

            {/* Total Revenue */}
            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-800">${revenueTotal.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-violet-50 group-hover:bg-violet-100 transition-colors">
                    <ChartBarIcon className="h-6 w-6 text-violet-600" />
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-violet-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </div>
        </div>
    );
}
