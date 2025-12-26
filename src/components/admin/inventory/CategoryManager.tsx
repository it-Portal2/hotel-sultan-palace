import React, { useState } from 'react';
import { InventoryCategory } from '@/lib/firestoreService';
import { createInventoryCategory, deleteInventoryCategory } from '@/lib/inventoryService';
import { TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

interface CategoryManagerProps {
    categories: InventoryCategory[];
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export default function CategoryManager({ categories, isOpen, onClose, onRefresh }: CategoryManagerProps) {
    const { showToast } = useToast();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setSubmitting(true);
        try {
            // Create a slug-like name for internal use
            const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            await createInventoryCategory(slug, newCategoryName.trim());
            showToast("Category added successfully", "success");
            setNewCategoryName('');
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to add category", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? Items in this category will not be deleted but may lose their category filter.")) return;

        setDeletingId(id);
        try {
            await deleteInventoryCategory(id);
            showToast("Category deleted", "success");
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to delete category", "error");
        } finally {
            setDeletingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Manage Categories</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="New category name..."
                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newCategoryName.trim()}
                            className="bg-[#FF6A00] text-white px-4 py-2 rounded-lg hover:bg-[#FF6A00]/90 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium text-sm"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {categories.length === 0 ? (
                            <p className="text-center text-gray-400 py-4 text-sm italic">No categories found. Add one above.</p>
                        ) : (
                            categories.map(cat => (
                                <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group hover:bg-white hover:shadow-sm hover:border-gray-200 border border-transparent transition-all">
                                    <span className="font-medium text-gray-700">{cat.label}</span>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        disabled={deletingId === cat.id}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                                        title="Delete category"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
