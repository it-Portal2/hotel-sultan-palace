import React, { useState, useEffect, Fragment } from 'react';
import { Booking, getRoomTypes, getRoomStatuses, RoomType } from '@/lib/firestoreService';
import { XCircleIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import RegistrationCardModal from '@/components/admin/stayview/RegistrationCardModal';

interface CheckInModalProps {
    booking: Booking;
    roomIndex?: number; // Optional specific room index
    position?: { top: number, left: number };
    onClose: () => void;
    onConfirm: (data: CheckInData) => Promise<void>;
    processing: boolean;
}

export interface CheckInData {
    staffName: string;
    idDocumentType: string;
    idDocumentNumber?: string;
    roomKeyNumber?: string;
    depositAmount?: string; // This will now represent 'Payment Amount'
    paymentMethod?: string;
    accompanyingGuests?: string;
    notes?: string;
    allocatedRoomName: string;
}

export default function CheckInModal({ booking, roomIndex, onClose, onConfirm, processing, position }: CheckInModalProps) {
    const [formData, setFormData] = useState<CheckInData>({
        staffName: '',
        idDocumentType: 'passport',
        idDocumentNumber: '',
        roomKeyNumber: '',
        depositAmount: '',
        paymentMethod: 'cash',
        accompanyingGuests: '',
        notes: '',
        allocatedRoomName: '',
    });

    const [showPrintModal, setShowPrintModal] = useState(false);
    const [availableRooms, setAvailableRooms] = useState<RoomType[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [isRoomLocked, setIsRoomLocked] = useState(false);

    // Animation State
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsOpen(true));
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    // Determine target room for context
    const rIndex = roomIndex !== undefined ? roomIndex : 0;
    const targetRoom = booking.rooms[rIndex] || booking.rooms[0];

    useEffect(() => {
        const fetchRooms = async () => {
            setLoadingRooms(true);
            try {
                const [allRooms, allStatuses] = await Promise.all([
                    getRoomTypes(),
                    getRoomStatuses()
                ]);

                const bookingSuite = targetRoom.suiteType || 'Garden Suite';
                const suiteRooms = allRooms.filter(r => r.suiteType === bookingSuite);

                const available = suiteRooms.filter(room => {
                    const status = allStatuses.find(s => s.roomName === room.roomName);
                    if (!status) return true;
                    return status.status !== 'occupied' && status.status !== 'maintenance';
                });

                setAvailableRooms(available);

                if (targetRoom.allocatedRoomType) {
                    setFormData(prev => ({ ...prev, allocatedRoomName: targetRoom.allocatedRoomType! }));
                    setIsRoomLocked(true);
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

    // --- CONTEXTUAL VERTICAL POSITIONING ---
    const WINDOW_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 900;
    const DRAWER_ESTIMATED_HEIGHT = 450;
    let verticalTop = 20;

    if (position) {
        verticalTop = position.top;
        verticalTop = Math.max(20, verticalTop - 50);
        if (verticalTop + DRAWER_ESTIMATED_HEIGHT > WINDOW_HEIGHT) {
            verticalTop = Math.max(20, WINDOW_HEIGHT - DRAWER_ESTIMATED_HEIGHT - 20);
        }
    }

    const inputClasses = "w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-gray-400 hover:bg-white hover:border-gray-200";
    const labelClasses = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1";

    return (
        <Transition.Root show={isOpen} as={Fragment} afterLeave={onClose}>
            <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/10 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-out duration-500 sm:duration-500"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in duration-500 sm:duration-500"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel
                                    className="pointer-events-auto w-[900px] max-w-full"
                                    style={{ marginTop: `${verticalTop}px` }}
                                >
                                    <div className="flex flex-col bg-white shadow-2xl rounded-l-2xl border border-gray-100 overflow-hidden max-h-[calc(100vh-40px)]">
                                        {/* Header */}
                                        <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center shrink-0">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 text-sm shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                                                    {booking.guestDetails.firstName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Check-In Guest</h3>
                                                        <div className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold tracking-wide border border-indigo-100 uppercase">
                                                            {targetRoom.suiteType}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-500 text-xs">{booking.guestDetails.firstName} {booking.guestDetails.lastName} <span className="text-gray-300">|</span> <span className="font-mono text-gray-400">#{booking.bookingId}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPrintModal(true)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Print Registration Card"
                                                >
                                                    <PrinterIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={handleClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <XCircleIcon className="h-6 w-6" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content - 3 Column Grid */}
                                        <div className="p-6 bg-white overflow-y-auto custom-scrollbar flex-1">
                                            <form id="checkInForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">

                                                {/* COLUMN 1: Allocation (Span 4) */}
                                                <div className="md:col-span-4 space-y-4">
                                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1">Room Allocation</h4>

                                                    {/* Assign Room */}
                                                    <div className="group">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className={labelClasses}>Assign Room <span className="text-red-500">*</span></label>
                                                            {isRoomLocked && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIsRoomLocked(false)}
                                                                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline uppercase mr-1"
                                                                >
                                                                    Change
                                                                </button>
                                                            )}
                                                        </div>
                                                        {isRoomLocked ? (
                                                            <div className="w-full px-3 py-2 bg-white border-2 border-dashed border-indigo-100 rounded-lg text-sm font-bold text-gray-700 flex justify-between items-center">
                                                                <span className="flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                    {formData.allocatedRoomName || "Unassigned"}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Locked</span>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <select
                                                                    required
                                                                    className={inputClasses}
                                                                    value={formData.allocatedRoomName}
                                                                    onChange={(e) => setFormData({ ...formData, allocatedRoomName: e.target.value })}
                                                                >
                                                                    <option value="">Select Room...</option>
                                                                    {availableRooms.map(room => (
                                                                        <option key={room.id} value={room.roomName}>{room.roomName}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Staff Name */}
                                                    <div>
                                                        <label className={labelClasses}>Processed By <span className="text-red-500">*</span></label>
                                                        <input
                                                            required
                                                            type="text"
                                                            className={inputClasses}
                                                            value={formData.staffName}
                                                            onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                                                            placeholder="Enter your name"
                                                        />
                                                    </div>
                                                </div>

                                                {/* COLUMN 2: Details (Span 4) */}
                                                <div className="md:col-span-4 space-y-4">
                                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1">Check-in Details</h4>

                                                    {/* Key & ID Type */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={labelClasses}>Key Card #</label>
                                                            <input
                                                                type="text"
                                                                className={inputClasses}
                                                                value={formData.roomKeyNumber}
                                                                onChange={(e) => setFormData({ ...formData, roomKeyNumber: e.target.value })}
                                                                placeholder="101-A"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={labelClasses}>ID Type</label>
                                                            <select
                                                                className={inputClasses}
                                                                style={{ paddingRight: 0 }}
                                                                value={formData.idDocumentType}
                                                                onChange={(e) => setFormData({ ...formData, idDocumentType: e.target.value })}
                                                            >
                                                                <option value="passport">Passport</option>
                                                                <option value="driving_license">License</option>
                                                                <option value="id_card">ID Card</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* ID Number */}
                                                    <div>
                                                        <label className={labelClasses}>ID Number</label>
                                                        <input
                                                            type="text"
                                                            className={inputClasses}
                                                            value={formData.idDocumentNumber}
                                                            onChange={(e) => setFormData({ ...formData, idDocumentNumber: e.target.value })}
                                                            placeholder="Document Number"
                                                        />
                                                    </div>

                                                    {/* Extra Guests */}
                                                    <div>
                                                        <label className={labelClasses}>Accompanying Guests</label>
                                                        <input
                                                            type="text"
                                                            className={inputClasses}
                                                            value={formData.accompanyingGuests}
                                                            onChange={(e) => setFormData({ ...formData, accompanyingGuests: e.target.value })}
                                                            placeholder="Names..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* COLUMN 3: Payment & Notes (Span 4) */}
                                                <div className="md:col-span-4 space-y-4">
                                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1">Payment & Notes</h4>

                                                    {/* Payment */}
                                                    <div className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 space-y-3">
                                                        <div>
                                                            <label className={labelClasses}>Method</label>
                                                            <select
                                                                className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                                                value={formData.paymentMethod}
                                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                            >
                                                                <option value="cash">Cash</option>
                                                                <option value="card_machine">Card / POS</option>
                                                                <option value="online_transfer">Transfer</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className={labelClasses}>Collect ($)</label>
                                                            <input
                                                                type="number"
                                                                className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500"
                                                                value={formData.depositAmount}
                                                                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Notes */}
                                                    <div>
                                                        <label className={labelClasses}>Notes</label>
                                                        <textarea
                                                            className="w-full h-[66px] px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none"
                                                            value={formData.notes}
                                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                            placeholder="Special requests..."
                                                        />
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex gap-3">
                                            <button
                                                type="submit"
                                                form="checkInForm"
                                                disabled={processing || !formData.staffName || !formData.allocatedRoomName}
                                                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-black transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:shadow-none text-sm uppercase tracking-wide flex justify-center items-center gap-2"
                                            >
                                                {processing ? (
                                                    <>
                                                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></span>
                                                        Checking In...
                                                    </>
                                                ) : 'Confirm Check-In'}
                                            </button>
                                            <button
                                                onClick={handleClose}
                                                type="button"
                                                className="px-6 py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors text-xs uppercase tracking-wide bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>

            {showPrintModal && (
                <RegistrationCardModal
                    booking={booking}
                    onClose={() => setShowPrintModal(false)}
                />
            )}
        </Transition.Root>
    );
}
