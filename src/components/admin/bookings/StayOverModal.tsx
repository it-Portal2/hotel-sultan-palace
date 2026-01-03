import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CalendarDaysIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Booking } from '@/lib/firestoreService';
import { getAvailableRoomTypes, updateBooking } from '@/lib/bookingService';

interface StayOverModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    onConfirm: () => void;
}

export default function StayOverModal({ isOpen, onClose, booking, onConfirm }: StayOverModalProps) {
    const [newCheckOut, setNewCheckOut] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availabilityChecked, setAvailabilityChecked] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [additionalCost, setAdditionalCost] = useState(0);
    const [manualCost, setManualCost] = useState<string>('');

    // Reset state when booking changes
    useEffect(() => {
        if (booking) {
            setNewCheckOut('');
            setAvailabilityChecked(false);
            setIsAvailable(false);
            setAdditionalCost(0);
            setManualCost('');
            setError(null);
        }
    }, [booking]);

    const handleCheckAvailability = async () => {
        if (!booking || !newCheckOut) return;

        setLoading(true);
        setError(null);

        try {
            const currentCheckOut = new Date(booking.checkOut);
            const extendedCheckOut = new Date(newCheckOut);

            if (extendedCheckOut <= currentCheckOut) {
                setError("New check-out date must be after current check-out date");
                setLoading(false);
                return;
            }

            // Calculate nights
            const diffTime = Math.abs(extendedCheckOut.getTime() - currentCheckOut.getTime());
            const extraNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Check availability for each room in the booking
            // Note: This matches the suite type logic. 
            // In a real scenario, we'd check if specific rooms are free, 
            // but here we check if *any* room of that type is available 
            // or if the *current* room is not blocked.
            // For simplicity/safety, we re-check availability for the suite type.

            // Assuming single room booking or all rooms same type for simplicity 
            // or checking the first room's type.
            const suiteType = booking.rooms[0].suiteType || 'Garden Suite';

            // We pass the OLD checkOut as checkIn for the extension period
            // and the NEW checkOut as the checkOut.
            const availableRooms = await getAvailableRoomTypes(
                suiteType,
                booking.checkOut, // Check from current checkout
                newCheckOut,
                booking.id // Exclude current booking from collision check if needed
            );

            // If the booking's current room is in availableRooms (by name) 
            // OR if there are any rooms available (if we are willing to move them, but usually StayOver means same room)
            // Ideally we check if *allocatedRoomName* is free.
            // For now, let's assume if *any* room of that type is available, we can facilitate it,
            // but strict logic would require checking the specific room.
            // The getAvailableRoomTypes returns room NAMES (string[]).

            const currentRoomName = booking.rooms[0].allocatedRoomType; // "101" etc.
            const isCurrentRoomAvailable = availableRooms.includes(currentRoomName || '');

            if (isCurrentRoomAvailable) {
                setIsAvailable(true);
                // Calculate cost: Rate * Nights
                const roomRate = booking.rooms[0].price || 0;
                const cost = roomRate * extraNights;
                setAdditionalCost(cost);
                setManualCost(cost.toString());
            } else {
                setIsAvailable(false);
                setError(`Room ${currentRoomName} is reserved or under maintenance for these dates.`);
            }

            setAvailabilityChecked(true);

        } catch (err) {
            console.error(err);
            setError("Failed to check availability");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!booking || !newCheckOut) return;

        setLoading(true);
        try {
            const addedAmount = parseFloat(manualCost) || 0;
            const newTotal = (booking.totalAmount || 0) + addedAmount;

            await updateBooking(booking.id, {
                checkOut: newCheckOut,
                totalAmount: newTotal,
                status: 'stay_over' as any, // Cast as any if 'stay_over' not in type yet, to be fixed in type def if strictly typed
                // We might want to add a note or log this extension
            });

            onConfirm();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to update booking");
        } finally {
            setLoading(false);
        }
    };

    if (!booking) return null;

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                                        <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Extend Stay</h3>
                                                <p className="text-gray-500 text-sm mt-0.5 font-mono">ID: {booking.bookingId}</p>
                                            </div>
                                            <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors rounded-full">
                                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                            </button>
                                        </div>

                                        <div className="relative flex-1 p-6 space-y-6">
                                            {/* Booking Context */}
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
                                                <div className="flex items-start gap-3">
                                                    <CalendarDaysIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-bold text-blue-900">Current Reservation</p>
                                                        <p className="text-sm text-blue-700 mt-1">
                                                            Guest: <strong>{booking.guestDetails.firstName} {booking.guestDetails.lastName}</strong>
                                                        </p>
                                                        <p className="text-sm text-blue-700">
                                                            Current Checkout: <strong>{new Date(booking.checkOut).toLocaleDateString()}</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div>
                                                    <label htmlFor="newCheckOut" className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                                                        New Checkout Date
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="date"
                                                            id="newCheckOut"
                                                            required
                                                            min={booking.checkOut}
                                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-3"
                                                            value={newCheckOut}
                                                            onChange={(e) => {
                                                                setNewCheckOut(e.target.value);
                                                                setAvailabilityChecked(false);
                                                                setIsAvailable(false);
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleCheckAvailability}
                                                            disabled={loading || !newCheckOut}
                                                            className="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 transition-colors"
                                                        >
                                                            CHECK
                                                        </button>
                                                    </div>
                                                </div>

                                                {availabilityChecked && isAvailable && (
                                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 animate-fade-in">
                                                        <div className="flex">
                                                            <div className="flex-shrink-0">
                                                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                            <div className="ml-3">
                                                                <h3 className="text-sm font-bold text-green-800">Room is available!</h3>
                                                                <div className="mt-1 text-sm text-green-700">
                                                                    <p>The room can be extended. Please verify the additional cost below.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {availabilityChecked && !isAvailable && error && (
                                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 animate-fade-in">
                                                        <div className="flex">
                                                            <div className="text-red-700 text-sm font-medium">{error}</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {isAvailable && (
                                                    <div>
                                                        <label htmlFor="additionalCost" className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                                                            Additional Charge
                                                        </label>
                                                        <div className="relative rounded-lg shadow-sm">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                                <span className="text-gray-500 sm:text-sm font-bold">$</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                name="additionalCost"
                                                                id="additionalCost"
                                                                className="block w-full rounded-lg border-gray-300 pl-7 pr-12 py-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                                                                placeholder="0.00"
                                                                value={manualCost}
                                                                onChange={(e) => setManualCost(e.target.value)}
                                                            />
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                                <span className="text-gray-400 sm:text-sm">USD</span>
                                                            </div>
                                                        </div>
                                                        <p className="mt-2 text-xs text-gray-500">
                                                            Calculated based on the standard room rate. You can adjust this manually.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 border-t border-gray-100 p-6 flex gap-3 sticky bottom-0 z-10">
                                            <button
                                                type="button"
                                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm rounded-xl uppercase tracking-wide text-xs"
                                                onClick={onClose}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 py-3 bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200 disabled:opacity-50 disabled:shadow-none rounded-xl uppercase tracking-wide text-xs"
                                                onClick={handleConfirm}
                                                disabled={!isAvailable || loading}
                                            >
                                                {loading ? 'Updating...' : 'Confirm Extension'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
