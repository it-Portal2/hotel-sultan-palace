"use client";

import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
    getMasterData,
    addMasterData,
    updateMasterData,
    deleteMasterData,
    getAllBookings,
    Booking
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
    CurrencyDollarIcon,
    EyeIcon
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

// Helper component for Booking List Modal
const AgentBookingsModal = ({ agent, onClose }: { agent: TravelAgent; onClose: () => void }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            try {
                // Fetch all bookings and filter client-side
                const allBookings = await getAllBookings();
                const related = allBookings.filter(b => b.travelAgentId === agent.id);
                setBookings(related);
            } catch (error) {
                console.error("Error fetching agent bookings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [agent.id]);

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const estimatedCommission = (totalRevenue * agent.commissionRate) / 100;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <TicketIcon className="h-6 w-6 text-gray-500" />
                            {agent.name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Commission & Bookings Report</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="bg-gray-50 px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Total Booking Value</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Est. Commission ({agent.commissionRate}%)</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">${estimatedCommission.toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                            <p>Loading bookings...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <TicketIcon className="h-12 w-12 text-gray-300 mb-2" />
                            <p>No bookings linked to this agent yet.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In/Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                                            </div>
                                            <div className="text-xs text-gray-500">{booking.id.slice(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-500">To {new Date(booking.checkOut).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                    booking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                                        booking.status === 'checked_out' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                {booking.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                            ${booking.totalAmount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-bold">
                                            ${((booking.totalAmount || 0) * agent.commissionRate / 100).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

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

    const [viewingItem, setViewingItem] = useState<TravelAgent | null>(null);

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
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.contactPerson || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(searchQuery.toLowerCase())
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
                                                <button
                                                    onClick={() => setViewingItem(item)}
                                                    className="text-gray-500 hover:text-gray-900"
                                                    title="View Commissions"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </button>
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
            {isModalOpen && (
                <div className="fixed inset-0 overflow-hidden z-[60]">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity opacity-100 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)} />

                    <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
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
                                            <TicketIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            </div>
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
                                                <EnvelopeIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                <PhoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Country</label>
                                            <select
                                                value={COUNTRIES.includes(formData.country || 'Tanzania') ? (formData.country || 'Tanzania') : 'Other'}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === 'Other') {
                                                        setFormData({ ...formData, country: '' });
                                                    } else {
                                                        setFormData({ ...formData, country: val });
                                                    }
                                                }}
                                                className="block w-full text-sm border border-gray-300 bg-gray-50 focus:bg-white py-2.5 px-4 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none transition-colors mb-2"
                                            >
                                                {COUNTRIES.filter(c => c !== 'Other').map(c => <option key={c} value={c}>{c}</option>)}
                                                <option value="Other">Other (Type below)</option>
                                            </select>

                                            {(!COUNTRIES.includes(formData.country || '') || formData.country === '') && (
                                                <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.country || ''}
                                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                                        className="block w-full text-sm border border-gray-300 bg-white py-2.5 px-4 focus:ring-[#FF6A00] focus:border-[#FF6A00] rounded-none transition-colors"
                                                        placeholder="Type Country Name..."
                                                        autoFocus
                                                    />
                                                </div>
                                            )}
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

                                <div className="border-t border-gray-100 pt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-bold uppercase tracking-wide hover:bg-gray-50 bg-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-[#FF6A00] text-white text-sm font-bold uppercase tracking-wide hover:bg-[#e66000] shadow-sm"
                                    >
                                        {editingItem ? 'Update Travel Agent' : 'Save Travel Agent'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}


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

            {/* View Bookings Modal */}
            {viewingItem && (
                <AgentBookingsModal
                    agent={viewingItem}
                    onClose={() => setViewingItem(null)}
                />
            )}
        </div >
    );
}
