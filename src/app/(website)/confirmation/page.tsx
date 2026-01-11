
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircleIcon,
  PrinterIcon,
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";
import { useCart } from "@/context/CartContext";

// Define Booking Interface based on Firestore data
interface BookingDetails {
  id: string;
  bookingId: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
  guestDetails: {
    prefix: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
  };
  reservationGuests: Array<{
    firstName: string;
    lastName: string;
    specialNeeds: string;
    idDocumentName?: string;
  }>;
  address: {
    country: string;
    city: string;
    zipCode: string;
    address1: string;
    address2: string;
  };
  rooms: Array<{
    name: string;
    price: number;
    type: string;
    allocatedRoomType?: string;
    suiteType?: string;
  }>;
  addOns: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number; // Note: Firestore uses totalAmount, local mock used total
  status: string;
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        // Fallback to local storage if no ID in URL (legacy flow)
        const storedBooking = localStorage.getItem("pendingBooking") || localStorage.getItem("bookingDetails");
        if (storedBooking) {
          try {
            setBooking(JSON.parse(storedBooking));
          } catch (e) {
            console.error("Parse error", e);
          }
        }
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (!res.ok) throw new Error("Booking not found");
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Could not retrieve booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getNights = () => {
    if (!booking) return 1;
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  // Calculate total explicitly to fix 0 issues
  const calculateTotal = () => {
    if (!booking) return 0;
    const nights = getNights();
    const roomTotal = booking.rooms?.reduce((acc, room) => acc + ((room.price || 0) * nights), 0) || 0;
    const addonTotal = booking.addOns?.reduce((acc, addon) => acc + ((addon.price || 0) * (addon.quantity || 1)), 0) || 0;
    return roomTotal + addonTotal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-serif tracking-widest uppercase text-sm">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-500 mb-8">{error || "We couldn't locate your booking details."}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-all uppercase tracking-wider text-sm font-medium w-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const finalTotal = (booking.totalAmount && booking.totalAmount > 0) ? booking.totalAmount : calculateTotal();

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-40 pb-20 font-sans text-gray-800 print:bg-white print:pt-0 print:pb-0">
      <style jsx global>{`
        header {
          background-color: transparent !important;
          backdrop-filter: none !important;
          box-shadow: none !important;
        }

        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }
          
          /* Show only the relevant content */
          #booking-receipt, #booking-receipt * {
            visibility: visible;
          }

          /* Positioning the receipt at the top */
          #booking-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }

          /* Specific hiding of buttons/nav just in case */
          header, footer, .no-print {
            display: none !important;
          }

          /* Ensure background is clean */
          body, .min-h-screen {
            background: white !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Wrap the printable content in an ID */}
      <div id="booking-receipt" className="max-w-4xl mx-auto px-4 sm:px-6 print:max-w-none print:px-0">

        {/* Success Header Card */}
        <div className="bg-white rounded-t-3xl shadow-xl border-b-4 border-amber-600 p-10 text-center relative overflow-hidden print:shadow-none print:border-amber-600">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 print:hidden"></div>

          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100 print:border-gray-200">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4 tracking-tight">Booking Confirmed</h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
            Thank you, <span className="text-gray-900 font-semibold">{booking.guestDetails.firstName}</span>. Your reservation has been successfully confirmed.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-gray-50 px-6 py-2 rounded-full border border-gray-200 print:bg-white print:border-black">
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Booking ID</span>
            <span className="text-base font-bold text-gray-900">{booking.bookingId || booking.id}</span>
          </div>
        </div>

        {/* Details Ticket */}
        <div className="bg-white rounded-b-3xl shadow-xl border-t border-dashed border-gray-200 p-8 md:p-12 relative print:shadow-none print:rounded-none">
          {/* Decorative side cutouts for ticket look - Hide in print */}
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#F5F5F0] rounded-full print:hidden"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#F5F5F0] rounded-full print:hidden"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

            {/* Left Column: Summary */}
            <div className="md:col-span-8 space-y-10">
              {/* Stay Info */}
              <div>
                <h3 className="flex items-center gap-2 text-amber-700 font-bold uppercase tracking-widest text-xs mb-6 border-b border-gray-100 pb-2 print:border-gray-300">
                  <CalendarDaysIcon className="w-4 h-4" /> Stay Details
                </h3>
                <div className="flex flex-col sm:flex-row gap-8">
                  <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-100 text-center sm:text-left print:bg-white print:border-gray-300">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Check-in</p>
                    <p className="text-lg font-bold text-gray-900 font-serif">{formatDate(booking.checkIn)}</p>
                    <p className="text-xs text-gray-500 mt-1">From 14:00</p>
                  </div>
                  <div className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-100 text-center sm:text-left print:bg-white print:border-gray-300">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Check-out</p>
                    <p className="text-lg font-bold text-gray-900 font-serif">{formatDate(booking.checkOut)}</p>
                    <p className="text-xs text-gray-500 mt-1">Until 11:00</p>
                  </div>
                </div>
              </div>

              {/* Rooms List */}
              <div>
                <h3 className="flex items-center gap-2 text-amber-700 font-bold uppercase tracking-widest text-xs mb-6 border-b border-gray-100 pb-2 print:border-gray-300">
                  Selected Accommodations
                </h3>
                <div className="space-y-4">
                  {booking.rooms.map((room, idx) => (
                    <div key={idx} className="flex justify-between items-start py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors px-2 rounded-lg -mx-2 print:border-gray-200">
                      <div>
                        <p className="font-serif text-lg font-medium text-gray-900">{room.name || room.type}</p>
                        <p className="text-sm text-gray-500 mt-1">{room.suiteType || 'Standard Suite'} • {getNights()} Night(s)</p>

                        {room.allocatedRoomType && (
                          <div className="mt-2 inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-medium border border-green-100 print:border-gray-300 print:text-black">
                            Allocated: {room.allocatedRoomType}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${((room.price || 0) * getNights()).toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">${room.price}/night</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addons */}
              {booking.addOns && booking.addOns.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-amber-700 font-bold uppercase tracking-widest text-xs mb-4 border-b border-gray-100 pb-2 print:border-gray-300">
                    Enhancements
                  </h3>
                  <div className="space-y-3">
                    {booking.addOns.map((addon, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{addon.name} <span className="text-xs text-gray-400">x{addon.quantity}</span></span>
                        <span className="font-medium text-gray-900">${((addon.price || 0) * (addon.quantity || 1)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Totals & Actions */}
            <div className="md:col-span-4">
              <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl sticky top-24 print:bg-white print:text-black print:shadow-none print:border print:border-black print:static">
                <h4 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-6 print:text-black">Payment Summary</h4>

                <div className="space-y-4 mb-6 text-sm opacity-90 print:opacity-100">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${finalTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & Fees</span>
                    <span>Included</span>
                  </div>
                  <div className="border-t border-gray-700 my-2 print:border-black"></div>
                  <div className="flex justify-between text-lg font-serif font-bold text-white print:text-black">
                    <span>Total</span>
                    <span className="text-amber-400 print:text-black">${finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 mt-8 no-print">
                  <button
                    onClick={() => router.push('/')}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-medium transition-all"
                  >
                    <HomeIcon className="w-4 h-4" /> Return Home
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center gap-2 bg-transparent border border-gray-600 hover:bg-gray-800 text-gray-300 py-3 rounded-lg font-medium transition-all text-xs uppercase tracking-wider"
                  >
                    <PrinterIcon className="w-4 h-4" /> Print Receipt
                  </button>
                </div>
              </div>

              <div className="mt-8 border border-gray-100 rounded-xl p-5 bg-gray-50 print:border-gray-300">
                <h4 className="flex items-center gap-2 text-gray-900 font-semibold mb-3 text-sm">
                  <MapPinIcon className="w-4 h-4 text-amber-600 print:text-black" /> Billing Address
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed print:text-black">
                  {booking.address.address1}<br />
                  {booking.address.city}, {booking.address.zipCode}<br />
                  {booking.address.country}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-serif tracking-widest uppercase text-sm">Loading...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
