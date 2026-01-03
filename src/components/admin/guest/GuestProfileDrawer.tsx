"use client";

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GuestProfile, addGuest, updateGuest } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

interface GuestProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    guest?: GuestProfile | null;
    onSave?: () => void;
}

export default function GuestProfileDrawer({ isOpen, onClose, guest, onSave }: GuestProfileDrawerProps) {
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationality: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        idDocumentType: 'Passport',
        idDocumentNumber: '',
        preferences: '',
        notes: ''
    });

    useEffect(() => {
        if (guest) {
            setFormData({
                firstName: guest.firstName,
                lastName: guest.lastName,
                email: guest.email,
                phone: guest.phone,
                nationality: guest.nationality || '',
                street: guest.address?.street || '',
                city: guest.address?.city || '',
                state: guest.address?.state || '',
                zipCode: guest.address?.zipCode || '',
                country: guest.address?.country || '',
                idDocumentType: guest.idDocumentType || 'Passport',
                idDocumentNumber: guest.idDocumentNumber || '',
                preferences: guest.preferences || '',
                notes: guest.notes || ''
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                nationality: '',
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
                idDocumentType: 'Passport',
                idDocumentNumber: '',
                preferences: '',
                notes: ''
            });
        }
    }, [guest, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const guestData: any = { // Typo fix: removed duplicate any
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                nationality: formData.nationality,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                },
                idDocumentType: formData.idDocumentType,
                idDocumentNumber: formData.idDocumentNumber,
                preferences: formData.preferences,
                notes: formData.notes,
                // Stats default for new
                totalStays: guest ? guest.totalStays : 0,
                totalRevenue: guest ? guest.totalRevenue : 0,
            };

            if (guest) {
                await updateGuest(guest.id, guestData);
                showToast('Guest profile updated', 'success');
            } else {
                await addGuest(guestData);
                showToast('New guest added', 'success');
            }
            onSave?.();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to save guest profile', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
            <div className="fixed inset-0 flex justify-end">
                <Dialog.Panel className="w-full max-w-2xl bg-white h-full shadow-xl flex flex-col animate-slide-in-right">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <Dialog.Title className="text-lg font-bold text-gray-900">
                            {guest ? 'Edit Guest Profile' : 'New Guest Profile'}
                        </Dialog.Title>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <XMarkIcon className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="guest-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <section>
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Personal Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nationality</label>
                                        <input
                                            type="text"
                                            value={formData.nationality}
                                            onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Address */}
                            <section>
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Address</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Street Address</label>
                                        <input
                                            type="text"
                                            value={formData.street}
                                            onChange={e => setFormData({ ...formData, street: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">State / Province</label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Zip / Postal Code</label>
                                        <input
                                            type="text"
                                            value={formData.zipCode}
                                            onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Country</label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={e => setFormData({ ...formData, country: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ID & Preferences */}
                            <section>
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Identification & Preferences</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ID Type</label>
                                        <select
                                            value={formData.idDocumentType}
                                            onChange={e => setFormData({ ...formData, idDocumentType: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        >
                                            <option>Passport</option>
                                            <option>National ID</option>
                                            <option>Driving License</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ID Number</label>
                                        <input
                                            type="text"
                                            value={formData.idDocumentNumber}
                                            onChange={e => setFormData({ ...formData, idDocumentNumber: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Preferences / Special Requests</label>
                                        <textarea
                                            rows={2}
                                            value={formData.preferences}
                                            onChange={e => setFormData({ ...formData, preferences: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Notes (Internal)</label>
                                        <textarea
                                            rows={2}
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </section>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="guest-form"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#FF6A00] border border-transparent rounded-md hover:bg-[#ff5500] shadow-sm disabled:opacity-70"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
