"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { createBooking } from "@/lib/bookingService";

interface Guest {
  id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
}

interface Address {
  country: string;
  city: string;
  zipCode: string;
  address1: string;
  address2: string;
}

interface PaymentData {
  nameOnCard: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { bookingData, rooms, addOns, calculateTotal } = useCart();

  const [guests, setGuests] = useState<Guest[]>([
    {
      id: "1",
      prefix: "Mr.",
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
    },
  ]);
  const [address, setAddress] = useState<Address>({
    country: "",
    city: "",
    zipCode: "",
    address1: "",
    address2: "",
  });
  const [payment, setPayment] = useState<PaymentData>({
    nameOnCard: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });
  const [agreements, setAgreements] = useState({
    privacy: false,
    booking: false,
  });

  useEffect(() => {
    if (!bookingData) router.push("/");
  }, [bookingData, router]);

  if (!bookingData) return <div>Loading...</div>;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const addGuest = () => {
    setGuests((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        prefix: "Mr.",
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
      },
    ]);
  };

  const removeGuest = (id: string) => {
    if (guests.length > 1) setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const updateGuest = (id: string, field: keyof Guest, value: string) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreements.privacy || !agreements.booking) {
      alert("Please accept the terms and conditions");
      return;
    }
    try {
      const bookingDetails = {
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        guestDetails: guests,
        address,
        room: rooms.length
          ? {
              id: rooms[0].id,
              name: rooms[0].name,
              price: rooms[0].price,
              type: rooms[0].type || "Standard Room",
            }
          : { id: "1", name: "Standard Room", price: 0, type: "Standard Room" },
        addOns,
        total: calculateTotal(),
        status: "confirmed" as const,
        bookingId: `#BKG${Date.now()}`,
      };
      const bookingId = await createBooking(bookingDetails);
      localStorage.setItem(
        "bookingDetails",
        JSON.stringify({ ...bookingDetails, id: bookingId })
      );
      const popup = document.getElementById("confirmation-popup");
      if (popup) popup.classList.remove("hidden");
    } catch (err) {
      console.error("Error creating booking:", err);
      alert("Booking processing error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF6]">
      <Header />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 h-96">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">Check Out</h1>
            <p className="text-lg mb-6">
              Complete your booking and secure your stay
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Form */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Reservation Overview */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Reservation Overview
                  </h2>
                  <button
                    type="button"
                    className="text-orange-500 hover:text-orange-700"
                  >
                    Edit
                  </button>
                </div>
                {rooms.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {rooms[0].name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Total Stay: 1 Night
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {formatDate(bookingData.checkIn)} -{" "}
                          {formatDate(bookingData.checkOut)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 mt-4">
                      <div className="text-sm">
                        <p className="font-medium">Check-in</p>
                        <p className="text-gray-600">after 3:00 pm</p>
                      </div>
                      <div className="w-px h-8 bg-gray-300"></div>
                      <div className="text-sm">
                        <p className="font-medium">Check-out</p>
                        <p className="text-gray-600">before 12:00 pm</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
             
              {/* Policies */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Policies & Acknowledgements
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={agreements.privacy}
                      onChange={(e) =>
                        setAgreements({
                          ...agreements,
                          privacy: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded"
                    />
                    I agree with the Privacy Terms
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={agreements.booking}
                      onChange={(e) =>
                        setAgreements({
                          ...agreements,
                          booking: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded"
                    />
                    I agree with the Booking Conditions
                  </label>
                </div>
              </div>
              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-orange-600 transition-colors"
              >
                Confirm Booking
              </button>
            </form>
          </div>
          {/* Cart Sidebar */}
          <div className="w-96">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Your Cart ({rooms.length + addOns.length} Items)
              </h2>
              {/* Room Items */}
              {rooms.map((room) => (
                <div key={room.id} className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <div className="text-orange-500 font-bold">
                      ${room.price}.00
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">1 Night Stay</div>
                  <p className="text-gray-600 text-sm mt-2">
                    {formatDate(bookingData.checkIn)} -{" "}
                    {formatDate(bookingData.checkOut)}
                  </p>
                </div>
              ))}
              {/* Add-ons */}
              {addOns.map((item) => (
                <div key={item.id} className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <div className="text-orange-500 font-bold">${item.price}.00</div>
                  </div>
                  <div className="text-sm text-gray-500">Taxes and Fees</div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold text-orange-500">${calculateTotal()}.00</span>
                </div>
                <p className="text-xs text-gray-500">including general taxes and fees</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      {/* Confirmation Popup */}
      <div id="confirmation-popup" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-4">
            A confirmation email has been sent to your registered address.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700">
              Booking ID: #BKG{Date.now()}<br />
              Check-in: {formatDate(bookingData.checkIn)}<br />
              Check-out: {formatDate(bookingData.checkOut)}
            </p>
          </div>
          <button
            onClick={() => {
              const popup = document.getElementById("confirmation-popup");
              if (popup) popup.classList.add("hidden");
              router.push("/");
            }}
            className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
