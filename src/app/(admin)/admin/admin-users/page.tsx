"use client";

import React, { useState, useEffect } from 'react';
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
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function AdminUsersPage() {
  const { isFullAdmin, isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRoleType>('readonly');

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getAllAdminUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users", error);
        showToast("Failed to load users", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    try {
      if (editingUser) {
        // Update existing
        await updateAdminUser(editingUser.id, { role: newRole });
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, email: newEmail, role: newRole } : u));
        showToast('User updated successfully', 'success');
      } else {
        // Create new
        const id = await createAdminUser(newEmail, newRole);
        if (id) {
          // We might need to refetch or manually construct the user object properly
          // Since createAdminUser returns ID only, constructing a full object is cleaner if we can
          const newUser: AdminUser = {
            id,
            email: newEmail,
            role: newRole,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            permissions: { // Default permissions based on role, simplified for optimistic UI update
              canViewBookings: true, canEditBookings: false, canCancelBookings: false, canConfirmBookings: false,
              canViewRooms: true, canEditRooms: false, canManageRoomStatus: false,
              canViewFoodOrders: true, canUpdateFoodOrderStatus: false, canViewKitchen: true, canManageMenu: false,
              canViewGuestServices: true, canUpdateGuestServiceStatus: false, canCreateGuestServices: false,
              canViewHousekeeping: true, canCreateHousekeepingTasks: false, canUpdateHousekeepingTasks: false,
              canViewFrontDesk: true, canCheckIn: false, canCheckOut: false,
              canViewCheckout: true, canGenerateBills: false,
              canManageGallery: false, canManageOffers: false, canManageAddons: false, canManageRooms: false, canManageAdmins: false
            }
          };
          setUsers([...users, newUser]);
          showToast('User added successfully', 'success');
        } else {
          showToast('Failed to create user', 'error');
        }
      }
      closeModal();
    } catch (error) {
      console.error(error);
      showToast('Error saving user', 'error');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setNewEmail('');
    setNewRole('readonly');
  };

  const openAddModal = () => {
    setEditingUser(null);
    setNewEmail('');
    setNewRole('readonly');
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setNewEmail(user.email);
    setNewRole(user.role);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      setDeleting(confirmId);
      await deleteAdminUser(confirmId);
      setUsers(users.filter(u => u.id !== confirmId));
      showToast('User deleted successfully', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error deleting user', 'error');
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="h-12 w-12 border-b-2 border-[#FF6A00] rounded-full animate-spin" /></div>;

  if (!isFullAdmin) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <UserGroupIcon className="h-12 w-12 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2 max-w-sm text-center">
            You do not have permission to view or manage admin users. Please contact a full administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Users</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Manage team access and permissions • {currentDate}</p>
        </div>

        <div>
          {isReadOnly ? (
            <button disabled className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-400 cursor-not-allowed transition-all">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add User
            </button>
          ) : (
            <button onClick={openAddModal} className="inline-flex items-center justify-center rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#FF6A00]/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Authorized Users</h3>
          <span className="bg-white text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">{users.length} Users</span>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Added On</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6A00] to-orange-400 flex items-center justify-center text-white font-bold shadow-sm">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{user.email}</div>
                          <div className="text-xs text-gray-500">access level: {user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${user.role === 'full' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        user.role === 'kitchen' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!isReadOnly && (
                          <>
                            <button onClick={() => openEditModal(user)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><PencilIcon className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmId(user.id)} disabled={deleting === user.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">{editingUser ? 'Edit User' : 'Add New User'}</h3>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={!!editingUser}
                  className={`w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] outline-none transition-all ${editingUser ? 'bg-gray-100 text-gray-500' : ''}`}
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRoleType)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] outline-none transition-all bg-white"
                >
                  <option value="full">Full Admin</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="frontdesk">Front Desk</option>
                  <option value="readonly">Read Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Full Admin:</strong> Full access to all settings.<br />
                  <strong>Kitchen:</strong> Access to kitchen orders only.<br />
                  <strong>Read Only:</strong> View access only.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#FF6A00] text-white font-medium hover:bg-[#FF6A00]/90 transition-colors shadow-lg shadow-orange-500/20"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to remove this user? They will no longer have access to the admin panel."
        confirmText={deleting === confirmId ? 'Deleting...' : 'Delete User'}
        cancelText="Cancel"
      />
    </div>
  );
}
