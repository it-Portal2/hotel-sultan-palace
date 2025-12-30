"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { getAllBookings, Booking, updateBooking, checkInGuest, checkOutGuest, getSystemLocks } from '@/lib/firestoreService';
import { cancelBooking, confirmBooking } from '@/lib/bookingService';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import BookingStats from '@/components/admin/bookings/BookingStats';
import BookingFilters from '@/components/admin/bookings/BookingFilters';
import BookingTable from '@/components/admin/bookings/BookingTable';
import BookingDetailsModal from '@/components/admin/bookings/BookingDetailsModal';
import CheckInModal, { CheckInData } from '@/components/admin/front-desk/CheckInModal';
import CheckOutModal, { CheckOutData } from '@/components/admin/front-desk/CheckOutModal';

export default function AdminBookingsPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);

  // Filters
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'walk_in'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const refreshData = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      setBookings(data);
    } catch (e) {
      console.error('Error loading bookings:', e);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Set page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [query, status, startDate, endDate, sort]);

  const filtered = useMemo(() => {
    let list = bookings.slice();

    const day = searchParams?.get('day');
    if (day) {
      const start = new Date(day);
      const end = new Date(day);
      end.setDate(end.getDate() + 1);
      list = list.filter(b => {
        const created = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return created >= start && created < end;
      });
    }

    if (startDate) {
      const s = new Date(startDate);
      list = list.filter(b => (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setDate(e.getDate() + 1);
      list = list.filter(b => (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) < e);
    }

    if (status === 'walk_in') {
      list = list.filter(b => b.source === 'walk_in' || (b.bookingId || b.id).toUpperCase().startsWith('WALKIN'));
    } else if (status !== 'all') {
      list = list.filter(b => b.status === status);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(b => {
        const id = (b.bookingId || b.id).toLowerCase();
        const name = `${b.guestDetails?.firstName || ''} ${b.guestDetails?.lastName || ''}`.toLowerCase();
        const email = (b.guestDetails?.email || '').toLowerCase();
        return id.includes(q) || name.includes(q) || email.includes(q);
      });
    }

    list.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      if (sort === 'newest') return bTime - aTime;
      if (sort === 'oldest') return aTime - bTime;
      if (sort === 'amount_desc') return (b.totalAmount || 0) - (a.totalAmount || 0);
      if (sort === 'amount_asc') return (a.totalAmount || 0) - (b.totalAmount || 0);
      return 0;
    });

    return list;
  }, [bookings, searchParams, query, status, startDate, endDate, sort]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const stats = useMemo(() => {
    return {
      total: filtered.length,
      pending: filtered.filter(b => b.status === 'pending').length,
      confirmed: filtered.filter(b => b.status === 'confirmed').length,
      cancelled: filtered.filter(b => b.status === 'cancelled').length,
    };
  }, [filtered]);

  const exportCsv = () => {
    const headers = ['BookingID', 'Guest', 'Email', 'CheckIn', 'CheckOut', 'Adults', 'Children', 'Rooms', 'Total', 'Status', 'CreatedAt'];
    const rows = filtered.map(b => [
      b.bookingId || b.id,
      `${b.guestDetails?.firstName || ''} ${b.guestDetails?.lastName || ''}`.trim(),
      b.guestDetails?.email || '',
      new Date(b.checkIn).toISOString().slice(0, 10),
      new Date(b.checkOut).toISOString().slice(0, 10),
      b.guests?.adults || 0,
      b.guests?.children || 0,
      b.guests?.rooms || 1,
      b.totalAmount || 0,
      b.status,
      (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)).toISOString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusUpdate = async (type: 'cancel' | 'confirm' | 'pending' | 'check_in' | 'check_out', booking: Booking, roomIndex?: number) => {
    try {
      if (type === 'cancel') {
        await cancelBooking(booking.id);
        showToast('Booking cancelled successfully', 'success');
      } else if (type === 'confirm') {
        await confirmBooking(booking.id);
        showToast('Booking confirmed successfully', 'success');
      } else if (type === 'pending') {
        await updateBooking(booking.id, { status: 'pending' });
        showToast('Booking marked as pending', 'success');
      } else if (type === 'check_in') {
        setSelected(booking);
        setSelectedRoomIndex(roomIndex ?? 0);
        setShowCheckInModal(true);
        return;
      } else if (type === 'check_out') {
        // Redirection to Unified Checkout Flow if no roomIndex? Or use modal?
        // Using modal for now to align with "Front Desk" and per-room actions
        // If roomIndex is present, assume partial check-out via modal.
        // If not, allow modal too.
        setSelected(booking);
        setSelectedRoomIndex(roomIndex ?? 0);
        setShowCheckOutModal(true);
        return;
      }

      // Optimistic update or refresh
      const updated = await getAllBookings();
      setBookings(updated);

      // Update selected if open
      if (selected && selected.id === booking.id) {
        const newItem = updated.find(b => b.id === booking.id);
        if (newItem) setSelected(newItem);
      }

    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Action failed. Please try again.', 'error');
    }
  };

  const handleCheckInConfirm = async (data: CheckInData) => {
    if (!selected) return;
    setProcessing(true);
    try {
      const recordId = await checkInGuest(
        selected.id,
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
        // Do not close details modal, just refresh data
        await refreshData();
        // Update selected object
        const updated = await getAllBookings();
        const newItem = updated.find(b => b.id === selected.id);
        if (newItem) setSelected(newItem);
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

  const handleCheckOutConfirm = async (data: CheckOutData) => {
    if (!selected) return;
    setProcessing(true);

    // Lock check before checkout
    try {
      const locks = await getSystemLocks();
      const rIndex = selectedRoomIndex ?? 0;
      const targetRoom = selected.rooms[rIndex];
      const roomNum = targetRoom?.allocatedRoomType || selected.roomNumber;

      const activeLock = locks.find(lock =>
        (lock.resourceType === 'folio' && lock.resourceId === selected.id) ||
        (roomNum && lock.resourceType === 'room' && lock.resourceId === roomNum)
      );

      if (activeLock) {
        showToast(`Checkout Blocked: Locked by ${activeLock.lockedBy}`, 'error');
        setProcessing(false);
        return;
      }
    } catch (e) {
      console.error("Lock check failed", e);
    }

    try {
      const success = await checkOutGuest(
        selected.id,
        data.staffName,
        data.depositReturned,
        data.notes || undefined,
        {
          priority: data.housekeepingPriority,
          assignedTo: data.housekeepingAssignee || undefined,
          scheduledTime: new Date(),
        },
        selectedRoomIndex // Pass the room index
      );

      if (success) {
        showToast('Guest checked out successfully!', 'success');
        setShowCheckOutModal(false);
        // Do not close details modal, just refresh data
        await refreshData();
        // Update selected object
        const updated = await getAllBookings();
        const newItem = updated.find(b => b.id === selected.id);
        if (newItem) setSelected(newItem);
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all bookings and enquiries efficiently.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <BookingStats stats={stats} />

      {/* Filters */}
      <BookingFilters
        query={query} setQuery={setQuery}
        status={status} setStatus={setStatus}
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate}
        sort={sort} setSort={setSort}
        onExport={exportCsv}
      />

      {/* Data Table */}
      <BookingTable
        bookings={paginated}
        loading={loading}
        onSelect={setSelected}
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
      />

      {/* Modal */}
      {selected && !showCheckInModal && !showCheckOutModal && (
        <BookingDetailsModal
          booking={selected}
          onClose={() => setSelected(null)}
          isReadOnly={isReadOnly}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {selected && showCheckInModal && (
        <CheckInModal
          booking={selected}
          roomIndex={selectedRoomIndex}
          onClose={() => setShowCheckInModal(false)}
          onConfirm={handleCheckInConfirm}
          processing={processing}
        />
      )}

      {selected && showCheckOutModal && (
        <CheckOutModal
          booking={selected}
          roomIndex={selectedRoomIndex}
          onClose={() => setShowCheckOutModal(false)}
          onConfirm={handleCheckOutConfirm}
          processing={processing}
        />
      )}
    </div>
  );
}
