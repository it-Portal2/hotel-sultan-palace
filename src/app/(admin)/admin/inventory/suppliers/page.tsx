"use client";

import React, { useState, useEffect } from 'react';
import { getSuppliers, createSupplier } from '@/lib/inventoryService';
import type { Supplier } from '@/lib/firestoreService';
import { PlusIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import Modal from '../../../../../components/ui/Modal';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        paymentTerms: 'Net 30'
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error(error);
            showToast("Failed to load suppliers", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createSupplier({
                ...formData,
                isActive: true
            });
            showToast("Supplier added successfully", "success");
            setIsModalOpen(false);
            setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: 'Net 30' });
            loadData();
        } catch (error) {
            console.error(error);
            showToast("Failed to add supplier", "error");
        }
    };

    return (
        <div className="space-y-6">
            {/* Compact Header */}
            <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-sm">
                    {/* Search bar could go here */}
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                    <PlusIcon className="w-4 h-4" />
                    Add Supplier
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading suppliers...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {suppliers.map(supplier => (
                                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{supplier.name}</div>
                                                <div className="text-xs text-gray-500">Terms: {supplier.paymentTerms}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{supplier.contactPerson}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <EnvelopeIcon className="w-3 h-3" />
                                                <a href={`mailto:${supplier.email}`} className="hover:text-blue-600">{supplier.email}</a>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <PhoneIcon className="w-3 h-3" />
                                                {supplier.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${supplier.isActive
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                            {supplier.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {suppliers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                        No suppliers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Supplier">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            placeholder="e.g. Sysco Foods"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                        <input
                            type="text"
                            required
                            value={formData.contactPerson}
                            onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                            required
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                        <select
                            value={formData.paymentTerms}
                            onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 focus:border-[#FF6A00] focus:ring-0 outline-none"
                        >
                            <option value="Immediate">Immediate</option>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                            <option value="Net 60">Net 60</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors"
                        >
                            Add Supplier
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
