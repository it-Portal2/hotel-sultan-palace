"use client";

import React, { useState, useEffect } from 'react';
import {
    LockClosedIcon,
    TrashIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getSystemLocks, deleteSystemLock, SystemLock, addSystemLock } from '@/lib/firestoreService';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';

export default function NetLocksPage() {
    const { adminUser } = useAdminRole();
    const { showToast } = useToast();
    const [locks, setLocks] = useState<SystemLock[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocks, setSelectedLocks] = useState<string[]>([]);
    const [refresh, setRefresh] = useState(0);

    // Search & Add Lock State
    const [isAddMode, setIsAddMode] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        loadData();
    }, [refresh]);

    // Load available bookings when search term changes (debounce could be better, but keeping simple for now)
    useEffect(() => {
        if (!isAddMode) return;

        const loadBookings = async () => {
            // Basic implementation: fetch all and filter client side for now as we don't have extensive backend search
            // In real world with thousands, utilize firestore queries
            const { getAllBookings } = await import('@/lib/firestoreService');
            const all = await getAllBookings();
            setBookings(all.filter(b =>
                (b.status === 'checked_in' || b.status === 'confirmed')
            ));
        };
        loadBookings();
    }, [isAddMode]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSystemLocks();
            setLocks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = async () => {
        if (selectedLocks.length === 0) return;

        try {
            const results = await Promise.all(selectedLocks.map(id => deleteSystemLock(id)));
            const successCount = results.filter(r => r === true).length;
            const failCount = results.filter(r => r === false).length;

            if (successCount > 0) {
                if (failCount > 0) {
                    showToast(`Unlocked ${successCount} items. Failed to unlock ${failCount} items.`, 'warning');
                } else {
                    showToast('Locks removed successfully', 'success');
                }
                setSelectedLocks([]);
                setRefresh(prev => prev + 1);
            } else {
                showToast('Failed to unlock selected items', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('An unexpected error occurred', 'error');
        }
    };

    const handleAddLock = async (booking: any) => {
        try {
            await addSystemLock({
                resourceType: 'folio',
                resourceId: booking.id,
                resourceName: `Folio: ${booking.bookingId} • ${booking.guestDetails?.firstName || ''} ${booking.guestDetails?.lastName || ''}`,
                lockedBy: adminUser?.name || 'admin',
                lockedAt: new Date(),
                description: `Room: ${booking.roomNumber || 'Pre-Arrival'}`
            });
            showToast('Folio locked successfully', 'success');
            setIsAddMode(false);
            setRefresh(prev => prev + 1);
        } catch (e) {
            console.error(e);
            showToast('Failed to create lock', 'error');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedLocks(locks.map(l => l.id));
        } else {
            setSelectedLocks([]);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedLocks(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filteredBookings = bookings.filter(b => {
        const term = searchTerm.toLowerCase();
        const guest = `${b.guestDetails?.firstName || ''} ${b.guestDetails?.lastName || ''}`.toLowerCase();
        const id = (b.bookingId || '').toLowerCase();
        const room = (b.roomNumber || '').toLowerCase();
        return guest.includes(term) || id.includes(term) || room.includes(term);
    });

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800">Net locks</h1>
                <button
                    onClick={() => setIsAddMode(!isAddMode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-medium transition-colors"
                >
                    {isAddMode ? 'Cancel Selection' : '+ Add Lock'}
                </button>
            </div>

            {/* Add Lock Area */}
            {isAddMode && (
                <div className="bg-white border-b p-6 animate-fadeIn">
                    <div className="max-w-2xl">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Booking to Lock</label>
                        <div className="relative mb-4">
                            <input
                                type="text"
                                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2"
                                placeholder="Search by guest name, room or booking ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                <MagnifyingGlassIcon className="h-4 w-4" />
                            </div>
                        </div>

                        {/* Results List */}
                        <div className="border rounded-md max-h-48 overflow-auto bg-gray-50">
                            {filteredBookings.length === 0 ? (
                                <div className="p-3 text-center text-gray-400 text-sm">No bookings found</div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredBookings.slice(0, 10).map(b => (
                                        <div key={b.id} className="p-3 flex justify-between items-center bg-white hover:bg-blue-50 transition-colors">
                                            <div>
                                                <div className="font-medium text-sm text-gray-900">
                                                    {b.guestDetails?.firstName} {b.guestDetails?.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    #{b.bookingId} • Room: {b.roomNumber || 'N/A'} • {b.status}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddLock(b)}
                                                className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 hover:bg-red-100"
                                            >
                                                Lock Folio
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* List Header */}
            <div className="bg-gray-100 px-6 py-2 flex items-center border-b">
                <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={locks.length > 0 && selectedLocks.length === locks.length}
                />
                <span className="ml-3 text-sm font-semibold text-gray-700">Locks</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-white p-6">
                {loading ? (
                    <div className="text-center text-gray-500 text-sm">Loading...</div>
                ) : locks.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                        <LockClosedIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        No active locks
                    </div>
                ) : (
                    <div className="space-y-4">
                        {locks.map(lock => (
                            <div key={lock.id} className="group flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors shadow-sm">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedLocks.includes(lock.id)}
                                        onChange={() => toggleSelect(lock.id)}
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-blue-800 flex items-center gap-2">
                                            {lock.resourceName}
                                        </div>
                                        <div className="text-sm font-bold text-gray-700 mt-1">
                                            {lock.description}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Locked by: <span className="font-semibold text-gray-700">{lock.lockedBy}</span> {new Date(lock.lockedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                                    <LockClosedIcon className="h-4 w-4 text-red-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="bg-white border-t px-6 py-3 flex justify-end gap-3">
                <button
                    onClick={() => setSelectedLocks([])}
                    className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded bg-white hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleUnlock}
                    disabled={selectedLocks.length === 0}
                    className={`px-4 py-1.5 text-sm rounded font-medium shadow-sm transition-colors
                        ${selectedLocks.length > 0
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                    Unlock Selected
                </button>
            </div>
        </div>
    );
}
