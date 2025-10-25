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
  // Essential booking dates and guest count
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
  
  // User contact and personal details
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    prefix: string;
  };
  
  // User address details
  address: {
    country: string;
    city: string;
    zipCode: string;
    address1: string;
    address2: string;
  };
  
  // Reservation guest details
  reservationGuests: Array<{
    firstName: string;
    lastName: string;
    specialNeeds: string;
  }>;
  
  // Essential room information only
  rooms: Array<{
    type: string;
    price: number;
  }>;
  
  // Essential add-ons information
  addOns: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  
  // Financial details
  totalAmount: number;
  bookingId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Sample data for fallback
const sampleRooms: Room[] = [
  {
    id: '1',
    name: 'Ocean Suite',
    type: 'Suite',
    price: 450,
    description: 'Luxurious ocean-facing suite with panoramic views and premium amenities.',
    features: ['Ocean View', 'Private Balcony', 'King Bed'],
    amenities: ['WiFi', 'Air Conditioning', 'Mini Bar', 'Room Service'],
    size: '65 sqm',
    view: 'Ocean',
    beds: '1 King Bed',
    image: '/figma/rooms-ocean-suite.png',
    maxGuests: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Garden Villa',
    type: 'Villa',
    price: 350,
    description: 'Spacious villa surrounded by lush tropical gardens.',
    features: ['Garden View', 'Private Pool', 'Two Bedrooms'],
    amenities: ['WiFi', 'Air Conditioning', 'Kitchenette', 'Private Pool'],
    size: '85 sqm',
    view: 'Garden',
    beds: '2 Queen Beds',
    image: '/figma/rooms-garden-suite.png',
    maxGuests: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Imperial Suite',
    type: 'Suite',
    price: 600,
    description: 'The most luxurious suite with premium amenities and stunning views.',
    features: ['Panoramic View', 'Private Terrace', 'Jacuzzi'],
    amenities: ['WiFi', 'Air Conditioning', 'Butler Service', 'Jacuzzi'],
    size: '120 sqm',
    view: 'Ocean & Garden',
    beds: '1 King Bed + Sofa Bed',
    image: '/figma/rooms-imperial-suite.png',
    maxGuests: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleAddOns: AddOn[] = [
  {
    id: '1',
    name: 'Romantic Beach Dinner',
    price: 150,
    type: 'per_room',
    description: 'Private beach dinner for two with candlelight and champagne.',
    image: '/addons/romantic.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Daybed Classic Experience',
    price: 80,
    type: 'per_room',
    description: 'Relax on a private daybed with premium service.',
    image: '/addons/Daybed.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Couples Massage Retreat',
    price: 200,
    type: 'per_room',
    description: 'Luxurious couples massage in a private spa setting.',
    image: '/addons/cuople.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Private Airport Transfer',
    price: 60,
    type: 'per_room',
    description: 'Private transfer to and from the airport.',
    image: '/addons/private.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Mnemba Atoll Snorkeling',
    price: 120,
    type: 'per_guest',
    description: 'Snorkeling adventure at the beautiful Mnemba Atoll.',
    image: '/addons/mnemba.png',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Add-on images - exact mapping for each add-on
const addOnImages = {
  romanticDinner: '/addons/romantic.png',     
  daybedExperience: '/addons/Daybed.png',      
  couplesMassage: '/addons/cuople.png',         
  privateAirport: '/addons/private.png',    
  mnembaSnorkeling: '/addons/mnemba.png'        
};

// Rooms CRUD Operations
export const getRooms = async (): Promise<Room[]> => {
  // During build time or if db is not available, return sample data
  if (typeof window === 'undefined' || !db) {
    return sampleRooms;
  }

  try {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Room;
    });
  } catch (error) {
    console.error('Error fetching rooms from Firestore:', error);
    // Fallback to sample data if Firestore fails
    console.log('Falling back to sample rooms data');
    return sampleRooms;
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  // During build time or if db is not available, return sample data
  if (typeof window === 'undefined' || !db) {
    return sampleRooms.find(room => room.id === roomId) || null;
  }

  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      const data = roomSnap.data();
      return {
        id: roomSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Room;
    }
    return null;
  } catch (error) {
    console.error('Error fetching room from Firestore:', error);
    // Fallback to sample data if Firestore fails
    console.log('Falling back to sample room data');
    return sampleRooms.find(room => room.id === roomId) || null;
  }
};

export const createRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) {
    console.warn('Firestore not available, cannot create room');
    return null;
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
    return null;
  }
};

export const updateRoom = async (roomId: string, roomData: Partial<Room>): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not available, cannot update room');
    return false;
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
    return false;
  }
};

export const deleteRoom = async (roomId: string): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not available, cannot delete room');
    return false;
  }

  try {
    const roomRef = doc(db, 'rooms', roomId);
    await deleteDoc(roomRef);
  return true;
  } catch (error) {
    console.error('Error deleting room:', error);
    return false;
  }
};

// Add-ons CRUD Operations
export const getAddOns = async (): Promise<AddOn[]> => {
  // During build time or if db is not available, return sample data
  if (typeof window === 'undefined' || !db) {
    return sampleAddOns;
  }

  try {
    const addOnsRef = collection(db, 'addOns');
    const q = query(addOnsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const name = data.name?.toLowerCase() || '';
      
      // Match image based on exact add-on names
      let image = addOnImages.romanticDinner; // default
      if (name.includes('romantic') && name.includes('beach') && name.includes('dinner')) {
        image = addOnImages.romanticDinner;
      } else if (name.includes('daybed') && name.includes('classic') && name.includes('experience')) {
        image = addOnImages.daybedExperience;
      } else if (name.includes('couples') && name.includes('massage') && name.includes('retreat')) {
        image = addOnImages.couplesMassage;
      } else if (name.includes('private') && name.includes('airport') && name.includes('transfer')) {
        image = addOnImages.privateAirport;
      } else if (name.includes('mnemba') && name.includes('atoll') && name.includes('snorkeling')) {
        image = addOnImages.mnembaSnorkeling;
      }
      
      return {
        id: doc.id,
        ...data,
        image: image,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }) as AddOn[];
  } catch (error) {
    console.error('Error fetching add-ons from Firestore:', error);
    // Fallback to sample data if Firestore fails
    console.log('Falling back to sample add-ons data');
    return sampleAddOns;
  }
};

export const createAddOn = async (addOnData: Omit<AddOn, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) {
    console.warn('Firestore not available, cannot create add-on');
    return null;
  }

  try {
    const name = addOnData.name?.toLowerCase() || '';
    
    // Match image based on specific add-on names
    let image = addOnImages.romanticDinner; // default
    if (name.includes('romantic') && name.includes('beach') && name.includes('dinner')) {
      image = addOnImages.romanticDinner;
    } else if (name.includes('daybed') && name.includes('classic') && name.includes('experience')) {
      image = addOnImages.daybedExperience;
    } else if (name.includes('couples') && name.includes('massage') && name.includes('retreat')) {
      image = addOnImages.couplesMassage;
    } else if (name.includes('private') && name.includes('airport') && name.includes('transfer')) {
      image = addOnImages.privateAirport;
    } else if (name.includes('mnemba') && name.includes('atoll') && name.includes('snorkeling')) {
      image = addOnImages.mnembaSnorkeling;
    }
    
    const addOnsRef = collection(db, 'addOns');
    const docRef = await addDoc(addOnsRef, {
      ...addOnData,
      image: image,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating add-on:', error);
    return null;
  }
};

export const updateAddOn = async (addOnId: string, addOnData: Partial<AddOn>): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not available, cannot update add-on');
    return false;
  }

  try {
    const name = addOnData.name?.toLowerCase() || '';
    
    // Match image based on specific add-on names
    let image = addOnImages.romanticDinner; // default
    if (name.includes('romantic') && name.includes('beach') && name.includes('dinner')) {
      image = addOnImages.romanticDinner;
    } else if (name.includes('daybed') && name.includes('classic') && name.includes('experience')) {
      image = addOnImages.daybedExperience;
    } else if (name.includes('couples') && name.includes('massage') && name.includes('retreat')) {
      image = addOnImages.couplesMassage;
    } else if (name.includes('private') && name.includes('airport') && name.includes('transfer')) {
      image = addOnImages.privateAirport;
    } else if (name.includes('mnemba') && name.includes('atoll') && name.includes('snorkeling')) {
      image = addOnImages.mnembaSnorkeling;
    }
    
    const addOnRef = doc(db, 'addOns', addOnId);
    await updateDoc(addOnRef, {
      ...addOnData,
      image: image,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating add-on:', error);
    return false;
  }
};

export const deleteAddOn = async (addOnId: string): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not available, cannot delete add-on');
    return false;
  }

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
  if (!db) {
    console.warn('Firestore not available, cannot create booking');
    return null;
  }

  try {
    console.log('Creating booking in Firestore:', bookingData);
    
    const bookingsRef = collection(db, 'bookings');
    const docRef = await addDoc(bookingsRef, {
      ...bookingData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('Booking created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking in Firestore:', error);
    return null;
  }
};

export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  if (!db) {
    console.warn('Firestore not available, cannot get booking');
    return null;
  }

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (bookingSnap.exists()) {
      const data = bookingSnap.data();
      return {
        id: bookingSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Booking;
    }
    return null;
  } catch (error) {
    console.error('Error fetching booking:', error);
  return null;
  }
};

export const getAllBookings = async (): Promise<Booking[]> => {
  if (!db) {
    console.warn('Firestore not available, cannot get bookings');
    return [];
  }

  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Booking;
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
  return [];
  }
};

export const updateBooking = async (bookingId: string, bookingData: Partial<Booking>): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not available, cannot update booking');
    return false;
  }

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      ...bookingData,
      updatedAt: new Date(),
    });
  return true;
  } catch (error) {
    console.error('Error updating booking:', error);
    return false;
  }
};