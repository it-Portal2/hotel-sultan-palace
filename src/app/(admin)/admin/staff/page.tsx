"use client";

import React, { useState, useEffect } from 'react';
import { getStaffMembers, createStaffMember, updateStaffMember } from '@/lib/accountsService';
import type { StaffMember } from '@/lib/firestoreService';
import { PlusIcon, PencilIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [filterDepartment, setFilterDepartment] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getStaffMembers();
        setStaff(data);
        setLoading(false);
    };

    const handleSave = async (formData: Partial<StaffMember>) => {
        if (editingStaff) {
            await updateStaffMember(editingStaff.id, formData);
        } else {
            await createStaffMember(formData as Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>);
        }
        setShowModal(false);
        setEditingStaff(null);
        loadData();
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
                    <option value="front_office">Front Office</option>
                    <option value="housekeeping">Housekeeping</option>
                    <option value="food_beverage">Food & Beverage</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="management">Management</option>
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
                                        <button
                                            onClick={() => {
                                                setEditingStaff(member);
                                                setShowModal(true);
                                            }}
                                            className="text-[#FF6A00] hover:text-[#FF6A00]/80"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <StaffModal
                    staff={editingStaff}
                    onClose={() => {
                        setShowModal(false);
                        setEditingStaff(null);
                    }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

function StaffModal({
    staff,
    onClose,
    onSave
}: {
    staff: StaffMember | null;
    onClose: () => void;
    onSave: (data: Partial<StaffMember>) => void;
}) {
    const [formData, setFormData] = useState<Partial<StaffMember>>(
        staff || {
            employeeId: '',
            name: '',
            email: '',
            phone: '',
            role: 'other',
            department: 'front_office',
            salary: 0,
            salaryType: 'monthly',
            joinDate: new Date(),
            status: 'active',
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{staff ? 'Edit Staff' : 'Add New Staff'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <input
                                type="text"
                                required
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffMember['role'] })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            >
                                <option value="manager">Manager</option>
                                <option value="front_desk">Front Desk</option>
                                <option value="housekeeping">Housekeeping</option>
                                <option value="kitchen">Kitchen</option>
                                <option value="waiter">Waiter</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value as StaffMember['department'] })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            >
                                <option value="front_office">Front Office</option>
                                <option value="housekeeping">Housekeeping</option>
                                <option value="food_beverage">Food & Beverage</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="management">Management</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
                            <select
                                value={formData.salaryType}
                                onChange={(e) => setFormData({ ...formData, salaryType: e.target.value as StaffMember['salaryType'] })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="hourly">Hourly</option>
                                <option value="daily">Daily</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffMember['status'] })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                            >
                                <option value="active">Active</option>
                                <option value="on_leave">On Leave</option>
                                <option value="terminated">Terminated</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors"
                        >
                            {staff ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
