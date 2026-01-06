import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { HOTEL_DEPARTMENTS, STAFF_ROLES } from '@/lib/constants';
import type { StaffMember } from '@/lib/firestoreService';
import { createStaffMember, updateStaffMember } from '@/lib/accountsService';

interface StaffDrawerProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    staff?: StaffMember | null;
}

export default function StaffDrawer({ open, onClose, onSave, staff }: StaffDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<StaffMember>>({
        name: '',
        employeeId: '',
        role: 'other',
        department: 'front_office',
        email: '',
        phone: '',
        salary: 0,
        salaryType: 'monthly',
        status: 'active',
        // details
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        idProofType: 'National ID',
        idProofNumber: '',
        joinDate: new Date(),
        designation: ''
    });

    useEffect(() => {
        if (staff) {
            setFormData({
                ...staff,
                joinDate: staff.joinDate ? new Date(staff.joinDate) : new Date(),
                terminationDate: staff.terminationDate ? new Date(staff.terminationDate) : undefined,
            });
        } else {
            // Reset form for new staff
            setFormData({
                name: '',
                employeeId: '',
                role: 'other',
                department: 'front_office',
                email: '',
                phone: '',
                salary: 0,
                salaryType: 'monthly',
                status: 'active',
                address: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                idProofType: 'National ID',
                idProofNumber: '',
                joinDate: new Date(),
                designation: ''
            });
        }
    }, [staff, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                salary: Number(formData.salary),
                joinDate: formData.joinDate instanceof Date ? formData.joinDate : new Date(formData.joinDate as any),
            };

            if (staff && staff.id) {
                await updateStaffMember(staff.id, payload);
            } else {
                await createStaffMember(payload as any);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving staff:', error);
            alert('Failed to save staff member');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-transparent transition-opacity" onClick={onClose} />
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    <div className="pointer-events-auto w-screen max-w-md">
                        <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                            <div className="bg-orange-600 px-4 py-6 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-semibold leading-6 text-white">
                                        {staff ? 'Edit Staff Member' : 'New Staff Member'}
                                    </h2>
                                    <div className="ml-3 flex h-7 items-center">
                                        <button
                                            type="button"
                                            className="rounded-md bg-orange-600 text-orange-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">Close panel</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-1">
                                    <p className="text-sm text-orange-200">
                                        {staff ? 'Update staff details and status.' : 'Get started by filling in the information below to add a new staff member.'}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between">
                                <div className="divide-y divide-gray-200 px-4 sm:px-6">
                                    <div className="space-y-6 pb-5 pt-6">

                                        {/* Basic Info */}
                                        <div>
                                            <h3 className="text-sm font-medium leading-6 text-gray-900">Basic Information</h3>
                                            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                                <div className="sm:col-span-6">
                                                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Full Name</label>
                                                    <div className="mt-2">
                                                        <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="employeeId" className="block text-sm font-medium leading-6 text-gray-900">Employee ID</label>
                                                    <div className="mt-2">
                                                        <input type="text" name="employeeId" id="employeeId" value={formData.employeeId} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900">Role</label>
                                                    <div className="mt-2">
                                                        <input type="text" name="role" id="role" required value={formData.role} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">Phone</label>
                                                    <div className="mt-2">
                                                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
                                                    <div className="mt-2">
                                                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Employment Details */}
                                        <div>
                                            <h3 className="text-sm font-medium leading-6 text-gray-900">Employment Details</h3>
                                            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="department" className="block text-sm font-medium leading-6 text-gray-900">Department</label>
                                                    <div className="mt-2">
                                                        <select name="department" id="department" value={formData.department} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6">
                                                            {HOTEL_DEPARTMENTS.map(dept => (
                                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="designation" className="block text-sm font-medium leading-6 text-gray-900">Designation</label>
                                                    <div className="mt-2">
                                                        <input type="text" name="designation" id="designation" value={formData.designation} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="salary" className="block text-sm font-medium leading-6 text-gray-900">Salary</label>
                                                    <div className="mt-2">
                                                        <input type="number" name="salary" id="salary" value={formData.salary} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="salaryType" className="block text-sm font-medium leading-6 text-gray-900">Salary Type</label>
                                                    <div className="mt-2">
                                                        <select name="salaryType" id="salaryType" value={formData.salaryType} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6">
                                                            <option value="monthly">Monthly</option>
                                                            <option value="hourly">Hourly</option>
                                                            <option value="daily">Daily</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-6">
                                                    <label htmlFor="joinDate" className="block text-sm font-medium leading-6 text-gray-900">Joining Date</label>
                                                    <div className="mt-2">
                                                        <input type="date" name="joinDate" id="joinDate" value={formData.joinDate instanceof Date ? formData.joinDate.toISOString().split('T')[0] : ''} onChange={(e) => setFormData(prev => ({ ...prev, joinDate: new Date(e.target.value) }))} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Personal Details */}
                                        <div>
                                            <h3 className="text-sm font-medium leading-6 text-gray-900">Personal & Documents</h3>
                                            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                                <div className="sm:col-span-6">
                                                    <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">Address</label>
                                                    <div className="mt-2">
                                                        <textarea name="address" id="address" rows={2} value={formData.address} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="idProofType" className="block text-sm font-medium leading-6 text-gray-900">ID Type</label>
                                                    <div className="mt-2">
                                                        <select name="idProofType" id="idProofType" value={formData.idProofType} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6">
                                                            <option value="National ID">National ID</option>
                                                            <option value="Passport">Passport</option>
                                                            <option value="Drivers License">Driver's License</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="idProofNumber" className="block text-sm font-medium leading-6 text-gray-900">ID Number</label>
                                                    <div className="mt-2">
                                                        <input type="text" name="idProofNumber" id="idProofNumber" value={formData.idProofNumber} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="emergencyContactName" className="block text-sm font-medium leading-6 text-gray-900">Emergency Contact</label>
                                                    <div className="mt-2">
                                                        <input type="text" name="emergencyContactName" id="emergencyContactName" placeholder="Name" value={formData.emergencyContactName} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="emergencyContactPhone" className="block text-sm font-medium leading-6 text-gray-900">Emergency Phone</label>
                                                    <div className="mt-2">
                                                        <input type="tel" name="emergencyContactPhone" id="emergencyContactPhone" placeholder="Phone" value={formData.emergencyContactPhone} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        {staff && (
                                            <div>
                                                <h3 className="text-sm font-medium leading-6 text-gray-900">Status</h3>
                                                <div className="mt-4">
                                                    <select name="status" id="status" value={formData.status} onChange={handleChange} className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6">
                                                        <option value="active">Active</option>
                                                        <option value="on_leave">On Leave</option>
                                                        <option value="terminated">Terminated</option>
                                                        <option value="resigned">Resigned</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-shrink-0 justify-end px-4 py-4">
                                    <button type="button" className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={onClose}>Cancel</button>
                                    <button type="submit" disabled={loading} className="ml-4 inline-flex justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">
                                        {loading ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
