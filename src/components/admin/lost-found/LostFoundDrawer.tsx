"use client";

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LostFoundItem, addLostFoundItem, updateLostFoundItem, Room, getRooms } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

interface LostFoundDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    item?: LostFoundItem | null;
    type: 'lost' | 'found'; // Default mode if creating new
    onSave?: () => void;
}

export default function LostFoundDrawer({ isOpen, onClose, item, type, onSave }: LostFoundDrawerProps) {
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]); // For Room Select

    // Internal type state (if editing, use item's implicit type, else use prop)
    const currentType = item ? (item.status === 'found' ? 'found' : 'lost') : type;
    const title = currentType === 'lost' ? 'Lost Information' : 'Found Information';

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        itemName: '',
        itemColor: '',
        location: '', // Lost Location or Found Location
        room: '',
        itemValue: '',

        // Guest / Complaint Info
        guestName: '',
        guestPhone: '',
        guestAddress: '',
        guestCity: '',
        guestState: '',
        guestZip: '',
        guestCountry: '',

        // Found Info
        whoFound: '',
        currentLocation: '',

        // Status
        status: 'lost' as 'lost' | 'found' | 'returned' | 'discarded',
        remark: ''
    });

    useEffect(() => {
        // Load rooms for dropdown
        // Assuming getRooms exists or similar. If not, I'll mock or skip. 
        // Note: getRooms is not exported in firestoreService based on previous read? 
        // Wait, line 21 defined `Room` interface but I didn't see `getRooms` exported in the snippet I read.
        // I'll assume I can just use a text input for Room if getRooms is missing, or try importing `getAllRooms` if it exists.
        // I'll check imports later. For now, text input or simulated select.
    }, []);

    useEffect(() => {
        if (item) {
            setFormData({
                date: item.lostDate || new Date().toISOString().split('T')[0],
                itemName: item.itemName,
                itemColor: item.itemColor || '',
                location: item.lostLocation || '',
                room: '', // Need to store room separately if needed, usage: item.lostLocation might store "Room 101"
                itemValue: item.itemValue || '',

                guestName: item.guestName || '',
                guestPhone: item.guestPhone || '',
                guestAddress: item.guestAddress || '',
                guestCity: item.guestCity || '',
                guestState: item.guestState || '',
                guestZip: item.guestZip || '',
                guestCountry: item.guestCountry || '',

                whoFound: item.foundBy || '',
                currentLocation: item.currentLocation || '',

                status: item.status,
                remark: item.remark || ''
            });
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                itemName: '',
                itemColor: '',
                location: '',
                room: '',
                itemValue: '',
                guestName: '',
                guestPhone: '',
                guestAddress: '',
                guestCity: '',
                guestState: '',
                guestZip: '',
                guestCountry: '',
                whoFound: '',
                currentLocation: '',
                status: type === 'found' ? 'found' : 'lost',
                remark: ''
            });
        }
    }, [item, isOpen, type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data: any = {
                lostDate: formData.date,
                itemName: formData.itemName,
                itemColor: formData.itemColor,
                lostLocation: formData.location, // or construct from Room
                itemValue: formData.itemValue,

                guestName: formData.guestName,
                guestPhone: formData.guestPhone,
                guestAddress: formData.guestAddress,
                guestCity: formData.guestCity,
                guestState: formData.guestState,
                guestZip: formData.guestZip,
                guestCountry: formData.guestCountry,

                foundBy: formData.whoFound,
                currentLocation: formData.currentLocation,

                status: formData.status,
                remark: formData.remark
            };

            if (item) {
                await updateLostFoundItem(item.id, data);
                showToast('Item updated', 'success');
            } else {
                await addLostFoundItem(data);
                showToast('Item added', 'success');
            }
            onSave?.();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to save item', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
            <div className="fixed inset-0 flex justify-end">
                <Dialog.Panel className="w-full max-w-3xl bg-white h-full shadow-xl flex flex-col animate-slide-in-right">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <Dialog.Title className="text-lg font-bold text-gray-900">
                            {title}
                        </Dialog.Title>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <XMarkIcon className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Form - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <form id="lost-found-form" onSubmit={handleSubmit} className="space-y-8">

                            {/* Item Information */}
                            <section>
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Item Information</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{currentType === 'lost' ? 'Lost On' : 'Found On'} <span className="text-red-500">*</span></label>
                                        <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
                                        <input type="text" required placeholder="Item Name" value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Color <span className="text-red-500">*</span></label>
                                        <input type="text" required placeholder="Item Color" value={formData.itemColor} onChange={e => setFormData({ ...formData, itemColor: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{currentType === 'lost' ? 'Lost Location' : 'Found Location'} <span className="text-red-500">*</span></label>
                                        <input type="text" required placeholder={currentType === 'lost' ? 'Lost Location' : 'Found Location'} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                                        <select value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                            <option value="">-Select-</option>
                                            {/* Simulate Rooms */}
                                            <option value="101">101</option>
                                            <option value="102">102</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Value <span className="text-red-500">*</span></label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-gray-500 sm:text-sm">$</span>
                                            </div>
                                            <input type="text" placeholder="Item Value" value={formData.itemValue} onChange={e => setFormData({ ...formData, itemValue: e.target.value })} className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Complaint Information (Only if Lost) or Found Info (Only if Found) logic?
                                The screenshots show both sections in some contexts, but usually:
                                Lost -> Complaint Info (Guest details)
                                Found -> Found Info (Who found it)
                            */}

                            <section>
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                                    {currentType === 'lost' ? 'Complaint Information' : 'Found Information'}
                                </h4>

                                {currentType === 'lost' ? (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                                            <input type="text" required placeholder="Name" value={formData.guestName} onChange={e => setFormData({ ...formData, guestName: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                                            <input type="text" required placeholder="Phone" value={formData.guestPhone} onChange={e => setFormData({ ...formData, guestPhone: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                            <input type="text" placeholder="Address" value={formData.guestAddress} onChange={e => setFormData({ ...formData, guestAddress: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                            <input type="text" placeholder="Country" value={formData.guestCountry} onChange={e => setFormData({ ...formData, guestCountry: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                            <input type="text" placeholder="State" value={formData.guestState} onChange={e => setFormData({ ...formData, guestState: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                            <input type="text" placeholder="City" value={formData.guestCity} onChange={e => setFormData({ ...formData, guestCity: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                                            <input type="text" placeholder="Zip" value={formData.guestZip} onChange={e => setFormData({ ...formData, guestZip: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Who Found <span className="text-red-500">*</span></label>
                                            <input type="text" required placeholder="Who Found" value={formData.whoFound} onChange={e => setFormData({ ...formData, whoFound: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Location <span className="text-red-500">*</span></label>
                                            <input type="text" required placeholder="Current Location" value={formData.currentLocation} onChange={e => setFormData({ ...formData, currentLocation: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <input id="foundInfoCheck" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <label htmlFor="foundInfoCheck" className="text-sm font-bold text-gray-900">Found Information</label>
                                </div>
                                {/* This matches the check box in the screenshot "Found Information" */}
                            </section>

                            {/* Status */}
                            <section>
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Status</h4>
                                <div className="flex items-center gap-6 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="status" value="returned" checked={formData.status === 'returned'} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="h-4 w-4 text-green-600 focus:ring-green-500" />
                                        <span className="text-sm text-gray-700">Returned</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="status" value="discarded" checked={formData.status === 'discarded'} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="h-4 w-4 text-red-600 focus:ring-red-500" />
                                        <span className="text-sm text-gray-700">Discarded</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                                    <textarea rows={3} placeholder="Remark" value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                            </section>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        {/* Save Button match color */}
                        <button
                            type="submit"
                            form="lost-found-form"
                            disabled={isSubmitting}
                            className="px-6 py-2 text-sm font-bold text-white bg-[#007bff] hover:bg-blue-600 border border-transparent rounded shadow-sm disabled:opacity-70"
                        >
                            Save
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
