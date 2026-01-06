"use client";

import React, { useEffect, useState } from 'react';
import { getAllRoles, type SystemRole, deleteRole } from '@/lib/roleService';
import { PlusIcon, ShieldCheckIcon, TrashIcon, LockClosedIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useAdminRole } from '@/context/AdminRoleContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useToast } from '@/context/ToastContext';
import RoleDrawer from '@/components/admin/roles/RoleDrawer';

export default function RolesPage() {
    const { hasSectionAccess } = useAdminRole();
    const { showToast } = useToast();
    const [roles, setRoles] = useState<SystemRole[]>([]);
    const [loading, setLoading] = useState(true);

    // State for actions
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Drawer State
    const [showDrawer, setShowDrawer] = useState(false);
    const [editingRole, setEditingRole] = useState<SystemRole | null>(null);

    const canCreateRole = hasSectionAccess('staff', 'roles', 'full_control');
    const canDeleteRole = hasSectionAccess('staff', 'roles', 'full_control');
    const canEditRole = hasSectionAccess('staff', 'roles', 'read_write');
    const canViewRole = hasSectionAccess('staff', 'roles', 'read');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getAllRoles();
        setRoles(data);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirmId) return;
        setDeleting(confirmId);
        try {
            await deleteRole(confirmId);
            showToast('Role deleted successfully', 'success');
            setRoles(prev => prev.filter(r => r.id !== confirmId));
        } catch (error: any) {
            showToast(error.message || 'Failed to delete role', 'error');
        } finally {
            setDeleting(null);
            setConfirmId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Roles & Permissions</h1>
                    <p className="text-sm text-gray-500 mt-1">Define access levels and security policies for your team.</p>
                </div>

                {canCreateRole ? (
                    <button
                        onClick={() => {
                            setEditingRole(null);
                            setShowDrawer(true);
                        }}
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors shadow-sm font-medium text-sm"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create New Role
                    </button>
                ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium flex items-center cursor-not-allowed">
                        <LockClosedIcon className="h-4 w-4 mr-2" />
                        Read Only
                    </div>
                )}
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                    <div key={role.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${role.isSystem ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                {role.isSystem ? <LockClosedIcon className="h-6 w-6" /> : <ShieldCheckIcon className="h-6 w-6" />}
                            </div>
                            {role.isSystem ? (
                                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded">System Default</span>
                            ) : (
                                canDeleteRole && (
                                    <button
                                        onClick={() => setConfirmId(role.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="Delete Role"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                )
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2">{role.name}</h3>
                        <p className="text-sm text-gray-500 mb-6 flex-grow">{role.description}</p>

                        <div className="border-t border-gray-100 pt-4 mt-auto">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400 font-medium">
                                    {Object.keys(role.permissions).filter(k => role.permissions[k as any]?.enabled).length} Active Modules
                                </span>
                                <button
                                    onClick={() => {
                                        setEditingRole(role);
                                        setShowDrawer(true);
                                    }}
                                    className="text-sm font-semibold text-[#FF6A00] hover:text-[#e65f00] flex items-center group"
                                >
                                    {canEditRole ? 'Edit Permissions' : 'View Permissions'}
                                    <PencilIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmationModal
                isOpen={!!confirmId}
                onClose={() => setConfirmId(null)}
                onConfirm={handleDelete}
                title="Delete Role?"
                message="Are you sure you want to delete this role? Users assigned to this role may lose access to the system."
                confirmText={deleting === confirmId ? 'Deleting...' : 'Delete Role'}
                cancelText="Cancel"
            />

            <RoleDrawer
                open={showDrawer}
                onClose={() => {
                    setShowDrawer(false);
                    setEditingRole(null);
                }}
                onSave={loadData}
                role={editingRole}
                readOnly={!canEditRole && !!editingRole} // Read only if cant edit, but create (editingRole=null) is guarded by create button anyway
            />
        </div>
    );
}
