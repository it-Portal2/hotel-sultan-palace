"use client";

import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookings, rooms, roomStatuses, contacts, enquiries, offers, workOrders, lowStockItems, pendingPOs] = await Promise.all([
        getAllBookings(), getRooms(), getRoomStatuses(), getAllContactForms(), getAllBookingEnquiries(), getSpecialOffers(), getPendingWorkOrders(), getLowStockInventory(), getPendingPurchaseOrders()
      ]);

      const today = new Date();
      const todayStr = today.toDateString();

      // --- Calculations ---
      const isToday = (d: any) => {
        if (!d) return false;
        const date = d instanceof Date ? d : new Date(d);
        if (isNaN(date.getTime())) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();
      };

      const arrivalsPending = bookings.filter(b => {
        return isToday(b.checkIn) && b.status === 'confirmed';
      }).length;
      const arrivalsArrived = bookings.filter(b => {
        return isToday(b.checkIn) && b.status === 'checked_in';
      }).length; // Simplification: Arrived today

      const departuresPending = bookings.filter(b => {
        const d = (b.checkOut as any) instanceof Date ? (b.checkOut as any) : new Date(b.checkOut);
        return d.toDateString() === todayStr && (b.status === 'confirmed' || b.status === 'checked_in');
      }).length;
      const departuresCheckedOut = bookings.filter(b => {
        const d = (b.checkOut as any) instanceof Date ? (b.checkOut as any) : new Date(b.checkOut);
        return d.toDateString() === todayStr && b.status === 'checked_out';
      }).length;

      const checkedInBookings = bookings.filter(b => b.status === 'checked_in');
      const adultsInHouse = checkedInBookings.reduce((sum, b) => sum + (Number(b.guests?.adults) || 0), 0);
      const childrenInHouse = checkedInBookings.reduce((sum, b) => sum + (Number(b.guests?.children) || 0), 0);

      const dbTotalRooms = rooms.length || 0;
      const occupiedRooms = checkedInBookings.length;
      const blockedRooms = roomStatuses.filter(rs => rs.status === 'maintenance').length;
      const vacantRooms = Math.max(0, dbTotalRooms - occupiedRooms - blockedRooms);

      // Housekeeping
      const cleanRooms = roomStatuses.filter(rs => rs.housekeepingStatus === 'clean').length;
      const dirtyRooms = roomStatuses.filter(rs => rs.housekeepingStatus === 'dirty').length;
      const inspectedRooms = roomStatuses.filter(rs => rs.housekeepingStatus === 'inspected').length;
      const attentionRooms = roomStatuses.filter(rs => rs.housekeepingStatus === 'needs_attention').length;

      // Revenue
      const validBookings = bookings.filter(b => b.status !== 'cancelled');
      const totalRevenue = validBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const revenueThisMonth = validBookings.filter(b => {
        const d = (b.createdAt as any) instanceof Date ? (b.createdAt as any) : new Date(b.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      // Notifications & Activities


      const notificationsData = {
        bookingInquiry: enquiries.filter(e => isToday(e.createdAt)).length,
        guestMessage: contacts.filter(c => isToday(c.createdAt)).length,
        walkInGuest: bookings.filter(b => (b.source === 'walk_in' || (b.bookingId || '').startsWith('WALKIN')) && isToday(b.createdAt)).length,
        onlineBooking: bookings.filter(b => !(b.source === 'walk_in' || (b.bookingId || '').startsWith('WALKIN')) && isToday(b.createdAt)).length,
        activeOffers: offers.filter(o => o.isActive).length,
        workOrder: workOrders.length,
        lowStock: lowStockItems.length,
        pendingPOs: pendingPOs.length
      };

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
        })),
        ...enquiries.map(e => ({
          type: 'enquiry',
          message: `Inquiry from ${e.name}`,
          time: (e.createdAt as any) instanceof Date ? e.createdAt : new Date(e.createdAt),
          status: 'Inquiry'
        }))
      ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 20);

      setDashboardData({
        arrivals: { pending: arrivalsPending, arrived: arrivalsArrived },
        departures: { pending: departuresPending, checkedOut: departuresCheckedOut },
        guestsInHouse: { adults: adultsInHouse, children: childrenInHouse },
        roomStatus: { vacant: vacantRooms, sold: occupiedRooms, dayUse: 0, complimentary: 0, blocked: blockedRooms },
        housekeeping: { clean: cleanRooms + inspectedRooms, hkAssign: attentionRooms, dirty: dirtyRooms, block: blockedRooms },
        notifications: notificationsData,
        activities: realActivities,
        totalRooms: dbTotalRooms, totalBookings: validBookings.length, revenueThisMonth, recentBookings: bookings.slice(0, 5), revenueTotal: totalRevenue
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><PremiumLoader /></div>;

  return (
    <div className="h-screen overflow-hidden bg-gray-50/50 flex flex-col font-sans text-gray-800">

      {/* 1. Compact Header */}
      <div className="px-6 py-2 flex items-center justify-between shrink-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight font-display">Dashboard</h1>
          <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={fetchDashboardData} className="p-2 hover:bg-orange-50 text-gray-400 hover:text-orange-500 rounded-full transition-colors">
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Content Container (if screen is too small) or Fixed Flex (if managed well) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">

        {/* 2. Top Stats Row - Fixed Height */}
        <div className="shrink-0">
          <TodaysOperations
            arrivals={dashboardData.arrivals}
            departures={dashboardData.departures}
            guestsInHouse={dashboardData.guestsInHouse}
            occupiedRooms={dashboardData.roomStatus.sold}
            revenue={{ total: dashboardData.revenueTotal, month: dashboardData.revenueThisMonth }}
          />
        </div>

        {/* 3. Main Operational View - Fill Remaining Space */}
        <div className="flex-none h-auto lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 lg:pb-0">

          {/* Col 1: Room Status */}
          <div className="h-full flex flex-col overflow-hidden">
            <RoomStatusChart
              roomStatus={dashboardData.roomStatus}
              housekeeping={dashboardData.housekeeping}
            />
          </div>

          {/* Col 2: Occupancy */}
          <div className="h-full flex flex-col overflow-hidden">
            <OccupancyDonut
              occupied={dashboardData.roomStatus.sold}
              vacant={dashboardData.roomStatus.vacant}
              maintenance={dashboardData.roomStatus.blocked}
            />
          </div>

          {/* Col 3: Activity Feed */}
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
    </div>
  );
}
