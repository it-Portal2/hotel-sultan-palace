import React, { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { createStockAdjustment } from '@/lib/inventoryService';
import type { InventoryItem } from '@/lib/firestoreService';
import { ArrowPathIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

interface StockAdjustmentsTabProps {
    items: InventoryItem[];
    onRefresh: () => void;
}

export default function StockAdjustmentsTab({ items, onRefresh }: StockAdjustmentsTabProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        itemId: '',
        quantity: 0,
        type: 'usage' as 'usage' | 'waste' | 'adjustment' | 'transfer_in' | 'transfer_out',
        reason: '',
        department: 'Kitchen'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Determine sign based on type
            // usage, waste, transfer_out = negative
            // transfer_in = positive
            // adjustment = direct input (can be +/-) but let's assume UI handles sign or asks for "New Count"?
            // For simplicity, let's treat "quantity" as the absolute amount and apply sign here.

            let finalQuantity = Math.abs(formData.quantity);
            if (['usage', 'waste', 'transfer_out'].includes(formData.type)) {
                finalQuantity = -finalQuantity;
            }

            const reasonWithDept = `[${formData.department}] ${formData.reason}`;

            await createStockAdjustment(
                formData.itemId,
                finalQuantity,
                formData.type,
                reasonWithDept,
                'Admin User' // Replace with actual user name from context if available
            );

            showToast("Stock adjustment recorded successfully", "success");
            setFormData({ itemId: '', quantity: 0, type: 'usage', reason: '', department: 'Kitchen' });
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to record adjustment", "error");
        } finally {
            setLoading(false);
        }
    };

    const selectedItem = items.find(i => i.id === formData.itemId);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-6 h-6 text-[#FF6A00]" />
                        New Stock Adjustment
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Record internal usage, spoilage, breakage, or manual stock corrections.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Item Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
                            <select
                                required
                                value={formData.itemId}
                                onChange={e => setFormData({ ...formData, itemId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0 bg-white"
                            >
                                <option value="">-- Choose Item --</option>
                                {items.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} (Current: {item.currentStock} {item.unit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Adjustment Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                            <select
                                required
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0 bg-white"
                            >
                                <option value="usage">Internal Usage (Reduce Stock)</option>
                                <option value="waste">Spoilage / Waste (Reduce Stock)</option>
                                <option value="transfer_in">Transfer In (Add Stock)</option>
                                <option value="transfer_out">Transfer Out (Reduce Stock)</option>
                                <option value="adjustment">Count Correction (Add/Remove)</option>
                            </select>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity
                                {selectedItem && <span className="text-gray-500 font-normal"> ({selectedItem.unit})</span>}
                            </label>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                value={formData.quantity || ''}
                                onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0"
                            />
                            {selectedItem && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                                </p>
                            )}
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select
                                required
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0 bg-white"
                            >
                                <option value="Kitchen">Kitchen</option>
                                <option value="Bar">Bar</option>
                                <option value="Housekeeping">Housekeeping</option>
                                <option value="Front Office">Front Office</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Spa">Spa</option>
                            </select>
                        </div>

                        {/* Reason */}
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
                            <textarea
                                required
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0"
                                placeholder="Describe why this adjustment is being made..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={loading || !formData.itemId}
                            className={`flex items-center gap-2 px-6 py-2 text-white font-medium transition-colors ${loading || !formData.itemId
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[#FF6A00] hover:bg-[#FF6A00]/90'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Submit Adjustment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
