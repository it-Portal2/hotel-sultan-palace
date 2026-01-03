"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
  getAllBookings,
  checkInGuest,
  checkOutGuest,
  Booking
} from '@/lib/firestoreService';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  Squares2X2Icon,
  TableCellsIcon,
  CurrencyDollarIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline'; // Updated imports
import FrontDeskStats from '@/components/admin/front-desk/FrontDeskStats';
import FrontDeskTable from '@/components/admin/front-desk/FrontDeskTable';
import CheckInModal, { CheckInData } from '@/components/admin/front-desk/CheckInModal';
import CheckOutModal, { CheckOutData } from '@/components/admin/front-desk/CheckOutModal';
import RoomViewGrid from '@/components/admin/front-desk/RoomViewGrid';
import UnsettledFolios from '@/components/admin/front-desk/UnsettledFolios';
import InsertTransaction from '@/components/admin/front-desk/InsertTransaction';

export default function FrontDeskPage() {
  const { isReadOnly } = useAdminRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [checkInModalPos, setCheckInModalPos] = useState<{ top: number, left: number } | undefined>(undefined);
  const [processing, setProcessing] = useState(false);

  const initialTab = (searchParams.get('tab') as any) || 'arrivals';
  const [activeTab, setActiveTab] = useState<'arrivals' | 'in_house' | 'departures' | 'room_view' | 'unsettled' | 'transactions' | 'all'>(initialTab);

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

    // Tab Filtering (Only for Overview modes)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeTab === 'arrivals') {
      filtered = filtered.filter(b => b.status === 'confirmed' || b.status === 'pending');
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

  return (
    <div className="space-y-6 animate-fade-in pb-12 h-[calc(100vh-100px)] flex flex-col">



      {/* Content */}
      <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        {activeTab === 'room_view' ? (
          <RoomViewGrid isReadOnly={isReadOnly} />
        ) : activeTab === 'unsettled' ? (
          <div className="h-full p-4 overflow-auto">
            <UnsettledFolios />
          </div>
        ) : activeTab === 'transactions' ? (
          <div className="h-full p-4 overflow-auto">
            <InsertTransaction />
          </div>
        ) : (
          /* Table View Logic */
          <div className="h-full flex flex-col space-y-6 overflow-hidden p-6">
            <FrontDeskStats stats={stats} />


            <div className="flex-1 overflow-auto">
              <FrontDeskTable
                bookings={filteredBookings}
                isReadOnly={isReadOnly}
                onCheckIn={(b, index, pos) => {
                  setSelectedBooking(b);
                  setSelectedRoomIndex(index || 0);
                  setCheckInModalPos(pos);
                  setShowCheckInModal(true);
                }}
                onCheckOut={(b, index) => {
                  setSelectedBooking(b);
                  setSelectedRoomIndex(index || 0);
                  setShowCheckOutModal(true);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCheckInModal && selectedBooking && (
        <CheckInModal
          booking={selectedBooking}
          roomIndex={selectedRoomIndex}
          position={checkInModalPos}
          onClose={() => setShowCheckInModal(false)}
          onConfirm={handleCheckIn}
          processing={processing}
        />
      )}

      {showCheckOutModal && selectedBooking && (
        <CheckOutModal
          booking={selectedBooking}
          roomIndex={selectedRoomIndex}
          position={checkInModalPos}
          onClose={() => setShowCheckOutModal(false)}
          onConfirm={handleCheckOut}
          processing={processing}
        />
      )}
    </div>
  );
}
