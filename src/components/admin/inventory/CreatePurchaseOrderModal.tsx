import React, { useState, useEffect } from 'react';
import { getSuppliers, createPurchaseOrder } from '@/lib/inventoryService';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Supplier, InventoryItem } from '@/lib/firestoreService';
import { XMarkIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

interface CreatePurchaseOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface POItemRow {
    itemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
}

export default function CreatePurchaseOrderModal({ isOpen, onClose, onSuccess }: CreatePurchaseOrderModalProps) {
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
        if (isOpen) {
            loadData();
            setItems([]);// Reset items on open
            setSelectedSupplierId('');
            setNotes('');
        }
    }, [isOpen]);

    const loadData = async () => {
        if (!db) return;
        setLoading(true);
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
        setItems([...items, { itemId: '', itemName: '', quantity: 1, unitCost: 0, totalCost: 0 }]);
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
            }
        }

        // Recalculate totals
        if (field === 'quantity' || field === 'unitCost' || field === 'itemId') {
            item.totalCost = item.quantity * item.unitCost;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!selectedSupplierId) newErrors.supplierId = "Supplier is required";

        if (items.length === 0) {
            newErrors.items = "At least one item is required";
        } else {
            items.forEach((item, index) => {
                if (!item.itemId) newErrors[`items.${index}.itemId`] = "Item is required";
                if (item.quantity <= 0) newErrors[`items.${index}.quantity`] = "Quantity must be > 0";
                if (item.unitCost < 0) newErrors[`items.${index}.unitCost`] = "Cost cannot be negative";
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.totalCost, 0);
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast("Please fix the validation errors", "error");
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
                    totalCost: Number(i.totalCost)
                })),
                totalAmount: calculateTotal(), // + Tax if needed
                notes,
                createdBy: 'Admin' // Should be user ID
            });

            showToast("Purchase Order created", "success");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Failed to create PO", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 backdrop-blur-xl z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">New Purchase Order</h2>
                        <p className="text-sm text-gray-500 mt-1">Create a new replenishment order.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6A00]"></div>
                        </div>
                    ) : (
                        <>
                            {/* Supplier Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier</label>
                                <select
                                    value={selectedSupplierId}
                                    onChange={e => {
                                        setSelectedSupplierId(e.target.value);
                                        if (errors.supplierId) {
                                            const newErrors = { ...errors };
                                            delete newErrors.supplierId;
                                            setErrors(newErrors);
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:border-[#FF6A00] focus:ring-0 bg-white ${errors.supplierId ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {errors.supplierId && <p className="text-xs text-red-500 mt-1">{errors.supplierId}</p>}
                            </div>

                            {/* Items Table */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Order Items</label>
                                    <button
                                        onClick={addItem}
                                        type="button"
                                        className="flex items-center gap-1 text-sm text-[#FF6A00] font-bold hover:text-[#e55f00]"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add Item
                                    </button>
                                </div>
                                {errors.items && <p className="text-xs text-red-500 mb-2">{errors.items}</p>}

                                <div className="space-y-2">
                                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2 uppercase tracking-wider">
                                        <div className="col-span-5">Item</div>
                                        <div className="col-span-2">Quantity</div>
                                        <div className="col-span-2">Unit Cost</div>
                                        <div className="col-span-2">Total</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {items.map((row, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 border border-gray-100 hover:border-gray-200 transition-colors">
                                            <div className="col-span-5">
                                                <select
                                                    value={row.itemId}
                                                    onChange={e => updateItem(index, 'itemId', e.target.value)}
                                                    className={`w-full text-sm bg-transparent border-none focus:ring-0 p-0 font-medium ${errors[`items.${index}.itemId`] ? 'text-red-500' : 'text-gray-900'}`}
                                                >
                                                    <option value="">Select Item...</option>
                                                    {inventoryItems.map(i => (
                                                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                                    ))}
                                                </select>
                                                {errors[`items.${index}.itemId`] && <p className="text-[10px] text-red-500">Required</p>}
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={row.quantity}
                                                    onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                                                    className={`w-full text-sm bg-transparent border-b focus:border-[#FF6A00] outline-none py-1 ${errors[`items.${index}.quantity`] ? 'border-red-500 text-red-500' : 'border-gray-300'}`}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={row.unitCost}
                                                    onChange={e => updateItem(index, 'unitCost', Number(e.target.value))}
                                                    className={`w-full text-sm bg-transparent border-b focus:border-[#FF6A00] outline-none py-1 ${errors[`items.${index}.unitCost`] ? 'border-red-500 text-red-500' : 'border-gray-300'}`}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="col-span-2 text-sm font-bold text-gray-900">
                                                ${row.totalCost.toFixed(2)}
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-1">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {items.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 bg-gray-50 border border-dashed border-gray-300">
                                            No items added. Click + Add Item to start.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0 resize-none"
                                    placeholder="Optional notes for this order..."
                                />
                            </div>

                            {/* Footer / Totals */}
                            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center pt-4 border-t border-gray-100 gap-4">
                                <div className="text-right sm:text-left">
                                    <div className="text-sm text-gray-500">Total Amount</div>
                                    <div className="text-3xl font-bold text-gray-900">${calculateTotal().toFixed(2)}</div>
                                </div>

                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="flex-1 sm:flex-none bg-[#FF6A00] text-white px-8 py-3 font-bold hover:bg-[#FF6A00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {saving ? 'Creating...' : 'Create Purchase Order'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
