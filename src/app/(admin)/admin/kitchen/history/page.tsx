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
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ClockIcon className="h-7 w-7 text-gray-600" />
                        Kitchen History
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Archive of all kitchen orders and their statuses.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="text-sm font-medium text-gray-700 focus:outline-none"
                    />
                </div>
            </div>

            {/* Stats Cards - Quick Summary */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Orders</div>
                        <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                    </div>
                    <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center">
                        <span className="text-lg">📦</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Completed</div>
                        <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.kitchenStatus === 'ready' || o.kitchenStatus === 'delivered').length}</div>
                    </div>
                    <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search orders, guests, rooms..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#FF6A00]"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading history...</div>
                ) : filteredData.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">No orders found for this date.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Order #</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Guest</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Kitchen Status</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Order Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600">
                                                {order.createdAt ? (order.createdAt as any).toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{order.guestName}</div>
                                                <div className="text-xs text-gray-500">{order.roomNumber || 'No Room'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs text-sm text-gray-600">
                                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${getStatusColor(order.kitchenStatus || 'pending')}`}>
                                                {order.kitchenStatus || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-400 capitalize">{order.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
