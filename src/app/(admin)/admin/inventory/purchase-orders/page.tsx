"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import CreatePurchaseOrderModal from '@/components/admin/inventory/CreatePurchaseOrderModal';
import { db } from '@/lib/firebase';
import type { PurchaseOrder } from '@/lib/firestoreService';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        if (!db) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'purchaseOrders'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseOrder)));
        } catch (error) {
            console.error(error);
            showToast("Failed to load POs", "error");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-700';
            case 'ordered': return 'bg-blue-100 text-blue-700'; // Fixed from 'sent'
            case 'received': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                    <p className="text-gray-500">Manage procurement and stock replenishment.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-[#FF6A00] text-white px-4 py-2 hover:bg-[#FF6A00]/90 transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Purchase Order
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map(po => (
                                <tr key={po.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {po.poNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {po.supplierName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                        {po.createdAt ? new Date((po.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                        {po.items.length} items
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        ${po.totalAmount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold ${getStatusColor(po.status)}`}>
                                            {po.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-3">
                                        {/* In real app, View details page */}
                                        <button className="text-blue-600 hover:text-blue-900">View</button>

                                        {po.status === 'ordered' && (
                                            <button
                                                className="text-green-600 hover:text-green-900 font-medium"
                                                onClick={() => showToast("Receive feature coming soon", "info")}
                                            >
                                                Receive
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No purchase orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <CreatePurchaseOrderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadOrders}
            />
        </div>
    );
}
