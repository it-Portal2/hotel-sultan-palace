"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getAllBookings, getRoomTypes, createBooking, getRooms, getRoomStatuses, Booking, SuiteType, RoomType, Room, RoomStatus } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { 
  CalendarDaysIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MagnifyingGlassIcon,

  UserIcon,

  XCircleIcon,
  XMarkIcon,

} from '@heroicons/react/24/outline';
import { FaBed, FaUserCheck, FaUserSlash } from 'react-icons/fa';

const SUITE_TYPES: SuiteType[] = ['Garden Suite', 'Imperial Suite', 'Ocean Suite'];

// Helper to normalize date to start of day (avoid timezone drift)
const normalizeDate = (value: string | Date) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper function to check if two date ranges overlap (currently unused but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = normalizeDate(start1).getTime();
  const e1 = normalizeDate(end1).getTime();
  const s2 = normalizeDate(start2).getTime();
  const e2 = normalizeDate(end2).getTime();
  return s1 < e2 && s2 < e1;
};

// Get all dates in a range
const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const calculateNights = (start: string | Date, end: string | Date) => {
  const s = normalizeDate(start);
  const e = normalizeDate(end);
  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
};

interface BookingBar {
  booking: Booking;
  startDate: Date;
  endDate: Date;
  roomName: string;
  suiteType: SuiteType;
}

export default function RoomAvailabilityPage() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysToShow] = useState(20);
  
  // Calculate suite prices from Rooms collection
  const suitePriceMap = useMemo(() => {
    const map: Record<SuiteType, number> = {
      'Garden Suite': 260,
      'Imperial Suite': 370,
      'Ocean Suite': 310
    };
    
    // Update prices from Rooms collection
    rooms.forEach(room => {
      if (room.type.toLowerCase().includes('garden')) {
        map['Garden Suite'] = room.price;
      } else if (room.type.toLowerCase().includes('imperial')) {
        map['Imperial Suite'] = room.price;
      } else if (room.type.toLowerCase().includes('ocean')) {
        map['Ocean Suite'] = room.price;
      }
    });
    
    return map;
  }, [rooms]);
  const [selectedSuite, setSelectedSuite] = useState<SuiteType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [showAssignRoom, setShowAssignRoom] = useState(false);
  const [assignRoomView, setAssignRoomView] = useState<'form' | 'calendar'>('form');
  const [hoveredDateIndex, setHoveredDateIndex] = useState<number | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [showCellPopup, setShowCellPopup] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{date: Date; suiteType: SuiteType; roomName: string} | null>(null);
  const [showMaintenanceBlock, setShowMaintenanceBlock] = useState(false);
  const [blockedRooms, setBlockedRooms] = useState<Record<string, {startDate: string; endDate: string; reason: string}[]>>({});
  const [assignRoomForm, setAssignRoomForm] = useState({
    startDate: '',
    endDate: '',
    suiteType: 'Garden Suite' as SuiteType,
    roomName: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestPrefix: '',
    guestAddress: '',
    guestCity: '',
    guestCountry: '',
    paymentMethod: '',
    paymentStatus: 'pending' as 'pending' | 'paid' | 'partial',
    paidAmount: 0,
    isWalkIn: false,
    reason: ''
  });
  const [maintenanceBlockForm, setMaintenanceBlockForm] = useState({
    startDate: '',
    endDate: '',
    suiteType: 'Garden Suite' as SuiteType,
    roomName: '',
    reason: '',
    customReason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, allRoomTypes, roomsData, statusesData] = await Promise.all([
        getAllBookings(),
        Promise.all(SUITE_TYPES.map(suite => getRoomTypes(suite))).then(results => results.flat()),
        getRooms(),
        getRoomStatuses()
      ]);
      setBookings(bookingsData);
      setRoomTypes(allRoomTypes);
      setRooms(roomsData);
      setRoomStatuses(statusesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate date range
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + daysToShow - 1);
    return { start, end, dates: getDatesInRange(start, end) };
  }, [currentDate, daysToShow]);

  // Group room types by suite
  const roomsBySuite = useMemo(() => {
    const grouped: Record<SuiteType, RoomType[]> = {
      'Garden Suite': [],
      'Imperial Suite': [],
      'Ocean Suite': []
    };
    roomTypes.forEach(rt => {
      if (rt.suiteType && grouped[rt.suiteType]) {
        grouped[rt.suiteType].push(rt);
      }
    });
    return grouped;
  }, [roomTypes]);

  // Calculate booking bars for each room
  const bookingBars = useMemo(() => {
    const bars: BookingBar[] = [];
    const isActiveStatus = (status?: string) => status && status !== 'cancelled';
    const activeBookings = bookings.filter(b => isActiveStatus(b.status));

    activeBookings.forEach(booking => {
      booking.rooms.forEach(room => {
        if (room.allocatedRoomType && room.suiteType) {
          const checkIn = normalizeDate(booking.checkIn);
          const checkOut = normalizeDate(booking.checkOut);
          bars.push({
            booking,
            startDate: checkIn,
            endDate: checkOut,
            roomName: room.allocatedRoomType,
            suiteType: room.suiteType
          });
        }
      });
    });

    return bars;
  }, [bookings]);

  // Create price map from Rooms collection (real prices)
  const roomPriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    
    // Assign suite prices to all rooms in that suite
    roomTypes.forEach(rt => {
      if (suitePriceMap[rt.suiteType]) {
        map[rt.roomName] = suitePriceMap[rt.suiteType];
      }
    });
    
    // Fallback: get prices from bookings if not in rooms
    bookings.forEach(b => {
      b.rooms.forEach(r => {
        const key = r.allocatedRoomType || r.type;
        if (key && typeof r.price === 'number' && !map[key]) {
          map[key] = r.price;
        }
      });
    });
    return map;
  }, [roomTypes, suitePriceMap, bookings]);

  // Calculate availability for each room and date
  const roomAvailability = useMemo(() => {
    const availability: Record<string, Record<string, { available: boolean; booking?: Booking; blocked?: boolean }>> = {};

    SUITE_TYPES.forEach(suiteType => {
      roomsBySuite[suiteType].forEach(room => {
        availability[room.roomName] = {};
        dateRange.dates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          const booking = bookingBars.find(bar => 
            bar.roomName === room.roomName &&
            date >= bar.startDate &&
            date < bar.endDate
          );
          
          // Check if room is blocked for this date
          const roomBlocks = blockedRooms[room.roomName] || [];
          const isBlocked = roomBlocks.some(block => {
            const blockStart = normalizeDate(block.startDate);
            const blockEnd = normalizeDate(block.endDate);
            return date >= blockStart && date < blockEnd;
          });
          
          availability[room.roomName][dateStr] = {
            available: !booking && !isBlocked,
            booking: booking?.booking,
            blocked: isBlocked
          };
        });
      });
    });

    return availability;
  }, [roomsBySuite, dateRange.dates, bookingBars, blockedRooms]);

  // Get room status by room name
  const getRoomStatus = (roomName: string): RoomStatus | undefined => {
    return roomStatuses.find(rs => rs.roomName === roomName);
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalRooms = roomTypes.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let vacant = 0;
    let occupied = 0;
    let reserved = 0;
    let blocked = 0;
    let dirty = 0;

    // Count dirty rooms from room statuses
    dirty = roomStatuses.filter(rs => rs.housekeepingStatus === 'dirty' || rs.housekeepingStatus === 'needs_attention').length;
    
    // Count blocked rooms
    blocked = Object.keys(blockedRooms).reduce((count, roomName) => {
      const blocks = blockedRooms[roomName] || [];
      const hasActiveBlock = blocks.some(block => {
        const blockStart = normalizeDate(block.startDate);
        const blockEnd = normalizeDate(block.endDate);
        return today >= blockStart && today < blockEnd;
      });
      return hasActiveBlock ? count + 1 : count;
    }, 0);

    dateRange.dates.forEach(date => {
      if (date.toDateString() === today.toDateString()) {
        SUITE_TYPES.forEach(suiteType => {
          roomsBySuite[suiteType].forEach(room => {
            const dateStr = date.toISOString().split('T')[0];
            const avail = roomAvailability[room.roomName]?.[dateStr];
            if (avail?.booking) {
              if (avail.booking.status === 'checked_in') {
                occupied++;
              } else {
                reserved++;
              }
            } else if (!avail?.blocked) {
              vacant++;
            }
          });
        });
      }
    });

    return { totalRooms: totalRooms || 15, vacant, occupied, reserved, blocked, dirty };
  }, [roomTypes.length, dateRange.dates, roomsBySuite, roomAvailability, roomStatuses, blockedRooms]);

  // Filter rooms based on search and suite selection
  const filteredRooms = useMemo(() => {
    let filtered: RoomType[] = [];
    
    const suitesToShow = selectedSuite === 'all' ? SUITE_TYPES : [selectedSuite];
    suitesToShow.forEach(suite => {
      filtered.push(...roomsBySuite[suite]);
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.roomName.toLowerCase().includes(query) ||
        room.suiteType.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [roomsBySuite, selectedSuite, searchQuery]);

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - daysToShow);
    } else {
      newDate.setDate(newDate.getDate() + daysToShow);
    }
    setCurrentDate(newDate);
  };

  // Handle booking bar click
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingPanel(true);
  };

  // Handle assign room
  const handleAssignRoom = async () => {
    if (!assignRoomForm.startDate || !assignRoomForm.endDate || !assignRoomForm.roomName || !assignRoomForm.guestName || !assignRoomForm.guestPhone) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    try {
      const start = new Date(assignRoomForm.startDate);
      const end = new Date(assignRoomForm.endDate);
      const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const pricePerNight = roomPriceMap[assignRoomForm.roomName] || 0;
      const totalAmount = pricePerNight * nights;

      const bookingId = `WALKIN-${Date.now()}`;
      const nameParts = assignRoomForm.guestName.split(' ');
      const newBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        checkIn: assignRoomForm.startDate,
        checkOut: assignRoomForm.endDate,
        guests: {
          adults: 1,
          children: 0,
          rooms: 1
        },
        guestDetails: {
          prefix: assignRoomForm.guestPrefix || '',
          firstName: nameParts[0] || assignRoomForm.guestName,
          lastName: nameParts.slice(1).join(' ') || '',
          email: assignRoomForm.guestEmail || '',
          phone: assignRoomForm.guestPhone,
        },
        address: {
          country: assignRoomForm.guestCountry || '',
          city: assignRoomForm.guestCity || '',
          zipCode: '',
          address1: assignRoomForm.guestAddress || '',
          address2: ''
        },
        reservationGuests: [],
        rooms: [{
          type: assignRoomForm.roomName,
          price: pricePerNight,
          allocatedRoomType: assignRoomForm.roomName,
          suiteType: assignRoomForm.suiteType,
        }],
        addOns: [],
        status: 'checked_in', // Walk-in guests are checked in
        totalAmount,
        bookingId,
        paymentStatus: assignRoomForm.paymentStatus,
        paidAmount: assignRoomForm.paidAmount || 0,
        paymentMethod: assignRoomForm.paymentMethod || '',
        paymentDate: new Date()
      };

      await createBooking(newBooking);
      showToast('Walk-in guest assigned successfully!', 'success');
      setShowAssignRoom(false);
      setAssignRoomForm({
        startDate: '',
        endDate: '',
        suiteType: 'Garden Suite',
        roomName: '',
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        guestPrefix: '',
        guestAddress: '',
        guestCity: '',
        guestCountry: '',
        paymentMethod: '',
        paymentStatus: 'pending',
        paidAmount: 0,
        isWalkIn: false,
        reason: ''
      });
      await loadData();
    } catch (error) {
      console.error('Error assigning room:', error);
      showToast('Failed to assign room', 'error');
    }
  };

  // Open walk-in modal prefilled from empty cell (currently unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openWalkInFromCell = (date: Date, suiteType: SuiteType, roomName: string) => {
    const startStr = normalizeDate(date).toISOString().split('T')[0];
    const endDate = normalizeDate(date);
    endDate.setDate(endDate.getDate() + 1);
    const endStr = endDate.toISOString().split('T')[0];
    setAssignRoomForm(prev => ({
      ...prev,
      startDate: startStr,
      endDate: endStr,
      suiteType,
      roomName,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      guestPrefix: '',
      guestAddress: '',
      guestCity: '',
      guestCountry: '',
      paymentMethod: '',
      paymentStatus: 'pending',
      paidAmount: 0,
      isWalkIn: true,
      reason: ''
    }));
    setShowAssignRoom(true);
  };

  // Get available rooms for a date range
  const getAvailableRooms = (startDate: string, endDate: string, suiteType: SuiteType) => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = getDatesInRange(start, end);
    
    return roomsBySuite[suiteType].filter(room => {
      return dates.every(date => {
        const dateStr = date.toISOString().split('T')[0];
        const avail = roomAvailability[room.roomName]?.[dateStr];
        return avail?.available;
      });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white overflow-hidden">
      {/* Summary Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">All:</span>
          <span className="font-semibold text-gray-900">{summaryStats.totalRooms}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Vacant:</span>
          <span className="font-semibold text-green-600">{summaryStats.vacant}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Occupied:</span>
          <span className="font-semibold text-blue-600">{summaryStats.occupied}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Reserved:</span>
          <span className="font-semibold text-yellow-600">{summaryStats.reserved}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Blocked:</span>
          <span className="font-semibold text-red-600">{summaryStats.blocked}</span>
        </div>
       
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Dirty:</span>
          <span className="font-semibold text-gray-600">{summaryStats.dirty}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={currentDate.toISOString().split('T')[0]}
              onChange={(e) => setCurrentDate(new Date(e.target.value))}
              className="border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
            />
          </div>
          <select
            value={selectedSuite}
            onChange={(e) => setSelectedSuite(e.target.value as SuiteType | 'all')}
            className="border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
          >
            <option value="all">All Room Types</option>
            {SUITE_TYPES.map(suite => (
              <option key={suite} value={suite}>{suite}</option>
            ))}
          </select>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Room Type, Room, Reservation No, Guest Name..."
              className="pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none text-sm w-96"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              // Show calendar view of walk-in bookings
              setAssignRoomView('calendar');
              setShowAssignRoom(true);
            }}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
          >
            Assign Room
          </button>
        </div>
      </div>

      {/* Calendar Grid - Main Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="min-w-full">
          {/* Date Header */}
          <div className="sticky top-0 z-20 bg-white border-b-2 border-gray-300">
            <div className="flex">
              <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="p-1 hover:bg-gray-200"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-semibold text-gray-700">
                    {dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    onClick={() => navigateDate('next')}
                    className="p-1 hover:bg-gray-200"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex">
                {dateRange.dates.map((date, idx) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isHovered = hoveredDateIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 min-w-[80px] border-r border-gray-200 py-1 px-1 text-center transition-colors ${
                        isWeekend ? 'bg-yellow-50' : 'bg-white'
                      } ${isToday ? 'ring-1 ring-[#FF6A00]' : ''} ${isHovered ? 'bg-red-50 ring-1 ring-red-300 shadow-inner' : ''}`}
                    >
                      <div className={`text-[10px] font-semibold leading-tight ${isHovered ? 'text-red-700' : 'text-gray-600'}`}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-xs font-bold leading-tight ${isHovered ? 'text-red-700' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Room Rows */}
          <div className="bg-white">
            {SUITE_TYPES.map((suiteType, suiteIdx) => {
              const suiteRooms = filteredRooms.filter(r => r.suiteType === suiteType);
              if (suiteRooms.length === 0) return null;

              return (
                <div key={suiteType} className={suiteIdx > 0 ? 'border-t-2 border-gray-300' : ''}>
                  {/* Suite Header */}
                  <div className="sticky top-[40px] z-10 bg-gray-100 border-b border-gray-300">
                    <div className="flex">
                      <div className="w-64 flex-shrink-0 border-r border-gray-200 px-2 py-1.5 bg-gray-100 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-gray-900 leading-tight">{suiteType}</div>
                          <div className="text-[10px] text-gray-600 leading-tight">
                            {suiteRooms.length} room{suiteRooms.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 flex">
                        {dateRange.dates.map((date, dateIdx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          const isHovered = hoveredDateIndex === dateIdx;
                          const availableCount = suiteRooms.filter(room => {
                            const avail = roomAvailability[room.roomName]?.[dateStr];
                            return avail?.available;
                          }).length;
                          const priceKey = suiteRooms[0]?.roomName;
                          const price = (priceKey && roomPriceMap[priceKey]) || 0;
                          return (
                            <div
                              key={dateIdx}
                              className={`flex-1 min-w-[80px] border-r border-gray-200 py-1 px-1 text-center transition-colors ${
                                isWeekend ? 'bg-yellow-50' : 'bg-white'
                              } ${isHovered ? 'bg-red-50 ring-1 ring-red-200 shadow-inner' : ''}`}
                            >
                              <div className={`text-xs font-semibold border border-red-300 px-0.5 py-0 inline-block mb-0.5 leading-tight ${isHovered ? 'text-red-700 bg-red-50' : 'text-red-600'}`}>
                                {availableCount}
                              </div>
                              <div className={`text-[10px] leading-tight ${isHovered ? 'text-red-700' : 'text-gray-500'}`}>
                                {price ? price.toFixed(2) : 'N/A'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Individual Room Rows */}
                  {suiteRooms.map((room) => {
                    const roomBars = bookingBars.filter(bar => bar.roomName === room.roomName);
                    const isHoveredRoom = hoveredRoomId === room.roomName;
                    
                    return (
                      <div key={room.id} className="border-b border-gray-200">
                        <div className="flex relative" style={{ minHeight: '32px' }}>
                          {/* Room Name Column */}
                          <div className={`w-64 flex-shrink-0 border-r border-gray-200 px-2 py-1 bg-white flex items-center gap-2 transition-colors ${
                            isHoveredRoom ? 'bg-red-50' : ''
                          }`}>
                            <div className={`font-medium text-xs leading-tight ${isHoveredRoom ? 'text-red-700 font-semibold' : 'text-gray-900'}`}>{room.roomName}</div>
                            <div className="flex items-center gap-2 ml-auto pr-2">
                              {(() => {
                                const roomStatus = getRoomStatus(room.roomName);
                                const housekeepingStatus = roomStatus?.housekeepingStatus || 'clean';
                                const isClean = housekeepingStatus === 'clean' || housekeepingStatus === 'inspected';
                                const statusText = housekeepingStatus === 'clean' ? 'Clean' : 
                                                  housekeepingStatus === 'dirty' ? 'Dirty' : 
                                                  housekeepingStatus === 'inspected' ? 'Inspected' : 
                                                  'Needs Attention';
                                
                                return (
                                  <>
                                    <div className="relative group">
                                      {isClean ? (
                                        <FaUserCheck className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <FaUserSlash className="h-4 w-4 text-red-600" />
                                      )}
                                      {/* Tooltip */}
                                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                                        <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                                          Room Status : {statusText}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                                        </div>
                                      </div>
                                    </div>
                                    <FaBed className="h-4 w-4 text-gray-600" />
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Calendar Cells */}
                          <div className="flex-1 flex relative">
                            {dateRange.dates.map((date, dateIdx) => {
                              const dateStr = date.toISOString().split('T')[0];
                              const avail = roomAvailability[room.roomName]?.[dateStr];
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isHoveredDate = hoveredDateIndex === dateIdx;
                              
                              // Find booking bar for this date
                              const bookingBar = roomBars.find(bar => 
                                date >= bar.startDate && date < bar.endDate
                              );

                              return (
                                <div
                                  key={dateIdx}
                                  onClick={() => {
                                    if (!bookingBar && avail?.available && !avail?.blocked) {
                                      setSelectedCell({ date, suiteType: room.suiteType, roomName: room.roomName });
                                      setShowCellPopup(true);
                                    }
                                  }}
                                  onMouseEnter={() => {
                                    setHoveredDateIndex(dateIdx);
                                    setHoveredRoomId(room.roomName);
                                  }}
                                  onMouseLeave={() => {
                                    setHoveredDateIndex(null);
                                    setHoveredRoomId(null);
                                  }}
                                  className={`flex-1 min-w-[80px] border-r border-gray-200 relative transition-colors ${
                                    avail?.blocked ? 'bg-red-100' : 'bg-white hover:bg-blue-50'
                                  } ${isToday ? 'ring-1 ring-[#FF6A00]' : ''} ${isHoveredDate ? 'bg-red-50 ring-1 ring-red-200' : ''}`}
                                  style={{ minHeight: '32px', cursor: !bookingBar && avail?.available && !avail?.blocked ? 'pointer' : 'default' }}
                                >
                                  {bookingBar && dateIdx === dateRange.dates.findIndex(d => 
                                    d.toDateString() === bookingBar.startDate.toDateString()
                                  ) && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookingClick(bookingBar.booking);
                                      }}
                                      onMouseEnter={() => {
                                        setHoveredDateIndex(dateIdx);
                                        setHoveredRoomId(room.roomName);
                                      }}
                                      onMouseLeave={() => {
                                        setHoveredDateIndex(null);
                                        setHoveredRoomId(null);
                                      }}
                                      className="absolute top-0 left-0.5 right-0.5 bg-green-500 text-white text-[10px] py-1.5 px-1 z-10 cursor-pointer hover:bg-green-600 transition-colors leading-tight"
                                      style={{
                                        width: `calc(${Math.max(1, Math.ceil((bookingBar.endDate.getTime() - bookingBar.startDate.getTime()) / (1000 * 60 * 60 * 24)))} * 80px - 4px)`,
                                        minWidth: '60px',
                                        minHeight: '32px'
                                      }}
                                      title={`Click to view details: ${bookingBar.booking.guestDetails?.firstName} ${bookingBar.booking.guestDetails?.lastName}`}
                                    >
                                      <div className="font-semibold truncate leading-tight">
                                        {bookingBar.booking.guestDetails?.firstName} {bookingBar.booking.guestDetails?.lastName}
                                      </div>
                                      {bookingBar.booking.paymentStatus === 'paid' && (
                                        <div className="text-[8px] mt-0.5 flex items-center gap-0.5">
                                          <span className="bg-red-500 text-white px-0.5 leading-tight">S</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {!bookingBar && avail?.blocked && (
                                    <div className="absolute inset-1 bg-red-200/70 border border-red-300 rounded text-[10px] text-red-800 flex items-center justify-center font-semibold pointer-events-none">
                                      Blocked
                                    </div>
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
              );
            })}
          </div>
        {/* Bottom Summary (aligned with grid and scroll) */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200">
          <div className="flex">
            <div className="w-64 flex-shrink-0 border-r border-gray-200 px-2 py-1">
              <div className="text-[10px] font-semibold text-gray-600 leading-tight">Room Availability</div>
            </div>
            <div className="flex-1 flex">
              {dateRange.dates.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                let totalAvailable = 0;
                filteredRooms.forEach(room => {
                  const avail = roomAvailability[room.roomName]?.[dateStr];
                  if (avail?.available) totalAvailable++;
                });
                const isHovered = hoveredDateIndex === idx;
                return (
                  <div key={idx} className={`flex-1 min-w-[80px] border-r border-gray-200 py-1 px-1 text-center transition-colors ${isHovered ? 'bg-red-50 ring-1 ring-red-200 shadow-inner' : ''}`}>
                    <div className="text-xs font-semibold text-gray-900 leading-tight">{totalAvailable}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex">
            <div className="w-64 flex-shrink-0 border-r border-gray-200 px-2 py-1">
              <div className="text-[10px] font-semibold text-gray-600 leading-tight">Occupancy(%)</div>
            </div>
            <div className="flex-1 flex">
              {dateRange.dates.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                let totalAvailable = 0;
                const totalRooms = filteredRooms.length;
                filteredRooms.forEach(room => {
                  const avail = roomAvailability[room.roomName]?.[dateStr];
                  if (avail?.available) totalAvailable++;
                });
                const occupancy = totalRooms > 0 ? Math.round(((totalRooms - totalAvailable) / totalRooms) * 100) : 0;
                const isHovered = hoveredDateIndex === idx;
                return (
                  <div key={idx} className={`flex-1 min-w-[80px] border-r border-gray-200 py-1 px-1 text-center transition-colors ${isHovered ? 'bg-red-50 ring-1 ring-red-200 shadow-inner' : ''}`}>
                    <div className="text-xs font-semibold text-gray-900 leading-tight">{occupancy}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Right Side Booking Details Panel - Slide In */}
      {showBookingPanel && selectedBooking && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => {
              setShowBookingPanel(false);
              setSelectedBooking(null);
            }}
          />
          <div 
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName}
                </h3>
                <button
                  onClick={() => {
                    setShowBookingPanel(false);
                    setSelectedBooking(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(() => {
                  const nights = calculateNights(selectedBooking.checkIn, selectedBooking.checkOut);
                  const guestsCount = selectedBooking.guests || { adults: 0, children: 0, rooms: 1 };
                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Booking ID</p>
                          <p className="font-semibold text-gray-900">{selectedBooking.bookingId}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          selectedBooking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedBooking.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Check-in</p>
                          <p className="font-medium text-gray-900">
                            {new Date(selectedBooking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Check-out</p>
                          <p className="font-medium text-gray-900">
                            {new Date(selectedBooking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Nights</p>
                          <p className="font-medium text-gray-900">{nights}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Guests</p>
                          <p className="font-medium text-gray-900">{guestsCount.adults} Adults{guestsCount.children ? `, ${guestsCount.children} Children` : ''}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Rooms</p>
                          <p className="font-medium text-gray-900">{guestsCount.rooms}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Payment</p>
                          {(() => {
                            const payment = selectedBooking.paymentStatus || 'pending';
                            const tone =
                              payment === 'paid' ? 'bg-green-100 text-green-800' :
                              payment === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800';
                            return (
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${tone}`}>
                                {payment.toUpperCase()}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-xs text-gray-500">Total Amount</p>
                          <p className="text-lg font-bold text-gray-900">${selectedBooking.totalAmount?.toLocaleString() || 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Rate Plan</p>
                          <p className="font-medium text-gray-900">{selectedBooking.rooms[0]?.suiteType || selectedBooking.rooms[0]?.type || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Guest Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Guest Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium text-gray-900 text-right">{selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium text-gray-900 text-right">{selectedBooking.guestDetails.email}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900 text-right">{selectedBooking.guestDetails.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Rooms */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Rooms</h4>
                  <div className="space-y-2">
                    {selectedBooking.rooms.map((r, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{r.type}</span>
                            {r.suiteType && (
                              <span className="ml-2 text-xs text-gray-500">({r.suiteType})</span>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-700">${r.price}</span>
                        </div>
                        {r.allocatedRoomType && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">Allocated Room:</span>
                            <span className="ml-2 text-sm font-semibold text-green-700">{r.allocatedRoomType}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add-ons */}
                {(() => {
                  const addOns = selectedBooking.addOns || [];
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Add-ons</h4>
                      {addOns.length > 0 ? (
                        <div className="space-y-2">
                          {addOns.map((a, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
                              <div>
                                <span className="text-sm font-medium text-gray-900">{a.name}</span>
                                <span className="text-xs text-gray-500 ml-2">x{a.quantity}</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-700">${(a.price * a.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No add-ons selected</p>
                      )}
                    </div>
                  );
                })()}

                {/* Financial Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-sm font-semibold text-gray-900">${(selectedBooking.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">Paid</p>
                      <p className="text-sm font-semibold text-gray-900">${(selectedBooking.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700">Balance</p>
                      <p className="text-sm font-semibold text-red-600">${((selectedBooking.totalAmount || 0) - (selectedBooking.paidAmount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cell Click Popup - Walk In / Maintenance Block */}
      {showCellPopup && selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-2xl rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Arrival Departure</h3>
                <button
                  onClick={() => {
                    setShowCellPopup(false);
                    setSelectedCell(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={selectedCell.date.toISOString().split('T')[0]}
                      readOnly
                      className="border border-gray-300 px-3 py-2 text-sm rounded focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    />
                    <span className="text-gray-500">→</span>
                    <input
                      type="date"
                      value={selectedCell.date.toISOString().split('T')[0]}
                      readOnly
                      className="border border-gray-300 px-3 py-2 text-sm rounded focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const startStr = selectedCell.date.toISOString().split('T')[0];
                    const endDate = new Date(selectedCell.date);
                    endDate.setDate(endDate.getDate() + 1);
                    const endStr = endDate.toISOString().split('T')[0];
                    setAssignRoomForm(prev => ({
                      ...prev,
                      startDate: startStr,
                      endDate: endStr,
                      suiteType: selectedCell.suiteType,
                      roomName: selectedCell.roomName,
                      isWalkIn: true
                    }));
                    setShowCellPopup(false);
                    setSelectedCell(null);
                    setAssignRoomView('form');
                    setShowAssignRoom(true);
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <UserIcon className="h-5 w-5" />
                  Walk In / Reservation
                </button>
                
                <button
                  onClick={() => {
                    const startStr = selectedCell.date.toISOString().split('T')[0];
                    const endDate = new Date(selectedCell.date);
                    endDate.setDate(endDate.getDate() + 1);
                    const endStr = endDate.toISOString().split('T')[0];
                    setMaintenanceBlockForm(prev => ({
                      ...prev,
                      startDate: startStr,
                      endDate: endStr,
                      suiteType: selectedCell.suiteType,
                      roomName: selectedCell.roomName
                    }));
                    setShowCellPopup(false);
                    setSelectedCell(null);
                    setShowMaintenanceBlock(true);
                  }}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircleIcon className="h-5 w-5" />
                  Maintenance Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Block Modal */}
      {showMaintenanceBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-2xl rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-900">Block Room</h3>
              <button
                onClick={() => {
                  setShowMaintenanceBlock(false);
                  setMaintenanceBlockForm({
                    startDate: '',
                    endDate: '',
                    suiteType: 'Garden Suite',
                    roomName: '',
                    reason: '',
                    customReason: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={maintenanceBlockForm.startDate}
                    onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, startDate: e.target.value })}
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm rounded focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  />
                  <span className="text-gray-500">→</span>
                  <input
                    type="date"
                    value={maintenanceBlockForm.endDate}
                    onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, endDate: e.target.value })}
                    min={maintenanceBlockForm.startDate}
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm rounded focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  />
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                </div>
                <button className="mt-2 w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                  Add Range
                </button>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                <select
                  value={maintenanceBlockForm.suiteType}
                  onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, suiteType: e.target.value as SuiteType, roomName: '' })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                >
                  {SUITE_TYPES.map(suite => (
                    <option key={suite} value={suite}>{suite}</option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                <select
                  value={maintenanceBlockForm.roomName}
                  onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, roomName: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                >
                  <option value="">Select Room</option>
                  {roomsBySuite[maintenanceBlockForm.suiteType]?.map(room => (
                    <option key={room.id} value={room.roomName}>{room.roomName}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <select
                  value={maintenanceBlockForm.reason}
                  onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, reason: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                >
                  <option value="">Select Reason</option>
                  <optgroup label="BLOCKED">
                    <option value="Bathroom Ceiling is fallen off">Bathroom Ceiling is fallen off</option>
                    <option value="ceiling has fallen down">ceiling has fallen down</option>
                    <option value="ELECTRICITY ISSUE">ELECTRICITY ISSUE</option>
                    <option value="Room floor damage">Room floor damage</option>
                    <option value="Room has no AC">Room has no AC</option>
                    <option value="Request from the guest">Request from the guest</option>
                  </optgroup>
                </select>
              </div>

              {/* Custom Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Custom Reason</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={maintenanceBlockForm.customReason}
                    onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, customReason: e.target.value })}
                    placeholder="Enter custom reason"
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm rounded focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      if (maintenanceBlockForm.customReason.trim()) {
                        // Add custom reason to the list (you can store this in state or database)
                        setMaintenanceBlockForm({ ...maintenanceBlockForm, reason: maintenanceBlockForm.customReason, customReason: '' });
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowMaintenanceBlock(false);
                    setMaintenanceBlockForm({
                      startDate: '',
                      endDate: '',
                      suiteType: 'Garden Suite',
                      roomName: '',
                      reason: '',
                      customReason: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!maintenanceBlockForm.startDate || !maintenanceBlockForm.endDate || !maintenanceBlockForm.roomName || !maintenanceBlockForm.reason) {
                      showToast('Please fill all required fields', 'warning');
                      return;
                    }
                    try {
                      // Store blocked room info
                      const roomKey = maintenanceBlockForm.roomName;
                      const newBlock = {
                        startDate: maintenanceBlockForm.startDate,
                        endDate: maintenanceBlockForm.endDate,
                        reason: maintenanceBlockForm.reason || maintenanceBlockForm.customReason
                      };
                      setBlockedRooms(prev => ({
                        ...prev,
                        [roomKey]: [...(prev[roomKey] || []), newBlock]
                      }));
                      showToast('Room blocked successfully', 'success');
                      setShowMaintenanceBlock(false);
                      setMaintenanceBlockForm({
                        startDate: '',
                        endDate: '',
                        suiteType: 'Garden Suite',
                        roomName: '',
                        reason: '',
                        customReason: ''
                      });
                      await loadData();
                    } catch (error) {
                      console.error('Error blocking room:', error);
                      showToast('Failed to block room', 'error');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-lg"
                >
                  Block Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Room Modal */}
      {showAssignRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`bg-white shadow-2xl w-full ${assignRoomView === 'calendar' ? 'max-w-6xl' : 'max-w-3xl'} max-h-[90vh] overflow-y-auto`}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-900">Assign Rooms</h3>
                {assignRoomView === 'calendar' && <CalendarDaysIcon className="h-5 w-5 text-gray-400" />}
              </div>
              <button
                onClick={() => {
                  setShowAssignRoom(false);
                  setAssignRoomView('form');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {assignRoomView === 'calendar' ? (
              // Calendar View - Show walk-in bookings
              <div className="p-6">
                {(() => {
                  const walkInBookings = bookings.filter(b => b.bookingId?.startsWith('WALKIN-'));
                  if (walkInBookings.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">No Data</p>
                        <p className="text-sm text-gray-400 mt-2">No walk-in bookings found</p>
                      </div>
                    );
                  }
                  // Show calendar grid similar to main view but only for walk-in bookings
                  return (
                    <div className="text-sm text-gray-600">
                      <p className="mb-4">Showing {walkInBookings.length} walk-in booking(s)</p>
                      {/* You can add a simplified calendar view here showing only walk-in bookings */}
                      <div className="space-y-2">
                        {walkInBookings.map(booking => (
                          <div key={booking.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-900">{booking.guestDetails.firstName} {booking.guestDetails.lastName}</p>
                                <p className="text-sm text-gray-600">{booking.rooms[0]?.allocatedRoomType || booking.rooms[0]?.type}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${
                                booking.status === 'checked_in' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              // Form View
              <div className="p-6 space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Date *</label>
                  <input
                    type="date"
                    required
                    value={assignRoomForm.startDate}
                    onChange={(e) => {
                      setAssignRoomForm({ ...assignRoomForm, startDate: e.target.value });
                      if (!assignRoomForm.endDate || e.target.value > assignRoomForm.endDate) {
                        const endDate = new Date(e.target.value);
                        endDate.setDate(endDate.getDate() + 1);
                        setAssignRoomForm({ ...assignRoomForm, startDate: e.target.value, endDate: endDate.toISOString().split('T')[0] });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={assignRoomForm.endDate}
                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, endDate: e.target.value })}
                    min={assignRoomForm.startDate}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Type *</label>
                <select
                  value={assignRoomForm.suiteType}
                  onChange={(e) => {
                    setAssignRoomForm({ ...assignRoomForm, suiteType: e.target.value as SuiteType, roomName: '' });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                >
                  {SUITE_TYPES.map(suite => (
                    <option key={suite} value={suite}>{suite}</option>
                  ))}
                </select>
              </div>

              {/* Room Selection */}
              {assignRoomForm.startDate && assignRoomForm.endDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room *</label>
                  <select
                    value={assignRoomForm.roomName}
                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, roomName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  >
                    <option value="">Select Room</option>
                    {getAvailableRooms(assignRoomForm.startDate, assignRoomForm.endDate, assignRoomForm.suiteType).map(room => (
                      <option key={room.id} value={room.roomName}>{room.roomName}</option>
                    ))}
                  </select>
                  {getAvailableRooms(assignRoomForm.startDate, assignRoomForm.endDate, assignRoomForm.suiteType).length === 0 && (
                    <p className="text-xs text-red-600 mt-1">No rooms available for selected dates</p>
                  )}
                </div>
              )}

              {/* Guest Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name *</label>
                  <input
                    type="text"
                    required
                    value={assignRoomForm.guestName}
                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, guestName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    placeholder="Enter guest name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={assignRoomForm.guestEmail}
                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, guestEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={assignRoomForm.guestPhone}
                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, guestPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    placeholder="Enter phone"
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={assignRoomForm.guestAddress}
                  onChange={(e) => setAssignRoomForm({ ...assignRoomForm, guestAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  placeholder="Enter address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={assignRoomForm.guestCity}
                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, guestCity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={assignRoomForm.guestCountry}
                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, guestCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    placeholder="Enter country"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      value={assignRoomForm.paymentMethod}
                      onChange={(e) => setAssignRoomForm({ ...assignRoomForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    >
                      <option value="">Select Payment Method</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                    <select
                      value={assignRoomForm.paymentStatus}
                      onChange={(e) => setAssignRoomForm({ ...assignRoomForm, paymentStatus: e.target.value as 'pending' | 'paid' | 'partial' })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                    </select>
                  </div>
                </div>
                {assignRoomForm.paymentStatus !== 'pending' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount</label>
                    <input
                      type="number"
                      value={assignRoomForm.paidAmount}
                      onChange={(e) => setAssignRoomForm({ ...assignRoomForm, paidAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                      placeholder="Enter paid amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              {/* Walk-in Guest - Always true for this form */}
              <input type="hidden" value="true" />

              {/* Reason (for blocking) */}
              {assignRoomForm.reason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={assignRoomForm.reason}
                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    placeholder="Reason for blocking"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAssignRoom(false);
                    setAssignRoomView('form');
                    setAssignRoomForm({
                      startDate: '',
                      endDate: '',
                      suiteType: 'Garden Suite',
                      roomName: '',
                      guestName: '',
                      guestEmail: '',
                      guestPhone: '',
                      guestPrefix: '',
                      guestAddress: '',
                      guestCity: '',
                      guestCountry: '',
                      paymentMethod: '',
                      paymentStatus: 'pending',
                      paidAmount: 0,
                      isWalkIn: false,
                      reason: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleAssignRoom}
                  disabled={!assignRoomForm.startDate || !assignRoomForm.endDate || !assignRoomForm.roomName || !assignRoomForm.guestName}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
