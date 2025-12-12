/* eslint-disable @typescript-eslint/no-explicit-any */
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
  where,
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out';
  
  // EHMS Extended Fields
  roomNumber?: string; // Actual allocated room number (e.g., "ANANAS", "DESERT ROSE")
  checkInTime?: Date; // Actual check-in time
  checkOutTime?: Date; // Actual check-out time
  foodOrderIds?: string[]; // Array of FoodOrder IDs
  guestServiceIds?: string[]; // Array of GuestService IDs
  checkoutBillId?: string; // Link to final checkout bill
  
  // Payment Information
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'refunded';
  paidAmount?: number; // Amount paid during booking
  paymentMethod?: string; // e.g., 'card', 'cash', 'online'
  paymentDate?: Date; // When payment was made
  
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

export interface GuestExperienceForm {
  id: string;
  name: string;
  email?: string;
  suiteNo: string;
  arrivalDate: string;
  departureDate: string;
  // Reservation ratings (1-4, where 1=N/A, 2=Below Expectation, 3=Met Expectation, 4=Excellent)
  reservationInformative?: number;
  reservationPrompt?: number;
  // Check In ratings
  checkInEfficient?: number;
  checkInWelcoming?: number;
  // Service ratings
  barService?: number;
  waiterService?: number;
  // Meal Experience ratings
  breakfastExperience?: number;
  lunchExperience?: number;
  dinnerExperience?: number;
  // Main Area rating
  loungeArea?: number;
  // Room Experience ratings
  roomExperience?: number;
  roomCleanliness?: number;
  // General Comments
  memorableMoment?: string;
  otherComments?: string;
  // Recommendation
  wouldRecommend?: boolean;
  status: 'new' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestReview {
  id: string;
  name: string;
  country?: string;
  avatarUrl?: string;
  flagUrl?: string;
  type?: string; // e.g., "Solo traveller", "Family", "Couple"
  rating: number; // 1-5 stars
  review: string;
  // Optional detailed ratings
  staffRating?: number;
  facilitiesRating?: number;
  cleanlinessRating?: number;
  comfortRating?: number;
  valueRating?: number;
  locationRating?: number;
  wifiRating?: number;
  isApproved: boolean; // Admin approval before showing publicly
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

export interface DiscountOffer {
  id: string;
  discountPercent: number; // Discount percentage for room bookings (0-100)
  isActive: boolean; // Whether this discount is currently active
  couponCode?: string; // Optional coupon code
  createdAt: Date;
  updatedAt: Date;
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sendNotification: boolean;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  minPersons: number | null;
  maxPersons: number | null;
  applyToAllPersons: boolean;
  roomTypes: string[];
  applyToAllRooms: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  couponCode: string | null;
  lastNotificationSentAt?: Date | null;
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

// ==================== EHMS Interfaces ====================

// Menu Item Interface
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'breakfast' | 'soups' | 'main_course' | 'seafood' | 'indian_dishes' | 'pizza' | 'desserts' | 'beverages' | 'snacks';
  image?: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  rating?: number; // 1-5 stars
  isSpecial?: boolean; // Today's special
  discountPercent?: number; // e.g., 10% off
  createdAt: Date;
  updatedAt: Date;
}

// Food Order Interface
export interface FoodOrder {
  id: string;
  orderNumber: string; // Unique order number like "ORD-001"
  bookingId?: string; // Link to booking if exists
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  roomNumber?: string; // Room number for delivery
  deliveryLocation: 'in_room' | 'restaurant' | 'bar' | 'beach_side' | 'pool_side';
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
  }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  kitchenStatus: 'received' | 'cooking' | 'ready' | 'delivered';
  scheduledDeliveryTime?: Date; // When customer wants delivery
  estimatedPreparationTime: number; // in minutes
  actualDeliveryTime?: Date;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Guest Service Interface
export interface GuestService {
  id: string;
  bookingId?: string;
  guestName: string;
  guestPhone: string;
  roomNumber?: string;
  // High-level category to match app design cards
  serviceCategory: 'laundry' | 'spa' | 'game' | 'other';
  // Detailed type within category
  serviceType:
    | 'laundry'
    | 'housekeeping'
    | 'spa'
    | 'transport'
    | 'concierge'
    | 'room_service'
    | 'game'
    | 'other';
  description: string;
  amount: number; // legacy single amount
  // Pricing breakdown
  baseAmount?: number;
  surchargeAmount?: number;
  totalAmount?: number;
  fastService?: boolean; // laundry fast service
  fastServiceSurcharge?: number;
  // Laundry schedule & items
  pickupDate?: Date;
  pickupTime?: string;
  deliveryDate?: Date;
  deliveryTime?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  // Spa booking details
  spaType?: string;
  durationMinutes?: number;
  guestCount?: number;
  appointmentDate?: Date;
  appointmentTime?: string;
  // Tracking
  status: 'requested' | 'in_progress' | 'completed' | 'cancelled';
  statusHistory?: Array<{ status: GuestService['status']; at: Date; note?: string }>;
  requestedAt: Date;
  completedAt?: Date;
  notes?: string;
  requestSource?: 'mobile' | 'web';
  createdAt: Date;
  updatedAt: Date;
}

// Checkout Bill Interface
export interface CheckoutBill {
  id: string;
  bookingId: string;
  guestName: string;
  roomNumber?: string;
  checkInDate: Date;
  checkOutDate: Date;
  // Breakdown of charges
  roomCharges: number;
  foodCharges: number;
  serviceCharges: number;
  facilitiesCharges: number;
  addOnsCharges: number;
  taxes: number;
  discount?: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  // Detailed breakdown
  roomDetails: Array<{
    roomType: string;
    nights: number;
    rate: number;
    total: number;
  }>;
  foodOrders: Array<{
    orderId: string;
    orderNumber: string;
    date: Date;
    amount: number;
  }>;
  services: Array<{
    serviceId: string;
    serviceType: string;
    description: string;
    amount: number;
    date: Date;
  }>;
  facilities: Array<{
    name: string;
    usageCount?: number;
    amount: number;
    date: Date;
  }>;
  addOns: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Room Status Interface
export interface RoomStatus {
  id: string;
  roomName: string; // e.g., "DESERT ROSE", "EUCALYPTUS"
  suiteType: SuiteType;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
  currentBookingId?: string; // If occupied or reserved
  lastCleaned?: Date;
  nextCleaning?: Date;
  maintenanceNotes?: string;
  housekeepingStatus?: 'clean' | 'dirty' | 'inspected' | 'needs_attention';
  // Cleaning history
  cleaningHistory?: Array<{
    date: Date;
    type: 'checkout_cleaning' | 'stayover_cleaning' | 'deep_cleaning' | 'inspection';
    staffName?: string;
    notes?: string;
  }>;
  // Check-in/Check-out tracking
  currentCheckInDate?: Date;
  currentCheckOutDate?: Date;
  currentGuestName?: string;
  // Maintenance tracking
  maintenanceStartDate?: Date;
  maintenanceEndDate?: Date;
  maintenanceReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Housekeeping Task Interface
export interface HousekeepingTask {
  id: string;
  roomName: string;
  suiteType: SuiteType;
  taskType: 'checkout_cleaning' | 'stayover_cleaning' | 'deep_cleaning' | 'maintenance' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string; // Staff member name/ID
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  notes?: string;
  bookingId?: string; // If related to a booking
  scheduledTime?: Date;
  completedTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Check-in/Check-out Record Interface
export interface CheckInOutRecord {
  id: string;
  bookingId: string;
  guestName: string;
  roomName: string;
  suiteType: SuiteType;
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInStaff?: string; // Staff who checked in
  checkOutStaff?: string; // Staff who checked out
  idVerified: boolean;
  idDocumentType?: string; // 'passport', 'driving_license', 'id_card'
  idDocumentNumber?: string;
  specialRequests?: string;
  roomKeyIssued: boolean;
  roomKeyNumber?: string;
  depositAmount?: number;
  depositReturned?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    name: 'Suite with Garden View',
    type: 'Suite with Garden View',
    price: 500,
    description: 'This suite\'s standout feature is the pool with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.',
    amenities: ['WiFi', 'Air Conditioning', 'Bathroom'],
    size: '150 m²',
    view: 'Garden',
    beds: '1 double bed, 1 single bed',
    image: '/figma/rooms-garden-suite.png',
    maxGuests: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Queen Room With Sea View',
    type: 'Queen Room With Sea View',
    price: 600,
    description: 'This suite\'s standout feature is the pool with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.',
    amenities: ['WiFi', 'Air Conditioning', 'Bathroom'],
    size: '100 m²',
    view: 'Sea',
    beds: '1 single bed, 1 large double bed',
    image: '/figma/rooms-ocean-suite.png',
    maxGuests: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Deluxe Suite with Sea View',
    type: 'Deluxe Suite with Sea View',
    price: 700,
    description: 'This suite\'s standout feature is the pool with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.',
    amenities: ['WiFi', 'Air Conditioning', 'Bathroom'],
    size: '190 m²',
    view: 'Sea',
    beds: '1 single bed, 2 double bed',
    image: '/figma/rooms-imperial-suite.png',
    maxGuests: 5,
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
const resolveRoomImage = (data: { name?: string; type?: string; image?: string }): string => {
  // Prefer uploaded/explicit image first
  if (data?.image) return data.image;
  // Fallback to static mapping by name or type
  const name = ((data?.name || data?.type || '').toString().toLowerCase());
  if (name.includes('garden view') || name.includes('garden')) return roomImages.gardenSuite;
  if (name.includes('queen room') || name.includes('queen')) return roomImages.oceanSuite;
  if (name.includes('deluxe') || name.includes('sea view') || name.includes('imperial') || name.includes('ocean')) return roomImages.imperialSuite;
  // Final fallback
  return roomImages.gardenSuite;
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
      // Preserve the original image from Firestore if it exists, otherwise use resolved fallback
      // This ensures edits can preserve the actual stored image URL
      const originalImage = data.image || '';
      const resolvedImage = originalImage || resolveRoomImage(data);
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
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(bookingData).forEach(key => {
      const value = (bookingData as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      ...cleanData,
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

// Offers (Banners) CRUD
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
    
    // Send notification to all users (only for banner offers, not for every banner)
    // Note: Banner offers are usually for carousel, so we skip notification
    // Special offers will send notifications separately
    // Uncomment below if you want notifications for banner offers too
    /*
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🎉 New Offer Available!',
          body: 'Check out our latest exclusive offer',
          imageUrl: data.imageUrl,
          url: '/offers',
        }),
      });
    } catch (notifError) {
      console.warn('Failed to send notification:', notifError);
    }
    */
    
    return d.id;
  } catch (e) {
    console.error('Error creating offer:', e);
    return null;
  }
};

// Discount Offers CRUD
export const getDiscountOffers = async (): Promise<DiscountOffer[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'discounts');
    // Try with orderBy first, if it fails (no index), fall back to simple query
    let snap;
    try {
      const qy = query(c, orderBy('createdAt', 'desc'));
      snap = await getDocs(qy);
    } catch {
      // If orderBy fails (likely no index or collection doesn't exist), just get all docs
      try {
        snap = await getDocs(c);
      } catch (getDocsError) {
        // Collection might not exist yet, return empty array
        console.warn('Could not fetch discounts (collection may not exist):', getDocsError);
        return [];
      }
    }
    
    if (!snap || !snap.docs) return [];
    
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        discountPercent: data.discountPercent ?? 10,
        isActive: data.isActive ?? false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as DiscountOffer;
    });
  } catch (e) {
    console.error('Error fetching discount offers:', e);
    return [];
  }
};

// Get the active discount percentage from the active discount offer
export const getActiveDiscountPercent = async (): Promise<number> => {
  if (!db) return 10; // Default to 10% if no discounts
  try {
    const discounts = await getDiscountOffers();
    // Get the active discount
    const activeDiscount = discounts.find(d => d.isActive === true);
    return activeDiscount?.discountPercent ?? 10; // Default to 10% if no active discount
  } catch (e) {
    console.error('Error fetching active discount:', e);
    return 10; // Default to 10% on error
  }
};

export const createDiscountOffer = async (data: Omit<DiscountOffer,'id'|'createdAt'|'updatedAt'>): Promise<string|null> => {
  if (!db) return null;
  try {
    // If setting this as active, deactivate all other discounts directly
    if (data.isActive) {
      try {
        const existingDiscounts = await getDiscountOffers();
        const activeDiscounts = existingDiscounts.filter(d => d.isActive);
        for (const discount of activeDiscounts) {
          const dref = doc(db, 'discounts', discount.id);
          await updateDoc(dref, { isActive: false, updatedAt: serverTimestamp() });
        }
      } catch (deactivateError) {
        // If deactivation fails, continue anyway (collection might not exist yet)
        console.warn('Could not deactivate existing discounts:', deactivateError);
      }
    }
    
    const c = collection(db, 'discounts');
    const d = await addDoc(c, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    
    // Send notification to all users if discount is active
    if (data.isActive) {
      try {
        const bookLink = `/hotel?discountId=${d.id}`;
        const notificationBody = data.couponCode
          ? `Get ${data.discountPercent}% off on room bookings.\n\n🎫 Use Coupon Code: ${data.couponCode}`
          : `Get ${data.discountPercent}% off on room bookings. Book now!`;
        
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `🎁 ${data.discountPercent}% Discount Available!`,
            body: notificationBody,
            url: '/offers',
            bookUrl: bookLink,
            couponCode: data.couponCode || undefined,
          }),
        });
      } catch (notifError) {
        console.warn('Failed to send notification:', notifError);
        // Don't fail discount creation if notification fails
      }
    }
    
    return d.id;
  } catch (e) {
    console.error('Error creating discount offer:', e);
    return null;
  }
};

export const updateDiscountOffer = async (id: string, data: Partial<Omit<DiscountOffer,'id'|'createdAt'|'updatedAt'>>): Promise<boolean> => {
  if (!db) return false;
  try {
    // If setting this as active, deactivate all other discounts directly
    if (data.isActive === true) {
      try {
        const existingDiscounts = await getDiscountOffers();
        const activeDiscounts = existingDiscounts.filter(d => d.isActive && d.id !== id);
        for (const discount of activeDiscounts) {
          const dref = doc(db, 'discounts', discount.id);
          await updateDoc(dref, { isActive: false, updatedAt: serverTimestamp() });
        }
      } catch (deactivateError) {
        // If deactivation fails, continue anyway
        console.warn('Could not deactivate existing discounts:', deactivateError);
      }
    }
    
    const dref = doc(db, 'discounts', id);
    await updateDoc(dref, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating discount offer:', e);
    return false;
  }
};

export const deleteDiscountOffer = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const dref = doc(db, 'discounts', id);
    await deleteDoc(dref);
    return true;
  } catch (e) {
    console.error('Error deleting discount offer:', e);
    return false;
  }
};

// Special Offers CRUD
export const getSpecialOffers = async (): Promise<SpecialOffer[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'specialOffers');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    const items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        sendNotification: data.sendNotification || false,
        isActive: data.isActive || false,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        minPersons: data.minPersons || null,
        maxPersons: data.maxPersons || null,
        applyToAllPersons: data.applyToAllPersons || false,
        roomTypes: data.roomTypes || [],
        applyToAllRooms: data.applyToAllRooms || false,
        discountType: data.discountType || 'percentage',
        discountValue: data.discountValue || 0,
        couponCode: data.couponCode || null,
        lastNotificationSentAt: data.lastNotificationSentAt?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as SpecialOffer;
    });
    return items;
  } catch (e) {
    console.error('Error fetching special offers:', e);
    return [];
  }
};

export const getSpecialOffer = async (id: string): Promise<SpecialOffer | null> => {
  if (!db) return null;
  try {
    const dref = doc(db, 'specialOffers', id);
    const snap = await getDoc(dref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      title: data.title || '',
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      sendNotification: data.sendNotification || false,
      isActive: data.isActive || false,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      minPersons: data.minPersons || null,
      maxPersons: data.maxPersons || null,
      applyToAllPersons: data.applyToAllPersons || false,
      roomTypes: data.roomTypes || [],
      applyToAllRooms: data.applyToAllRooms || false,
      discountType: data.discountType || 'percentage',
      discountValue: data.discountValue || 0,
      couponCode: data.couponCode || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as SpecialOffer;
  } catch (e) {
    console.error('Error fetching special offer:', e);
    return null;
  }
};

export const updateSpecialOffer = async (id: string, data: Partial<Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
  if (!db) return false;
  try {
    const dref = doc(db, 'specialOffers', id);
    await updateDoc(dref, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating special offer:', e);
    return false;
  }
};

export const deleteSpecialOffer = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const dref = doc(db, 'specialOffers', id);
    await deleteDoc(dref);
    return true;
  } catch (e) {
    console.error('Error deleting special offer:', e);
    return false;
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

// Guest Experience Form Operations
export const createGuestExperienceForm = async (
  formData: Omit<GuestExperienceForm, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string | null> => {
  if (!db) {
    console.warn('Firestore not available, cannot create guest experience form');
    return null;
  }

  try {
    const formsRef = collection(db, 'guestExperienceForms');
    const docRef = await addDoc(formsRef, {
      ...formData,
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating guest experience form:', error);
    return null;
  }
};

export const getAllGuestExperienceForms = async (): Promise<GuestExperienceForm[]> => {
  if (!db) {
    console.warn('Firestore not available, cannot get guest experience forms');
    return [];
  }

  try {
    const formsRef = collection(db, 'guestExperienceForms');
    const q = query(formsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as GuestExperienceForm;
    });
  } catch (error) {
    console.error('Error fetching guest experience forms:', error);
    return [];
  }
};

export const updateGuestExperienceFormStatus = async (
  id: string,
  status: GuestExperienceForm['status']
): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'guestExperienceForms', id);
    await updateDoc(r, { status, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating guest experience form status:', e);
    return false;
  }
};

// Guest Review Operations
export const createGuestReview = async (
  reviewData: Omit<GuestReview, 'id' | 'createdAt' | 'updatedAt' | 'isApproved'>
): Promise<string | null> => {
  if (!db) {
    console.warn('Firestore not available, cannot create guest review');
    return null;
  }

  try {
    const reviewsRef = collection(db, 'guestReviews');
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      isApproved: true, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating guest review:', error);
    return null;
  }
};

export const getAllGuestReviews = async (approvedOnly: boolean = false): Promise<GuestReview[]> => {
  if (!db) {
    console.warn('Firestore not available, cannot get guest reviews');
    return [];
  }

  try {
    const reviewsRef = collection(db, 'guestReviews');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    let reviews = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as GuestReview;
    });

    if (approvedOnly) {
      reviews = reviews.filter(review => review.isApproved);
    }

    return reviews;
  } catch (error) {
    console.error('Error fetching guest reviews:', error);
    return [];
  }
};

export const updateGuestReviewApproval = async (
  id: string,
  isApproved: boolean
): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'guestReviews', id);
    await updateDoc(r, { isApproved, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating guest review approval:', e);
    return false;
  }
};

export const deleteGuestReview = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'guestReviews', id);
    await deleteDoc(r);
    return true;
  } catch (e) {
    console.error('Error deleting guest review:', e);
    return false;
  }
};

// ==================== EHMS CRUD Operations ====================

// Menu Items CRUD Operations
export const getMenuItems = async (category?: MenuItem['category']): Promise<MenuItem[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'menuItems');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    let items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as MenuItem;
    });
    if (category) items = items.filter(i => i.category === category);
    return items;
  } catch (e) {
    console.error('Error fetching menu items:', e);
    return [];
  }
};

export const getMenuItem = async (id: string): Promise<MenuItem | null> => {
  if (!db) return null;
  try {
    const r = doc(db, 'menuItems', id);
    const s = await getDoc(r);
    if (!s.exists()) return null;
    const data = s.data();
    return {
      id: s.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as MenuItem;
  } catch (e) {
    console.error('Error getting menu item:', e);
    return null;
  }
};

export const createMenuItem = async (data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    const c = collection(db, 'menuItems');
    const dr = await addDoc(c, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return dr.id;
  } catch (e) {
    console.error('Error creating menu item:', e);
    return null;
  }
};

export const updateMenuItem = async (id: string, data: Partial<MenuItem>): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'menuItems', id);
    await updateDoc(r, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating menu item:', e);
    return false;
  }
};

export const deleteMenuItem = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'menuItems', id);
    await deleteDoc(r);
    return true;
  } catch (e) {
    console.error('Error deleting menu item:', e);
    return false;
  }
};

// Food Orders CRUD Operations
export const getFoodOrders = async (status?: FoodOrder['status']): Promise<FoodOrder[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'foodOrders');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    let orders = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        scheduledDeliveryTime: data.scheduledDeliveryTime?.toDate(),
        actualDeliveryTime: data.actualDeliveryTime?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as FoodOrder;
    });
    if (status) orders = orders.filter(o => o.status === status);
    return orders;
  } catch (e) {
    console.error('Error fetching food orders:', e);
    return [];
  }
};

export const getFoodOrder = async (id: string): Promise<FoodOrder | null> => {
  if (!db) return null;
  try {
    const r = doc(db, 'foodOrders', id);
    const s = await getDoc(r);
    if (!s.exists()) return null;
    const data = s.data();
    return {
      id: s.id,
      ...data,
      scheduledDeliveryTime: data.scheduledDeliveryTime?.toDate(),
      actualDeliveryTime: data.actualDeliveryTime?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as FoodOrder;
  } catch (e) {
    console.error('Error getting food order:', e);
    return null;
  }
};

export const createFoodOrder = async (data: Omit<FoodOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    // Generate order number
    const ordersRef = collection(db, 'foodOrders');
    const ordersSnap = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')));
    const orderCount = ordersSnap.size;
    const orderNumber = `ORD-${String(orderCount + 1).padStart(4, '0')}`;
    
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = { orderNumber };
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const c = collection(db, 'foodOrders');
    const dr = await addDoc(c, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update booking if bookingId exists
    if (data.bookingId) {
      const booking = await getBooking(data.bookingId);
      if (booking) {
        const foodOrderIds = booking.foodOrderIds || [];
        if (!foodOrderIds.includes(dr.id)) {
          await updateBooking(data.bookingId, {
            foodOrderIds: [...foodOrderIds, dr.id]
          });
        }
      }
    }
    
    return dr.id;
  } catch (e) {
    console.error('Error creating food order:', e);
    return null;
  }
};

export const updateFoodOrder = async (id: string, data: Partial<FoodOrder>): Promise<boolean> => {
  if (!db) return false;
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const r = doc(db, 'foodOrders', id);
    await updateDoc(r, { ...cleanData, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating food order:', e);
    return false;
  }
};

export const deleteFoodOrder = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'foodOrders', id);
    await deleteDoc(r);
    return true;
  } catch (e) {
    console.error('Error deleting food order:', e);
    return false;
  }
};

// Get active food orders for kitchen (pending, confirmed, preparing)
export const getKitchenOrders = async (): Promise<FoodOrder[]> => {
  if (!db) return [];
  try {
    const orders = await getFoodOrders();
    return orders.filter(o => 
      o.status === 'pending' || 
      o.status === 'confirmed' || 
      o.status === 'preparing' ||
      o.status === 'ready'
    );
  } catch (e) {
    console.error('Error fetching kitchen orders:', e);
    return [];
  }
};

// Guest Services CRUD Operations
export const getGuestServices = async (status?: GuestService['status']): Promise<GuestService[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'guestServices');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    let services = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        pickupDate: data.pickupDate?.toDate(),
        deliveryDate: data.deliveryDate?.toDate(),
        appointmentDate: data.appointmentDate?.toDate(),
        requestedAt: data.requestedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        statusHistory: (data.statusHistory || []).map((s: any) => ({
          ...s,
          at: s.at?.toDate() || new Date(),
        })),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as GuestService;
    });
    if (status) services = services.filter(s => s.status === status);
    return services;
  } catch (e) {
    console.error('Error fetching guest services:', e);
    return [];
  }
};

export const getGuestService = async (id: string): Promise<GuestService | null> => {
  if (!db) return null;
  try {
    const r = doc(db, 'guestServices', id);
    const s = await getDoc(r);
    if (!s.exists()) return null;
    const data = s.data();
    return {
      id: s.id,
      ...data,
      requestedAt: data.requestedAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as GuestService;
  } catch (e) {
    console.error('Error getting guest service:', e);
    return null;
  }
};

export const createGuestService = async (data: Omit<GuestService, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const c = collection(db, 'guestServices');
    const dr = await addDoc(c, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update booking if bookingId exists
    if (data.bookingId) {
      const booking = await getBooking(data.bookingId);
      if (booking) {
        const guestServiceIds = booking.guestServiceIds || [];
        if (!guestServiceIds.includes(dr.id)) {
          await updateBooking(data.bookingId, {
            guestServiceIds: [...guestServiceIds, dr.id]
          });
        }
      }
    }
    
    return dr.id;
  } catch (e) {
    console.error('Error creating guest service:', e);
    return null;
  }
};

export const updateGuestService = async (id: string, data: Partial<GuestService>): Promise<boolean> => {
  if (!db) return false;
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const r = doc(db, 'guestServices', id);
    await updateDoc(r, { ...cleanData, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating guest service:', e);
    return false;
  }
};

export const deleteGuestService = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'guestServices', id);
    await deleteDoc(r);
    return true;
  } catch (e) {
    console.error('Error deleting guest service:', e);
    return false;
  }
};

// Checkout Bills CRUD Operations
export const getCheckoutBills = async (): Promise<CheckoutBill[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'checkoutBills');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        checkInDate: data.checkInDate?.toDate() || new Date(),
        checkOutDate: data.checkOutDate?.toDate() || new Date(),
        foodOrders: (data.foodOrders || []).map((fo: any) => ({
          ...fo,
          date: fo.date?.toDate() || new Date(),
        })),
        services: (data.services || []).map((s: any) => ({
          ...s,
          date: s.date?.toDate() || new Date(),
        })),
        facilities: (data.facilities || []).map((f: any) => ({
          ...f,
          date: f.date?.toDate() || new Date(),
        })),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CheckoutBill;
    });
  } catch (e) {
    console.error('Error fetching checkout bills:', e);
    return [];
  }
};

export const getCheckoutBill = async (id: string): Promise<CheckoutBill | null> => {
  if (!db) return null;
  try {
    const r = doc(db, 'checkoutBills', id);
    const s = await getDoc(r);
    if (!s.exists()) return null;
    const data = s.data();
    return {
      id: s.id,
      ...data,
      checkInDate: data.checkInDate?.toDate() || new Date(),
      checkOutDate: data.checkOutDate?.toDate() || new Date(),
      foodOrders: (data.foodOrders || []).map((fo: any) => ({
        ...fo,
        date: fo.date?.toDate() || new Date(),
      })),
      services: (data.services || []).map((s: any) => ({
        ...s,
        date: s.date?.toDate() || new Date(),
      })),
      facilities: (data.facilities || []).map((f: any) => ({
        ...f,
        date: f.date?.toDate() || new Date(),
      })),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CheckoutBill;
  } catch (e) {
    console.error('Error getting checkout bill:', e);
    return null;
  }
};

// Generate checkout bill from booking
export const generateCheckoutBill = async (bookingId: string): Promise<string | null> => {
  if (!db) return null;
  try {
    const booking = await getBooking(bookingId);
    if (!booking) return null;
    
    // Calculate room charges
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const roomCharges = booking.rooms.reduce((sum, room) => sum + (room.price * nights), 0);
    
    // Get food orders
    const foodOrders = booking.foodOrderIds ? await Promise.all(
      booking.foodOrderIds.map(id => getFoodOrder(id))
    ) : [];
    const validFoodOrders = foodOrders.filter(o => o !== null) as FoodOrder[];
    const foodCharges = validFoodOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Get guest services
    const services = booking.guestServiceIds ? await Promise.all(
      booking.guestServiceIds.map(id => getGuestService(id))
    ) : [];
    const validServices = services.filter(s => s !== null) as GuestService[];
    const serviceCharges = validServices.reduce((sum, service) => sum + (service.amount || 0), 0);
    
    // Add-ons charges
    const addOnsCharges = booking.addOns.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
    
    // Calculate taxes (assume 10% tax)
    const subtotal = roomCharges + foodCharges + serviceCharges + addOnsCharges;
    const taxes = subtotal * 0.1;
    const totalAmount = subtotal + taxes;
    
    // Get already paid amount from booking (payment made during booking)
    const alreadyPaid = booking.paidAmount || 0;
    const balance = totalAmount - alreadyPaid;
    const paymentStatus: CheckoutBill['paymentStatus'] = 
      balance <= 0 ? 'paid' : (alreadyPaid > 0 ? 'partial' : 'pending');
    
    // Get room number - use allocated room type as fallback
    const roomNumber = booking.roomNumber || booking.rooms[0]?.allocatedRoomType || null;
    
    const bill: Omit<CheckoutBill, 'id' | 'createdAt' | 'updatedAt'> = {
      bookingId,
      guestName: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
      roomNumber: roomNumber || undefined, // Only include if not null
      checkInDate: checkIn,
      checkOutDate: checkOut,
      roomCharges,
      foodCharges,
      serviceCharges,
      facilitiesCharges: 0, // Can be extended
      addOnsCharges,
      taxes,
      totalAmount,
      paidAmount: alreadyPaid,
      balance: balance,
      paymentStatus: paymentStatus,
      roomDetails: booking.rooms.map(room => ({
        roomType: room.type,
        nights,
        rate: room.price,
        total: room.price * nights,
      })),
      foodOrders: validFoodOrders.map(order => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        amount: order.totalAmount,
      })),
      services: validServices.map(service => ({
        serviceId: service.id,
        serviceType: service.serviceType,
        description: service.description,
        amount: service.amount,
        date: service.requestedAt,
      })),
      facilities: [], // Can be extended
      addOns: booking.addOns.map(addon => ({
        name: addon.name,
        quantity: addon.quantity,
        price: addon.price,
        total: addon.price * addon.quantity,
      })),
    };
    
    // Remove undefined values before saving to Firestore
    const billData: any = {};
    Object.keys(bill).forEach(key => {
      const value = (bill as any)[key];
      if (value !== undefined) {
        billData[key] = value;
      }
    });
    
    const c = collection(db, 'checkoutBills');
    const dr = await addDoc(c, {
      ...billData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update booking with checkout bill ID
    await updateBooking(bookingId, { checkoutBillId: dr.id });
    
    return dr.id;
  } catch (e) {
    console.error('Error generating checkout bill:', e);
    return null;
  }
};

export const updateCheckoutBill = async (id: string, data: Partial<CheckoutBill>): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'checkoutBills', id);
    await updateDoc(r, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating checkout bill:', e);
    return false;
  }
};

// ==================== Room Status Management ====================

export const getRoomStatuses = async (suiteType?: SuiteType): Promise<RoomStatus[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'roomStatuses');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    let statuses = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        lastCleaned: data.lastCleaned?.toDate(),
        nextCleaning: data.nextCleaning?.toDate(),
        currentCheckInDate: data.currentCheckInDate?.toDate(),
        currentCheckOutDate: data.currentCheckOutDate?.toDate(),
        maintenanceStartDate: data.maintenanceStartDate?.toDate(),
        maintenanceEndDate: data.maintenanceEndDate?.toDate(),
        cleaningHistory: (data.cleaningHistory || []).map((ch: any) => ({
          ...ch,
          date: ch.date?.toDate() || new Date(),
        })),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as RoomStatus;
    });
    if (suiteType) statuses = statuses.filter(s => s.suiteType === suiteType);
    return statuses;
  } catch (e) {
    console.error('Error fetching room statuses:', e);
    return [];
  }
};

export const getRoomStatus = async (roomName: string): Promise<RoomStatus | null> => {
  if (!db) return null;
  try {
    const c = collection(db, 'roomStatuses');
    const qy = query(c, where('roomName', '==', roomName));
    const snap = await getDocs(qy);
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    return {
      id: snap.docs[0].id,
      ...data,
      lastCleaned: data.lastCleaned?.toDate(),
      nextCleaning: data.nextCleaning?.toDate(),
      currentCheckInDate: data.currentCheckInDate?.toDate(),
      currentCheckOutDate: data.currentCheckOutDate?.toDate(),
      maintenanceStartDate: data.maintenanceStartDate?.toDate(),
      maintenanceEndDate: data.maintenanceEndDate?.toDate(),
      cleaningHistory: (data.cleaningHistory || []).map((ch: any) => ({
        ...ch,
        date: ch.date?.toDate() || new Date(),
      })),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as RoomStatus;
  } catch (e) {
    console.error('Error getting room status:', e);
    return null;
  }
};

export const updateRoomStatus = async (id: string, data: Partial<RoomStatus>): Promise<boolean> => {
  if (!db) return false;
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const r = doc(db, 'roomStatuses', id);
    await updateDoc(r, { ...cleanData, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating room status:', e);
    return false;
  }
};

export const createRoomStatus = async (data: Omit<RoomStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const c = collection(db, 'roomStatuses');
    const dr = await addDoc(c, { ...cleanData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return dr.id;
  } catch (e) {
    console.error('Error creating room status:', e);
    return null;
  }
};

// ==================== Housekeeping Management ====================

export const getHousekeepingTasks = async (status?: HousekeepingTask['status']): Promise<HousekeepingTask[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'housekeepingTasks');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    let tasks = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        scheduledTime: data.scheduledTime?.toDate(),
        completedTime: data.completedTime?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as HousekeepingTask;
    });
    if (status) tasks = tasks.filter(t => t.status === status);
    return tasks;
  } catch (e) {
    console.error('Error fetching housekeeping tasks:', e);
    return [];
  }
};

export const createHousekeepingTask = async (data: Omit<HousekeepingTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const c = collection(db, 'housekeepingTasks');
    const dr = await addDoc(c, { ...cleanData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return dr.id;
  } catch (e) {
    console.error('Error creating housekeeping task:', e);
    return null;
  }
};

export const updateHousekeepingTask = async (id: string, data: Partial<HousekeepingTask>): Promise<boolean> => {
  if (!db) return false;
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    // Add completedTime if status is completed
    if (cleanData.status === 'completed' && !cleanData.completedTime) {
      cleanData.completedTime = new Date();
    }
    
    const r = doc(db, 'housekeepingTasks', id);
    await updateDoc(r, { ...cleanData, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating housekeeping task:', e);
    return false;
  }
};

export const deleteHousekeepingTask = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'housekeepingTasks', id);
    await deleteDoc(r);
    return true;
  } catch (e) {
    console.error('Error deleting housekeeping task:', e);
    return false;
  }
};

// ==================== Check-in/Check-out Management ====================

export const getCheckInOutRecords = async (bookingId?: string): Promise<CheckInOutRecord[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'checkInOutRecords');
    let snap;
    if (bookingId) {
      // Filter by bookingId first, then sort in memory to avoid index requirement
      const qy = query(c, where('bookingId', '==', bookingId));
      snap = await getDocs(qy);
    } else {
      const qy = query(c, orderBy('createdAt', 'desc'));
      snap = await getDocs(qy);
    }
    
    const records = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        checkInTime: data.checkInTime?.toDate(),
        checkOutTime: data.checkOutTime?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CheckInOutRecord;
    });
    
    // Sort in memory if filtered by bookingId
    if (bookingId) {
      records.sort((a, b) => {
        const aTime = a.createdAt.getTime();
        const bTime = b.createdAt.getTime();
        return bTime - aTime; // Descending
      });
    }
    
    return records;
  } catch (e) {
    console.error('Error fetching check-in/out records:', e);
    return [];
  }
};

export const createCheckInOutRecord = async (data: Omit<CheckInOutRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    
    const c = collection(db, 'checkInOutRecords');
    const dr = await addDoc(c, { ...cleanData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return dr.id;
  } catch (e) {
    console.error('Error creating check-in/out record:', e);
    return null;
  }
};

export const updateCheckInOutRecord = async (id: string, data: Partial<CheckInOutRecord>): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'checkInOutRecords', id);
    await updateDoc(r, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating check-in/out record:', e);
    return false;
  }
};

// Helper function to check-in a guest
export const checkInGuest = async (
  bookingId: string,
  staffName: string,
  idDocumentType?: string,
  idDocumentNumber?: string,
  roomKeyNumber?: string,
  depositAmount?: number,
  notes?: string
): Promise<string | null> => {
  if (!db) return null;
  try {
    const booking = await getBooking(bookingId);
    if (!booking) return null;

    // Get room name from allocated room
    const roomName = booking.rooms[0]?.allocatedRoomType || booking.roomNumber || 'Unknown';
    const suiteType = booking.rooms[0]?.suiteType || 'Garden Suite';

    // Create check-in record - only include defined values
    const recordData: Omit<CheckInOutRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      bookingId,
      guestName: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
      roomName,
      suiteType: suiteType as SuiteType,
      checkInTime: new Date(),
      checkInStaff: staffName,
      idVerified: !!idDocumentNumber,
      roomKeyIssued: !!roomKeyNumber,
      depositReturned: false,
    };
    
    // Add optional fields only if they have values
    if (idDocumentType) recordData.idDocumentType = idDocumentType;
    if (idDocumentNumber) recordData.idDocumentNumber = idDocumentNumber;
    if (roomKeyNumber) recordData.roomKeyNumber = roomKeyNumber;
    if (depositAmount !== undefined && depositAmount !== null) recordData.depositAmount = depositAmount;
    if (notes) recordData.notes = notes;
    
    const record = await createCheckInOutRecord(recordData);

    // Update booking status
    await updateBooking(bookingId, {
      status: 'checked_in',
      checkInTime: new Date(),
      roomNumber: roomName,
    });

    // Update room status
    const roomStatus = await getRoomStatus(roomName);
    if (roomStatus) {
      await updateRoomStatus(roomStatus.id, {
        status: 'occupied',
        currentBookingId: bookingId,
        currentCheckInDate: new Date(),
        currentGuestName: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
        housekeepingStatus: 'dirty', // Room becomes dirty when occupied
      });
    } else {
      // Create room status if doesn't exist
      await createRoomStatus({
        roomName,
        suiteType: suiteType as SuiteType,
        status: 'occupied',
        currentBookingId: bookingId,
        currentCheckInDate: new Date(),
        currentGuestName: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
        housekeepingStatus: 'dirty',
      });
    }

    return record;
  } catch (e) {
    console.error('Error checking in guest:', e);
    return null;
  }
};

// Helper function to check-out a guest
export const checkOutGuest = async (
  bookingId: string,
  staffName: string,
  depositReturned: boolean = false,
  notes?: string
): Promise<boolean> => {
  if (!db) return false;
  try {
    const booking = await getBooking(bookingId);
    if (!booking) {
      console.error('Booking not found:', bookingId);
      return false;
    }

    // Get or create check-in record
    let records = await getCheckInOutRecords(bookingId);
    let checkInRecord = records[0];
    
    // If no check-in record exists, create one (for backward compatibility)
    if (!checkInRecord) {
      console.warn('No check-in record found, creating one...');
      const roomName = booking.rooms[0]?.allocatedRoomType || booking.roomNumber || 'Unknown';
      const suiteType = booking.rooms[0]?.suiteType || 'Garden Suite';
      const checkInRecordId = await createCheckInOutRecord({
        bookingId,
        guestName: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
        roomName,
        suiteType: suiteType as SuiteType,
        checkInTime: booking.checkInTime || new Date(booking.checkIn), 
        checkInStaff: 'System',
        idVerified: false,
        roomKeyIssued: false,
        roomKeyNumber: booking.rooms[0]?.allocatedRoomType || booking.roomNumber || undefined,
      });
      
      if (checkInRecordId) {
        records = await getCheckInOutRecords(bookingId);
        checkInRecord = records[0];
      }
    }

    // Update check-out record if we have a check-in record
    if (checkInRecord) {
      const updateData: Partial<CheckInOutRecord> = {
        checkOutTime: new Date(),
        checkOutStaff: staffName,
        depositReturned,
      };
      if (notes) updateData.notes = notes;
      
      try {
        await updateCheckInOutRecord(checkInRecord.id, updateData);
      } catch (e) {
        console.error('Error updating check-out record:', e);
        // Continue even if this fails
      }
    }

    // Update booking status (this is critical)
    try {
      await updateBooking(bookingId, {
        status: 'checked_out',
        checkOutTime: new Date(),
      });
    } catch (e) {
      console.error('Error updating booking status:', e);
      return false; // This is critical, so fail if it doesn't work
    }

    // Update room status and create housekeeping task (optional steps)
    const roomName = booking.rooms[0]?.allocatedRoomType || booking.roomNumber;
    if (roomName && roomName !== 'Unknown') {
      const suiteType = booking.rooms[0]?.suiteType || 'Garden Suite';
      
      // Try to update room status
      try {
        const roomStatus = await getRoomStatus(roomName);
        if (roomStatus) {
          await updateRoomStatus(roomStatus.id, {
            status: 'cleaning',
            currentBookingId: undefined,
            currentCheckInDate: undefined,
            currentCheckOutDate: new Date(),
            currentGuestName: undefined,
            housekeepingStatus: 'dirty',
          });
        }
      } catch (e) {
        console.error('Error updating room status:', e);
        // Continue even if this fails
      }

      // Try to create housekeeping task
      try {
        await createHousekeepingTask({
          roomName,
          suiteType: suiteType as SuiteType,
          taskType: 'checkout_cleaning',
          priority: 'high',
          status: 'pending',
          bookingId,
          scheduledTime: new Date(),
        });
      } catch (e) {
        console.error('Error creating housekeeping task:', e);
        // Continue even if this fails
      }
    }

    return true;
  } catch (e) {
    console.error('Error checking out guest:', e);
    return false;
  }
};