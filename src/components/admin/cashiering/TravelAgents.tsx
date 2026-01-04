"use client";

import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
    getMasterData,
    addMasterData,
    updateMasterData,
    deleteMasterData
} from '@/lib/firestoreService';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    UserIcon,
    TicketIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const COUNTRIES = [
    "Tanzania", "United States", "United Kingdom", "Germany", "France", "Italy", "Spain", "Kenya", "Uganda", "South Africa", "India", "China", "United Arab Emirates", "Other"
];

interface TravelAgent {
    id: string;
    name: string; // Agency Name
    contactPerson: string;
    email: string;
    phone: string;
    country: string;
    commissionRate: number;
    balance?: number;
    isActive: boolean;
    createdAt?: any;
}

export default function TravelAgents() {
    const { isReadOnly, adminUser } = useAdminRole();
    const { showToast } = useToast();

    const [data, setData] = useState<TravelAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);

    const [editingItem, setEditingItem] = useState<TravelAgent | null>(null);
    const [formData, setFormData] = useState<Partial<TravelAgent>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await getMasterData('travelAgents');
            setData(result as TravelAgent[]);
        } catch (error) {
            console.error(error);
            showToast('Failed to load travel agents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({
            country: 'Tanzania',
            commissionRate: 10,
            isActive: true,
            balance: 0
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item: TravelAgent) => {
        setEditingItem(item);
        setFormData({ ...item });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setIdToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            const success = await deleteMasterData('travelAgents', idToDelete, { user: adminUser?.name || 'Admin', ip: '127.0.0.1' });
            if (success) {
                showToast('Travel agent deleted successfully', 'success');
                loadData();
            } else {
                showToast('Failed to delete travel agent', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error deleting travel agent', 'error');
        } finally {
            setShowDeleteModal(false);
            setIdToDelete(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (editingItem) {
                const success = await updateMasterData('travelAgents', editingItem.id, payload, { user: adminUser?.name || 'Admin', ip: '127.0.0.1' });
                if (success) {
                    showToast('Travel agent updated successfully', 'success');
                    setIsModalOpen(false);
                    loadData();
                } else {
                    showToast('Failed to update travel agent', 'error');
                }
            } else {
                const id = await addMasterData('travelAgents', payload, { user: adminUser?.name || 'Admin', ip: '127.0.0.1' });
                if (id) {
                    showToast('Travel agent created successfully', 'success');
                    setIsModalOpen(false);
                    loadData();
                } else {
                    showToast('Failed to create travel agent', 'error');
                }
            }
        } catch (error) {
            console.error(error);
            showToast('Error saving travel agent', 'error');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading travel agents...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Travel Agent Database</h1>
                    <p className="text-sm text-gray-500">Manage agencies and commissions</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Name/Email..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
                        />
                    </div>
                    {!isReadOnly && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add Travel Agent
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Agent Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact Person</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Country</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Balance($)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No travel agents found.</td></tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{item.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.contactPerson}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.country}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.phone}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                                            {(item.balance || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900"><PencilIcon className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Drawer */}
            <div className={`fixed inset-0 overflow-hidden z-[60] ${isModalOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsModalOpen(false)} />

                <div className={`absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isModalOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col h-full`}>
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingItem ? 'Edit Travel Agent' : 'Add New Travel Agent'}
                        </h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 transition-colors">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="travel-agent-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Agency Name <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="block w-full text-sm border border-gray-300 bg-gray-50 focus:bg-white py-2.5 px-4 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none transition-colors"
                                            placeholder="Agency Name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Contact Person <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            value={formData.contactPerson || ''}
                                            onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                            className="block w-full text-sm border border-gray-300 bg-gray-50 focus:bg-white py-2.5 px-4 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none transition-colors"
                                            placeholder="Contact Name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Country</label>
                                    <select
                                        value={formData.country || 'Tanzania'}
                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                        className="block w-full text-sm border border-gray-300 bg-gray-50 focus:bg-white py-2.5 px-4 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none transition-colors"
                                    >
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            required
                                            value={formData.email || ''}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="block w-full text-sm border border-gray-300 bg-gray-50 focus:bg-white py-2.5 px-4 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none transition-colors"
                                            placeholder="agent@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone || ''}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="block w-full text-sm border border-gray-300 bg-gray-50 focus:bg-white py-2.5 px-4 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none transition-colors"
                                            placeholder="+255..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Commission Rate (%)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">%</span>
                                        <input
                                            type="number"
                                            value={formData.commissionRate || 0}
                                            onChange={e => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                                            className="block w-full text-sm border border-gray-300 bg-gray-50 focus:bg-white py-2.5 pl-8 pr-4 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Balance ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input
                                            type="number"
                                            value={formData.balance || 0}
                                            onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })}
                                            className="block w-full text-sm border border-gray-300 bg-gray-50 focus:bg-white py-2.5 pl-8 pr-4 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none transition-colors"
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center pt-2 md:col-span-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive ?? true}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="h-5 w-5 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded-none"
                                    />
                                    <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-700">
                                        Active Status
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 font-medium hover:bg-gray-50 transition-colors rounded-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="travel-agent-form"
                            className="px-6 py-2.5 bg-[#FF6A00] text-white font-medium hover:bg-[#e66000] transition-colors shadow-sm rounded-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6A00]"
                        >
                            {editingItem ? 'Update Travel Agent' : 'Save Travel Agent'}
                        </button>
                    </div>
                </div>
            </div>


            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Travel Agent"
                message="Are you sure you want to delete this travel agent? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div >
    );
}
