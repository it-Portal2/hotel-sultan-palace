"use client";

import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  getAllBookings,
  Booking,
  getAllContactForms,
  getAllBookingEnquiries,
  getRoomStatuses,
  getRoomTypes,
  getPendingWorkOrders,
  getLowStockInventory,
  getPendingPurchaseOrders,
  getSpecialOffers
} from '@/lib/firestoreService';
import TodaysOperations from '@/components/admin/dashboard/TodaysOperations';
import RoomStatusChart from '@/components/admin/dashboard/RoomStatusChart';
import OccupancyDonut from '@/components/admin/dashboard/OccupancyDonut';
import ActivitySection from '@/components/admin/dashboard/ActivitySection';
import { useAuth } from '@/components/auth/AuthProvider';
import PremiumLoader from '@/components/ui/PremiumLoader';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [filterDate, setFilterDate] = useState('today'); // today, yesterday, this_month, last_month
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  // Raw Data Store
  const [rawData, setRawData] = useState<{
    bookings: Booking[],
    rooms: any[],
    roomStatuses: any[],
    contacts: any[],
    enquiries: any[],
    offers: any[],
    workOrders: any[],
    lowStockItems: any[],
    pendingPOs: any[]
  } | null>(null);

  const [dashboardData, setDashboardData] = useState({
    arrivals: { pending: 0, arrived: 0 },
    departures: { pending: 0, checkedOut: 0 },
    guestsInHouse: { adults: 0, children: 0 },
    roomStatus: { vacant: 0, sold: 0, dayUse: 0, complimentary: 0, blocked: 0 },
    housekeeping: { clean: 0, hkAssign: 0, dirty: 0, block: 0 },
    notifications: {
      bookingInquiry: 0, guestMessage: 0, walkInGuest: 0, onlineBooking: 0, activeOffers: 0,
      workOrder: 0, lowStock: 0, pendingPOs: 0
    },
    activities: [] as any[],
    totalRooms: 0, totalBookings: 0, revenueThisMonth: 0, recentBookings: [] as any[], revenueTotal: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookings, rooms, roomStatuses, contacts, enquiries, offers, workOrders, lowStockItems, pendingPOs] = await Promise.all([
        getAllBookings(), getRoomTypes(), getRoomStatuses(), getAllContactForms(), getAllBookingEnquiries(), getSpecialOffers(), getPendingWorkOrders(), getLowStockInventory(), getPendingPurchaseOrders()
      ]);
      setRawData({ bookings, rooms, roomStatuses, contacts, enquiries, offers, workOrders, lowStockItems, pendingPOs });
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Recalculate Dashboard Stats when Filter or Data Changes
  useEffect(() => {
    if (!rawData) return;
    const { bookings, rooms, roomStatuses, contacts, enquiries, offers, workOrders, lowStockItems, pendingPOs } = rawData;

    const now = new Date();
    let filterStart = new Date(now.setHours(0, 0, 0, 0));
    let filterEnd = new Date(now.setHours(23, 59, 59, 999));

    // Date Filter Logic (for Revenue/Counts context)
    if (filterDate === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      filterStart = new Date(yest.setHours(0, 0, 0, 0));
      filterEnd = new Date(yest.setHours(23, 59, 59, 999));
    } else if (filterDate === 'this_month') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (filterDate === 'last_month') {
      filterStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      filterEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (filterDate === 'custom' && customDateRange.start && customDateRange.end) {
      filterStart = new Date(customDateRange.start);
      filterEnd = new Date(customDateRange.end);
      filterEnd.setHours(23, 59, 59, 999);
    }

    const isInFilterRange = (d: any) => {
      if (!d) return false;
      const date = d instanceof Date ? d : new Date(d);
      if (isNaN(date.getTime())) return false;
      return date >= filterStart && date <= filterEnd;
    };

    // --- OPERATIONAL STATS (Always based on "Today" conceptually for Arrivals/Departures, unless we want to see history) ---
    // --- OPERATIONAL STATS (Aggregated for Filter Range) ---
    // User wants to see "How many arrivals in this range", etc.
    // So we use isInFilterRange instead of restricting to single day.

    // ARRIVALS Logic:
    // 1. Pending: Check-in is in Range AND Status is Confirmed.
    // 2. Arrived: Check-in is in Range AND Status is Checked In.

    const arrivalsPending = bookings.filter(b => isInFilterRange(b.checkIn) && b.status === 'confirmed').length;

    const arrivalsArrived = bookings.filter(b => {
      if (b.status !== 'checked_in') return false;
      return isInFilterRange(b.checkIn);
    }).length;

    // DEPARTURES
    const departuresPending = bookings.filter(b => {
      return isInFilterRange(b.checkOut) && (b.status === 'confirmed' || b.status === 'checked_in');
    }).length;

    const departuresCheckedOut = bookings.filter(b => {
      return isInFilterRange(b.checkOut) && b.status === 'checked_out';
    }).length;

    // HOUSE STATUS (Always Current Snapshot)
    const checkedInBookings = bookings.filter(b => b.status === 'checked_in');
    const adultsInHouse = checkedInBookings.reduce((sum, b) => sum + (Number(b.guests?.adults) || 0), 0);
    const childrenInHouse = checkedInBookings.reduce((sum, b) => sum + (Number(b.guests?.children) || 0), 0);
    const occupiedRooms = checkedInBookings.length;

    // Revenue (Filtered by Date Range)
    // Filter valid bookings created OR paid in this range? Usually 'Revenue' implies stay revenue intersecting, or payment date.
    // Simplest approach: Bookings CREATED in this range (Sales) OR Bookings overlapping? 
    // Standard Hotel: Revenue Posted. We will approximate with "Total Amount of Bookings that fall in this range".
    // Let's use `checkIn` date for revenue attribution for now (or creation date if preferred). User said "Total Revenue... filter option".
    // We will filter by CheckIn date falling in range, or CreatedAt. Let's use CreatedAt for "Sales", CheckIn for "Occupancy Revenue".
    // We'll stick to CreatedAt for "Sales/Revenue" stats as that's consistent with 'Recent Bookings'.
    const validBookings = bookings.filter(b => b.status !== 'cancelled');

    const revenueTotal = validBookings.filter(b => isInFilterRange(b.createdAt)).reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    // Note: If filter is 'Today', this shows Today's Revenue. If 'This Month', shows Month's Revenue.

    // Keep "Revenue This Month" as a separate specific stat or just rely on the filter?
    // The UI has "Total Revenue" and "Revenue This Month" in the component. We can feed the filtered revenue into 'Total'.

    // Notifications (Filtered by Date Range)
    const notificationsData = {
      bookingInquiry: enquiries.filter(e => isInFilterRange(e.createdAt)).length,
      guestMessage: contacts.filter(c => isInFilterRange(c.createdAt)).length,
      walkInGuest: bookings.filter(b => (b.source === 'walk_in' || (b.bookingId || '').startsWith('WALKIN')) && isInFilterRange(b.createdAt)).length,
      onlineBooking: bookings.filter(b => !(b.source === 'walk_in' || (b.bookingId || '').startsWith('WALKIN')) && isInFilterRange(b.createdAt)).length,
      activeOffers: offers.filter(o => o.isActive).length,
      workOrder: workOrders.length,
      lowStock: lowStockItems.length,
      pendingPOs: pendingPOs.length
    };


    // Activities
    const realActivities = [
      ...bookings.map(b => ({
        type: 'booking',
        message: `Booking ${b.status === 'cancelled' ? 'cancelled' : 'received'} - ${b.guestDetails?.firstName} ${b.guestDetails?.lastName}`,
        time: (b.createdAt as any) instanceof Date ? b.createdAt : new Date(b.createdAt),
        status: b.status === 'cancelled' ? 'Cancellation' : 'New Booking'
      })),
      ...contacts.map(c => ({
        type: 'contact',
        message: `Message from ${c.name}`,
        time: (c.createdAt as any) instanceof Date ? c.createdAt : new Date(c.createdAt),
        status: 'Message'
      }))
    ].filter(a => isInFilterRange(a.time)).sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 20);

    // Calculate Housekeeping
    let cleanRooms = 0, dirtyRooms = 0, inspectedRooms = 0, attentionRooms = 0, blockedRoomsHk = 0;
    rooms.forEach(room => {
      const statusDoc = roomStatuses.find(rs => rs.roomName === room.roomName);
      const hkStatus = statusDoc?.housekeepingStatus || 'clean';
      if (statusDoc?.status === 'maintenance') blockedRoomsHk++;
      else if (hkStatus === 'clean') cleanRooms++;
      else if (hkStatus === 'dirty') dirtyRooms++;
      else if (hkStatus === 'inspected') inspectedRooms++;
      else if (hkStatus === 'needs_attention') attentionRooms++;
    });

    const blockedRooms = roomStatuses.filter(rs => rs.status === 'maintenance').length;
    const dbTotalRooms = rooms.length || 0;
    const vacantRooms = Math.max(0, dbTotalRooms - occupiedRooms - blockedRooms);

    setDashboardData({
      arrivals: { pending: arrivalsPending, arrived: arrivalsArrived },
      departures: { pending: departuresPending, checkedOut: departuresCheckedOut },
      guestsInHouse: { adults: adultsInHouse, children: childrenInHouse },
      roomStatus: { vacant: vacantRooms, sold: occupiedRooms, dayUse: 0, complimentary: 0, blocked: blockedRooms },
      housekeeping: { clean: cleanRooms + inspectedRooms, hkAssign: attentionRooms, dirty: dirtyRooms, block: blockedRoomsHk },
      notifications: notificationsData,
      activities: realActivities,
      totalRooms: dbTotalRooms,
      totalBookings: validBookings.length,
      revenueThisMonth: 0, // Not used if we override total with filtered
      recentBookings: bookings.slice(0, 5),
      revenueTotal: revenueTotal
    });

  }, [rawData, filterDate]);

  const getDisplayDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (filterDate === 'today') return new Date().toLocaleDateString('en-US', options);
    if (filterDate === 'yesterday') {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return d.toLocaleDateString('en-US', options);
    }
    if (filterDate === 'this_month') return `This Month (${new Date().toLocaleString('default', { month: 'long' })})`;
    if (filterDate === 'last_month') {
      const d = new Date(); d.setMonth(d.getMonth() - 1);
      return `Last Month (${d.toLocaleString('default', { month: 'long' })})`;
    }
    if (filterDate === 'custom' && customDateRange.start && customDateRange.end) {
      return `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}`;
    }
    return new Date().toLocaleDateString('en-US', options);
  };

  if (loading || !rawData) return <div className="h-screen flex items-center justify-center bg-gray-50"><PremiumLoader /></div>;

  return (
    <div className="h-screen overflow-hidden bg-gray-50/50 flex flex-col font-sans text-gray-800">
      <div className="px-6 py-2 flex items-center justify-between shrink-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight font-display">Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium text-orange-600">{getDisplayDate()}</p>
        </div>

        <div className="flex items-center gap-3">
          {filterDate === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <input type="date" value={customDateRange.start} onChange={e => setCustomDateRange({ ...customDateRange, start: e.target.value })} className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-orange-500 outline-none" />
              <span className="text-gray-400">-</span>
              <input type="date" value={customDateRange.end} onChange={e => setCustomDateRange({ ...customDateRange, end: e.target.value })} className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-orange-500 outline-none" />
            </div>
          )}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-xs bg-white border border-gray-300 rounded-md px-3 py-1.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none shadow-sm"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <button onClick={loadData} className="p-2 hover:bg-orange-50 text-gray-400 hover:text-orange-500 rounded-full transition-colors" title="Refresh Data">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
        <div className="shrink-0">
          <TodaysOperations
            arrivals={dashboardData.arrivals}
            departures={dashboardData.departures}
            guestsInHouse={dashboardData.guestsInHouse}
            occupiedRooms={dashboardData.roomStatus.sold}
            revenue={{ total: dashboardData.revenueTotal, month: 0 }} // Month 0 to hide dual display or repurpose
          />
        </div>

        <div className="flex-none h-auto lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 lg:pb-0">
          <div className="h-full flex flex-col overflow-hidden">
            <RoomStatusChart
              roomStatus={dashboardData.roomStatus}
              housekeeping={dashboardData.housekeeping}
            />
          </div>

          <div className="h-full flex flex-col overflow-hidden">
            <OccupancyDonut
              occupied={dashboardData.roomStatus.sold}
              vacant={dashboardData.roomStatus.vacant}
              maintenance={dashboardData.roomStatus.blocked}
            />
          </div>

          <div className="h-full flex flex-col overflow-hidden relative">
            <div className="absolute inset-0">
              <ActivitySection
                notifications={dashboardData.notifications}
                activities={dashboardData.activities}
              />
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
