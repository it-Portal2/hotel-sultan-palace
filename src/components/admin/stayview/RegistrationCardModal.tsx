import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Booking } from '@/lib/firestoreService';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface RegistrationCardModalProps {
    booking: Booking;
    onClose: () => void;
}

export default function RegistrationCardModal({ booking, onClose }: RegistrationCardModalProps) {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Registration_Card_${booking.guestDetails.lastName}_${booking.bookingId}`,
    });

    const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));

    // Calculate financials
    const roomPrice = booking.rooms[0]?.price || 0;
    const totalRoomCharge = roomPrice * nights;
    const tax = totalRoomCharge * 0.15; // Assuming 15% tax or similar for demo, or 0 if included. Let's match image approx.
    // Image shows: Tariff 306, Tax 45.91 (approx 15%). Total 3717.
    // We'll just display what we have in booking data.
    // If booking.totalAmount is available, use it.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Print Guest Registration Card</h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            <PrinterIcon className="h-5 w-5" />
                            Print
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto bg-gray-100 p-8 custom-scrollbar">
                    <div ref={componentRef} className="bg-white p-12 max-w-[210mm] mx-auto min-h-[297mm] shadow-sm text-black relative print:shadow-none print:m-0 print:h-auto">

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold font-serif mb-2">Sultan Palace</h1>
                            <p className="text-xs text-gray-600">Zanzibar, Zanzibar, Tanzania, 72111, Tanzania</p>
                            <p className="text-xs text-gray-600">Hotel Phone : 255777006630; Hotel Email : portalholdingsznz@gmail.com;</p>
                            <p className="text-xs text-gray-600">URL : https://sultanpalacehotelznz.com/</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-b border-gray-800 py-2 mb-6">
                            <span className="text-xs font-bold">TA Voucher No : {booking.bookingId}</span>
                            <span className="text-lg font-bold uppercase tracking-wider">Guest Registration Card</span>
                            <span className="text-xs font-bold">GR Card No.: {booking.bookingId.slice(-4)}</span>
                        </div>

                        {/* Content Grid */}
                        <div className="space-y-6 text-xs">

                            {/* Personal Section */}
                            <div className="grid grid-cols-[120px_1fr] gap-x-8 gap-y-2">
                                <div className="font-bold uppercase pt-1">Personal</div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Name</span>
                                        <span className="font-bold uppercase">{booking.guestDetails.prefix} {booking.guestDetails.firstName} {booking.guestDetails.lastName}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Email</span>
                                        <span>{booking.guestDetails.email}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Phone</span>
                                        <span>{booking.guestDetails.phone}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Fax</span>
                                        <span></span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Mobile</span>
                                        <span>{booking.guestDetails.phone}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">City</span>
                                        <span>{booking.address?.city}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Address</span>
                                        <span>{booking.address?.address1}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Country</span>
                                        <span>{booking.address?.country}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] col-start-2 border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Identity</span>
                                        <span>{booking.guestIdProof || 'Passport'}</span>
                                    </div>
                                </div>
                            </div>




                            {/* Accomodation Section */}
                            <div className="grid grid-cols-[120px_1fr] gap-x-8 gap-y-2 pt-4">
                                <div className="font-bold uppercase pt-1">Accomodation</div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-1">
                                    {/* Col 1 */}
                                    <div className="space-y-1">
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Arrival Date</span>
                                            <span>{new Date(booking.checkIn).toLocaleDateString()}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Dep. Date</span>
                                            <span>{new Date(booking.checkOut).toLocaleDateString()}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Night(s)</span>
                                            <span>{nights}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Room</span>
                                            <span className="uppercase">{booking.rooms[0]?.allocatedRoomType || booking.rooms[0]?.type} - {booking.rooms[0]?.suiteType}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Tariff</span>
                                            <span>{roomPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Tax</span>
                                            <span>0.00</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Discount</span>
                                            <span>0.00</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Adjustment</span>
                                            <span>0.00</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600 font-bold">Net</span>
                                            <span className="font-bold">{booking.totalAmount?.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Col 2 */}
                                    <div className="space-y-1">
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Arrival Time</span>
                                            <span>{new Date(booking.checkIn).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Dep. Time</span>
                                            <span>{booking.checkOutTime ? new Date(booking.checkOutTime).toLocaleTimeString() : '11:00:00 AM'}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Pax</span>
                                            <span>{booking.guests.adults} / {booking.guests.children} (A / C)</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Rate Type</span>
                                            <span>{booking.rooms[0]?.ratePlan || 'N/A'}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600 font-bold">Total Charges</span>
                                            <span className="font-bold">{booking.totalAmount?.toFixed(2)}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600">Amount Paid</span>
                                            <span>{booking.paidAmount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-0.5">
                                            <span className="text-gray-600 font-bold">Due Amount</span>
                                            <span className="font-bold">{((booking.totalAmount || 0) - (booking.paidAmount || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Section */}
                            <div className="grid grid-cols-[120px_1fr] gap-x-8 gap-y-2 pt-4">
                                <div className="font-bold uppercase pt-1">Payment Details</div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Payment Type</span>
                                        <span className="border border-black px-2 py-0.5 w-full inline-block">{booking.paymentMethod || 'Credit'}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 pb-1">
                                        <span className="text-gray-600">Direct Billing A/C</span>
                                        <span className="border border-black px-2 py-0.5 w-full inline-block">{(booking.source || 'Web').toUpperCase()}-{booking.bookingId}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer Note */}
                        <div className="mt-16 grid grid-cols-2 gap-12 text-xs">
                            <div>
                                <p className="font-bold mb-1">Please Note</p>
                                <p>Reg. Cash NOTICE</p>
                                <p>Reg. Cash NOTICE</p>
                            </div>
                            <div className="flex flex-col justify-end">
                                <div className="border-b border-black w-full h-1 mb-2"></div>
                                <p className="font-bold">Guest Signature</p>
                            </div>
                        </div>

                        <div className="mt-8 text-[10px] text-gray-500 flex justify-between border-t border-gray-300 pt-1">
                            <span>Printed On: {new Date().toLocaleString()}</span>
                            <span>Checked In By : {booking.checkInStaff || 'ADMIN'}</span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
