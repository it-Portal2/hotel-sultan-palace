"use client";

import React, { useEffect, useState } from 'react';
import { getAllAdminUsers, type AdminUser, deleteAdminUser } from '@/lib/adminUsers';
import { PlusIcon, UserGroupIcon, ShieldCheckIcon, TrashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAdminRole } from '@/context/AdminRoleContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useToast } from '@/context/ToastContext';
import UserDrawer from '@/components/admin/users/UserDrawer';

export default function UsersPage() {
    const { hasSectionAccess, adminUser } = useAdminRole();
    const { showToast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    // State for Drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

    const handleCreateClick = () => {
        setEditingUser(null);
        setIsDrawerOpen(true);
    };

    const handleEditClick = (user: AdminUser) => {
        setEditingUser(user);
        setIsDrawerOpen(true);
    };

    const handleSave = () => {
        loadData(); // Refresh list
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getAllAdminUsers();
        setUsers(data);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirmId) return;
        setDeleting(confirmId);
        try {
            await deleteAdminUser(confirmId);
            showToast('User deleted successfully', 'success');
            setUsers(prev => prev.filter(u => u.id !== confirmId));
        } catch (error: any) {
            showToast(error.message || 'Failed to delete user', 'error');
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

    // Access Check using Granular Permissions
    const canCreateUsers = hasSectionAccess('staff', 'users', 'read_write');
    const canDeleteUsers = hasSectionAccess('staff', 'users', 'full_control'); // Deletion requires full control
    const canEditUsers = hasSectionAccess('staff', 'users', 'read_write');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Users</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage admin portal access and assign roles to staff.</p>
                </div>

                {canCreateUsers ? (
                    <button
                        onClick={handleCreateClick}
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors shadow-sm font-medium text-sm"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create New User
                    </button>
                ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium flex items-center cursor-not-allowed">
                        <LockClosedIcon className="h-4 w-4 mr-2" />
                        Read Only
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Profile</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Info</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                {(canEditUsers || canDeleteUsers) && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-[#FF6A00] font-bold text-lg">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name || user.username}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <ShieldCheckIcon className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-700 capitalize">
                                                {user.role.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs text-gray-500">
                                            <span className="font-medium text-gray-900">{user.employeeId || 'ID: System'}</span>
                                            <br />
                                            Created: {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    {(canEditUsers || canDeleteUsers) && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3">
                                                {user.role === 'super_admin' ? (
                                                    // Super Admin Logic: Only allow editing if it's the current user
                                                    (adminUser?.email === user.email) ? (
                                                        <button
                                                            onClick={() => handleEditClick(user)}
                                                            className="text-blue-600 hover:text-blue-900 font-bold"
                                                        >
                                                            Edit Profile
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center text-gray-400 text-xs italic cursor-not-allowed">
                                                            <LockClosedIcon className="h-3 w-3 mr-1" /> Protected
                                                        </div>
                                                    )
                                                ) : (
                                                    // Normal User Logic
                                                    <>
                                                        {canEditUsers && (
                                                            <button
                                                                onClick={() => handleEditClick(user)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                        {canDeleteUsers && (
                                                            <button
                                                                onClick={() => setConfirmId(user.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleSave}
                user={editingUser}
            />

            <ConfirmationModal
                isOpen={!!confirmId}
                onClose={() => setConfirmId(null)}
                onConfirm={handleDelete}
                title="Deactivate User?"
                message="Are you sure you want to deactivate this user? They will no longer be able to access the admin portal."
                confirmText={deleting === confirmId ? 'Processing...' : 'Deactivate User'}
                cancelText="Cancel"
            />
        </div>
    );
}
