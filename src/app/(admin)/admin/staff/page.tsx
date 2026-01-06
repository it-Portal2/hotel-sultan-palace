"use client";

import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { getStaffMembers, createStaffMember, updateStaffMember } from '@/lib/accountsService';
import type { StaffMember } from '@/lib/firestoreService';
import { PlusIcon, PencilIcon, UserGroupIcon, KeyIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import UserDrawer from '@/components/admin/users/UserDrawer';
import StaffDrawer from '@/components/admin/staff/StaffDrawer';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { HOTEL_DEPARTMENTS } from '@/lib/constants';

export default function StaffPage() {
    const { hasSectionAccess } = useAdminRole();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [filterDepartment, setFilterDepartment] = useState('all');

    // User Creation Drawer
    const [showUserDrawer, setShowUserDrawer] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; staff: StaffMember | null }>({ open: false, staff: null });

    // Permissions
    const canAddStaff = hasSectionAccess('staff', 'directory', 'read_write');
    const canEditStaff = hasSectionAccess('staff', 'directory', 'read_write');
    const canTerminateStaff = hasSectionAccess('staff', 'directory', 'full_control');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getStaffMembers();
        setStaff(data);
        setLoading(false);
    };

    const handleSave = async () => {
        // Drawer handles save internally via onSave callback which just needs to reload data
        setShowModal(false);
        setEditingStaff(null);
        loadData();
    };

    const handleMarkAsLeft = (member: StaffMember) => {
        setDeleteModal({ open: true, staff: member });
    };

    const confirmMarkAsLeft = async () => {
        if (deleteModal.staff) {
            await updateStaffMember(deleteModal.staff.id, { status: 'terminated', terminationDate: new Date() } as any);
            setDeleteModal({ open: false, staff: null });
            loadData();
        }
    };

    const filteredStaff = staff.filter(s =>
        filterDepartment === 'all' || s.department === filterDepartment
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-gray-600">Manage hotel staff and employees</p>
                </div>
                {canAddStaff ? (
                    <button
                        onClick={() => {
                            setEditingStaff(null);
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Staff
                    </button>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                        <PlusIcon className="h-5 w-5" />
                        Add Staff
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Staff</p>
                            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                        </div>
                        <UserGroupIcon className="h-8 w-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div>
                        <p className="text-sm text-gray-600">Active</p>
                        <p className="text-2xl font-bold text-green-600">
                            {staff.filter(s => s.status === 'active').length}
                        </p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div>
                        <p className="text-sm text-gray-600">On Leave</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {staff.filter(s => s.status === 'on_leave').length}
                        </p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div>
                        <p className="text-sm text-gray-600">Departments</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {new Set(staff.map(s => s.department)).size}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div>
                <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                >
                    <option value="all">All Departments</option>
                    {HOTEL_DEPARTMENTS.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStaff.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                        <div className="text-sm text-gray-500">{member.employeeId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {member.role.replace(/_/g, ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {member.department.replace(/_/g, ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{member.email}</div>
                                        <div className="text-sm text-gray-500">{member.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' :
                                            member.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {member.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-3">
                                            {canEditStaff && (
                                                <button
                                                    onClick={() => {
                                                        setEditingStaff(member);
                                                        setShowModal(true);
                                                    }}
                                                    className="text-[#FF6A00] hover:text-[#FF6A00]/80"
                                                    title="Edit Staff Details"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                            )}

                                            {canTerminateStaff && (
                                                <button
                                                    onClick={() => handleMarkAsLeft(member)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Mark as Left"
                                                >
                                                    <ArchiveBoxIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Staff Drawer */}
            <StaffDrawer
                open={showModal}
                staff={editingStaff}
                onClose={() => {
                    setShowModal(false);
                    setEditingStaff(null);
                }}
                onSave={handleSave}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, staff: null })}
                onConfirm={confirmMarkAsLeft}
                title="Confirm Staff Termination"
                message={`Are you sure you want to mark ${deleteModal.staff?.name} as Left? This action will set their status to Terminated.`}
                confirmText="Yes, Mark as Left"
                cancelText="Cancel"
                type="danger"
            />

            {/* User Drawer */}
            <UserDrawer
                open={showUserDrawer}
                onClose={() => {
                    setShowUserDrawer(false);
                    setSelectedStaffId('');
                }}
                onSave={() => {
                    // Optional: Show success message
                }}
                initialStaffId={selectedStaffId}
            />
        </div>
    );
}


