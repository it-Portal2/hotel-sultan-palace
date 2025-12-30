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


  XMarkIcon,

  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { FaBed, FaUserCheck, FaUserSlash, FaSmoking, FaSmokingBan, FaBroom, FaSprayCan } from 'react-icons/fa';
import LegendPopover from '@/components/admin/stayview/LegendPopover';
import RegistrationCardModal from '@/components/admin/stayview/RegistrationCardModal';


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
  roomStatus?: string;
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

import QuickReservationModal from '@/components/admin/stayview/QuickReservationModal';

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
    // Default fallback prices
    const map: Record<SuiteType, number> = {
      'Garden Suite': 0,
      'Imperial Suite': 0,
      'Ocean Suite': 0
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

  // Enrich rooms with inferred suite type if missing
  const enrichedRooms = useMemo(() => {
    // 1. Start with existing Rooms collection data
    const combinedRooms = [...rooms];

    // 2. Augment with missing rooms from RoomTypes collection
    // (This ensures the Dropdown has all the rooms that the Calendar shows)
    const existingNames = new Set(rooms.map(r => r.name ? r.name.toLowerCase() : ''));

    roomTypes.forEach(rt => {
      if (rt.roomName && !existingNames.has(rt.roomName.toLowerCase())) {
        combinedRooms.push({
          id: rt.id || rt.roomName, // Use roomName as ID if ID missing
          name: rt.roomName,
          suiteType: rt.suiteType,
          type: rt.suiteType,
          price: suitePriceMap[rt.suiteType] || 0,
          amenities: [],
          description: '',
          // Missing properties added to satisfy Room interface
          size: '0',
          view: 'Standard',
          beds: '1',
          image: '',
          maxGuests: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Extra properties (optional, might be used elsewhere or legacy)
          // status: 'clean', 
          // images: [],
          // maxOccupancy: 2, // Map to maxGuests
        } as Room);
        existingNames.add(rt.roomName.toLowerCase()); // Avoid duplicates within loop
      }
    });

    return combinedRooms.map(room => {
      let matchedSuite: SuiteType | undefined = room.suiteType as SuiteType;

      // Explicit mapping based on user's facility layout
      const nameUpper = room.name ? room.name.toUpperCase() : '';

      if (['TANGERINE', 'MANGOSTEEN', 'LYCHEE', 'JASMINE', 'DESERT ROSE', 'ANANAS'].includes(nameUpper)) {
        matchedSuite = 'Garden Suite';
      } else if (['PAPAYA', 'HIBISCUS', 'FRANGIPANI', 'FLAMBOYANT', 'EUCALYPTUS'].includes(nameUpper)) {
        matchedSuite = 'Imperial Suite';
      } else if (['PASSION FLOWER', 'OLEANDER', 'CITRONELLA', 'BOUGAINVILLEA'].includes(nameUpper)) {
        matchedSuite = 'Ocean Suite';
      }

      if (!matchedSuite || !SUITE_TYPES.includes(matchedSuite)) {
        // 1. Try matching room type string to known keys
        if (room.type) {
          const typeLower = room.type.toLowerCase();
          if (typeLower.includes('garden')) matchedSuite = 'Garden Suite';
          else if (typeLower.includes('imperial') || typeLower.includes('sea suite')) matchedSuite = 'Imperial Suite';
          else if (typeLower.includes('ocean')) matchedSuite = 'Ocean Suite';
        }
        // 2. Try matching room name/title
        else if (room.name) {
          const nameLower = room.name.toLowerCase();
          if (nameLower.includes('garden')) matchedSuite = 'Garden Suite';
          else if (nameLower.includes('imperial')) matchedSuite = 'Imperial Suite';
          else if (nameLower.includes('ocean')) matchedSuite = 'Ocean Suite';
        }
      }

      const price = room.price || (matchedSuite ? suitePriceMap[matchedSuite] : 0);

      return {
        ...room,
        suiteType: matchedSuite || 'Garden Suite', // Fallback to ensure it appears somewhere
        price: price
      };
    });
  }, [rooms, roomTypes, suitePriceMap]);


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
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
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
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
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

  const loadData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
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
      if (showLoader) setLoading(false);
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
            suiteType: room.suiteType,
            roomStatus: room.status
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

          // Strict Date Comparison for Booking Overlap
          // We check if the current column date falls within the [start, end) range of any booking
          const booking = bookingBars.find(bar => {
            const bStart = bar.startDate.getTime();
            const bEnd = bar.endDate.getTime();
            const dTime = date.getTime();

            // Standard: Inclusive Start, Exclusive End
            // If check-in is 30th, check-out 31st.
            // 30th column: 30 >= 30 && 30 < 31 => TRUE (Occupied)
            // 31st column: 31 >= 30 && 31 < 31 => FALSE (Vacant)
            return bar.roomName === room.roomName && dTime >= bStart && dTime < bEnd;
          });

          // Check if room is blocked for this date
          const roomBlocks = blockedRooms[room.roomName] || [];
          const isBlocked = roomBlocks.some(block => {
            const blockStart = normalizeDate(block.startDate).getTime();
            const blockEnd = normalizeDate(block.endDate).getTime();
            const dTime = date.getTime();
            return dTime >= blockStart && dTime < blockEnd;
          });

          // Check if room is in maintenance
          const roomStatus = roomStatuses.find(rs => rs.roomName === room.roomName);
          let isInMaintenance = false;
          if (roomStatus?.status === 'maintenance' && roomStatus.maintenanceStartDate && roomStatus.maintenanceEndDate) {
            const mStart = normalizeDate(roomStatus.maintenanceStartDate).getTime();
            const mEnd = normalizeDate(roomStatus.maintenanceEndDate).getTime();
            const dTime = date.getTime();
            isInMaintenance = dTime >= mStart && dTime < mEnd;
          }

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
    let dueOut = 0;
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
              const checkOutDate = new Date(avail.booking.checkOut);
              checkOutDate.setHours(0, 0, 0, 0);

              const isDueOut = checkOutDate.getTime() === today.getTime();

              if (status === 'checked_in') {
                if (isDueOut) {
                  dueOut++; // Count in due out
                  occupied++; // Still technically occupied until they leave? Or maybe separate? Reference shows "Occupied 9", "Due Out 0". Often Due Out is a subset or separate state. Let's treat it as status.
                } else {
                  occupied++;
                }
              } else if (status === 'confirmed') {
                reserved++;
              } else {
                occupied++; // Fallback
              }
            } else if (avail?.blocked) {
              blocked++;
            } else {
              vacant++;
            }
          });
        });
      }
    });

    return { totalRooms: totalRoomsCount, vacant, occupied, reserved, blocked, dirty, dueOut };
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

  // Handle Quick Reservation Submit
  const handleQuickReservationSubmit = async (formData: any) => {
    try {
      const totalGuests = formData.selectedRooms.reduce((acc: number, r: any) => acc + r.adults + r.children, 0);

      const newBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        checkIn: formData.checkInDate,
        checkOut: formData.checkOutDate,
        guests: {
          adults: formData.selectedRooms.reduce((acc: number, r: any) => acc + r.adults, 0),
          children: formData.selectedRooms.reduce((acc: number, r: any) => acc + r.children, 0),
          rooms: formData.selectedRooms.length
        },
        guestDetails: {
          prefix: formData.guestTitle,
          firstName: formData.guestFirstName,
          lastName: formData.guestLastName,
          email: formData.guestEmail,
          phone: formData.guestMobile,
        },
        address: {
          country: formData.guestCountry,
          city: formData.guestCity,
          zipCode: formData.guestZip,
          address1: formData.guestAddress,
          address2: formData.guestState
        },
        reservationGuests: [],
        rooms: formData.selectedRooms.map((r: any) => ({
          type: r.roomType,
          price: r.price,
          allocatedRoomType: r.roomName || null, // Ensure explicit null if empty
          suiteType: r.roomType as SuiteType,
          ratePlan: r.rateType
        })),
        addOns: [],
        status: formData.reservationType === 'Confirm Booking' ? 'confirmed' : 'pending',
        totalAmount: formData.totalAmount,
        bookingId: `WALKIN-${Date.now()}`, // Or generate a better ID
        paymentStatus: formData.paymentMode ? 'paid' : 'pending',
        paidAmount: formData.paymentMode ? formData.totalAmount : 0,
        paymentMethod: formData.paymentMode ? 'Cash' : '', // simplified
        paymentDate: new Date(),
        source: formData.businessSource.toLowerCase().replace(' ', '_'),
        notes: '',
      };

      const createdBooking = await createBooking(newBooking);
      showToast('Reservation created successfully!', 'success');

      // 1. Close UI Immediately
      setShowAssignRoom(false);

      // 2. Optimistic Update (Immediate Feedback)
      // We add the new booking to the state so it appears on the calendar instantly
      // We use the returned ID if available, or a temp one
      const bookingWithId = {
        ...newBooking,
        id: createdBooking || `TEMP-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Booking;

      setBookings(prev => [...prev, bookingWithId]);

      // 3. Background Operations (Do not await)
      // Send email
      if (formData.guestEmail && formData.emailBookingVouchers) {
        sendBookingConfirmationEmailAction(bookingWithId)
          .then(() => showToast('Confirmation email sent.', 'success'))
          .catch(e => console.error("Email failed", e));
      }

      // Background data refresh to ensure consistency
      loadData(false).catch(err => console.error("Background refresh failed", err));

    } catch (error) {
      console.error("Error creating booking", error);
      showToast('Failed to create reservation', 'error');
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

          {/* Stats Pills - Oval Style */}
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-gray-600 border border-gray-200 shadow-sm">
              <span>All</span>
              <span className="font-bold text-gray-900">{summaryStats.totalRooms}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 rounded-full px-3 py-1 text-green-700 border border-green-100 shadow-sm">
              <span>Vacant</span>
              <span className="font-bold text-green-900">{summaryStats.vacant}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 rounded-full px-3 py-1 text-blue-700 border border-blue-100 shadow-sm">
              <span>Occupied</span>
              <span className="font-bold text-blue-900">{summaryStats.occupied}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-50 rounded-full px-3 py-1 text-yellow-700 border border-yellow-100 shadow-sm">
              <span>Reserved</span>
              <span className="font-bold text-yellow-900">{summaryStats.reserved}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1 text-gray-700 border border-gray-200 shadow-sm">
              <span>Blocked</span>
              <span className="font-bold text-gray-900">{summaryStats.blocked}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50 rounded-full px-3 py-1 text-red-700 border border-red-100 shadow-sm">
              <span>Due Out</span>
              <span className="font-bold text-red-900">{summaryStats.dueOut}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 rounded-full px-3 py-1 text-orange-700 border border-orange-100 shadow-sm">
              <span>Dirty</span>
              <span className="font-bold text-orange-900">{summaryStats.dirty}</span>
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
                                const status = getRoomStatus(room.roomName)?.housekeepingStatus || 'clean';
                                if (status === 'dirty' || status === 'needs_attention') {
                                  return <FaBroom className="w-3.5 h-3.5 text-gray-600" title="Dirty / Needs Attention" />;
                                }
                                return <FaBed className="w-3.5 h-3.5 text-gray-600" title="Clean" />;
                              })()}

                              {/* Smoking Status */}
                              {room.amenities?.some(a => a.toLowerCase().includes('smoking') && !a.toLowerCase().includes('no smoking')) ? (
                                <FaSmoking className="w-3.5 h-3.5 text-gray-600" title="Smoking Allowed" />
                              ) : (
                                <FaSmokingBan className="w-3.5 h-3.5 text-gray-600" title="No Smoking" />
                              )}
                            </div>
                          </div>

                          {/* Calendar Cells */}
                          <div className="flex-1 flex relative overflow-hidden">
                            {dateRange.dates.map((date, dateIdx) => {
                              const dateStr = date.toISOString().split('T')[0];
                              const avail = roomAvailability[room.roomName]?.[dateStr];
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                              const isHoveredDate = hoveredDateIndex === dateIdx;

                              const bgColor = 'bg-white';

                              // Find booking bar for this date
                              const bookingBar = roomBars.find(bar => {
                                const bStart = bar.startDate.getTime();
                                const bEnd = bar.endDate.getTime();
                                const dTime = date.getTime();
                                return dTime >= bStart && dTime < bEnd;
                              });

                              // Logic to determine if we should render the start of a booking bar here
                              const shouldRenderBar = (() => {
                                if (!bookingBar) return false;

                                const bStart = bookingBar.startDate.getTime();
                                const bEnd = bookingBar.endDate.getTime();
                                const dTime = date.getTime();

                                // 1. Is this the actual start date?
                                if (dTime === bStart) return true;

                                // 2. Are we at the first column of the view?
                                // AND does the booking overlap this date (which we know it does from .find above)
                                // AND did it start BEFORE this date?
                                if (dateIdx === 0 && bStart < dTime && bEnd > dTime) return true;

                                return false;
                              })();

                              return (
                                <div
                                  key={dateIdx}
                                  onClick={(e) => {
                                    if (!bookingBar && avail?.available && !avail?.blocked) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      // Use viewport coordinates for fixed positioning
                                      setPopupPosition({
                                        x: rect.left + (rect.width / 2),
                                        y: rect.top
                                      });
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
                                  {shouldRenderBar && bookingBar && (
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
                                      className={`absolute top-[2px] bottom-[2px] left-[2px] rounded-sm text-[10px] text-white shadow-sm flex items-center px-1.5 overflow-hidden z-10 cursor-pointer hover:opacity-90 transition-opacity
                                          ${(() => {
                                          const b = bookingBar.booking;
                                          const status = bookingBar.roomStatus || b.status;

                                          // Confirmed = Green (Tailwind green-600)
                                          if (status === 'confirmed') return '!bg-[#22c55e]';

                                          // Checked In / Occupied = Red (Tailwind red-600)
                                          if (status === 'checked_in') return '!bg-[#dc2626]';

                                          // Checked Out = Blue (Tailwind blue-600)
                                          if (status === 'checked_out') return '!bg-[#2563eb]';

                                          // Default / Other
                                          return '!bg-gray-400';
                                        })()}
                                        `}
                                      style={{
                                        width: (() => {
                                          const viewStart = date; // Current cell date is the "start" of this segment
                                          const effectiveStart = bookingBar.startDate < viewStart ? viewStart : bookingBar.startDate;

                                          // Calculate max visible end date (exclusive)
                                          const maxVisibleEnd = new Date(dateRange.end);
                                          maxVisibleEnd.setDate(maxVisibleEnd.getDate() + 1);

                                          // Clamp effective end logic
                                          const effectiveEnd = bookingBar.endDate > maxVisibleEnd ? maxVisibleEnd : bookingBar.endDate;

                                          const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
                                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                          return `calc(${Math.max(0, diffDays)} * 100% - 4px)`;
                                        })()
                                      }}
                                    >
                                      {/* Left Icon - Source/User */}
                                      <div className="mr-1.5 opacity-80">
                                        <UserIcon className="w-3 h-3" />
                                      </div>

                                      <span className="font-semibold truncate mr-1">
                                        {bookingBar.booking.guestDetails.firstName} {bookingBar.booking.guestDetails.lastName}
                                      </span>

                                      {/* Right Icon - Dynamic Payment Indicator */}
                                      {(() => {
                                        const isPending = (bookingBar.booking.paymentStatus === 'pending') || (bookingBar.booking.totalAmount > (bookingBar.booking.paidAmount || 0));

                                        return (
                                          <div className={`flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center ml-auto ${isPending ? 'bg-red-100' : 'bg-green-100'}`}>
                                            <span className={`text-[8px] font-bold ${isPending ? 'text-red-700' : 'text-green-700'}`}>$</span>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                  {!bookingBar && avail?.blocked && (() => {
                                    const roomStatus = getRoomStatus(room.roomName);
                                    const isInMaintenance = roomStatus?.status === 'maintenance';

                                    return (
                                      <div className="absolute inset-0 bg-[#1A1A40] flex items-center justify-center group overflow-hidden border border-black">
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
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => {
              setShowBookingPanel(false);
              setSelectedBooking(null);
            }}
          />
          <div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#003B95] text-white rounded flex items-center justify-center font-bold text-lg">
                      {selectedBooking.guestDetails.firstName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {selectedBooking.guestDetails.prefix} {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName}
                      </h3>
                      <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                          📍 {selectedBooking.address?.country || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          📞 {selectedBooking.guestDetails.phone}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[250px]" title={selectedBooking.guestDetails.email}>
                          ✉️ {selectedBooking.guestDetails.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowBookingPanel(false);
                      setSelectedBooking(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Actions Toolbar */}
                <div className="flex gap-2 mt-4">

                  <div className="relative group">
                    <button
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded shadow-sm transition-colors ${selectedBooking.status === 'confirmed' // "jb booking confirm hai to print nhi hota" - USER
                        ? 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed'
                        : 'bg-white border border-blue-500 text-blue-600 hover:bg-blue-50'
                        }`}
                      disabled={selectedBooking.status === 'confirmed'}
                      onClick={() => {
                        if (selectedBooking.status !== 'confirmed') {
                          setShowRegistrationModal(true);
                        }
                      }}
                    >
                      Print / Send <ChevronDownIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {(() => {
                  const nights = calculateNights(selectedBooking.checkIn, selectedBooking.checkOut);
                  const guestsCount = selectedBooking.guests || { adults: 0, children: 0, rooms: 1 };

                  // Status Badge Logic
                  const statusColor =
                    selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                      selectedBooking.status === 'checked_in' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                        selectedBooking.status === 'checked_out' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          'bg-yellow-100 text-yellow-700 border-yellow-200';

                  // Status Display Name
                  const statusName =
                    selectedBooking.status === 'checked_in' ? 'Occupied' : // Or Stayover
                      selectedBooking.status === 'confirmed' ? 'Confirmed Reservation' :
                        selectedBooking.status.replace('_', ' ');

                  return (
                    <div className="space-y-6">

                      {/* Data Grid */}
                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">

                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Reservation Number</p>
                          <p className="font-semibold text-gray-900">{selectedBooking.bookingId || '726'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Voucher Number</p>
                          <p className="font-semibold text-gray-900 truncate" title={selectedBooking.id}>{selectedBooking.id}</p>
                        </div>

                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Status</p>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded-sm ${statusColor}`}>
                            {statusName}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Arrival Date</p>
                          <p className="font-semibold text-gray-900">{new Date(selectedBooking.checkIn).toLocaleDateString()}</p>
                        </div>

                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Departure Date</p>
                          <p className="font-semibold text-gray-900">{new Date(selectedBooking.checkOut).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Booking Date</p>
                          <p className="font-semibold text-gray-900 text-xs">{selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : 'N/A'}</p>
                        </div>

                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Room Type</p>
                          <p className="font-semibold text-gray-900">{selectedBooking.rooms[0]?.suiteType}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Room Number</p>
                          <p className="font-bold text-gray-900 tracking-wide uppercase">{selectedBooking.rooms[0]?.allocatedRoomType || 'Unassigned'}</p>
                        </div>

                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Rate Plan</p>
                          <p className="font-semibold text-gray-900">{selectedBooking.rooms[0]?.ratePlan || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Pax</p>
                          <div className="flex items-center gap-2 font-semibold text-gray-900">
                            <span className="flex items-center gap-0.5"><UserIcon className="h-3 w-3" /> {guestsCount.adults}</span>
                            <span className="flex items-center gap-0.5 text-xs"><UserIcon className="h-2.5 w-2.5" /> {guestsCount.children}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Avg. Daily Rate</p>
                          <p className="font-semibold text-gray-900">${((selectedBooking.totalAmount || 0) / nights).toFixed(2)}</p>
                        </div>

                      </div>

                      {/* Remarks Section */}
                      <div className="border-t border-gray-100 pt-4 space-y-4">
                        {selectedBooking.notes && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">Remarks</p>
                            <div className="text-xs text-gray-800 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                              <span className="font-bold">Reservation:</span> {selectedBooking.notes}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">Booking Source :</p>
                          <p className="text-xs text-gray-800">
                            {(selectedBooking.source || 'Direct').toUpperCase()}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">Cancellation Policy:</p>
                          <p className="text-xs text-gray-600 leading-snug text-justify">
                            {(() => {
                              const roomName = selectedBooking.rooms[0]?.allocatedRoomType || selectedBooking.rooms[0]?.type;
                              // Need to find the room object to get cancellationFreeDays
                              // We can use the rooms state which is available in component scope
                              const room = rooms.find(r => r.name === roomName || r.roomName === roomName);

                              if (room?.cancellationFreeDays) {
                                const checkIn = new Date(selectedBooking.checkIn);
                                const freeCancelDate = new Date(checkIn);
                                freeCancelDate.setDate(freeCancelDate.getDate() - room.cancellationFreeDays);

                                if (new Date() < freeCancelDate) {
                                  return `Free cancellation until ${freeCancelDate.toLocaleDateString()}. After that, the total price of the reservation will be charged.`;
                                } else {
                                  return `Cancellation period has ended. The total price of the reservation will be charged if cancelled.`;
                                }
                              }
                              return "Standard Hotel Policy: Free cancellation until 48 hours before arrival.";
                            })()}
                          </p>
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>

              {/* Footer Summary */}
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center text-gray-900 font-bold">
                    <span>Total</span>
                    <span>${selectedBooking.totalAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-900 font-bold">
                    <span>Paid</span>
                    <span>${selectedBooking.paidAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-500 font-bold text-base mt-2 pt-2 border-t border-gray-200">
                    <span>Balance</span>
                    <span>${((selectedBooking.totalAmount || 0) - (selectedBooking.paidAmount || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* Registration Card Modal */}
      {showRegistrationModal && selectedBooking && (
        <RegistrationCardModal
          booking={selectedBooking}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}

      {/* Cell Click Popup - Walk In / Maintenance Block */}
      {showCellPopup && selectedCell && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowCellPopup(false)}></div>
          <div
            className="fixed z-50 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-200 w-[280px] text-sm font-sans"
            style={{
              top: popupPosition.y,
              left: popupPosition.x,
              transform: 'translate(-50%, -100%)',
              marginTop: '-12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arrow Pointer */}
            <div
              className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"
            ></div>

            {/* Header */}
            <div className="relative p-5 pb-4">
              <button
                onClick={() => setShowCellPopup(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-2 gap-8 mb-2">
                <div>
                  <p className="text-gray-900 font-semibold text-sm mb-1">Arrival</p>
                  <p className="text-gray-600 text-sm">
                    {new Date(selectedCell.date).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-900 font-semibold text-sm mb-1">Departure</p>
                  <p className="text-gray-600 text-sm">
                    {(() => {
                      const d = new Date(selectedCell.date);
                      d.setDate(d.getDate() + 1);
                      return d.toLocaleDateString('en-GB');
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 space-y-3">
              <button
                onClick={() => {
                  const d = new Date(selectedCell.date);
                  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                  const startStr = d.toISOString().split('T')[0];

                  const endDate = new Date(selectedCell.date);
                  endDate.setDate(endDate.getDate() + 1);
                  endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());
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
                className="w-full text-center py-2.5 text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded border border-gray-200 transition-all text-sm font-medium"
              >
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
                className="w-full text-center py-2.5 text-gray-700   bg-white hover:bg-blue-50 hover:border-blue-200 rounded border border-gray-200 transition-all text-sm font-medium"
              >
                Maintenance Block
              </button>
            </div>
          </div>
        </>
      )}


      {/* Maintenance Block Modal */}
      {showMaintenanceBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowMaintenanceBlock(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Mark Room for Maintenance</h3>
              <button onClick={() => setShowMaintenanceBlock(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Room: {maintenanceBlockForm.roomName}</p>
                <p className="text-xs text-gray-500">{new Date(maintenanceBlockForm.startDate).toLocaleDateString()} - {new Date(maintenanceBlockForm.endDate).toLocaleDateString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={maintenanceBlockForm.reason}
                  onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, reason: e.target.value })}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 border"
                >
                  <option value="">Select a reason</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Repair">Repair</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {maintenanceBlockForm.reason === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Reason</label>
                  <textarea
                    value={maintenanceBlockForm.customReason}
                    onChange={(e) => setMaintenanceBlockForm({ ...maintenanceBlockForm, customReason: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 border"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMaintenanceBlock(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const reason = maintenanceBlockForm.reason === 'Other' ? maintenanceBlockForm.customReason : maintenanceBlockForm.reason;
                      const success = await markRoomForMaintenance(
                        maintenanceBlockForm.roomName,
                        new Date(maintenanceBlockForm.startDate),
                        new Date(maintenanceBlockForm.endDate),
                        reason
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
                  disabled={!maintenanceBlockForm.reason || (maintenanceBlockForm.reason === 'Other' && !maintenanceBlockForm.customReason)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded shadow-lg shadow-red-100"
                >
                  Confirm Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reservation / Walk-In Modal */}
      <QuickReservationModal
        isOpen={showAssignRoom}
        onClose={() => setShowAssignRoom(false)}
        onSubmit={handleQuickReservationSubmit}
        initialDate={assignRoomForm.startDate ? new Date(assignRoomForm.startDate) : undefined}
        initialSuiteType={assignRoomForm.suiteType}
        initialRoomName={assignRoomForm.roomName}
        roomTypes={roomTypes}
        availableRooms={enrichedRooms}
        bookings={bookings}
        loading={loading}
      />
    </div >
  );
}
