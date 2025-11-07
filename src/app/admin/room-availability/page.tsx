"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getAllBookings, getRoomTypes, Booking, SuiteType, RoomType } from '@/lib/firestoreService';
import { CalendarDaysIcon, CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon, FunnelIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const SUITE_TYPES: SuiteType[] = ['Garden Suite', 'Imperial Suite', 'Ocean Suite'];

// Helper function to check if two date ranges overlap
const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 < e2 && s2 < e1;
};

// Get all dates in a range
const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

interface DateAvailability {
  date: Date;
  suiteType: SuiteType;
  available: string[];
  booked: string[];
  total: number;
}

export default function RoomAvailabilityPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedSuite, setSelectedSuite] = useState<SuiteType | 'all'>('all');
  const [availabilityData, setAvailabilityData] = useState<DateAvailability[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'bars' | 'calendar' | 'list'>('bars');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<number>(30); // Days to show

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (bookings.length > 0 && roomTypes.length > 0) {
      calculateAvailability();
    }
  }, [bookings, roomTypes, selectedMonth, selectedSuite, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, allRoomTypes] = await Promise.all([
        getAllBookings(),
        Promise.all(SUITE_TYPES.map(suite => getRoomTypes(suite))).then(results => results.flat())
      ]);
      setBookings(bookingsData);
      setRoomTypes(allRoomTypes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailability = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + dateRange);
    const dates = getDatesInRange(today, endDate);

    const suitesToShow = selectedSuite === 'all' ? SUITE_TYPES : [selectedSuite];
    const data: DateAvailability[] = [];

    suitesToShow.forEach(suiteType => {
      const suiteRoomTypes = roomTypes.filter(rt => rt.suiteType === suiteType);
      const totalRooms = suiteRoomTypes.length;

      dates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        // Get bookings that overlap with this date
        const overlappingBookings = bookings.filter(booking => {
          if (booking.status === 'cancelled') return false;
          return datesOverlap(booking.checkIn, booking.checkOut, dateStr, nextDateStr);
        });

        // Track booked room types
        const bookedRoomTypes = new Set<string>();
        overlappingBookings.forEach(booking => {
          booking.rooms.forEach(room => {
            if (room.suiteType === suiteType && room.allocatedRoomType) {
              bookedRoomTypes.add(room.allocatedRoomType);
            }
          });
        });

        // Get available and booked room types
        const allRoomNames = suiteRoomTypes.map(rt => rt.roomName);
        const booked = Array.from(bookedRoomTypes);
        const available = allRoomNames.filter(name => !bookedRoomTypes.has(name));

        data.push({
          date: new Date(date),
          suiteType,
          available,
          booked,
          total: totalRooms
        });
      });
    });

    setAvailabilityData(data);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedMonth(newDate);
  };

  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getAvailabilityForDate = (day: number, suiteType: SuiteType) => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];

    return availabilityData.find(
      item =>
        item.date.toISOString().split('T')[0] === dateStr && item.suiteType === suiteType
    );
  };

  // Filtered data based on search
  const filteredAvailability = useMemo(() => {
    if (!searchQuery.trim()) return availabilityData;

    const query = searchQuery.toLowerCase();
    return availabilityData.filter(item => {
      const dateStr = item.date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      const suiteMatch = item.suiteType.toLowerCase().includes(query);
      const dateMatch = dateStr.toLowerCase().includes(query);
      const roomMatch = [...item.available, ...item.booked].some(room => 
        room.toLowerCase().includes(query)
      );
      return suiteMatch || dateMatch || roomMatch;
    });
  }, [availabilityData, searchQuery]);

  // Get summary stats
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = availabilityData.filter(item => item.date >= today);
    const fullyBooked = upcoming.filter(item => item.available.length === 0 && item.booked.length > 0);
    const partiallyAvailable = upcoming.filter(item => item.available.length > 0 && item.available.length < item.total);
    const fullyAvailable = upcoming.filter(item => item.available.length === item.total);

    return {
      totalDates: upcoming.length,
      fullyBooked: fullyBooked.length,
      partiallyAvailable: partiallyAvailable.length,
      fullyAvailable: fullyAvailable.length
    };
  }, [availabilityData]);

  // Group data by suite for bar chart
  const groupedBySuite = useMemo(() => {
    const grouped: Record<SuiteType, DateAvailability[]> = {
      'Garden Suite': [],
      'Imperial Suite': [],
      'Ocean Suite': []
    };

    filteredAvailability.forEach(item => {
      if (grouped[item.suiteType]) {
        grouped[item.suiteType].push(item);
      }
    });

    // Sort by date
    Object.keys(grouped).forEach(suite => {
      grouped[suite as SuiteType].sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    return grouped;
  }, [filteredAvailability]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const suitesToShow = selectedSuite === 'all' ? SUITE_TYPES : [selectedSuite];
  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Room Availability Dashboard</h1>
            <p className="mt-2 text-[#202c3b]/70 text-lg">
              Advanced visual management of room type availability
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('bars')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'bars'
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-white text-[#202c3b] border border-[#be8c53]/20 hover:bg-[#FF6A00]/10'
              }`}
            >
              <ChartBarIcon className="h-5 w-5" />
              Bar Chart
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-white text-[#202c3b] border border-[#be8c53]/20 hover:bg-[#FF6A00]/10'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-white text-[#202c3b] border border-[#be8c53]/20 hover:bg-[#FF6A00]/10'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-[#be8c53]/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#202c3b]/70">Total Dates</p>
              <p className="text-2xl font-bold text-[#202c3b]">{summaryStats.totalDates}</p>
            </div>
            <CalendarDaysIcon className="h-8 w-8 text-[#FF6A00]/30" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#202c3b]/70">Fully Available</p>
              <p className="text-2xl font-bold text-green-700">{summaryStats.fullyAvailable}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500/30" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-yellow-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#202c3b]/70">Partially Booked</p>
              <p className="text-2xl font-bold text-yellow-700">{summaryStats.partiallyAvailable}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-yellow-500/30 flex items-center justify-center">
              <span className="text-yellow-700 font-bold text-sm">!</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-red-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#202c3b]/70">Fully Booked</p>
              <p className="text-2xl font-bold text-red-700">{summaryStats.fullyBooked}</p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-500/30" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-lg border border-[#be8c53]/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#202c3b]/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by date, suite, or room type..."
              className="w-full pl-10 pr-4 py-2 border border-[#be8c53]/20 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] text-[#202c3b]"
            />
          </div>
          <div className="flex items-center gap-3">
            <FunnelIcon className="h-5 w-5 text-[#202c3b]/50" />
            <select
              value={selectedSuite}
              onChange={(e) => setSelectedSuite(e.target.value as SuiteType | 'all')}
              className="border border-[#be8c53]/20 rounded-lg px-4 py-2 text-[#202c3b] focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00]"
            >
              <option value="all">All Suites</option>
              {SUITE_TYPES.map(suite => (
                <option key={suite} value={suite}>{suite}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#202c3b]/70 whitespace-nowrap">Days:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="border border-[#be8c53]/20 rounded-lg px-3 py-2 text-[#202c3b] focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00]"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'bars' ? (
        /* Advanced Bar Chart View */
        <div className="space-y-6">
          {suitesToShow.map(suiteType => {
            const suiteData = groupedBySuite[suiteType] || [];
            const suiteRoomTypes = roomTypes.filter(rt => rt.suiteType === suiteType);
            const totalRooms = suiteRoomTypes.length;
            const maxAvailable = Math.max(...suiteData.map(d => d.available.length), 1);
            const fullyBookedCount = suiteData.filter(d => d.available.length === 0 && d.booked.length > 0).length;
            const availableCount = suiteData.filter(d => d.available.length > 0).length;

            return (
              <div key={suiteType} className="bg-white rounded-xl shadow-lg border border-[#be8c53]/20 overflow-hidden">
                {/* Suite Header */}
                <div className="bg-gradient-to-r from-white to-[#FFFCF6] px-6 py-4 border-b border-[#be8c53]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[#202c3b]">{suiteType}</h2>
                      <p className="text-sm text-[#202c3b]/70 mt-1">
                        Total: {totalRooms} Room Types
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                          {availableCount} Available Days
                        </div>
                        <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold mt-2">
                          {fullyBookedCount} Full Days
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="p-6">
                  <div className="space-y-2">
                    {suiteData.map((item, idx) => {
                      const dateStr = item.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });
                      const availablePercent = (item.available.length / item.total) * 100;
                      const bookedPercent = (item.booked.length / item.total) * 100;
                      const isFullyBooked = item.available.length === 0 && item.booked.length > 0;
                      const isPartiallyBooked = item.available.length > 0 && item.booked.length > 0;
                      const isToday = item.date.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedDate(item.date)}
                          className={`group cursor-pointer transition-all hover:shadow-md rounded-lg p-2 ${
                            isToday ? 'bg-[#FF6A00]/5 border-2 border-[#FF6A00]' : 'bg-gray-50 border border-gray-200 hover:border-[#FF6A00]/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Date Label */}
                            <div className="w-24 flex-shrink-0">
                              <div className="text-xs font-semibold text-[#202c3b]">
                                {dateStr}
                              </div>
                              <div className="text-[10px] text-[#202c3b]/60 mt-0.5">
                                {item.date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              {isToday && (
                                <div className="text-[9px] text-[#FF6A00] font-bold mt-0.5">TODAY</div>
                              )}
                            </div>

                            {/* Bar Chart */}
                            <div className="flex-1 relative">
                              <div className="flex items-center gap-1 h-10">
                                {/* Available Bar */}
                                {item.available.length > 0 && (
                                  <div
                                    className="bg-gradient-to-r from-green-400 to-green-500 rounded-l-lg h-full flex items-center justify-center transition-all group-hover:from-green-500 group-hover:to-green-600"
                                    style={{ width: `${availablePercent}%` }}
                                  >
                                    <span className="text-white text-xs font-bold px-1">
                                      {item.available.length}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Booked Bar */}
                                {item.booked.length > 0 && (
                                  <div
                                    className={`h-full flex items-center justify-center transition-all ${
                                      isFullyBooked
                                        ? 'bg-gradient-to-r from-red-400 to-red-500 rounded-lg group-hover:from-red-500 group-hover:to-red-600'
                                        : 'bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-r-lg group-hover:from-yellow-500 group-hover:to-yellow-600'
                                    }`}
                                    style={{ width: `${bookedPercent}%` }}
                                  >
                                    <span className="text-white text-xs font-bold px-1">
                                      {item.booked.length}
                                    </span>
                                  </div>
                                )}

                                {/* Empty space if no bookings */}
                                {item.available.length === item.total && (
                                  <div className="flex-1"></div>
                                )}
                              </div>
                              
                              {/* Status Indicator */}
                              <div className="mt-1 flex items-center gap-2">
                                {isFullyBooked && (
                                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                                    FULLY BOOKED
                                  </span>
                                )}
                                {isPartiallyBooked && (
                                  <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
                                    PARTIAL
                                  </span>
                                )}
                                {item.available.length === item.total && (
                                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                                    FULLY AVAILABLE
                                  </span>
                                )}
                                <span className="text-[10px] text-[#202c3b]/60">
                                  {item.available.length}/{item.total} Available
                                </span>
                              </div>
                            </div>

                            {/* Room Types Quick View */}
                            <div className="w-48 flex-shrink-0 text-right">
                              <div className="flex flex-wrap gap-1 justify-end">
                                {item.available.slice(0, 2).map((room, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] rounded font-medium"
                                  >
                                    {room}
                                  </span>
                                ))}
                                {item.available.length > 2 && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] rounded font-medium">
                                    +{item.available.length - 2}
                                  </span>
                                )}
                                {item.booked.length > 0 && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] rounded font-medium">
                                    {item.booked.length} Booked
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {suiteData.length === 0 && (
                    <div className="text-center py-12 text-[#202c3b]/60">
                      <CalendarDaysIcon className="h-12 w-12 mx-auto mb-2 text-[#be8c53]/30" />
                      <p>No availability data for selected period</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'calendar' ? (
        /* Compact Calendar View */
        <div className="space-y-4">
          {suitesToShow.map(suiteType => {
            const suiteRoomTypes = roomTypes.filter(rt => rt.suiteType === suiteType);
            const totalRooms = suiteRoomTypes.length;

            return (
              <div key={suiteType} className="bg-white rounded-xl shadow-lg border border-[#be8c53]/20 overflow-hidden">
                <div className="bg-gradient-to-r from-white to-[#FFFCF6] px-4 py-3 border-b border-[#be8c53]/20 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#202c3b]">{suiteType}</h2>
                    <p className="text-xs text-[#202c3b]/70">
                      {totalRooms} Room Types | 
                      <span className="ml-2 text-green-600 font-semibold">Available</span> | 
                      <span className="ml-2 text-red-600 font-semibold">Booked</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {availabilityData.filter(a => a.suiteType === suiteType && a.available.length > 0).length} Available Days
                    </div>
                    <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                      {availabilityData.filter(a => a.suiteType === suiteType && a.available.length === 0 && a.booked.length > 0).length} Full Days
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <div key={`day-${index}`} className="text-center text-xs font-semibold text-[#202c3b]/70 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const availability = getAvailabilityForDate(day, suiteType);
                      const availableCount = availability?.available.length || 0;
                      const bookedCount = availability?.booked.length || 0;
                      const isFullyBooked = availableCount === 0 && bookedCount > 0;
                      const isPartiallyBooked = availableCount > 0 && bookedCount > 0;
                      const isFullyAvailable = availableCount === totalRooms;
                      const isToday = new Date().toDateString() === new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day).toDateString();
                      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);

                      return (
                        <div
                          key={day}
                          onClick={() => setSelectedDate(date)}
                          className={`aspect-square border-2 rounded-lg p-1 cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                            isToday
                              ? 'border-[#FF6A00] bg-[#FF6A00]/10 ring-2 ring-[#FF6A00]/30'
                              : isFullyBooked
                              ? 'border-red-400 bg-red-100 hover:bg-red-200'
                              : isPartiallyBooked
                              ? 'border-yellow-400 bg-yellow-100 hover:bg-yellow-200'
                              : isFullyAvailable
                              ? 'border-green-400 bg-green-100 hover:bg-green-200'
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-[#202c3b] mb-0.5">{day}</div>
                          <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            <CheckCircleIcon className={`h-2.5 w-2.5 ${availableCount > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`text-[9px] font-bold ${availableCount > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                              {availableCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-0.5">
                            <XCircleIcon className={`h-2.5 w-2.5 ${bookedCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                            <span className={`text-[9px] font-bold ${bookedCount > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                              {bookedCount}
                            </span>
                          </div>
                          {isFullyBooked && (
                            <div className="text-[7px] text-red-700 font-bold mt-0.5 text-center">FULL</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View with Room Names as Columns */
        <div className="bg-white rounded-xl shadow-lg border border-[#be8c53]/20 overflow-hidden">
          <div className="p-4 border-b border-[#be8c53]/20 bg-gradient-to-r from-white to-[#FFFCF6]">
            <h2 className="text-lg font-bold text-[#202c3b]">Availability List</h2>
            <p className="text-xs text-[#202c3b]/70 mt-1">
              Showing {filteredAvailability.length} date entries
            </p>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {(() => {
              // Group data by date
              const groupedByDate = filteredAvailability
                .filter(item => {
                  const itemDate = item.date.toISOString().split('T')[0];
                  const today = new Date().toISOString().split('T')[0];
                  return itemDate >= today;
                })
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .reduce((acc, item) => {
                  const dateKey = item.date.toISOString().split('T')[0];
                  if (!acc[dateKey]) {
                    acc[dateKey] = {
                      date: item.date,
                      suites: {}
                    };
                  }
                  acc[dateKey].suites[item.suiteType] = item;
                  return acc;
                }, {} as Record<string, { date: Date; suites: Partial<Record<SuiteType, DateAvailability>> }>);

              const dates = Object.values(groupedByDate);
              
              // Get all room types for each suite
              const suiteRoomTypes: Record<SuiteType, string[]> = {
                'Garden Suite': roomTypes.filter(rt => rt.suiteType === 'Garden Suite').map(rt => rt.roomName),
                'Imperial Suite': roomTypes.filter(rt => rt.suiteType === 'Imperial Suite').map(rt => rt.roomName),
                'Ocean Suite': roomTypes.filter(rt => rt.suiteType === 'Ocean Suite').map(rt => rt.roomName)
              };

              return (
                <div className="p-4">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr>
                        <th className="border border-[#be8c53]/20 p-2 text-left text-xs font-bold text-[#202c3b] bg-[#FFFCF6] sticky left-0 z-20">
                          Date
                        </th>
                        {SUITE_TYPES.map(suiteType => (
                          <th key={suiteType} colSpan={suiteRoomTypes[suiteType].length} className="border border-[#be8c53]/20 p-2 text-center text-xs font-bold text-[#202c3b] bg-[#FFFCF6]">
                            {suiteType}
                          </th>
                        ))}
                      </tr>
                      <tr>
                        <th className="border border-[#be8c53]/20 p-1 text-left text-[10px] font-semibold text-[#202c3b]/70 bg-[#FFFCF6] sticky left-0 z-20">
                          Room Types
                        </th>
                        {SUITE_TYPES.map(suiteType => 
                          suiteRoomTypes[suiteType].map((roomName, idx) => (
                            <th 
                              key={`${suiteType}-${roomName}`}
                              className="border border-[#be8c53]/20 p-1 text-center text-[10px] font-semibold text-[#202c3b]/70 bg-gray-50 min-w-[80px]"
                            >
                              {roomName}
                            </th>
                          ))
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {dates.map((dateGroup, dateIdx) => {
                        const dateStr = dateGroup.date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        const isToday = dateGroup.date.toDateString() === new Date().toDateString();

                        return (
                          <tr
                            key={dateIdx}
                            onClick={() => setSelectedDate(dateGroup.date)}
                            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                              isToday ? 'bg-[#FF6A00]/5' : ''
                            }`}
                          >
                            <td className={`border border-[#be8c53]/20 p-2 text-xs font-semibold text-[#202c3b] sticky left-0 z-10 ${
                              isToday ? 'bg-[#FF6A00]/5' : 'bg-white'
                            }`}>
                              <div>{dateStr}</div>
                              {isToday && (
                                <div className="text-[9px] text-[#FF6A00] font-bold mt-0.5">TODAY</div>
                              )}
                            </td>
                            {SUITE_TYPES.map(suiteType => {
                              const suiteData = dateGroup.suites[suiteType];
                              if (!suiteData) {
                                return suiteRoomTypes[suiteType].map((_, idx) => (
                                  <td key={`${suiteType}-${idx}`} className="border border-[#be8c53]/20 p-1 text-center">
                                    <div className="text-[10px] text-gray-400">-</div>
                                  </td>
                                ));
                              }

                              return suiteRoomTypes[suiteType].map((roomName, idx) => {
                                const isAvailable = suiteData.available.includes(roomName);
                                const isBooked = suiteData.booked.includes(roomName);
                                
                                return (
                                  <td 
                                    key={`${suiteType}-${roomName}-${idx}`}
                                    className={`border border-[#be8c53]/20 p-1 text-center ${
                                      isBooked
                                        ? 'bg-red-50'
                                        : isAvailable
                                        ? 'bg-green-50'
                                        : 'bg-gray-50'
                                    }`}
                                  >
                                    {isBooked ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <XCircleIcon className="h-4 w-4 text-red-600" />
                                        <span className="text-[9px] font-semibold text-red-700">Booked</span>
                                      </div>
                                    ) : isAvailable ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                        <span className="text-[9px] font-semibold text-green-700">Available</span>
                                      </div>
                                    ) : (
                                      <div className="text-[9px] text-gray-400">-</div>
                                    )}
                                  </td>
                                );
                              });
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Date Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedDate(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-white to-[#FFFCF6] border-b border-[#be8c53]/20 text-[#202c3b] p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#202c3b]">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-[#202c3b]/70 hover:text-[#FF6A00] transition-colors">
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUITE_TYPES.map(suiteType => {
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  const nextDate = new Date(selectedDate);
                  nextDate.setDate(nextDate.getDate() + 1);
                  const nextDateStr = nextDate.toISOString().split('T')[0];

                  const suiteRoomTypes = roomTypes.filter(rt => rt.suiteType === suiteType);
                  const overlappingBookings = bookings.filter(booking => {
                    if (booking.status === 'cancelled') return false;
                    return datesOverlap(booking.checkIn, booking.checkOut, dateStr, nextDateStr);
                  });

                  const bookedRoomTypes = new Set<string>();
                  overlappingBookings.forEach(booking => {
                    booking.rooms.forEach(room => {
                      if (room.suiteType === suiteType && room.allocatedRoomType) {
                        bookedRoomTypes.add(room.allocatedRoomType);
                      }
                    });
                  });

                  const allRoomNames = suiteRoomTypes.map(rt => rt.roomName);
                  const booked = Array.from(bookedRoomTypes);
                  const available = allRoomNames.filter(name => !bookedRoomTypes.has(name));
                  const isFullyBooked = available.length === 0 && booked.length > 0;

                  return (
                    <div
                      key={suiteType}
                      className={`p-4 rounded-lg border-2 ${
                        isFullyBooked
                          ? 'border-red-300 bg-red-50'
                          : available.length > 0
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <h4 className="font-bold text-[#202c3b] mb-3">{suiteType}</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-green-700 mb-1">
                            Available ({available.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {available.length > 0 ? (
                              available.map((room, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium"
                                >
                                  {room}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">None available</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            Booked ({booked.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {booked.length > 0 ? (
                              booked.map((room, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium"
                                >
                                  {room}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">None booked</span>
                            )}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-[#202c3b]/70">
                            Total: <span className="font-semibold">{suiteRoomTypes.length}</span> | 
                            Available: <span className="font-semibold text-green-700">{available.length}</span> | 
                            Booked: <span className="font-semibold text-red-700">{booked.length}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-lg border border-[#be8c53]/20 p-4">
        <h3 className="text-sm font-semibold text-[#202c3b] mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-400 bg-green-100 rounded"></div>
            <span className="text-[#202c3b]">Fully Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-yellow-400 bg-yellow-100 rounded"></div>
            <span className="text-[#202c3b]">Partially Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-red-400 bg-red-100 rounded"></div>
            <span className="text-[#202c3b]">Fully Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#FF6A00] bg-[#FF6A00]/10 rounded ring-2 ring-[#FF6A00]/30"></div>
            <span className="text-[#202c3b]">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
