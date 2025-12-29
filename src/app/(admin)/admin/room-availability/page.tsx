"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getAllBookings, getRoomTypes, createBooking, getRooms, getRoomStatuses, markRoomForMaintenance, completeRoomMaintenance, Booking, SuiteType, RoomType, Room, RoomStatus } from '@/lib/firestoreService';
import { sendBookingConfirmationEmailAction } from '@/app/actions/emailActions';
import { useToast } from '@/context/ToastContext';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,

  UserIcon,

  XCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  CreditCardIcon

} from '@heroicons/react/24/outline';
import { FaBed, FaUserCheck, FaUserSlash, FaSmoking, FaSmokingBan, FaBroom, FaSprayCan } from 'react-icons/fa';
import LegendPopover from '@/components/admin/stayview/LegendPopover';


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

const toLocalISOString = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Start of Day helper
const startOfDay = (d: Date) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

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
    // Default fallback prices
    const map: Record<SuiteType, number> = {
      'Garden Suite': 260,
      'Imperial Suite': 370,
      'Ocean Suite': 310
    };

    // Update prices from Rooms collection (Source of Truth)
    if (rooms && rooms.length > 0) {
      const foundSuites = new Set<string>();

      rooms.forEach(room => {
        let matchedSuite: SuiteType | null = null;

        // 1. Try exact match on suiteType key (Best)
        if (room.suiteType && SUITE_TYPES.includes(room.suiteType)) {
          matchedSuite = room.suiteType;
        }
        // 2. Try matching room type string to known keys
        else if (room.type) {
          const typeLower = room.type.toLowerCase();
          if (typeLower.includes('garden')) matchedSuite = 'Garden Suite';
          else if (typeLower.includes('imperial') || typeLower.includes('sea suite')) matchedSuite = 'Imperial Suite';
          else if (typeLower.includes('ocean')) matchedSuite = 'Ocean Suite';
        }
        // 3. Try matching room name/title
        else if (room.name) {
          const nameLower = room.name.toLowerCase();
          if (nameLower.includes('garden')) matchedSuite = 'Garden Suite';
          else if (nameLower.includes('imperial')) matchedSuite = 'Imperial Suite';
          else if (nameLower.includes('ocean')) matchedSuite = 'Ocean Suite';
        }

        // Only update if we haven't found a newer definition for this suite yet
        if (matchedSuite && !foundSuites.has(matchedSuite)) {
          map[matchedSuite] = room.price;
          foundSuites.add(matchedSuite);
        }
      });
    }

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
  const [selectedCell, setSelectedCell] = useState<{ date: Date; suiteType: SuiteType; roomName: string } | null>(null);
  const [showMaintenanceBlock, setShowMaintenanceBlock] = useState(false);
  const [blockedRooms, setBlockedRooms] = useState<Record<string, { startDate: string; endDate: string; reason: string }[]>>({});
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
    reason: '',
    adults: 1,
    children: 0,
    idProofType: 'Passport',
    idProofNumber: '',
    notes: ''
  });
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [maintenanceBlockForm, setMaintenanceBlockForm] = useState({
    startDate: '',
    endDate: '',
    suiteType: 'Garden Suite' as SuiteType,
    roomName: '',
    reason: '',
    customReason: ''
  });
  const [hoveredBooking, setHoveredBooking] = useState<Booking | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkMaintenance = async () => {
    if (!selectedCell) return;

    try {
      const success = await markRoomForMaintenance(
        selectedCell.roomName,
        selectedCell.date,
        new Date(selectedCell.date.getTime() + 24 * 60 * 60 * 1000), // Default to 1 day
        'Scheduled maintenance'
      );

      if (success) {
        showToast('Room marked for maintenance', 'success');
        setShowCellPopup(false);
        setSelectedCell(null);
        await loadData();
      } else {
        showToast('Failed to mark room for maintenance', 'error');
      }
    } catch (error) {
      console.error('Error marking room for maintenance:', error);
      showToast('Failed to mark room for maintenance', 'error');
    }
  };

  const handleEndMaintenance = async () => {
    if (!selectedCell) return;

    try {
      const success = await completeRoomMaintenance(selectedCell.roomName);

      if (success) {
        showToast('Maintenance completed', 'success');
        setShowCellPopup(false);
        setSelectedCell(null);
        await loadData();
      } else {
        showToast('Failed to complete maintenance', 'error');
      }
    } catch (error) {
      console.error('Error completing maintenance:', error);
      showToast('Failed to complete maintenance', 'error');
    }
  };

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

          // Check if room is in maintenance
          const roomStatus = roomStatuses.find(rs => rs.roomName === room.roomName);
          const isInMaintenance = roomStatus?.status === 'maintenance' &&
            roomStatus.maintenanceStartDate &&
            roomStatus.maintenanceEndDate &&
            date >= normalizeDate(roomStatus.maintenanceStartDate) &&
            date < normalizeDate(roomStatus.maintenanceEndDate);

          availability[room.roomName][dateStr] = {
            available: !booking && !isBlocked && !isInMaintenance,
            booking: booking?.booking,
            blocked: isBlocked || isInMaintenance
          };
        });
      });
    });

    return availability;
  }, [roomsBySuite, dateRange.dates, bookingBars, blockedRooms, roomStatuses]);

  // Get room status by room name
  const getRoomStatus = (roomName: string): RoomStatus | undefined => {
    return roomStatuses.find(rs => rs.roomName === roomName);
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    // Calculate strict total rooms from the database, not just fallback
    const totalRoomsCount = roomTypes.length || 15;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let vacant = 0;
    let occupied = 0;
    let reserved = 0;
    let blocked = 0;
    const dirty = roomStatuses.filter(rs => rs.housekeepingStatus === 'dirty').length;

    dateRange.dates.forEach(date => {
      if (date.toDateString() === today.toDateString()) {
        SUITE_TYPES.forEach(suiteType => {
          roomsBySuite[suiteType].forEach(room => {
            const dateStr = date.toISOString().split('T')[0];
            const avail = roomAvailability[room.roomName]?.[dateStr];

            // Strict check: Room is occupied ONLY if there is a confirmed/checked_in booking
            if (avail?.booking) {
              const status = avail.booking.status;
              if (status === 'checked_in' || status === 'confirmed') {
                occupied++;
              } else {
                reserved++;
              }
            } else if (avail?.blocked) {
              blocked++; // Don't count blocked as occupied for percentage
            } else {
              vacant++;
            }
          });
        });
      }
    });

    return { totalRooms: totalRoomsCount, vacant, occupied, reserved, blocked, dirty };
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
      filtered = filtered.filter(room => {
        // Match room name or suite type
        if (room.roomName.toLowerCase().includes(query) || room.suiteType.toLowerCase().includes(query)) {
          return true;
        }

        // Match guest name in active bookings for this room
        return bookings.some(b =>
          (b.status === 'confirmed' || b.status === 'checked_in') &&
          b.rooms.some(r => (r.allocatedRoomType === room.roomName || r.type === room.roomName)) &&
          (b.guestDetails.firstName.toLowerCase().includes(query) || b.guestDetails.lastName.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [roomsBySuite, selectedSuite, searchQuery, bookings]);

  // JUMP TO DATE LOGIC: When search query matches a booking, jump to its start date
  useEffect(() => {
    if (!searchQuery.trim() || bookings.length === 0) return;

    const query = searchQuery.toLowerCase();
    // Find first matching booking
    const match = bookings.find(b =>
      (b.status === 'confirmed' || b.status === 'checked_in') &&
      (b.guestDetails.firstName.toLowerCase().includes(query) ||
        b.guestDetails.lastName.toLowerCase().includes(query) ||
        (b.bookingId && b.bookingId.toLowerCase().includes(query)))
    );

    if (match) {
      // Jump to check-in date
      const checkInDate = new Date(match.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      setCurrentDate(prev => {
        // Only update if significantly different (e.g. not already visible)
        // Actually, for "StayView" feel, always jump to ensure it's in view
        if (prev.getTime() !== checkInDate.getTime()) {
          return checkInDate;
        }
        return prev;
      });
    }
  }, [searchQuery, bookings]);

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

      const guestDetails = {
        prefix: assignRoomForm.guestPrefix || '',
        firstName: nameParts[0] || assignRoomForm.guestName,
        lastName: nameParts.slice(1).join(' ') || '',
        email: assignRoomForm.guestEmail || '',
        phone: assignRoomForm.guestPhone,
      };

      const newBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        checkIn: assignRoomForm.startDate,
        checkOut: assignRoomForm.endDate,
        guests: {
          adults: Number(assignRoomForm.adults) || 1,
          children: Number(assignRoomForm.children) || 0,
          rooms: 1
        },
        guestDetails: guestDetails,
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
        paymentDate: new Date(),
        source: 'walk_in',
        notes: assignRoomForm.notes || '',
        ...(assignRoomForm.idProofNumber ? { guestIdProof: `${assignRoomForm.idProofType}: ${assignRoomForm.idProofNumber}` } : {})
      };

      await createBooking(newBooking);
      showToast('Walk-in guest assigned successfully!', 'success');

      // Send confirmation email
      if (assignRoomForm.guestEmail) {
        const bookingForEmail = {
          ...newBooking,
          id: bookingId,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Booking;

        try {
          await sendBookingConfirmationEmailAction(bookingForEmail);
          showToast('Confirmation email sent to guest.', 'success');
        } catch (emailErr) {
          console.error("Failed to send walk-in email", emailErr);
          showToast('Booking saved but email failed.', 'warning');
        }
      }

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
        reason: '',
        adults: 1,
        children: 0,
        idProofType: 'Passport',
        idProofNumber: '',
        notes: ''
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
  // Get available rooms for a date range (Fixed: Independent of view range)
  const getAvailableRooms = (startDate: string, endDate: string, suiteType: SuiteType) => {
    if (!startDate || !endDate) return [];

    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    // Filter rooms by suite type
    const candidateRooms = roomsBySuite[suiteType] || [];

    return candidateRooms.filter(room => {
      // 1. Check for Booking Collisions
      const hasBookingCollision = bookings.some(booking => {
        if (booking.status === 'cancelled' || booking.status === 'no_show') return false;

        // Check if this booking allocates this room
        const hasRoom = booking.rooms.some(r => r.allocatedRoomType === room.roomName);
        if (!hasRoom) return false;

        const bookingStart = normalizeDate(booking.checkIn);
        const bookingEnd = normalizeDate(booking.checkOut);

        // Overlap check: Returns true if there IS a collision
        // Collision exists if ranges overlap. 
        // Two ranges [start1, end1) and [start2, end2) overlap if start1 < end2 && start2 < end1
        return bookingStart < end && start < bookingEnd;
      });

      if (hasBookingCollision) return false;

      // 2. Check for Maintenance/Blocked Collisions
      const roomBlocks = blockedRooms[room.roomName] || [];
      const hasBlockCollision = roomBlocks.some(block => {
        const blockStart = normalizeDate(block.startDate);
        const blockEnd = normalizeDate(block.endDate);
        return blockStart < end && start < blockEnd;
      });

      if (hasBlockCollision) return false;

      // 3. Check for Room Status Maintenance
      const rs = getRoomStatus(room.roomName);
      if (rs?.status === 'maintenance' && rs.maintenanceStartDate && rs.maintenanceEndDate) {
        const maintStart = normalizeDate(rs.maintenanceStartDate);
        const maintEnd = normalizeDate(rs.maintenanceEndDate);
        // Only collide if maintenance overlaps with request
        return maintStart < end && start < maintEnd;
      }

      return true;
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
      {/* Unified Controls Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-2 py-1.5 shadow-sm">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={currentDate.toISOString().split('T')[0]}
              onChange={(e) => setCurrentDate(new Date(e.target.value))}
              className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 cursor-pointer p-0"
            />
          </div>

          <div className="h-6 w-px bg-gray-200"></div>

          {/* Stats Pills - Compact */}
          <div className="flex items-center gap-3 text-xs">
            <div className="font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
              All: {summaryStats.totalRooms}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-gray-600">Vacant:</span>
              <span className="font-bold text-gray-900">{summaryStats.vacant}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-gray-600">Occupied:</span>
              <span className="font-bold text-gray-900">{summaryStats.occupied}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-gray-600">Reserved:</span>
              <span className="font-bold text-gray-900">{summaryStats.reserved}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600">Blocked:</span>
              <span className="font-bold text-gray-900">{summaryStats.blocked}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">Dirty:</span>
              <span className={`font-bold ${summaryStats.dirty > 0 ? 'text-red-600' : 'text-gray-900'}`}>{summaryStats.dirty}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Room Type Filter */}
          <select
            value={selectedSuite}
            onChange={(e) => setSelectedSuite(e.target.value as SuiteType | 'all')}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
          >
            <option value="all">All Room Types</option>
            {SUITE_TYPES.map(suite => (
              <option key={suite} value={suite}>{suite}</option>
            ))}
          </select>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings..."
              className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] text-sm w-48 transition-all"
            />
          </div>

          <LegendPopover />

          <button
            onClick={() => {
              setAssignRoomView('calendar');
              setShowAssignRoom(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <UserIcon className="h-4 w-4" />
            Assign Room
          </button>
        </div>
      </div>

      {/* Calendar Grid - Main Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="min-w-full">
          {/* Date Header */}
          <div className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex">
              <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-2 flex items-center justify-between">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="text-sm font-semibold text-gray-700">
                  Room Type
                </span>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 flex">
                {dateRange.dates.map((date, idx) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isHovered = hoveredDateIndex === idx;

                  // use #FFFBE6 for a distinct warm yellow that matches typical PMS styles
                  const bgColor = isWeekend ? 'bg-[#FFFBE6]' : 'bg-white';

                  return (
                    <div
                      key={idx}
                      className={`flex-1 min-w-[80px] border-r border-[#E5E7EB] py-1 px-1 text-center transition-colors flex flex-col justify-center h-14 ${bgColor} ${isToday ? 'bg-blue-50' : ''} ${isHovered ? 'bg-[#FFF0F0]' : ''}`}
                    >
                      <div className={`text-[11px] font-medium uppercase leading-tight ${isWeekend ? 'text-gray-800' : 'text-gray-500'}`}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium leading-tight">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className={`text-sm font-bold leading-tight ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
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
                <div key={suiteType} className="">
                  {/* Suite Header Row - Collapsible style appearance */}
                  <div className="sticky top-[58px] z-10 bg-[#F9FAFB] border-b border-gray-200">
                    <div className="flex">
                      <div className="w-64 flex-shrink-0 border-r border-gray-200 px-3 py-1 bg-[#F3F4F6] flex items-center">
                        <span className="text-gray-500 mr-2">-</span>
                        <span className="text-sm font-bold text-gray-800">{suiteType}</span>
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

                          const bgColor = 'bg-[#F3F4F6]';

                          return (
                            <div
                              key={dateIdx}
                              className={`flex-1 min-w-[80px] border-r border-[#E5E7EB] py-1 px-1 text-center transition-colors ${bgColor} ${isHovered ? 'bg-[#FFF0F0]' : ''}`}
                            >
                              <div className="flex flex-col items-center justify-center h-full gap-0.5">
                                <span className={`text-sm font-bold ${availableCount === 0 ? 'text-red-300' : 'text-red-500'}`}>
                                  {availableCount}
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium">
                                  {price ? price.toFixed(2) : '-'}
                                </span>
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
                        <div className="flex relative" style={{ minHeight: '34px' }}>
                          {/* Room Name Column - Simplified with Indicators */}
                          <div className={`w-64 flex-shrink-0 border-r border-gray-200 px-3 py-1 bg-white flex items-center justify-between transition-colors ${isHoveredRoom ? 'bg-blue-50' : ''
                            }`}>
                            <div className={`font-medium text-xs leading-tight uppercase ${isHoveredRoom ? 'text-blue-700' : 'text-gray-700'}`}>{room.roomName}</div>

                            <div className="flex items-center gap-1.5">
                              {/* Housekeeping Status */}
                              {(() => {
                                const status = getRoomStatus(room.roomName)?.housekeepingStatus || 'clean'; // Default to clean
                                if (status === 'dirty' || status === 'needs_attention') {
                                  return <FaBroom className="w-3 h-3 text-orange-500" title="Dirty / Needs Attention" />;
                                }
                                return <FaSprayCan className="w-3 h-3 text-green-500" title="Clean" />;
                              })()}

                              {/* Smoking Status - Check amenities or default to No Smoking */}
                              {room.amenities?.some(a => a.toLowerCase().includes('smoking') && !a.toLowerCase().includes('no smoking')) ? (
                                <FaSmoking className="w-3 h-3 text-gray-600" title="Smoking Allowed" />
                              ) : (
                                <FaSmokingBan className="w-3 h-3 text-red-400" title="No Smoking" />
                              )}
                            </div>
                          </div>

                          {/* Calendar Cells */}
                          <div className="flex-1 flex relative">
                            {dateRange.dates.map((date, dateIdx) => {
                              const dateStr = date.toISOString().split('T')[0];
                              const avail = roomAvailability[room.roomName]?.[dateStr];
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                              const isHoveredDate = hoveredDateIndex === dateIdx;

                              const bgColor = 'bg-white';

                              // Find booking bar for this date
                              const bookingBar = roomBars.find(bar =>
                                date >= bar.startDate && date < bar.endDate
                              );

                              // Logic to determine if we should render the start of a booking bar here
                              const shouldRenderBar = bookingBar && (
                                date.toDateString() === bookingBar.startDate.toDateString() ||
                                (dateIdx === 0 && bookingBar.startDate < date && bookingBar.endDate > date)
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
                                  className={`flex-1 min-w-[80px] border-r border-[#E5E7EB] relative transition-colors ${avail?.blocked ? 'bg-[#FEE2E2]' : bgColor
                                    } ${isToday ? 'bg-blue-50' : ''} ${isHoveredDate ? 'bg-[#FFF0F0]' : ''}`}
                                  style={{ minHeight: '34px', cursor: !bookingBar && avail?.available && !avail?.blocked ? 'pointer' : 'default', borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}
                                >
                                  {shouldRenderBar && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookingClick(bookingBar.booking);
                                      }}
                                      onMouseEnter={(e) => {
                                        setHoveredDateIndex(dateIdx);
                                        setHoveredRoomId(room.roomName);
                                        setHoveredBooking(bookingBar.booking);
                                        setMousePosition({ x: e.clientX, y: e.clientY });
                                      }}
                                      onMouseMove={(e) => {
                                        setMousePosition({ x: e.clientX, y: e.clientY });
                                      }}
                                      onMouseLeave={() => {
                                        setHoveredDateIndex(null);
                                        setHoveredRoomId(null);
                                        setHoveredBooking(null);
                                        setMousePosition(null);
                                      }}
                                      className={`absolute top-[2px] bottom-[2px] left-[2px] rounded-sm text-[10px] bg-blue-600 text-white shadow-sm flex items-center px-1.5 overflow-hidden z-10 cursor-pointer hover:bg-blue-700 transition-colors
                                        ${(() => {
                                          const b = bookingBar.booking;
                                          const today = startOfDay(new Date());
                                          const checkIn = startOfDay(new Date(b.checkIn));
                                          const checkOut = startOfDay(new Date(b.checkOut));

                                          if (b.status === 'checked_out') return '!bg-gray-500 !text-gray-100';
                                          if (b.status === 'checked_in') {
                                            if (checkOut.getTime() === today.getTime()) return '!bg-red-500'; // Due out
                                            return '!bg-green-600'; // Stayover / Arrived
                                          }
                                          if (b.status === 'confirmed') return '!bg-[#3B82F6]';
                                          return '!bg-gray-400';
                                        })()}
                                      `}
                                      style={{
                                        width: (() => {
                                          const viewStart = date;
                                          const effectiveEnd = bookingBar.endDate;
                                          const viewLimit = new Date(dateRange.end);
                                          viewLimit.setDate(viewLimit.getDate() + 1);
                                          viewLimit.setHours(0, 0, 0, 0);

                                          const clampedEnd = effectiveEnd < viewLimit ? effectiveEnd : viewLimit;
                                          const diff = Math.ceil((clampedEnd.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));
                                          return `calc(${Math.max(0, diff)} * 80px - 4px)`;
                                        })()
                                      }}
                                    >
                                      <span className="font-semibold truncate mr-1">
                                        {bookingBar.booking.guestDetails.firstName} {bookingBar.booking.guestDetails.lastName}
                                      </span>
                                      {/* Payment Pending Indicator */}
                                      {(bookingBar.booking.paymentStatus === 'pending' || (bookingBar.booking.totalAmount > (bookingBar.booking.paidAmount || 0))) && (
                                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 ml-auto" title="Payment Pending" />
                                      )}
                                    </div>
                                  )}
                                  {!bookingBar && avail?.blocked && (() => {
                                    const roomStatus = getRoomStatus(room.roomName);
                                    const isInMaintenance = roomStatus?.status === 'maintenance';

                                    return (
                                      <div className="absolute inset-0 bg-[#1A1A1A] flex items-center justify-center group overflow-hidden border border-black">
                                        <span className="text-[10px] font-bold text-white tracking-wider group-hover:hidden">MAINTENANCE</span>
                                        {isInMaintenance && (
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              const success = await completeRoomMaintenance(room.roomName);
                                              if (success) {
                                                showToast('Maintenance completed', 'success');
                                                await loadData();
                                              } else {
                                                showToast('Failed to complete maintenance', 'error');
                                              }
                                            }}
                                            className="hidden group-hover:flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-[10px] rounded hover:bg-green-700 transition-colors shadow-sm"
                                          >
                                            Complete
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}
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
          <div className="sticky bottom-0 bg-white border-t border-gray-300 shadow-[0_-2px_4px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex bg-[#F9FAFB]">
              <div className="w-64 flex-shrink-0 border-r border-gray-200 px-3 py-1.5 flex items-center">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Room Availability</div>
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
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const bgColor = 'bg-[#F9FAFB]';

                  return (
                    <div key={idx} className={`flex-1 min-w-[80px] border-r border-[#E5E7EB] px-1 text-center flex items-center justify-center transition-colors ${bgColor} ${isHovered ? 'bg-[#FFF0F0]' : ''}`} style={{ height: '34px' }}>
                      <div className="text-xs font-bold text-gray-800">{totalAvailable}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex bg-[#F9FAFB] border-t border-gray-200 border-b border-gray-300">
              <div className="w-64 flex-shrink-0 border-r border-gray-200 px-3 py-1.5 flex items-center">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Occupancy (%)</div>
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
                  const realOccupancy = Math.min(100, Math.max(0, occupancy));
                  const isHovered = hoveredDateIndex === idx;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const bgColor = 'bg-[#F9FAFB]';

                  return (
                    <div key={idx} className={`flex-1 min-w-[80px] border-r border-[#E5E7EB] px-1 text-center flex items-center justify-center transition-colors ${bgColor} ${isHovered ? 'bg-[#FFF0F0]' : ''}`} style={{ height: '34px' }}>
                      <div className="text-xs font-bold text-gray-800">{realOccupancy}%</div>
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
            className="fixed inset-0 z-40"
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
                    <div className="bg-gray-50 border border-gray-200 p-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Booking ID</p>
                          <p className="font-semibold text-gray-900">{selectedBooking.bookingId}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold ${selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold ${tone}`}>
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
                <div className="bg-white border border-gray-200 p-4">
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
                <div className="bg-white border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Rooms</h4>
                  <div className="space-y-2">
                    {selectedBooking.rooms.map((r, i) => (
                      <div key={i} className="p-3 bg-gray-50 border border-gray-200">
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
                    <div className="bg-white border border-gray-200 p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Add-ons</h4>
                      {addOns.length > 0 ? (
                        <div className="space-y-2">
                          {addOns.map((a, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200">
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
                <div className="bg-white border border-gray-200 p-4 mt-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-2xl w-full max-w-md">
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
                      className="border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                    />
                    <span className="text-gray-500">→</span>
                    <input
                      type="date"
                      value={selectedCell.date.toISOString().split('T')[0]}
                      readOnly
                      className="border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
                    setMaintenanceBlockForm({
                      startDate: startStr,
                      endDate: endStr,
                      suiteType: selectedCell.suiteType,
                      roomName: selectedCell.roomName,
                      reason: '',
                      customReason: ''
                    });
                    setShowCellPopup(false);
                    setSelectedCell(null);
                    setShowMaintenanceBlock(true);
                  }}
                  className="w-full px-4 py-3 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaBed className="h-5 w-5" />
                  Mark for Maintenance
                </button>

                {(() => {
                  const roomStatus = getRoomStatus(selectedCell.roomName);
                  if (roomStatus?.status === 'maintenance') {
                    return (
                      <button
                        onClick={handleEndMaintenance}
                        className="w-full px-4 py-3 bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaUserCheck className="h-5 w-5" />
                        End Maintenance
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Tooltip */}
      {hoveredBooking && mousePosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowMaintenanceBlock(false)}>
          <div className="bg-white shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col transform transition-all" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaBed className="h-5 w-5 text-red-500" />
                Block Room
              </h3>
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
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors rounded-full"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Date Range */}
              <div className="bg-gray-50/50 p-5 border border-gray-100">
                <label className="block text-sm font-bold text-gray-900 mb-2">Select Dates</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={maintenanceBlockForm.startDate}
                    onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, startDate: e.target.value })}
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent rounded"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={maintenanceBlockForm.endDate}
                    onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, endDate: e.target.value })}
                    min={maintenanceBlockForm.startDate}
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent rounded"
                  />
                </div>
              </div>

              {/* Room Selection */}
              <div className="bg-gray-50/50 p-5 border border-gray-100 space-y-4">
                <label className="block text-sm font-bold text-gray-900">Room Details</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Type</label>
                    <select
                      value={maintenanceBlockForm.suiteType}
                      onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, suiteType: e.target.value as SuiteType, roomName: '' })}
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent rounded"
                    >
                      {SUITE_TYPES.map(suite => (
                        <option key={suite} value={suite}>{suite}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Room</label>
                    <select
                      value={maintenanceBlockForm.roomName}
                      onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, roomName: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent rounded"
                    >
                      <option value="">Select Room</option>
                      {roomsBySuite[maintenanceBlockForm.suiteType]?.map(room => (
                        <option key={room.id} value={room.roomName}>{room.roomName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-gray-50/50 p-5 border border-gray-100 space-y-4">
                <label className="block text-sm font-bold text-gray-900">Maintenance Reason</label>
                <select
                  value={maintenanceBlockForm.reason}
                  onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, reason: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent rounded"
                >
                  <option value="">Select Issue...</option>
                  <optgroup label="Common Issues">
                    <option value="Bathroom Ceiling is fallen off">Bathroom Ceiling is fallen off</option>
                    <option value="ceiling has fallen down">Ceiling has fallen down</option>
                    <option value="ELECTRICITY ISSUE">Electricity Issue</option>
                    <option value="Room floor damage">Room floor damage</option>
                    <option value="Room has no AC">AC Not Working</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="Request from the guest">Guest Request</option>
                    <option value="Scheduled Maintenance">Scheduled Maintenance</option>
                  </optgroup>
                </select>

                <div className="flex gap-2 items-center">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-xs text-gray-400 font-medium uppercase">Or Custom</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={maintenanceBlockForm.customReason}
                    onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, customReason: e.target.value })}
                    placeholder="Type custom reason here..."
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent rounded"
                  />
                  <button
                    onClick={() => {
                      if (maintenanceBlockForm.customReason.trim()) {
                        setMaintenanceBlockForm({ ...maintenanceBlockForm, reason: maintenanceBlockForm.customReason, customReason: '' });
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors rounded"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-100 p-6 flex gap-3 sticky bottom-0 z-10">
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
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors rounded shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!maintenanceBlockForm.roomName || !maintenanceBlockForm.startDate || !maintenanceBlockForm.endDate || !maintenanceBlockForm.reason) {
                    showToast('Please fill in all required fields', 'warning');
                    return;
                  }

                  try {
                    const success = await markRoomForMaintenance(
                      maintenanceBlockForm.roomName,
                      new Date(maintenanceBlockForm.startDate),
                      new Date(maintenanceBlockForm.endDate),
                      maintenanceBlockForm.reason
                    );

                    if (success) {
                      showToast('Room marked for maintenance', 'success');
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
                    } else {
                      showToast('Failed to mark room for maintenance', 'error');
                    }
                  } catch (error) {
                    console.error('Error marking room for maintenance:', error);
                    showToast('Failed to mark room for maintenance', 'error');
                  }
                }}
                disabled={!maintenanceBlockForm.roomName || !maintenanceBlockForm.startDate || !maintenanceBlockForm.endDate || !maintenanceBlockForm.reason}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded shadow-lg shadow-red-100"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Room Modal */}
      {showAssignRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowAssignRoom(false)}>
          <div
            className="bg-white shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10 flex-shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-gray-900">Assign Room</h3>
                <div className="flex bg-gray-100 p-1">
                  <button
                    onClick={() => setAssignRoomView('calendar')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${assignRoomView === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Calendar
                  </button>
                  <button
                    onClick={() => setAssignRoomView('form')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${assignRoomView === 'form' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Details
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowAssignRoom(false)}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Date Strip (Calendar View Only or Always? Maybe keep separate/optional) */}
            {assignRoomView === 'calendar' && (
              <div className="flex items-center border-b border-gray-100 px-4 py-2 bg-gray-50/50 flex-shrink-0 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setCalendarOffset(prev => prev - 7)}
                  className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex-1 flex justify-between gap-1 overflow-x-auto no-scrollbar mx-2">
                  {[...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i + calendarOffset);
                    const dateStr = toLocalISOString(d);
                    const effectivelySelected = assignRoomForm.startDate ? assignRoomForm.startDate === dateStr : (toLocalISOString(new Date()) === dateStr);

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setAssignRoomForm(prev => ({ ...prev, startDate: dateStr }));
                          // Keep in calendar view
                        }}
                        className={`flex-1 min-w-[50px] flex flex-col items-center justify-center py-2 border transition-all ${effectivelySelected ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50'}`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-80">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-lg font-bold">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCalendarOffset(prev => prev + 7)}
                  className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>

              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {assignRoomView === 'calendar' ? (
                // Calendar View Content
                <div className="space-y-4">
                  {(() => {
                    const targetDateStr = assignRoomForm.startDate || toLocalISOString(new Date());
                    const d = new Date(targetDateStr);
                    const dayBookings = bookings.filter(b => {
                      const start = b.checkIn.toString().split('T')[0];
                      const end = b.checkOut.toString().split('T')[0];
                      return targetDateStr >= start && targetDateStr < end;
                    });

                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-gray-900">
                            Bookings for {d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                          </h4>
                          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1">{dayBookings.length} Guests</span>
                        </div>

                        {dayBookings.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 border border-gray-100 border-dashed">
                            <CalendarDaysIcon className="h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-gray-900 font-medium">No bookings found</h3>
                            <p className="text-gray-500 text-sm mt-1">This date is currently empty.</p>
                            <button
                              onClick={() => {
                                const startStr = assignRoomForm.startDate || toLocalISOString(new Date());
                                const d = new Date(startStr);
                                d.setDate(d.getDate() + 1);
                                const endStr = toLocalISOString(d);
                                setAssignRoomForm(prev => ({ ...prev, startDate: startStr, endDate: endStr }));
                                setAssignRoomView('form');
                              }}
                              className="mt-4 px-5 py-2 bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-700 font-semibold transition-all shadow-sm"
                            >
                              Create Reservation
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dayBookings.map(booking => (
                              <div key={booking.id} onClick={() => handleBookingClick(booking)} className="bg-white p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-transparent -mr-8 -mt-8"></div>
                                <div className="flex justify-between items-start relative z-10">
                                  <div>
                                    <h5 className="font-bold text-gray-900 group-hover:text-blue-600">{booking.guestDetails.firstName} {booking.guestDetails.lastName}</h5>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                      <span className="w-1.5 h-1.5 bg-blue-500"></span>
                                      {booking.rooms[0]?.allocatedRoomType} ({booking.rooms[0]?.suiteType})
                                    </p>
                                  </div>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${booking.status === 'checked_in' ? 'bg-green-50 text-green-700 border-green-100' :
                                    booking.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                                    }`}>
                                    {booking.status.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                // Form View
                <div className="space-y-6">
                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Col: Dates & Room */}
                    <div className="space-y-6">
                      <div className="bg-gray-50/50 p-5 border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <CalendarDaysIcon className="h-4 w-4 text-[#FF6A00]" /> Stay Dates
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Check-in</label>
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
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all text-sm font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Check-out</label>
                            <input
                              type="date"
                              required
                              value={assignRoomForm.endDate}
                              onChange={(e) => setAssignRoomForm({ ...assignRoomForm, endDate: e.target.value })}
                              min={assignRoomForm.startDate}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all text-sm font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50/50 p-5 border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaBed className="h-4 w-4 text-[#FF6A00]" /> Room Selection
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Suite Type</label>
                            <select
                              value={assignRoomForm.suiteType}
                              onChange={(e) => {
                                setAssignRoomForm({ ...assignRoomForm, suiteType: e.target.value as SuiteType, roomName: '' });
                              }}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all text-sm"
                            >
                              {SUITE_TYPES.map(suite => (
                                <option key={suite} value={suite}>{suite}</option>
                              ))}
                            </select>
                          </div>
                          {assignRoomForm.startDate && assignRoomForm.endDate && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Available Room</label>
                              <select
                                value={assignRoomForm.roomName}
                                onChange={(e) => setAssignRoomForm({ ...assignRoomForm, roomName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all text-sm"
                              >
                                <option value="">-- Select Room --</option>
                                {getAvailableRooms(assignRoomForm.startDate, assignRoomForm.endDate, assignRoomForm.suiteType).map(room => {
                                  const price = roomPriceMap[room.roomName] || 0;
                                  return (
                                    <option key={room.id} value={room.roomName}>{room.roomName} - ${price}/night</option>
                                  );
                                })}
                              </select>
                              {getAvailableRooms(assignRoomForm.startDate, assignRoomForm.endDate, assignRoomForm.suiteType).length === 0 && (
                                <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                                  <XCircleIcon className="h-4 w-4" /> No rooms available for dates
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Col: Guest Info & Billing */}
                    <div className="space-y-6">
                      <div className="bg-gray-50/50 p-5 border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-[#FF6A00]" /> Guest Details
                        </h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                              <input
                                type="text"
                                required
                                value={assignRoomForm.guestName}
                                onChange={(e) => setAssignRoomForm({ ...assignRoomForm, guestName: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all text-sm placeholder:text-gray-400"
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone *</label>
                              <input
                                type="tel"
                                required
                                value={assignRoomForm.guestPhone}
                                onChange={(e) => setAssignRoomForm({ ...assignRoomForm, guestPhone: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all text-sm placeholder:text-gray-400"
                                placeholder="+1..."
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                              <input
                                type="email"
                                value={assignRoomForm.guestEmail}
                                onChange={(e) => setAssignRoomForm({ ...assignRoomForm, guestEmail: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all text-sm placeholder:text-gray-400"
                                placeholder="guest@example.com"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Adults</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={assignRoomForm.adults}
                                  onChange={(e) => setAssignRoomForm({ ...assignRoomForm, adults: parseInt(e.target.value) || 1 })}
                                  className="w-full px-2 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Child</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={assignRoomForm.children}
                                  onChange={(e) => setAssignRoomForm({ ...assignRoomForm, children: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">ID Type</label>
                              <select
                                value={assignRoomForm.idProofType}
                                onChange={(e) => setAssignRoomForm({ ...assignRoomForm, idProofType: e.target.value })}
                                className="w-full px-2 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none text-sm"
                              >
                                <option value="Passport">Passport</option>
                                <option value="National ID">National ID</option>
                                <option value="Driver License">Driver License</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">ID Number</label>
                              <input
                                type="text"
                                value={assignRoomForm.idProofNumber}
                                onChange={(e) => setAssignRoomForm({ ...assignRoomForm, idProofNumber: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none text-sm"
                                placeholder="AB1234567"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes / Requests</label>
                            <textarea
                              rows={2}
                              value={assignRoomForm.notes}
                              onChange={(e) => setAssignRoomForm({ ...assignRoomForm, notes: e.target.value })}
                              className="w-full px-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none text-sm resize-none"
                              placeholder="Early check-in, etc."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Billing Information */}
                      <div className="bg-gray-50/50 p-5 border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <CreditCardIcon className="h-4 w-4 text-[#FF6A00]" /> Billing Information
                        </h4>

                        {(() => {
                          const start = new Date(assignRoomForm.startDate);
                          const end = new Date(assignRoomForm.endDate);
                          const nights = assignRoomForm.startDate && assignRoomForm.endDate ? Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) : 0;
                          const pricePerNight = roomPriceMap[assignRoomForm.roomName] || 0;
                          const totalAmount = pricePerNight * nights;
                          const remaining = totalAmount - (assignRoomForm.paidAmount || 0);

                          return (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100 mb-4">
                                <div>
                                  <p className="text-xs text-blue-600 font-semibold uppercase">Total Amount</p>
                                  <p className="text-lg font-bold text-blue-800">${totalAmount.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-blue-600 font-semibold uppercase">{nights} Nights</p>
                                  <p className="text-xs text-blue-800">${pricePerNight}/night</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Paid Amount</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max={totalAmount}
                                      value={assignRoomForm.paidAmount}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setAssignRoomForm(prev => ({
                                          ...prev,
                                          paidAmount: val,
                                          paymentStatus: val >= totalAmount ? 'paid' : val > 0 ? 'partial' : 'pending'
                                        }));
                                      }}
                                      className="w-full pl-7 pr-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none text-sm font-semibold"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Remaining</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                      type="text"
                                      readOnly
                                      value={remaining.toFixed(2)}
                                      className="w-full pl-7 pr-4 py-2 bg-gray-100 border border-gray-200 text-gray-500 outline-none text-sm font-semibold cursor-not-allowed"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Payment Method</label>
                                  <select
                                    value={assignRoomForm.paymentMethod}
                                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, paymentMethod: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none text-sm"
                                  >
                                    <option value="">Select Method</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Debit Card">Debit Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                                  <div className={`w-full px-3 py-2 text-sm font-bold uppercase rounded border text-center ${assignRoomForm.paymentStatus === 'paid' ? 'bg-green-50 text-green-600 border-green-200' :
                                    assignRoomForm.paymentStatus === 'partial' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                      'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                    {assignRoomForm.paymentStatus}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {assignRoomView === 'form' && (
              <div className="bg-white border-t border-gray-100 p-6 flex gap-3 sticky bottom-0 z-10">
                <button
                  onClick={() => {
                    setShowAssignRoom(false);
                  }}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRoom}
                  disabled={!assignRoomForm.startDate || !assignRoomForm.endDate || !assignRoomForm.roomName || !assignRoomForm.guestName}
                  className="flex-1 py-3 bg-[#FF6A00] text-white font-bold hover:bg-[#e65f00] transition-colors shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none"
                >
                  Confirm Assignment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
