import React, { useState } from 'react';
import type { InventoryItem } from '@/lib/firestoreService';
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/inventoryService';
import InventoryModal from './InventoryModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

interface InventoryItemsTabProps {
    items: InventoryItem[];
    loading: boolean;
    onRefresh: () => void;
}

export default function InventoryItemsTab({ items, loading, onRefresh }: InventoryItemsTabProps) {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleSave = async (formData: Partial<InventoryItem>) => {
        try {
            if (editingItem) {
                await updateInventoryItem(editingItem.id, formData);
                showToast("Item updated successfully", "success");
            } else {
                await createInventoryItem(formData as Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>);
                showToast("Item created successfully", "success");
            }
            setShowModal(false);
            setEditingItem(null);
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to save item", "error");
        }
    };

    const handleDelete = (id: string) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await deleteInventoryItem(confirmDeleteId);
            showToast("Item deleted", "success");
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to delete item", "error");
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getStockStatus = (item: InventoryItem) => {
        if (item.currentStock <= item.reorderPoint) return 'critical';
        if (item.currentStock <= item.minStockLevel) return 'low';
        if (item.currentStock >= item.maxStockLevel) return 'high';
        return 'normal';
    };

    const getStockColor = (status: string) => {
        switch (status) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'low': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-blue-100 text-blue-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading items...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-1 w-full gap-4">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 focus:outline-none focus:border-[#FF6A00] focus:ring-0 bg-white"
                    >
                        <option value="all">All Categories</option>
                        <option value="food">Food</option>
                        <option value="beverage">Beverage</option>
                        <option value="amenity">Amenity</option>
                        <option value="supply">Supply</option>
                        <option value="linen">Linen</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors whitespace-nowrap"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Item
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No items found.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const status = getStockStatus(item);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{item.name}</span>
                                                    <span className="text-xs text-gray-500">SKU: {item.sku}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="capitalize px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <span className="font-bold text-gray-900">{item.currentStock}</span> {item.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                ${(item.currentStock * item.unitCost).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockColor(status)}`}>
                                                    {status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(item);
                                                            setShowModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <InventoryModal
                item={editingItem}
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingItem(null);
                }}
                onSave={handleSave}
            />

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
