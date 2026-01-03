"use client";

import React, { useState, useEffect } from 'react';
import {
    ArchiveBoxIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon
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
        <div className="space-y-6 pb-20 p-6 max-w-[1600px] mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <ArchiveBoxIcon className="h-8 w-8 text-amber-600" />
                        Lost & Found
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage lost and found items, status, and returns.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreateLost}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:bg-red-700 transition-all"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Lost Item
                    </button>
                    <button
                        onClick={handleCreateFound}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:bg-green-700 transition-all"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Found Item
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex items-center gap-2 overflow-x-auto">
                    {['all', 'lost', 'found', 'returned', 'discarded'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === status
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00]"
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location / Room</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Found By / Guest</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading items...</td>
                            </tr>
                        ) : filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No items found.</td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${item.status === 'lost' ? 'bg-red-100 text-red-800' :
                                                item.status === 'found' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.lostDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{item.itemName}</div>
                                        <div className="text-xs text-gray-500">{item.itemColor} • {item.itemValue ? `$${item.itemValue}` : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.lostLocation || item.currentLocation}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.status === 'lost' ? (
                                            <span className="flex flex-col">
                                                <span className="font-medium text-gray-900">{item.guestName}</span>
                                                <span>{item.guestPhone}</span>
                                            </span>
                                        ) : (
                                            <span className="font-medium text-gray-900">{item.foundBy}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-indigo-600 hover:text-indigo-900"
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
