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

        // Last 7 days trend by booking count
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
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 text-lg">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Rooms</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <PlusIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Add-ons</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAddOns}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <UsersIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Revenue (Month)</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.revenueThisMonth.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-yellow-500">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-semibold text-gray-900">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-green-500">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Confirmed</p>
              <p className="text-lg font-semibold text-gray-900">{stats.confirmedBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-red-500">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Cancelled</p>
              <p className="text-lg font-semibold text-gray-900">{stats.cancelledBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-indigo-500">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900">${stats.revenueTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-4 border-t-4 border-teal-500">
          <div className="flex items-center">
            <UsersIcon className="h-5 w-5 text-teal-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Enquiries</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalEnquiries}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={`relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 ${action.color} ${action.hoverColor}`}
            >
              <div className="flex items-center">
                <div className="bg-white/20 rounded-lg p-3">
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-base font-semibold text-white">
                    {action.name}
                  </h3>
                  <p className="mt-1 text-sm text-white/90">
                    {action.description}
                  </p>
                </div>
              </div>
              <span
                className="absolute top-4 right-4 text-white/50 group-hover:text-white/80 transition-colors"
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
        <div className="bg-white shadow-lg rounded-xl p-6 lg:col-span-1 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 text-orange-500 mr-2" />
            Bookings (Last 7 Days)
          </h3>
          <div className="flex items-end gap-2 h-40">
            {trend.map((v, i) => {
              const maxVal = Math.max(...trend, 1);
              const height = maxVal > 0 ? (v / maxVal) * 100 : 0;
              return (
                <button
                  key={i}
                  className="flex-1 flex flex-col items-center focus:outline-none group"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const day = d.toISOString().slice(0,10);
                    router.push(`/admin/bookings?day=${day}`);
                  }}
                  title={`${v} bookings on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}`}
                >
                  <div className="w-full bg-gradient-to-t from-orange-400 via-orange-500 to-orange-600 rounded-t-md hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 transition-all group-hover:shadow-lg" style={{ height: `${Math.max(10, height)}%` }} />
                  <span className="mt-2 text-xs text-gray-600 font-medium">{['S','M','T','W','T','F','S'][i]}</span>
                  <span className="text-[10px] text-gray-400 mt-1">{v}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent bookings table */}
        <div className="bg-white shadow-lg rounded-xl p-6 lg:col-span-2 overflow-hidden border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 text-purple-500 mr-2" />
              Recent Bookings
            </h3>
            <Link href="/admin/bookings" className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center">
              View all
              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
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
                    confirmed: 'bg-green-100 text-green-800 border-green-200',
                    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    cancelled: 'bg-red-100 text-red-800 border-red-200'
                  };
                  return (
                    <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-gray-600">{b.bookingId || b.id.slice(0,8)}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-900">{b.guestDetails?.firstName} {b.guestDetails?.lastName}</div>
                        <div className="text-xs text-gray-500">{b.guestDetails?.email}</div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        <div className="text-xs">{new Date(b.checkIn).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">→ {new Date(b.checkOut).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-semibold text-gray-900">${b.totalAmount?.toLocaleString() || 0}</span>
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
                    <td colSpan={5} className="py-8 text-center text-gray-500">
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
    </div>
  );
}
