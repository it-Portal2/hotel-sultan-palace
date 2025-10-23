import { createBooking, getBooking, getAllBookings } from './firestoreService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Booking {
  id?: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
  guestDetails: Array<{
    prefix: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
  }>;
  address: {
    country: string;
    city: string;
    zipCode: string;
    address1: string;
    address2: string;
  };
  room: {
    id: string;
    name: string;
    price: number;
    type: string;
  };
  addOns: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookingId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createBookingService = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const bookingId = await createBooking(bookingData);
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
