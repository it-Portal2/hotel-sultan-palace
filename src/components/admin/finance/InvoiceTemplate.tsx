
import React from 'react';
import { CheckoutBill } from '@/lib/firestoreService';

interface InvoiceTemplateProps {
    bill: CheckoutBill;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ bill }, ref) => {
    // Hotel Details
    const hotelName = "Sultan Palace Hotel";
    const hotelAddress = "Dongwe, East Coast, Zanzibar";
    const hotelPhone = "+255 684 888 111";
    const hotelEmail = "reservations@sultanpalacehotelznz.com";
    const hotelWeb = "www.sultanpalacehotelznz.com";

    // Date formatting
    const formatDate = (dateString: string | Date) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div
            ref={ref}
            className="bg-white text-black p-8 max-w-[210mm] mx-auto text-sm font-sans leading-relaxed print:p-0 print:max-w-none w-full"
            style={{ minHeight: '297mm' }} // A4 Height
        >
            {/* INVOICE HEADER */}
            <header className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">{hotelName}</h1>
                    <address className="not-italic text-sm text-gray-800 space-y-1">
                        <p>{hotelAddress}</p>
                        <p>Tel: {hotelPhone}</p>
                        <p>Email: {hotelEmail}</p>
                        <p>{hotelWeb}</p>
                    </address>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-light uppercase tracking-widest text-black/80 mb-4">Invoice</h2>
                    <table className="text-right float-right">
                        <tbody>
                            <tr>
                                <td className="pr-4 font-bold text-gray-600 uppercase text-xs">Invoice #</td>
                                <td className="font-mono font-medium">{bill.id.slice(-8).toUpperCase()}</td>
                            </tr>
                            <tr>
                                <td className="pr-4 font-bold text-gray-600 uppercase text-xs">Date</td>
                                <td>{formatDate(new Date())}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </header>

            {/* GUEST & BOOKING DETAILS */}
            <section className="flex justify-between mb-8 border border-gray-300 p-4">
                <div className="w-1/2 pr-4 border-r border-gray-300">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Bill To (Guest)</h3>
                    <p className="font-bold text-lg">{bill.guestName}</p>
                    {bill.roomNumber && <p className="text-gray-700">Room: <span className="font-medium">{bill.roomNumber}</span></p>}
                    <p className="text-gray-700 mt-1">{bill.guestEmail || 'N/A'}</p>
                </div>
                <div className="w-1/2 pl-4 text-right">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Stay Information</h3>
                    <div className="inline-block text-left">
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="pr-4 text-gray-600">Check-In:</td>
                                    <td className="font-medium">{formatDate(bill.checkInDate)}</td>
                                </tr>
                                <tr>
                                    <td className="pr-4 text-gray-600">Check-Out:</td>
                                    <td className="font-medium">{formatDate(bill.checkOutDate)}</td>
                                </tr>
                                <tr>
                                    <td className="pr-4 text-gray-600">Booking ID:</td>
                                    <td className="font-mono">{bill.id}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CHARGES TABLE */}
            <main className="mb-8">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="py-2 text-left text-xs font-bold uppercase tracking-wider w-1/12">#</th>
                            <th className="py-2 text-left text-xs font-bold uppercase tracking-wider w-5/12">Description</th>
                            <th className="py-2 text-center text-xs font-bold uppercase tracking-wider w-3/12">Date / Details</th>
                            <th className="py-2 text-right text-xs font-bold uppercase tracking-wider w-3/12">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">

                        {/* 1. ROOM CHARGES */}
                        {bill.roomDetails && bill.roomDetails.length > 0 && bill.roomDetails.map((room, i) => (
                            <tr key={`room-${i}`} className="border-b border-gray-200">
                                <td className="py-3 text-gray-500">{i + 1}</td>
                                <td className="py-3">
                                    <span className="font-bold block text-gray-900">Room Charge - {room.roomType}</span>
                                    <span className="text-xs text-gray-600">Accomodation Charges</span>
                                </td>
                                <td className="py-3 text-center text-gray-600">
                                    {room.nights} Night(s) @ {room.rate.toLocaleString()}
                                </td>
                                <td className="py-3 text-right font-medium">{room.total.toLocaleString()}</td>
                            </tr>
                        ))}

                        {/* 2. SERVICES & EXTRAS */}
                        {/* Combine all others for a flat list or separate sections? User wants 'services used'. */}

                        {/* Food */}
                        {bill.foodOrders.map((food, i) => (
                            <tr key={`food-${i}`} className="border-b border-gray-200">
                                <td className="py-3 text-gray-500"></td>
                                <td className="py-3">
                                    <span className="font-bold block text-gray-900">Restaurant / Bar</span>
                                    <span className="text-xs text-gray-600">Order #{food.orderNumber}</span>
                                </td>
                                <td className="py-3 text-center text-gray-600">{formatDate(food.date)}</td>
                                <td className="py-3 text-right">{food.amount.toLocaleString()}</td>
                            </tr>
                        ))}

                        {/* Services */}
                        {bill.services.map((svc, i) => (
                            <tr key={`svc-${i}`} className="border-b border-gray-200">
                                <td className="py-3 text-gray-500"></td>
                                <td className="py-3">
                                    <span className="font-bold block text-gray-900 capitalize">{svc.serviceType.replace(/_/g, ' ')}</span>
                                    <span className="text-xs text-gray-600">{svc.description}</span>
                                </td>
                                <td className="py-3 text-center text-gray-600">{formatDate(svc.date)}</td>
                                <td className="py-3 text-right">{svc.amount.toLocaleString()}</td>
                            </tr>
                        ))}

                        {/* Add-ons */}
                        {bill.addOns.map((add, i) => (
                            <tr key={`add-${i}`} className="border-b border-gray-200">
                                <td className="py-3 text-gray-500"></td>
                                <td className="py-3">
                                    <span className="font-bold block text-gray-900">{add.name}</span>
                                    <span className="text-xs text-gray-600">Add-On Item</span>
                                </td>
                                <td className="py-3 text-center text-gray-600">Qty: {add.quantity}</td>
                                <td className="py-3 text-right">{add.total.toLocaleString()}</td>
                            </tr>
                        ))}

                        {/* Facilities */}
                        {bill.facilities.map((fac, i) => (
                            <tr key={`fac-${i}`} className="border-b border-gray-200">
                                <td className="py-3 text-gray-500"></td>
                                <td className="py-3">
                                    <span className="font-bold block text-gray-900">{fac.name}</span>
                                    <span className="text-xs text-gray-600">Facility Usage</span>
                                </td>
                                <td className="py-3 text-center text-gray-600">{formatDate(fac.date)}</td>
                                <td className="py-3 text-right">{fac.amount.toLocaleString()}</td>
                            </tr>
                        ))}

                        {/* Custom Transactions (Charges Only) */}
                        {bill.transactions && bill.transactions.filter(t => t.type === 'charge').map((txn, i) => (
                            <tr key={`txn-${i}`} className="border-b border-gray-200">
                                <td className="py-3 text-gray-500"></td>
                                <td className="py-3">
                                    <span className="font-bold block text-gray-900 capitalize">{txn.category || 'Other'} Charge</span>
                                    <span className="text-xs text-gray-600">{txn.description}</span>
                                </td>
                                <td className="py-3 text-center text-gray-600">{formatDate(txn.date)}</td>
                                <td className="py-3 text-right">{txn.amount.toLocaleString()}</td>
                            </tr>
                        ))}

                    </tbody>
                </table>
            </main>

            {/* TOTALS SECTION */}
            <div className="flex justify-end mb-12 page-break-inside-avoid">
                <div className="w-[300px]">
                    <div className="flex justify-between py-2 border-b border-gray-300 text-sm">
                        <span className="font-medium text-gray-600">Subtotal</span>
                        <span className="font-medium">{bill.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-300 text-sm">
                        <span className="font-medium text-gray-600">Taxes & Fees (Included)</span>
                        <span className="font-medium">{bill.taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-3 text-lg font-bold border-b-2 border-black">
                        <span>Total Amount</span>
                        <span>{bill.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                        <span className="font-medium text-gray-600">Amount Paid</span>
                        <span className="font-medium">{bill.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t border-black mt-2">
                        <span className="font-bold uppercase">Balance Due</span>
                        <span className="font-bold text-xl">{bill.balance.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* THANK YOU & FOOTER */}
            <footer className="mt-auto border-t border-gray-300 pt-6 text-center text-xs text-gray-500">
                <p className="mb-2 font-medium text-gray-900">Thank you for staying with us!</p>
                <p>Please make all cheques payable to <strong>Sultan Palace Hotel</strong>.</p>
                <p>For inquiries, contact us at {hotelPhone} or {hotelEmail}</p>
            </footer>

            {/* SIGNATURES - ONLY FOR PRINT */}
            <div className="hidden print:flex justify-between mt-16 pt-8 text-sm">
                <div className="text-center w-1/3">
                    <div className="border-t border-black py-2">Guest Signature</div>
                </div>
                <div className="text-center w-1/3">
                    <div className="border-t border-black py-2">Authorized Signature</div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 10mm;
                        size: auto; 
                    }
                    body {
                        background: none;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
