"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    MagnifyingGlassIcon,
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FoodOrder } from '@/lib/firestoreService';

export default function KitchenHistoryPage() {
    const [orders, setOrders] = useState<FoodOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);

        const firestore = db;
        if (!firestore) return;

        const q = query(
            collection(firestore, 'foodOrders'),
            where('createdAt', '>=', startOfDay),
            where('createdAt', '<=', endOfDay),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodOrder));
            setOrders(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [dateFilter]);

    const filteredData = useMemo(() => {
        if (!searchQuery) return orders;
        const lowerQuery = searchQuery.toLowerCase();
        return orders.filter(o =>
            o.orderNumber.toLowerCase().includes(lowerQuery) ||
            o.guestName.toLowerCase().includes(lowerQuery) ||
            (o.roomNumber && o.roomNumber.toLowerCase().includes(lowerQuery))
        );
    }, [orders, searchQuery]);

    const getStatusColor = (status: string) => {
        const colors: any = {
            pending: 'bg-gray-100 text-gray-800',
            received: 'bg-blue-50 text-blue-700',
            cooking: 'bg-orange-50 text-orange-700',
            ready: 'bg-green-50 text-green-700',
            delivered: 'bg-teal-50 text-teal-700',
            completed: 'bg-gray-100 text-gray-600'
        };
        return colors[status] || colors.pending;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* CLEAN HEADER */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between z-20 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                        <ClockIcon className="h-7 w-7 text-gray-600" />
                        Order History
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">
                        Review past orders and performance metrics.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-3 shadow-sm">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none uppercase tracking-wider"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6 w-full mx-auto flex-1 flex flex-col">
                {/* Stats Cards - Quick Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                        <div>
                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Total Orders</div>
                            <div className="text-3xl font-black text-gray-800 mt-1">{orders.length}</div>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
                            <span className="text-xl">📦</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                        <div>
                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Completed</div>
                            <div className="text-3xl font-black text-green-600 mt-1">{orders.filter(o => o.kitchenStatus === 'ready' || o.kitchenStatus === 'delivered').length}</div>
                        </div>
                        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center border border-green-100">
                            <CheckCircleIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                        <div className="relative flex-1 max-w-md">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by Order #, Guest, or Room..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-sm font-medium uppercase tracking-widest">Loading Archives...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                            <ClockIcon className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="font-medium text-gray-500">No orders found.</p>
                            <p className="text-xs mt-1">Try adjusting the date or search query.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Order #</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Guest Details</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Items</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Kitchen Stage</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Final Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredData.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-black text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">
                                                    #{order.orderNumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {order.createdAt ? (order.createdAt as any).toDate?.().toLocaleDateString() : '-'}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                                                        {order.createdAt ? (order.createdAt as any).toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{order.guestName}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                        {order.roomNumber ? `RM ${order.roomNumber}` : 'No Room'}
                                                        {order.deliveryLocation && <span className="text-gray-300">•</span>}
                                                        {order.deliveryLocation?.replace('_', ' ')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs text-sm text-gray-600 leading-snug">
                                                    {order.items.map((i, idx) => (
                                                        <span key={idx} className="block">
                                                            <span className="font-bold text-gray-800">{i.quantity}x</span> {i.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.kitchenStatus || 'pending').replace('bg-', 'border-').replace('text-', 'text-') /* Hacky but works if colors are standard tailwind */} ${getStatusColor(order.kitchenStatus || 'pending')}`}>
                                                    {order.kitchenStatus || 'pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">{order.status.replace('_', ' ')}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
