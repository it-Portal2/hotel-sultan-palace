import React, { Fragment } from 'react';
import { Booking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import SettlementModal from '../front-desk/SettlementModal'; // Adjust path if needed
import FolioDetailsDrawer from '../front-desk/FolioDetailsDrawer';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    UserIcon,
    MapPinIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarDaysIcon,
    CreditCardIcon,
    DocumentTextIcon,
    PrinterIcon,
    PaperAirplaneIcon,
    ChatBubbleLeftRightIcon,
    IdentificationIcon,
    ClockIcon,
    BuildingOfficeIcon,
    TagIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface BookingDetailsDrawerProps {
    booking: Booking;
    onClose: () => void;
    isOpen: boolean;
}

export default function BookingDetailsDrawer({ booking, onClose, isOpen }: BookingDetailsDrawerProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const [isSettlementModalOpen, setIsSettlementModalOpen] = React.useState(false);

    const guests = booking.guests || { adults: 0, children: 0, rooms: 1 };
    const rooms = booking.rooms || [];
    const addOns = booking.addOns || [];

    // Correct Payment Logic
    // Correct Payment Logic
    const totalAmount = booking.totalAmount || 0;
    // Fix: Handle cases where paymentStatus is 'paid' but paidAmount is 0
    const isMarkedPaid = booking.paymentStatus === 'paid' && (booking.paidAmount || 0) === 0;
    const paidAmount = isMarkedPaid ? totalAmount : (booking.paidAmount || 0);
    const balance = totalAmount - paidAmount;
    const paymentProgress = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;

    // Derived Data
    const nights = Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    const createdDate = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A';
    const sourceLabel = booking.source ? booking.source.replace('_', ' ').toUpperCase() : 'DIRECT';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'checked_in': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'checked_out': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const handlePrintInvoice = () => {
        showToast("Invoice sent to printer queue...", "success");
        // Logic to generate PDF or print
    };

    const handleSendEmail = () => {
        showToast(`Invoice emailed to ${booking.guestDetails.email}`, "success");
        // Logic to call email API
    };

    const [showFolioDrawer, setShowFolioDrawer] = React.useState(false);

    const handleViewFolio = () => {
        // onClose(); // Keep parent open for context, or close if preferred. Let's keep context as specificed "like Add Payment"
        setShowFolioDrawer(true);
    };

    return (
        <>
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
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                                <Transition.Child
                                    as={Fragment}
                                    enter="transform transition ease-in-out duration-500 sm:duration-700"
                                    enterFrom="translate-x-full"
                                    enterTo="translate-x-0"
                                    leave="transform transition ease-in-out duration-500 sm:duration-700"
                                    leaveFrom="translate-x-0"
                                    leaveTo="translate-x-full"
                                >
                                    <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                                        <div className="flex h-full flex-col bg-[#F3F4F6] shadow-2xl">

                                            {/* Header */}
                                            <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-20">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                                        <DocumentTextIcon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <Dialog.Title className="text-lg font-bold text-gray-900">
                                                                Booking #{booking.bookingId || booking.id.slice(0, 8)}
                                                            </Dialog.Title>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status || 'pending')}`}>
                                                                {booking.status?.replace('_', ' ') || 'Pending'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                            <span className="flex items-center gap-1">
                                                                <ClockIcon className="h-3 w-3" /> Created: {createdDate}
                                                            </span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span className="flex items-center gap-1">
                                                                <TagIcon className="h-3 w-3" /> Source: {sourceLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={handlePrintInvoice} className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                        <PrinterIcon className="h-4 w-4" /> Print Invoice
                                                    </button>
                                                    <button onClick={handleSendEmail} className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                        <PaperAirplaneIcon className="h-4 w-4" /> Email
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
                                                        onClick={onClose}
                                                    >
                                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Content - Scrollable */}
                                            <div className="flex-1 overflow-y-auto p-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                                    {/* LEFT COLUMN (2/3) */}
                                                    <div className="lg:col-span-2 space-y-6">

                                                        {/* Guest Card */}
                                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                                    <UserIcon className="h-4 w-4 text-gray-500" /> Guest Details
                                                                </h3>
                                                                {/* Check-in status indicator? */}
                                                            </div>
                                                            <div className="p-5">
                                                                <div className="flex flex-col sm:flex-row gap-6">
                                                                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 border-2 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-indigo-600">
                                                                            {booking.guestDetails.firstName?.[0]}
                                                                        </div>
                                                                        {booking.guestIdProof && (
                                                                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-200 flex items-center gap-1">
                                                                                <IdentificationIcon className="h-3 w-3" /> ID Verified
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                                                        <div>
                                                                            <label className="text-xs text-gray-500 font-medium uppercase">Full Name</label>
                                                                            <p className="text-sm font-bold text-gray-900">{booking.guestDetails.firstName} {booking.guestDetails.lastName}</p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs text-gray-500 font-medium uppercase">Email</label>
                                                                            <div className="flex items-center gap-1.5 text-sm text-gray-900">
                                                                                <EnvelopeIcon className="h-3.5 w-3.5 text-gray-400" /> {booking.guestDetails.email}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs text-gray-500 font-medium uppercase">Phone</label>
                                                                            <div className="flex items-center gap-1.5 text-sm text-gray-900">
                                                                                <PhoneIcon className="h-3.5 w-3.5 text-gray-400" /> {booking.guestDetails.phone}
                                                                            </div>
                                                                        </div>
                                                                        {booking.address && (
                                                                            <div>
                                                                                <label className="text-xs text-gray-500 font-medium uppercase">Address</label>
                                                                                <div className="flex items-start gap-1.5 text-sm text-gray-900">
                                                                                    <MapPinIcon className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                                                    <span className="line-clamp-2">
                                                                                        {[booking.address.address1, booking.address.city, booking.address.country].filter(Boolean).join(', ')}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Stay Details Card */}
                                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                                    <CalendarDaysIcon className="h-4 w-4 text-gray-500" /> Stay Information
                                                                </h3>
                                                            </div>
                                                            <div className="p-5">
                                                                <div className="flex items-center justify-between bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 mb-6">
                                                                    <div className="text-center">
                                                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Check-in</p>
                                                                        <p className="text-lg font-bold text-indigo-900">{new Date(booking.checkIn).toLocaleDateString()}</p>
                                                                        <p className="text-xs text-indigo-600">{new Date(booking.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                    </div>
                                                                    <div className="h-px flex-1 bg-indigo-200 mx-4 relative">
                                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded-full border border-indigo-200 text-xs font-bold text-indigo-700 shadow-sm">
                                                                            {nights} Night{nights !== 1 ? 's' : ''}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Check-out</p>
                                                                        <p className="text-lg font-bold text-indigo-900">{new Date(booking.checkOut).toLocaleDateString()}</p>
                                                                        <p className="text-xs text-indigo-600">{new Date(booking.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Room Allocations</h4>
                                                                    <div className="space-y-3">
                                                                        {rooms.map((r, i) => (
                                                                            <div key={i} className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                                                                        <BuildingOfficeIcon className="h-5 w-5" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-bold text-gray-900">{r.suiteType}</p>
                                                                                        <p className="text-xs text-gray-500">{r.ratePlan || 'Standard Rate'}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    {r.allocatedRoomType ? (
                                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                                            Room {r.allocatedRoomType}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                                            Unassigned
                                                                                        </span>
                                                                                    )}
                                                                                    <p className="text-sm font-bold text-gray-900 mt-1">${r.price?.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/night</span></p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Extras Card */}
                                                        {addOns.length > 0 && (
                                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                                                    <h3 className="text-sm font-bold text-gray-800">Extras & Add-ons</h3>
                                                                </div>
                                                                <div className="p-5">
                                                                    <div className="space-y-2">
                                                                        {addOns.map((a, i) => (
                                                                            <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded">
                                                                                <span className="text-gray-700 font-medium">{a.name} <span className="text-gray-400 text-xs ml-1">(x{a.quantity})</span></span>
                                                                                <span className="font-bold text-gray-900">${(a.price * a.quantity).toLocaleString()}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                    </div>


                                                    {/* RIGHT COLUMN (1/3) */}
                                                    <div className="space-y-6">

                                                        {/* Financial Summary Card */}
                                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                                    <CreditCardIcon className="h-4 w-4 text-gray-500" /> Payment
                                                                </h3>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${balance <= 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                                    {balance <= 0 ? 'PAID' : 'PENDING'}
                                                                </span>
                                                            </div>

                                                            {/* Summary Section */}
                                                            {(() => {
                                                                // Recalculate component costs
                                                                const roomSum = rooms.reduce((acc, r) => acc + (r.price || 0) * nights, 0);
                                                                const mealSum = rooms.reduce((acc, r) => acc + (r.mealPlanPrice || 0) * nights, 0);
                                                                const gross = roomSum + mealSum; // This is approx gross, doesn't include extras/taxes yet in this view context per see

                                                                // Use official total
                                                                const officialTotal = totalAmount;

                                                                // Determine discount
                                                                let discAmount = booking.discount?.amount || 0;

                                                                // Logic: If (Room + Meal) > OfficialTotal, the difference is likely the discount.
                                                                // This handles the "Stay X Pay Y" case where Room Price is full but Total is discounted.
                                                                if (gross > officialTotal + 1) {
                                                                    const diff = gross - officialTotal;
                                                                    // Only override if stored discount is missing or significantly different (likely wrong)
                                                                    if (Math.abs(discAmount - diff) > 1) {
                                                                        discAmount = diff;
                                                                    }
                                                                }

                                                                // Extras is the balancer if needed, or explicitly 0 if we match exactly
                                                                // Actually, Extras & Taxes = Total - (Room + Meal - Discount)
                                                                // If we forced Discount = Room + Meal - Total, then Extras = Total - (Total) = 0. Correct.
                                                                const extrasAndTaxes = officialTotal - (gross - discAmount);

                                                                return (
                                                                    <div className="p-5 bg-gradient-to-b from-white to-gray-50/30">
                                                                        <div className="space-y-3 mb-6">
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-gray-500">Room Charges</span>
                                                                                <span className="font-medium text-gray-900">${roomSum.toLocaleString()}</span>
                                                                            </div>

                                                                            {/* Meal Plan */}
                                                                            {mealSum > 0 && (
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-gray-500">Meal Plans</span>
                                                                                    <span className="font-medium text-gray-900">${mealSum.toLocaleString()}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Discount */}
                                                                            {discAmount > 0 && (
                                                                                <div className="flex justify-between text-sm text-green-600">
                                                                                    <span className="">Discount ({booking.discount?.code || 'Applied'})</span>
                                                                                    <span className="font-bold">-${discAmount.toLocaleString()}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Only show Extras if non-zero */}
                                                                            {Math.abs(extrasAndTaxes) > 1 && (
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-gray-500">Extras & Taxes</span>
                                                                                    <span className="font-medium text-gray-900">
                                                                                        ${extrasAndTaxes.toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            <div className="h-px bg-gray-200 my-2"></div>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-base font-bold text-gray-900">Total</span>
                                                                                <span className="text-xl font-bold text-indigo-600">${officialTotal.toLocaleString()}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Payment Progress */}
                                                                        <div className="mb-6">
                                                                            <div className="flex justify-between text-xs mb-1.5">
                                                                                <span className="text-gray-500 font-medium">Payment Status</span>
                                                                                <span className="text-gray-700 font-bold">{Math.round(paymentProgress)}% Paid</span>
                                                                            </div>
                                                                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all duration-500 ${balance <= 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                                    style={{ width: `${paymentProgress}%` }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Paid & Balance Grid */}
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                                                                <p className="text-[10px] uppercase font-bold text-emerald-600 mb-0.5">Paid to Date</p>
                                                                                <p className="text-lg font-bold text-emerald-800">${paidAmount.toLocaleString()}</p>
                                                                            </div>
                                                                            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                                                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Balance Due</p>
                                                                                <p className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>${balance.toLocaleString()}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Actions Footer */}
                                                            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex gap-2">
                                                                <button
                                                                    onClick={() => setIsSettlementModalOpen(true)}
                                                                    className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm"
                                                                >
                                                                    Add Payment
                                                                </button>
                                                                <button
                                                                    onClick={handleViewFolio}
                                                                    className="flex-1 py-2 bg-white text-gray-700 border border-gray-300 text-xs font-bold rounded-lg hover:bg-gray-50 transition shadow-sm"
                                                                >
                                                                    View Folio
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Internal Notes Card */}
                                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" /> Notes
                                                                </h3>
                                                            </div>
                                                            <div className="p-5">
                                                                {booking.notes ? (
                                                                    <p className="text-sm text-gray-600 italic bg-yellow-50 p-3 rounded border border-yellow-100">
                                                                        "{booking.notes}"
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs text-gray-400 text-center py-4 italic">No notes available for this booking.</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Quick Info / Metadata */}
                                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-500">Booking ID</span>
                                                                <span className="font-mono text-gray-900">{booking.bookingId || booking.id.slice(0, 8)}</span>
                                                            </div>
                                                            <div className="h-px bg-gray-100"></div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-500">Source</span>
                                                                <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{sourceLabel}</span>
                                                            </div>
                                                            <div className="h-px bg-gray-100"></div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-500">Staff</span>
                                                                <span className="font-medium text-gray-900">{booking.checkInStaff || 'System'}</span>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Settlement Modal */}
            <SettlementModal
                open={isSettlementModalOpen}
                onClose={() => setIsSettlementModalOpen(false)}
                booking={booking}
                onPaymentSuccess={() => {
                    setIsSettlementModalOpen(false);
                }}
            />

            {showFolioDrawer && (
                <FolioDetailsDrawer
                    booking={booking}
                    open={showFolioDrawer}
                    onClose={() => setShowFolioDrawer(false)}
                />
            )}
        </>
    );
}
