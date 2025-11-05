"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon, 
  PlusIcon, 
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { getRooms, getAddOns, getAllBookings, Booking } from '@/lib/firestoreService';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalAddOns: 0,
    totalBookings: 0,
    revenueThisMonth: 0,
    loading: true
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [trend, setTrend] = useState<number[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [rooms, addOns, bookings] = await Promise.all([
          getRooms(),
          getAddOns(),
          getAllBookings()
        ]);

        // Revenue this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const revenueThisMonth = bookings
          .filter(b => b.createdAt >= monthStart)
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Last 7 days trend by booking count
        const days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          d.setHours(0,0,0,0);
          return d;
        });
        const counts = days.map((d, idx) => {
          const next = new Date(d); next.setDate(d.getDate() + 1);
          return bookings.filter(b => b.createdAt >= d && b.createdAt < next).length;
        });

        setStats({
          totalRooms: rooms.length,
          totalAddOns: addOns.length,
          totalBookings: bookings.length,
          revenueThisMonth,
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
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Manage Add-ons',
      description: 'Add, edit, or delete add-on services',
      href: '/admin/addons',
      icon: PlusIcon,
      color: 'bg-green-500'
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
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your hotel booking system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Rooms</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalRooms}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlusIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Add-ons</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalAddOns}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenue (This Month)</dt>
                  <dd className="text-lg font-medium text-gray-900">${stats.revenueThisMonth}.00</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ${action.color} text-white`}>
                  <action.icon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                aria-hidden="true"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Analytics & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple bookings trend */}
        <div className="bg-white shadow rounded-lg p-5 lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings (last 7 days)</h3>
          <div className="flex items-end gap-2 h-32">
            {trend.map((v, i) => (
              <button
                key={i}
                className="flex-1 flex flex-col items-center focus:outline-none"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const day = d.toISOString().slice(0,10);
                  router.push(`/admin/bookings?day=${day}`);
                }}
                title="View bookings for this day"
              >
                <div className="w-full bg-gradient-to-t from-orange-200 to-orange-500 rounded-sm hover:opacity-80" style={{ height: `${Math.min(100, v * 22)}%` }} />
                <span className="mt-2 text-[10px] text-gray-500">{['S','M','T','W','T','F','S'][i]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent bookings table */}
        <div className="bg-white shadow rounded-lg p-5 lg:col-span-2 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
            <Link href="/admin/bookings" className="text-sm text-orange-600 hover:text-orange-700">View all</Link>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Booking ID</th>
                <th className="py-2 pr-4">Guest</th>
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4 font-mono text-xs">{b.bookingId || b.id.slice(0,8)}</td>
                  <td className="py-2 pr-4">{b.guestDetails?.firstName} {b.guestDetails?.lastName}</td>
                  <td className="py-2 pr-4">{new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">${b.totalAmount}.00</td>
                  <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded text-xs ${b.status==='confirmed'?'bg-green-100 text-green-700':b.status==='cancelled'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-800'}`}>{b.status}</span></td>
                </tr>
              ))}
              {recentBookings.length===0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">No bookings yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
