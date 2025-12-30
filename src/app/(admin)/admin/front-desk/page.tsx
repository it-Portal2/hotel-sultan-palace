"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
  getAllBookings,
  checkInGuest,
  checkOutGuest,
  Booking
} from '@/lib/firestoreService';
import Link from 'next/link';
import { MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import FrontDeskStats from '@/components/admin/front-desk/FrontDeskStats';
import FrontDeskTable from '@/components/admin/front-desk/FrontDeskTable';
import CheckInModal, { CheckInData } from '@/components/admin/front-desk/CheckInModal';
import CheckOutModal, { CheckOutData } from '@/components/admin/front-desk/CheckOutModal';

export default function FrontDeskPage() {
  const { isReadOnly } = useAdminRole();
  const router = useRouter();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'arrivals' | 'in_house' | 'departures' | 'all'>('arrivals');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      // Keep all bookings for history, but we'll filter in the UI
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (data: CheckInData) => {
    if (!selectedBooking || isReadOnly) return;
    setProcessing(true);
    try {
      const recordId = await checkInGuest(
        selectedBooking.id,
        data.staffName,
        data.idDocumentType,
        data.idDocumentNumber || undefined,
        data.roomKeyNumber || undefined,
        data.depositAmount ? parseFloat(data.depositAmount) : undefined,
        data.notes || undefined,
        data.allocatedRoomName,
        selectedRoomIndex // Pass the room index
      );

      if (recordId) {
        showToast('Guest checked in successfully!', 'success');
        setShowCheckInModal(false);
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

  const handleCheckOut = async (data: CheckOutData) => {
    if (!selectedBooking) return;

    // If it's the last room or only room, we might want to redirect to checkout
    // BUT the new requirements imply we want to check out specific rooms here.
    // The previous logic redirected to checkout page.
    // If we want to support per-room checkout here, we should call checkOutGuest with roomIndex.
    // The Checkout Page (billing) is usually for the WHOLE booking.
    // If we are checking out just ONE room of a multi-room booking, we probably shouldn't redirect to the main checkout page immediately,
    // OR we should, but the checkout page needs to handle partial checkout?
    // For now, let's implement the in-place checkout for the room using the modal, 
    // effectively overriding the "Redirect to Billing" behavior for multi-room partial checkouts,
    // OR we keep the redirect but pass the room index to the checkout page?
    // The checkout page `src/app/(admin)/admin/checkout/page.tsx` seems to calculate the bill for the WHOLE booking.

    // Let's use the explicit checkOutGuest function here for the room, as requested by the "Individual management" requirement.
    // We can still redirect to billing if needed, but the user specifically asked for "individual management (check-in/out)".

    setProcessing(true);
    try {
      const success = await checkOutGuest(
        selectedBooking.id,
        data.staffName,
        data.depositReturned,
        data.notes || undefined,
        {
          priority: data.housekeepingPriority,
          assignedTo: data.housekeepingAssignee || undefined
        },
        selectedRoomIndex
      );

      if (success) {
        showToast('Room checked out successfully!', 'success');
        setShowCheckOutModal(false);
        await loadBookings();

        // Optionally redirect to billing if all rooms are checked out?
        // simple check:
        // const allCheckedOut = ... 
        // For now, let's stay here as it allows managing other rooms.
      } else {
        showToast('Failed to check out room', 'error');
      }
    } catch (error) {
      console.error('Error checking out room:', error);
      showToast('Failed to check out room', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Tab Filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Note: With multi-room, status filtering becomes tricker if we filter by *booking* status
    // but the rows are per-room. FrontDeskTable handles rows.
    // However, if we filter bookings here, we might hide a booking that has one room active and one not?
    // The existing logic filters *bookings*.
    // If a booking is "checked_in" (partially or fully), it shows in 'in_house'.
    // If 'confirmed', it shows in 'arrivals'.
    // We updated `checkInGuest` to set booking status to `checked_in` if any room is checked in.
    // So this logic should still roughly work.

    if (activeTab === 'arrivals') {
      filtered = filtered.filter(b => b.status === 'confirmed' || b.status === 'pending');
      // In a real app, we'd also check if checkIn date is <= today
    } else if (activeTab === 'in_house') {
      filtered = filtered.filter(b => b.status === 'checked_in');
    } else if (activeTab === 'departures') {
      filtered = filtered.filter(b => {
        if (b.status !== 'checked_in') return false;
        const outDate = new Date(b.checkOut);
        outDate.setHours(0, 0, 0, 0);
        return outDate.getTime() <= today.getTime();
      });
    }

    // Search Filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => {
        const bookingId = booking.bookingId?.toLowerCase() || '';
        const guestName = `${booking.guestDetails?.firstName || ''} ${booking.guestDetails?.lastName || ''}`.toLowerCase();
        const guestEmail = booking.guestDetails?.email?.toLowerCase() || '';
        const roomName = booking.rooms?.[0]?.allocatedRoomType?.toLowerCase() || booking.rooms?.[0]?.type?.toLowerCase() || '';
        return bookingId.includes(q) || guestName.includes(q) || guestEmail.includes(q) || roomName.includes(q);
      });
    }

    return filtered;
  }, [bookings, searchQuery, activeTab]);

  const stats = useMemo(() => {
    return {
      checkInReady: bookings.filter(b => b.status === 'confirmed').length,
      checkedIn: bookings.filter(b => b.status === 'checked_in').length,
    };
  }, [bookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-b-2 border-[#FF6A00]"></div>
          <p className="text-sm text-gray-500 font-medium">Loading Front Desk...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'arrivals', label: 'Arrivals' },
    { id: 'in_house', label: 'In House' },
    { id: 'all', label: 'All Bookings' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Front Desk Operations</h1>
          <p className="text-sm text-gray-500 mt-1">Daily operations: Arrivals, Departures, and In-House Guests.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/front-desk/night-audit"
            className="flex items-center gap-2 bg-[#FF6A00] text-white px-4 py-2 text-sm font-medium hover:bg-[#FF6A00]/90 transition-colors shadow-sm"
          >
            <ClockIcon className="h-4 w-4" />
            Night Audit
          </Link>
          <button
            onClick={loadBookings}
            className="bg-white border border-gray-200 text-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats */}
      <FrontDeskStats stats={stats} />

      {/* Controls & Tabs */}
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id
                ? 'border-[#FF6A00] text-[#FF6A00]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest, ID, or room number..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <FrontDeskTable
        bookings={filteredBookings}
        isReadOnly={isReadOnly}
        onCheckIn={(b, index) => {
          setSelectedBooking(b);
          setSelectedRoomIndex(index || 0);
          setShowCheckInModal(true);
        }}
        onCheckOut={(b, index) => {
          setSelectedBooking(b);
          setSelectedRoomIndex(index || 0);
          setShowCheckOutModal(true);
        }}
      />

      {/* Modals */}
      {showCheckInModal && selectedBooking && (
        <CheckInModal
          booking={selectedBooking}
          roomIndex={selectedRoomIndex}
          onClose={() => setShowCheckInModal(false)}
          onConfirm={handleCheckIn}
          processing={processing}
        />
      )}

      {showCheckOutModal && selectedBooking && (
        <CheckOutModal
          booking={selectedBooking}
          roomIndex={selectedRoomIndex}
          onClose={() => setShowCheckOutModal(false)}
          onConfirm={handleCheckOut}
          processing={processing}
        />
      )}
    </div>
  );
}
