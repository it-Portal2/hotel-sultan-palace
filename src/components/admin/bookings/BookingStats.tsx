import React from 'react';
import {
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    HomeModernIcon
} from '@heroicons/react/24/outline';

interface BookingStatsProps {
    stats: {
        total: number;
        pending: number;
        confirmed: number;
        cancelled: number;
        walk_in: number;
        arrivals: number;
        departures: number;
        in_house: number;
    };
    activeFilter?: string;
    onFilterClick?: (type: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'arrivals' | 'departures' | 'in_house') => void;
}

export default function BookingStats({ stats, activeFilter = 'all', onFilterClick }: BookingStatsProps) {
    if (!stats) return null;

    const getCardStyle = (type: string, baseColor: 'indigo' | 'orange' | 'emerald' | 'gray' | 'amber' | 'blue' | 'red') => {
        const isActive = activeFilter === type;
        const colorClasses = {
            indigo: isActive ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-white hover:border-indigo-300',
            orange: isActive ? 'ring-2 ring-orange-500 bg-orange-50' : 'bg-white hover:border-orange-300',
            emerald: isActive ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'bg-white hover:border-emerald-300',
            gray: isActive ? 'ring-2 ring-gray-400 bg-gray-50' : 'bg-white hover:border-gray-300',
            amber: isActive ? 'ring-2 ring-amber-500 bg-amber-50' : 'bg-white hover:border-amber-300',
            blue: isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:border-blue-300',
            red: isActive ? 'ring-2 ring-red-500 bg-red-50' : 'bg-white hover:border-red-300',
        };
        return `${colorClasses[baseColor]} p-5 rounded-xl shadow-sm border border-${baseColor}-100 flex items-center justify-between group transition-all relative overflow-hidden cursor-pointer`;
    };

    const getMiniCardStyle = (type: string, baseColor: 'gray' | 'amber' | 'blue' | 'red') => {
        const isActive = activeFilter === type;
        return `${isActive ? 'ring-2 ring-offset-1' : ''} bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-center cursor-pointer hover:shadow-md transition-all`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
            {/* Left: Operations Cockpit (Arrivals, Departures, In-House) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Arrivals */}
                <div
                    onClick={() => onFilterClick?.('arrivals')}
                    className={getCardStyle('arrivals', 'indigo')}
                >
                    <div className="absolute right-0 top-0 h-full w-1.5 bg-indigo-500 rounded-l"></div>
                    <div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Arrivals</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-extrabold text-indigo-900">{stats.arrivals}</p>
                            <p className="text-xs text-indigo-400 font-medium">Expected</p>
                        </div>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                        <ArrowRightOnRectangleIcon className="h-7 w-7 text-indigo-600" />
                    </div>
                </div>

                {/* Departures */}
                <div
                    onClick={() => onFilterClick?.('departures')}
                    className={getCardStyle('departures', 'orange')}
                >
                    <div className="absolute right-0 top-0 h-full w-1.5 bg-orange-500 rounded-l"></div>
                    <div>
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Departures</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-extrabold text-orange-900">{stats.departures}</p>
                            <p className="text-xs text-orange-400 font-medium">Leaving</p>
                        </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-full group-hover:bg-orange-100 transition-colors">
                        <ArrowLeftOnRectangleIcon className="h-7 w-7 text-orange-600" />
                    </div>
                </div>

                {/* In House */}
                <div
                    onClick={() => onFilterClick?.('in_house')}
                    className={getCardStyle('in_house', 'emerald')}
                >
                    <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-500 rounded-l"></div>
                    <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">In House</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-extrabold text-emerald-900">{stats.in_house}</p>
                            <p className="text-xs text-emerald-400 font-medium">Occupied</p>
                        </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors">
                        <HomeModernIcon className="h-7 w-7 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Right: Status Summary (Mini Cards) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                <div
                    onClick={() => onFilterClick?.('all')}
                    className={getMiniCardStyle('all', 'gray')}
                >
                    <p className="text-[10px] uppercase font-bold text-gray-400">Total Bookings</p>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xl font-bold text-gray-900">{stats.total}</span>
                        <ClipboardDocumentListIcon className="h-4 w-4 text-gray-300" />
                    </div>
                </div>

                <div
                    onClick={() => onFilterClick?.('pending')}
                    className={getMiniCardStyle('pending', 'amber')}
                >
                    <p className="text-[10px] uppercase font-bold text-gray-400">Pending</p>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xl font-bold text-amber-600">{stats.pending}</span>
                        <ClockIcon className="h-4 w-4 text-amber-200" />
                    </div>
                </div>

                <div
                    onClick={() => onFilterClick?.('confirmed')}
                    className={getMiniCardStyle('confirmed', 'blue')}
                >
                    <p className="text-[10px] uppercase font-bold text-gray-400">Confirmed</p>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xl font-bold text-blue-600">{stats.confirmed}</span>
                        <CheckCircleIcon className="h-4 w-4 text-blue-200" />
                    </div>
                </div>

                <div
                    onClick={() => onFilterClick?.('cancelled')}
                    className={getMiniCardStyle('cancelled', 'red')}
                >
                    <p className="text-[10px] uppercase font-bold text-gray-400">Cancelled</p>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xl font-bold text-red-600">{stats.cancelled}</span>
                        <XCircleIcon className="h-4 w-4 text-red-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}
