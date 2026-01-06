"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import { type SystemRole, createCustomRole, updateRole } from '@/lib/roleService';
import { portalNavigationGroups, type PortalType, type NavigationGroup } from '@/lib/adminNavigation';
import { type RBACPermissions } from '@/lib/adminUsers';

interface RoleDrawerProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    role: SystemRole | null; // If provided, editing mode
    readOnly?: boolean;
}

export default function RoleDrawer({ open, onClose, onSave, role, readOnly = false }: RoleDrawerProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    // Permission Matrix State
    // Format: { [portal]: { [section]: { access: 'full_control' } } }
    const [permissions, setPermissions] = useState<RBACPermissions>({});

    // Reset or Load Data
    useEffect(() => {
        if (open) {
            if (role) {
                setFormData({
                    name: role.name,
                    description: role.description
                });
                setPermissions(role.permissions || {});
            } else {
                setFormData({ name: '', description: '' });
                setPermissions({});
            }
        }
    }, [open, role]);

    const handleSetAccessLevel = (portal: string, section: string, level: 'read' | 'read_write' | 'full_control') => {
        setPermissions(prev => {
            const newPermissions = { ...prev };
            if (!newPermissions[portal]) {
                newPermissions[portal] = { enabled: true, sections: {} };
            }
            if (!newPermissions[portal].enabled) newPermissions[portal].enabled = true;

            newPermissions[portal].sections = {
                ...newPermissions[portal].sections,
                [section]: { access: level }
            };
            return newPermissions;
        });
    };

    const handleTogglePermission = (portal: string, section: string, enabled: boolean) => {
        if (!enabled) {
            setPermissions(prev => {
                const newPermissions = { ...prev };
                if (newPermissions[portal] && newPermissions[portal].sections) {
                    delete newPermissions[portal].sections[section];
                    if (Object.keys(newPermissions[portal].sections).length === 0) {
                        newPermissions[portal].enabled = false;
                    }
                }
                return newPermissions;
            });
        } else {
            handleSetAccessLevel(portal, section, 'read_write');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name) throw new Error("Role Name is required");

            const roleData = {
                name: formData.name,
                description: formData.description,
                permissions: permissions
            };

            if (role) {
                if (role.isSystem) {
                    // System roles might be restricted, but let's allow updating permissions if needed
                    // Usually name/desc are locked for system roles
                    // We will just update what we can
                    await updateRole(role.id, { description: formData.description, permissions: permissions });
                    showToast('System Role updated successfully', 'success');
                } else {
                    await updateRole(role.id, roleData);
                    showToast('Role updated successfully', 'success');
                }
            } else {
                await createCustomRole(roleData);
                showToast('New Role created successfully', 'success');
            }

            onSave();
            onClose();
        } catch (error: any) {
            showToast(error.message || 'Operation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Helper to check if a specific section is enabled in current permissions
    const isSectionEnabled = (portal: string, section: string) => {
        // Handle "operations" mapping to "front_office" key in RBAC if needed
        // But our adminNavigation uses 'operations' as portal key, while RBAC usually uses 'front_office'
        // Let's standardise on the RBAC keys.
        // We need to map PortalType to RBAC key if they differ.
        // Looking at AdminLayout logic: actualPortalKey = portal === 'operations' ? 'front_office' : portal;

        const rbacKey = portal === 'operations' ? 'front_office' : portal;

        return permissions[rbacKey]?.sections?.[section]?.access === 'full_control' ||
            permissions[rbacKey]?.sections?.[section]?.access === 'read_write';
    };

    const getRbacKey = (portal: PortalType) => portal === 'operations' ? 'front_office' : portal;

    return (
        <>
            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FFFCF6]">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {role ? (role.isSystem ? `View Role: ${role.name}` : 'Edit Role') : 'Create New Role'}
                            </h2>
                            <p className="text-sm text-gray-500">Configure access permissions</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="role-form" onSubmit={handleSubmit} className="space-y-8">
                            {readOnly && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-blue-700 mb-6">
                                    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium">You are viewing this role in read-only mode.</span>
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-1">Role Name</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={role?.isSystem || readOnly}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00] disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="e.g. Senior Shift Leader"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
                                    <input
                                        type="text"
                                        disabled={readOnly}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00] disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="Brief description of responsibilities"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-100"></div>

                            {/* Permission Matrix */}
                            <div className="space-y-8">
                                <h3 className="text-lg font-bold text-gray-900">Access Permissions</h3>

                                {Object.entries(portalNavigationGroups).map(([portalKey, groups]) => {
                                    if (portalKey === 'selection') return null; // Skip selection portal
                                    const rbacKey = getRbacKey(portalKey as PortalType);

                                    return (
                                        <div key={portalKey} className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">
                                                {portalKey.replace('_', ' ')}
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {groups.map(group => (
                                                    <div key={group.name} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-200 transition-colors">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className={`p-1.5 rounded-md ${group.items[0]?.bgColor || 'bg-gray-100'}`}>
                                                                <group.icon className={`h-5 w-5 ${group.items[0]?.color || 'text-gray-500'}`} />
                                                            </div>
                                                            <span className="font-semibold text-gray-900">{group.name}</span>
                                                        </div>

                                                        <div className="space-y-2 ml-1">
                                                            {group.items.map(item => {
                                                                // Infer section if not explicit
                                                                const section = item.section || item.name.toLowerCase().replace(/ /g, '_');
                                                                const accessLevel = permissions[rbacKey]?.sections?.[section]?.access || 'none';

                                                                return (
                                                                    <div key={item.name} className="flex flex-col gap-2 p-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className={`text-sm font-medium ${accessLevel !== 'none' ? 'text-gray-900' : 'text-gray-500'}`}>
                                                                                {item.name}
                                                                            </span>
                                                                            <select
                                                                                value={accessLevel}
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value;
                                                                                    if (val === 'none') handleTogglePermission(rbacKey, section, false);
                                                                                    else handleSetAccessLevel(rbacKey, section, val as any);
                                                                                }}
                                                                                className={`text-xs rounded-md py-1.5 pl-2 pr-8 border-0 ring-1 ring-inset focus:ring-2 sm:text-xs sm:leading-6 ${accessLevel === 'none' ? 'text-gray-400 ring-gray-200' : 'text-gray-900 bg-white ring-orange-200 text-orange-700 font-medium'}`}
                                                                            >
                                                                                <option value="none">No Access</option>
                                                                                <option value="read">View Only</option>
                                                                                <option value="read_write">View & Edit</option>
                                                                                <option value="full_control">Full Control</option>
                                                                            </select>
                                                                        </div>
                                                                        {accessLevel !== 'none' && (
                                                                            <div className="text-[10px] text-gray-400 px-1">
                                                                                {accessLevel === 'read' && 'Can view items but cannot modify.'}
                                                                                {accessLevel === 'read_write' && 'Can add and edit items.'}
                                                                                {accessLevel === 'full_control' && 'Can add, edit, and delete items.'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        {!readOnly && (
                            <button
                                type="submit"
                                form="role-form"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Save Role"
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
