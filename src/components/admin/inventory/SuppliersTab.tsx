import React, { useState, useEffect } from 'react';
import { getSuppliers, deleteSupplier } from '@/lib/inventoryService';
import type { Supplier } from '@/lib/firestoreService';
import { PlusIcon, PhoneIcon, EnvelopeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import SupplierDrawer from './SupplierDrawer';
import { useToast } from '@/context/ToastContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function SuppliersTab() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const { showToast } = useToast();

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error(error);
            showToast("Failed to load suppliers", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsDrawerOpen(true);
    };

    const handleCreate = () => {
        setSelectedSupplier(null);
        setIsDrawerOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await deleteSupplier(confirmDeleteId);
            showToast("Supplier deleted", "success");
            loadData();
        } catch (error) {
            console.error(error);
            showToast("Failed to delete supplier", "error");
        } finally {
            setConfirmDeleteId(null);
        }
    };

    if (loading) return <div className="text-center py-12 text-gray-500">Loading suppliers...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
            {/* Top Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900">Supplier Management</h2>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-transform active:scale-95 font-bold text-sm shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Supplier</span>
                </button>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#F9FAFB]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {suppliers.map(supplier => (
                                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{supplier.name}</div>
                                            <div className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-1">
                                                Terms: {supplier.paymentTerms}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{supplier.contactPerson}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" />
                                                <a href={`mailto:${supplier.email}`} className="hover:text-blue-600 transition-colors bg-blue-50/50 px-1 rounded">{supplier.email}</a>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="font-mono">{supplier.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${supplier.isActive
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            {supplier.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(supplier)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Supplier"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(supplier.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                            title="Delete Supplier"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {suppliers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                        No suppliers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <SupplierDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={loadData}
                supplier={selectedSupplier}
            />

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Supplier"
                message="Are you sure you want to delete this supplier? This cannot be undone."
                confirmText="Delete Supplier"
                cancelText="Cancel"
            />
        </div>
    );
}
