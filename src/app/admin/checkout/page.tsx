"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';
import { 
  getAllBookings, 
  getBooking, 
  generateCheckoutBill, 
  getCheckoutBill,
  getFoodOrders,
  getGuestServices,
  Booking,
  CheckoutBill
} from '@/lib/firestoreService';
import { MagnifyingGlassIcon, CreditCardIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function AdminCheckoutPage() {
  const { isReadOnly } = useAdminRole();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [checkoutBill, setCheckoutBill] = useState<CheckoutBill | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      // Show only confirmed bookings that are checked in or can be checked out
      const activeBookings = data.filter(b => 
        b.status === 'confirmed' || b.status === 'checked_in'
      );
      setBookings(activeBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (bookingId: string) => {
    if (isReadOnly) return;
    try {
      setGenerating(true);
      const billId = await generateCheckoutBill(bookingId);
      if (billId) {
        const bill = await getCheckoutBill(billId);
        setCheckoutBill(bill);
        const booking = await getBooking(bookingId);
        if (booking) setSelectedBooking(booking);
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to generate checkout bill');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewBill = async (bookingId: string) => {
    try {
      const booking = await getBooking(bookingId);
      if (booking && booking.checkoutBillId) {
        const bill = await getCheckoutBill(booking.checkoutBillId);
        setCheckoutBill(bill);
        setSelectedBooking(booking);
      } else {
        setSelectedBooking(booking);
        setCheckoutBill(null);
      }
    } catch (error) {
      console.error('Error loading bill:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guestDetails.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.roomNumber && booking.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Dashboard" />
      
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Checkout Management</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Generate final bills for guest checkout</p>
        <div className="mt-4 flex gap-4">
          <div className="px-4 py-2 bg-blue-100 rounded-lg">
            <span className="text-sm font-medium text-blue-800">Active Bookings: {bookings.length}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking ID, guest name, email, or room number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-lg font-medium text-gray-600">No active bookings found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg overflow-hidden rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Check-in / Check-out</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900">{booking.bookingId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{booking.guestDetails.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.roomNumber ? (
                        <span className="text-sm text-gray-900">{booking.roomNumber}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Not allocated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.checkIn).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        → {new Date(booking.checkOut).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'checked_in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewBill(booking.id)}
                        className="text-[#FF6A00] hover:text-[#FF6A00]/80 font-medium mr-3"
                      >
                        View Bill
                      </button>
                      {!isReadOnly && !booking.checkoutBillId && (
                        <button
                          onClick={() => handleGenerateBill(booking.id)}
                          disabled={generating}
                          className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                        >
                          Generate Bill
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checkout Bill Modal */}
      {(selectedBooking || checkoutBill) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            setSelectedBooking(null);
            setCheckoutBill(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-white to-[#FFFCF6] border-b border-[#be8c53]/20 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#202c3b]">
                  {checkoutBill ? 'Checkout Bill' : 'Booking Details'}
                </h3>
                {selectedBooking && (
                  <p className="text-[#202c3b]/70 text-sm mt-1">
                    Booking ID: {selectedBooking.bookingId}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setCheckoutBill(null);
                }}
                className="text-[#202c3b]/70 hover:text-[#FF6A00]"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {checkoutBill ? (
                <div className="space-y-6">
                  {/* Guest Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Guest Information</h4>
                      <p className="text-sm text-gray-700">{checkoutBill.guestName}</p>
                      {checkoutBill.roomNumber && (
                        <p className="text-sm text-gray-700">Room: {checkoutBill.roomNumber}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Stay Period</h4>
                      <p className="text-sm text-gray-700">
                        Check-in: {new Date(checkoutBill.checkInDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700">
                        Check-out: {new Date(checkoutBill.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Room Charges */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Room Charges</h4>
                    <div className="space-y-2">
                      {checkoutBill.roomDetails.map((room, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{room.roomType}</p>
                            <p className="text-sm text-gray-500">{room.nights} nights × ${room.rate}/night</p>
                          </div>
                          <p className="font-semibold text-gray-900">${room.total}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-right">
                      <span className="font-semibold text-gray-900">Subtotal: ${checkoutBill.roomCharges}</span>
                    </div>
                  </div>

                  {/* Food Orders */}
                  {checkoutBill.foodOrders.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Food Orders</h4>
                      <div className="space-y-2">
                        {checkoutBill.foodOrders.map((order, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.date).toLocaleString()}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900">${order.amount}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-right">
                        <span className="font-semibold text-gray-900">Subtotal: ${checkoutBill.foodCharges}</span>
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {checkoutBill.services.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Guest Services</h4>
                      <div className="space-y-2">
                        {checkoutBill.services.map((service, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{service.serviceType.replace('_', ' ')}</p>
                              <p className="text-sm text-gray-500">{service.description}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(service.date).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900">${service.amount}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-right">
                        <span className="font-semibold text-gray-900">Subtotal: ${checkoutBill.serviceCharges}</span>
                      </div>
                    </div>
                  )}

                  {/* Add-ons */}
                  {checkoutBill.addOns.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Add-ons</h4>
                      <div className="space-y-2">
                        {checkoutBill.addOns.map((addon, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{addon.name}</p>
                              <p className="text-sm text-gray-500">Qty: {addon.quantity} × ${addon.price}</p>
                            </div>
                            <p className="font-semibold text-gray-900">${addon.total}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-right">
                        <span className="font-semibold text-gray-900">Subtotal: ${checkoutBill.addOnsCharges}</span>
                      </div>
                    </div>
                  )}

                  {/* Final Total */}
                  <div className="border-t-2 border-gray-300 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Room Charges:</span>
                      <span>${checkoutBill.roomCharges}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Food Charges:</span>
                      <span>${checkoutBill.foodCharges}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Service Charges:</span>
                      <span>${checkoutBill.serviceCharges}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Add-ons Charges:</span>
                      <span>${checkoutBill.addOnsCharges}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Taxes:</span>
                      <span>${checkoutBill.taxes}</span>
                    </div>
                    {checkoutBill.discount && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-${checkoutBill.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-2xl font-bold text-[#202c3b] pt-2 border-t border-gray-300">
                      <span>Total Amount:</span>
                      <span className="text-[#FF6A00]">${checkoutBill.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700 pt-2">
                      <span>Paid Amount:</span>
                      <span>${checkoutBill.paidAmount}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-300">
                      <span>Balance:</span>
                      <span className={checkoutBill.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                        ${checkoutBill.balance}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No checkout bill generated yet</p>
                  {!isReadOnly && selectedBooking && (
                    <button
                      onClick={() => handleGenerateBill(selectedBooking.id)}
                      disabled={generating}
                      className="px-6 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 disabled:opacity-50"
                    >
                      {generating ? 'Generating...' : 'Generate Checkout Bill'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

