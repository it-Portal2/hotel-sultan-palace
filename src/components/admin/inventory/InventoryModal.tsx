import React, { useState } from 'react';
import type { InventoryItem, InventoryCategory } from '@/lib/firestoreService';

interface InventoryModalProps {
    item: InventoryItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<InventoryItem>) => void;
    categories: InventoryCategory[];
}

export default function InventoryModal({
    item,
    isOpen,
    onClose,
    onSave,
    categories
}: InventoryModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        category: categories.length > 0 ? categories[0].name : 'food',
        sku: '',
        unit: 'piece',
        currentStock: '',
        minStockLevel: '',
        maxStockLevel: '',
        reorderPoint: '',
        unitCost: '',
        location: '',
        preferredSupplierId: '',
        isActive: true,
    });

    // Update state when item changes (for edit mode)
    React.useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                category: item.category,
                sku: item.sku,
                unit: item.unit,
                currentStock: item.currentStock.toString(),
                minStockLevel: item.minStockLevel.toString(),
                maxStockLevel: item.maxStockLevel.toString(),
                reorderPoint: item.reorderPoint.toString(),
                unitCost: item.unitCost.toString(),
                location: item.location || '',
                preferredSupplierId: item.preferredSupplierId || '',
                isActive: item.isActive,
            });
        } else {
            setFormData({
                name: '',
                category: categories.length > 0 ? categories[0].name : 'food',
                sku: '',
                unit: 'piece',
                currentStock: '',
                minStockLevel: '',
                maxStockLevel: '',
                reorderPoint: '',
                unitCost: '',
                location: '',
                preferredSupplierId: '',
                isActive: true,
            });
        }
    }, [item, categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            unit: formData.unit as any,
            currentStock: parseFloat(formData.currentStock) || 0,
            minStockLevel: parseFloat(formData.minStockLevel) || 0,
            maxStockLevel: parseFloat(formData.maxStockLevel) || 0,
            reorderPoint: parseFloat(formData.reorderPoint) || 0,
            unitCost: parseFloat(formData.unitCost) || 0,
        });
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
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent bg-white"
                            >
                                {categories.length > 0 ? (
                                    categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.label}
                                        </option>
                                    ))
                                ) : (
                                    <option value="other">Other (No categories defined)</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">UOM</label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent bg-white"
                            >
                                <option value="piece">Piece (PC)</option>
                                <option value="kg">Kilogram (kg)</option>
                                <option value="liter">Liter</option>
                                <option value="bottle">Bottle</option>
                                <option value="box">Box (CTN)</option>
                                <option value="pack">Pack (PKT)</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={formData.currentStock}
                                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={formData.unitCost}
                                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={formData.minStockLevel}
                                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={formData.maxStockLevel}
                                onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                value={formData.reorderPoint}
                                onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
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
