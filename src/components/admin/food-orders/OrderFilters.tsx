import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface OrderFiltersProps {
    query: string;
    setQuery: (q: string) => void;
    status: string;
    setStatus: (s: string) => void;
}

export default function OrderFilters({ query, setQuery, status, setStatus }: OrderFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" />
                <input
                    type="text"
                    placeholder="Search by order #, guest, or room..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none shadow-sm transition-all"
                />
            </div>
            <div className="relative min-w-[200px]">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none shadow-sm appearance-none cursor-pointer hover:bg-gray-50 transition-colors text-sm"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
        </div>
    );
}
