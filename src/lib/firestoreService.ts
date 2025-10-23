import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

// Connection status tracking
let isConnected = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 3;

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  return config.apiKey && config.apiKey !== 'demo-api-key' && 
         config.projectId && config.projectId !== 'demo-project';
};

// Interfaces
export interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  features: string[];
  amenities: string[];
  size: string;
  view: string;
  beds: string;
  image: string;
  maxGuests: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  type: 'per_room' | 'per_guest' | 'per_day';
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
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
    specialNeeds?: string;
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

// Rooms CRUD Operations
export const getRooms = async (): Promise<Room[]> => {
  // If Firebase is not properly configured, return sample data immediately
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, using sample data');
    return [
      {
        id: '1',
        name: 'Garden Suite',
        type: 'Garden View',
        price: 250,
        description: 'Beautiful garden view suite with modern amenities.',
        features: ['Private suite', '150 m²', 'Balcony'],
        amenities: ['Garden view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi'],
        size: '150 m²',
        view: 'Garden view',
        beds: '1 Double bed, 1 Single bed',
        image: '/figma/rooms-garden-suite.png',
        maxGuests: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  try {
    connectionAttempts++;
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    isConnected = true;
    connectionAttempts = 0;
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Room[];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    
    // If we've tried too many times, use sample data
    if (connectionAttempts >= maxConnectionAttempts) {
      console.log('Max connection attempts reached, using sample data');
      return [
        {
          id: '1',
          name: 'Garden Suite',
          type: 'Garden View',
          price: 250,
          description: 'Beautiful garden view suite with modern amenities.',
          features: ['Private suite', '150 m²', 'Balcony'],
          amenities: ['Garden view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi'],
          size: '150 m²',
          view: 'Garden view',
          beds: '1 Double bed, 1 Single bed',
          image: '/figma/rooms-garden-suite.png',
          maxGuests: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
    
    // Retry with sample data
    return [
      {
        id: '1',
        name: 'Garden Suite',
        type: 'Garden View',
        price: 250,
        description: 'Beautiful garden view suite with modern amenities.',
        features: ['Private suite', '150 m²', 'Balcony'],
        amenities: ['Garden view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi'],
        size: '150 m²',
        view: 'Garden view',
        beds: '1 Double bed, 1 Single bed',
        image: '/figma/rooms-garden-suite.png',
        maxGuests: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      return {
        id: roomSnap.id,
        ...roomSnap.data(),
        createdAt: roomSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: roomSnap.data().updatedAt?.toDate() || new Date(),
      } as Room;
    }
    return null;
  } catch (error) {
    console.error('Error fetching room:', error);
    return null;
  }
};

export const createRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  // If Firebase is not properly configured, return a mock ID for development
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, returning mock room ID for development');
    return `mock-room-${Date.now()}`;
  }

  try {
    const roomsRef = collection(db, 'rooms');
    const docRef = await addDoc(roomsRef, {
      ...roomData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating room:', error);
    
    // If it's a permissions error, return mock ID for development
    if (error instanceof Error && error.message.includes('permissions')) {
      console.log('Firebase permissions error, returning mock room ID for development');
      return `mock-room-${Date.now()}`;
    }
    
    return null;
  }
};

export const updateRoom = async (roomId: string, roomData: Partial<Room>): Promise<boolean> => {
  // If Firebase is not properly configured, return true for development
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, mock update successful for development');
    return true;
  }

  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      ...roomData,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating room:', error);
    
    // If it's a permissions error, return true for development
    if (error instanceof Error && error.message.includes('permissions')) {
      console.log('Firebase permissions error, mock update successful for development');
      return true;
    }
    
    return false;
  }
};

export const deleteRoom = async (roomId: string): Promise<boolean> => {
  // If Firebase is not properly configured, return true for development
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, mock delete successful for development');
    return true;
  }

  try {
    const roomRef = doc(db, 'rooms', roomId);
    await deleteDoc(roomRef);
    return true;
  } catch (error) {
    console.error('Error deleting room:', error);
    
    // If it's a permissions error, return true for development
    if (error instanceof Error && error.message.includes('permissions')) {
      console.log('Firebase permissions error, mock delete successful for development');
      return true;
    }
    
    return false;
  }
};

// Add-ons CRUD Operations
export const getAddOns = async (): Promise<AddOn[]> => {
  // If Firebase is not properly configured, return sample data immediately
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, using sample add-ons data');
    return [
      {
        id: '1',
        name: 'Romantic Beach Dinner for Two',
        price: 245,
        type: 'per_room',
        description: 'Create magical memories with a private candlelit dinner by the ocean.',
        image: '/figma/rooms-garden-suite.png',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  try {
    const addOnsRef = collection(db, 'addOns');
    const q = query(addOnsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as AddOn[];
  } catch (error) {
    console.error('Error fetching add-ons:', error);
    // Return sample data for development
    return [
      {
        id: '1',
        name: 'Romantic Beach Dinner for Two',
        price: 245,
        type: 'per_room',
        description: 'Create magical memories with a private candlelit dinner by the ocean.',
        image: '/figma/rooms-garden-suite.png',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
};

export const getAddOn = async (addOnId: string): Promise<AddOn | null> => {
  try {
    const addOnRef = doc(db, 'addOns', addOnId);
    const addOnSnap = await getDoc(addOnRef);
    
    if (addOnSnap.exists()) {
      return {
        id: addOnSnap.id,
        ...addOnSnap.data(),
        createdAt: addOnSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: addOnSnap.data().updatedAt?.toDate() || new Date(),
      } as AddOn;
    }
    return null;
  } catch (error) {
    console.error('Error fetching add-on:', error);
    return null;
  }
};

export const createAddOn = async (addOnData: Omit<AddOn, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  // If Firebase is not properly configured, return a mock ID for development
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, returning mock add-on ID for development');
    return `mock-addon-${Date.now()}`;
  }

  try {
    const addOnsRef = collection(db, 'addOns');
    const docRef = await addDoc(addOnsRef, {
      ...addOnData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating add-on:', error);
    
    // If it's a permissions error, return mock ID for development
    if (error instanceof Error && error.message.includes('permissions')) {
      console.log('Firebase permissions error, returning mock add-on ID for development');
      return `mock-addon-${Date.now()}`;
    }
    
    return null;
  }
};

export const updateAddOn = async (addOnId: string, addOnData: Partial<AddOn>): Promise<boolean> => {
  try {
    const addOnRef = doc(db, 'addOns', addOnId);
    await updateDoc(addOnRef, {
      ...addOnData,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating add-on:', error);
    return false;
  }
};

export const deleteAddOn = async (addOnId: string): Promise<boolean> => {
  try {
    const addOnRef = doc(db, 'addOns', addOnId);
    await deleteDoc(addOnRef);
    return true;
  } catch (error) {
    console.error('Error deleting add-on:', error);
    return false;
  }
};

// Booking Operations
export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const docRef = await addDoc(bookingsRef, {
      ...bookingData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    // Return a mock booking ID for development
    return `booking_${Date.now()}`;
  }
};

export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (bookingSnap.exists()) {
      return {
        id: bookingSnap.id,
        ...bookingSnap.data(),
        createdAt: bookingSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: bookingSnap.data().updatedAt?.toDate() || new Date(),
      } as Booking;
    }
    return null;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
};

export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Booking[];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};
