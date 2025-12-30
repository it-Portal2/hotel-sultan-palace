import React, { useState, useEffect } from 'react';
import { Booking, getRoomTypes, getRoomStatuses, RoomType } from '@/lib/firestoreService';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface CheckInModalProps {
    booking: Booking;
    roomIndex?: number; // Optional specific room index
    onClose: () => void;
    onConfirm: (data: CheckInData) => Promise<void>;
    processing: boolean;
}

export interface CheckInData {
    staffName: string;
    idDocumentType: string;
    idDocumentNumber?: string;
    roomKeyNumber?: string;
    depositAmount?: string;
    notes?: string;
    allocatedRoomName: string;
}

export default function CheckInModal({ booking, roomIndex, onClose, onConfirm, processing }: CheckInModalProps) {
    const [formData, setFormData] = useState<CheckInData>({
        staffName: '',
        idDocumentType: 'passport',
        idDocumentNumber: '',
        roomKeyNumber: '',
        depositAmount: '',
        notes: '',
        allocatedRoomName: '',
    });

    const [availableRooms, setAvailableRooms] = useState<RoomType[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);

    // Determine target room for context
    const rIndex = roomIndex !== undefined ? roomIndex : 0;
    const targetRoom = booking.rooms[rIndex] || booking.rooms[0];

    useEffect(() => {
        const fetchRooms = async () => {
            setLoadingRooms(true);
            try {
                // Fetch all room types (specific units) and statuses
                const [allRooms, allStatuses] = await Promise.all([
                    getRoomTypes(),
                    getRoomStatuses()
                ]);

                // Filter rooms by specific room's suite type
                const bookingSuite = targetRoom.suiteType || 'Garden Suite';
                const suiteRooms = allRooms.filter(r => r.suiteType === bookingSuite);

                // Filter for available rooms
                const available = suiteRooms.filter(room => {
                    // Check if there is a status record for this room
                    const status = allStatuses.find(s => s.roomName === room.roomName);

                    // If no status record exists, strictly it might be available, BUT in this system 
                    // we assume rooms usually have a status. If not, we assume available.
                    if (!status) return true;

                    // Filter out occupied or maintenance
                    return status.status !== 'occupied' && status.status !== 'maintenance';
                });

                setAvailableRooms(available);

                // Auto-select if allocated or only one available
                if (targetRoom.allocatedRoomType) {
                    setFormData(prev => ({ ...prev, allocatedRoomName: targetRoom.allocatedRoomType! }));
                } else if (available.length === 1) {
                    setFormData(prev => ({ ...prev, allocatedRoomName: available[0].roomName }));
                }
            } catch (error) {
                console.error("Error fetching rooms", error);
            } finally {
                setLoadingRooms(false);
            }
        };

        fetchRooms();
    }, [booking, targetRoom]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="fixed inset-0 bg-transparent" onClick={onClose}></div>
            <div className="relative bg-white shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-gray-100" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)' }}>
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Check-In Guest</h3>
                        <p className="text-gray-500 text-sm mt-0.5 font-mono">ID: {booking.bookingId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Guest Info Section */}
                    <div className="bg-gray-50/50 p-4 border border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Guest</p>
                            <p className="font-bold text-gray-900 text-lg">{booking.guestDetails.firstName} {booking.guestDetails.lastName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Suite Type</p>
                            <p className="font-bold text-gray-900 text-lg">{targetRoom.suiteType}</p>
                        </div>
                    </div>

                    <form id="checkInForm" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            {/* Room Assignment */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign Room *</label>
                                {loadingRooms ? (
                                    <div className="text-sm text-gray-500 animate-pulse">Loading available rooms...</div>
                                ) : (
                                    <select
                                        required
                                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all"
                                        value={formData.allocatedRoomName}
                                        onChange={(e) => setFormData({ ...formData, allocatedRoomName: e.target.value })}
                                    >
                                        <option value="">-- Select a Room --</option>
                                        {availableRooms.map(room => (
                                            <option key={room.id} value={room.roomName}>{room.roomName}</option>
                                        ))}
                                    </select>
                                )}
                                {availableRooms.length === 0 && !loadingRooms && (
                                    <p className="text-xs text-red-500 mt-1">No rooms available for this suite type!</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Processed By (Staff Name) *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all placeholder:text-gray-400"
                                    value={formData.staffName}
                                    onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID Type</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all"
                                        value={formData.idDocumentType}
                                        onChange={(e) => setFormData({ ...formData, idDocumentType: e.target.value })}
                                    >
                                        <option value="passport">Passport</option>
                                        <option value="driving_license">Driving License</option>
                                        <option value="id_card">National ID</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID Number</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all placeholder:text-gray-400"
                                        value={formData.idDocumentNumber}
                                        onChange={(e) => setFormData({ ...formData, idDocumentNumber: e.target.value })}
                                        placeholder="Document #"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Key Card #</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all placeholder:text-gray-400"
                                        value={formData.roomKeyNumber}
                                        onChange={(e) => setFormData({ ...formData, roomKeyNumber: e.target.value })}
                                        placeholder="e.g. 101-A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deposit Value ($)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all placeholder:text-gray-400"
                                        value={formData.depositAmount}
                                        onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes / Requests</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all placeholder:text-gray-400 resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any special notes for this stay..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 p-6 flex gap-3 sticky bottom-0 z-10">
                    <button
                        onClick={onClose}
                        type="button"
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="checkInForm"
                        disabled={processing || !formData.staffName || !formData.allocatedRoomName}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        {processing ? 'Processing...' : 'Confirm Check-in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
