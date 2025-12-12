"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import RestrictedAction from '@/components/admin/RestrictedAction';
import { 
  getAllBookings, 
  getBooking, 
  generateCheckoutBill, 
  getCheckoutBill,
  checkOutGuest,
  Booking,
  CheckoutBill
} from '@/lib/firestoreService';
import { 
  MagnifyingGlassIcon, 
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  UserMinusIcon,
  DocumentTextIcon,
  PrinterIcon,

  ArrowRightIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

type ViewMode = 'ready' | 'completed';

export default function AdminCheckoutPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('ready');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [checkoutBill, setCheckoutBill] = useState<CheckoutBill | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [checkOutForm, setCheckOutForm] = useState({
    staffName: '',
    depositReturned: false,
    notes: '',
  });

  useEffect(() => {
    loadBookings();
    const interval = setInterval(() => {
      loadBookings();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (bookingId: string) => {
    if (isReadOnly) {
      showToast("You don't have permission to generate bills", 'warning');
      return;
    }
    try {
      setGenerating(true);
      const billId = await generateCheckoutBill(bookingId);
      if (billId) {
        const bill = await getCheckoutBill(billId);
        const booking = await getBooking(bookingId);
        setCheckoutBill(bill);
        setSelectedBooking(booking);
        showToast('Checkout bill generated successfully!', 'success');
        await loadBookings();
      } else {
        showToast('Failed to generate checkout bill', 'error');
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      showToast('Failed to generate checkout bill', 'error');
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
      showToast('Failed to load checkout bill', 'error');
    }
  };

  const handleCheckOut = async () => {
    if (!selectedBooking || isReadOnly) return;
    
    if (!checkOutForm.staffName) {
      showToast('Please enter staff name', 'warning');
      return;
    }

    if (!selectedBooking.checkoutBillId) {
      showToast('Please generate checkout bill first', 'warning');
      return;
    }

    setProcessing(true);
    try {
      const success = await checkOutGuest(
        selectedBooking.id,
        checkOutForm.staffName,
        checkOutForm.depositReturned,
        checkOutForm.notes || undefined
      );

      if (success) {
        showToast('Guest checked out successfully!', 'success');
        setShowCheckOutModal(false);
        setCheckOutForm({
          staffName: '',
          depositReturned: false,
          notes: '',
        });
        setSelectedBooking(null);
        await loadBookings();
        setViewMode('completed');
      } else {
        showToast('Failed to check out guest. Please try again.', 'error');
      }
    } catch (error: unknown) {
      console.error('Error checking out guest:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check out guest. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const checkoutReady = useMemo(() => {
    return bookings.filter(b => b.status === 'checked_in');
  }, [bookings]);

  const checkedOut = useMemo(() => {
    return bookings
      .filter(b => b.status === 'checked_out')
      .sort((a, b) => {
        const aTime = a.checkOutTime ? new Date(a.checkOutTime).getTime() : 0;
        const bTime = b.checkOutTime ? new Date(b.checkOutTime).getTime() : 0;
        return bTime - aTime;
      });
  }, [bookings]);

  const displayedBookings = useMemo(() => {
    const bookingsToShow = viewMode === 'ready' ? checkoutReady : checkedOut;
    
    if (!searchQuery.trim()) return bookingsToShow;
    
    const query = searchQuery.toLowerCase();
    return bookingsToShow.filter(booking => 
      booking.bookingId.toLowerCase().includes(query) ||
      `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`.toLowerCase().includes(query) ||
      booking.guestDetails.email.toLowerCase().includes(query) ||
      (booking.rooms[0]?.allocatedRoomType && booking.rooms[0].allocatedRoomType.toLowerCase().includes(query))
    );
  }, [viewMode, checkoutReady, checkedOut, searchQuery]);

  const stats = useMemo(() => {
    return {
      ready: checkoutReady.length,
      completed: checkedOut.length,
      pendingBill: checkoutReady.filter(b => !b.checkoutBillId).length,
    };
  }, [checkoutReady, checkedOut]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-8">
      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">Process checkout and manage final bills • {currentDate}</p>
        </div>
        
        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Ready:</span>
            <span className="font-semibold text-gray-900">{stats.ready}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Completed:</span>
            <span className="font-semibold text-gray-900">{stats.completed}</span>
          </div>
          {stats.pendingBill > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600">Pending Bill:</span>
              <span className="font-semibold text-gray-900">{stats.pendingBill}</span>
            </div>
          )}
        </div>
      </div>

      {/* View Toggle - Tab Style */}
      <div className="flex items-center gap-1 border-b-2 border-gray-200 pb-2">
        <button
          onClick={() => setViewMode('ready')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === 'ready'
              ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Checkout Ready ({stats.ready})
          </div>
        </button>
        <button
          onClick={() => setViewMode('completed')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === 'completed'
              ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            Checked Out ({stats.completed})
          </div>
        </button>
      </div>

      {/* Simple Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by booking ID, guest name, email, or room..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
        />
      </div>

      {/* Clean Table - No Cards */}
      {displayedBookings.length === 0 ? (
        <div className="text-center py-16">
          <CreditCardIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">
            {viewMode === 'ready' ? 'No guests ready for checkout' : 'No checked out guests'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {viewMode === 'ready' ? 'All checked-in guests will appear here' : 'Completed checkouts will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Check-in / Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bill Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedBookings.map((booking) => {
                  const isCheckedOut = booking.status === 'checked_out';
                  const hasBill = !!booking.checkoutBillId;
                  
                  return (
                    <tr key={booking.id} className={`hover:bg-gray-50 transition-colors ${isCheckedOut ? 'bg-green-50/30' : ''}`}>
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
                        <div className="text-sm text-gray-700">
                          {booking.rooms[0]?.allocatedRoomType || <span className="text-gray-400">Not allocated</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.checkIn).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <ArrowRightIcon className="h-3 w-3" />
                          {new Date(booking.checkOut).toLocaleDateString()}
                        </div>
                        {isCheckedOut && booking.checkOutTime && (
                          <div className="text-xs text-green-700 mt-1 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {new Date(booking.checkOutTime).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasBill ? (
                          <div className="flex items-center gap-1 text-green-700">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span className="text-xs font-semibold">Generated</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-700">
                            <ClockIcon className="h-4 w-4" />
                            <span className="text-xs font-semibold">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCheckedOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            <CheckCircleIcon className="h-3 w-3" />
                            CHECKED OUT
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            CHECKED IN
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {hasBill ? (
                            <button
                              onClick={() => handleViewBill(booking.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-[#FF6A00] hover:text-[#FF6A00]/80 text-sm font-medium border-b-2 border-transparent hover:border-[#FF6A00] transition-colors"
                            >
                              <DocumentTextIcon className="h-4 w-4" />
                              View Bill
                            </button>
                          ) : (
                            isReadOnly ? (
                              <RestrictedAction message="You don't have permission to generate bills">
                                <button className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium border-b-2 border-transparent hover:border-blue-600 transition-colors">
                                  <DocumentTextIcon className="h-4 w-4" />
                                  Generate
                                </button>
                              </RestrictedAction>
                            ) : (
                              <button
                                onClick={() => handleGenerateBill(booking.id)}
                                disabled={generating}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium border-b-2 border-transparent hover:border-blue-600 disabled:opacity-50 transition-colors"
                              >
                                <DocumentTextIcon className="h-4 w-4" />
                                Generate
                              </button>
                            )
                          )}
                          {!isCheckedOut && (
                            isReadOnly ? (
                              <RestrictedAction message="You don't have permission to check out guests">
                                <button className="inline-flex items-center gap-1 px-3 py-1.5 text-green-600 hover:text-green-800 text-sm font-medium border-b-2 border-transparent hover:border-green-600 transition-colors">
                                  <UserMinusIcon className="h-4 w-4" />
                                  Check Out
                                </button>
                              </RestrictedAction>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowCheckOutModal(true);
                                }}
                                disabled={!hasBill}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-green-600 hover:text-green-800 text-sm font-medium border-b-2 border-transparent hover:border-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title={!hasBill ? "Please generate bill first" : ""}
                              >
                                <UserMinusIcon className="h-4 w-4" />
                                Check Out
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checkout Bill Modal - Keep existing */}
      {checkoutBill && selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            setSelectedBooking(null);
            setCheckoutBill(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Checkout Bill</h3>
                <p className="text-gray-500 text-sm mt-1">Booking ID: {selectedBooking.bookingId}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </button>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setCheckoutBill(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center border-b-2 border-gray-300 pb-4">
                <h2 className="text-3xl font-bold text-gray-900">Sultan Palace Hotel</h2>
                <p className="text-gray-600 mt-1 text-sm">Final Checkout Bill</p>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Guest Information</h4>
                  <p className="text-sm text-gray-700">{checkoutBill.guestName}</p>
                  {checkoutBill.roomNumber && (
                    <p className="text-sm text-gray-700 mt-1">Room: {checkoutBill.roomNumber}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Stay Period</h4>
                  <p className="text-sm text-gray-700">
                    Check-in: {new Date(checkoutBill.checkInDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-700">
                    Check-out: {new Date(checkoutBill.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-4 text-base">Charges Breakdown</h4>
                
                <div className="mb-4 border-b border-gray-100 pb-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-semibold text-gray-700">Room Charges</span>
                    <span className="text-sm font-bold text-gray-900">${checkoutBill.roomCharges.toFixed(2)}</span>
                  </div>
                  {checkoutBill.roomDetails.map((room, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 text-xs text-gray-600 pl-4 mt-1">
                      <span>{room.roomType} ({room.nights} nights × ${room.rate}/night)</span>
                      <span>${room.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {checkoutBill.foodCharges > 0 && (
                  <div className="mb-4 border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-semibold text-gray-700">Food & Beverage</span>
                      <span className="text-sm font-bold text-gray-900">${checkoutBill.foodCharges.toFixed(2)}</span>
                    </div>
                    {checkoutBill.foodOrders.map((order, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 text-xs text-gray-600 pl-4 mt-1">
                        <span>Order #{order.orderNumber}</span>
                        <span>${order.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {checkoutBill.serviceCharges > 0 && (
                  <div className="mb-4 border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-semibold text-gray-700">Guest Services</span>
                      <span className="text-sm font-bold text-gray-900">${checkoutBill.serviceCharges.toFixed(2)}</span>
                    </div>
                    {checkoutBill.services.map((service, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 text-xs text-gray-600 pl-4 mt-1">
                        <span className="capitalize">{service.serviceType.replace('_', ' ')}</span>
                        <span>${service.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {checkoutBill.addOnsCharges > 0 && (
                  <div className="mb-4 border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-semibold text-gray-700">Add-ons</span>
                      <span className="text-sm font-bold text-gray-900">${checkoutBill.addOnsCharges.toFixed(2)}</span>
                    </div>
                    {checkoutBill.addOns.map((addon, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 text-xs text-gray-600 pl-4 mt-1">
                        <span>{addon.name} (Qty: {addon.quantity})</span>
                        <span>${addon.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {checkoutBill.taxes > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Taxes</span>
                    <span className="text-sm font-semibold text-gray-900">${checkoutBill.taxes.toFixed(2)}</span>
                  </div>
                )}

                {checkoutBill.discount && checkoutBill.discount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-green-600">Discount</span>
                    <span className="text-sm font-semibold text-green-600">-${checkoutBill.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-4 border-t-2 border-gray-300 mt-4">
                  <span className="text-xl font-bold text-gray-900">Total Amount</span>
                  <span className="text-3xl font-bold text-[#FF6A00]">${checkoutBill.totalAmount.toFixed(2)}</span>
                </div>

                <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Paid Amount</span>
                    <span className="text-sm font-semibold text-gray-900">${checkoutBill.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-base font-bold text-gray-900">Balance</span>
                    <span className={`text-xl font-bold ${checkoutBill.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${Math.abs(checkoutBill.balance).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                      checkoutBill.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : checkoutBill.paymentStatus === 'partial'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      Payment Status: {checkoutBill.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
                <p className="font-medium">Thank you for staying with us!</p>
                <p className="mt-1">Bill Generated: {new Date(checkoutBill.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-out Modal */}
      {showCheckOutModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Check-out Guest</h3>
              <p className="text-gray-500 text-sm mt-1">
                {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {!selectedBooking.checkoutBillId && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Please generate the checkout bill before checking out the guest.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name *</label>
                <input
                  type="text"
                  required
                  value={checkOutForm.staffName}
                  onChange={(e) => setCheckOutForm({ ...checkOutForm, staffName: e.target.value })}
                  className="w-full px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                  placeholder="Enter staff name"
                />
              </div>
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkOutForm.depositReturned}
                    onChange={(e) => setCheckOutForm({ ...checkOutForm, depositReturned: e.target.checked })}
                    className="h-4 w-4 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Deposit Returned</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={checkOutForm.notes}
                  onChange={(e) => setCheckOutForm({ ...checkOutForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none resize-none"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCheckOutModal(false);
                    setCheckOutForm({
                      staffName: '',
                      depositReturned: false,
                      notes: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border-b-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={processing || !checkOutForm.staffName || !selectedBooking.checkoutBillId}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? 'Processing...' : 'Check Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
