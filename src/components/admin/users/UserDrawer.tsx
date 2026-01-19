"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { type AdminUser, type AdminRoleType, createSystemUser, updateSystemUserPermissions, createAdminUser } from '@/lib/adminUsers';
import { getAllRoles, type SystemRole } from '@/lib/roleService';
import { getStaffMembers } from '@/lib/accountsService';
import type { StaffMember } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { useAdminRole } from '@/context/AdminRoleContext';

interface UserDrawerProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    user?: AdminUser | null; // If provided, editing mode
    initialStaffId?: string; // To pre-select staff when creating
}

export default function UserDrawer({ open, onClose, onSave, user, initialStaffId }: UserDrawerProps) {
    const { isSuperAdmin } = useAdminRole();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<SystemRole[]>([]);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [changePassword, setChangePassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        roles: [] as string[], // Multi-Role Support
        employeeId: '',
        isActive: true
    });

    // Helper: Merge Permissions
    const mergePermissions = (selectedRoleIds: string[], allRoles: SystemRole[]) => {
        const merged: any = {};
        const accessRank: Record<string, number> = { none: 0, read: 1, read_write: 2, full_control: 3 };

        const selectedSystemRoles = allRoles.filter(r => selectedRoleIds.includes(r.id));

        selectedSystemRoles.forEach(role => {
            const rolePerms = role.permissions;
            Object.keys(rolePerms).forEach((portalKey: string) => {
                const portal = rolePerms[portalKey];
                if (!merged[portalKey]) {
                    merged[portalKey] = { enabled: false, sections: {} };
                }

                // Portal Enabled: OR logic
                if (portal.enabled) merged[portalKey].enabled = true;

                // Sections: MAX logic
                if (portal.sections) {
                    Object.keys(portal.sections).forEach(sectionKey => {
                        const currentAccess = merged[portalKey].sections[sectionKey]?.access || 'none';
                        const newAccess = portal.sections[sectionKey].access;

                        if (accessRank[newAccess] > accessRank[currentAccess]) {
                            merged[portalKey].sections[sectionKey] = { access: newAccess };
                        }
                    });
                }
            });
        });
        return merged;
    };

    // Load Data
    useEffect(() => {
        const fetchData = async () => {
            const [fetchedRoles, fetchedStaff] = await Promise.all([
                getAllRoles(),
                getStaffMembers()
            ]);
            setRoles(fetchedRoles);
            setStaffList(fetchedStaff);
        };
        if (open) fetchData();
    }, [open]);

    // Init Form
    useEffect(() => {
        if (open) {
            if (user) {
                // Initialize Roles
                let initRoles: string[] = [];
                if (user.roles && user.roles.length > 0) {
                    initRoles = user.roles;
                } else if (user.role) {
                    initRoles = [user.role];
                }

                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    username: user.username || '',
                    password: '',
                    roles: initRoles,
                    employeeId: user.employeeId || '',
                    isActive: user.isActive
                });

                // Try to link staff
                const linkedStaff = staffList.length > 0 ? staffList.find(s => s.employeeId === user.employeeId) : null;
                if (linkedStaff) setSelectedStaffId(linkedStaff.id);

            } else if (!initialStaffId) {
                // New User Reset
                setChangePassword(false);
                setFormData({
                    name: '',
                    email: '',
                    username: '',
                    password: '',
                    roles: ['manager'], // Default
                    employeeId: '',
                    isActive: true
                });
                setSelectedStaffId('');
            }
        }
    }, [user, open, initialStaffId]);

    // Handle Create from Staff (Separate Effect)
    useEffect(() => {
        if (open && initialStaffId && staffList.length > 0 && !user) {
            const staff = staffList.find(s => s.employeeId === initialStaffId);
            if (staff) {
                setSelectedStaffId(staff.id);
                setFormData({
                    name: staff.name,
                    email: staff.email,
                    username: staff.email.split('@')[0],
                    password: '',
                    roles: ['custom'],
                    employeeId: staff.employeeId,
                    isActive: true
                });
            }
        }
    }, [open, initialStaffId, staffList, user]);

    // Auto-fill from Staff Selection
    const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const staffId = e.target.value;
        setSelectedStaffId(staffId);

        if (!staffId) {
            setFormData(prev => ({ ...prev, employeeId: '' }));
            return;
        }

        const staff = staffList.find(s => s.id === staffId);
        if (staff) {
            setFormData(prev => ({
                ...prev,
                employeeId: staff.employeeId || '',
                name: prev.name || staff.name,
                email: prev.email || staff.email,
                username: prev.username || staff.email.split('@')[0]
            }));
        }
    };

    const handleRoleToggle = (roleId: string) => {
        setFormData(prev => {
            const currentRoles = prev.roles;
            if (currentRoles.includes(roleId)) {
                return { ...prev, roles: currentRoles.filter(r => r !== roleId) };
            } else {
                return { ...prev, roles: [...currentRoles, roleId] };
            }
        });
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.username.trim()) newErrors.username = 'Username is required';

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!user && !initialStaffId && !formData.password) {
            newErrors.password = 'Password is required for new users';
        }

        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.roles.length === 0) {
            newErrors.roles = 'At least one role must be selected';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const mergedPerms = mergePermissions(formData.roles, roles);
            const primaryRole = formData.roles[0]; // For display/legacy

            if (user) {
                // Edit Mode
                await updateSystemUserPermissions(user.id, primaryRole, mergedPerms, formData.roles);

                if (changePassword && formData.password) {
                    const res = await fetch('/api/admin/users/password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email, password: formData.password })
                    });
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Failed to update password');
                    }
                }

                showToast('User updated successfully', 'success');
            } else {
                // Create Mode
                const result = await createSystemUser({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    username: formData.username,
                    employeeId: formData.employeeId,
                    role: primaryRole,
                    roles: formData.roles,
                    permissions: mergedPerms
                }, 'admin-portal');

                if (!result.success) throw new Error(result.error);
                showToast('User created successfully', 'success');
            }

            onSave();
            onClose();
        } catch (error: any) {
            showToast(error.message || 'Operation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

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
            <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FFFCF6]">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{user ? 'Edit User' : 'New User'}</h2>
                            <p className="text-xs text-gray-500">Manage system access and permissions</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <form id="user-form" onSubmit={handleSubmit}>

                            {/* Staff Link Section */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                                <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">
                                    Link to Staff Member (Optional)
                                </label>
                                <select
                                    value={selectedStaffId}
                                    onChange={handleStaffSelect}
                                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    disabled={!!user} // Disable link change on edit for now to avoid complexity
                                >
                                    <option value="">-- Select Staff Member --</option>
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-blue-600 mt-2">
                                    Selecting a staff member will auto-fill name and email.
                                </p>
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: '' });
                                        }}
                                        className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00] ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Username</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={e => {
                                                setFormData({ ...formData, username: e.target.value });
                                                if (errors.username) setErrors({ ...errors, username: '' });
                                            }}
                                            className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00] ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => {
                                                setFormData({ ...formData, email: e.target.value });
                                                if (errors.email) setErrors({ ...errors, email: '' });
                                            }}
                                            disabled={!!user} // Email is ID, harder to change
                                            className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00] disabled:bg-gray-100 disabled:text-gray-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                    </div>
                                </div>

                                {/* Password fields existing logic */}
                                {(changePassword || !user) && (
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {user ? 'New Password' : 'Password'}
                                        </label>
                                        <div className="relative mt-1">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required={!user || changePassword}
                                                minLength={6}
                                                value={formData.password}
                                                onChange={e => {
                                                    setFormData({ ...formData, password: e.target.value });
                                                    if (errors.password) setErrors({ ...errors, password: '' });
                                                }}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-[#FF6A00] focus:border-[#FF6A00] ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                    </div>
                                )}

                                {user && (
                                    <div className="flex items-center my-2">
                                        <input
                                            id="change-password"
                                            type="checkbox"
                                            checked={changePassword}
                                            onChange={(e) => {
                                                setChangePassword(e.target.checked);
                                                if (!e.target.checked) setFormData({ ...formData, password: '' });
                                            }}
                                            className="h-4 w-4 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded"
                                        />
                                        <label htmlFor="change-password" className="ml-2 block text-sm text-gray-900">
                                            Change Password
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 my-6"></div>

                            {/* Role Selection (Multi-Select) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">System Roles (Select Multiple)</label>
                                <div className="space-y-2">
                                    {roles.map(role => (
                                        <label
                                            key={role.id}
                                            className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${formData.roles.includes(role.id)
                                                ? 'border-[#FF6A00] bg-orange-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.roles.includes(role.id)}
                                                onChange={() => handleRoleToggle(role.id)}
                                                className="mt-1 h-4 w-4 text-[#FF6A00] border-gray-300 rounded focus:ring-[#FF6A00]"
                                            />
                                            <div className="ml-3 select-none">
                                                <span className={`block text-sm font-medium ${formData.roles.includes(role.id) ? 'text-[#FF6A00]' : 'text-gray-900'
                                                    }`}>
                                                    {role.name}
                                                </span>
                                                <span className="block text-xs text-gray-500">{role.description}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.roles && <p className="text-xs text-red-500 mt-2">{errors.roles}</p>}
                                <p className="text-xs text-gray-400 mt-2">
                                    Permissions are merged. If multiple roles are selected, the highest access level applies for each section.
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="user-form"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    user ? 'Save Changes' : 'Create User'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
