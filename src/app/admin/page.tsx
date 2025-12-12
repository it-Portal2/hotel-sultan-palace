"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BuildingOfficeIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  PhoneIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  HomeIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  getAllBookings, 
  Booking, 
  getAllContactForms, 
  getAllBookingEnquiries,
  getRoomStatuses,
  getRooms
} from '@/lib/firestoreService';

// Circular Progress Chart Component
const CircularProgressChart = ({ 
  value, 
  total, 
  label, 
  color, 
  size = 120 
}: { 
  value: number; 
  total: number; 
  label: string; 
  color: string;
  size?: number;
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-500 ${color}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-500 mt-1">Total</div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-sm font-semibold text-gray-700">{label}</div>
      </div>
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ 
  data, 
  size = 200 
}: { 
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - 40) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const segmentLength = (percentage / 100) * circumference;
    const offset = circumference - currentOffset;
    currentOffset += segmentLength;
    
    return {
      ...item,
      percentage,
      offset,
      segmentLength
    };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth="30"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={segment.offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">{total}</div>
            <div className="text-sm text-gray-500">Rooms</div>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 w-full">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color.replace('text-', 'bg-')}`}></div>
              <span className="text-gray-700">{item.label}</span>
            </div>
            <span className="font-semibold text-gray-800">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Bar Chart Component
const BarChart = ({ 
  data 
}: { 
  data: Array<{ label: string; value: number; color: string }>;
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-700 font-medium">{item.label}</div>
          <div className="flex-1 relative">
            <div className="h-8 bg-gray-100 rounded-md overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-md transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              >
                {item.value > 0 && (
                  <span className="text-white text-xs font-semibold">{item.value}</span>
                )}
              </div>
            </div>
          </div>
          <div className="w-12 text-right text-sm font-semibold text-gray-800">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    // Arrival/Departure Metrics
    arrivals: { pending: 0, arrived: 0 },
    departures: { pending: 0, checkedOut: 0 },
    guestsInHouse: { adults: 0, children: 0 },
    
    // Room Status
    roomStatus: {
      vacant: 0,
      sold: 0,
      dayUse: 0,
      complimentary: 0,
      blocked: 0
    },
    
    // Housekeeping Status
    housekeeping: {
      clean: 0,
      hkAssign: 0,
      dirty: 0,
      block: 0
    },
    
    // Notifications
    notifications: {
      workOrder: 0,
      bookingInquiry: 0,
      paymentFailed: 0,
      overbooking: 0,
      guestPortal: 0,
      guestMessage: 0,
      cardVerificationFailed: 0,
      tasks: 0,
      review: 0
    },
    
    // Activity Feeds
    activities: [] as Array<{ type: string; message: string; time: Date }>,
    
    // Other Stats
    totalRooms: 0,
    totalBookings: 0,
    revenueThisMonth: 0,
    revenueTotal: 0,
    recentBookings: [] as Booking[]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bookings, contacts, enquiries, roomStatuses, rooms] = await Promise.all([
          getAllBookings(),
          getAllContactForms(),
          getAllBookingEnquiries(),
          getRoomStatuses(),
          getRooms()
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Calculate Arrivals
        const arrivalsPending = bookings.filter(b => {
          const checkIn = new Date(b.checkIn);
          checkIn.setHours(0, 0, 0, 0);
          return checkIn.getTime() === today.getTime() && b.status === 'confirmed';
        }).length;
        
        const arrivalsArrived = bookings.filter(b => {
          return b.status === 'checked_in';
        }).length;

        // Calculate Departures
        const departuresPending = bookings.filter(b => {
          const checkOut = new Date(b.checkOut);
          checkOut.setHours(0, 0, 0, 0);
          return checkOut.getTime() === today.getTime() && (b.status === 'confirmed' || b.status === 'checked_in');
        }).length;
        
        const departuresCheckedOut = bookings.filter(b => {
          return b.status === 'checked_out';
        }).length;

        // Calculate Guests In House
        const checkedInBookings = bookings.filter(b => b.status === 'checked_in');
        const adultsInHouse = checkedInBookings.reduce((sum, b) => sum + (b.guests?.adults || 0), 0);
        const childrenInHouse = checkedInBookings.reduce((sum, b) => sum + (b.guests?.children || 0), 0);

        // Calculate Room Status
        const totalRooms = rooms.length;
        const occupiedRooms = checkedInBookings.length;
        const reservedRooms = bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) > today).length;
        const vacantRooms = Math.max(0, totalRooms - occupiedRooms - reservedRooms);
        
        const roomStatusData = {
          vacant: vacantRooms,
          sold: occupiedRooms,
          dayUse: 0, // Can be calculated based on bookings
          complimentary: 0, // Can be calculated based on bookings
          blocked: roomStatuses.filter(rs => rs.status === 'maintenance').length
        };

        // Calculate Housekeeping Status
        const housekeepingData = {
          clean: roomStatuses.filter(rs => rs.housekeepingStatus === 'clean' || rs.housekeepingStatus === 'inspected').length,
          hkAssign: roomStatuses.filter(rs => rs.housekeepingStatus === 'needs_attention').length,
          dirty: roomStatuses.filter(rs => rs.housekeepingStatus === 'dirty').length,
          block: roomStatuses.filter(rs => rs.status === 'maintenance').length
        };

        // Calculate Revenue
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const revenueThisMonth = bookings
          .filter(b => {
            const created = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return created >= monthStart && (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out');
          })
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        
        const revenueTotal = bookings
          .filter(b => b.status !== 'cancelled')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Generate Activity Feeds
        const activities = [
          ...bookings.slice(0, 5).map(b => ({
            type: 'booking',
            message: `New booking from ${b.guestDetails?.firstName} ${b.guestDetails?.lastName}`,
            time: b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
          })),
          ...contacts.slice(0, 3).map(c => ({
            type: 'contact',
            message: `New contact form from ${c.name}`,
            time: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)
          }))
        ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);

        setDashboardData({
          arrivals: { pending: arrivalsPending, arrived: arrivalsArrived },
          departures: { pending: departuresPending, checkedOut: departuresCheckedOut },
          guestsInHouse: { adults: adultsInHouse, children: childrenInHouse },
          roomStatus: roomStatusData,
          housekeeping: housekeepingData,
          notifications: {
            workOrder: 0,
            bookingInquiry: enquiries.filter(e => e.status === 'new').length,
            paymentFailed: 0,
            overbooking: 0,
            guestPortal: 0,
            guestMessage: contacts.filter(c => c.status === 'new').length,
            cardVerificationFailed: 0,
            tasks: 0,
            review: 0
          },
          activities,
          totalRooms,
          totalBookings: bookings.length,
          revenueThisMonth,
          revenueTotal,
          recentBookings: bookings.slice(0, 5)
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const notificationItems = [
    { key: 'workOrder', label: 'Work Order', icon: ClipboardDocumentIcon, count: dashboardData.notifications.workOrder },
    { key: 'bookingInquiry', label: 'Booking Inquiry', icon: CalendarDaysIcon, count: dashboardData.notifications.bookingInquiry },
    { key: 'paymentFailed', label: 'Payment Failed', icon: CreditCardIcon, count: dashboardData.notifications.paymentFailed },
    { key: 'overbooking', label: 'Overbooking', icon: ExclamationTriangleIcon, count: dashboardData.notifications.overbooking },
    { key: 'guestPortal', label: 'Guest Portal', icon: PhoneIcon, count: dashboardData.notifications.guestPortal },
    { key: 'guestMessage', label: 'Guest Message', icon: ChatBubbleLeftRightIcon, count: dashboardData.notifications.guestMessage },
    { key: 'cardVerificationFailed', label: 'Card verification Failed', icon: CreditCardIcon, count: dashboardData.notifications.cardVerificationFailed },
    { key: 'tasks', label: 'Tasks', icon: CheckBadgeIcon, count: dashboardData.notifications.tasks },
    { key: 'review', label: 'Review', icon: CheckCircleIcon, count: dashboardData.notifications.review }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Hotel Management System - Central Control</p>
          </div>
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Arrival */}
        <div className="bg-white rounded p-6 border border-gray-200 shadow-sm">
          <div className="text-center mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Arrival</h3>
            <CircularProgressChart
              value={dashboardData.arrivals.pending + dashboardData.arrivals.arrived}
              total={dashboardData.arrivals.pending + dashboardData.arrivals.arrived}
              label=""
              color="text-blue-500"
              size={100}
            />
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Pending</span>
              </div>
              <span className="font-semibold text-gray-800">({dashboardData.arrivals.pending})</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">Arrived</span>
              </div>
              <span className="font-semibold text-gray-800">({dashboardData.arrivals.arrived})</span>
            </div>
          </div>
        </div>

        {/* Departure */}
        <div className="bg-white rounded p-6 border border-gray-200 shadow-sm">
          <div className="text-center mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Departure</h3>
            <CircularProgressChart
              value={dashboardData.departures.pending + dashboardData.departures.checkedOut}
              total={dashboardData.departures.pending + dashboardData.departures.checkedOut}
              label=""
              color="text-blue-500"
              size={100}
            />
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Pending</span>
              </div>
              <span className="font-semibold text-gray-800">({dashboardData.departures.pending})</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">Checked Out</span>
              </div>
              <span className="font-semibold text-gray-800">({dashboardData.departures.checkedOut})</span>
            </div>
          </div>
        </div>

        {/* Guest In House */}
        <div className="bg-white rounded p-6 border border-gray-200 shadow-sm">
          <div className="text-center mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Guest In House</h3>
            <CircularProgressChart
              value={dashboardData.guestsInHouse.adults + dashboardData.guestsInHouse.children}
              total={dashboardData.guestsInHouse.adults + dashboardData.guestsInHouse.children}
              label=""
              color="text-blue-500"
              size={100}
            />
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Adult</span>
              </div>
              <span className="font-semibold text-gray-800">({dashboardData.guestsInHouse.adults})</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">Child</span>
              </div>
              <span className="font-semibold text-gray-800">({dashboardData.guestsInHouse.children})</span>
            </div>
          </div>
        </div>

        {/* Room Status */}
        <div className="bg-white rounded p-6 border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Room Status</h3>
          <div className="flex items-center justify-center">
            <DonutChart
              data={[
                { label: 'Vacant', value: dashboardData.roomStatus.vacant, color: 'text-blue-500' },
                { label: 'Sold', value: dashboardData.roomStatus.sold, color: 'text-gray-500' },
                { label: 'Day Use', value: dashboardData.roomStatus.dayUse, color: 'text-green-500' },
                { label: 'Complimentary', value: dashboardData.roomStatus.complimentary, color: 'text-yellow-500' },
                { label: 'Blocked', value: dashboardData.roomStatus.blocked, color: 'text-red-500' }
              ]}
              size={180}
            />
          </div>
        </div>
      </div>

      {/* Housekeeping Status */}
      <div className="bg-white rounded p-6 border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Housekeeping Status</h3>
        <BarChart
          data={[
            { label: 'Clean', value: dashboardData.housekeeping.clean, color: 'bg-blue-500' },
            { label: 'HKAssign', value: dashboardData.housekeeping.hkAssign, color: 'bg-gray-500' },
            { label: 'Dirty', value: dashboardData.housekeeping.dirty, color: 'bg-orange-500' },
            { label: 'Block', value: dashboardData.housekeeping.block, color: 'bg-gray-500' }
          ]}
        />
      </div>

      {/* Notifications and Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="bg-white rounded p-6 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Notifications</h3>
          <div className="grid grid-cols-3 gap-4">
            {notificationItems.map((item) => (
              <button
                key={item.key}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <item.icon className="h-6 w-6 text-gray-400 group-hover:text-blue-500 mb-2" />
                <div className="text-2xl font-bold text-gray-800 group-hover:text-blue-600">{item.count}</div>
                <div className="text-xs text-gray-600 text-center mt-1 group-hover:text-blue-600">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feeds */}
        <div className="bg-white rounded p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Activity Feeds</h3>
            <div className="flex items-center gap-2">
              <select className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700">
                <option>All</option>
                <option>Bookings</option>
                <option>Contacts</option>
                <option>System</option>
              </select>
              <button className="p-1 hover:bg-gray-100 rounded">
                <ArrowPathIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {dashboardData.activities.length > 0 ? (
              dashboardData.activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    {activity.type === 'booking' ? (
                      <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <HomeIcon className="h-8 w-8" />
                </div>
                <p className="text-sm">No Data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Rooms</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{dashboardData.totalRooms}</p>
            </div>
            <BuildingOfficeIcon className="h-12 w-12 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Bookings</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{dashboardData.totalBookings}</p>
            </div>
            <CalendarDaysIcon className="h-12 w-12 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Revenue (Month)</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">${dashboardData.revenueThisMonth.toLocaleString()}</p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 text-orange-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">${dashboardData.revenueTotal.toLocaleString()}</p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
          <Link 
            href="/admin/bookings" 
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-200">
                <th className="py-3 pr-4 font-semibold">Booking ID</th>
                <th className="py-3 pr-4 font-semibold">Guest</th>
                <th className="py-3 pr-4 font-semibold">Check-in</th>
                <th className="py-3 pr-4 font-semibold">Check-out</th>
                <th className="py-3 pr-4 font-semibold">Amount</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentBookings.map((booking) => {
                const statusColors = {
                  confirmed: 'bg-green-100 text-green-800 border-green-200',
                  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  cancelled: 'bg-red-100 text-red-800 border-red-200',
                  checked_in: 'bg-blue-100 text-blue-800 border-blue-200',
                  checked_out: 'bg-gray-100 text-gray-800 border-gray-200'
                };
                return (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-600">{booking.bookingId || booking.id.slice(0, 8)}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900">{booking.guestDetails?.firstName} {booking.guestDetails?.lastName}</div>
                      <div className="text-xs text-gray-500">{booking.guestDetails?.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{new Date(booking.checkIn).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-gray-700">{new Date(booking.checkOut).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 font-semibold text-gray-900">${booking.totalAmount?.toLocaleString() || 0}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {dashboardData.recentBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p>No bookings yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
