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
  serverTimestamp,
  limit,
  writeBatch,
  arrayUnion,
  arrayRemove,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Interfaces
export type SuiteType = 'Garden Suite' | 'Imperial Suite' | 'Ocean Suite';

export interface Room {
  id: string;
  name: string;
  type: string;
  roomName?: string;
  suiteType?: SuiteType;
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
  taxes?: number;
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

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkOrderStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export interface WorkOrder {
  id: string;
  roomName: string;
  issueType: string; // 'Plumbing', 'Electrical', 'AC', 'Furniture', 'Other'
  priority: WorkOrderPriority;
  description: string;
  status: WorkOrderStatus;
  reportedBy: string;
  assignedTo?: string;
  createdAt: any; // Timestamp
  updatedAt: any;
  resolvedAt?: any;
  images?: string[];
  isBlockRequired?: boolean; // If true, room should be blocked
}

export interface MaintenanceLog {
  id: string;
  roomName: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'active' | 'completed' | 'cancelled';
  createdBy?: string;
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
    nationality?: string;
    address?: string;
    city?: string;
    country?: string;
    zipCode?: string;
    idType?: string;
    idNumber?: string;
  };

  // Booking Source
  source?: 'web' | 'mobile' | 'walk_in' | 'ota';

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
    idDocumentName?: string;
  }>;

  // Essential room information only
  rooms: Array<{
    type: string;
    price: number;
    allocatedRoomType?: string; // e.g., "DESERT ROSE", "EUCALYPTUS"
    suiteType?: SuiteType; // e.g., "Garden Suite", "Imperial Suite", "Ocean Suite"
    status?: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out' | 'no_show' | 'maintenance' | 'stay_over';
    ratePlan?: string;
    mealPlan?: 'BB' | 'HB' | 'FB';
    mealPlanPrice?: number;
  }>;

  // Essential add-ons information
  addOns: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
  }>;

  // Financial details
  totalAmount: number;
  bookingId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out' | 'no_show' | 'maintenance' | 'stay_over';

  // EHMS Extended Fields
  roomNumber?: string; // Actual allocated room number (e.g., "ANANAS", "DESERT ROSE")
  checkInTime?: Date; // Actual check-in time
  checkInStaff?: string; // Staff member who performed check-in
  checkOutTime?: Date; // Actual check-out time
  foodOrderIds?: string[]; // Array of FoodOrder IDs
  guestServiceIds?: string[]; // Array of GuestService IDs
  checkoutBillId?: string; // Link to final checkout bill

  // Payment Information
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'refunded';
  paidAmount?: number; // Amount paid during booking
  paymentMethod?: string; // e.g., 'card', 'cash', 'online'
  paymentDate?: Date; // When payment was made

  // Master Data References (Optional for now)
  travelAgentId?: string;
  companyId?: string;
  marketSegmentId?: string;
  businessSourceId?: string;
  rateTypeId?: string;
  reservationTypeId?: string;

  notes?: string;
  guestIdProof?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ContactForm {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
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

  // Targeting
  targetAudience: 'all' | 'specific_rooms';
  roomTypes: string[]; // specific room IDs or Suite Types

  discountType: 'percentage' | 'fixed' | 'pay_x_stay_y';
  discountValue: number;

  // Pay X Stay Y Logic
  stayNights?: number;
  payNights?: number;

  // Coupon Logic
  couponMode: 'none' | 'static' | 'unique_per_user';
  couponCode: string | null; // Used if couponMode is 'static'

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



// ==================== EHMS Interfaces ====================

// Menu Item Interface
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'breakfast' | 'soups' | 'main_course' | 'seafood' | 'indian_dishes' | 'pizza' | 'desserts' | 'beverages' | 'snacks' | 'starter' | 'continental' | 'open_item' | 'liquors' | 'food' | 'full_board' | 'half_board' | 'management';
  subcategory?: string; // e.g., "Breakfast Fresh From The Kitchen", "Breakfast The Sides"
  sku?: string; // Stock Keeping Unit
  taxGroup?: string; // e.g., "VAT"
  cost?: number; // Cost price
  hasDiscount?: boolean; // Yes/No for discount
  openPrice?: boolean; // Yes/No for open price
  station?: 'kitchen' | 'bar' | 'bakery' | 'cold' | 'other';
  status?: 'draft' | 'published' | 'archived';
  image?: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  rating?: number; // 1-5 stars
  isSpecial?: boolean; // Today's special
  discountPercent?: number; // e.g., 10% off
  availableFrom?: Date;
  availableTo?: Date;
  dayparts?: ('breakfast' | 'lunch' | 'dinner')[];

  // New Additions for Multi-Size & Modifiers
  hasVariants?: boolean;
  variants?: Array<{
    name: string; // e.g. "Small", "Large"
    price: number;
  }>;
  modifiers?: Array<{
    name: string; // e.g. "Extra Cheese", "No Onions", "Choice of Sauce"
    price: number; // 0 if free, or extra cost
    type: 'optional' | 'required' | 'multiple'; // UI Hint
    options?: string[]; // For 'choice' modifiers e.g. ["BBQ", "Ranch"]
  }>;

  isArchived?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  name: string; // machine name
  label: string; // display label
  parentId: string | null;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Food Order Interface
export interface FoodOrder {
  id: string;
  orderNumber: string; // Unique order number like "ORD-001"
  receiptNo?: string; // Receipt number
  rtNo?: string; // R/T number
  bookingId?: string; // Link to booking if exists
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  roomNumber?: string; // Room number for delivery
  deliveryLocation: 'in_room' | 'restaurant' | 'bar' | 'beach_side' | 'pool_side';
  orderType: 'dine_in' | 'takeaway' | 'room_service' | 'delivery';
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
    // New: Selected Variant & Modifiers
    variant?: { name: string; price: number };
    selectedModifiers?: Array<{ name: string; price: number }>;
  }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
  status: 'pending' | 'running' | 'settled' | 'voided' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  kitchenStatus: 'received' | 'cooking' | 'ready' | 'delivered';
  scheduledDeliveryTime?: Date; // When customer wants delivery
  estimatedPreparationTime: number; // in minutes
  actualDeliveryTime?: Date;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  userId?: string; // User who created the order
  ownerId?: string; // Order owner (for change owner feature)
  notes?: string;
  voidReason?: string; // Reason for voiding
  createdAt: Date;
  updatedAt: Date;
  orderTime?: Date; // Time when order was placed
  revenueRecorded?: boolean; // Track if revenue was added to daily stats
}

// ... (Rest of interfaces)


// F&B Revenue and Sales Interfaces
export interface FBRevenue {
  id: string;
  date: Date;
  totalSales: number;
  totalPayment: number;
  totalOrders: number;
  totalDiscount: number;
  totalCustomers: number;
  totalVoid: number;
  orderTypeSummary: Record<string, number>; // e.g., { 'dine_in': 100, 'takeaway': 50 }
  paymentSummary: Record<string, number>; // e.g., { 'cash': 200, 'card': 300 }
  categorySummary: Record<string, number>; // Sales by category
  createdAt: Date;
  updatedAt: Date;
}

export interface FBWeeklyRevenue {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  orders: number;
  averageOrderValue: number;
}

// Guest Service Interface
export interface GuestService {
  id: string;
  bookingId?: string;
  guestName: string;
  guestPhone: string;
  roomNumber?: string;
  roomCategory?: string; // e.g., "Garden Suite", "Imperial Suite"
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
  transactionId?: string; // Linked financial transaction
  createdAt: Date;
  updatedAt: Date;
}

// Checkout Bill Interface
export interface CheckoutBill {
  id: string;
  bookingId: string;
  guestName: string;
  guestEmail?: string;
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
  // Custom/Manual Transactions
  customCharges: number;
  transactions: Array<{
    id: string;
    date: Date;
    description: string;
    amount: number;
    type: 'charge' | 'payment' | 'allowance' | 'adjustment';
    category: string;
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
  maintenanceLogId?: string;
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
  amenities?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Meal Plan Settings ====================

export interface MealPlanSettings {
  adultHalfBoardPrice: number;
  adultFullBoardPrice: number;
  childHalfBoardPrice: number;
  childFullBoardPrice: number;
}

export const getMealPlanSettings = async (): Promise<MealPlanSettings> => {
  if (!db) {
    console.warn('Firestore is not initialized.');
    return {
      adultHalfBoardPrice: 30,
      adultFullBoardPrice: 50,
      childHalfBoardPrice: 20,
      childFullBoardPrice: 30
    };
  }
  try {
    const docRef = doc(db, 'settings', 'meal_plans');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as MealPlanSettings;
    }
    // Default values if not set
    return {
      adultHalfBoardPrice: 30,
      adultFullBoardPrice: 50,
      childHalfBoardPrice: 20,
      childFullBoardPrice: 30
    };
  } catch (error) {
    console.error('Error fetching meal plan settings:', error);
    return {
      adultHalfBoardPrice: 30,
      adultFullBoardPrice: 50,
      childHalfBoardPrice: 20,
      childFullBoardPrice: 30
    };
  }
};

export const updateMealPlanSettings = async (settings: MealPlanSettings): Promise<boolean> => {
  if (!db) {
    console.error('Firestore is not initialized.');
    return false;
  }
  try {
    const docRef = doc(db, 'settings', 'meal_plans');
    await setDoc(docRef, settings, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating meal plan settings:', error);
    return false;
  }
};

// ==================== Inventory Management Interfaces ====================

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  paymentTerms?: string; // e.g., "Net 30"
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Inventory Item
export interface InventoryCategory {
  id: string;
  name: string; // machine name (slug) - used for filtering
  label: string; // display label
  createdAt: Date;
}

export type InventoryDepartment = string;

export interface Department {
  id: string;
  name: string; // The display name, e.g. "Kitchen"
  slug: string; // The functional ID, e.g. "kitchen"
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  department: InventoryDepartment; // Strict categorization
  category: string;
  subcategory?: string;
  sku: string;
  unit: 'kg' | 'liter' | 'piece' | 'bottle' | 'box' | 'pack' | 'can' | 'gram' | 'ml' | 'other'; // Consumption Unit
  purchaseUnit?: string; // e.g. "Case", "Box"
  conversionFactor?: number; // e.g. 24 (1 Case = 24 Pieces)

  // Stock Levels
  currentStock: number;
  minStockLevel: number; // Low stock alert
  maxStockLevel: number; // Overstock alert
  reorderPoint: number; // Automatic reorder trigger

  // Costing & Valuation
  unitCost: number; // Moving Average Cost or Last Purchase Price
  totalValue: number; // currentStock * unitCost

  // Procurement
  preferredSupplierId?: string;
  lastPurchasedDate?: Date;
  lastPurchasedPrice?: number;

  // Storage
  location?: string; // e.g., "Main Store", "Kitchen Freezer"
  expiryDate?: Date; // For perishable items

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // Auto-generated e.g., PO-2024-001
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'sent' | 'received' | 'partially_received' | 'cancelled';

  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    receivedQuantity?: number; // For partial delivery
  }>;

  subtotal: number;
  taxAmount?: number;
  shippingCost?: number;
  totalAmount: number;

  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;

  notes?: string;
  createdBy: string;
  approvedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromLocation: string; // e.g. "Main Store"
  toLocation: string;   // e.g. "Kitchen"
  status: 'pending' | 'completed' | 'cancelled';

  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
  }>;

  transferredBy: string;
  date: Date;
  notes?: string;
}

export interface Recipe {
  id: string;
  menuItemId: string; // Link to Menu Item
  menuItemName: string;

  ingredients: Array<{
    inventoryItemId: string;
    inventoryItemName: string;
    quantity: number; // Amount used per portion
    unit: string;
    costPerUnit: number; // Snapshot of cost at time of recipe creation/update
    totalCost: number;
  }>;

  totalCost: number; // Sum of ingredients
  sellingPrice: number; // From Menu Item
  foodCostPercentage: number; // (totalCost / sellingPrice) * 100

  instructions?: string;
  preparationTime?: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory Transaction Interface (Enhanced)
export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  itemName: string;
  transactionType: 'purchase' | 'usage' | 'waste' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'sales_deduction';

  quantity: number; // Positive for add, Negative for reduce
  unitCost: number;
  totalCost: number;

  previousStock: number;
  newStock: number;

  reason?: string;
  referenceId?: string; // Link to PO, Order, or Adjustment ID

  performedBy: string; // Staff member
  createdAt: Date;
}

// Low Stock Alert Interface
export interface LowStockAlert {
  id: string;
  inventoryItemId: string;
  itemName: string;
  currentStock: number;
  minStockLevel: number;
  status: 'active' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
}

// ==================== Cashiering Master Data Interfaces ====================

export interface TravelAgent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  commissionRate?: number;
  address?: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxId?: string; // VAT/GST
  creditLimit?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketSegment {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessSource {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Audit Trail ====================

export interface AuditLogEntry {
  id: string;
  businessDate: string;
  timestamp: Date;
  action: string;
  details?: string;
  user?: string; // e.g. "System" or "Admin"
  ip?: string;
  oldValue?: string;
  newValue?: string;
  category: string; // Relaxed to string to support master data collection names
  createdAt: Date;
}

export const createAuditLog = async (log: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    const ref = collection(db, 'auditLogs');
    const docRef = await addDoc(ref, {
      ...log,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
}

export const getAuditLogs = async (businessDate?: string, category?: string): Promise<AuditLogEntry[]> => {
  if (!db) return [];
  try {
    const ref = collection(db, 'auditLogs');
    let q = query(ref, orderBy('timestamp', 'desc'));

    if (businessDate) {
      q = query(ref, where('businessDate', '==', businessDate), orderBy('timestamp', 'desc'));
    }

    if (category) {
      // If businessDate is also provided, we might need composite index. 
      // For now, let's assume filtering by category is primarily for the Master Data modal which doesn't filter by businessDate initially.
      // Remove orderBy to avoid needing a composite index immediately.
      // We will sort in memory below.
      q = query(ref, where('category', '==', category));
    }

    const snap = await getDocs(q);
    const results = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as AuditLogEntry[];

    // Sort in memory to ensure correct order without composite index
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

// ==================== Accounts Management Interfaces ====================

// Accounts Ledger Entry Interface
export interface LedgerEntry {
  id: string;
  date: Date;
  entryType: 'income' | 'expense';
  category: 'room_booking' | 'food_beverage' | 'services' | 'facilities' | 'salary' | 'utilities' | 'maintenance' | 'supplies' | 'marketing' | 'other' | 'Payment' | 'Room Charge' | 'room_charge' | 'Tax' | 'tax' | 'Food' | 'Beverage' | 'Restaurant' | 'Bar';
  subcategory?: string;
  amount: number;
  description: string;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'online' | 'cheque';
  // New Hotel Specific Fields
  referenceNumber?: string; // Invoice #, Receipt #
  payerOrPayee?: string; // Guest Name, Vendor Name, Staff Name
  department?: 'front_office' | 'housekeeping' | 'kitchen' | 'maintenance' | 'hr' | 'accounts' | 'other';
  status?: 'pending' | 'cleared' | 'void';
  attachmentUrl?: string;

  referenceId?: string; // Link to booking, order, etc.
  invoiceNumber?: string;
  taxAmount?: number;
  netAmount?: number;
  accountsReceivable?: boolean; // Pending payment
  accountsPayable?: boolean; // Pending payment to vendor
  paidDate?: Date;
  createdBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Expense Interface
export interface Expense {
  id: string;
  date: Date;
  category: 'salary' | 'utilities' | 'maintenance' | 'supplies' | 'marketing' | 'inventory_purchase' | 'other';
  vendor?: string;
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online';
  receiptNumber?: string;
  invoiceNumber?: string;
  isPaid: boolean;
  paidDate?: Date;
  approvedBy?: string;
  notes?: string;
  attachments?: string[]; // URLs to receipt images
  createdAt: Date;
  updatedAt: Date;
}

// Financial Summary Interface
export interface FinancialSummary {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  accountsReceivable: number;
  accountsPayable: number;
}

// ==================== Staff Management Interfaces ====================

// Staff Member Interface
export interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  salary: number;
  salaryType: 'monthly' | 'hourly' | 'daily';
  joinDate: Date;
  status: 'active' | 'on_leave' | 'terminated' | 'resigned';
  designation?: string;
  terminationDate?: Date;
  address?: string;
  // Flat fields for easier form handling
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  idProofType?: string;
  idProofNumber?: string;
  // Legacy object (optional)
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents?: {
    type: string;
    url: string;
  }[];
  performanceRating?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Staff Attendance Interface
export interface StaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'half_day' | 'on_leave';
  leaveType?: 'sick' | 'casual' | 'annual' | 'other';
  notes?: string;
  createdAt: Date;
}

// ==================== Audit Log Interface ====================

// Audit Log Interface
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'other';
  resource: string; // e.g., 'booking', 'menu_item', 'inventory'
  resourceId?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: Date;
}

// ==================== Night Audit Interfaces ====================

export interface BusinessDay {
  id: string; // 'current' (singleton)
  date: Date; // Current business date
  status: 'open' | 'closed' | 'audit_in_progress';
  openedAt: Date;
  openedBy: string;
  lastAuditDate?: Date;
  updatedAt: Date;
}

export interface NightAuditLog {
  id: string;
  date: Date; // The business date being audited
  startedAt: Date;
  completedAt?: Date;
  auditedBy: string;
  status: 'in_progress' | 'completed' | 'failed';
  steps: {
    roomChargesPosted: boolean;
    roomStatusUpdated: boolean;
    reportsGenerated: boolean;
    businessDateRolled: boolean;
  };
  summary: {
    totalRevenue: number;
    totalOccupiedRooms: number;
    totalArrivals: number;
    totalDepartures: number;
  };
  notes?: string;
  createdAt: Date;
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
    // ... (existing getRooms implementation)
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

    // Sync Guest Profile
    try {
      const { guestDetails } = bookingData;
      if (guestDetails && (guestDetails.email || guestDetails.phone)) {
        const guestsRef = collection(db, 'guests');
        let q;

        // Priority to email match, then phone
        if (guestDetails.email) {
          q = query(guestsRef, where('email', '==', guestDetails.email));
        } else {
          q = query(guestsRef, where('phone', '==', guestDetails.phone));
        }

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Update existing guest
          const guestDoc = snapshot.docs[0];
          const guestData = guestDoc.data() as GuestProfile;
          await updateDoc(guestDoc.ref, {
            totalStays: (guestData.totalStays || 0) + 1,
            totalRevenue: (guestData.totalRevenue || 0) + (bookingData.totalAmount || 0),
            lastStayDate: new Date(),
            updatedAt: serverTimestamp()
          });
        } else {
          // Create new guest
          await addDoc(guestsRef, {
            firstName: guestDetails.firstName,
            lastName: guestDetails.lastName,
            email: guestDetails.email || '',
            phone: guestDetails.phone || '',
            nationality: guestDetails.nationality || '',
            address: {
              street: guestDetails.address || '',
              city: guestDetails.city || '',
              country: guestDetails.country || '',
              zipCode: guestDetails.zipCode || ''
            },
            idDocumentType: guestDetails.idType || '',
            idDocumentNumber: guestDetails.idNumber || '',
            totalStays: 1,
            totalRevenue: bookingData.totalAmount || 0,
            lastStayDate: new Date(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (guestError) {
      console.error('Error syncing guest profile:', guestError);
      // Continue with booking creation even if guest sync fails
    }

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

      // Sanitization Helper (same as getAllBookings)
      const safeDateToISO = (val: any): string => {
        try {
          if (!val) return new Date().toISOString();
          if (val && typeof val.toDate === 'function') {
            return val.toDate().toISOString();
          }
          const d = new Date(val);
          return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        } catch (error) {
          return new Date().toISOString();
        }
      };

      return {
        id: bookingSnap.id,
        ...data,
        checkIn: safeDateToISO(data.checkIn),
        checkOut: safeDateToISO(data.checkOut),
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

export const getAllBookings = async (startDate?: Date): Promise<Booking[]> => {
  if (!db) {
    console.warn('Firestore not available, cannot get bookings');
    return [];
  }

  try {
    const bookingsRef = collection(db, 'bookings');
    let q;

    if (startDate) {
      q = query(bookingsRef, where('created_at', '>=', startDate), orderBy('created_at', 'desc'));
      // Fallback if 'created_at' index is missing or using 'createdAt'
      // Note: App seems to use 'created_at' (snake_case) or standard 'createdAt'?
      // We will try standard 'createdAt' as per schema.
      q = query(bookingsRef, where('createdAt', '>=', startDate), orderBy('createdAt', 'desc'));
    } else {
      q = query(bookingsRef, orderBy('createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();

      // ==============================================================
      // ADAPTER: Handle App Bookings (Missing guestDetails / status)
      // ==============================================================
      let finalGuestDetails = data.guestDetails;
      let finalStatus = data.status;
      let finalRooms = data.rooms;

      // 1. Map Guest Details from reservationGuests if missing
      if (!finalGuestDetails && data.reservationGuests && data.reservationGuests.length > 0) {
        const primaryGuest = data.reservationGuests[0];
        // Split name if needed
        const nameParts = (primaryGuest.firstName || '').split(' ');
        const firstName = nameParts[0] || 'Guest';
        const lastName = nameParts.slice(1).join(' ') || '';

        finalGuestDetails = {
          firstName: firstName,
          lastName: lastName,
          email: primaryGuest.email || '', // Might be missing in app struct
          phone: primaryGuest.phone || '',
          prefix: '',
          idNumber: primaryGuest.userId // Use userId as ref if nothing else
        };
      }

      // 2. Map Status from reservationGuests if missing at root
      if (!finalStatus && data.reservationGuests && data.reservationGuests.length > 0) {
        finalStatus = data.reservationGuests[0].status || 'pending';
      }
      if (!finalStatus) finalStatus = 'pending'; // Default fallback

      // 3. Map Rooms from activities or defaults if missing
      if (!finalRooms || finalRooms.length === 0) {
        if (data.activities && data.activities.length > 0) {
          // Treat activities as rooms for display purposes if real room missing
          finalRooms = data.activities.map((act: any) => ({
            type: act.name,
            price: act.price,
            status: finalStatus,
            allocatedRoomType: 'App Booking',
            suiteType: 'Garden Suite' // Default fallback
          }));
        } else {
          // Absolute fallback
          finalRooms = [{
            type: 'App/Unknown Room',
            price: data.totalAmount || 0,
            status: finalStatus,
            suiteType: 'Garden Suite'
          }];
        }
      }
      // ==============================================================






      // 4. Sanitize Dates (Handle Timestamp, String, or Date)
      const safeDateToISO = (val: any): string => {
        try {
          if (!val) return new Date().toISOString();
          // Handle Firestore Timestamp
          if (val && typeof val.toDate === 'function') {
            return val.toDate().toISOString();
          }
          // Handle String or Date
          const d = new Date(val);
          return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        } catch (error) {
          return new Date().toISOString();
        }
      };

      let finalCheckIn = safeDateToISO(data.checkIn);
      let finalCheckOut = safeDateToISO(data.checkOut);
      // ==============================================================

      return {
        id: doc.id,
        ...data,
        checkIn: finalCheckIn, // Override with sanitized ISO
        checkOut: finalCheckOut, // Override with sanitized ISO
        guestDetails: finalGuestDetails || { firstName: 'Unknown', lastName: 'Guest', email: '', phone: '' },
        status: finalStatus,
        rooms: finalRooms,
        createdAt: data.createdAt?.toDate() ? data.createdAt.toDate() : (data.updatedAt?.toDate() ? data.updatedAt.toDate() : new Date()),
        updatedAt: data.updatedAt?.toDate() ? data.updatedAt.toDate() : new Date(),
      } as Booking;
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

export const syncGuestProfile = async (guestDetails: Booking['guestDetails'], additionalData: { totalAmount?: number, isCheckIn?: boolean } = {}) => {
  if (!db || !guestDetails) return;

  try {
    const guestsRef = collection(db, 'guests');
    let q;

    // Priority to email match, then phone
    if (guestDetails.email) {
      q = query(guestsRef, where('email', '==', guestDetails.email));
    } else if (guestDetails.phone) {
      q = query(guestsRef, where('phone', '==', guestDetails.phone));
    } else {
      return; // Cannot sync without email or phone
    }

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Update existing guest
      const guestDoc = snapshot.docs[0];
      const guestData = guestDoc.data();

      const updatePayload: any = {
        updatedAt: serverTimestamp(),
        // Always update latest contact info if provided
        firstName: guestDetails.firstName,
        lastName: guestDetails.lastName,
        phone: guestDetails.phone,
        email: guestDetails.email,
        nationality: guestDetails.nationality || guestData.nationality,
        address: guestDetails.address ? {
          street: guestDetails.address,
          city: guestDetails.city,
          country: guestDetails.country,
          zipCode: guestDetails.zipCode
        } : guestData.address,
        idDocumentType: guestDetails.idType || guestData.idDocumentType,
        idDocumentNumber: guestDetails.idNumber || guestData.idDocumentNumber,
      };

      if (additionalData.isCheckIn) {
        updatePayload.totalStays = (guestData.totalStays || 0) + 1;
        updatePayload.lastStayDate = new Date();
      }

      if (additionalData.totalAmount) {
        updatePayload.totalRevenue = (guestData.totalRevenue || 0) + additionalData.totalAmount;
      }

      await updateDoc(guestDoc.ref, updatePayload);
    } else {
      // Create new guest
      await addDoc(guestsRef, {
        firstName: guestDetails.firstName,
        lastName: guestDetails.lastName,
        email: guestDetails.email || '',
        phone: guestDetails.phone || '',
        nationality: guestDetails.nationality || '',
        address: {
          street: guestDetails.address || '',
          city: guestDetails.city || '',
          country: guestDetails.country || '',
          zipCode: guestDetails.zipCode || ''
        },
        idDocumentType: guestDetails.idType || '',
        idDocumentNumber: guestDetails.idNumber || '',
        totalStays: additionalData.isCheckIn ? 1 : 0,
        totalRevenue: additionalData.totalAmount || 0,
        lastStayDate: additionalData.isCheckIn ? new Date() : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error syncing guest profile:', error);
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

    // Check if we need to sync guest profile
    // 1. If checking in
    if (bookingData.status === 'checked_in') {
      // We might not have the full guest details in bookingData (it might be partial), so we might need to fetch the booking
      // However, often check-in modal passes updated details.
      // For safety, let's fetch the full booking to get complete Guest Details if not in payload
      try {
        const fullBookingSnap = await getDoc(bookingRef);
        if (fullBookingSnap.exists()) {
          const fullBooking = fullBookingSnap.data() as Booking;
          await syncGuestProfile(fullBooking.guestDetails, {
            isCheckIn: true,
            totalAmount: fullBooking.totalAmount
          });
        }
      } catch (err) {
        console.error("Failed to sync guest on checkin", err);
      }
    }
    // 2. If guest details are updated explicitly (e.g. from booking details)
    else if (bookingData.guestDetails) {
      await syncGuestProfile(bookingData.guestDetails);
    }

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
export const createBookingEnquiry = async (data: Omit<BookingEnquiry, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string | null> => {
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
    const qy = query(c, orderBy('createdAt', 'desc'));
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

export const getBusinessDay = async (): Promise<BusinessDay> => {
  if (!db) {
    return {
      id: 'current',
      date: new Date(),
      status: 'open',
      openedAt: new Date(),
      openedBy: 'system',
      updatedAt: new Date()
    };
  }

  try {
    const docRef = doc(db, 'businessDays', 'current');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: 'current',
        ...data,
        date: data.date?.toDate() || new Date(),
        openedAt: data.openedAt?.toDate() || new Date(),
        lastAuditDate: data.lastAuditDate?.toDate(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BusinessDay;
    }

    // Default if not found
    return {
      id: 'current',
      date: new Date(),
      status: 'open',
      openedAt: new Date(),
      openedBy: 'system',
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error fetching business day:', error);
    return {
      id: 'current',
      date: new Date(),
      status: 'open',
      openedAt: new Date(),
      openedBy: 'system',
      updatedAt: new Date()
    };
  }
};

export const createExcursion = async (data: Omit<Excursion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
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
    return [];
  } catch (error) {
    console.error('Error fetching offers:', error);
    return [];
  }
};

// ==================== Transaction Codes & System Locks ====================

export interface TransactionCode {
  code: string;
  description: string;
  type: 'charge' | 'payment' | 'adjustment';
  group: 'room' | 'fb' | 'misc' | 'payment';
}

export const getTransactionCodes = async (): Promise<TransactionCode[]> => {
  // In a real app, this would come from a 'transactionCodes' collection.
  // For now, we return a comprehensive static list to simulate "dynamic" master data.
  return [
    // Charges
    { code: '1000', description: 'Room Charge', type: 'charge', group: 'room' },
    { code: '2000', description: 'F&B Breakfast', type: 'charge', group: 'fb' },
    { code: '2001', description: 'F&B Lunch', type: 'charge', group: 'fb' },
    { code: '2002', description: 'F&B Dinner', type: 'charge', group: 'fb' },
    { code: '2010', description: 'Bar / Beverage', type: 'charge', group: 'fb' },
    { code: '3000', description: 'Laundry', type: 'charge', group: 'misc' },
    { code: '3001', description: 'Minibar', type: 'charge', group: 'misc' },
    { code: '3002', description: 'Spa Service', type: 'charge', group: 'misc' },
    { code: '3003', description: 'Transport', type: 'charge', group: 'misc' },
    { code: '3004', description: 'Excursion', type: 'charge', group: 'misc' },
    { code: '9000', description: 'Miscellaneous Charge', type: 'charge', group: 'misc' },

    // Payments
    { code: '9001', description: 'Cash Payment', type: 'payment', group: 'payment' },
    { code: '9002', description: 'Credit Card - Visa', type: 'payment', group: 'payment' },
    { code: '9003', description: 'Credit Card - MasterCard', type: 'payment', group: 'payment' },
    { code: '9004', description: 'Credit Card - Amex', type: 'payment', group: 'payment' },
    { code: '9005', description: 'Bank Transfer', type: 'payment', group: 'payment' },

    // Adjustments
    { code: '8000', description: 'Allowance / Rebate', type: 'adjustment', group: 'room' },
  ];
};

export interface SystemLock {
  id: string;
  resourceType: 'folio' | 'room' | 'date' | 'system';
  resourceId: string;
  resourceName: string;
  lockedBy: string;
  lockedAt: Date;
  description: string;
}

export const getSystemLocks = async (): Promise<SystemLock[]> => {
  if (!db) return [];
  try {
    const ref = collection(db, 'systemLocks');
    const q = query(ref, orderBy('lockedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lockedAt: doc.data().lockedAt?.toDate() || new Date()
    })) as SystemLock[];
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const addSystemLock = async (lockData: Omit<SystemLock, 'id'>): Promise<string> => {
  if (!db) throw new Error('DB not available');
  const ref = collection(db, 'systemLocks');
  const docRef = await addDoc(ref, lockData);
  return docRef.id;
};

export const deleteSystemLock = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const ref = doc(db, 'systemLocks', id);
    await deleteDoc(ref);
    return true;
  } catch (e) {
    console.error('Error deleting system lock:', e);
    return false;
  }
};

export const createOffer = async (data: Omit<OfferBanner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
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

export const createDiscountOffer = async (data: Omit<DiscountOffer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
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

export const updateDiscountOffer = async (id: string, data: Partial<Omit<DiscountOffer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
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
        targetAudience: data.targetAudience || 'all',
        roomTypes: data.roomTypes || [],
        discountType: data.discountType || 'percentage',
        discountValue: data.discountValue || 0,
        couponMode: data.couponMode || 'none',
        couponCode: data.couponCode || null,
        stayNights: data.stayNights || undefined,
        payNights: data.payNights || undefined,
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
      targetAudience: data.targetAudience || 'all',
      roomTypes: data.roomTypes || [],
      discountType: data.discountType || 'percentage',
      discountValue: data.discountValue || 0,
      couponMode: data.couponMode || 'none',
      couponCode: data.couponCode || null,
      stayNights: data.stayNights || undefined,
      payNights: data.payNights || undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as SpecialOffer;
  } catch (e) {
    console.error('Error fetching special offer:', e);
    return null;
  }
};

// Special Offers CRUD Operations
export const createSpecialOffer = async (data: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt' | 'lastNotificationSentAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    const specialOffersRef = collection(db, 'specialOffers');
    const docRef = await addDoc(specialOffersRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating special offer:', error);
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

export const createStoryImage = async (data: Omit<StoryImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
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
    const qy = type ? query(c, orderBy('createdAt', 'desc')) : query(c, orderBy('createdAt', 'desc'));
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

export const createGalleryImage = async (data: Omit<GalleryImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
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

export const createTestimonial = async (data: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
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
    // 1. Try fetching from new 'roomTypes' collection
    // We remove orderBy to ensure we get docs even if 'createdAt' is missing
    const c = collection(db, 'roomTypes');
    const qy = suiteType ? query(c) : query(c);
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

    // 2. If empty, fallback to legacy 'room_types' collection
    if (items.length === 0) {
      console.warn('roomTypes empty, falling back to room_types');
      const cLegacy = collection(db, 'room_types');
      const qyLegacy = suiteType ? query(cLegacy) : query(cLegacy);
      const snapLegacy = await getDocs(qyLegacy);

      items = snapLegacy.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          suiteType: data.suiteType as SuiteType, // Ensure mapping matches
          roomName: data.roomName || data.name, // Handle potential schema diff
          isActive: data.isActive !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as RoomType;
      });
    }

    // Filter by suiteType (client-side to be safe)
    if (suiteType) {
      items = items.filter(i => i.suiteType === suiteType);
    }

    // Sort client-side
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
        availableFrom: data.availableFrom?.toDate?.() || data.availableFrom || undefined,
        availableTo: data.availableTo?.toDate?.() || data.availableTo || undefined,
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
    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = v;
    });
    const dr = await addDoc(c, {
      status: 'published',
      isArchived: false,
      taxGroup: 'VAT',
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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
    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = v;
    });
    await updateDoc(r, { ...clean, updatedAt: serverTimestamp() });
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

// Menu Categories CRUD
export const getMenuCategories = async (): Promise<MenuCategory[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'menuCategories');
    const qy = query(c, orderBy('order', 'asc'));
    const snap = await getDocs(qy);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        label: data.label,
        parentId: data.parentId || null,
        order: data.order ?? 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as MenuCategory;
    });
  } catch (e) {
    console.error('Error fetching menu categories:', e);
    return [];
  }
};

export const createMenuCategory = async (data: Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    const c = collection(db, 'menuCategories');
    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = v;
    });
    const dr = await addDoc(c, { ...clean, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return dr.id;
  } catch (e) {
    console.error('Error creating menu category:', e);
    return null;
  }
};

export const updateMenuCategory = async (id: string, data: Partial<MenuCategory>): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'menuCategories', id);
    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = v;
    });
    await updateDoc(r, { ...clean, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('Error updating menu category:', e);
    return false;
  }
};

export const deleteMenuCategory = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'menuCategories', id);
    await deleteDoc(r);
    return true;
  } catch (e) {
    console.error('Error deleting menu category:', e);
    return false;
  }
};

// Bulk updates for menu items
export const updateMenuItemsAvailability = async (ids: string[], isAvailable: boolean): Promise<boolean> => {
  if (!db) return false;
  try {
    await Promise.all(ids.map(id => {
      if (!db) return Promise.resolve();
      const refDoc = doc(db, 'menuItems', id);
      return updateDoc(refDoc, { isAvailable, updatedAt: serverTimestamp() });
    }));
    return true;
  } catch (e) {
    console.error('Error updating menu items availability:', e);
    return false;
  }
};

export const updateMenuItemsStatus = async (ids: string[], status: 'draft' | 'published' | 'archived'): Promise<boolean> => {
  if (!db) return false;
  try {
    await Promise.all(ids.map(id => {
      if (!db) return Promise.resolve();
      const refDoc = doc(db, 'menuItems', id);
      return updateDoc(refDoc, { status, isArchived: status === 'archived', updatedAt: serverTimestamp() });
    }));
    return true;
  } catch (e) {
    console.error('Error updating menu items status:', e);
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

    // AUTOMATIC BOOKING LINKING
    // If roomNumber is provided but no bookingId, try to find the active booking
    if (data.roomNumber && !data.bookingId) {
      try {
        const roomStatus = await getRoomStatus(data.roomNumber);
        if (roomStatus && roomStatus.status === 'occupied' && roomStatus.currentBookingId) {
          data.bookingId = roomStatus.currentBookingId;
          console.log(`Auto-linked Order to Booking: ${roomStatus.currentBookingId} for Room ${data.roomNumber}`);
        }
      } catch (err) {
        console.warn("Failed to auto-link booking:", err);
      }
    }

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
      revenueRecorded: false // Default to false
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
    // Check if we need to record revenue (Status changed to delivered/paid)
    if ((data.status === 'delivered' || data.paymentStatus === 'paid')) {
      const currentOrder = await getFoodOrder(id);
      if (currentOrder && !currentOrder.revenueRecorded) {
        // Record Revenue
        await updateDailyFBRevenue(new Date(), { ...currentOrder, ...data } as FoodOrder);
        data.revenueRecorded = true;
        console.log("Revenue Recorded for Order:", id);
      }
    }

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

export const updateGuestService = async (id: string, data: Partial<GuestService> & { createTransaction?: boolean }): Promise<boolean> => {
  if (!db) return false;
  try {
    const { createTransaction, ...updateData } = data;

    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(updateData).forEach(key => {
      const value = (updateData as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });

    const docRef = doc(db, 'guestServices', id);
    await updateDoc(docRef, { ...cleanData, updatedAt: serverTimestamp() });

    // Financial Integration Logic
    if (createTransaction && updateData.status === 'completed') {
      // 1. Fetch the full service record to get amount and bookingId
      const serviceSnap = await getDoc(docRef);
      if (!serviceSnap.exists()) return true;
      const service = serviceSnap.data() as GuestService;

      // 2. Validate essential data
      // Use totalAmount if available, fallback to amount
      const chargeAmount = service.totalAmount || service.amount;

      if (!service.bookingId || !chargeAmount || service.transactionId) {
        console.warn("Skipping auto-transaction: Missing bookingId, amount, or already charged.");
        return true;
      }

      // 3. Create Transaction
      const transactionId = await addTransaction({
        bookingId: service.bookingId,
        amount: chargeAmount,
        type: 'charge',
        category: service.serviceCategory || 'misc',
        description: `Service Charge: ${service.serviceCategory.charAt(0).toUpperCase() + service.serviceCategory.slice(1)} - ${service.serviceType?.replace('_', ' ') || 'Service'}`,
        date: new Date(),
        reference: `SVC-${serviceSnap.id.slice(-6).toUpperCase()}`,
        userId: 'System',
        code: 'SERVICE_CHARGE'
      });

      // 4. Link transaction back to service
      if (transactionId) {
        await updateDoc(docRef, { transactionId });
      }
    }

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

// ==================== Inventory CRUD Operations (Added for Enterprise Upgrade) ====================

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'inventory');
    const qy = query(c, orderBy('name', 'asc'));
    const snap = await getDocs(qy);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as InventoryItem;
    });
  } catch (e) {
    console.error('Error fetching inventory items:', e);
    return [];
  }
};

export const getLowStockInventory = async (): Promise<InventoryItem[]> => {
  if (!db) return [];
  try {
    // Note: Collection is 'inventory' based on getInventoryItems
    const c = collection(db, 'inventory');
    const qy = query(c, where('isActive', '==', true));
    const snap = await getDocs(qy);
    const items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as InventoryItem;
    });
    // Filter in memory for now as minStockLevel is per item
    return items.filter(item => item.currentStock <= (item.minStockLevel || 0));
  } catch (e) {
    console.error('Error fetching low stock inventory:', e);
    return [];
  }
};

export const getPendingPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'purchaseOrders');
    const qy = query(c, where('status', 'in', ['sent', 'partially_received']));
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || new Date(),
      updatedAt: d.data().updatedAt?.toDate() || new Date()
    } as PurchaseOrder));
  } catch (e) {
    console.error('Error fetching pending purchase orders:', e);
    return [];
  }
};

export const getInventoryItem = async (id: string): Promise<InventoryItem | null> => {
  if (!db) return null;
  try {
    const d = doc(db, 'inventory', id);
    const s = await getDoc(d);
    if (!s.exists()) return null;
    const data = s.data();
    return {
      id: s.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as InventoryItem;
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return null;
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

    const roomCharges = (booking.rooms || []).reduce((sum, room) => sum + (room.price * nights), 0);

    // Get food orders
    const foodOrders = booking.foodOrderIds ? await Promise.all(
      booking.foodOrderIds.map(id => getFoodOrder(id))
    ) : [];

    // Filter out Cancelled, Voided, or already Paid orders
    const validFoodOrders = (foodOrders.filter(o => o !== null) as FoodOrder[]).filter(o =>
      o.status !== 'cancelled' &&
      o.status !== 'voided' &&
      o.paymentStatus !== 'paid'
    );

    const foodCharges = validFoodOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Get guest services
    // Get guest services
    const services = booking.guestServiceIds ? await Promise.all(
      booking.guestServiceIds.map(id => getGuestService(id))
    ) : [];

    // Filter services: Exclude Cancelled services
    const validServices = (services.filter(s => s !== null) as GuestService[]).filter(s =>
      s.status !== 'cancelled'
    );

    const serviceCharges = validServices.reduce((sum, service) => sum + (service.totalAmount || service.amount || 0), 0);

    // Get folio transactions (real-time payments and charges)
    const transactions = await getFolioTransactions(bookingId);

    // Calculate additional charges from transactions (e.g., ad-hoc charges)
    const transactionCharges = transactions
      .filter(t => t.type === 'charge')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate total payments from transactions
    const transactionPayments = transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    // Add-ons charges
    const addOnsCharges = (booking.addOns || []).reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);

    // Calculate taxes (Removed hardcoded 10% as per user request)
    const subtotal = roomCharges + foodCharges + serviceCharges + addOnsCharges + transactionCharges;
    const taxes = 0; // No hardcoded tax
    const totalAmount = subtotal + taxes;

    // Total Paid: Booking initial payment + Transaction payments
    // If transactions are used effectively, they should likely track ALL payments including the initial one if recorded there.
    // For safety, we sum booking.paidAmount (if not duplicated) and transactionPayments.
    // However, if the initial payment isn't in transactions, we add it. 
    // Best approach: Use transactionPayments if > 0 (implying system is used), else fallback or add.
    // Let's being additive but careful. If transactionPayments > 0, we assume it captures flow. 
    // Actually, simple addition is safest unless we migrate old payments.
    const alreadyPaid = (booking.paidAmount || 0) + transactionPayments;

    const balance = totalAmount - alreadyPaid;
    const paymentStatus: CheckoutBill['paymentStatus'] =
      balance <= 0 ? 'paid' : (alreadyPaid > 0 ? 'partial' : 'pending');

    // Get room number - use allocated room type as fallback
    const roomNumber = booking.roomNumber || (booking.rooms && booking.rooms[0]?.allocatedRoomType) || null;

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
      roomDetails: (booking.rooms || []).map(room => ({
        roomType: room.type || '',
        nights: nights || 0,
        rate: room.price || 0,
        total: (room.price || 0) * (nights || 0),
      })),
      foodOrders: validFoodOrders.map(order => ({
        orderId: order.id || '',
        orderNumber: order.orderNumber || '',
        date: order.createdAt || new Date(),
        amount: order.totalAmount || 0,
      })),
      services: validServices.map(service => ({
        serviceId: service.id || '',
        serviceType: service.serviceType || '',
        description: service.description || '',
        amount: service.amount || 0,
        date: service.requestedAt || new Date(),
      })),
      facilities: [], // Can be extended
      addOns: (booking.addOns || []).map(addon => ({
        name: addon.name || '',
        quantity: addon.quantity || 0,
        price: addon.price || 0,
        total: (addon.price || 0) * (addon.quantity || 0),
      })),
      customCharges: transactionCharges,
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.date || new Date(),
        description: t.description || '',
        amount: t.amount || 0,
        type: t.type,
        category: t.category || 'General'
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
    const c = collection(db, 'room_statuses');
    let snap;
    try {
      const qy = query(c, orderBy('createdAt', 'desc'));
      snap = await getDocs(qy);
    } catch (e) {
      console.warn('Index missing for roomStatuses, falling back to unsorted', e);
      snap = await getDocs(c);
    }

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
    const c = collection(db, 'room_statuses');
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

    const c = collection(db, 'room_statuses');
    const dr = await addDoc(c, { ...cleanData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return dr.id;
  } catch (e) {
    console.error('Error creating room status:', e);
    return null;
  }
};

// Maintenance workflow helpers
// Maintenance workflow helpers
export const markRoomForMaintenance = async (
  roomName: string,
  startDate: Date,
  endDate: Date,
  reason: string
): Promise<boolean> => {
  if (!db) return false;
  try {
    const batch = writeBatch(db);

    // 1. Update Daily Inventory (Block Availability)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];

    // Normalize to start of day
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0); // Inclusive end date for blocking usually means until the end of that day? 
    // Usually endDate in bookings is check-out (exclusive). 
    // IN `availabilityService` we iterated `currentDate < lastDate`.
    // If user says "12th to 14th", they probably mean 12, 13 (checkout 14) OR 12, 13, 14.
    // Let's assume standard hotel logic: inclusive start, exclusive end for availability.
    // BUT the user said "12 to 14... today is 12".

    const cur = new Date(start);
    // If startDate == endDate, it's a 1 day block?
    // Let's iterate until < end.
    while (cur < end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    // If range is empty (start=end), ensuring at least start date is blocked?
    if (dates.length === 0) {
      dates.push(start.toISOString().split('T')[0]);
    }

    dates.forEach(dateStr => {
      const invRef = doc(db!, 'daily_inventory', dateStr);
      batch.set(invRef, {
        date: dateStr,
        occupiedRooms: arrayUnion(roomName)
      }, { merge: true });
    });

    // 2. Create Maintenance Log Record
    const logRef = doc(collection(db, 'maintenance_logs'));
    batch.set(logRef, {
      roomName,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      reason,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 3. Update RoomStatus
    const roomStatus = await getRoomStatus(roomName);
    if (!roomStatus) {
      // Create new if missing
      const roomTypes = await getRoomTypes();
      const roomType = roomTypes.find(rt => rt.roomName === roomName);
      const suiteType = roomType?.suiteType || 'Garden Suite';
      const newStatusRef = doc(collection(db, 'room_statuses'));

      batch.set(newStatusRef, {
        roomName,
        suiteType,
        status: 'maintenance',
        housekeepingStatus: 'needs_attention',
        maintenanceStartDate: Timestamp.fromDate(startDate),
        maintenanceEndDate: Timestamp.fromDate(endDate),
        maintenanceReason: reason,
        maintenanceLogId: logRef.id, // Link to log
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const statusRef = doc(db, 'room_statuses', roomStatus.id);
      batch.update(statusRef, {
        status: 'maintenance',
        maintenanceStartDate: Timestamp.fromDate(startDate),
        maintenanceEndDate: Timestamp.fromDate(endDate),
        maintenanceReason: reason,
        housekeepingStatus: 'needs_attention',
        maintenanceLogId: logRef.id
      });
    }

    await batch.commit();
    return true;
  } catch (e) {
    console.error('Error marking room for maintenance:', e);
    return false;
  }
};

// Alias for compatibility if imported as setRoomMaintenance anywhere
export const setRoomMaintenance = markRoomForMaintenance;

export const completeRoomMaintenance = async (roomName: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const roomStatus = await getRoomStatus(roomName);
    if (!roomStatus) {
      console.error('Room status not found:', roomName);
      return false;
    }

    const batch = writeBatch(db);

    // 1. Remove from Daily Inventory
    if (roomStatus.maintenanceStartDate && roomStatus.maintenanceEndDate) {
      const start = (roomStatus.maintenanceStartDate as any) instanceof Timestamp ? (roomStatus.maintenanceStartDate as any).toDate() : new Date(roomStatus.maintenanceStartDate);
      const end = (roomStatus.maintenanceEndDate as any) instanceof Timestamp ? (roomStatus.maintenanceEndDate as any).toDate() : new Date(roomStatus.maintenanceEndDate);

      const cur = new Date(start);
      const endDate = new Date(end);

      cur.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      while (cur < endDate) {
        const dateStr = cur.toISOString().split('T')[0];
        const invRef = doc(db, 'daily_inventory', dateStr);
        batch.set(invRef, {
          occupiedRooms: arrayRemove(roomName)
        }, { merge: true });
        cur.setDate(cur.getDate() + 1);
      }
    }

    // 2. Update Maintenance Log (if linked) - Optional but good for records
    // Since we don't have the log ID easily accessible unless stored in RoomStatus (which I just added),
    // we'll try to update the latest active log for this room if possible, or skip.
    // For now, let's just make sure RoomStatus is clear.
    // If I added maintenanceLogId to RoomStatus, I could use it.
    // For now, implicit completion.

    // 3. Update RoomStatus
    const statusRef = doc(db, 'room_statuses', roomStatus.id);
    batch.update(statusRef, {
      status: 'available',
      maintenanceStartDate: null,
      maintenanceEndDate: null,
      maintenanceReason: null,
      maintenanceLogId: null,
      housekeepingStatus: 'clean',
      lastCleaned: serverTimestamp(),
    });

    await batch.commit();
    return true;
  } catch (e) {
    console.error('Error completing room maintenance:', e);
    return false;
  }
};

// Helper for resolving maintenance (Alias)
export const resolveRoomMaintenance = completeRoomMaintenance;

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

export const getPendingWorkOrders = async (): Promise<HousekeepingTask[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'housekeepingTasks');
    const qy = query(
      c,
      where('taskType', '==', 'maintenance'),
      where('status', 'in', ['pending', 'in_progress'])
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      scheduledTime: d.data().scheduledTime?.toDate(),
      completedTime: d.data().completedTime?.toDate(),
      createdAt: d.data().createdAt?.toDate() || new Date(),
      updatedAt: d.data().updatedAt?.toDate() || new Date(),
    } as HousekeepingTask));
  } catch (e) {
    console.error('Error fetching pending work orders:', e);
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
  notes?: string,
  allocatedRoomName?: string, // New parameter for specific room assignment
  roomIndex?: number, // Index of the specific room in booking.rooms
  paymentMethod?: string // New parameter for payment method
): Promise<string | null> => {
  if (!db) return null;
  try {
    const booking = await getBooking(bookingId);
    if (!booking) return null;

    // Use provided room index or default to 0
    const rIndex = roomIndex !== undefined ? roomIndex : 0;
    const targetRoom = booking.rooms[rIndex];

    if (!targetRoom) {
      console.error('Target room not found at index:', rIndex);
      return null;
    }

    // Get room name from allocated room or use the provided one
    // Fallback order: provided param -> existing allocation -> roomNumber field -> 'Unassigned'
    const roomName = allocatedRoomName ||
      targetRoom.allocatedRoomType ||
      booking.roomNumber ||
      'Unassigned';

    const suiteType = targetRoom.suiteType || 'Garden Suite';

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

    const recordId = await createCheckInOutRecord(recordData);

    // PROCESS PAYMENT IF APPLICABLE
    let newPaidAmount = booking.paidAmount || 0;
    let newPaymentStatus = booking.paymentStatus;

    if (depositAmount && depositAmount > 0) {
      // 1. Create Folio Transaction
      const transactionCode = paymentMethod === 'Card' ? '9002' : (paymentMethod === 'Bank Transfer' ? '9005' : '9001'); // Simple mapping

      const transactionData: Omit<FolioTransaction, 'id' | 'createdAt'> = {
        bookingId,
        date: new Date(),
        type: 'payment',
        code: transactionCode,
        description: `Check-in Audit: Payment/Deposit (${paymentMethod || 'Cash'})`,
        amount: depositAmount,
        userId: staffName, // Staff who checked in
        category: 'Payment',
        reference: `CHECKIN-${recordId}`
      };

      await addFolioTransaction(transactionData);

      // 2. Update accumulated paid amount
      newPaidAmount += depositAmount;

      // 3. Update payment status
      if (newPaidAmount >= booking.totalAmount) {
        newPaymentStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newPaymentStatus = 'partial';
      }
    }

    // Update specific room status and potentially the booking status
    const updatedRooms = [...booking.rooms];
    updatedRooms[rIndex] = {
      ...updatedRooms[rIndex],
      status: 'checked_in'
    };

    // Determine overall booking status
    // If ANY room is checked in, set booking to 'checked_in'
    // Unless all are checked out (unlikely here)
    const overallStatus = 'checked_in';


    // Update booking status
    await updateBooking(bookingId, {
      status: overallStatus,
      checkInTime: new Date(),
      roomNumber: roomName, // This might need to be a list if multiple rooms, but keeping compatible
      rooms: updatedRooms,
      paidAmount: newPaidAmount,
      paymentStatus: newPaymentStatus,
      paymentMethod: paymentMethod || booking.paymentMethod // Update with latest method
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

    // UPSERT GUEST PROFILE
    // We do this asynchronously to not block UI if it's slow, or await it if critical. Awaiting is safer.
    try {
      await upsertGuestProfile({
        firstName: booking.guestDetails.firstName,
        lastName: booking.guestDetails.lastName,
        email: booking.guestDetails.email,
        phone: booking.guestDetails.phone,
        nationality: booking.guestDetails.nationality,
        address: {
          street: booking.guestDetails.address,
          city: booking.guestDetails.city,
          country: booking.guestDetails.country,
          zipCode: booking.guestDetails.zipCode
        },
        idDocumentType: idDocumentType || booking.guestDetails.idType,
        idDocumentNumber: idDocumentNumber || booking.guestDetails.idNumber,
        newRevenue: 0 // Revenue is usually calculated at checkout, but we record the stay start
      });
    } catch (guestError) {
      console.error("Failed to upsert guest profile:", guestError);
      // Don't fail the whole check-in for this
    }

    return recordId;
  } catch (e) {
    console.error('Error checking in guest:', e);
    return null;
  }
};

// Helper to upsert Guest Profile
export const upsertGuestProfile = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality?: string;
  address?: any;
  idDocumentType?: string;
  idDocumentNumber?: string;
  newRevenue?: number;
}) => {
  if (!db) return;

  // Try to find existing guest by Email first, then Phone
  let existingId: string | null = null;
  let existingData: any = null;

  // Priority 1: Email
  if (data.email) {
    const qEmail = query(collection(db, 'guests'), where('email', '==', data.email), limit(1));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      existingId = snapEmail.docs[0].id;
      existingData = snapEmail.docs[0].data();
    }
  }

  // Priority 2: Phone (if not found by email)
  if (!existingId && data.phone) {
    const qPhone = query(collection(db, 'guests'), where('phone', '==', data.phone), limit(1));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) {
      existingId = snapPhone.docs[0].id;
      existingData = snapPhone.docs[0].data();
    }
  }

  const now = new Date();

  if (existingId && existingData) {
    // Update existing
    await updateDoc(doc(db, 'guests', existingId), {
      firstName: data.firstName || existingData.firstName,
      lastName: data.lastName || existingData.lastName,
      phone: data.phone || existingData.phone, // Update contact if provided
      email: data.email || existingData.email,
      nationality: data.nationality || existingData.nationality,
      address: data.address ? { ...existingData.address, ...data.address } : existingData.address,
      idDocumentType: data.idDocumentType || existingData.idDocumentType,
      idDocumentNumber: data.idDocumentNumber || existingData.idDocumentNumber,

      totalStays: (existingData.totalStays || 0) + 1,
      lastStayDate: now, // Check-in date acts as last interaction
      updatedAt: now
      // We don't update revenue here unless explicitly passed (e.g. at checkout)
    });
  } else {
    // Create new
    await addDoc(collection(db, 'guests'), {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      nationality: data.nationality || '',
      address: data.address || {},
      idDocumentType: data.idDocumentType || '',
      idDocumentNumber: data.idDocumentNumber || '',

      totalStays: 1,
      totalRevenue: 0,
      lastStayDate: now,
      createdAt: now,
      updatedAt: now
    });
  }

};

// Helper function to check-out a guest
export const checkOutGuest = async (
  bookingId: string,
  staffName: string,
  depositReturned: boolean = false,
  notes?: string,
  housekeepingOptions?: {
    priority?: HousekeepingTask['priority'];
    assignedTo?: string;
    scheduledTime?: Date;
  },
  roomIndex?: number
): Promise<boolean> => {
  if (!db) return false;
  try {
    const booking = await getBooking(bookingId);
    if (!booking) {
      console.error('Booking not found:', bookingId);
      return false;
    }

    const rIndex = roomIndex !== undefined ? roomIndex : 0;
    const targetRoom = booking.rooms[rIndex];
    if (!targetRoom) {
      console.error('Target room not found at index:', rIndex);
      return false;
    }

    // Get or create check-in record
    // We try to find a record that matches the roomName
    const roomName = targetRoom.allocatedRoomType || booking.roomNumber || 'Unknown';
    let records = await getCheckInOutRecords(bookingId);

    // Find record for this specific room
    let checkInRecord = records.find(r => r.roomName === roomName);

    // If no check-in record exists, create one (for backward compatibility)
    if (!checkInRecord) {
      console.warn('No check-in record found for room, creating one...', roomName);
      const suiteType = targetRoom.suiteType || 'Garden Suite';
      const checkInRecordId = await createCheckInOutRecord({
        bookingId,
        guestName: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
        roomName,
        suiteType: suiteType as SuiteType,
        checkInTime: booking.checkInTime || new Date(booking.checkIn),
        checkInStaff: 'System',
        idVerified: false,
        roomKeyIssued: false,
        roomKeyNumber: targetRoom.allocatedRoomType || undefined,
      });

      if (checkInRecordId) {
        records = await getCheckInOutRecords(bookingId);
        // Try to find again or just take the first one if we just created it
        checkInRecord = records.find(r => r.id === checkInRecordId) || records[0];
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

    // Update rooms status
    const updatedRooms = [...booking.rooms];
    updatedRooms[rIndex] = {
      ...updatedRooms[rIndex],
      status: 'checked_out'
    };

    // Check if ALL rooms are checked out
    const allCheckedOut = updatedRooms.every(r => r.status === 'checked_out' || r.status === 'cancelled');

    // Update booking status (this is critical)
    try {
      await updateBooking(bookingId, {
        status: allCheckedOut ? 'checked_out' : booking.status,
        checkOutTime: allCheckedOut ? new Date() : undefined,
        rooms: updatedRooms
      });
    } catch (e) {
      console.error('Error updating booking status:', e);
      return false; // This is critical, so fail if it doesn't work
    }

    // Update room status and create housekeeping task (optional steps)
    if (roomName && roomName !== 'Unknown') {
      const suiteType = targetRoom.suiteType || 'Garden Suite';

      // Try to update room status
      try {
        const roomStatus = await getRoomStatus(roomName);
        if (roomStatus) {
          await updateRoomStatus(roomStatus.id, {
            status: 'cleaning',
            currentBookingId: null as any,
            currentCheckInDate: null as any,
            currentCheckOutDate: new Date(),
            currentGuestName: null as any,
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
          priority: housekeepingOptions?.priority || 'high',
          status: 'pending',
          bookingId,
          assignedTo: housekeepingOptions?.assignedTo,
          scheduledTime: housekeepingOptions?.scheduledTime || new Date(),
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

// ==================== F&B Order Summary & Revenue Operations ====================

// Get orders with filters for Order Summary
export const getFBOrdersSummary = async (
  date?: Date,
  status?: 'all' | 'running' | 'settled' | 'voided'
): Promise<FoodOrder[]> => {
  if (!db) return [];
  try {
    const ordersRef = collection(db, 'foodOrders');
    let q: any;

    // Build query based on filters - avoid composite indexes by filtering in memory when needed
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // If status filter is also provided, we'll filter in memory to avoid composite index
      if (status && status !== 'all') {
        // Query by date only, filter status in memory
        q = query(ordersRef, where('createdAt', '>=', startOfDay), where('createdAt', '<=', endOfDay));
      } else {
        // Query by date with ordering
        q = query(ordersRef, where('createdAt', '>=', startOfDay), where('createdAt', '<=', endOfDay), orderBy('createdAt', 'desc'));
      }
    } else if (status && status !== 'all') {
      // Query by status only
      q = query(ordersRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    } else {
      // No filters, just get all ordered by createdAt
      q = query(ordersRef, orderBy('createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    let orders = querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        scheduledDeliveryTime: data?.scheduledDeliveryTime?.toDate(),
        actualDeliveryTime: data?.actualDeliveryTime?.toDate(),
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
        orderTime: data?.orderTime?.toDate() || data?.createdAt?.toDate() || new Date(),
      } as FoodOrder;
    });

    // Filter by status in memory if date filter was also applied (to avoid composite index)
    if (date && status && status !== 'all') {
      orders = orders.filter(order => order.status === status);
    }

    // Sort by createdAt descending if not already sorted
    if (!date || (date && status && status !== 'all')) {
      orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return orders;
  } catch (error) {
    console.error('Error fetching F&B orders summary:', error);
    return [];
  }
};

// Void an order
export const voidFBOrder = async (orderId: string, reason: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const orderRef = doc(db, 'foodOrders', orderId);
    await updateDoc(orderRef, {
      status: 'voided',
      voidReason: reason,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error voiding order:', error);
    return false;
  }
};

// Change order owner
export const changeOrderOwner = async (orderId: string, ownerId: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const orderRef = doc(db, 'foodOrders', orderId);
    await updateDoc(orderRef, {
      ownerId: ownerId,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error changing order owner:', error);
    return false;
  }
};

// Split order
export const splitFBOrder = async (orderId: string, itemsToSplit: string[]): Promise<string | null> => {
  if (!db) return null;
  try {
    const orderRef = doc(db, 'foodOrders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return null;

    const orderData = orderSnap.data() as FoodOrder;
    const originalItems = orderData.items;
    const splitItems = originalItems.filter(item => itemsToSplit.includes(item.menuItemId));
    const remainingItems = originalItems.filter(item => !itemsToSplit.includes(item.menuItemId));

    // Calculate new totals
    const splitSubtotal = splitItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const remainingSubtotal = remainingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create new order for split items
    const newOrderData = {
      ...orderData,
      items: splitItems,
      subtotal: splitSubtotal,
      totalAmount: splitSubtotal + (orderData.tax || 0) - (orderData.discount || 0),
      orderNumber: `ORD-${Date.now()}`,
      receiptNo: undefined,
      rtNo: undefined,
    };
    delete (newOrderData as any).id;

    const newOrderRef = await addDoc(collection(db, 'foodOrders'), {
      ...newOrderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update original order
    await updateDoc(orderRef, {
      items: remainingItems,
      subtotal: remainingSubtotal,
      totalAmount: remainingSubtotal + (orderData.tax || 0) - (orderData.discount || 0),
      updatedAt: serverTimestamp(),
    });

    return newOrderRef.id;
  } catch (error) {
    console.error('Error splitting order:', error);
    return null;
  }
};

// Get F&B Revenue data
export const getFBRevenue = async (startDate: Date, endDate: Date): Promise<FBRevenue[]> => {
  if (!db) return [];
  try {
    const revenueRef = collection(db, 'fbRevenue');
    // Use single range query to avoid composite index requirement
    const q = query(
      revenueRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as FBRevenue;
    });
    // Sort in memory to avoid composite index
    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error fetching F&B revenue:', error);
    return [];
  }
};

// Get Weekly Revenue
export const getFBWeeklyRevenue = async (year: number): Promise<FBWeeklyRevenue[]> => {
  if (!db) return [];
  try {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const revenueRef = collection(db, 'fbRevenue');
    // Use single range query to avoid composite index requirement
    const q = query(
      revenueRef,
      where('date', '>=', startOfYear),
      where('date', '<=', endOfYear)
    );
    const querySnapshot = await getDocs(q);
    const revenueData = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        date: data.date?.toDate() || new Date(),
        totalSales: data.totalSales || 0,
        totalOrders: data.totalOrders || 0,
      };
    });

    // Group by week
    const weeklyData: Record<number, { startDate: Date; endDate: Date; revenue: number; orders: number }> = {};

    revenueData.forEach(item => {
      const date = item.date;
      const weekNumber = getWeekNumber(date);
      const weekStart = getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      if (!weeklyData[weekNumber]) {
        weeklyData[weekNumber] = {
          startDate: weekStart,
          endDate: weekEnd,
          revenue: 0,
          orders: 0,
        };
      }
      weeklyData[weekNumber].revenue += item.totalSales;
      weeklyData[weekNumber].orders += item.totalOrders;
    });

    return Object.entries(weeklyData).map(([weekNum, data]) => ({
      weekNumber: parseInt(weekNum),
      startDate: data.startDate,
      endDate: data.endDate,
      totalRevenue: data.revenue,
      orders: data.orders,
      averageOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
    })).sort((a, b) => a.weekNumber - b.weekNumber);
  } catch (error) {
    console.error('Error fetching weekly revenue:', error);
    return [];
  }
};

// Helper functions for week calculations
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - diff + 1);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// Create or update daily revenue record
export const updateDailyFBRevenue = async (date: Date, orderData: FoodOrder): Promise<boolean> => {
  if (!db) return false;
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing revenue record for the day
    const revenueRef = collection(db, 'fbRevenue');
    const q = query(
      revenueRef,
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay)
    );
    const snapshot = await getDocs(q);

    const orderType = orderData.orderType || 'dine_in';
    const paymentMethod = orderData.paymentMethod || 'cash';

    if (snapshot.empty) {
      // Create new revenue record
      const newRevenue: Omit<FBRevenue, 'id' | 'createdAt' | 'updatedAt'> = {
        date: startOfDay,
        totalSales: orderData.totalAmount,
        totalPayment: orderData.totalAmount,
        totalOrders: 1,
        totalDiscount: orderData.discount || 0,
        totalCustomers: 1,
        totalVoid: orderData.status === 'voided' ? orderData.totalAmount : 0,
        orderTypeSummary: { [orderType]: 1 },
        paymentSummary: { [paymentMethod]: orderData.totalAmount },
        categorySummary: {},
      };
      await addDoc(revenueRef, {
        ...newRevenue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update existing revenue record
      const doc = snapshot.docs[0];
      const existing = doc.data();
      const orderTypeSummary = existing.orderTypeSummary || {};
      const paymentSummary = existing.paymentSummary || {};

      await updateDoc(doc.ref, {
        totalSales: (existing.totalSales || 0) + orderData.totalAmount,
        totalPayment: (existing.totalPayment || 0) + orderData.totalAmount,
        totalOrders: (existing.totalOrders || 0) + 1,
        totalDiscount: (existing.totalDiscount || 0) + (orderData.discount || 0),
        totalCustomers: (existing.totalCustomers || 0) + 1,
        totalVoid: existing.totalVoid + (orderData.status === 'voided' ? orderData.totalAmount : 0),
        orderTypeSummary: {
          ...orderTypeSummary,
          [orderType]: (orderTypeSummary[orderType] || 0) + 1,
        },
        paymentSummary: {
          ...paymentSummary,
          [paymentMethod]: (paymentSummary[paymentMethod] || 0) + orderData.totalAmount,
        },
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    console.error('Error updating daily F&B revenue:', error);
    return false;
  }
};

// ==================== Maintenance Module ====================

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  location: string; // e.g. "Room 101", "Lobby", "Kitchen"
  reportedBy: string; // User ID or Name
  assignedTo?: string; // User ID or Name
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  roomNumber?: string; // Optional link to room
}

export const getMaintenanceTickets = async (status?: MaintenanceTicket['status']): Promise<MaintenanceTicket[]> => {
  if (!db) return [];
  try {
    const c = collection(db, 'maintenance');
    const qy = query(c, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    let items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        resolvedAt: data.resolvedAt?.toDate(),
      } as MaintenanceTicket;
    });
    if (status) items = items.filter(i => i.status === status);
    return items;
  } catch (e) {
    console.error('Error fetching maintenance tickets:', e);
    return [];
  }
};

export const createMaintenanceTicket = async (data: Omit<MaintenanceTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!db) throw new Error("Firestore unavailable");

  // Generate Ticket Number
  const c = collection(db, 'maintenance');
  const snap = await getDocs(query(c, orderBy('createdAt', 'desc'))); // simple counter approach
  const count = snap.size;
  const ticketNumber = `MNT-${String(count + 1).padStart(4, '0')}`;

  const docRef = await addDoc(c, {
    ...data,
    ticketNumber,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateMaintenanceTicket = async (id: string, data: Partial<MaintenanceTicket>): Promise<boolean> => {
  if (!db) return false;
  try {
    const r = doc(db, 'maintenance', id);
    const clean: any = { ...data };
    if (data.status === 'resolved' && !data.resolvedAt) {
      clean.resolvedAt = serverTimestamp();
    }
    clean.updatedAt = serverTimestamp();

    await updateDoc(r, clean);
    return true;
  } catch (e) {
    console.error('Error updating maintenance ticket:', e);
    return false;
  }
};
// ==================== Generic Master Data Operations ====================

// Generic function to get all documents from a collection
export const getMasterData = async <T>(collectionName: string): Promise<T[]> => {
  if (!db) return [];
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as T[];
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
};

// Generic function to add a document to a collection
export const addMasterData = async <T>(collectionName: string, data: any, userInfo?: { user: string; ip?: string }): Promise<string | null> => {
  if (!db) return null;
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, {
      ...data,
      isActive: true, // Default to active
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (userInfo) {
      await createAuditLog({
        businessDate: new Date().toISOString().split('T')[0], // Simple current date
        timestamp: new Date(),
        action: `Add ${collectionName}`,
        details: `New item added: ${data.name || data.firstName || 'Unknown'}`,
        category: collectionName,
        user: userInfo.user,
        ip: userInfo.ip || '127.0.0.1'
      });
    }

    return docRef.id;
  } catch (error) {
    console.error(`Error adding to ${collectionName}:`, error);
    return null;
  }
};

// Generic function to update a document
export const updateMasterData = async (collectionName: string, id: string, data: any, userInfo?: { user: string; ip?: string }): Promise<boolean> => {
  if (!db) return false;
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    });

    if (userInfo) {
      await createAuditLog({
        businessDate: new Date().toISOString().split('T')[0],
        timestamp: new Date(),
        action: `Edit ${collectionName}`,
        details: `Item updated: ${data.name || data.firstName || id}`,
        category: collectionName,
        user: userInfo.user,
        ip: userInfo.ip || '127.0.0.1'
      });
    }

    return true;
  } catch (error) {
    console.error(`Error updating ${collectionName}:`, error);
    return false;
  }
};

// Generic function to delete (soft delete usually, but hard delete for now if unused)
export const deleteMasterData = async (collectionName: string, id: string, userInfo?: { user: string; ip?: string }): Promise<boolean> => {
  if (!db) return false;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);

    if (userInfo) {
      await createAuditLog({
        businessDate: new Date().toISOString().split('T')[0],
        timestamp: new Date(),
        action: `Delete ${collectionName}`,
        details: `Item deleted: ${id}`,
        category: collectionName,
        user: userInfo.user,
        ip: userInfo.ip || '127.0.0.1'
      });
    }

    return true;
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    return false;
  }
};

export interface UsageRecord {
  module: string;
  record: string;
  type: 'delete_only' | 'inactive_only' | 'both';
}

export const checkMasterDataUsage = async (collectionName: string, id: string): Promise<UsageRecord[]> => {
  if (!db) return [];

  const usage: UsageRecord[] = [];
  const bookingsRef = collection(db, 'bookings');

  // Determine the field name based on collection
  let fieldName = '';
  if (collectionName === 'travel-agents') fieldName = 'travelAgentId';
  else if (collectionName === 'companies') fieldName = 'companyId';
  else if (collectionName === 'sales-persons') fieldName = 'salesPersonId';

  if (fieldName) {
    try {
      const q = query(bookingsRef, where(fieldName, '==', id), limit(5)); // Limit to 5 for preview
      const snap = await getDocs(q);

      snap.forEach(doc => {
        const b = doc.data() as Booking;
        usage.push({
          module: 'Booking Exists',
          record: `Folio : ${b.bookingId} (${b.guestDetails.firstName} ${b.guestDetails.lastName})`,
          type: 'delete_only' // Hardcoded logic for now: usually depends on status
        });
      });
    } catch (e) {
      console.error("Error checking usage:", e);
    }
  }

  return usage;
};

// ==========================================
// INCIDENTAL INVOICE Interfaces & Functions
// ==========================================

export interface InvoiceItem {
  id: string; // unique for row key
  srNo: number;
  refNo?: string;
  particular: string; // transaction code name
  comments?: string;
  amount: number;
  qty: number;
  discountType?: 'Percentage' | 'Amount' | null;
  discountValue?: number;
  isTaxInclusive: boolean;
}

export interface PaymentItem {
  id: string;
  srNo: number;
  refNo?: string;
  type: string; // Cash, Card, etc.
  comments?: string;
  amount: number;
}

export interface IncidentalInvoice {
  id: string;
  voucherNo: string;
  date: string; // ISO Date String
  contactType: 'Guest' | 'City Ledger' | 'Walk-in';
  guestName: string;
  bookingId?: string;
  companyId?: string;
  paymentType: 'Cash/Bank' | 'City Ledger';
  paymentMethod?: string;
  charges: InvoiceItem[];
  payments: PaymentItem[];
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  preparedBy: string;
  status: 'active' | 'void';
  createdAt: any;
  updatedAt?: Date;
}

export const getIncidentalInvoices = async (): Promise<IncidentalInvoice[]> => {
  if (!db) return [];
  try {
    const invoicesRef = collection(db, 'incidentalInvoices');
    const q = query(invoicesRef, orderBy('createdAt', 'desc'));

    // Note: If you need precise date filtering, use 'date' field or 'createdAt'
    // For simplicity, fetching all sorted by new first.

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IncidentalInvoice));
  } catch (error) {
    console.error("Error getting incidental invoices:", error);
    return [];
  }
};

export const addIncidentalInvoice = async (invoice: Omit<IncidentalInvoice, 'id'>) => {
  if (!db) throw new Error("Firestore unavailable");
  try {
    return await addDoc(collection(db, 'incidentalInvoices'), {
      ...invoice,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding invoice:", error);
    throw error;
  }
};

export const updateIncidentalInvoice = async (id: string, data: Partial<IncidentalInvoice>, userInfo?: { user: string; ip?: string }): Promise<boolean> => {
  if (!db) throw new Error("Firestore unavailable");
  try {
    const docRef = doc(db, 'incidentalInvoices', id);
    await updateDoc(docRef, data);

    if (userInfo) {
      // Determine action details based on data
      let actionDetails = `Invoice updated: ${id}`;
      if (data.status === 'void') {
        actionDetails = `Invoice voided: ${id}`;
      }

      await createAuditLog({
        businessDate: new Date().toISOString().split('T')[0],
        timestamp: new Date(),
        action: data.status === 'void' ? 'Void Invoice' : 'Edit Invoice',
        details: actionDetails,
        category: 'incidentalInvoices',
        user: userInfo.user,
        ip: userInfo.ip || '127.0.0.1'
      });
    }
    return true;
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
};



// ==================== Folio Transactions ====================

export interface FolioTransaction {
  id: string;
  bookingId: string;
  date: Date;
  type: 'charge' | 'payment' | 'allowance' | 'adjustment';
  code: string; // e.g., "ROOM_CHARGE", "VISA", "CASH", "F&B"
  description: string;
  amount: number;
  reference?: string;
  userId: string; // Staff
  category: string;
  createdAt: Date;
}

export const addFolioTransaction = async (transaction: Omit<FolioTransaction, 'id' | 'createdAt'>) => {
  if (!db) return;
  try {
    await addDoc(collection(db, 'folioTransactions'), {
      ...transaction,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding transaction", error);
    throw error;
  }
};

export const getFolioTransactions = async (bookingId: string): Promise<FolioTransaction[]> => {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'folioTransactions'),
      where('bookingId', '==', bookingId)
    );
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate()
    } as FolioTransaction));

    // Sort by date desc in memory to avoid index requirement
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error("Error fetching transactions", error);
    return [];
  }
};

export const addTransaction = async (data: Omit<FolioTransaction, 'id' | 'createdAt'>): Promise<string | null> => {
  if (!db) return null;
  try {
    const c = collection(db, 'folioTransactions');
    const docRef = await addDoc(c, {
      ...data,
      date: data.date || serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    // If it's a payment, update the booking's paidAmount and payment status
    if (data.type === 'payment') {
      const booking = await getBooking(data.bookingId);
      if (booking) {
        const currentPaid = booking.paidAmount || 0;
        const newPaid = currentPaid + data.amount;
        // Optionally update payment status if balance is cleared (simple logic)
        // We defer complex status logic to the bill generation or periodic checks
        await updateBooking(data.bookingId, {
          paidAmount: newPaid,
          updatedAt: new Date()
        });
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding transaction", error);
    return null;
  }
};

// ==================== NEW MODULES: Guest Database & Lost Found ====================

export interface GuestProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  idDocumentType?: string;
  idDocumentNumber?: string;

  // Stats
  totalStays: number;
  totalRevenue: number;
  lastStayDate?: Date;

  preferences?: string;
  notes?: string;
  isBlacklisted?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface LostFoundItem {
  id: string;
  // Item Info
  lostDate: string; // YYYY-MM-DD
  itemName: string;
  category?: 'electronics' | 'clothing' | 'personal' | 'documents' | 'other';
  itemColor?: string;
  lostLocation?: string; // Room number or area
  itemValue?: string;
  currency?: string;

  // Guest Info (Complaint)
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  guestAddress?: string;
  guestCity?: string;
  guestState?: string;
  guestZip?: string;
  guestCountry?: string;

  // Found Info
  foundBy?: string; // Staff Name
  currentLocation?: string; // e.g. "Front Desk Safe"
  roomName?: string; // Room number if applicable

  // Status
  status: 'lost' | 'found' | 'returned' | 'discarded';
  remark?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Guest Services
export const getGuests = async (): Promise<GuestProfile[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'guests'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      lastStayDate: doc.data().lastStayDate?.toDate(),
    } as GuestProfile));
  } catch (error) {
    console.error("Error fetching guests:", error);
    return [];
  }
};

export const addGuest = async (guest: Omit<GuestProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!db) return;
  try {
    await addDoc(collection(db, 'guests'), {
      ...guest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding guest:", error);
    throw error;
  }
};

export const updateGuest = async (id: string, data: Partial<GuestProfile>) => {
  if (!db) return;
  try {
    const docRef = doc(db, 'guests', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating guest:", error);
    throw error;
  }
};


// Lost & Found Services
export const getLostFoundItems = async (): Promise<LostFoundItem[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'lostFoundItems'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as LostFoundItem));
  } catch (error) {
    console.error("Error fetching lost & found items:", error);
    return [];
  }
};

export const addLostFoundItem = async (item: Omit<LostFoundItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!db) return;
  try {
    await addDoc(collection(db, 'lostFoundItems'), {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding lost & found item:", error);
    throw error;
  }
};

export const updateLostFoundItem = async (id: string, data: Partial<LostFoundItem>) => {
  if (!db) return;
  try {
    const docRef = doc(db, 'lostFoundItems', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating lost & found item:", error);
    throw error;
  }
};

export const deleteLostFoundItem = async (id: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'lostFoundItems', id));
  } catch (error) {
    console.error("Error deleting lost & found item:", error);
    throw error;
  }
};
// Rate Type Helpers
export const ensureDefaultRateTypes = async () => {
  if (!db) return;
  try {
    const querySnapshot = await getDocs(collection(db, 'rateTypes'));
    if (querySnapshot.empty) {
      const defaults = ['Room Only', 'Bed and Breakfast', 'Half Board', 'Full Board'];
      for (const name of defaults) {
        await addDoc(collection(db, 'rateTypes'), {
          name,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      console.log("Seeded default rate types.");
      return true; // Indicates seeded
    }
  } catch (error) {
    console.error("Error seeding rate types:", error);
  }
  return false;
};

export const addRateType = async (name: string) => {
  if (!db) throw new Error("DB not initialized");
  await addDoc(collection(db, "rateTypes"), {
    name,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};
// End of file




// ==================== Maintenance & Blocking Operations ====================
// These operations are now handled by markRoomForMaintenance and completeRoomMaintenance aliases
// which incorporate inventory blocking and logging.

// ==================== Work Order System ====================

export const createWorkOrder = async (data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!db) throw new Error("Firestore not initialized");
  try {
    const docRef = await addDoc(collection(db, 'workOrders'), {
      ...data,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error creating work order:", e);
    throw e;
  }
};

export const getWorkOrders = async (statusFilter?: WorkOrderStatus | 'all'): Promise<WorkOrder[]> => {
  if (!db) return [];
  try {
    let q = query(collection(db, 'workOrders'), orderBy('createdAt', 'desc'));

    // Client-side filtering might be better if composite index is missing, 
    // but basic equality + sort usually requires index. 
    // Let's fetch all and filter client side if index issues arise, 
    // OR create index. For now, fetch all sorted by date is safest standard query.
    // If statusFilter is provided, we filter in memory to avoid index complexity for this task.

    // Actually, let's keep it simple: Fetch all recent (limit 100?)
    if (statusFilter && statusFilter !== 'all') {
      q = query(collection(db, 'workOrders'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WorkOrder));
  } catch (e) {
    console.error("Error fetching work orders:", e);
    return [];
  }
};

export const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>): Promise<boolean> => {
  if (!db) return false;
  try {
    const docRef = doc(db, 'workOrders', id);
    const cleanUpdates: any = { ...updates, updatedAt: serverTimestamp() };

    if (updates.status === 'resolved') {
      cleanUpdates.resolvedAt = serverTimestamp();
    }

    await updateDoc(docRef, cleanUpdates);
    return true;
  } catch (e) {
    console.error("Error updating work order:", e);
    return false;
  }
};
