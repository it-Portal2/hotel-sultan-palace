"use client";

import React, { useState, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    UserGroupIcon,
    PhoneIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';
import { GuestProfile, getGuests } from '@/lib/firestoreService';
import GuestProfileDrawer from '@/components/admin/guest/GuestProfileDrawer';

export default function GuestDatabasePage() {
    const [guests, setGuests] = useState<GuestProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getGuests();
            setGuests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredGuests = guests.filter(g =>
        g.firstName.toLowerCase().includes(search.toLowerCase()) ||
        g.lastName.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()) ||
        g.phone.includes(search)
    );

    const handleEdit = (guest: GuestProfile) => {
        setSelectedGuest(guest);
        setIsDrawerOpen(true);
    };

    const handleCreate = () => {
        setSelectedGuest(null);
        setIsDrawerOpen(true);
    };

    return (
        <div className="space-y-6 pb-20 p-6 w-full animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <UserGroupIcon className="h-8 w-8 text-cyan-600" />
                        Guest Database
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage guest profiles, history, and preferences.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-[#FF6A00] text-white px-5 py-2.5 text-sm font-bold shadow hover:shadow-md hover:bg-[#e55f00] transition-all rounded-sm uppercase tracking-wide"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add New Guest
                    </button>
                </div>
            </div>

            {/* Search - Sharp & Minimal */}
            <div className="max-w-md w-full relative">
                <input
                    type="text"
                    placeholder="Search guests by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-transparent border-b-2 border-gray-300 focus:border-[#FF6A00] outline-none text-gray-900 placeholder:text-gray-400 font-medium transition-colors rounded-none focus:ring-0"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-2 top-3.5" />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden min-h-[500px] border-t-2 border-t-gray-100 rounded-none">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading guest profiles...</td>
                                </tr>
                            ) : filteredGuests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No guests found.</td>
                                </tr>
                            ) : (
                                filteredGuests.map((guest) => (
                                    <tr key={guest.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-lg">
                                                    {guest.firstName.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{guest.firstName} {guest.lastName}</div>
                                                    {guest.idDocumentNumber && (
                                                        <div className="text-xs text-gray-500">ID: {guest.idDocumentNumber}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 flex items-center gap-2">
                                                <EnvelopeIcon className="h-4 w-4 text-gray-400" /> {guest.email}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <PhoneIcon className="h-4 w-4 text-gray-400" /> {guest.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{guest.nationality || '-'}</div>
                                            <div className="text-xs text-gray-500">{guest.address?.city ? `${guest.address.city}, ` : ''}{guest.address?.country || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{guest.totalStays} Stays</div>
                                            <div className="text-xs text-gray-500">Last: {guest.lastStayDate ? new Date(guest.lastStayDate).toLocaleDateString() : 'Never'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(guest)}
                                                className="text-[#FF6A00] hover:text-[#e55f00] font-semibold"
                                            >
                                                Edit Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <GuestProfileDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                guest={selectedGuest}
                onSave={loadData}
            />
        </div>
    );
}
