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
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <Dialog.Title className="text-xl font-bold text-gray-900 tracking-tight">
                            {guest ? 'Edit Guest Profile' : 'New Guest Profile'}
                        </Dialog.Title>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <XMarkIcon className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        <form id="guest-form" onSubmit={handleSubmit} className="space-y-8">
                            {/* Basic Info */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                                    <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-xs">01</span> Personal Information
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nationality</label>
                                        <input
                                            type="text"
                                            value={formData.nationality}
                                            onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                            placeholder="e.g. Indian, American..."
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Address */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs">02</span> Address Details
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
                                        <input
                                            type="text"
                                            value={formData.street}
                                            onChange={e => setFormData({ ...formData, street: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">State / Province</label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Zip / Postal Code</label>
                                        <input
                                            type="text"
                                            value={formData.zipCode}
                                            onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={e => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ID & Preferences */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 border-b border-gray-100 pb-3 flex items-center gap-2">
                                    <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-xs">03</span> ID & Preferences
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">ID Type</label>
                                        <div className="relative">
                                            <select
                                                value={formData.idDocumentType}
                                                onChange={e => setFormData({ ...formData, idDocumentType: e.target.value })}
                                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none appearance-none"
                                            >
                                                <option>Passport</option>
                                                <option>National ID</option>
                                                <option>Driving License</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">ID Document Number</label>
                                        <input
                                            type="text"
                                            value={formData.idDocumentNumber}
                                            onChange={e => setFormData({ ...formData, idDocumentNumber: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Preferences / Special Requests</label>
                                        <textarea
                                            rows={3}
                                            value={formData.preferences}
                                            onChange={e => setFormData({ ...formData, preferences: e.target.value })}
                                            placeholder="e.g. Vegetarian meal, Extra pillows, Room near elevator..."
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none resize-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Internal Notes</label>
                                        <textarea
                                            rows={2}
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Staff only notes..."
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] py-3 px-4 bg-gray-50 focus:bg-white transition-all outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </section>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 sticky bottom-0 z-10 backdrop-blur-sm">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all uppercase tracking-wide"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="guest-form"
                            disabled={isSubmitting}
                            className="px-8 py-3 text-sm font-bold text-white bg-gray-900 border border-transparent rounded-xl hover:bg-black shadow-lg shadow-gray-200 hover:shadow-gray-300 transition-all uppercase tracking-wide disabled:opacity-70 transform active:scale-95"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
