import React, { useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Booking } from '@/lib/firestoreService';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface RegistrationCardModalProps {
    booking: Booking;
    onClose: () => void;
    position?: { top: number, left: number };
}

export default function RegistrationCardModal({ booking, onClose, position }: RegistrationCardModalProps) {
    const componentRef = useRef<HTMLDivElement>(null);

    // Auto-trigger print on mount
    useEffect(() => {
        // Short timeout to ensure content is rendered before printing
        const timer = setTimeout(() => {
            handlePrint();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Registration_Card_${booking.guestDetails.lastName}_${booking.bookingId}`,
        onAfterPrint: () => {
            // Close the modal (which is actually just the hidden print container) after printing
            onClose();
        }
    });

    const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));

    // Calculate financials
    const roomPrice = booking.rooms[0]?.price || 0;
    const totalRoomCharge = roomPrice * nights;

    // Direct Print Mode: We don't show the modal UI at all, just the hidden content for the printer
    // We position it off-screen but keep it in DOM for react-to-print to find it.
    const isDirectPrint = true;

    if (isDirectPrint) {
        return (
            <div style={{ display: 'none' }}>
                <div ref={componentRef} className="bg-white p-10 max-w-[210mm] mx-auto min-h-[297mm] text-black relative print:shadow-none print:m-0 print:h-auto font-serif">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold mb-1 tracking-wide">Sultan Palace</h1>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Zanzibar Hotel & Resort</p>
                        <div className="text-[10px] text-gray-500 flex justify-center gap-4">
                            <span>PO Box 123, Zanzibar, Tanzania</span>
                            <span>|</span>
                            <span>+255 777 006 630</span>
                            <span>|</span>
                            <span>info@sultanpalacehotelznz.com</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t-2 border-b-2 border-gray-800 py-3 mb-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase">Confirmation No</span>
                            <span className="text-sm font-bold font-sans">{booking.bookingId}</span>
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-widest border-2 border-black px-4 py-1">Registration Card</h2>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] text-gray-500 uppercase">Room No</span>
                            <span className="text-sm font-bold font-sans">{booking.rooms[0]?.allocatedRoomType || 'Unassigned'}</span>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="space-y-6 text-[11px] leading-tight text-gray-800">

                        {/* Guest Details Section */}
                        <div>
                            <h3 className="text-xs font-bold uppercase border-b border-gray-300 mb-2 pb-1">Guest Particulars</h3>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                                <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 pb-0.5">
                                    <span className="text-gray-500">Full Name</span>
                                    <span className="font-bold uppercase font-sans text-xs">{booking.guestDetails.prefix} {booking.guestDetails.firstName} {booking.guestDetails.lastName}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 pb-0.5">
                                    <span className="text-gray-500">Date of Birth</span>
                                    <span className="font-sans">_______________________</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 pb-0.5">
                                    <span className="text-gray-500">Nationality</span>
                                    <span className="font-sans">_______________________</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 pb-0.5">
                                    <span className="text-gray-500">Passport / ID</span>
                                    <span className="font-sans">{booking.guestIdProof ? booking.guestIdProof : '_______________________'}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 pb-0.5">
                                    <span className="text-gray-500">Expiry Date</span>
                                    <span className="font-sans">_______________________</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 pb-0.5">
                                    <span className="text-gray-500">Phone/Mobile</span>
                                    <span className="font-sans">{booking.guestDetails.phone}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 pb-0.5">
                                    <span className="text-gray-500">Email</span>
                                    <span className="font-sans truncate">{booking.guestDetails.email}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] col-span-2 border-b border-gray-200 pb-0.5">
                                    <span className="text-gray-500">Address</span>
                                    <span className="font-sans">
                                        {[booking.address?.address1, booking.address?.city, booking.address?.country].filter(Boolean).join(', ') || '__________________________________________________________________'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Arrival / Departure Section */}
                        <div className="mt-4">
                            <h3 className="text-xs font-bold uppercase border-b border-gray-300 mb-2 pb-1">Stay Details</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="border border-gray-300 p-2 text-center">
                                    <span className="block text-[9px] text-gray-500 uppercase">Arrival Date</span>
                                    <span className="block font-bold text-sm font-sans">{new Date(booking.checkIn).toLocaleDateString()}</span>
                                </div>
                                <div className="border border-gray-300 p-2 text-center">
                                    <span className="block text-[9px] text-gray-500 uppercase">Departure Date</span>
                                    <span className="block font-bold text-sm font-sans">{new Date(booking.checkOut).toLocaleDateString()}</span>
                                </div>
                                <div className="border border-gray-300 p-2 text-center">
                                    <span className="block text-[9px] text-gray-500 uppercase">Room Type</span>
                                    <span className="block font-bold text-sm font-sans">{booking.rooms[0]?.suiteType}</span>
                                </div>
                                <div className="border border-gray-300 p-2 text-center">
                                    <span className="block text-[9px] text-gray-500 uppercase">Room Rate</span>
                                    <span className="block font-bold text-sm font-sans">${booking.rooms[0]?.price.toFixed(2)}</span>
                                </div>
                                <div className="border border-gray-300 p-2 text-center">
                                    <span className="block text-[9px] text-gray-500 uppercase">No. of Guests</span>
                                    <span className="block font-bold text-sm font-sans">{booking.guests.adults} Adults / {booking.guests.children} Child</span>
                                </div>
                                <div className="border border-gray-300 p-2 text-center">
                                    <span className="block text-[9px] text-gray-500 uppercase">Booking Source</span>
                                    <span className="block font-bold text-sm font-sans">{(booking.source || 'Direct').toUpperCase()}</span>
                                </div>
                                <div className="border border-gray-300 p-2 text-center col-span-2 bg-gray-50">
                                    <span className="block text-[9px] text-gray-500 uppercase">Payment Status</span>
                                    <span className="block font-bold text-sm font-sans">
                                        PAID: ${booking.paidAmount?.toFixed(2) || '0.00'} | DUE: ${((booking.totalAmount || 0) - (booking.paidAmount || 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Terms and Conditions (New) */}
                        <div className="mt-8">
                            <h3 className="text-xs font-bold uppercase border-b border-gray-300 mb-2 pb-1">Guest Acknowledgement</h3>
                            <div className="text-[9px] text-gray-600 text-justify space-y-2 border border-gray-200 p-3 bg-gray-50/50">
                                <p>I / We agree that my / our liability for this bill is not waived and agree to be held personally liable in the event that the indicated person, company, or association fails to pay for any part or the full amount of these charges.</p>
                                <p>I / We agree to vacate the room by 11:00 AM on the departure date. Late checkout is subject to availability and extra charges.</p>
                                <p>The hotel is not responsible for money, jewelry, or other valuables left in the room. Safe deposit boxes are available at the reception.</p>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="mt-12 grid grid-cols-2 gap-20">
                            <div className="flex flex-col justify-end">
                                <div className="border-b border-black w-full h-px mb-2"></div>
                                <p className="text-[10px] font-bold uppercase">Guest Signature</p>
                            </div>
                            <div className="flex flex-col justify-end">
                                <div className="border-b border-black w-full h-px mb-2 text-center text-[10px]">{booking.checkInStaff || 'Receptionist'}</div>
                                <p className="text-[10px] font-bold uppercase text-right">Front Desk Signature</p>
                            </div>
                        </div>

                        {/* Footer Time */}
                        <div className="absolute bottom-4 right-8 text-[9px] text-gray-400">
                            Printed: {new Date().toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Original Return (Unreachable in Direct Mode)
    return null;
}
