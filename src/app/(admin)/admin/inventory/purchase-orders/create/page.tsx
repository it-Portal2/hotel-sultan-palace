"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSuppliers, createPurchaseOrder } from '@/lib/inventoryService';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Supplier, InventoryItem } from '@/lib/firestoreService';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

interface POItemRow {
    itemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    unit: string;
}

export default function CreatePOPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

    // Form State
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [items, setItems] = useState<POItemRow[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!db) return;
        try {
            const [supData, invSnap] = await Promise.all([
                getSuppliers(),
                getDocs(collection(db, 'inventory'))
            ]);
            setSuppliers(supData);
            setInventoryItems(invSnap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
        } catch (error) {
            console.error(error);
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, { itemId: '', itemName: '', quantity: 1, unitCost: 0, totalCost: 0, unit: 'units' }]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof POItemRow, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        // Auto-fill logic
        if (field === 'itemId') {
            const invItem = inventoryItems.find(i => i.id === value);
            if (invItem) {
                item.itemName = invItem.name;
                item.unitCost = invItem.unitCost || 0;
                item.unit = invItem.unit || 'units';
            }
        }

        // Recalculate totals
        if (field === 'quantity' || field === 'unitCost' || field === 'itemId') {
            item.totalCost = item.quantity * item.unitCost;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.totalCost, 0);
    };

    const handleSubmit = async () => {
        if (!selectedSupplierId) {
            showToast("Please select a supplier", "error");
            return;
        }
        if (items.length === 0 || items.some(i => !i.itemId)) {
            showToast("Please add valid items", "error");
            return;
        }

        setSaving(true);
        try {
            const supplier = suppliers.find(s => s.id === selectedSupplierId);

            await createPurchaseOrder({
                supplierId: selectedSupplierId,
                supplierName: supplier?.name || 'Unknown',
                items: items.map(i => ({
                    itemId: i.itemId,
                    name: i.itemName,
                    quantity: Number(i.quantity),
                    unitCost: Number(i.unitCost),
                    totalCost: Number(i.totalCost),
                    unit: i.unit || 'units'
                })),
                totalAmount: calculateTotal(), // + Tax if needed
                notes,
                createdBy: 'Admin' // Should be user ID
            });

            showToast("Purchase Order created", "success");
            router.push('/admin/inventory/purchase-orders');
        } catch (error) {
            console.error(error);
            showToast("Failed to create PO", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/inventory/purchase-orders" className="p-2 -ml-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                {/* Supplier Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier</label>
                    <select
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6A00] outline-none"
                    >
                        <option value="">-- Select Supplier --</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Items Table */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Order Items</label>
                        <button
                            onClick={addItem}
                            type="button"
                            className="text-sm text-[#FF6A00] font-bold hover:text-[#e55f00]"
                        >
                            + Add Item
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
                            <div className="col-span-5">Item</div>
                            <div className="col-span-2">Quantity</div>
                            <div className="col-span-2">Unit Cost</div>
                            <div className="col-span-2">Total</div>
                            <div className="col-span-1"></div>
                        </div>

                        {items.map((row, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                                <div className="col-span-5">
                                    <select
                                        value={row.itemId}
                                        onChange={e => updateItem(index, 'itemId', e.target.value)}
                                        className="w-full text-sm bg-transparent border-none focus:ring-0 p-0"
                                    >
                                        <option value="">Select Item...</option>
                                        {inventoryItems.map(i => (
                                            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={row.quantity}
                                        onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                                        className="w-full text-sm bg-transparent border-b border-gray-300 focus:border-[#FF6A00] outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.unitCost}
                                        onChange={e => updateItem(index, 'unitCost', Number(e.target.value))}
                                        className="w-full text-sm bg-transparent border-b border-gray-300 focus:border-[#FF6A00] outline-none"
                                    />
                                </div>
                                <div className="col-span-2 text-sm font-medium text-gray-900">
                                    ${row.totalCost.toFixed(2)}
                                </div>
                                <div className="col-span-1 text-right">
                                    <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {items.length === 0 && (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                                No items added. Click + Add Item.
                            </div>
                        )}
                    </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <div className="text-right space-y-1">
                        <div className="text-sm text-gray-500">Subtotal</div>
                        <div className="text-2xl font-bold text-gray-900">${calculateTotal().toFixed(2)}</div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-[#FF6A00] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Creating Order...' : 'Create Purchase Order'}
                    </button>
                </div>
            </div>
        </div>
    );
}
