import React from 'react';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface BookingFiltersProps {
    query: string;
    setQuery: (q: string) => void;
    status: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'walk_in';
    setStatus: (s: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'walk_in') => void;
    startDate: string;
    setStartDate: (d: string) => void;
    endDate: string;
    setEndDate: (d: string) => void;
    sort: 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';
    setSort: (s: 'newest' | 'oldest' | 'amount_desc' | 'amount_asc') => void;
    onExport: () => void;
}

export default function BookingFilters({
    query,
    setQuery,
    status,
    setStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sort,
    setSort,
    onExport
}: BookingFiltersProps) {
    return (
        <div className="bg-white p-4 shadow-sm border border-gray-100 mb-6 space-y-4 md:space-y-0 md:flex md:flex-col gap-4">
            {/* Search and Export */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative group">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by ID, guest name, or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all outline-none text-sm"
                    />
                </div>
                <button
                    onClick={onExport}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm"
                >
                    <ArrowDownTrayIcon className="h-5 w-5 text-gray-500" />
                    Export CSV
                </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">

                {/* Status Tabs */}
                <div className="flex bg-gray-100 p-1 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {(['all', 'walk_in', 'pending', 'confirmed', 'cancelled'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-4 py-1.5 text-sm font-medium capitalize transition-all whitespace-nowrap ${status === s
                                ? 'bg-white text-[#FF6A00] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                        >
                            {s === 'walk_in' ? 'Walk-in Guest' : s}
                        </button>
                    ))}
                </div>

                {/* Date & Sort */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 border border-gray-200">
                        <span className="text-xs text-gray-500 font-medium uppercase">Date:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none p-0 text-sm text-gray-700 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none p-0 text-sm text-gray-700 focus:ring-0 cursor-pointer"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as any)}
                            className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm pl-3 pr-8 py-2 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="amount_desc">Highest Amount</option>
                            <option value="amount_asc">Lowest Amount</option>
                        </select>
                        <FunnelIcon className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
