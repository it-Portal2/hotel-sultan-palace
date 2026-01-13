'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Room, SpecialOffer } from '@/lib/firestoreService';
import { isSpecialOfferValid, calculateDiscountAmount } from '@/lib/offers';

interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  type: 'per_stay' | 'per_day' | 'per_guest';
  quantity: number;
}

interface BookingData {
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
}

// Define cart item types for union of Rooms and AddOns if needed
type CartRoom = Room & { cartItemId: string };

type CartAddOn = AddOn;

interface AppliedCoupon {
  code: string;
  discountType: 'percentage' | 'fixed' | 'pay_x_stay_y';
  discountValue: number;
  offerId?: string;
  source: 'special' | 'discount';
  expiresAt?: string | null;
  title?: string;
  targetAudience?: 'all' | 'specific_rooms';
  roomTypes?: string[];
  stayNights?: number;
  payNights?: number;
}

interface CartContextProps {
  rooms: CartRoom[];
  addRoom: (room: Room, quantity?: number) => void;
  removeRoom: (cartItemId: string) => void;

  addOns: CartAddOn[];
  addAddOn: (addOn: CartAddOn) => void;
  removeAddOn: (addOnId: string) => void;
  updateAddOnQuantity: (addOnId: string, quantity: number) => void;

  calculateTotal: () => number;
  calculateTaxes: () => number;
  getNumberOfNights: () => number;

  bookingData: BookingData | null;
  setBookingData: React.Dispatch<React.SetStateAction<BookingData | null>>;
  updateBookingData: (data: BookingData) => void;
  bookingSetThisSession: boolean;

  // Coupon functionality
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => void;
  getDiscountAmount: () => number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<CartRoom[]>([]);
  const [addOns, setAddOns] = useState<CartAddOn[]>([]);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [bookingSetThisSession, setBookingSetThisSession] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Always clear any legacy localStorage booking data to avoid stale UI
  useEffect(() => {
    try { localStorage.removeItem('bookingData'); } catch { }
  }, []);

  // Remove expired coupons automatically
  useEffect(() => {
    if (!appliedCoupon?.expiresAt) return;
    const expiry = new Date(appliedCoupon.expiresAt);
    if (isNaN(expiry.getTime())) return;
    if (expiry < new Date()) {
      setAppliedCoupon(null);
    }
  }, [appliedCoupon]);

  // Function to update booking data from any form (Hero or Rooms).
  // Do not clear existing cart items; totals will recompute based on new dates.
  const updateBookingData = (newBookingData: BookingData) => {
    setBookingData(newBookingData);
    setBookingSetThisSession(true);
  };

  // Room handlers
  const generateCartItemId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random()}`;
  };

  const addRoom = (room: Room, quantity: number = 1) => {
    setRooms((prevRooms) => {
      const newRooms: CartRoom[] = [];
      for (let i = 0; i < quantity; i++) {
        newRooms.push({
          ...room,
          cartItemId: generateCartItemId(),
        });
      }
      return [...prevRooms, ...newRooms];
    });
  };

  const removeRoom = (cartItemId: string) => {
    setRooms((prev) => {
      const index = prev.findIndex((room) => room.cartItemId === cartItemId);
      if (index === -1) return prev;
      const newRooms = [...prev];
      newRooms.splice(index, 1);
      return newRooms;
    });
  };

  // AddOn handlers
  const addAddOn = (addOn: CartAddOn) => {
    setAddOns((prevAddOns) => {
      const existing = prevAddOns.find((item) => item.id === addOn.id);
      if (existing) {
        return prevAddOns.map(item =>
          item.id === addOn.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      }
      return [...prevAddOns, { ...addOn, quantity: 1 }];
    });
  };

  const removeAddOn = (addOnId: string) => {
    setAddOns((prevAddOns) => {
      const existing = prevAddOns.find((item) => item.id === addOnId);
      if (existing && existing.quantity > 1) {
        return prevAddOns.map(item =>
          item.id === addOnId ? { ...item, quantity: item.quantity - 1 } : item
        );
      } else {
        return prevAddOns.filter(item => item.id !== addOnId);
      }
    });
  };

  const updateAddOnQuantity = (addOnId: string, quantity: number) => {
    setAddOns((prevAddOns) =>
      prevAddOns.map(item =>
        item.id === addOnId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  // Helper function to get number of nights
  const getNumberOfNights = () => {
    if (!bookingData) return 1;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Calculate room total (for discounts)
  const calculateRoomTotal = () => {
    const nights = getNumberOfNights();
    return rooms.reduce((total, room) => total + (room.price * nights), 0);
  };

  // Calculate base total price (rooms + addOns) before discount
  const calculateBaseTotal = () => {
    const nights = getNumberOfNights();

    // Room total
    const roomTotal = calculateRoomTotal();

    // Add-ons total with proper multipliers
    const addOnTotal = addOns.reduce((total, item) => {
      let multiplier = 1;
      if (item.type === 'per_day' && bookingData) {
        multiplier = nights;
      } else if (item.type === 'per_guest' && bookingData) {
        multiplier = bookingData.guests.adults;
      }
      // For 'per_stay' type, multiplier remains 1
      return total + item.price * multiplier * item.quantity;
    }, 0);

    return roomTotal + addOnTotal;
  };

  // Get discount amount
  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;

    // Calculate eligible total based on targeting
    const nights = getNumberOfNights();
    let eligibleAmount = 0;

    if (appliedCoupon.targetAudience === 'specific_rooms' && appliedCoupon.roomTypes?.length) {
      // Filter rooms that match the coupon's target rooms
      const eligibleRooms = rooms.filter(room => {
        // Check if room name or id is in the target list (flexible check)
        // Normalize strings for comparison
        const rName = room.name.toLowerCase();
        // Check if any of the target types/names are contained in the room name
        return appliedCoupon.roomTypes!.some(target => rName.includes(target.toLowerCase()));
      });

      eligibleAmount = eligibleRooms.reduce((total, room) => total + (room.price * nights), 0);
    } else {
      // General coupons apply to Room Total only (standard practice), not Add-ons
      eligibleAmount = calculateRoomTotal();
    }

    if (eligibleAmount === 0) return 0;

    // Pass nights to calculateDiscountAmount
    // We construct a temporary offer object to pass to the helper
    return calculateDiscountAmount(
      eligibleAmount,
      {
        discountType: appliedCoupon.discountType,
        discountValue: appliedCoupon.discountValue,
        stayNights: appliedCoupon.stayNights,
        payNights: appliedCoupon.payNights,
      },
      nights
    );
  };

  // Calculate taxes
  const calculateTaxes = () => {
    const nights = getNumberOfNights();
    return rooms.reduce((total, room) => total + ((room.taxes || 0) * nights), 0);
  };

  // Calculate total price (rooms + addOns - discount)
  const calculateTotal = () => {
    const baseTotal = calculateBaseTotal();
    const discount = getDiscountAmount();
    const taxes = calculateTaxes();
    // Taxes are typically added ON TOP of the base price + add-ons, 
    // but the request implies "taxes and charge" might be separate. 
    // The previous cart had taxes as $0.00. 
    // We should ADD taxes to the final total.
    return Math.max(0, baseTotal - discount) + taxes;
  };

  // Apply coupon code
  const applyCoupon = async (code: string): Promise<{ success: boolean; message?: string }> => {
    const normalizedCode = code.toUpperCase().trim();
    if (!normalizedCode) {
      return { success: false, message: 'Please enter a coupon code.' };
    }

    try {
      const { db } = await import('@/lib/firebase');
      if (!db) {
        return { success: false, message: 'Service unavailable. Please try again.' };
      }

      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const now = new Date();
      const guestCount = bookingData ? bookingData.guests.adults + bookingData.guests.children : 0;

      // Check special offers first
      const specialOffersRef = collection(db, 'specialOffers');
      const specialQuery = query(specialOffersRef, where('couponCode', '==', normalizedCode));
      const specialSnapshot = await getDocs(specialQuery);

      if (!specialSnapshot.empty) {
        const docSnap = specialSnapshot.docs[0];
        const data = docSnap.data();
        const offer: SpecialOffer = {
          id: docSnap.id,
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
          targetAudience: data.targetAudience || (data.applyToAllRooms ? 'all' : 'specific_rooms'),
          roomTypes: data.roomTypes || [],
          discountType: data.discountType || 'percentage',
          discountValue: data.discountValue || 0,
          couponMode: data.couponMode || 'static',
          couponCode: data.couponCode || null,
          stayNights: data.stayNights || undefined,
          payNights: data.payNights || undefined,
          lastNotificationSentAt: data.lastNotificationSentAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };

        const isValid = isSpecialOfferValid(offer, {
          now,
          guestCount,
        });

        if (!isValid) {
          const end = offer.endDate ? new Date(offer.endDate) : null;
          const expiryMsg = end
            ? `This offer expired on ${end.toLocaleDateString()}.`
            : 'This offer is no longer valid.';
          return { success: false, message: expiryMsg };
        }

        setAppliedCoupon({
          code: normalizedCode,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          offerId: offer.id,
          source: 'special',
          expiresAt: offer.endDate || null,
          title: offer.title,
          targetAudience: offer.targetAudience,
          roomTypes: offer.roomTypes,
          stayNights: offer.stayNights,
          payNights: offer.payNights,
        });

        return { success: true };
      }

      // Fallback to general discount offers
      const discountsRef = collection(db, 'discounts');
      const discountQuery = query(discountsRef, where('couponCode', '==', normalizedCode));
      const discountSnapshot = await getDocs(discountQuery);

      if (!discountSnapshot.empty) {
        const discountData = discountSnapshot.docs[0].data();
        if (!discountData.isActive) {
          return { success: false, message: 'This discount is not active.' };
        }

        setAppliedCoupon({
          code: normalizedCode,
          discountType: 'percentage',
          discountValue: discountData.discountPercent || 0,
          offerId: discountSnapshot.docs[0].id,
          source: 'discount',
        });
        return { success: true };
      }

      return { success: false, message: 'Invalid coupon code.' };
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, message: 'Failed to apply coupon. Please try again.' };
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        rooms,
        addRoom,
        removeRoom,
        addOns,
        addAddOn,
        removeAddOn,
        updateAddOnQuantity,
        calculateTotal,
        calculateTaxes,
        getNumberOfNights,
        bookingData,
        setBookingData,
        updateBookingData,
        bookingSetThisSession,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        getDiscountAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Helper hook for consuming context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
