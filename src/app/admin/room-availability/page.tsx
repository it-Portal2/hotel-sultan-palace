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
  const [selectedSuite, setSelectedSuite] = useState<SuiteType | 'all'>('all');
  const [availabilityData, setAvailabilityData] = useState<DateAvailability[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'bars' | 'list'>('bars');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<number>(30); // Days to show

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (bookings.length > 0 && roomTypes.length > 0) {
      calculateAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, roomTypes, selectedSuite, dateRange]);

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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
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

      {/* Compact Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-white to-[#FFFCF6] rounded-lg p-3 border-l-4 border-[#FF6A00] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#202c3b]/70 uppercase tracking-wide">Total Dates</p>
              <p className="text-xl font-bold text-[#202c3b] mt-0.5">{summaryStats.totalDates}</p>
            </div>
            <CalendarDaysIcon className="h-6 w-6 text-[#FF6A00]/40" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-3 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#202c3b]/70 uppercase tracking-wide">Fully Available</p>
              <p className="text-xl font-bold text-green-700 mt-0.5">{summaryStats.fullyAvailable}</p>
            </div>
            <CheckCircleIcon className="h-6 w-6 text-green-500/40" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg p-3 border-l-4 border-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#202c3b]/70 uppercase tracking-wide">Partially Booked</p>
              <p className="text-xl font-bold text-yellow-700 mt-0.5">{summaryStats.partiallyAvailable}</p>
            </div>
            <div className="h-6 w-6 rounded-full bg-yellow-500/30 flex items-center justify-center">
              <span className="text-yellow-700 font-bold text-xs">!</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-white rounded-lg p-3 border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#202c3b]/70 uppercase tracking-wide">Fully Booked</p>
              <p className="text-xl font-bold text-red-700 mt-0.5">{summaryStats.fullyBooked}</p>
            </div>
            <XCircleIcon className="h-6 w-6 text-red-500/40" />
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
        /* Enhanced Bar Chart - All Suites Together by Date */
        <div className="bg-white rounded-xl shadow-lg border border-[#be8c53]/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF6A00]/5 via-white to-[#FFFCF6] px-4 py-3 border-b border-[#be8c53]/20">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#202c3b]">Availability Overview</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">Available</span>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-semibold">Partial</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">Full</span>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="px-4 py-2 bg-gray-50 border-b border-[#be8c53]/20 grid gap-2 text-xs font-semibold text-[#202c3b]/70" style={{ gridTemplateColumns: '100px repeat(3, 1fr)' }}>
            <div>Date</div>
            {SUITE_TYPES.map(suite => {
              const suiteRoomTypes = roomTypes.filter(rt => rt.suiteType === suite);
              return (
                <div key={suite} className="text-center">
                  <div className="font-bold text-[#202c3b]">{suite}</div>
                  <div className="text-[10px] font-normal text-[#202c3b]/60">Total: {suiteRoomTypes.length}</div>
                </div>
              );
            })}
          </div>

          {/* Compact List View - All Suites Together */}
          <div className="divide-y divide-gray-100">
            {(() => {
              // Group by date
              const datesMap = new Map<string, DateAvailability[]>();
              filteredAvailability.forEach(item => {
                const dateKey = item.date.toISOString().split('T')[0];
                if (!datesMap.has(dateKey)) {
                  datesMap.set(dateKey, []);
                }
                datesMap.get(dateKey)!.push(item);
              });

              const sortedDates = Array.from(datesMap.keys()).sort();
              
              return sortedDates.map((dateKey) => {
                const dateItems = datesMap.get(dateKey)!;
                const firstItem = dateItems[0];
                const date = firstItem.date;
                const isToday = date.toDateString() === new Date().toDateString();
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDate(date)}
                    className={`group cursor-pointer transition-all hover:bg-gray-50/50 px-4 py-2 ${
                      isToday ? 'bg-[#FF6A00]/5 border-l-4 border-[#FF6A00]' : ''
                    }`}
                  >
                    <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '100px repeat(3, 1fr)' }}>
                      {/* Date Column */}
                      <div className="flex-shrink-0">
                        <div className="text-[11px] font-bold text-[#202c3b] leading-tight">
                          {dateStr}
                        </div>
                        <div className="text-[9px] text-[#202c3b]/60 mt-0.5">
                          {dayName}
                        </div>
                        {isToday && (
                          <div className="text-[8px] text-[#FF6A00] font-bold mt-0.5">TODAY</div>
                        )}
                      </div>

                      {/* Suite Bars - All 3 Together */}
                      {SUITE_TYPES.map(suiteType => {
                        const item = dateItems.find(d => d.suiteType === suiteType);
                        if (!item) {
                          return (
                            <div key={suiteType} className="text-center text-[10px] text-gray-400">
                              -
                            </div>
                          );
                        }

                        const suiteRoomTypes = roomTypes.filter(rt => rt.suiteType === suiteType);
                        const totalRooms = suiteRoomTypes.length;
                        const availablePercent = totalRooms > 0 ? (item.available.length / totalRooms) * 100 : 0;
                        const bookedPercent = totalRooms > 0 ? (item.booked.length / totalRooms) * 100 : 0;
                        const isFullyBooked = item.available.length === 0 && item.booked.length > 0;
                        const isPartiallyBooked = item.available.length > 0 && item.booked.length > 0;
                        const occupancy = totalRooms > 0 ? Math.round((item.booked.length / totalRooms) * 100) : 0;

                        return (
                          <div key={suiteType} className="flex flex-col gap-1">
                            {/* Thin Bar */}
                            <div className="flex items-center gap-0.5 h-5 rounded overflow-hidden shadow-sm">
                              {/* Available Bar */}
                              {item.available.length > 0 && (
                                <div
                                  className="bg-gradient-to-r from-green-500 to-green-400 h-full flex items-center justify-center transition-all group-hover:shadow-md relative overflow-hidden"
                                  style={{ width: `${availablePercent}%`, minWidth: item.available.length > 0 ? '20px' : '0' }}
                                  title={`${item.available.length} Available`}
                                >
                                  <span className="text-white text-[9px] font-bold px-0.5 relative z-10 drop-shadow-sm">
                                    {item.available.length}
                                  </span>
                                </div>
                              )}
                              
                              {/* Booked Bar */}
                              {item.booked.length > 0 && (
                                <div
                                  className={`h-full flex items-center justify-center transition-all group-hover:shadow-md relative overflow-hidden ${
                                    isFullyBooked
                                      ? 'bg-gradient-to-r from-red-600 to-red-500'
                                      : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                  }`}
                                  style={{ width: `${bookedPercent}%`, minWidth: item.booked.length > 0 ? '20px' : '0' }}
                                  title={`${item.booked.length} Booked`}
                                >
                                  <span className="text-white text-[9px] font-bold px-0.5 relative z-10 drop-shadow-sm">
                                    {item.booked.length}
                                  </span>
                                </div>
                              )}

                              {/* Empty */}
                              {item.available.length === totalRooms && (
                                <div className="flex-1 bg-gray-100"></div>
                              )}
                            </div>
                            
                            {/* Status Badge */}
                            <div className="flex items-center justify-center gap-1">
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                                isFullyBooked
                                  ? 'text-red-700 bg-red-100'
                                  : isPartiallyBooked
                                  ? 'text-yellow-700 bg-yellow-100'
                                  : 'text-green-700 bg-green-100'
                              }`}>
                                {isFullyBooked ? 'FULL' : isPartiallyBooked ? `${occupancy}%` : 'OPEN'}
                              </span>
                              <span className="text-[8px] text-[#202c3b]/60">
                                {item.available.length}/{totalRooms}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {filteredAvailability.length === 0 && (
            <div className="text-center py-8 text-[#202c3b]/60">
              <CalendarDaysIcon className="h-10 w-10 mx-auto mb-2 text-[#be8c53]/30" />
              <p className="text-sm">No availability data for selected period</p>
            </div>
          )}
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
                          suiteRoomTypes[suiteType].map((roomName) => (
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
                                return suiteRoomTypes[suiteType].map((roomName, roomIdx) => (
                                  <td key={`${suiteType}-${roomName}-${roomIdx}`} className="border border-[#be8c53]/20 p-1 text-center">
                                    <div className="text-[10px] text-gray-400">-</div>
                                  </td>
                                ));
                              }

                              return suiteRoomTypes[suiteType].map((roomName, roomIdx) => {
                                const isAvailable = suiteData.available.includes(roomName);
                                const isBooked = suiteData.booked.includes(roomName);
                                
                                return (
                                  <td 
                                    key={`${suiteType}-${roomName}-${roomIdx}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer" onClick={() => setSelectedDate(null)}>
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
