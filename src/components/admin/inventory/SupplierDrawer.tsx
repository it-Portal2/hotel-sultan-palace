import React, { useState, useEffect } from 'react';
import Drawer from '@/components/ui/Drawer';
import { createSupplier, updateSupplier } from '@/lib/inventoryService';
import type { Supplier } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

interface SupplierDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    supplier?: Supplier | null;
}

export default function SupplierDrawer({ isOpen, onClose, onSave, supplier }: SupplierDrawerProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        paymentTerms: 'Net 30'
    });

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name,
                contactPerson: supplier.contactPerson,
                email: supplier.email,
                phone: supplier.phone,
                address: supplier.address,
                paymentTerms: supplier.paymentTerms || 'Net 30'
            });
        } else {
            setFormData({
                name: '',
                contactPerson: '',
                email: '',
                phone: '',
                address: '',
                paymentTerms: 'Net 30'
            });
        }
    }, [supplier, isOpen]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "Company Name is required";
        if (!formData.contactPerson.trim()) newErrors.contactPerson = "Contact Person is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone is required";
        } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = "Invalid phone format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            if (supplier) {
                // Update
                await updateSupplier(supplier.id, formData); // Assuming updateSupplier exists, will verifying inventoryService
                showToast("Supplier updated successfully", "success");
            } else {
                // Create
                await createSupplier({
                    ...formData,
                    isActive: true
                });
                showToast("Supplier added successfully", "success");
            }
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Failed to save supplier", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={supplier ? "Edit Supplier" : "Add New Supplier"}
            size="md"
        >
            <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => {
                            setFormData({ ...formData, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] transition-all ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="e.g. Sysco Foods"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                        type="text"
                        required
                        value={formData.contactPerson}
                        onChange={e => {
                            setFormData({ ...formData, contactPerson: e.target.value });
                            if (errors.contactPerson) setErrors({ ...errors, contactPerson: '' });
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] transition-all ${errors.contactPerson ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="e.g. John Doe"
                    />
                    {errors.contactPerson && <p className="text-xs text-red-500 mt-1">{errors.contactPerson}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] transition-all ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={e => {
                                setFormData({ ...formData, phone: e.target.value });
                                if (errors.phone) setErrors({ ...errors, phone: '' });
                            }}
                            className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] transition-all ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                        required
                        value={formData.address}
                        onChange={e => {
                            setFormData({ ...formData, address: e.target.value });
                            if (errors.address) setErrors({ ...errors, address: '' });
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] transition-all ${errors.address ? 'border-red-500' : 'border-gray-200'}`}
                        rows={3}
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <div className="relative">
                        <select
                            value={formData.paymentTerms}
                            onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] appearance-none transition-all"
                        >
                            <option value="Immediate">Immediate</option>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                            <option value="Net 60">Net 60</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-[#FF6A00] text-white rounded-xl hover:bg-[#FF6A00]/90 font-bold shadow-lg shadow-orange-500/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (supplier ? 'Update Supplier' : 'Add Supplier')}
                    </button>
                </div>
            </form>
        </Drawer>
    );
}
