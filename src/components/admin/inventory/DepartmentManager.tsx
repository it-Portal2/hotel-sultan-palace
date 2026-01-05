import React, { useState } from 'react';
import { Department } from '@/lib/firestoreService';
import { createInventoryDepartment, deleteInventoryDepartment, seedDefaultDepartments } from '@/lib/inventoryService';
import { TrashIcon, PlusIcon, BuildingOfficeIcon, BoltIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import Drawer from '@/components/ui/Drawer';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface DepartmentManagerProps {
    departments: Department[];
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export default function DepartmentManager({ departments, isOpen, onClose, onRefresh }: DepartmentManagerProps) {
    const { showToast } = useToast();
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDepartmentName.trim()) return;

        setSubmitting(true);
        try {
            await createInventoryDepartment(newDepartmentName.trim());
            showToast("Department added successfully", "success");
            setNewDepartmentName('');
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to add department", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;

        setDeletingId(confirmDeleteId);
        try {
            await deleteInventoryDepartment(confirmDeleteId);
            showToast("Department deleted", "success");
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to delete department", "error");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleSeed = async () => {
        setSubmitting(true);
        try {
            await seedDefaultDepartments();
            showToast("Default departments seeded", "success");
            onRefresh();
        } catch (error) {
            console.error(error);
            showToast("Failed to seed departments", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Manage Departments"
            size="md"
            footer={
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        Done
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Add New Department</h3>
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input
                            type="text"
                            value={newDepartmentName}
                            onChange={(e) => setNewDepartmentName(e.target.value)}
                            placeholder="e.g. Kitchen, Beach Bar, Maintenance..."
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newDepartmentName.trim()}
                            className="bg-[#FF6A00] text-white px-4 py-2.5 rounded-lg hover:bg-[#FF6A00]/90 disabled:opacity-50 transition-colors flex items-center gap-2 font-bold text-sm shadow-sm"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                        <span>Existing Departments</span>
                        <span className="bg-gray-100 text-gray-500 py-0.5 px-2 rounded-full text-[10px]">{departments.length}</span>
                    </h3>

                    <div className="space-y-2">
                        {departments.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <BuildingOfficeIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm mb-4">No departments found.</p>
                                <button
                                    onClick={handleSeed}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-orange-50 text-[#FF6A00] font-bold rounded-lg text-xs hover:bg-orange-100 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <BoltIcon className="w-4 h-4" />
                                    Seed Defaults
                                </button>
                            </div>
                        ) : (
                            departments.map(dept => (
                                <div key={dept.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm group hover:border-[#FF6A00]/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 text-[#FF6A00] rounded-lg">
                                            <BuildingOfficeIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-700">{dept.name}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">ID: {dept.slug}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(dept.id)}
                                        disabled={deletingId === dept.id}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                        title="Delete department"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Department"
                message="Are you sure? Items in this department will not be deleted but may lose their department filter."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </Drawer>
    );
}
