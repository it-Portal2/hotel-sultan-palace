import { createBooking, getBooking, getAllBookings, Booking, getRoomTypes, getAllBookings as getAllBookingsFromFirestore, SuiteType } from './firestoreService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Using Booking interface from firestoreService

// Helper function to check if two date ranges overlap
const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 < e2 && s2 < e1;
};

// Get available room types for a suite on specific dates
export const getAvailableRoomTypes = async (
  suiteType: SuiteType,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): Promise<string[]> => {
  try {
    // Get all room types for this suite
    const allRoomTypes = await getRoomTypes(suiteType);
    if (allRoomTypes.length === 0) return [];

    // Get all confirmed and pending bookings that overlap with the date range
    const allBookings = await getAllBookingsFromFirestore();
    const overlappingBookings = allBookings.filter(booking => {
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      if (booking.status === 'cancelled') return false;
      return datesOverlap(booking.checkIn, booking.checkOut, checkIn, checkOut);
    });

    // Track which room types are booked
    const bookedRoomTypes = new Set<string>();
    overlappingBookings.forEach(booking => {
      booking.rooms.forEach(room => {
        if (room.suiteType === suiteType && room.allocatedRoomType) {
          bookedRoomTypes.add(room.allocatedRoomType);
        }
      });
    });

    // Return available room types
    return allRoomTypes
      .filter(rt => !bookedRoomTypes.has(rt.roomName))
      .map(rt => rt.roomName);
  } catch (error) {
    console.error('Error getting available room types:', error);
    return [];
  }
};

// Auto-allocate room types for a booking
export const allocateRoomTypes = async (
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>> => {
  try {
    // Track allocated room types per suite to avoid duplicates in the same booking
    const allocatedPerSuite: Record<SuiteType, Set<string>> = {
      'Garden Suite': new Set(),
      'Imperial Suite': new Set(),
      'Ocean Suite': new Set()
    };

    // Process rooms sequentially to ensure proper tracking of allocated rooms
    const allocatedRooms = [];
    for (const room of bookingData.rooms) {
      // Determine suite type from room type name
      let suiteType: SuiteType | undefined;
      const roomTypeLower = room.type.toLowerCase();
      if (roomTypeLower.includes('garden')) {
        suiteType = 'Garden Suite';
      } else if (roomTypeLower.includes('imperial')) {
        suiteType = 'Imperial Suite';
      } else if (roomTypeLower.includes('ocean')) {
        suiteType = 'Ocean Suite';
      }

      if (!suiteType) {
        // If we can't determine suite type, return room as is
        allocatedRooms.push(room);
        continue;
      }

      // Get available room types for this suite
      const available = await getAvailableRoomTypes(
        suiteType,
        bookingData.checkIn,
        bookingData.checkOut
      );

      if (available.length === 0) {
        // No available room types - this shouldn't happen if booking was validated
        console.warn(`No available room types for ${suiteType} on ${bookingData.checkIn} to ${bookingData.checkOut}`);
        allocatedRooms.push({ ...room, suiteType });
        continue;
      }

      // Filter out already allocated room types for this suite in the current booking
      const remainingAvailable = available.filter(
        roomName => !allocatedPerSuite[suiteType].has(roomName)
      );

      // Use remaining available, or fall back to all available if all are already allocated
      const roomsToChooseFrom = remainingAvailable.length > 0 ? remainingAvailable : available;

      // Randomly allocate from available room types to distribute bookings evenly
      // This prevents the same room type from being booked repeatedly across different bookings
      const randomIndex = Math.floor(Math.random() * roomsToChooseFrom.length);
      const allocatedRoomType = roomsToChooseFrom[randomIndex];
      
      // Track this allocation to avoid duplicates in the same booking
      allocatedPerSuite[suiteType].add(allocatedRoomType);
      
      allocatedRooms.push({
        ...room,
        suiteType,
        allocatedRoomType
      });
    }

    return {
      ...bookingData,
      rooms: allocatedRooms
    };
  } catch (error) {
    console.error('Error allocating room types:', error);
    // Return original booking data if allocation fails
    return bookingData;
  }
};

// Check if rooms are available before booking
export const checkRoomAvailability = async (
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ available: boolean; message: string; unavailableSuites: SuiteType[] }> => {
  try {
    const unavailableSuites: SuiteType[] = [];

    for (const room of bookingData.rooms) {
      // Determine suite type from room type name
      let suiteType: SuiteType | undefined;
      const roomTypeLower = room.type.toLowerCase();
      if (roomTypeLower.includes('garden')) {
        suiteType = 'Garden Suite';
      } else if (roomTypeLower.includes('imperial')) {
        suiteType = 'Imperial Suite';
      } else if (roomTypeLower.includes('ocean')) {
        suiteType = 'Ocean Suite';
      }

      if (!suiteType) {
        continue; // Skip if we can't determine suite type
      }

      // Check availability for this suite
      const available = await getAvailableRoomTypes(
        suiteType,
        bookingData.checkIn,
        bookingData.checkOut
      );

      if (available.length === 0) {
        unavailableSuites.push(suiteType);
      }
    }

    if (unavailableSuites.length > 0) {
      const suiteNames = unavailableSuites.join(', ');
      return {
        available: false,
        message: `Sorry, no rooms are available for ${suiteNames} on the selected dates. Please choose different dates.`,
        unavailableSuites
      };
    }

    return {
      available: true,
      message: '',
      unavailableSuites: []
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    return {
      available: false,
      message: 'Error checking room availability. Please try again.',
      unavailableSuites: []
    };
  }
};

export const createBookingService = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // First check if rooms are available
    const availability = await checkRoomAvailability(bookingData);
    if (!availability.available) {
      throw new Error(availability.message);
    }

    // Auto-allocate room types before creating booking
    const bookingWithAllocatedRooms = await allocateRoomTypes(bookingData);
    
    const bookingId = await createBooking(bookingWithAllocatedRooms);
    if (!bookingId) {
      throw new Error('Failed to create booking');
    }
    return bookingId;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getBookings = async (): Promise<Booking[]> => {
  try {
    return await getAllBookings();
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  try {
    return await getBooking(id);
  } catch (error) {
    console.error('Error getting booking:', error);
    throw error;
  }
};

export const updateBooking = async (id: string, updates: Partial<Booking>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not available');
  }

  try {
    const bookingRef = doc(db, 'bookings', id);
    await updateDoc(bookingRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

export const cancelBooking = async (id: string): Promise<void> => {
  try {
    await updateBooking(id, { status: 'cancelled' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

export const confirmBooking = async (id: string): Promise<void> => {
  try {
    await updateBooking(id, { status: 'confirmed' });
  } catch (error) {
    console.error('Error confirming booking:', error);
    throw error;
  }
};
