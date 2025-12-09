"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';
import { 
  getAllBookings, 
  getBooking, 
  checkInGuest, 
  checkOutGuest,
  getCheckInOutRecords,
  Booking,
  CheckInOutRecord
} from '@/lib/firestoreService';
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function FrontDeskPage() {
  const { isReadOnly } = useAdminRole();
  const router = useRouter();
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
  });
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      // Show confirmed bookings that can be checked in, or checked in bookings
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
      alert('Please enter staff name');
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
        alert('Guest checked in successfully!');
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
        alert('Failed to check in guest');
      }
    } catch (error) {
      console.error('Error checking in guest:', error);
      alert('Failed to check in guest');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedBooking || isReadOnly) return;
    
    if (!checkOutForm.staffName) {
      alert('Please enter staff name');
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
        alert('Guest checked out successfully!');
        setShowCheckOutModal(false);
        setCheckOutForm({
          staffName: '',
          depositReturned: false,
          notes: '',
        });
        await loadBookings();
        router.push('/admin/checkout');
      } else {
        alert('Failed to check out guest');
      }
    } catch (error) {
      console.error('Error checking out guest:', error);
      alert('Failed to check out guest');
    } finally {
      setProcessing(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guestDetails.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.rooms[0]?.allocatedRoomType && booking.rooms[0].allocatedRoomType.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const checkInReady = filteredBookings.filter(b => b.status === 'confirmed');
  const checkedIn = filteredBookings.filter(b => b.status === 'checked_in');

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
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Front Desk Operations</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Check-in and Check-out management</p>
        <div className="mt-4 flex gap-4">
          <div className="px-4 py-2 bg-blue-100 rounded-lg">
            <span className="text-sm font-medium text-blue-800">Check-in Ready: {checkInReady.length}</span>
          </div>
          <div className="px-4 py-2 bg-green-100 rounded-lg">
            <span className="text-sm font-medium text-green-800">Checked In: {checkedIn.length}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking ID, guest name, email, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white shadow-lg overflow-hidden rounded-xl border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Check-in Date</th>
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
                    {booking.rooms[0]?.allocatedRoomType ? (
                      <span className="text-sm text-gray-900">{booking.rooms[0].allocatedRoomType}</span>
                    ) : (
                      <span className="text-sm text-gray-400">Not allocated</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(booking.checkIn).toLocaleDateString()}
                    </div>
                    {booking.checkInTime && (
                      <div className="text-xs text-gray-500">
                        Checked in: {new Date(booking.checkInTime).toLocaleString()}
                      </div>
                    )}
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
                    {!isReadOnly && (
                      <div className="flex gap-2">
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCheckInModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                          >
                            <UserPlusIcon className="h-4 w-4 mr-1" />
                            Check In
                          </button>
                        )}
                        {booking.status === 'checked_in' && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCheckOutModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
                          >
                            <UserMinusIcon className="h-4 w-4 mr-1" />
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

      {/* Check-in Modal */}
      {showCheckInModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-white to-[#FFFCF6] border-b border-[#be8c53]/20 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#202c3b]">Check-in Guest</h3>
                <p className="text-[#202c3b]/70 text-sm mt-1">
                  {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName} - {selectedBooking.bookingId}
                </p>
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="text-[#202c3b]/70 hover:text-[#FF6A00]"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  placeholder="Enter staff name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Type</label>
                  <select
                    value={checkInForm.idDocumentType}
                    onChange={(e) => setCheckInForm({ ...checkInForm, idDocumentType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  placeholder="Any special requests or notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={processing || !checkInForm.staffName}
                  className="flex-1 px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Check In Guest'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-out Modal */}
      {showCheckOutModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-white to-[#FFFCF6] border-b border-[#be8c53]/20 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#202c3b]">Check-out Guest</h3>
                <p className="text-[#202c3b]/70 text-sm mt-1">
                  {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName} - {selectedBooking.bookingId}
                </p>
              </div>
              <button
                onClick={() => setShowCheckOutModal(false)}
                className="text-[#202c3b]/70 hover:text-[#FF6A00]"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> After check-out, a housekeeping task will be automatically created for room cleaning.
                  Please generate the final checkout bill before checking out.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name *</label>
                <input
                  type="text"
                  required
                  value={checkOutForm.staffName}
                  onChange={(e) => setCheckOutForm({ ...checkOutForm, staffName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  placeholder="Any notes about check-out..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCheckOutModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={processing || !checkOutForm.staffName}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Check Out Guest'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

