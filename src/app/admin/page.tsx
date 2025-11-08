"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon, 
  PlusIcon, 
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { 
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  PlusIcon as PlusIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid';
import { getRooms, getAddOns, getAllBookings, Booking, getAllContactForms, getAllBookingEnquiries } from '@/lib/firestoreService';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalAddOns: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    revenueThisMonth: 0,
    revenueTotal: 0,
    totalContacts: 0,
    totalEnquiries: 0,
    loading: true
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [trend, setTrend] = useState<number[]>([]);
  const [trendData, setTrendData] = useState<Array<{date: Date, count: number, dayName: string, dayInitial: string, dateStr: string}>>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [rooms, addOns, bookings, contacts, enquiries] = await Promise.all([
          getRooms(),
          getAddOns(),
          getAllBookings(),
          getAllContactForms(),
          getAllBookingEnquiries()
        ]);

        // Revenue calculations
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const revenueThisMonth = bookings
          .filter(b => {
            const created = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return created >= monthStart && b.status === 'confirmed';
          })
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        
        const revenueTotal = bookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Booking status counts
        const pendingBookings = bookings.filter(b => b.status === 'pending').length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

        // Last 7 days trend by booking count with dates
        const days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          d.setHours(0,0,0,0);
          return d;
        });
        const counts = days.map((d) => {
          const next = new Date(d); 
          next.setDate(d.getDate() + 1);
          return bookings.filter(b => {
            const created = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return created >= d && created < next;
          }).length;
        });

        setStats({
          totalRooms: rooms.length,
          totalAddOns: addOns.length,
          totalBookings: bookings.length,
          pendingBookings,
          confirmedBookings,
          cancelledBookings,
          revenueThisMonth,
          revenueTotal,
          totalContacts: contacts.length,
          totalEnquiries: enquiries.length,
          loading: false
        });
        setRecentBookings(bookings.slice(0, 5));
        setTrend(counts);
        
        // Store trend data with dates
        const trendDataWithDates = days.map((day, i) => ({
          date: day,
          count: counts[i],
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()],
          dayInitial: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][day.getDay()],
          dateStr: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
        setTrendData(trendDataWithDates);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      name: 'Manage Rooms',
      description: 'Add, edit, or delete room listings',
      href: '/admin/rooms',
      icon: BuildingOfficeIconSolid,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      name: 'Manage Add-ons',
      description: 'Add, edit, or delete add-on services',
      href: '/admin/addons',
      icon: PlusIconSolid,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      name: 'View Bookings',
      description: 'Manage all reservations',
      href: '/admin/bookings',
      icon: CalendarDaysIcon,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
    },
    {
      name: 'Analytics',
      description: 'View detailed reports',
      href: '/admin/bookings',
      icon: ChartBarIconSolid,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700'
    }
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 md:p-8 border border-[#be8c53]/20 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Admin Dashboard</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-[#FF6A00] hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#FF6A00]/10 rounded-lg p-3">
                  <BuildingOfficeIcon className="h-6 w-6 text-[#FF6A00]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#202c3b]/70">Total Rooms</p>
                  <p className="text-2xl font-bold text-[#202c3b]">{stats.totalRooms}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-[#be8c53] hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#be8c53]/10 rounded-lg p-3">
                  <PlusIcon className="h-6 w-6 text-[#be8c53]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#202c3b]/70">Total Add-ons</p>
                  <p className="text-2xl font-bold text-[#202c3b]">{stats.totalAddOns}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-[#0a1a2b] hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#0a1a2b]/10 rounded-lg p-3">
                  <UsersIcon className="h-6 w-6 text-[#0a1a2b]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#202c3b]/70">Total Bookings</p>
                  <p className="text-2xl font-bold text-[#202c3b]">{stats.totalBookings}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-[#FF6A00] hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#FF6A00]/10 rounded-lg p-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-[#FF6A00]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#202c3b]/70">Revenue (Month)</p>
                  <p className="text-2xl font-bold text-[#202c3b]">${stats.revenueThisMonth.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-[#be8c53] hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-[#be8c53] mr-2" />
            <div>
              <p className="text-xs text-[#202c3b]/70">Pending</p>
              <p className="text-lg font-semibold text-[#202c3b]">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-[#FF6A00] hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-[#FF6A00] mr-2" />
            <div>
              <p className="text-xs text-[#202c3b]/70">Confirmed</p>
              <p className="text-lg font-semibold text-[#202c3b]">{stats.confirmedBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-red-500 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-xs text-[#202c3b]/70">Cancelled</p>
              <p className="text-lg font-semibold text-[#202c3b]">{stats.cancelledBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-[#0a1a2b] hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-[#0a1a2b] mr-2" />
            <div>
              <p className="text-xs text-[#202c3b]/70">Total Revenue</p>
              <p className="text-lg font-semibold text-[#202c3b]">${stats.revenueTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-[#be8c53] hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <UsersIcon className="h-5 w-5 text-[#be8c53] mr-2" />
            <div>
              <p className="text-xs text-[#202c3b]/70">Enquiries</p>
              <p className="text-lg font-semibold text-[#202c3b]">{stats.totalEnquiries}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-[#202c3b] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="relative group bg-gradient-to-br from-white to-[#FFFCF6] p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#FF6A00] rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-[#be8c53]/20 hover:border-[#FF6A00]/40"
            >
              <div className="flex items-center">
                <div className="bg-[#FF6A00]/10 rounded-lg p-3 group-hover:bg-[#FF6A00]/20 transition-colors">
                  <action.icon className="h-6 w-6 text-[#FF6A00]" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-base font-semibold text-[#202c3b] group-hover:text-[#FF6A00] transition-colors">
                    {action.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#202c3b]/70">
                    {action.description}
                  </p>
                </div>
              </div>
              <span
                className="absolute top-4 right-4 text-[#FF6A00]/30 group-hover:text-[#FF6A00] transition-colors"
                aria-hidden="true"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Analytics & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings trend chart */}
        <div className="bg-white shadow-lg rounded-xl p-6 lg:col-span-1 border border-[#be8c53]/10">
          <h3 className="text-lg font-semibold text-[#202c3b] mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 text-[#FF6A00] mr-2" />
            Bookings (Last 7 Days)
          </h3>
          <div className="flex items-end gap-2 h-48">
            {trendData.length > 0 ? trendData.map((item, i) => {
              const maxVal = Math.max(...trend, 1);
              const height = maxVal > 0 ? (item.count / maxVal) * 100 : 0;
              
              // Color gradient based on booking count
              const getBarColor = (count: number, max: number) => {
                if (max === 0) return 'from-gray-300 to-gray-400';
                const ratio = count / max;
                if (ratio >= 0.7) return 'from-[#FF6A00] to-[#FF8C42]'; // High - Orange
                if (ratio >= 0.4) return 'from-[#be8c53] to-[#d4a574]'; // Medium - Gold
                if (ratio > 0) return 'from-[#4CAF50] to-[#66BB6A]'; // Low - Green
                return 'from-gray-200 to-gray-300'; // Zero - Gray
              };
              
              const isToday = item.date.toDateString() === new Date().toDateString();
              
              return (
                <button
                  key={i}
                  className="flex-1 flex flex-col items-center focus:outline-none group relative"
                  onClick={() => {
                    const day = item.date.toISOString().slice(0,10);
                    router.push(`/admin/bookings?day=${day}`);
                  }}
                  title={`${item.count} booking${item.count !== 1 ? 's' : ''} on ${item.dayName}, ${item.dateStr}`}
                >
                  <div className="w-full relative group/bar">
                    <div 
                      className={`w-full bg-gradient-to-t ${getBarColor(item.count, maxVal)} rounded-t-md transition-all duration-300 group-hover/bar:shadow-lg group-hover/bar:scale-105 ${isToday ? 'ring-2 ring-[#FF6A00] ring-offset-2' : ''}`}
                      style={{ height: `${Math.max(8, height)}%`, minHeight: item.count > 0 ? '20px' : '8px' }}
                    />
                    {item.count > 0 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#202c3b] text-white text-xs font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {item.count}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col items-center w-full">
                    <span className={`text-xs font-semibold ${isToday ? 'text-[#FF6A00]' : 'text-[#202c3b]'}`}>
                      {item.dayInitial}
                    </span>
                    <span className="text-[10px] text-[#202c3b]/70 mt-1 font-medium">
                      {item.dateStr}
                    </span>
                    <span className={`text-xs font-bold mt-1 ${item.count > 0 ? 'text-[#FF6A00]' : 'text-[#202c3b]/40'}`}>
                      {item.count}
                    </span>
                  </div>
                </button>
              );
            }) : (
              <div className="w-full text-center py-8 text-[#202c3b]/60">
                <ChartBarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Loading booking data...</p>
              </div>
            )}
          </div>
          {trendData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#be8c53]/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#202c3b]/60">Total: <span className="font-semibold text-[#202c3b]">{trend.reduce((a, b) => a + b, 0)}</span></span>
                <span className="text-[#202c3b]/60">Avg: <span className="font-semibold text-[#202c3b]">{Math.round(trend.reduce((a, b) => a + b, 0) / 7 * 10) / 10}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Recent bookings table */}
        <div className="bg-white shadow-lg rounded-xl p-6 lg:col-span-2 overflow-hidden border border-[#be8c53]/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#202c3b] flex items-center">
              <CalendarDaysIcon className="h-5 w-5 text-[#FF6A00] mr-2" />
              Recent Bookings
            </h3>
            <Link href="/admin/bookings" className="text-sm font-medium text-[#FF6A00] hover:text-[#be8c53] flex items-center transition-colors">
              View all
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[#202c3b]/70 border-b border-[#be8c53]/20">
                  <th className="py-3 pr-4 font-semibold">Booking ID</th>
                  <th className="py-3 pr-4 font-semibold">Guest</th>
                  <th className="py-3 pr-4 font-semibold">Dates</th>
                  <th className="py-3 pr-4 font-semibold">Total</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => {
                  const statusColors = {
                    confirmed: 'bg-[#FF6A00]/10 text-[#FF6A00] border-[#FF6A00]/30',
                    pending: 'bg-[#be8c53]/10 text-[#be8c53] border-[#be8c53]/30',
                    cancelled: 'bg-red-100 text-red-800 border-red-200'
                  };
                  return (
                    <tr key={b.id} className="border-b border-[#be8c53]/10 hover:bg-[#FFFCF6] transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-[#202c3b]/70">{b.bookingId || b.id.slice(0,8)}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-[#202c3b]">{b.guestDetails?.firstName} {b.guestDetails?.lastName}</div>
                        <div className="text-xs text-[#202c3b]/60">{b.guestDetails?.email}</div>
                      </td>
                      <td className="py-3 pr-4 text-[#202c3b]/70">
                        <div className="text-xs">{new Date(b.checkIn).toLocaleDateString()}</div>
                        <div className="text-xs text-[#202c3b]/50">→ {new Date(b.checkOut).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-semibold text-[#202c3b]">${b.totalAmount?.toLocaleString() || 0}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[b.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentBookings.length===0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#202c3b]/60">
                      <CalendarDaysIcon className="h-12 w-12 text-[#be8c53]/30 mx-auto mb-2" />
                      <p>No bookings yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
