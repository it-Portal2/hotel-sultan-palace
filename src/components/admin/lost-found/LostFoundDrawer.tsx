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

const COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Australia", "India", "Germany", "France", "Italy", "Spain", "China", "Japan", "Brazil", "Mexico", "United Arab Emirates", "Saudi Arabia", "South Africa", "Other"
];

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "AED", "SAR"];

export default function LostFoundDrawer({ isOpen, onClose, item, type, onSave }: LostFoundDrawerProps) {
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);

    // Internal type state (if editing, use item's implicit type, else use prop)
    const currentType = item ? (item.status === 'found' ? 'found' : 'lost') : type;
    const title = currentType === 'lost' ? 'Add Lost Item' : 'Add Found Item';

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        itemName: '',
        itemColor: '',
        location: '', // Lost Location or Found Location
        roomName: '',
        category: '',
        itemValue: '',
        currency: 'USD',

        // Guest / Complaint Info
        guestName: '',
        guestPhone: '',
        guestAddress: '',
        guestCity: '',
        guestState: '',
        guestZip: '',
        guestCountry: '',
        guestEmail: '', // Added Email as it's common

        // Found Info
        whoFound: '',
        currentLocation: '', // Where kept

        // Status
        status: 'lost' as 'lost' | 'found' | 'returned' | 'discarded' | 'handover', // Added 'handover'
        remark: ''
    });

    useEffect(() => {
        // Load rooms
        const fetchRooms = async () => {
            const data = await getRooms();
            setRooms(data);
        };
        fetchRooms();
    }, []);

    useEffect(() => {
        if (item) {
            setFormData({
                date: item.lostDate || new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().slice(0, 5),
                itemName: item.itemName,
                itemColor: item.itemColor || '',
                location: item.lostLocation || '',
                roomName: item.roomName || '',
                category: item.category || '',
                itemValue: item.itemValue || '',
                currency: item.currency || 'USD',

                guestName: item.guestName || '',
                guestPhone: item.guestPhone || '',
                guestAddress: item.guestAddress || '',
                guestCity: item.guestCity || '',
                guestState: item.guestState || '',
                guestZip: item.guestZip || '',
                guestCountry: item.guestCountry || '',
                guestEmail: item.guestEmail || '',

                whoFound: item.foundBy || '',
                currentLocation: item.currentLocation || '',

                status: item.status as any,
                remark: item.remark || ''
            });
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().slice(0, 5),
                itemName: '',
                itemColor: '',
                location: '',
                roomName: '',
                category: '',
                itemValue: '',
                currency: 'USD',
                guestName: '',
                guestPhone: '',
                guestAddress: '',
                guestCity: '',
                guestState: '',
                guestZip: '',
                guestCountry: '',
                guestEmail: '',
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
                lostLocation: formData.location,
                roomName: formData.roomName,
                itemValue: formData.itemValue,
                currency: formData.currency,
                category: formData.category,

                guestName: formData.guestName,
                guestPhone: formData.guestPhone,
                guestEmail: formData.guestEmail,
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
        <Dialog open={isOpen} onClose={onClose} className="relative z-[60]">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" aria-hidden="true" />
            <div className="fixed inset-0 flex justify-end">
                <Dialog.Panel className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col transform transition-all animate-slide-in-right">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-gray-200 bg-white shadow-sm z-10">
                        <div>
                            <Dialog.Title className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                                {title}
                            </Dialog.Title>
                            <p className="text-sm text-gray-500 mt-1">Fill in the details below to record the item.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-all border border-gray-200 text-gray-500 hover:text-gray-700 hover:rotate-90 duration-300"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
                        <form id="lost-found-form" onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">

                            {/* Item Information Card */}
                            <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm">
                                <h4 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <span className="w-1 h-6 bg-[#FF6A00]"></span>
                                    Item Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{currentType === 'lost' ? 'Lost On' : 'Found On'} <span className="text-red-500">*</span></label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                required
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent"
                                            />
                                            <input
                                                type="time"
                                                value={formData.time}
                                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                                className="w-24 h-10 px-2 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Item Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Item Name"
                                            value={formData.itemName}
                                            onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent"
                                        >
                                            <option value="">-Select-</option>
                                            <option value="electronics">Electronics</option>
                                            <option value="clothing">Clothing</option>
                                            <option value="personal">Personal Accessories</option>
                                            <option value="documents">Documents</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Item Color</label>
                                        <input
                                            type="text"
                                            placeholder="Color"
                                            value={formData.itemColor}
                                            onChange={e => setFormData({ ...formData, itemColor: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{currentType === 'lost' ? 'Lost Location' : 'Found Location'}</label>
                                        <input
                                            type="text"
                                            placeholder="Location"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Room Name</label>
                                        <select
                                            value={formData.roomName}
                                            onChange={e => setFormData({ ...formData, roomName: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent"
                                        >
                                            <option value="">-Select-</option>
                                            <optgroup label="Garden Suite">
                                                <option value="ANANAS">ANANAS</option>
                                                <option value="DESERT ROSE">DESERT ROSE</option>
                                                <option value="JASMINE">JASMINE</option>
                                                <option value="LYCHEE">LYCHEE</option>
                                                <option value="MANGOSTEEN">MANGOSTEEN</option>
                                                <option value="TANGERINE">TANGERINE</option>
                                            </optgroup>
                                            <optgroup label="Imperial Suite">
                                                <option value="EUCALYPTUS">EUCALYPTUS</option>
                                                <option value="FLAMBOYANT">FLAMBOYANT</option>
                                                <option value="FRANGIPANI">FRANGIPANI</option>
                                                <option value="HIBISCUS">HIBISCUS</option>
                                                <option value="PAPAYA">PAPAYA</option>
                                            </optgroup>
                                            <optgroup label="Ocean Suite">
                                                <option value="BOUGAINVILLEA">BOUGAINVILLEA</option>
                                                <option value="CITRONELLA">CITRONELLA</option>
                                                <option value="OLEANDER">OLEANDER</option>
                                                <option value="PASSION FLOWER">PASSION FLOWER</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Item Value</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.currency}
                                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                                className="w-24 h-10 px-2 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent"
                                            >
                                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={formData.itemValue}
                                                onChange={e => setFormData({ ...formData, itemValue: e.target.value })}
                                                className="flex-1 h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Complaint / Finder Info */}
                            <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm">
                                <h4 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <span className="w-1 h-6 bg-blue-600"></span>
                                    {currentType === 'lost' ? 'Complaint Information' : 'Found Information'}
                                </h4>

                                <h4 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <span className="w-1 h-6 bg-blue-600"></span>
                                    {currentType === 'lost' ? 'Complaint Information' : 'Guest / Owner Information'}
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Name {currentType === 'lost' && <span className="text-red-500">*</span>}</label>
                                        <input
                                            type="text"
                                            required={currentType === 'lost'}
                                            placeholder="Guest Name"
                                            value={formData.guestName}
                                            onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            placeholder="Phone"
                                            value={formData.guestPhone}
                                            onChange={e => setFormData({ ...formData, guestPhone: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={formData.guestEmail}
                                            onChange={e => setFormData({ ...formData, guestEmail: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Address</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Address"
                                            value={formData.guestAddress}
                                            onChange={e => setFormData({ ...formData, guestAddress: e.target.value })}
                                            className="w-full p-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">City</label>
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={formData.guestCity}
                                            onChange={e => setFormData({ ...formData, guestCity: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">State</label>
                                        <input
                                            type="text"
                                            placeholder="State"
                                            value={formData.guestState}
                                            onChange={e => setFormData({ ...formData, guestState: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Country</label>
                                        <select
                                            value={formData.guestCountry}
                                            onChange={e => setFormData({ ...formData, guestCountry: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent"
                                        >
                                            <option value="">-Select-</option>
                                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Zip Code</label>
                                        <input
                                            type="text"
                                            placeholder="Zip"
                                            value={formData.guestZip}
                                            onChange={e => setFormData({ ...formData, guestZip: e.target.value })}
                                            className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                        />
                                    </div>
                                </div>

                                {currentType === 'found' && (
                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <h4 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-green-600"></span>
                                            Found Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Who Found <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Staff Name"
                                                    value={formData.whoFound}
                                                    onChange={e => setFormData({ ...formData, whoFound: e.target.value })}
                                                    className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Current Location</label>
                                                <input
                                                    type="text"
                                                    placeholder="Where kept?"
                                                    value={formData.currentLocation}
                                                    onChange={e => setFormData({ ...formData, currentLocation: e.target.value })}
                                                    className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Status</label>
                                                <select
                                                    value={formData.status}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                                    className="w-full h-10 px-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent"
                                                >
                                                    <option value="found">Found</option>
                                                    <option value="discarded">Discarded</option>
                                                    <option value="handover">Handover / Returned</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Remarks */}
                            <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Remark</label>
                                <textarea
                                    rows={4}
                                    placeholder="Enter remarks..."
                                    value={formData.remark}
                                    onChange={e => setFormData({ ...formData, remark: e.target.value })}
                                    className="w-full p-3 rounded-none border-b-2 border-gray-200 focus:border-[#FF6A00] outline-none text-sm bg-transparent placeholder-gray-400 resize-none"
                                />
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-gray-200 bg-white flex justify-end gap-3 z-10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-sm shadow-sm hover:bg-gray-50 uppercase tracking-wide"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="lost-found-form"
                            disabled={isSubmitting}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-[#FF6A00] hover:bg-[#E55F00] rounded-sm shadow-md transition-all uppercase tracking-wide disabled:opacity-70"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>

    );
}
