"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

import { getFBRevenue, getFBWeeklyRevenue, FBRevenue } from '@/lib/firestoreService';


type ViewType = 'overview' | 'revenue';
type TimeRange = 'hourly' | 'weekly';

export default function FBDashboardPage() {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('hourly');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [revenueData, setRevenueData] = useState<FBRevenue[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activeView]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeView === 'overview') {
        const date = new Date(selectedDate);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const data = await getFBRevenue(startOfDay, endOfDay);
        setRevenueData(data);
      } else {
        const year = new Date(selectedDate).getFullYear();
        const weekly = await getFBWeeklyRevenue(year);
        setWeeklyRevenue(weekly);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (activeView === 'overview' && revenueData.length > 0) {
      const dayData = revenueData[0];
      return {
        totalSales: dayData.totalSales || 0,
        totalPayment: dayData.totalPayment || 0,
        totalOrders: dayData.totalOrders || 0,
        totalDiscount: dayData.totalDiscount || 0,
        totalCustomers: dayData.totalCustomers || 0,
        totalVoid: dayData.totalVoid || 0,
        averageOrderValue: dayData.totalOrders > 0 ? dayData.totalSales / dayData.totalOrders : 0,
      };
    }
    return {
      totalSales: 0,
      totalPayment: 0,
      totalOrders: 0,
      totalDiscount: 0,
      totalCustomers: 0,
      totalVoid: 0,
      averageOrderValue: 0,
    };
  }, [revenueData, activeView]);

  const currentWeekRevenue = useMemo(() => {
    if (activeView === 'revenue' && weeklyRevenue.length > 0) {
      const currentWeek = weeklyRevenue[weeklyRevenue.length - 1];
      return currentWeek;
    }
    return null;
  }, [weeklyRevenue, activeView]);

  // Generate hourly data for graph (mock data for now)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i + 1);
    return hours.map(hour => ({
      hour: `${hour}h`,
      sales: Math.random() * 1000, // Mock data - replace with real data
    }));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 border-b-2 border-[#FF6A00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">


      {/* Header with Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-1 border-b border-gray-200">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeView === 'overview'
                ? 'text-[#1D69F9] border-b-2 border-[#1D69F9]'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('revenue')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeView === 'revenue'
                ? 'text-[#1D69F9] border-b-2 border-[#1D69F9]'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Revenue
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {activeView === 'overview' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeRange('hourly')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${timeRange === 'hourly'
                  ? 'bg-[#1D69F9] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Hourly
              </button>
              <button
                onClick={() => setTimeRange('weekly')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${timeRange === 'weekly'
                  ? 'bg-[#1D69F9] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Weekly
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D69F9] focus:border-[#1D69F9]"
            />
          </div>
        </div>
      </div>

      {activeView === 'overview' ? (
        <OverviewView stats={stats} hourlyData={hourlyData} />
      ) : (
        <RevenueView
          weeklyRevenue={weeklyRevenue}
          currentWeekRevenue={currentWeekRevenue}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      )}
    </div>
  );
}

function OverviewView({ stats, hourlyData }: { stats: any; hourlyData: any[] }) {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Sales</div>
          <div className="text-3xl font-bold text-[#1D69F9]">${stats.totalSales.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Payment</div>
          <div className="text-3xl font-bold text-blue-600">${stats.totalPayment.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Sales</div>
          <div className="text-xs text-gray-400">Graph placeholder</div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-red-600">{stats.totalOrders}</div>
          <div className="text-sm text-gray-600">Order</div>
          <div className="text-xs text-gray-400 mt-1">Avg. ${stats.averageOrderValue.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-blue-600">${stats.totalDiscount.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Discount</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</div>
          <div className="text-sm text-gray-600">Customers</div>
          <div className="text-xs text-gray-400 mt-1">Avg. ${stats.averageOrderValue.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-red-600">{stats.totalVoid.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Void</div>
        </div>
      </div>

      {/* Summary Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Order Type Summary', 'Online Orders', 'Top Selling Items', 'Outlet Sales', 'Payment Summary', 'Category Summary'].map((title) => (
          <div key={title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No record found!</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RevenueView({
  weeklyRevenue,
  currentWeekRevenue,
  selectedDate,
  setSelectedDate
}: {
  weeklyRevenue: any[];
  currentWeekRevenue: any;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const endStr = end.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Revenue Summary */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h2>
        {currentWeekRevenue ? (
          <>
            <div className="text-4xl font-bold text-[#1D69F9] mb-2">
              ${currentWeekRevenue.totalRevenue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              Week-{currentWeekRevenue.weekNumber}, {formatDateRange(
                currentWeekRevenue.startDate,
                currentWeekRevenue.endDate
              )}
            </div>
          </>
        ) : (
          <div className="text-2xl font-bold text-gray-400">$0.00</div>
        )}
      </div>

      {/* Center Panel - Revenue Graph */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Graph</h2>
          <div className="flex items-center gap-2">
            {['Weekly', 'Monthly', 'Yearly'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range.toLowerCase() as any)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${timeRange === range.toLowerCase()
                  ? 'bg-[#1D69F9] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">Revenue graph will be displayed here</p>
        </div>
      </div>

      {/* Right Panel - Weekly Revenue List */}
      <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Revenue</h2>
        {weeklyRevenue.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No record found!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weeklyRevenue.map((week, index) => (
              <div
                key={week.weekNumber}
                className={`p-4 rounded-lg border ${index === weeklyRevenue.length - 1
                  ? 'bg-[#1D69F9]/10 border-[#1D69F9]'
                  : 'bg-gray-50 border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      Week-{week.weekNumber} [{formatDateRange(week.startDate, week.endDate)}]
                    </div>
                  </div>
                  <div className="text-lg font-bold text-[#1D69F9]">
                    ${week.totalRevenue.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

