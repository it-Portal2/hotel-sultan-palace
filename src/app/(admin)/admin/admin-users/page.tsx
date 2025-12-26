"use client";

import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
  getAllAdminUsers,
  createSystemUser,
  updateSystemUserPermissions,
  deleteSystemUser,
  type AdminUser,
  type AdminRoleType,
  type RBACPermissions,
  defaultPermissions
} from '@/lib/adminUsers';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, MagnifyingGlassIcon, EyeIcon, EyeSlashIcon, KeyIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function AdminUsersPage() {
  const { isFullAdmin, isSuperAdmin } = useAdminRole();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    employeeId: '',
    password: '',
    name: '',
    role: 'receptionist' as AdminRoleType
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [permissions, setPermissions] = useState<RBACPermissions>({});
  const [expandedPortals, setExpandedPortals] = useState<string[]>([]);

  const togglePortalExpand = (key: string) => {
    setExpandedPortals(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handlePermissionToggle = (portalKey: string, sectionKey?: string, checked?: boolean) => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      if (!newPerms[portalKey]) newPerms[portalKey] = { enabled: false, sections: {} };

      if (!sectionKey) {
        newPerms[portalKey]!.enabled = checked ?? !newPerms[portalKey]!.enabled;
      } else {
        if (!newPerms[portalKey]!.sections[sectionKey]) {
          newPerms[portalKey]!.sections[sectionKey] = { access: 'read' };
        }

        if (checked === false) {
          delete newPerms[portalKey]!.sections[sectionKey];
        } else {
          newPerms[portalKey]!.sections[sectionKey] = { access: 'read_write' };
          newPerms[portalKey]!.enabled = true;
        }
      }
      return newPerms;
    });
  };

  const PORTAL_SCHEMA = [
    {
      key: 'front_office', // Operations Portal
      label: 'EHMS / Hotel Operations',
      sections: [
        'dashboard',
        'reservations',
        'front_office', // Check-in/Checkout
        'rooms',
        'night_audit',
        'guest_services',
        'housekeeping',
        'inventory',
        'analytics', // Reports -> Analytics
        'arrival_list',
        'cancelled',
        'no_show',
        'unsettled_folios',
        'transactions',
        'travel_agents',
        'companies',
        'sales_persons',
        'incidental_invoice',
        'net_locks'
      ]
    },
    {
      key: 'kitchen',
      label: 'Kitchen & Food Orders',
      sections: ['kitchen_dashboard', 'menu_management', 'analytics']
    },
    {
      key: 'inventory', // Note: In AdminLayout, Inventory is a group under Operations -> 'inventory' section. 
      // But there is also a 'Inventory' portal concept in some contexts? 
      // AdminLayout uses `currentPortal` logic. 
      // Operations portal has an 'Inventory' group. 
      // Is there a separate Inventory Portal? 
      // AdminLayout `getPortalFromPath` says: default is 'operations'. 
      // So 'inventory' is just a section under operations.
      // But schema might treating it as separate? 
      // Let's stick to what AdminLayout essentially defines.
      // Wait, AdminLayout defines 'inventory' group under 'operations'.
      // The previous SCHEMA had 'inventory' as a separate key. 
      // Let's check `hasPortalAccess`. 
      // AdminRoleContext: `adminUser.permissions[portalKey]`.
      // If I add separate 'inventory' key to permissions but AdminLayout looks for `hasPortalAccess('operations')` and `hasSectionAccess('operations', 'inventory')`...
      // CHECK AdminLayout `filteredNavigationGroups`:
      // `const actualPortalKey = portal === 'operations' ? 'front_office' : portal;`
      // So 'operations' portal uses 'front_office' permission key.
      // So 'inventory' section MUST be under 'front_office' perms if we want it controlled there.
      // BUT, the `hasSectionAccess` function:
      // `const portal = adminUser.permissions[portalKey];`
      // So if portalKey is 'front_office', it checks `adminUser.permissions.front_office.sections['inventory']`.
      // Previous SCHEMA had a separate 'inventory' portal key.
      // If `defaultPermissions` has a separate 'inventory' key, then maybe `AdminLayout` logic is referencing that?
      // AdminLayout: `hasSectionAccess(actualPortalKey, item.section)`.
      // `actualPortalKey` IS 'front_office' for all operations sections.
      // So `inventory` MUST be a section of `front_office` permission object.
      // OR I need to change `AdminLayout` to use 'inventory' portal key for the inventory group.
      // AdminLayout currently: Group: Inventory -> Section: 'inventory'.
      // So it checks `hasSectionAccess('front_office', 'inventory')`.
      // So my SCHEMA update above putting 'inventory' in `front_office` sections list is CORRECT.
      // The separate 'inventory' key in CURRENT SCHEMA was likely wrong or legacy unused.
      // I will remove the separate 'inventory' key from SCHEMA and rely on the one in 'front_office'.

      // WAIT. `defaultPermissions` in `adminUsers.ts` has `inventory` as a TOP LEVEL key.
      // `inventory: { enabled: true, sections: { all: { access: 'read_write' } } },`
      // And `front_office` top level key.
      // If Permission DB has 'inventory' key, but AdminLayout checks 'front_office' key... mismatch.
      // Let's Fix this.
      // AdminLayout: `const actualPortalKey = portal === 'operations' ? 'front_office' : portal;`
      // If I want to support the separate 'inventory' permission key, I would need to change AdminLayout logic.
      // But user wants sub-sections.
      // Simpler to unify everything under 'front_office' (Operations) as per the UI structure.
      // I will stick to putting everything under `front_office` in the schema.
      // I will keep the other keys if they map to actual portals.

      // Key: 'accounts' (Finance Portal).
      // Key: 'settings' (Website Portal).
      // Key: 'users' (Staff Portal).

      label: 'Inventory Control (Legacy)', // Keeping just in case, or removing?
      // If I remove it, previous permissions using it won't show up in UI.
      // I'll comment it out or leave it minimal.
      sections: ['inventory_dashboard', 'suppliers', 'purchase_orders', 'stock']
      // Actually, looking at AdminLayout again, there is NO 'Inventory' Portal.
      // It's a group under Operations.
      // So the previous internal schema was definitely misaligned with AdminLayout or defining a future/past portal.
      // I will remove it from the PRIMARY list to avoid confusion, or merge it.
      // Access to "Inventory" group under Ops is logically `front_office -> sections -> inventory`.
    },
    {
      key: 'accounts', // Finance Portal
      label: 'Accounts & Finance',
      sections: ['finance_dashboard', 'transactions', 'finance_ops']
    },
    {
      key: 'settings', // Website Portal
      label: 'Website Management',
      sections: ['content', 'marketing', 'inquiries']
    },
    {
      key: 'users', // Staff Portal
      label: 'Staff Management',
      sections: ['directory', 'admin_users']
    },
  ];

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'role') {
      const newRole = value as AdminRoleType;
      setPermissions(defaultPermissions[newRole] || {});
    }
  };

  const roleLabels: Record<string, string> = {
    super_admin: 'System Administrator',
    manager: 'Manager',
    receptionist: 'Front Desk',
    chef: 'Head Chef',
    housekeeper: 'Housekeeping',
    auditor: 'Night Auditor',
    accountant: 'Accountant',
    custom: 'Staff Member',
    // Legacy support
    full: 'Full Admin',
    kitchen: 'Kitchen Staff',
    housekeeping_legacy: 'Housekeeping',
    front_desk: 'Check-in',
    readonly: 'Read Only',
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Only the System Administrator can manage users.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update System User Permissions/Role only (Password/Email modification usually restricted or separate flow)
        await updateSystemUserPermissions(editingUser.id, formData.role, permissions);
        // Note: Full permission UI builder is separate, here we just set base role

        setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: formData.role, permissions: permissions } : u));
        showToast('User permissions updated successfully', 'success');
      } else {
        // Create New System User
        const result = await createSystemUser({
          email: formData.email,
          username: formData.email.split('@')[0], // Auto-derive username from email
          employeeId: formData.employeeId,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          permissions: permissions
        }, 'main-admin');

        if (result.success && result.id) {
          const newUser: AdminUser = {
            id: result.id,
            email: formData.email,
            username: formData.username,
            employeeId: formData.employeeId,
            name: formData.name,
            role: formData.role,
            permissions: permissions,
            allowedPortals: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          };
          setUsers([...users, newUser]);
          showToast('User created successfully', 'success');
        } else {
          showToast(result.error || 'Failed to create user', 'error');
        }
      }
      closeModal();
    } catch (error) {
      console.error(error);
      showToast('Error saving user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      username: '',
      employeeId: '',
      password: '',
      name: '',
      role: 'receptionist'
    });
    setShowPassword(false);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      username: '',
      employeeId: '',
      password: '',
      name: '',
      role: 'receptionist'
    });
    setPermissions(defaultPermissions['receptionist']);
    setExpandedPortals([]);
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username || '',
      employeeId: user.employeeId || '',
      password: '', // Password hidden
      name: user.name || '',
      role: user.role
    });
    setPermissions(user.permissions || defaultPermissions[user.role] || {});
    setExpandedPortals([]);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      setDeleting(confirmId);
      await deleteSystemUser(confirmId);
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

  if (!isSuperAdmin) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <KeyIcon className="h-12 w-12 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-gray-500 mt-2 max-w-sm text-center">
            Only the System Administrator can manage admin users.
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
          <button onClick={openAddModal} className="inline-flex items-center justify-center rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#FF6A00]/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add User
          </button>
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Employee ID</th>
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
                          <div className="text-sm font-semibold text-gray-900">{user.name || 'Unnamed'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">@{user.username || user.email.split('@')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium font-mono">
                      {user.employeeId || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold capitalize border bg-gray-50 text-gray-700 border-gray-200`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== 'super_admin' && ( // Prevent editing/deleting super admin visually
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden transform transition-all scale-100 my-8 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{editingUser ? 'Edit Administrator' : 'New Administrator'}</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  {editingUser ? 'Update role, credentials, and access permissions.' : 'Configure a new system user with secure access control.'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shadow-sm ring-1 ring-gray-200">
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-8">
              <form id="userForm" onSubmit={handleSave} className="space-y-8" autoComplete="off">
                {/* Dummy fields to trick browser auto-fill */}
                <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Identity & Credentials */}
                  <div className="lg:col-span-1 space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">User Identity</h4>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-500">Full Name</label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent outline-none transition-all"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-500">Employee ID</label>
                          <input
                            type="text"
                            name="employeeId"
                            required
                            value={formData.employeeId}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent outline-none transition-all font-mono"
                            placeholder="e.g. EMP-001"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Login Credentials</h4>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-500">Email Address</label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={!!editingUser}
                            autoComplete="off"
                            className={`w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF6A00] outline-none transition-all ${editingUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50/50 focus:bg-white'}`}
                            placeholder="john@hotel.com"
                          />
                        </div>

                        {!editingUser && (
                          <div className="space-y-1.5 relative">
                            <label className="block text-xs font-semibold text-gray-500">Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={handleInputChange}
                                onFocus={(e) => e.target.removeAttribute('readonly')}
                                readOnly
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent outline-none transition-all pr-10"
                                placeholder="Min. 6 characters"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                              >
                                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-400">Temporary password for first login.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Roles & Permissions */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Role & Access Control</h4>

                      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-6">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide">Primary Role Template</label>
                          <div className="relative">
                            <select
                              name="role"
                              value={formData.role}
                              onChange={handleInputChange}
                              className="w-full appearance-none rounded-lg border border-blue-200 bg-white px-4 py-3 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                            >
                              <option value="receptionist">Front Desk (Receptionist)</option>
                              <option value="manager">Manager</option>
                              <option value="chef">Kitchen Staff (Chef)</option>
                              <option value="housekeeper">Housekeeping</option>
                              <option value="accountant">Accountant</option>
                              <option value="auditor">Auditor (Read Only)</option>
                              <option value="super_admin">System Administrator (Full Access)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <ChevronDownIcon className="h-4 w-4 text-blue-500" />
                            </div>
                          </div>
                          <p className="text-xs text-blue-600/80 mt-1">
                            Selecting a role applies a default permission set. You can customize it further below.
                          </p>
                        </div>
                      </div>

                      {/* Advanced Permissions Matrix */}
                      <div className="border rounded-xl overflow-hidden border-gray-200 bg-white shadow-sm">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <KeyIcon className="h-4 w-4 text-gray-400" />
                            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Granular Permissions</h5>
                          </div>
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-medium tracking-wide">CUSTOMIZABLE</span>
                        </div>
                        <div className="divide-y divide-gray-100 bg-white max-h-[400px] overflow-y-auto">
                          {PORTAL_SCHEMA.map((portal) => {
                            const isEnabled = permissions[portal.key]?.enabled || false;
                            const isExpanded = expandedPortals.includes(portal.key);

                            return (
                              <div key={portal.key} className="group transition-all duration-200">
                                <div className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer ${isEnabled ? 'bg-orange-50/20' : ''}`} onClick={() => togglePortalExpand(portal.key)}>
                                  <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="relative flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={(e) => handlePermissionToggle(portal.key, undefined, e.target.checked)}
                                        className="peer h-5 w-5 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded cursor-pointer transition-all"
                                      />
                                    </div>
                                    <span className={`text-sm font-semibold transition-colors ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>{portal.label}</span>
                                  </div>

                                  {isEnabled && portal.sections[0] !== 'all' && (
                                    <button
                                      type="button"
                                      className={`text-gray-400 hover:text-[#FF6A00] p-1 rounded-full hover:bg-orange-50 transition-all ${isExpanded ? 'bg-orange-50 text-[#FF6A00]' : ''}`}
                                    >
                                      {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                                    </button>
                                  )}
                                </div>

                                {/* Sections Drill-down */}
                                {isExpanded && isEnabled && portal.sections[0] !== 'all' && (
                                  <div className="bg-gray-50/50 px-12 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-gray-100 shadow-inner">
                                    {portal.sections.map(section => {
                                      const hasSection = !!permissions[portal.key]?.sections?.[section];
                                      return (
                                        <label key={section} className="flex items-center gap-2.5 cursor-pointer group/item select-none p-1.5 rounded-lg hover:bg-white/50 transition-colors">
                                          <div className="relative flex items-center">
                                            <input
                                              type="checkbox"
                                              checked={hasSection}
                                              onChange={(e) => handlePermissionToggle(portal.key, section, e.target.checked)}
                                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            />
                                          </div>
                                          <span className={`text-xs capitalize transition-colors ${hasSection ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                            {section.replace(/_/g, ' ')}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 z-10 backdrop-blur-md">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2.5 rounded-xl text-gray-700 font-semibold hover:bg-gray-200/50 hover:text-gray-900 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="userForm"
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-xl bg-[#FF6A00] text-white font-semibold hover:bg-[#FF6A00]/90 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center text-sm transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting && <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                {editingUser ? 'Save Updates' : 'Create Administrator'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to remove this user? This action is irreversible and they will lose access immediately."
        confirmText={deleting === confirmId ? 'Deleting...' : 'Delete User'}
        cancelText="Cancel"
      />
    </div>
  );
}
