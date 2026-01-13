import { createBooking, getBooking, getAllBookings, Booking, getRoomTypes, SuiteType } from './firestoreService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { checkDailyAvailability, reserveRoomInInventory, releaseRoomFromInventory } from './availabilityService';

// Using Booking interface from firestoreService

// Wrapper for availability check using new service
export const getAvailableRoomTypes = async (
  suiteType: SuiteType,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): Promise<string[]> => {
  try {
    const sDate = new Date(checkIn);
    const eDate = new Date(checkOut);

    // Use the new daily inventory service
    const availableRooms = await checkDailyAvailability(sDate, eDate, suiteType);

    // If we need to exclude a specific booking (e.g. for modifications), 
    // the daily inventory logic is binary (occupied or not). 
    // If the booking IS the one occupying it, we might get a false negative.
    // However, since we are moving to a localized inventory, modify logic typically involves:
    // 1. Release old dates
    // 2. Check new dates

    return availableRooms;
  } catch (error) {
    console.error('Error getting available room types:', error);
    return [];
  }
};

// Get available room count for a suite on specific dates
export const getAvailableRoomCount = async (
  suiteType: SuiteType,
  checkIn: string,
  checkOut: string
): Promise<number> => {
  try {
    const available = await getAvailableRoomTypes(suiteType, checkIn, checkOut);
    return available.length;
  } catch (error) {
    console.error('Error getting available room count:', error);
    return 0;
  }
};

// Auto-allocate room types for a booking
export const allocateRoomTypes = async (
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>> => {
  try {
    const allocatedPerSuite: Record<SuiteType, Set<string>> = {
      'Garden Suite': new Set(),
      'Imperial Suite': new Set(),
      'Ocean Suite': new Set()
    };

    const allocatedRooms = [];
    const sDate = new Date(bookingData.checkIn);
    const eDate = new Date(bookingData.checkOut);

    for (const room of bookingData.rooms) {
      // Determine suite type
      let suiteType: SuiteType | undefined;
      const roomTypeLower = room.type.toLowerCase();
      if (roomTypeLower.includes('garden')) suiteType = 'Garden Suite';
      else if (roomTypeLower.includes('imperial')) suiteType = 'Imperial Suite';
      else if (roomTypeLower.includes('ocean')) suiteType = 'Ocean Suite';

      if (!suiteType) {
        allocatedRooms.push(room);
        continue;
      }

      // Check availability using new service, avoiding re-fetching for every room in loop if possible?
      // For simplicity/correctness, we fetch. The service overhead is low (Firestore cache helps).
      const available = await checkDailyAvailability(sDate, eDate, suiteType);

      if (available.length === 0) {
        console.warn(`No available room types for ${suiteType}`);
        allocatedRooms.push({ ...room, suiteType });
        continue;
      }

      // Filter already allocated in THIS booking
      const remainingAvailable = available.filter(
        name => !allocatedPerSuite[suiteType!].has(name)
      );

      const candidates = remainingAvailable.length > 0 ? remainingAvailable : available;

      // Random allocation
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const allocatedRoomType = candidates[randomIndex];

      allocatedPerSuite[suiteType].add(allocatedRoomType);

      allocatedRooms.push({
        ...room,
        suiteType,
        allocatedRoomType
      });
    }

    return { ...bookingData, rooms: allocatedRooms };
  } catch (error) {
    console.error('Error allocating room types:', error);
    return bookingData;
  }
};

// Check if rooms are available before booking
export const checkRoomAvailability = async (
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ available: boolean; message: string; unavailableSuites: SuiteType[] }> => {
  try {
    const unavailableSuites: SuiteType[] = [];
    const sDate = new Date(bookingData.checkIn);
    const eDate = new Date(bookingData.checkOut);

    // Group requested rooms by suite type
    const requestedSuites: Record<string, number> = {};
    for (const room of bookingData.rooms) {
      let suiteType: SuiteType | undefined;
      const low = room.type.toLowerCase();
      if (low.includes('garden')) suiteType = 'Garden Suite';
      else if (low.includes('imperial')) suiteType = 'Imperial Suite';
      else if (low.includes('ocean')) suiteType = 'Ocean Suite';

      if (suiteType) {
        requestedSuites[suiteType] = (requestedSuites[suiteType] || 0) + 1;
      }
    }

    // Check availability for each suite type
    for (const [suite, count] of Object.entries(requestedSuites)) {
      const availableNames = await checkDailyAvailability(sDate, eDate, suite as SuiteType);
      if (availableNames.length < count) {
        unavailableSuites.push(suite as SuiteType);
      }
    }

    if (unavailableSuites.length > 0) {
      const suiteNames = unavailableSuites.join(', ');
      return {
        available: false,
        message: `Sorry, not enough rooms available for ${suiteNames} on selected dates.`,
        unavailableSuites
      };
    }

    return { available: true, message: '', unavailableSuites: [] };
  } catch (error) {
    console.error('Error checking room availability:', error);
    return { available: false, message: 'Error checking availability.', unavailableSuites: [] };
  }
};

export const createBookingService = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // 1. Check availability
    const availability = await checkRoomAvailability(bookingData);
    if (!availability.available) {
      throw new Error(availability.message);
    }

    // 2. Allocate Rooms
    const bookingWithAllocatedRooms = await allocateRoomTypes(bookingData);

    // 3. Prepare Firestore Data
    const { Timestamp } = await import('firebase/firestore');
    const checkInDate = new Date(bookingWithAllocatedRooms.checkIn);
    const checkOutDate = new Date(bookingWithAllocatedRooms.checkOut);

    const finalBookingData = {
      ...bookingWithAllocatedRooms,
      checkIn: Timestamp.fromDate(checkInDate),
      checkOut: Timestamp.fromDate(checkOutDate),
      checkInTime: bookingWithAllocatedRooms.checkInTime || new Date(checkInDate.toDateString() + ' 12:00:00'),
    };

    // 4. Create Booking
    const bookingId = await createBooking(finalBookingData as any);
    if (!bookingId) throw new Error('Failed to create booking');

    // 5. Reserve in Daily Inventory (NEW)
    // We reserve specifically the allocated rooms
    if (bookingWithAllocatedRooms.rooms) {
      for (const room of bookingWithAllocatedRooms.rooms) {
        if (room.allocatedRoomType) {
          await reserveRoomInInventory(checkInDate, checkOutDate, room.allocatedRoomType);
        }
      }
    }

    // 6. Update Legacy Room Status (Optional, keeping for backward compatibility/Dashboard)
    if (bookingWithAllocatedRooms.rooms) {
      const { getRoomStatus, updateRoomStatus, createRoomStatus } = await import('./firestoreService');
      for (const room of bookingWithAllocatedRooms.rooms) {
        if (room.allocatedRoomType && room.suiteType) {
          try {
            // We still update the 'current state' of the room if needed for housekeeping dashboard 
            // but strict availability is now handled by inventory.
            const roomStatus = await getRoomStatus(room.allocatedRoomType);
            if (roomStatus) {
              await updateRoomStatus(roomStatus.id, {
                status: 'reserved',
                currentBookingId: bookingId,
              });
            } else {
              await createRoomStatus({
                roomName: room.allocatedRoomType,
                suiteType: room.suiteType,
                status: 'reserved',
                currentBookingId: bookingId,
                housekeepingStatus: 'clean',
              });
            }
          } catch (e) { console.error(e); }
        }
      }
    }

    return bookingId;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getBookings = async (): Promise<Booking[]> => {
  return await getAllBookings();
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  return await getBooking(id);
};

export const updateBooking = async (id: string, updates: Partial<Booking>): Promise<void> => {
  if (!db) throw new Error('Firestore not available');
  const bookingRef = doc(db, 'bookings', id);
  await updateDoc(bookingRef, { ...updates, updatedAt: new Date() });
};

export const cancelBooking = async (id: string): Promise<void> => {
  try {
    const booking = await getBooking(id);
    if (!booking) throw new Error('Booking not found');

    await updateBooking(id, { status: 'cancelled' });

    // Release from Inventory (NEW)
    if (booking.rooms) {
      // Helper to safely convert to Date
      const toDate = (val: string | Date | { toDate: () => Date } | { seconds: number }) => {
        if (typeof val === 'string') return new Date(val);
        if (val instanceof Date) return val;
        if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
          return (val as any).toDate();
        }
        return new Date(val as any);
      };

      const safeStart = toDate(booking.checkIn as any);
      const safeEnd = toDate(booking.checkOut as any);

      for (const room of booking.rooms) {
        if (room.allocatedRoomType) {
          await releaseRoomFromInventory(safeStart, safeEnd, room.allocatedRoomType);
        }
      }
    }

    // Release Legacy Room Status
    // ... (Keeping existing legacy cleanup logic if needed, simplified below)
    if (booking.rooms) {
      const { getRoomStatus, updateRoomStatus } = await import('./firestoreService');
      for (const room of booking.rooms) {
        if (room.allocatedRoomType) {
          try {
            const rs = await getRoomStatus(room.allocatedRoomType);
            if (rs && rs.currentBookingId === id) {
              await updateRoomStatus(rs.id, {
                status: 'available',
                currentBookingId: undefined,
                housekeepingStatus: 'clean'
              });
            }
          } catch (e) { }
        }
      }
    }

  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

export const confirmBooking = async (id: string): Promise<void> => {
  await updateBooking(id, { status: 'confirmed' });
};
