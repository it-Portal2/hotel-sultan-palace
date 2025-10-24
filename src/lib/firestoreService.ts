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
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  address: {
    country: string;
    city: string;
    zipCode: string;
    address1: string;
    address2: string;
  };
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
  rooms: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  addOns: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  bookingId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Sample data
const sampleRooms: Room[] = [
  {
    id: '1',
    name: 'Garden suite',
    type: 'Garden suite',
    price: 250,
    description: 'This suite\'s standout feature is the Garden with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.',
    features: ['Private suite', '150 m²', 'Balcony'],
    amenities: ['Garden view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi'],
    size: '150 m²',
    view: 'Garden view',
    beds: '1 Double bed, 1 Single bed',
    image: '/figma/rooms-garden-suite.png',
    maxGuests: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Ocean suite',
    type: 'Ocean suite',
    price: 300,
    description: 'This suite\'s standout feature is the Ocean with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with ocean views. The unit has 2 beds.',
    features: ['Private suite', '150 m²', 'Balcony'],
    amenities: ['Ocean view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi'],
    size: '150 m²',
    view: 'Ocean view',
    beds: '1 Double bed, 1 Single bed',
    image: '/figma/rooms-ocean-suite.png',
    maxGuests: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Imperial Suite',
    type: 'Imperial suite',
    price: 350,
    description: 'This suite\'s standout feature is the pool with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.',
    features: ['Private suite', '150 m²', 'Balcony'],
    amenities: ['Garden view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi'],
    size: '150 m²',
    view: 'Garden view',
    beds: '2 Double bed, 1 Single bed',
    image: '/figma/rooms-imperial-suite.png',
    maxGuests: 4,
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
  console.log('Using sample rooms data');
  return sampleRooms;
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  console.log('Getting room by ID:', roomId);
  const room = sampleRooms.find(r => r.id === roomId);
  return room || null;
};

export const createRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  console.log('Mock room creation successful');
  return `mock-room-${Date.now()}`;
};

export const updateRoom = async (roomId: string, roomData: Partial<Room>): Promise<boolean> => {
  console.log('Mock room update successful');
  return true;
};

export const deleteRoom = async (roomId: string): Promise<boolean> => {
  console.log('Mock room deletion successful');
  return true;
};

// Add-ons CRUD Operations
export const getAddOns = async (): Promise<AddOn[]> => {
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
    return [];
  }
};

export const createAddOn = async (addOnData: Omit<AddOn, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
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
  console.log('Mock booking creation successful');
  return `mock-booking-${Date.now()}`;
};

export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  console.log('Mock booking fetch');
  return null;
};

export const getAllBookings = async (): Promise<Booking[]> => {
  console.log('Mock get all bookings');
  return [];
};

export const updateBooking = async (bookingId: string, bookingData: Partial<Booking>): Promise<boolean> => {
  console.log('Mock booking update successful');
  return true;
};