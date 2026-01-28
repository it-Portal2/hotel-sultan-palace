"use client";

import React, { useState, useEffect } from 'react';
import { createPurchaseOrder } from '@/lib/inventoryService';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import CreatePurchaseOrderModal from '@/components/admin/inventory/CreatePurchaseOrderModal';
import { db } from '@/lib/firebase';
import type { PurchaseOrder, InventoryItem } from '@/lib/firestoreService';
import { PlusIcon, ArrowPathIcon, ExclamationCircleIcon, DocumentCheckIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import ReceivePurchaseOrderModal from '@/components/admin/inventory/ReceivePurchaseOrderModal';

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
    const [editPo, setEditPo] = useState<PurchaseOrder | null>(null);

    // Auto-Stock State
    const [checkingStock, setCheckingStock] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    // Check for auto-restock only after orders are loaded to avoid duplicates
    useEffect(() => {
        if (!loading && orders.length >= 0) {
            // Check if we have any pending drafts
            // PREVIOUS LOGIC: blocked if ANY draft existed.
            // NEW LOGIC: We allow the check, but handleAutoRestock will filter out items already in drafts.
            handleAutoRestock(true);
        }
    }, [loading]);

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

    const handleAutoRestock = async (isAuto = false) => {
        if (checkingStock) return;
        setCheckingStock(true);
        try {
            if (!db) return;
            // 1. Find Low Stock Items
            const q = query(collection(db, 'inventory'));
            const snap = await getDocs(q);
            const allItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));

            const lowStockItems = allItems.filter(i => (i.currentStock || 0) <= (i.minStockLevel || 0));

            if (lowStockItems.length === 0) {
                if (!isAuto) showToast("Stock levels are healthy. No reorder needed.", "success");
                return;
            }

            // 2. Filter out items that are ALREADY in a Draft PO
            // We don't want to double-order.
            const existingDrafts = orders.filter(o => o.status === 'draft');
            const itemIdsInDrafts = new Set<string>();
            existingDrafts.forEach(po => {
                po.items.forEach(i => itemIdsInDrafts.add(i.itemId));
            });

            // Only consider items NOT currently in a draft
            const itemsToOrder = lowStockItems.filter(i => !itemIdsInDrafts.has(i.id));

            if (itemsToOrder.length === 0) {
                if (!isAuto) showToast("Low stock items found, but they are already in pending Draft POs.", "success");
                return;
            }

            // 3. Alert User (Only if manual)
            // If auto, we proceed ONLY if we have items to order.
            if (!isAuto) {
                const confirm = window.confirm(`Found ${itemsToOrder.length} low stock items not in any draft. Create a Draft PO?`);
                if (!confirm) return;
            } else {
                // For auto-restock, we might want to be less aggressive OR just notify?
                // User requirement: "Order khud se create kyu nahi hua". They WANT it created.
                // So we will proceed.
            }

            // 4. Create Draft PO
            // NOTE: Ideally we should group by Supplier. For now, creating a single "General" PO or one per supplier?
            // The existing code created a single PO. We'll stick to that simple logic for now, 
            // unless we want to split. Splitting is better but let's match existing pattern first.
            await createPurchaseOrder({
                supplierId: '', // Pending
                supplierName: 'Pending Selection',
                items: itemsToOrder.map(i => ({
                    itemId: i.id,
                    name: i.name,
                    unit: i.unit,
                    quantity: (i.minStockLevel || 10) * 2, // Reorder Quantity
                    unitCost: i.unitCost || 0,
                    totalCost: (i.unitCost || 0) * ((i.minStockLevel || 10) * 2)
                })),
                totalAmount: 0,
                notes: 'Auto-generated Draft based on low stock.',
                createdBy: 'System',
                status: 'draft'
            } as any);

            showToast(`Auto-created Draft PO for ${itemsToOrder.length} items. Please Review.`, "success");
            loadOrders();

        } catch (e) {
            console.error(e);
            if (!isAuto) showToast("Failed to check stock", "error");
        } finally {
            setCheckingStock(false);
        }
    };

    const handleEditClick = (po: PurchaseOrder) => {
        setEditPo(po);
        setIsCreateModalOpen(true);
    };

    const handleReceiveClick = (po: PurchaseOrder) => {
        setSelectedPo(po);
        setIsReceiveModalOpen(true);
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

                <div className="flex gap-3">
                    <button
                        onClick={() => handleAutoRestock(false)}
                        disabled={checkingStock}
                        className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm rounded-lg"
                    >
                        {checkingStock ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                            <ExclamationCircleIcon className="w-5 h-5 text-orange-500" />
                        )}
                        Force Check Stock
                    </button>
                    <button
                        onClick={() => {
                            setEditPo(null);
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-[#FF6A00] text-white px-4 py-2 hover:bg-[#FF6A00]/90 transition-colors shadow-sm rounded-lg"
                    >
                        <PlusIcon className="w-5 h-5" />
                        New Purchase Order
                    </button>
                </div>
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
                                        <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEditClick(po)}>
                                            {po.status === 'draft' ? 'Review & Edit' : 'View'}
                                        </button>

                                        {(po as any).invoiceUrl && (
                                            <button
                                                onClick={() => window.open((po as any).invoiceUrl, '_blank')}
                                                className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                                                title="View Receipt"
                                            >
                                                <PhotoIcon className="w-4 h-4" />
                                            </button>
                                        )}

                                        {po.status === 'ordered' && (
                                            <button
                                                className="text-green-600 hover:text-green-900 font-medium flex items-center gap-1"
                                                onClick={() => handleReceiveClick(po)}
                                            >
                                                <DocumentCheckIcon className="w-4 h-4" />
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
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditPo(null);
                }}
                onSuccess={loadOrders}
                initialData={editPo || undefined}
            />

            <ReceivePurchaseOrderModal
                isOpen={isReceiveModalOpen}
                onClose={() => setIsReceiveModalOpen(false)}
                po={selectedPo}
                onSuccess={() => {
                    loadOrders();
                    setIsReceiveModalOpen(false);
                }}
            />
        </div>
    );
}
