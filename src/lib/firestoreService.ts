import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
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
  // Number of days before check-in when cancellation is free
  cancellationFreeDays?: number;
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
    allocatedRoomType?: string; // e.g., "DESERT ROSE", "EUCALYPTUS"
    suiteType?: SuiteType; // e.g., "Garden Suite", "Imperial Suite", "Ocean Suite"
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

export interface ContactForm {
  id: string;
  name: string;
  phone: string;
  email: string;
  website?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingEnquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  website?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

export interface Excursion {
  id: string;
  title: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferBanner {
  id: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryImage {
  id: string;
  imageUrl: string;
  alt?: string;
  title?: string;
  text?: string; // full message for Our Stories page
  author?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Testimonial {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export type GalleryType = 'villas' | 'pool' | 'spa' | 'beach' | 'water_sports' | 'restaurant_bars' | 'facilities';

export interface GalleryImage {
  id: string;
  imageUrl: string;
  type: GalleryType;
  createdAt: Date;
  updatedAt: Date;
}

export type SuiteType = 'Garden Suite' | 'Imperial Suite' | 'Ocean Suite';

export interface RoomType {
  id: string;
  suiteType: SuiteType;
  roomName: string; // e.g., "DESERT ROSE", "EUCALYPTUS", "BOUGAINVILLEA"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sample data for fallback
const sampleRooms: Room[] = [
  {
    id: '1',
    name: 'Imperial Suite',
    type: 'Private Suite',
    price: 350,
    description: 'This suite\'s standout feature is the Ocean with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with ocean views. The unit has 2 beds.',
    features: ['Private Suite', 'Balcony', 'Pool View', 'Garden View'],
    amenities: ['WiFi', 'Air Conditioning', 'Bathroom'],
    size: '150 m²',
    view: 'Ocean',
    beds: '2 Double bed, 1 Single bed',
    image: '/figma/rooms-imperial-suite.png',
    maxGuests: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Ocean Suite',
    type: 'Private Suite',
    price: 300,
    description: 'This suite\'s standout feature is the Ocean with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with ocean views. The unit has 2 beds.',
    features: ['Private Suite', 'Balcony', 'Pool View', 'Garden View'],
    amenities: ['WiFi', 'Air Conditioning', 'Bathroom'],
    size: '150 m²',
    view: 'Ocean',
    beds: '1 Double bed, 1 Single bed',
    image: '/figma/rooms-ocean-suite.png',
    maxGuests: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Garden Suite',
    type: 'Private Suite',
    price: 250,
    description: 'This suite\'s standout feature is the Garden with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.',
    features: ['Private Suite', 'Balcony', 'Pool View', 'Garden View'],
    amenities: ['WiFi', 'Air Conditioning', 'Bathroom'],
    size: '150 m²',
    view: 'Garden',
    beds: '1 Double bed, 1 Single bed',
    image: '/figma/rooms-garden-suite.png',
    maxGuests: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleAddOns: AddOn[] = [
  {
    id: '1',
    name: 'Daybed Classic Experience',
    price: 120,
    type: 'per_day',
    description: 'Reserve your exclusive beach daybed and indulge in personalized service throughout the day. Sip on fresh coconuts, enjoy a tropical fruit platter, and stay refreshed with cooling beverages. Relax with thoughtful amenities like sunscreen, soothing aloe vera, and after-sun care. A fully stocked minibar with wine, beer, and soft drinks completes your seaside retreat.',
    image: '/addons/Daybed.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Romantic Beach Dinner for Two',
    price: 245,
    type: 'per_room',
    description: 'Create magical memories with a private candlelit dinner by the ocean. Enjoy a cozy beachfront setting, personalized service, and a complimentary bottle of sparkling wine to toast the evening under the stars.',
    image: '/addons/romantic.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Mnemba Atoll Snorkeling Tour',
    price: 70,
    type: 'per_guest',
    description: 'Embark on a breathtaking snorkeling adventure at Mnemba Atoll. Explore crystal-clear waters teeming with vibrant coral reefs and colorful marine life — a true underwater paradise.',
    image: '/addons/mnemba.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Couples\' Massage Retreat',
    price: 150,
    type: 'per_guest',
    description: 'Unwind together with our signature couples\' massage. Let expert therapists rejuvenate your body and mind in a serene setting inspired by the island\'s natural beauty — the perfect escape for two.',
    image: '/addons/cuople.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Private Airport Round-Trip Transfer',
    price: 150,
    type: 'per_room',
    description: 'Travel in comfort with a private airport transfer designed for convenience and exclusivity. Each car accommodates up to four passengers, ensuring a smooth and private journey to and from the resort.',
    image: '/addons/private.png',
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

// Room images - exact mapping for each room
const roomImages = {
  imperialSuite: '/figma/rooms-imperial-suite.png',
  oceanSuite: '/figma/rooms-ocean-suite.png',
  gardenSuite: '/figma/rooms-garden-suite.png'
};

// Helper to resolve room image: prefer static mapping by name, then Firestore field, then default
const resolveRoomImage = (data: { name?: string; image?: string }): string => {
  // Prefer uploaded/explicit image first
  if (data?.image) return data.image;
  // Fallback to static mapping by name
  const name = (data?.name || '').toString().toLowerCase();
  if (name.includes('imperial')) return roomImages.imperialSuite;
  if (name.includes('ocean')) return roomImages.oceanSuite;
  if (name.includes('garden')) return roomImages.gardenSuite;
  // Final fallback
  return roomImages.imperialSuite;
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
      const resolvedImage = resolveRoomImage(data);
      return {
        id: doc.id,
        ...data,
        image: resolvedImage,
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
      const resolvedImage = resolveRoomImage(data);
      return {
        id: roomSnap.id,
        ...data,
        image: resolvedImage,
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
      updatedAt: serverTimestamp(),
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
      if (name.includes('daybed') && name.includes('classic')) {
        image = addOnImages.daybedExperience;
      } else if (name.includes('romantic') && name.includes('beach') && name.includes('dinner')) {
        image = addOnImages.romanticDinner;
      } else if (name.includes('mnemba') && name.includes('snorkeling')) {
        image = addOnImages.mnembaSnorkeling;
      } else if (name.includes('couples') && name.includes('massage')) {
        image = addOnImages.couplesMassage;
      } else if (name.includes('private') && name.includes('airport')) {
        image = addOnImages.privateAirport;
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
    if (name.includes('daybed') && name.includes('classic')) {
      image = addOnImages.daybedExperience;
    } else if (name.includes('romantic') && name.includes('beach') && name.includes('dinner')) {
      image = addOnImages.romanticDinner;
    } else if (name.includes('mnemba') && name.includes('snorkeling')) {
      image = addOnImages.mnembaSnorkeling;
    } else if (name.includes('couples') && name.includes('massage')) {
      image = addOnImages.couplesMassage;
    } else if (name.includes('private') && name.includes('airport')) {
      image = addOnImages.privateAirport;
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
    if (name.includes('daybed') && name.includes('classic')) {
      image = addOnImages.daybedExperience;
    } else if (name.includes('romantic') && name.includes('beach') && name.includes('dinner')) {
      image = addOnImages.romanticDinner;
    } else if (name.includes('mnemba') && name.includes('snorkeling')) {
      image = addOnImages.mnembaSnorkeling;
    } else if (name.includes('couples') && name.includes('massage')) {
      image = addOnImages.couplesMassage;
    } else if (name.includes('private') && name.includes('airport')) {
      image = addOnImages.privateAirport;
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

// Contact Form Operations
export const createContactForm = async (contactData: Omit<ContactForm, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string | null> => {
  if (!db) {
    console.warn('Firestore not available, cannot create contact form');
    return null;
  }

  try {
    console.log('Creating contact form in Firestore:', contactData);
    
    const contactsRef = collection(db, 'contactForms');
    const docRef = await addDoc(contactsRef, {
      ...contactData,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('Contact form created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating contact form in Firestore:', error);
    return null;
  }
};

export const getAllContactForms = async (): Promise<ContactForm[]> => {
  if (!db) {
    console.warn('Firestore not available, cannot get contact forms');
    return [];
  }

  try {
    const contactsRef = collection(db, 'contactForms');
    const q = query(contactsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ContactForm;
    });
  } catch (error) {
    console.error('Error fetching contact forms:', error);
    return [];
  }
};

export const updateContactFormStatus = async (
  id: string,
  status: ContactForm['status']
): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'contactForms', id);
    await updateDoc(r, { status, updatedAt: new Date() });
    return true;
  } catch (e) {
    console.error('Error updating contact form status:', e);
    return false;
  }
};

// Booking Enquiry Operations (separate from Contact Forms)
export const createBookingEnquiry = async (data: Omit<BookingEnquiry, 'id'|'createdAt'|'updatedAt'|'status'>): Promise<string|null> => {
  if (!db) {
    console.warn('Firestore not available, cannot create booking enquiry');
    return null;
  }
  try {
    console.log('Creating booking enquiry in collection: bookingEnquiries', data);
    const c = collection(db, 'bookingEnquiries');
    const docData = { 
      ...data, 
      status: 'new', 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    };
    console.log('Document data to save:', docData);
    const dr = await addDoc(c, docData);
    console.log('Booking enquiry created successfully with ID:', dr.id, 'in collection: bookingEnquiries');
    return dr.id;
  } catch (e) {
    console.error('Error creating booking enquiry:', e);
    return null;
  }
};

export const getAllBookingEnquiries = async (): Promise<BookingEnquiry[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'bookingEnquiries');
    const qy = query(c, orderBy('createdAt','desc'));
    const snap = await getDocs(qy);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BookingEnquiry;
    });
  } catch (e) {
    console.error('Error fetching booking enquiries:', e);
    return [];
  }
};

export const updateBookingEnquiryStatus = async (id: string, status: BookingEnquiry['status']): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'bookingEnquiries', id);
    await updateDoc(r, { status, updatedAt: new Date() });
    return true;
  } catch (e) {
    console.error('Error updating booking enquiry:', e);
    return false;
  }
};

// Excursions CRUD Operations
export const getExcursions = async (): Promise<Excursion[]> => {
  if (!db) return [];
  try {
    const refCol = collection(db, 'excursions');
    const q = query(refCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Excursion;
    });
  } catch (e) {
    console.error('Error fetching excursions:', e);
    return [];
  }
};

export const createExcursion = async (data: Omit<Excursion, 'id'|'createdAt'|'updatedAt'>): Promise<string|null> => {
  if (!db) return null;
  try {
    const refCol = collection(db, 'excursions');
    const docRef = await addDoc(refCol, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return docRef.id;
  } catch (e) {
    console.error('Error creating excursion:', e);
    return null;
  }
};

export const updateExcursion = async (id: string, data: Partial<Excursion>): Promise<boolean> => {
  if (!db) return false;
  try {
    const d = doc(db, 'excursions', id);
    await updateDoc(d, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating excursion:', e);
    return false;
  }
};

export const deleteExcursion = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const d = doc(db, 'excursions', id);
    await deleteDoc(d);
    return true;
  } catch (e) {
    console.error('Error deleting excursion:', e);
    return false;
  }
};

// Offers CRUD
export const getOffers = async (): Promise<OfferBanner[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'offers');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as OfferBanner;
    });
  } catch (e) {
    console.error('Error fetching offers:', e);
    return [];
  }
};

export const createOffer = async (data: Omit<OfferBanner,'id'|'createdAt'|'updatedAt'>): Promise<string|null> => {
  if (!db) return null;
  try {
    const c = collection(db, 'offers');
    const d = await addDoc(c, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return d.id;
  } catch (e) {
    console.error('Error creating offer:', e);
    return null;
  }
};

export const deleteOffer = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const dref = doc(db, 'offers', id);
    await deleteDoc(dref);
    return true;
  } catch (e) {
    console.error('Error deleting offer:', e);
    return false;
  }
};

// Story in Pictures CRUD
export const getStoryImages = async (): Promise<StoryImage[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'storyImages');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    const items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        imageUrl: data.imageUrl,
        alt: data.alt || '',
        title: data.title || '',
        text: data.text || '',
        author: data.author || '',
        location: data.location || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as StoryImage;
    });
    return items;
  } catch (e) {
    console.error('Error fetching story images:', e);
    return [];
  }
};

export const createStoryImage = async (data: Omit<StoryImage,'id'|'createdAt'|'updatedAt'>): Promise<string|null> => {
  if (!db) return null;
  try {
    const c = collection(db, 'storyImages');
    const dr = await addDoc(c, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return dr.id;
  } catch (e) {
    console.error('Error creating story image:', e);
    return null;
  }
};

export const updateStoryImage = async (id: string, data: Partial<StoryImage>): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'storyImages', id);
    await updateDoc(r, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating story image:', e);
    return false;
  }
};

export const getStoryImage = async (id: string): Promise<StoryImage | null> => {
  if (!db) return null;
  try {
    const r = doc(db, 'storyImages', id);
    const s = await getDoc(r);
    if (!s.exists()) return null;
    const data = s.data();
    return {
      id: s.id,
      imageUrl: data.imageUrl,
      alt: data.alt || '',
      title: data.title || '',
      text: data.text || '',
      author: data.author || '',
      location: data.location || '',
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as StoryImage;
  } catch (e) {
    console.error('Error getting story image:', e);
    return null;
  }
};

export const deleteStoryImage = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'storyImages', id);
    await deleteDoc(r);
    return true;
  } catch (e) {
    console.error('Error deleting story image:', e);
    return false;
  }
};

// Gallery CRUD
export const getGalleryImages = async (type?: GalleryType): Promise<GalleryImage[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'gallery');
    const qy = type ? query(c, orderBy('createdAt','desc')) : query(c, orderBy('createdAt','desc'));
    const snap = await getDocs(qy);
    let items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        imageUrl: data.imageUrl,
        type: data.type as GalleryType,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as GalleryImage;
    });
    if (type) items = items.filter(i => i.type === type);
    return items;
  } catch (e) {
    console.error('Error fetching gallery images:', e);
    return [];
  }
};

export const createGalleryImage = async (data: Omit<GalleryImage,'id'|'createdAt'|'updatedAt'>): Promise<string|null> => {
  if (!db) return null;
  try {
    const c = collection(db, 'gallery');
    const dr = await addDoc(c, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return dr.id;
  } catch (e) {
    console.error('Error creating gallery image:', e);
    return null;
  }
};

export const updateGalleryImage = async (id: string, data: Partial<GalleryImage>): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'gallery', id);
    await updateDoc(r, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating gallery image:', e);
    return false;
  }
};

export const deleteGalleryImage = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'gallery', id);
    await deleteDoc(r);
    return true;
  } catch (e) {
    console.error('Error deleting gallery image:', e);
    return false;
  }
};

// Testimonials CRUD
export const getTestimonials = async (): Promise<Testimonial[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'testimonials');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        country: data.country,
        countryCode: data.countryCode,
        text: data.text,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Testimonial;
    });
  } catch (e) {
    console.error('Error fetching testimonials:', e);
    return [];
  }
};

export const createTestimonial = async (data: Omit<Testimonial, 'id'|'createdAt'|'updatedAt'>): Promise<string|null> => {
  if (!db) return null;
  try {
    const refCol = collection(db, 'testimonials');
    const docRef = await addDoc(refCol, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return docRef.id;
  } catch (e) {
    console.error('Error creating testimonial:', e);
    return null;
  }
};

export const updateTestimonial = async (id: string, data: Partial<Testimonial>): Promise<boolean> => {
  if (!db) return false;
  try {
    const d = doc(db, 'testimonials', id);
    await updateDoc(d, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating testimonial:', e);
    return false;
  }
};

export const deleteTestimonial = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const d = doc(db, 'testimonials', id);
    await deleteDoc(d);
    return true;
  } catch (e) {
    console.error('Error deleting testimonial:', e);
    return false;
  }
};

// Room Types CRUD Operations
export const getRoomTypes = async (suiteType?: SuiteType): Promise<RoomType[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'roomTypes');
    const qy = suiteType ? query(c, orderBy('createdAt', 'desc')) : query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    let items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        suiteType: data.suiteType as SuiteType,
        roomName: data.roomName,
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as RoomType;
    });
    if (suiteType) items = items.filter(i => i.suiteType === suiteType);
    return items.filter(i => i.isActive);
  } catch (e) {
    console.error('Error fetching room types:', e);
    return [];
  }
};

export const createRoomType = async (data: Omit<RoomType, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    const c = collection(db, 'roomTypes');
    const dr = await addDoc(c, { 
      ...data, 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    });
    return dr.id;
  } catch (e) {
    console.error('Error creating room type:', e);
    return null;
  }
};

export const updateRoomType = async (id: string, data: Partial<RoomType>): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'roomTypes', id);
    await updateDoc(r, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating room type:', e);
    return false;
  }
};

export const deleteRoomType = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'roomTypes', id);
    await deleteDoc(r);
    return true;
  } catch (e) {
    console.error('Error deleting room type:', e);
    return false;
  }
};

export const getRoomType = async (id: string): Promise<RoomType | null> => {
  if (!db) return null;
  try {
    const r = doc(db, 'roomTypes', id);
    const s = await getDoc(r);
    if (!s.exists()) return null;
    const data = s.data();
    return {
      id: s.id,
      suiteType: data.suiteType as SuiteType,
      roomName: data.roomName,
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as RoomType;
  } catch (e) {
    console.error('Error getting room type:', e);
    return null;
  }
};