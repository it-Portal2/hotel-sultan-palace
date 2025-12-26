"use client";

import React, { useState, useEffect } from 'react';
import { InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  getAllBookings,
  Booking,
  getAllContactForms,
  getAllBookingEnquiries,
  getRoomStatuses,
  getRooms,
  getPendingWorkOrders,
  getLowStockInventory,
  getPendingPurchaseOrders,
  getBusinessDay,
  getSpecialOffers
} from '@/lib/firestoreService';
import StatsOverview from '@/components/admin/dashboard/StatsOverview';
import OccupancyCharts from '@/components/admin/dashboard/OccupancyCharts';
import StatusCharts from '@/components/admin/dashboard/StatusCharts';
import ActivitySection from '@/components/admin/dashboard/ActivitySection';

// --- Types ---
type NotificationKey = 'bookingInquiry' | 'guestMessage' | 'walkInGuest' | 'onlineBooking' | 'activeOffers' | string;

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    arrivals: { pending: 0, arrived: 0 },
    departures: { pending: 0, checkedOut: 0 },
    guestsInHouse: { adults: 0, children: 0 },
    roomStatus: {
      vacant: 15,
      sold: 0,
      dayUse: 0,
      complimentary: 0,
      blocked: 0
    },
    housekeeping: {
      clean: 10,
      hkAssign: 0,
      dirty: 5,
      block: 0
    },
    notifications: {
      workOrder: 0,
      bookingInquiry: 0,
      paymentFailed: 0,
      overbooking: 0,
      guestPortal: 0,
      guestMessage: 0,
      cardVerificationFailed: 0,
      tasks: 0,
      review: 0,
      inventoryAlert: 0,
      walkInGuest: 0,
      onlineBooking: 0,
      activeOffers: 0,
      lowStock: 0,
      pendingPOs: 0,
      dirtyRooms: 0,
      auditAlert: 0
    },
    activities: [] as Array<{ type: string; message: string; time: Date; status?: string }>,
    totalRooms: 0,
    totalBookings: 0,
    revenueThisMonth: 0,
    revenueTotal: 0,
    recentBookings: [] as Booking[]
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bookings, contacts, enquiries, roomStatuses, rooms, workOrders, lowStockItems, pendingPOs, businessDay, offers] = await Promise.all([
        getAllBookings(),
        getAllContactForms(),
        getAllBookingEnquiries(),
        getRoomStatuses(),
        getRooms(),
        getPendingWorkOrders(),
        getLowStockInventory(),
        getPendingPurchaseOrders(),
        getBusinessDay(),
        getSpecialOffers()
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // --- Calculations ---

      // Arrivals
      const arrivalsPending = bookings.filter(b => {
        const checkIn = new Date(b.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime() && b.status === 'confirmed';
      }).length;

      const arrivalsArrived = bookings.filter(b => b.status === 'checked_in').length;

      // Departures
      const departuresPending = bookings.filter(b => {
        const checkOut = new Date(b.checkOut);
        checkOut.setHours(0, 0, 0, 0);
        return checkOut.getTime() === today.getTime() && (b.status === 'confirmed' || b.status === 'checked_in');
      }).length;

      const departuresCheckedOut = bookings.filter(b => b.status === 'checked_out').length;

      // Guests
      const checkedInBookings = bookings.filter(b => b.status === 'checked_in');
      const adultsInHouse = checkedInBookings.reduce((sum, b) => sum + (b.guests?.adults || 0), 0);
      const childrenInHouse = checkedInBookings.reduce((sum, b) => sum + (b.guests?.children || 0), 0);

      // Rooms
      const dbTotalRooms = rooms.length || 0;
      const totalRooms = Math.max(15, dbTotalRooms);
      const occupiedRooms = checkedInBookings.length;
      const reservedRooms = bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) > today).length;
      const blockedRooms = roomStatuses.filter(rs => rs.status === 'maintenance').length;
      const vacantRooms = Math.max(0, totalRooms - occupiedRooms - blockedRooms);

      const roomStatusData = {
        vacant: vacantRooms,
        sold: occupiedRooms,
        dayUse: 0,
        complimentary: 0,
        blocked: blockedRooms
      };

      // Housekeeping
      const cleanRooms = roomStatuses.filter(rs => rs.housekeepingStatus === 'clean' || rs.housekeepingStatus === 'inspected').length;
      const dirtyRooms = roomStatuses.filter(rs => rs.housekeepingStatus === 'dirty').length;
      const hkAssignRooms = roomStatuses.filter(rs => rs.housekeepingStatus === 'needs_attention').length;

      const housekeepingData = {
        clean: cleanRooms,
        hkAssign: hkAssignRooms,
        dirty: dirtyRooms,
        block: blockedRooms
      };

      // Revenue Calculations
      const validBookings = bookings.filter(b => b.status !== 'cancelled');
      const totalRevenue = validBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const revenueThisMonth = validBookings
        .filter(b => {
          const bookingDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      // Notifications
      const isToday = (date: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const d = date instanceof Date ? date : new Date(date);
        const t = new Date();
        return d.getDate() === t.getDate() &&
          d.getMonth() === t.getMonth() &&
          d.getFullYear() === t.getFullYear();
      };

      const notificationsData = {
        bookingInquiry: enquiries.filter(e => isToday(e.createdAt)).length,
        guestMessage: contacts.filter(c => isToday(c.createdAt)).length,
        walkInGuest: bookings.filter(b => {
          const isWalkIn = b.source === 'walk_in' || (typeof b.bookingId === 'string' && b.bookingId.startsWith('WALKIN-'));
          return isWalkIn && isToday(b.createdAt);
        }).length,
        onlineBooking: bookings.filter(b => {
          const isWalkIn = b.source === 'walk_in' || (typeof b.bookingId === 'string' && b.bookingId.startsWith('WALKIN-'));
          return !isWalkIn && isToday(b.createdAt);
        }).length,
        activeOffers: offers.filter(o => o.isActive).length,

        // Wired up real counts
        workOrder: workOrders.length,
        paymentFailed: 0,
        overbooking: 0,
        guestPortal: 0,
        cardVerificationFailed: 0,
        tasks: 0, // Could link to housekeeping tasks if needed
        review: 0,
        inventoryAlert: 0,
        lowStock: lowStockItems.length,
        pendingPOs: pendingPOs.length,
        dirtyRooms: 0,
        auditAlert: 0
      };

      // Activities
      const realActivities = [
        ...bookings.map(b => ({
          type: 'booking',
          message: `Booking ${b.status === 'cancelled' ? 'was cancelled' : 'received'} - ${b.rooms?.[0]?.type || 'Room'}`,
          time: b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt),
          status: b.status === 'cancelled' ? 'Cancellation' : 'New Booking'
        })),
        ...contacts.map(c => ({
          type: 'contact',
          message: `New message from ${c.name}`,
          time: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt),
          status: 'User Action'
        }))
      ];

      const activities = realActivities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 15);

      setDashboardData({
        arrivals: { pending: arrivalsPending, arrived: arrivalsArrived },
        departures: { pending: departuresPending, checkedOut: departuresCheckedOut },
        guestsInHouse: { adults: adultsInHouse, children: childrenInHouse },
        roomStatus: roomStatusData,
        housekeeping: housekeepingData,
        notifications: notificationsData,
        activities,
        totalRooms,
        totalBookings: validBookings.length,
        revenueThisMonth,
        recentBookings: bookings.slice(0, 5),
        revenueTotal: totalRevenue
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6A00]"></div>
          <p className="text-sm text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50/50 p-6 font-sans text-gray-800 overflow-x-hidden animate-fade-in">

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, here's what's happening at Sultan Palace today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <button
            onClick={fetchDashboardData}
            className="p-2 text-gray-500 hover:text-[#FF6A00] bg-white rounded-full border border-gray-200 shadow-sm transition-all hover:shadow-md"
            title="Refresh Data"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 1. Key Metrics Summary Row */}
      <StatsOverview
        totalRooms={dashboardData.totalRooms}
        totalBookings={dashboardData.totalBookings}
        revenueThisMonth={dashboardData.revenueThisMonth}
        revenueTotal={dashboardData.revenueTotal}
      />

      {/* 2. Top Stats Row - Occupancy (Arrivals, Departures, Guests) */}
      <OccupancyCharts
        arrivals={dashboardData.arrivals}
        departures={dashboardData.departures}
        guestsInHouse={dashboardData.guestsInHouse}
      />

      {/* 3. Status Charts (Room Status & Housekeeping) */}
      <StatusCharts
        roomStatus={dashboardData.roomStatus}
        housekeeping={dashboardData.housekeeping}
      />

      {/* 4. Notifications & Activity Feeds Row */}
      <ActivitySection
        notifications={dashboardData.notifications}
        activities={dashboardData.activities}
      />
    </div>
  );
}
