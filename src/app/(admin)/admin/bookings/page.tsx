"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { getAllBookings, Booking, updateBooking, checkInGuest, checkOutGuest, getSystemLocks } from '@/lib/firestoreService';
import { cancelBooking, confirmBooking } from '@/lib/bookingService';
import { sendBookingCancellationEmailAction } from '@/app/actions/emailActions';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import BookingTable from '@/components/admin/bookings/BookingTable';
import BookingDetailsDrawer from '@/components/admin/bookings/BookingDetailsDrawer';
import CheckInModal, { CheckInData } from '@/components/admin/front-desk/CheckInModal';
import CheckOutModal, { CheckOutData } from '@/components/admin/front-desk/CheckOutModal';
import StayOverModal from '@/components/admin/bookings/StayOverModal';
import BookingCard from '@/components/admin/bookings/BookingCard';
import { ListBulletIcon, Squares2X2Icon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import PremiumLoader from '@/components/ui/PremiumLoader';

export default function AdminBookingsPage() {
  const { isReadOnly, isFullAdmin, isSuperAdmin } = useAdminRole();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [isDrawerEditMode, setIsDrawerEditMode] = useState(false); // New State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);
  const [showStayOverModal, setShowStayOverModal] = useState(false);
  const [checkInPosition, setCheckInPosition] = useState<{ top: number; left: number } | undefined>(undefined);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'all' | 'arrivals' | 'departures' | 'in_house' | 'cancelled'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // History Toggle State
  const [showHistory, setShowHistory] = useState(false);

  // Filters
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'walk_in'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');

  // Pagination State (Optional usage, but we will show all for now)
  const [page, setPage] = useState(1);
  const pageSize = 500; // Increased to show effectively "all"

  const refreshData = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings(undefined);
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
  }, [showHistory]); // Re-fetch when toggle changes

  // Set page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [query, status, startDate, endDate, sort, activeTab]);

  const filtered = useMemo(() => {
    let list = bookings.slice();
    const todayStr = new Date().toISOString().slice(0, 10);

    const today = new Date();

    // Tab Logic
    if (activeTab === 'arrivals') {
      // Bookings checking in today OR earlier but not yet checked in (Late Arrivals)
      list = list.filter(b => {
        const d = new Date(b.checkIn);
        // Reset time parts for accurate date comparison
        const checkInDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        return checkInDate <= todayDate && (b.status === 'confirmed' || b.status === 'pending');
      });
    } else if (activeTab === 'departures') {
      // Bookings checking out today OR earlier but still in house (Overstay/Late Checkout)
      list = list.filter(b => {
        const d = new Date(b.checkOut);
        const checkOutDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        return checkOutDate <= todayDate && (b.status === 'checked_in');
      });
    } else if (activeTab === 'in_house') {
      // Currently checked_in guests + stay_over
      list = list.filter(b => b.status === 'checked_in' || b.status === 'stay_over');
    } else if (activeTab === 'cancelled') {
      // ONLY Cancelled bookings
      list = list.filter(b => b.status === 'cancelled');
    } else if (activeTab === 'all') {
      // In 'All' tab, we usually hide Cancelled if specific filter is not set?
      // User asked to have a separate tab "Cancelled ka alag tab bana ke rakh sakte hain?"
      // implies he wants them THERE, and maybe NOT confusing the main view?
      // But typically 'All' means All.
      // Let's keep 'All' as All (except maintenance blocks), but ensure the 'Cancelled' tab is distinct.
      // If user wants them GONE from All, I can do: list = list.filter(b => b.status !== 'cancelled' && ...)
      // But for now, let's just Add the tab which solves the "Where are they?" problem.
    }



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
      // Parse YYYY-MM-DD strictly as local time
      const [y, m, d] = startDate.split('-').map(Number);
      const s = new Date(y, m - 1, d, 0, 0, 0, 0); // Local Midnight

      list = list.filter(b => {
        const bookingDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return bookingDate >= s;
      });
    }

    if (endDate) {
      // Parse YYYY-MM-DD strictly as local time
      const [y, m, d] = endDate.split('-').map(Number);
      const e = new Date(y, m - 1, d, 0, 0, 0, 0); // Local Midnight
      e.setDate(e.getDate() + 1); // Add 1 day to include the end date fully (up to 23:59:59.999 local)

      list = list.filter(b => {
        const bookingDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return bookingDate < e;
      });
    }

    if (status === 'walk_in') {
      list = list.filter(b => b.source === 'walk_in' || (b.bookingId || b.id).toUpperCase().startsWith('WALKIN'));
    } else if (status !== 'all' && activeTab === 'all') { // Only apply status filter in All tab
      list = list.filter(b => b.status === status);
    } else if (status === 'all' && activeTab === 'all') {
      // In 'All' tab with 'All' filter, hide maintenance blocks by default unless searched
      if (!query) {
        list = list.filter(b => b.status !== 'maintenance' && !b.guestDetails.firstName.toUpperCase().includes('MAINTENANCE'));
      }
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
  }, [bookings, searchParams, query, status, startDate, endDate, sort, activeTab]);

  const paginated = useMemo(() => {
    // We are showing ALL items, so pagination is just a safety slice or full list
    return filtered;
  }, [filtered]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      walk_in: bookings.filter(b => b.source === 'walk_in').length,
      arrivals: bookings.filter(b => {
        const d = new Date(b.checkIn);
        const today = new Date();
        const checkInDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return checkInDate <= todayDate &&
          (b.status === 'confirmed' || b.status === 'pending');
      }).length,
      departures: bookings.filter(b => {
        const d = new Date(b.checkOut);
        const today = new Date();
        const checkOutDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return checkOutDate <= todayDate &&
          b.status === 'checked_in';
      }).length,
      in_house: bookings.filter(b => b.status === 'checked_in' || b.status === 'stay_over').length,
    };
  }, [bookings]);

  // Placeholder handlers for missing code
  const handleFilterClick = (id: any) => setActiveTab(id);

  const handleCheckInClick = (booking: Booking) => {
    setSelected(booking);
    setShowCheckInModal(true);
  };

  const handleStatusUpdate = async (action: string, booking: Booking) => {
    if (action === 'check_out') {
      setSelected(booking);
      setShowCheckOutModal(true);
    } else if (action === 'cancel') {
      try {
        await cancelBooking(booking.id);
        showToast('Booking cancelled', 'success');
        refreshData();
      } catch (error) {
        showToast('Failed to cancel booking', 'error');
      }
    }
  };

  const handleCheckInConfirm = async (data: CheckInData) => {
    if (!selected) return;
    setProcessing(true);
    try {
      await checkInGuest(
        selected.id,
        data.staffName,
        data.idDocumentType,
        data.idDocumentNumber,
        data.roomKeyNumber,
        Number(data.depositAmount) || 0,
        data.notes,
        data.allocatedRoomName,
        selectedRoomIndex,
        data.paymentMethod
      );
      showToast('Guest checked in successfully', 'success');
      setShowCheckInModal(false);
      refreshData();
    } catch (error) {
      showToast('Failed to check in guest', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOutConfirm = async (data: CheckOutData) => {
    if (!selected) return;
    setProcessing(true);
    try {
      await checkOutGuest(selected.id, data);
      showToast('Guest checked out successfully', 'success');
      setShowCheckOutModal(false);
      refreshData();
    } catch (error) {
      showToast('Failed to check out guest', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleStayOverConfirm = async () => {
    // specific logic needed here
    setShowStayOverModal(false);
  };

  const exportCsv = () => {
    console.log('Export CSV placeholder');
  };

  const allowedActions = ['check_in', 'check_out', 'cancel', 'stay_over'];

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 flex flex-col xl:flex-row xl:items-center justify-between">
          {/* Left: Tabs */}
          <nav className="-mb-px flex space-x-6 overflow-x-auto shrink-0 max-w-[calc(100vw-3rem)] xl:max-w-none" aria-label="Tabs">
            {[
              { id: 'all', name: 'Reservations', count: stats.total },
              { id: 'arrivals', name: 'Arrivals', count: stats.arrivals },
              { id: 'departures', name: 'Departures', count: stats.departures },
              { id: 'in_house', name: 'In-house', count: stats.in_house },
              { id: 'cancelled', name: 'Cancelled', count: stats.cancelled }, // Added
            ].map((tab) => {
              const isActive = tab.id === activeTab || (activeTab === 'all' && tab.id === 'all');
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'all') {
                      setActiveTab('all');
                      setStatus('all');
                    } else {
                      handleFilterClick(tab.id as any);
                    }
                  }}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors
                    ${isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                    }
                  `}
                >
                  {tab.name}
                  <span className={`
                    ml-1 py-0.5 px-2 rounded-full text-[10px] font-bold
                    ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}
                  `}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right: Actions Toolbar */}
          <div className="flex items-center gap-3 py-3 w-full xl:w-auto overflow-x-auto no-scrollbar justify-end flex-1 ml-4">

            {/* Search */}
            <div className="relative group w-full xl:w-64 shrink-0">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bookings..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="h-6 w-px bg-gray-100 mx-1 shrink-0 hidden xl:block"></div>

            {/* Date Range */}
            <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100 shrink-0">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none p-0 text-xs text-gray-600 font-bold focus:ring-0 cursor-pointer w-[85px] uppercase"
              />
              <span className="text-gray-300 mx-1">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none p-0 text-xs text-gray-600 font-bold focus:ring-0 cursor-pointer w-[85px] uppercase"
              />
            </div>

            {/* View Toggles */}
            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>

            {/* Export */}
            <button
              onClick={exportCsv}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 rounded-lg text-xs font-bold transition-all shrink-0 shadow-sm"
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              <span className="hidden leading-none xl:inline">Export</span>
            </button>

            {/* Admin History Toggle */}
            {(isFullAdmin || isSuperAdmin) && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                <span className="text-xs font-bold text-gray-500 hidden xl:inline">History</span>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${showHistory ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${showHistory ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            )}

          </div>
        </div >
      </div >

      {/* Main Content Area - Full List (No Pagination) */}
      < div className="px-6" >
        {viewMode === 'list' ? (
          <BookingTable
            bookings={paginated}
            loading={loading}
            onSelect={(b) => {
              setSelected(b);
              setIsDrawerEditMode(false);
              setShowDetailsDrawer(true);
            }}
            onEdit={(b) => {
              setSelected(b);
              setIsDrawerEditMode(true); // Open in Edit Mode
              setShowDetailsDrawer(true);
            }}
            page={1}
            pageSize={paginated.length}
            total={filtered.length}
            onPageChange={() => { }}
            onCheckIn={handleCheckInClick}
            onCheckOut={(b) => handleStatusUpdate('check_out', b)}
            onStayOver={(b) => {
              setSelected(b);
              setShowDetailsDrawer(false);
              setShowStayOverModal(true);
            }}
            onCancel={(b) => {
              if (confirm('Are you sure you want to cancel this booking?')) {
                handleStatusUpdate('cancel', b);
              }
            }}
          />
        ) : (
          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <PremiumLoader />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-4">
                <p className="text-gray-400 font-medium">No bookings found for this view.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 mt-6">
                {filtered.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onSelect={(b) => {
                      setSelected(b);
                      setIsDrawerEditMode(false);
                      setShowDetailsDrawer(true);
                    }}
                    onCheckIn={handleCheckInClick}
                    onCheckOut={(b) => handleStatusUpdate('check_out', b)}
                    onStayOver={(b) => {
                      setSelected(b);
                      setShowDetailsDrawer(false);
                      setShowStayOverModal(true);
                    }}
                    allowedActions={allowedActions as any}
                  />
                ))}
              </div>
            )}
          </div>
        )
        }
      </div >

      {/* Drawer */}
      {
        selected && showDetailsDrawer && (
          <BookingDetailsDrawer
            booking={selected}
            onClose={() => {
              setShowDetailsDrawer(false);
              setTimeout(() => setSelected(null), 300);
            }}
            isOpen={showDetailsDrawer}
            initialIsEditing={isDrawerEditMode}
            onUpdate={refreshData}
            onCancelBooking={(b) => handleStatusUpdate('cancel', b)}
          />
        )
      }

      {
        selected && showCheckInModal && (
          <CheckInModal
            booking={selected}
            roomIndex={selectedRoomIndex}
            onClose={() => setShowCheckInModal(false)}
            onConfirm={handleCheckInConfirm}
            processing={processing}
            position={undefined}
          />
        )
      }

      {
        selected && showCheckOutModal && (
          <CheckOutModal
            booking={selected}
            roomIndex={selectedRoomIndex}
            onClose={() => setShowCheckOutModal(false)}
            onConfirm={handleCheckOutConfirm}
            processing={processing}
          />
        )
      }

      {
        selected && showStayOverModal && (
          <StayOverModal
            booking={selected}
            isOpen={showStayOverModal}
            onClose={() => setShowStayOverModal(false)}
            onConfirm={handleStayOverConfirm}
          />
        )
      }
    </div >
  );
}
