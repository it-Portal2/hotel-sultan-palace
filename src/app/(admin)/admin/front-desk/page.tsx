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
        data.allocatedRoomName
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
    // Standardize Checkout Flow: Redirect to Billing/Checkout Page
    if (!selectedBooking) return;
    const bookingId = selectedBooking.bookingId || selectedBooking.id;
    router.push(`/admin/checkout?bookingId=${bookingId}`);
    setShowCheckOutModal(false);
  };

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Tab Filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeTab === 'arrivals') {
      filtered = filtered.filter(b => b.status === 'confirmed');
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
        onCheckIn={(b) => {
          setSelectedBooking(b);
          setShowCheckInModal(true);
        }}
        onCheckOut={(b) => {
          setSelectedBooking(b);
          setShowCheckOutModal(true);
        }}
      />

      {/* Modals */}
      {showCheckInModal && selectedBooking && (
        <CheckInModal
          booking={selectedBooking}
          onClose={() => setShowCheckInModal(false)}
          onConfirm={handleCheckIn}
          processing={processing}
        />
      )}

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
