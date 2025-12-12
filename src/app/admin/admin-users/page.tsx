"use client";

import React, { useState, useEffect, useMemo } from 'react';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { 
  getAllAdminUsers, 
  createAdminUser, 
  updateAdminUser, 
  deleteAdminUser,
  type AdminUser,
  type AdminRoleType 
} from '@/lib/adminUsers';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const roleLabels: Record<AdminRoleType, string> = {
  full: 'Full Admin',
  kitchen: 'Kitchen Staff',
  housekeeping: 'Housekeeping',
  front_desk: 'Front Desk',
  manager: 'Manager',
  readonly: 'Read Only',
};

export default function AdminUsersPage() {
  const { isFullAdmin, userEmail } = useAdminRole();
  const { showToast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'readonly' as AdminRoleType,
  });

  useEffect(() => {
    if (isFullAdmin) {
      loadAdminUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullAdmin]);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const users = await getAllAdminUsers();
      setAdminUsers(users);
    } catch (error) {
      console.error('Error loading admin users:', error);
      showToast('Failed to load admin users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return adminUsers;
    const q = searchQuery.toLowerCase();
    return adminUsers.filter(user => 
      (user.email || '').toLowerCase().includes(q) ||
      (user.name || '').toLowerCase().includes(q) ||
      roleLabels[user.role].toLowerCase().includes(q)
    );
  }, [adminUsers, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: adminUsers.length,
      active: adminUsers.filter(u => u.isActive).length,
      inactive: adminUsers.filter(u => !u.isActive).length,
    };
  }, [adminUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = await createAdminUser(formData.email, formData.role, formData.name, userEmail || undefined);
      if (id) {
        showToast('Admin user created successfully!', 'success');
        setShowAddModal(false);
        setFormData({ email: '', name: '', role: 'readonly' });
        await loadAdminUsers();
      } else {
        showToast('Failed to create admin user', 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create admin user';
      showToast(message, 'error');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const success = await updateAdminUser(selectedUser.id, {
        role: formData.role,
        name: formData.name,
      });
      if (success) {
        showToast('Admin user updated successfully!', 'success');
        setShowEditModal(false);
        setSelectedUser(null);
        await loadAdminUsers();
      } else {
        showToast('Failed to update admin user', 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update admin user';
      showToast(message, 'error');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete ${userEmail}?`)) return;
    
    try {
      const success = await deleteAdminUser(userId);
      if (success) {
        showToast('Admin user deleted successfully!', 'success');
        await loadAdminUsers();
      } else {
        showToast('Failed to delete admin user', 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete admin user';
      showToast(message, 'error');
    }
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
    });
    setShowEditModal(true);
  };

  if (!isFullAdmin) {
    return (
      <div className="space-y-8">
        <BackButton href="/admin" label="Back to Dashboard" />
        <div className="text-center py-16">
          <UserGroupIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600">Access Denied</p>
          <p className="text-sm text-gray-500 mt-2">Only full administrators can manage admin users.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-8">
      <BackButton href="/admin" label="Back to Dashboard" />
      
      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin users and their access permissions • {currentDate}</p>
        </div>
        
        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Active:</span>
            <span className="font-semibold text-gray-900">{stats.active}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Inactive:</span>
            <span className="font-semibold text-gray-900">{stats.inactive}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center rounded-lg bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Admin User
        </button>
      </div>

      {/* Clean Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16">
          <UserGroupIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600">No admin users found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery ? 'Try adjusting your search' : 'Add your first admin user'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      {user.id === 'main-admin' && (
                        <div className="text-xs text-[#FF6A00] font-semibold mt-1">Main Admin</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.id !== 'main-admin' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Admin User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRoleType })}
                  className="w-full px-3 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                >
                  <option value="readonly">Read Only</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="front_desk">Front Desk</option>
                  <option value="manager">Manager</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Note: Full Admin role is only for main admin email
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ email: '', name: '', role: 'readonly' });
                  }}
                  className="flex-1 px-4 py-2 border-b-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Admin User</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-4 py-2 border-b-2 border-gray-200 bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRoleType })}
                  className="w-full px-3 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                >
                  <option value="readonly">Read Only</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="front_desk">Front Desk</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 border-b-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
