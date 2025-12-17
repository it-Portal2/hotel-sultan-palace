import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface HousekeepingFiltersProps {
    query: string;
    setQuery: (q: string) => void;
    status: string;
    setStatus: (s: string) => void;
    priority: string;
    setPriority: (p: string) => void;
}

export default function HousekeepingFilters({ query, setQuery, status, setStatus, priority, setPriority }: HousekeepingFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" />
                <input
                    type="text"
                    placeholder="Search room, task type, or staff..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0 shadow-sm transition-all"
                />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-1 sm:pb-0">
                <div className="relative min-w-[140px]">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0 shadow-sm appearance-none cursor-pointer hover:bg-gray-50 transition-colors text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div className="relative min-w-[140px]">
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full pl-4 pr-8 py-3 bg-white border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0 shadow-sm appearance-none cursor-pointer hover:bg-gray-50 transition-colors text-sm"
                    >
                        <option value="all">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
