import React, { useState } from 'react';
import type { InventoryItem } from '@/lib/firestoreService';

interface InventoryModalProps {
    item: InventoryItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<InventoryItem>) => void;
}

export default function InventoryModal({
    item,
    isOpen,
    onClose,
    onSave
}: InventoryModalProps) {
    const [formData, setFormData] = useState<Partial<InventoryItem>>(
        item || {
            name: '',
            category: 'food',
            sku: '',
            unit: 'piece',
            currentStock: 0,
            minStockLevel: 0,
            maxStockLevel: 0,
            reorderPoint: 0,
            unitCost: 0,
            isActive: true,
        }
    );

    // Update state when item changes (for edit mode)
    React.useEffect(() => {
        if (item) {
            setFormData(item);
        } else {
            setFormData({
                name: '',
                category: 'food',
                sku: '',
                unit: 'piece',
                currentStock: 0,
                minStockLevel: 0,
                maxStockLevel: 0,
                reorderPoint: 0,
                unitCost: 0,
                isActive: true,
            });
        }
    }, [item]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{item ? 'Edit Item' : 'Add New Item'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                            <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent bg-white"
                            >
                                <option value="food">Food</option>
                                <option value="beverage">Beverage</option>
                                <option value="amenity">Amenity</option>
                                <option value="supply">Supply</option>
                                <option value="linen">Linen</option>
                                <option value="cleaning">Cleaning</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent bg-white"
                            >
                                <option value="kg">Kilogram (kg)</option>
                                <option value="liter">Liter</option>
                                <option value="piece">Piece</option>
                                <option value="bottle">Bottle</option>
                                <option value="box">Box</option>
                                <option value="pack">Pack</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.currentStock}
                                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.unitCost}
                                onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.minStockLevel}
                                onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.maxStockLevel}
                                onChange={(e) => setFormData({ ...formData, maxStockLevel: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.reorderPoint}
                                onChange={(e) => setFormData({ ...formData, reorderPoint: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={formData.location || ''}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <input
                                type="text"
                                value={formData.preferredSupplierId || ''}
                                onChange={(e) => setFormData({ ...formData, preferredSupplierId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors"
                        >
                            {item ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
