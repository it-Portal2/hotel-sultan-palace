"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
  getAllBookings,
  checkInGuest,
  checkOutGuest,
  Booking,
  HousekeepingTask
} from '@/lib/firestoreService';
import {
  UserPlusIcon,
  UserMinusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function FrontDeskPage() {
  const { isReadOnly } = useAdminRole();
  const router = useRouter();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [checkInForm, setCheckInForm] = useState({
    staffName: '',
    idDocumentType: 'passport',
    idDocumentNumber: '',
    roomKeyNumber: '',
    depositAmount: '',
    notes: '',
  });
  const [checkOutForm, setCheckOutForm] = useState({
    staffName: '',
    depositReturned: false,
    notes: '',
    housekeepingPriority: 'high' as HousekeepingTask['priority'],
    housekeepingAssignee: '',
  });
  const [showCheckInModal, setShowCheckInModal] = useState(false);
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

  const handleCheckIn = async () => {
    if (!selectedBooking || isReadOnly) return;

    if (!checkInForm.staffName) {
      showToast('Please enter staff name', 'warning');
      return;
    }

    setProcessing(true);
    try {
      const recordId = await checkInGuest(
        selectedBooking.id,
        checkInForm.staffName,
        checkInForm.idDocumentType,
        checkInForm.idDocumentNumber || undefined,
        checkInForm.roomKeyNumber || undefined,
        checkInForm.depositAmount ? parseFloat(checkInForm.depositAmount) : undefined,
        checkInForm.notes || undefined
      );

      if (recordId) {
        showToast('Guest checked in successfully!', 'success');
        setShowCheckInModal(false);
        setCheckInForm({
          staffName: '',
          idDocumentType: 'passport',
          idDocumentNumber: '',
          roomKeyNumber: '',
          depositAmount: '',
          notes: '',
        });
        await loadBookings();
      } else {
        showToast('Failed to check in guest', 'error');
      }
    } catch (error) {
      console.error('Error checking in guest:', error);
      showToast('Failed to check in guest', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedBooking || isReadOnly) return;

    if (!checkOutForm.staffName) {
      showToast('Please enter staff name', 'warning');
      return;
    }

    setProcessing(true);
    try {
      const success = await checkOutGuest(
        selectedBooking.id,
        checkOutForm.staffName,
        checkOutForm.depositReturned,
        checkOutForm.notes || undefined,
        {
          priority: checkOutForm.housekeepingPriority,
          assignedTo: checkOutForm.housekeepingAssignee || undefined,
          scheduledTime: new Date(),
        }
      );

      if (success) {
        showToast('Guest checked out successfully!', 'success');
        setShowCheckOutModal(false);
        setCheckOutForm({
          staffName: '',
          depositReturned: false,
          notes: '',
          housekeepingPriority: 'high',
          housekeepingAssignee: '',
        });
        await loadBookings();
        router.push('/admin/checkout');
      } else {
        showToast('Failed to check out guest', 'error');
      }
    } catch (error) {
      console.error('Error checking out guest:', error);
      showToast('Failed to check out guest', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(booking => {
      const bookingId = booking.bookingId?.toLowerCase() || '';
      const guestName = `${booking.guestDetails?.firstName || ''} ${booking.guestDetails?.lastName || ''}`.toLowerCase();
      const guestEmail = booking.guestDetails?.email?.toLowerCase() || '';
      const roomName = booking.rooms?.[0]?.allocatedRoomType?.toLowerCase() || booking.rooms?.[0]?.type?.toLowerCase() || '';
      const invoiceId = booking.checkoutBillId?.toLowerCase() || '';
      return bookingId.includes(q) || guestName.includes(q) || guestEmail.includes(q) || roomName.includes(q) || invoiceId.includes(q);
    });
  }, [bookings, searchQuery]);

  const stats = useMemo(() => {
    return {
      checkInReady: filteredBookings.filter(b => b.status === 'confirmed').length,
      checkedIn: filteredBookings.filter(b => b.status === 'checked_in').length,
    };
  }, [filteredBookings]);

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
          <h1 className="text-2xl font-semibold text-gray-900">Check-in</h1>
          <p className="text-sm text-gray-500 mt-1">Guest check-in and check-out management • {currentDate}</p>
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

      {/* Inline Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Ready:</span>
          <span className="font-semibold text-gray-900">{stats.checkInReady}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Checked In:</span>
          <span className="font-semibold text-gray-900">{stats.checkedIn}</span>
        </div>
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

      {/* Clean Table */}
      {
        filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <UserPlusIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">No bookings found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search</p>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
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
                        <div className="text-sm text-gray-900">
                          {booking.rooms[0]?.allocatedRoomType ? (
                            <span>{booking.rooms[0].allocatedRoomType}</span>
                          ) : (
                            <span className="text-gray-400">Not allocated</span>
                          )}
                          {booking.rooms[0]?.suiteType && (
                            <div className="text-xs text-gray-500">{booking.rooms[0].suiteType}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          In: {new Date(booking.checkIn).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Out: {new Date(booking.checkOut).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'checked_in'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                          }`}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!isReadOnly && (
                          <div className="flex gap-2">
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowCheckInModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
                              >
                                <UserPlusIcon className="h-4 w-4" />
                                Check In
                              </button>
                            )}
                            {booking.status === 'checked_in' && (
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowCheckOutModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors"
                              >
                                <UserMinusIcon className="h-4 w-4" />
                                Check Out
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* Check-in Modal */}
      {
        showCheckInModal && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Check-in Guest</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName} - {selectedBooking.bookingId}
                  </p>
                </div>
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name *</label>
                  <input
                    type="text"
                    required
                    value={checkInForm.staffName}
                    onChange={(e) => setCheckInForm({ ...checkInForm, staffName: e.target.value })}
                    className="w-full px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                    placeholder="Enter staff name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Type</label>
                    <select
                      value={checkInForm.idDocumentType}
                      onChange={(e) => setCheckInForm({ ...checkInForm, idDocumentType: e.target.value })}
                      className="w-full px-3 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                    >
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="id_card">ID Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Number</label>
                    <input
                      type="text"
                      value={checkInForm.idDocumentNumber}
                      onChange={(e) => setCheckInForm({ ...checkInForm, idDocumentNumber: e.target.value })}
                      className="w-full px-3 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Key Number</label>
                    <input
                      type="text"
                      value={checkInForm.roomKeyNumber}
                      onChange={(e) => setCheckInForm({ ...checkInForm, roomKeyNumber: e.target.value })}
                      className="w-full px-3 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={checkInForm.depositAmount}
                      onChange={(e) => setCheckInForm({ ...checkInForm, depositAmount: e.target.value })}
                      className="w-full px-3 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    rows={3}
                    value={checkInForm.notes}
                    onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none resize-none"
                    placeholder="Any special requests or notes..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCheckInModal(false)}
                    className="flex-1 px-4 py-2 border-b-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckIn}
                    disabled={processing || !checkInForm.staffName}
                    className="flex-1 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Processing...' : 'Check In Guest'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Check-out Modal */}
      {
        showCheckOutModal && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Check-out Guest</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName} - {selectedBooking.bookingId}
                  </p>
                </div>
                <button
                  onClick={() => setShowCheckOutModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> After check-out, a housekeeping task will be automatically created for room cleaning.
                  </p>
                </div>
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
                  <label className="flex items-center">
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
                    placeholder="Any notes about check-out..."
                  />
                </div>

                {/* Housekeeping Options */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Housekeeping Task</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={checkOutForm.housekeepingPriority}
                        onChange={(e) => setCheckOutForm({ ...checkOutForm, housekeepingPriority: e.target.value as HousekeepingTask['priority'] })}
                        className="w-full px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assign To (Optional)</label>
                      <input
                        type="text"
                        value={checkOutForm.housekeepingAssignee}
                        onChange={(e) => setCheckOutForm({ ...checkOutForm, housekeepingAssignee: e.target.value })}
                        className="w-full px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
                        placeholder="Staff name"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCheckOutModal(false)}
                    className="flex-1 px-4 py-2 border-b-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckOut}
                    disabled={processing || !checkOutForm.staffName}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Processing...' : 'Check Out Guest'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
