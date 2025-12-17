import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking } from '@/lib/firestoreService';
import { UserIcon, MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface GuestSelectorProps {
    onSelect: (booking: Booking) => void;
    selectedBooking: Booking | null;
}

export default function GuestSelector({ onSelect, selectedBooking }: GuestSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Booking[]>([]);
    const [searching, setSearching] = useState(false);

    // Search logic
    useEffect(() => {
        const searchGuests = async () => {
            if (searchTerm.length < 2) {
                setResults([]);
                return;
            }
            if (!db) return;

            setSearching(true);
            try {
                // Search by looking for checked-in guests
                // Firestore simple search (client-side filter for partial matches usually needed)
                const q = query(
                    collection(db, 'bookings'),
                    where('status', '==', 'checked_in')
                );

                const snapshot = await getDocs(q);
                const allCheckedIn = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));

                const lowerTerm = searchTerm.toLowerCase();
                const filtered = allCheckedIn.filter(b =>
                    b.guestDetails.firstName.toLowerCase().includes(lowerTerm) ||
                    b.guestDetails.lastName.toLowerCase().includes(lowerTerm) ||
                    (b.rooms[0]?.allocatedRoomType && b.rooms[0].allocatedRoomType.toLowerCase().includes(lowerTerm))
                );

                setResults(filtered.slice(0, 5));
            } catch (error) {
                console.error("Error searching guests:", error);
            } finally {
                setSearching(false);
            }
        };

        const debounce = setTimeout(searchGuests, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    return (
        <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Customer</h3>

            {selectedBooking ? (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md flex justify-between items-center group">
                    <div>
                        <div className="font-bold text-blue-900">{selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName}</div>
                        <div className="text-xs text-blue-700 flex items-center gap-1 mt-1">
                            <MapPinIcon className="h-3 w-3" />
                            Room: {selectedBooking.rooms[0]?.allocatedRoomType || 'Not Assigned'}
                        </div>
                    </div>
                    <button
                        onClick={() => onSelect(null as any)}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium underline"
                    >
                        Change
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search Guest or Room..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* Dropdown Results */}
                    {(results.length > 0 || searching) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md z-20 max-h-60 overflow-y-auto">
                            {searching && <div className="p-3 text-xs text-center text-gray-500">Searching...</div>}
                            {results.map(booking => (
                                <button
                                    key={booking.id}
                                    onClick={() => {
                                        onSelect(booking);
                                        setSearchTerm('');
                                        setResults([]);
                                    }}
                                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
                                >
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <UserIcon className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 text-sm">{booking.guestDetails.firstName} {booking.guestDetails.lastName}</div>
                                        <div className="text-xs text-gray-500">Room: {booking.rooms[0]?.allocatedRoomType || 'N/A'}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
