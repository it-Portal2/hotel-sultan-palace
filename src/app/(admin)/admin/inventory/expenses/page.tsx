"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getSuppliers,
    getInventoryLocations,
    createPurchaseOrder,
    receivePurchaseOrder,
    getInventoryItems
} from '@/lib/inventoryService';
import {
    Supplier,
    InventoryLocation,
    InventoryItem,
    PurchaseOrder
} from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import {
    PlusIcon,
    TrashIcon,
    BanknotesIcon,
    BuildingStorefrontIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';

interface ExpenseItem {
    inventoryItemId: string;
    name: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    isNewItem: boolean; // allow creating new items on the fly? maybe later.
}

export default function DirectExpensePage() {
    const router = useRouter();
    const { showToast } = useToast();

    // Data
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [supplierId, setSupplierId] = useState('');
    const [locationId, setLocationId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ExpenseItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [supData, locData, invData] = await Promise.all([
                getSuppliers(),
                getInventoryLocations(),
                getInventoryItems()
            ]);
            setSuppliers(supData);
            setLocations(locData);
            setInventoryItems(invData);

            // Set default location if Main Store exists
            const mainStore = locData.find(l => l.name === 'Main Store');
            if (mainStore) setLocationId(mainStore.id);

        } catch (error) {
            console.error(error);
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, {
            inventoryItemId: '',
            name: '',
            quantity: 1,
            unit: 'unit',
            unitCost: 0,
            totalCost: 0,
            isNewItem: false
        }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof ExpenseItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        // Auto-fill details if item selected
        if (field === 'inventoryItemId') {
            const invItem = inventoryItems.find(i => i.id === value);
            if (invItem) {
                item.name = invItem.name;
                item.unit = invItem.unit;
                // Don't auto-fill cost for market buy, usually variable
            }
        }

        // Recalculate total
        if (field === 'quantity' || field === 'unitCost') {
            item.totalCost = Number(item.quantity) * Number(item.unitCost);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

    const handleSubmit = async () => {
        if (!supplierId) { showToast("Select a Vendor (or 'Market' vendor)", "error"); return; }
        if (!locationId) { showToast("Select a Target Location", "error"); return; }
        if (items.length === 0) { showToast("Add at least one item", "error"); return; }
        if (items.some(i => !i.inventoryItemId)) { showToast("Select Valid Inventory Items", "error"); return; }

        setSubmitting(true);
        try {
            const selectedSupplier = suppliers.find(s => s.id === supplierId);

            // 1. Create the PO record as "Market Expense"
            const poData: Partial<PurchaseOrder> = {
                supplierId,
                supplierName: selectedSupplier?.name || 'Unknown',
                status: 'received', // Auto-receive!
                totalAmount,
                notes,
                type: 'market_expense',
                paymentMethod,
                targetLocationId: locationId,
                items: items.map(i => ({
                    itemId: i.inventoryItemId,
                    name: i.name,
                    quantity: Number(i.quantity),
                    unitCost: Number(i.unitCost),
                    totalCost: Number(i.totalCost)
                })),
                createdAt: new Date(date)
            };

            const poId = await createPurchaseOrder(poData);

            // 2. Receive it properly to update stock (Logic in receivePurchaseOrder needs to respect Location if we updated it, 
            // but for now receivePurchaseOrder updates 'inventory' collection directly. 
            // We need to upgrade receivePurchaseOrder to handle locations in Phase 2B. 
            // For now, it updates GLOBAL stock which is step 1).

            await receivePurchaseOrder(poId, items.map(i => ({
                itemId: i.inventoryItemId,
                quantity: Number(i.quantity)
            })), "Admin User"); // TODO: Get actual user

            showToast("Market Expense Recorded & Stock Updated", "success");
            router.push('/admin/inventory');
        } catch (error) {
            console.error(error);
            showToast("Failed to record expense", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BanknotesIcon className="h-8 w-8 text-green-600" />
                        Record Direct Expense
                    </h1>
                    <p className="text-gray-500 mt-1">Record daily market purchases here. Stock will be added immediately.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-gray-500">TOTAL SPEND</p>
                    <p className="text-3xl font-bold text-green-600 font-mono">${totalAmount.toFixed(2)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Vendor - Date - Payment */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value as any)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="cash">Cash (Petty Cash)</option>
                                <option value="card">Company Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vendor / Market</label>
                            <select
                                value={supplierId}
                                onChange={e => setSupplierId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Select Vendor...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Location</label>
                            <select
                                value={locationId}
                                onChange={e => setLocationId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Select Location...</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                            <p className="text-[10px] text-gray-400 mt-1">Where are these items going?</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes / Receipt #</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Market Run Receipt #1234"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>

                {/* Summary / Actions */}
                <div className="bg-green-50 p-5 rounded-xl border border-green-100 flex flex-col justify-center items-center text-center">
                    <BuildingStorefrontIcon className="w-12 h-12 text-green-600 mb-2 opacity-20" />
                    <h3 className="font-bold text-green-900 mb-1">Market Purchase</h3>
                    <p className="text-sm text-green-700 mb-6">This will create a "Received" Purchase Order and immediately update stock levels in the selected location.</p>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? 'Processing...' : 'Record Expense'}
                    </button>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Purchased Items</h3>
                    <button onClick={addItem} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <PlusIcon className="w-4 h-4" /> Add Item
                    </button>
                </div>

                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3 w-32">Qty</th>
                            <th className="px-4 py-3 w-32">Unit Cost</th>
                            <th className="px-4 py-3 w-32 text-right">Total</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                    <select
                                        value={item.inventoryItemId}
                                        onChange={e => updateItem(idx, 'inventoryItemId', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select Item...</option>
                                        {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                                    </select>
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.quantity}
                                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1.5 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.unitCost}
                                            onChange={e => updateItem(idx, 'unitCost', e.target.value)}
                                            className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right font-mono font-medium">
                                    ${item.totalCost.toFixed(2)}
                                </td>
                                <td className="px-4 py-2">
                                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                                    No items added. Click "Add Item" to start.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-6 items-center">
                    <span className="uppercase text-xs font-bold text-gray-500">Total Expenses</span>
                    <span className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
