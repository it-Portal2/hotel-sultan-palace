"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import RestrictedAction from '@/components/admin/RestrictedAction';
import { useSearchParams } from 'next/navigation';
import {
  getAllBookings,
  getBooking,
  generateCheckoutBill,
  getCheckoutBill,
  checkOutGuest,
  getSystemLocks, // New Import
  Booking,
  CheckoutBill,
  HousekeepingTask
} from '@/lib/firestoreService';
import CheckOutModal, { CheckOutData } from '@/components/admin/front-desk/CheckOutModal';
import {
  MagnifyingGlassIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  UserMinusIcon,
  DocumentTextIcon,
  PrinterIcon,

  ArrowRightIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

type ViewMode = 'ready' | 'completed';

export default function AdminCheckoutPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('bookingId') || '');
  const [viewMode, setViewMode] = useState<ViewMode>('ready');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [checkoutBill, setCheckoutBill] = useState<CheckoutBill | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [processing, setProcessing] = useState(false);


  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        showToast('Bill updated! Taxes have been cleared.', 'success');
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

  const handleCheckOut = async (data: CheckOutData) => {
    if (!selectedBooking || isReadOnly) return;

    if (!selectedBooking.checkoutBillId) {
      showToast('Please generate checkout bill first', 'warning');
      return;
    }

    setProcessing(true);

    // NET LOCK CHECK
    try {
      const locks = await getSystemLocks();
      const roomNum = selectedBooking.roomNumber || selectedBooking.rooms[0]?.allocatedRoomType;
      const activeLock = locks.find(lock =>
        (lock.resourceType === 'folio' && lock.resourceId === selectedBooking.id) ||
        (roomNum && lock.resourceType === 'room' && lock.resourceId === roomNum)
      );

      if (activeLock) {
        showToast(`Checkout Blocked: Folio is locked by ${activeLock.lockedBy}. Reason: ${activeLock.description}`, 'error');
        setProcessing(false);
        return;
      }
    } catch (err) {
      console.error("Error checking locks:", err);
      showToast("Error checking system locks. Please try again.", 'error');
      setProcessing(false);
      return;
    }

    try {
      const success = await checkOutGuest(
        selectedBooking.id,
        {
          staffName: data.staffName,
          depositReturned: data.depositReturned,
          notes: data.notes || undefined,
          housekeepingPriority: data.housekeepingPriority,
          housekeepingAssignee: data.housekeepingAssignee || undefined,
          scheduledTime: new Date(), // Defaults to now
        }
      );

      if (success) {
        showToast('Guest checked out successfully!', 'success');
        setShowCheckOutModal(false);
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
    return bookingsToShow.filter(booking => {
      const bookingId = booking.bookingId?.toLowerCase() || ''; // Changed from booking.id to booking.bookingId
      const guestName = `${booking.guestDetails?.firstName || ''} ${booking.guestDetails?.lastName || ''}`.toLowerCase(); // Adapted to existing guestDetails structure
      const guestEmail = booking.guestDetails?.email?.toLowerCase() || ''; // Adapted to existing guestDetails structure
      const roomName = (booking.roomNumber || booking.rooms?.[0]?.allocatedRoomType || '').toLowerCase();
      const invoiceId = booking.checkoutBillId?.toLowerCase() || '';

      return (
        bookingId.includes(query) ||
        guestName.includes(query) ||
        guestEmail.includes(query) ||
        roomName.includes(query) ||
        invoiceId.includes(query)
      );
    });
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

        <div className="flex items-center gap-4">
          <button
            onClick={loadBookings}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            title="Refresh Data"
          >
            <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ready for Checkout</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.ready}</p>
          </div>
          <div className="p-2 bg-blue-50 border border-blue-100">
            <ClockIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Completed Today</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</p>
          </div>
          <div className="p-2 bg-green-50 border border-green-100">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending Bills</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingBill}</p>
          </div>
          <div className="p-2 bg-yellow-50 border border-yellow-100">
            <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* View Toggle - Tab Style */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setViewMode('ready')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${viewMode === 'ready'
            ? 'border-[#FF6A00] text-[#FF6A00]'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Checkout Ready
          </div>
        </button>
        <button
          onClick={() => setViewMode('completed')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${viewMode === 'completed'
            ? 'border-[#FF6A00] text-[#FF6A00]'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            Checked Out History
          </div>
        </button>
      </div>

      {/* Simple Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by booking ID, guest name, email, room, or invoice ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
        />
      </div>

      {/* Clean Table - No Cards */}
      {displayedBookings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 shadow-sm">
          <CreditCardIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">
            {viewMode === 'ready' ? 'No guests ready for checkout' : 'No checked out guests'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {viewMode === 'ready' ? 'All checked-in guests will appear here' : 'Completed checkouts will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
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
                    <tr key={booking.id} className={`hover:bg-gray-50 transition-colors ${isCheckedOut ? 'bg-green-50/10' : ''}`}>
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
                          {booking.roomNumber || booking.rooms[0]?.allocatedRoomType || <span className="text-gray-400">Not allocated</span>}
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
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider border border-green-200">
                            CHECKED OUT
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider border border-blue-200">
                            CHECKED IN
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {hasBill ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewBill(booking.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-[#FF6A00] hover:text-[#FF6A00]/80 text-xs font-bold border border-[#FF6A00] hover:bg-[#FF6A00]/5 transition-colors"
                              >
                                <DocumentTextIcon className="h-4 w-4" />
                                View Bill
                              </button>
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleGenerateBill(booking.id)}
                                  disabled={generating}
                                  title="Update bill with latest changes"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-600 text-xs font-bold border border-blue-600 transition-colors disabled:opacity-50"
                                >
                                  <ArrowPathIcon className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                                  Regen
                                </button>
                              )}
                            </div>
                          ) : (
                            isReadOnly ? (
                              <RestrictedAction message="You don't have permission to generate bills">
                                <button className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-400 border border-gray-200 text-xs font-bold cursor-not-allowed">
                                  <DocumentTextIcon className="h-4 w-4" />
                                  Generate
                                </button>
                              </RestrictedAction>
                            ) : (
                              <button
                                onClick={() => handleGenerateBill(booking.id)}
                                disabled={generating}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-600 text-xs font-bold border border-blue-600 transition-colors disabled:opacity-50"
                              >
                                <DocumentTextIcon className="h-4 w-4" />
                                {generating ? 'Generating...' : 'Generate Bill'}
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-green-600 hover:text-white hover:bg-green-600 text-xs font-bold border border-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setSelectedBooking(null);
            setCheckoutBill(null);
          }}
        >
          <div className="fixed inset-0 bg-transparent" onClick={() => {
            setSelectedBooking(null);
            setCheckoutBill(null);
          }}></div>
          <div
            className="relative bg-white shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Checkout Bill</h3>
                <p className="text-gray-500 text-sm mt-1">Booking ID: {selectedBooking.bookingId}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
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

              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 border border-gray-100">
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

                <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-gray-50 p-4 border border-gray-100">
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
                    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold uppercase ${checkoutBill.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : checkoutBill.paymentStatus === 'partial'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                      Status: {checkoutBill.paymentStatus}
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
        <CheckOutModal
          booking={selectedBooking}
          onClose={() => setShowCheckOutModal(false)}
          onConfirm={handleCheckOut}
          processing={processing}
        />
      )}
    </div>
  );
}
