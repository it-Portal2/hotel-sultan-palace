import React, { useState } from 'react';
import { Booking } from '@/lib/firestoreService';
import { CalendarDaysIcon, XMarkIcon, UserIcon, MapPinIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import RestrictedAction from '@/components/admin/RestrictedAction';

interface BookingDetailsModalProps {
    booking: Booking;
    onClose: () => void;
    isReadOnly: boolean;
    onStatusUpdate: (type: 'cancel' | 'confirm' | 'pending' | 'check_in' | 'check_out', booking: Booking) => void;
}

export default function BookingDetailsModal({ booking, onClose, isReadOnly, onStatusUpdate }: BookingDetailsModalProps) {
    const [showConfirm, setShowConfirm] = useState<{ type: 'cancel' | 'confirm' | 'pending' | 'check_in' | 'check_out' } | null>(null);

    const confirmAction = async () => {
        if (showConfirm) {
            await onStatusUpdate(showConfirm.type, booking);
            setShowConfirm(null);
        }
    };

    const guests = booking.guests || { adults: 0, children: 0, rooms: 1 };
    const rooms = booking.rooms || [];
    const addOns = booking.addOns || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer" onClick={onClose}>
            <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-start sticky top-0 z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-2xl font-bold text-gray-900">Booking Details</h3>
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                }`}>
                                {booking.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm font-mono">ID: {booking.bookingId || booking.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Guest Info */}
                        <div className="bg-gray-50/50 p-5 border border-gray-100">
                            <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                                <UserIcon className="h-5 w-5 text-[#FF6A00] mr-2" />
                                Guest Information
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <div className="h-10 w-10 bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00] font-bold text-lg mr-3">
                                        {booking.guestDetails.firstName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{booking.guestDetails.firstName} {booking.guestDetails.lastName}</p>
                                        <p className="text-xs text-gray-400">Guest</p>
                                    </div>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                    {booking.guestDetails.email}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                    {booking.guestDetails.phone}
                                </div>
                                {booking.address && (
                                    <div className="flex items-start text-sm text-gray-600">
                                        <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                                        <span>{booking.address.address1}, {booking.address.city}, {booking.address.country}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stay Details */}
                        <div className="bg-gray-50/50 p-5 border border-gray-100">
                            <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                                <CalendarDaysIcon className="h-5 w-5 text-[#FF6A00] mr-2" />
                                Stay Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white p-3 border border-gray-100 shadow-sm">
                                    <p className="text-gray-500 text-xs mb-1">Check-in</p>
                                    <p className="font-semibold text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(booking.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="bg-white p-3 border border-gray-100 shadow-sm">
                                    <p className="text-gray-500 text-xs mb-1">Check-out</p>
                                    <p className="font-semibold text-gray-900">{new Date(booking.checkOut).toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(booking.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-white border border-gray-100 shadow-sm flex justify-between items-center text-sm">
                                <span className="text-gray-500">Duration</span>
                                <span className="font-semibold text-gray-900">
                                    {Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)))} Nights
                                </span>
                            </div>
                            <div className="mt-2 p-3 bg-white border border-gray-100 shadow-sm flex justify-between items-center text-sm">
                                <span className="text-gray-500">Guests</span>
                                <span className="font-semibold text-gray-900">{guests.adults} Adults, {guests.children} Kids</span>
                            </div>
                        </div>
                    </div>

                    {/* Room & Addons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-gray-100 p-5">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Rooms Selected</h4>
                            <div className="space-y-3">
                                {rooms.map((r, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50">
                                        <div>
                                            <div className="font-medium text-gray-900">{r.type}</div>
                                            <div className="text-xs text-gray-500">{r.suiteType || 'Standard'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">${r.price}</div>
                                            {r.allocatedRoomType ? (
                                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5">Room {r.allocatedRoomType}</span>
                                            ) : (
                                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5">Unassigned</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border border-gray-100 p-5">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Add-ons & Extras</h4>
                            {addOns.length > 0 ? (
                                <div className="space-y-3">
                                    {addOns.map((a, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50">
                                            <div className="font-medium text-gray-900">{a.name} <span className="text-gray-400 text-xs">x{a.quantity}</span></div>
                                            <div className="font-bold text-gray-900">${(a.price * a.quantity).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-sm italic bg-gray-50">No add-ons selected</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 border-t border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-gray-500 text-sm">Total Amount</p>
                            <p className="text-3xl font-extrabold text-gray-900">${booking.totalAmount?.toLocaleString()}</p>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            {isReadOnly ? (
                                <RestrictedAction message="You cannot change booking status.">
                                    <button disabled className="px-6 py-3 bg-gray-200 text-gray-500 font-bold cursor-not-allowed">Actions Disabled</button>
                                </RestrictedAction>
                            ) : (
                                <>
                                    {/* Status Actions */}
                                    {booking.status === 'pending' && (
                                        <div className="flex gap-3 w-full">
                                            <button
                                                onClick={() => setShowConfirm({ type: 'cancel' })}
                                                className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => setShowConfirm({ type: 'confirm' })}
                                                className="flex-1 md:flex-none px-6 py-2.5 bg-[#FF6A00] text-white font-bold hover:bg-[#e65f00] transition-colors shadow-lg shadow-orange-200"
                                            >
                                                Confirm Booking
                                            </button>
                                        </div>
                                    )}

                                    {booking.status === 'confirmed' && (
                                        <div className="flex gap-3 w-full">
                                            <button
                                                onClick={() => setShowConfirm({ type: 'cancel' })}
                                                className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => setShowConfirm({ type: 'check_in' })}
                                                className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                            >
                                                Check In
                                            </button>
                                        </div>
                                    )}

                                    {booking.status === 'checked_in' && (
                                        <button
                                            onClick={() => setShowConfirm({ type: 'check_out' })}
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200"
                                        >
                                            Check Out
                                        </button>
                                    )}

                                    {booking.status === 'cancelled' && (
                                        <button
                                            onClick={() => setShowConfirm({ type: 'pending' })}
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
                                        >
                                            Reopen
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Internal Confirmation Modal */}
            {showConfirm && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute inset-0 bg-transparent" onClick={() => setShowConfirm(null)}></div>
                    <div className="relative bg-white shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200 border border-gray-100" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)' }}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {showConfirm.type === 'confirm' ? 'Confirm Booking?' :
                                showConfirm.type === 'cancel' ? 'Cancel Booking?' :
                                    showConfirm.type === 'check_in' ? 'Check In Guest?' :
                                        showConfirm.type === 'check_out' ? 'Check Out Guest?' : 'Reopen Booking?'}
                        </h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            {showConfirm.type === 'cancel'
                                ? 'Are you sure? This will free up the rooms and notify the guest. This action is significant.'
                                : 'Are you sure you want to proceed with this status change?'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`px-4 py-2 text-white font-bold transition-colors shadow-md ${showConfirm.type === 'cancel' ? 'bg-red-600 hover:bg-red-700' :
                                    'bg-[#FF6A00] hover:bg-[#e65f00]'
                                    }`}
                            >
                                Yes, Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
