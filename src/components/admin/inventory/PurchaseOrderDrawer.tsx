import React, { useState, useEffect } from 'react';
import type { PurchaseOrder, Supplier, InventoryItem } from '@/lib/firestoreService';
import { createPurchaseOrder, updatePurchaseOrder } from '@/lib/inventoryService';
import Drawer from '@/components/ui/Drawer';
import { PlusIcon, TrashIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import { Timestamp } from 'firebase/firestore';

interface PurchaseOrderDrawerProps {
    po: PurchaseOrder | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    suppliers: Supplier[];
    inventoryItems: InventoryItem[];
}

interface POLineItem {
    itemId: string;
    description: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
}

export default function PurchaseOrderDrawer({ po, isOpen, onClose, onSave, suppliers, inventoryItems }: PurchaseOrderDrawerProps) {
    const { showToast } = useToast();
    const [supplierId, setSupplierId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lineItems, setLineItems] = useState<POLineItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Load / Reset
    useEffect(() => {
        if (po) {
            setSupplierId(po.supplierId);
            setExpectedDate(po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : '');
            setNotes(po.notes || '');
            // Map existing items if structure matches, otherwise start empty or need migration logic
            // Assuming simple structure for now or manual add
            setLineItems(po.items?.map(i => ({
                itemId: i.itemId,
                description: i.itemName,
                quantity: i.quantity,
                unitCost: i.unitCost,
                totalCost: i.totalCost
            })) || []);
        } else {
            resetForm();
        }
    }, [po, isOpen]);

    const resetForm = () => {
        setSupplierId('');
        setExpectedDate('');
        setNotes('');
        setLineItems([]);
    };

    const handleAddItem = () => {
        setLineItems([...lineItems, { itemId: '', description: '', quantity: 1, unitCost: 0, totalCost: 0 }]);
    };

    const handleUpdateItem = (index: number, field: keyof POLineItem, value: any) => {
        const newItems = [...lineItems];
        const item = newItems[index];

        if (field === 'itemId') {
            const selectedInvItem = inventoryItems.find(i => i.id === value);
            item.itemId = value;
            item.description = selectedInvItem ? selectedInvItem.name : '';
            item.unitCost = selectedInvItem ? selectedInvItem.unitCost : 0;
        } else {
            (item as any)[field] = value;
        }

        // Auto-calc total
        item.totalCost = item.quantity * item.unitCost;
        setLineItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const calculateGrandTotal = () => {
        return lineItems.reduce((sum, item) => sum + item.totalCost, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || lineItems.length === 0) {
            showToast("Please select a supplier and add at least one item", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const supplier = suppliers.find(s => s.id === supplierId);
            const poData: Partial<PurchaseOrder> = {
                supplierId,
                supplierName: supplier?.name || 'Unknown',
                status: po ? po.status : 'draft',
                items: lineItems.map(i => ({
                    itemId: i.itemId,
                    itemName: i.description,
                    quantity: i.quantity,
                    unitCost: i.unitCost,
                    totalCost: i.totalCost
                })),
                totalAmount: calculateGrandTotal(),
                expectedDeliveryDate: expectedDate ? new Date(expectedDate) as any : null, // Cast for Firestore compat
                notes
            };

            if (po) {
                await updatePurchaseOrder(po.id, poData);
                showToast("Purchase Order updated", "success");
            } else {
                await createPurchaseOrder(poData);
                showToast("Purchase Order created", "success");
            }
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Failed to save Purchase Order", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={po ? `Edit PO: ${po.poNumber}` : 'New Purchase Order'}
            size="2xl"
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className="text-lg font-bold text-gray-900">
                        Total: <span className="text-[#FF6A00]">${calculateGrandTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            type="button"
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-[#FF6A00] text-white rounded-lg font-bold hover:bg-[#FF6A00]/90 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : (po ? 'Update Order' : 'Create Order')}
                        </button>
                    </div>
                </div>
            }
        >
            <form className="space-y-8">
                {/* Supplier & Details */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Supplier</label>
                        <select
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] bg-white transition-all shadow-sm"
                        >
                            <option value="">Select Supplier...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Expected Delivery</label>
                        <input
                            type="date"
                            value={expectedDate}
                            onChange={(e) => setExpectedDate(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] bg-white transition-all shadow-sm"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Delivery instructions, reference numbers, etc."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all shadow-sm resize-none"
                        />
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Order Items</h3>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="text-xs flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Item
                        </button>
                    </div>

                    <div className="space-y-3">
                        {lineItems.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-400">
                                <CalculatorIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No items added yet.</p>
                                <button type="button" onClick={handleAddItem} className="text-[#FF6A00] font-bold text-sm hover:underline mt-2">Add your first item</button>
                            </div>
                        ) : (
                            lineItems.map((item, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-gray-300">
                                    <div className="flex-1 w-full">
                                        <select
                                            value={item.itemId}
                                            onChange={(e) => handleUpdateItem(index, 'itemId', e.target.value)}
                                            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00]"
                                        >
                                            <option value="">Select Item...</option>
                                            {inventoryItems.map(inv => (
                                                <option key={inv.id} value={inv.id}>{inv.name} (Current: {inv.currentStock})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] text-center font-semibold"
                                        />
                                    </div>
                                    <div className="w-28 relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Cost"
                                            value={item.unitCost}
                                            onChange={(e) => handleUpdateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                            className="w-full text-sm pl-5 pr-2 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00]"
                                        />
                                    </div>
                                    <div className="w-24 text-right font-bold text-gray-700 text-sm">
                                        ${item.totalCost.toFixed(2)}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </form>
        </Drawer>
    );
}
