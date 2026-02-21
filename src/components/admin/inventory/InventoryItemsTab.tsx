import React, { useState, useEffect } from 'react';
import type { InventoryItem, InventoryCategory, InventoryDepartment, Department } from '@/lib/firestoreService';
import { createInventoryItem, updateInventoryItem, deleteInventoryItem, getInventoryCategories, getInventoryDepartments, checkAndCreateAutoReorder } from '@/lib/inventoryService';
import InventoryModal from './InventoryModal';
import CategoryManager from './CategoryManager';
import DepartmentManager from './DepartmentManager';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon, FolderPlusIcon, BuildingOfficeIcon, BoltIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import { useAdminRole } from '@/context/AdminRoleContext';

interface InventoryItemsTabProps {
    items: InventoryItem[];
    loading: boolean;
    onRefresh: () => void;
}

export default function InventoryItemsTab({ items, loading, onRefresh }: InventoryItemsTabProps) {
    const { showToast } = useToast();
    const { hasSectionAccess } = useAdminRole();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    // Removed department filter to restore legacy view
    const [showModal, setShowModal] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showDepartmentManager, setShowDepartmentManager] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const [cats, depts] = await Promise.all([
            getInventoryCategories(),
            getInventoryDepartments()
        ]);
        setCategories(cats);
        setDepartments(depts);
    };

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
        const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
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

    // Combine static 'All' with dynamic categories
    const displayCategories = [
        { id: 'all', label: 'All Categories', name: 'all' },
        ...categories
    ];

    if (loading) {
        return <div className="text-center py-12 text-gray-500">Loading items...</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] gap-4">
            {/* Top Bar: Search & Actions */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">

                {/* Left Side: Search (Expanded) */}
                <div className="relative w-full md:max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search inventory items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] transition-all"
                    />
                </div>

                {/* Right Side: Actions */}
                <div className="flex w-full md:w-auto gap-3">
                    {hasSectionAccess('inventory', 'items', 'read_write') && (
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-transform active:scale-95 font-bold text-sm shadow-sm whitespace-nowrap flex-1 md:flex-none justify-center"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>New Item</span>
                        </button>
                    )}

                    {hasSectionAccess('inventory', 'items', 'read_write') && (
                        <>
                            <button
                                onClick={() => setShowCategoryManager(true)}
                                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors whitespace-nowrap"
                            >
                                <FolderPlusIcon className="w-5 h-5 text-gray-500" />
                                <span className="hidden sm:inline">Manage Categories</span>
                            </button>

                            <button
                                onClick={() => setShowDepartmentManager(true)}
                                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors whitespace-nowrap"
                            >
                                <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                                <span className="hidden sm:inline">Manage Depts</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
                {/* Sidebar Categories */}
                <div className="w-full md:w-64 flex-none bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Categories</h3>
                        {hasSectionAccess('inventory', 'items', 'read_write') && (
                            <button
                                onClick={() => setShowCategoryManager(true)}
                                className="text-[#FF6A00] hover:bg-orange-50 p-1.5 rounded-lg transition-colors border border-dashed border-[#FF6A00]/30"
                                title="Manage Categories"
                            >
                                <FolderPlusIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {displayCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setFilterCategory(cat.name)}
                                className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors flex justify-between items-center ${filterCategory === cat.name
                                    ? 'bg-orange-50 text-[#FF6A00]'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className="truncate">{cat.label}</span>
                                {filterCategory === cat.name && <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-[#FF6A00]"></span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Table Area (Full Width now) */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    {/* Table Header (Desktop) */}
                    <div className="hidden md:block overflow-x-auto flex-1">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#F9FAFB] sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item Details</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location / Dept</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Current Stock</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Value</th>
                                    <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-gray-50 rounded-full">
                                                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-300" />
                                                </div>
                                                <p className="font-semibold text-lg text-gray-900">No items found</p>
                                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                                    We couldn't find any inventory items matching your current filters.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setFilterCategory('all');
                                                    }}
                                                    className="mt-2 text-[#FF6A00] font-medium text-sm hover:underline"
                                                >
                                                    Clear all filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => {
                                        const status = getStockStatus(item);
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 text-[15px]">{item.name}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">SKU: {item.sku}</span>
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wide md:hidden bg-gray-100 px-1.5 py-0.5 rounded">{item.department}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        {item.location
                                                            ? <span className="text-sm font-medium text-gray-700">{item.location}</span>
                                                            : <span className="text-xs text-gray-300 italic">No location set</span>
                                                        }
                                                        {item.department && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.department}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900 text-base">{item.currentStock}</span>
                                                            <span className="text-xs text-gray-500 font-medium uppercase">{item.unit}</span>
                                                        </div>
                                                        {item.purchaseUnit && item.conversionFactor && (
                                                            <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded w-fit">
                                                                {Math.floor(item.currentStock / item.conversionFactor)} {item.purchaseUnit}
                                                                {(item.currentStock % item.conversionFactor) > 0 ? ` + ${(item.currentStock % item.conversionFactor)} ${item.unit}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                    ${(item.currentStock * item.unitCost).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-3 py-1 inline-flex text-[10px] uppercase tracking-wide font-bold rounded-full ${getStockColor(status)} shadow-sm`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        {hasSectionAccess('inventory', 'items', 'read_write') && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(item);
                                                                    setShowModal(true);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-[#FF6A00] hover:bg-orange-50 rounded-lg transition-colors"
                                                                title="Edit Item"
                                                            >
                                                                <PencilIcon className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {hasSectionAccess('inventory', 'items', 'full_control') && (
                                                            <>
                                                                <button
                                                                    onClick={async () => {
                                                                        showToast(`Testing Auto-Order for ${item.name}...`, "info");
                                                                        console.log("Testing Auto-Order for:", item);
                                                                        if (!item.preferredSupplierId) {
                                                                            showToast("FAILED: No Preferred Supplier set!", "error");
                                                                            return;
                                                                        }
                                                                        await checkAndCreateAutoReorder(item.id, item.currentStock);
                                                                        showToast("Auto-order check complete. Check Console/POs.", "success");
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Trigger Auto-Order (Debug)"
                                                                >
                                                                    <BoltIcon className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete Item"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden space-y-3 p-4 pb-20 overflow-y-auto">
                        {filteredItems.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p>No items found.</p>
                            </div>
                        ) : (
                            filteredItems.map(item => {
                                const status = getStockStatus(item);
                                const statusColor = getStockColor(status);
                                return (
                                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{item.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500 font-mono">SKU: {item.sku}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 uppercase font-semibold">{item.department}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {hasSectionAccess('inventory', 'items', 'read_write') && (
                                                    <button
                                                        onClick={() => { setEditingItem(item); setShowModal(true); }}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {hasSectionAccess('inventory', 'items', 'full_control') && (
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="bg-gray-50 p-2 rounded-lg">
                                                <span className="text-xs text-gray-500 block">Stock</span>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{item.currentStock} {item.unit}</span>
                                                    {item.purchaseUnit && item.conversionFactor && (
                                                        <span className="text-[10px] text-orange-600 font-medium">
                                                            {Math.floor(item.currentStock / item.conversionFactor)} {item.purchaseUnit}
                                                            {(item.currentStock % item.conversionFactor) > 0 ? ` + ${(item.currentStock % item.conversionFactor)} ${item.unit}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded-lg">
                                                <span className="text-xs text-gray-500 block">Value</span>
                                                <span className="font-bold text-gray-900">${(item.currentStock * item.unitCost).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-gray-500 uppercase">{item.category}</span>
                                                {item.location && <span className="text-xs text-gray-400">• {item.location}</span>}
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${statusColor}`}>
                                                {status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
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
                categories={categories}
                departments={departments}
                defaultCategory={filterCategory !== 'all' ? filterCategory : undefined}
            />

            <CategoryManager
                categories={categories}
                isOpen={showCategoryManager}
                onClose={() => setShowCategoryManager(false)}
                onRefresh={loadCategories}
            />

            <DepartmentManager
                departments={departments}
                isOpen={showDepartmentManager}
                onClose={() => setShowDepartmentManager(false)}
                onRefresh={loadCategories}
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
