"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CheckCircleIcon, CalendarIcon, UsersIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/context/CartContext";

interface BookingDetails {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
  guestDetails: Array<{
    prefix: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
  }>;
  address: {
    country: string;
    city: string;
    zipCode: string;
    address1: string;
    address2: string;
  };
  room: {
    id: string;
    name: string;
    price: number;
    type: string;
  };
  addOns: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: string;
  bookingId: string;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const { getNumberOfNights } = useCart();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedBooking = localStorage.getItem("bookingDetails");
    if (storedBooking) {
      try {
        const parsed = JSON.parse(storedBooking);
        setBookingDetails(parsed);
      } catch (error) {
        console.error("Error parsing booking details:", error);
        router.push("/");
      }
    } else {
      router.push("/");
    }
    setLoading(false);
  }, [router]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-[#FFFCF6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Booking Found</h1>
          <p className="text-gray-600 mb-6">We couldn&apos;t find your booking details.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <style jsx global>{`
        header {
          background-color: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(8px);
        }
        header * {
          color: white !important;
        }
      `}</style>
      <Header />
      
      {/* Main Content */}
      <div className="pt-50 pb-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
            <p className="text-xl text-gray-600 mb-2">
              Your reservation has been successfully created
            </p>
            <p className="text-lg font-semibold text-orange-600">
              Booking ID: {bookingDetails.bookingId}
            </p>
          </div>

          {/* Combined Details Section */}
          <div className="bg-[#F8F5EF] shadow-sm border border-gray-200 p-8 mb-8">
            {/* Booking Summary */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Booking Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Dates */}
                <div>
                  <div className="flex items-center mb-4">
                    <CalendarIcon className="w-6 h-6 text-orange-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Stay Dates</h3>
                  </div>
                  <div className=" p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Check-in</p>
                        <p className="font-medium text-gray-900">{formatDate(bookingDetails.checkIn)}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-2">
                          <span className="text-xs font-medium text-orange-600">→</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Check-out</p>
                        <p className="font-medium text-gray-900">{formatDate(bookingDetails.checkOut)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <div className="flex items-center mb-4">
                    <UsersIcon className="w-6 h-6 text-orange-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Guests</h3>
                  </div>
                  <div className=" p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      {bookingDetails.guests.adults} Adult{bookingDetails.guests.adults > 1 ? 's' : ''}
                      {bookingDetails.guests.children > 0 && (
                        <span>, {bookingDetails.guests.children} Child{bookingDetails.guests.children > 1 ? 'ren' : ''}</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {bookingDetails.guests.rooms} Room{bookingDetails.guests.rooms > 1 ? 's' : ''}
                    </p>
                   
                  </div>
                </div>
              </div>

              {/* Room Details */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Room</h3>
                <div className=" border border-gray-200  p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 text-lg">
                        {bookingDetails.room?.name || 'Standard Room'}
                      </h4>
                      <p className="text-gray-600">
                        {bookingDetails.room?.type || 'Standard'}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${(bookingDetails.room?.price || 0).toLocaleString()} per night × {getNumberOfNights()} night{getNumberOfNights() > 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="text-xl font-semibold text-orange-600">
                      ${((bookingDetails.room?.price || 0) * getNumberOfNights()).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {bookingDetails.addOns && bookingDetails.addOns.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add-ons</h3>
                  <div className=" p-4">
                    <div className="space-y-3">
                      {bookingDetails.addOns.map((addOn, index) => (
                        <div key={`${addOn.name}-${addOn.price}-${index}`} className="flex justify-between items-center py-3 border-b border-gray-100">
                          <div>
                            <p className="font-medium text-gray-900">{addOn.name || 'Add-on'}</p>
                            <p className="text-sm text-gray-600">Quantity: {addOn.quantity || 1}</p>
                          </div>
                          <p className="font-medium text-gray-900">
                            ${((addOn.price || 0) * (addOn.quantity || 1)).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-900">Total Amount</span>
                  <span className="text-3xl font-bold text-orange-600">
                    ${(bookingDetails.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Guest Information</h2>
              
              {bookingDetails.guestDetails && bookingDetails.guestDetails.length > 0 ? (
                bookingDetails.guestDetails.map((guest, index) => (
                  <div key={index} className=" border border-gray-200 p-6 mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Guest {index + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">
                          {guest.prefix || ''} {guest.firstName || ''} {guest.lastName || ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{guest.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mobile</p>
                        <p className="font-medium text-gray-900">{guest.mobile || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className=" border border-gray-200 p-6">
                  <p className="text-gray-600">No guest information available</p>
                </div>
              )}
            </div>

            {/* Billing Address */}
            <div>
              <div className="flex items-center mb-6">
                <MapPinIcon className="w-6 h-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">Billing Address</h2>
              </div>
              
              <div className=" p-6">
                <p className="font-medium text-gray-900 mb-2">
                  {bookingDetails.address?.address1 || 'Not provided'}
                  {bookingDetails.address?.address2 && (
                    <span>, {bookingDetails.address.address2}</span>
                  )}
                </p>
                <p className="text-gray-600">
                  {bookingDetails.address?.city || 'Not provided'}, {bookingDetails.address?.zipCode || 'Not provided'}
                </p>
                <p className="text-gray-600">{bookingDetails.address?.country || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-orange-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What&apos;s Next?</h2>
            <p className="text-gray-600 mb-6">
              You will receive a confirmation email with all the details of your booking. 
              Please check your email for further instructions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/")}
                className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Return Home
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white text-orange-600 border border-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                Print Confirmation
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
