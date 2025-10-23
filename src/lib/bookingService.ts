import { 
  collection, 
  // addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where
} from 'firebase/firestore';
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

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // For demo purposes, simulate a booking creation
    console.log('Creating booking:', bookingData);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a mock booking ID
    return `booking_${Date.now()}`;
    
    // Uncomment below when Firebase is properly configured
    // const docRef = await addDoc(collection(db, 'bookings'), {
    //   ...bookingData,
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // });
    // return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getBookings = async (): Promise<Booking[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'bookings'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Booking[];
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'bookings'), where('__name__', '==', id))
    );
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as Booking;
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
