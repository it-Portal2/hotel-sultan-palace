"use client";

import React, { useState, useEffect } from 'react';
import {
    ArchiveBoxIcon,
    PlusIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { LostFoundItem, getLostFoundItems } from '@/lib/firestoreService';
import LostFoundDrawer from '@/components/admin/lost-found/LostFoundDrawer';

export default function LostFoundPage() {
    const [items, setItems] = useState<LostFoundItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'lost' | 'found' | 'returned' | 'discarded'>('all');
    const [search, setSearch] = useState('');

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
    const [drawerType, setDrawerType] = useState<'lost' | 'found'>('lost');

    const loadData = async () => {
        setLoading(true);
        try {
            // Seed rooms if needed
            const data = await getLostFoundItems();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredItems = items.filter(item => {
        if (filter !== 'all' && item.status !== filter) return false;
        if (search && !item.itemName.toLowerCase().includes(search.toLowerCase()) && !item.guestName?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const handleCreateLost = () => {
        setSelectedItem(null);
        setDrawerType('lost');
        setIsDrawerOpen(true);
    };

    const handleCreateFound = () => {
        setSelectedItem(null);
        setDrawerType('found');
        setIsDrawerOpen(true);
    };

    const handleEdit = (item: LostFoundItem) => {
        setSelectedItem(item);
        setIsDrawerOpen(true);
    };

    return (
        <div className="space-y-6 pb-20 p-6 w-full animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <ArchiveBoxIcon className="h-8 w-8 text-[#FF6A00]" />
                        Lost & Found
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage lost and found items, status, and returns.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreateLost}
                        className="flex items-center gap-2 bg-white text-red-600 border border-red-200 px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-red-50 transition-all rounded-sm uppercase tracking-wide"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Lost Item
                    </button>
                    <button
                        onClick={handleCreateFound}
                        className="flex items-center gap-2 bg-[#FF6A00] text-white px-5 py-2.5 text-sm font-bold shadow hover:shadow-md hover:bg-[#E55F00] transition-all rounded-sm uppercase tracking-wide"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Found Item
                    </button>
                </div>
            </div>

            {/* Filters & Search - Sharp */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b border-gray-200 pb-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                    {['all', 'lost', 'found', 'returned', 'discarded'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status as any)}
                            className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${filter === status
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-transparent border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-gray-900 placeholder:text-gray-400 font-medium transition-colors rounded-none focus:ring-0"
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-2 top-2.5" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto min-h-[500px] rounded-none">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Item Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Color</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Found By / Guest</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading items...</td>
                            </tr>
                        ) : filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No items found.</td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wide border
                                                ${item.status === 'lost' ? 'bg-red-50 text-red-700 border-red-200' :
                                                item.status === 'found' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    item.status === 'returned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                        {item.lostDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {item.itemName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.itemColor || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.lostLocation || item.currentLocation || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.roomName || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.status === 'lost' ? (
                                            <span className="flex flex-col">
                                                <span className="font-medium text-gray-900">{item.guestName}</span>
                                                <span className="text-xs text-gray-400">{item.guestPhone}</span>
                                            </span>
                                        ) : (
                                            <span className="font-medium text-gray-900">{item.foundBy}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-[#FF6A00] hover:text-[#E55F00] font-bold uppercase text-xs tracking-wide"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <LostFoundDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                item={selectedItem}
                type={drawerType}
                onSave={loadData}
            />
        </div>
    );
}
