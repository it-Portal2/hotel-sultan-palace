'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Room } from '@/lib/firestoreService';

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

interface CartContextProps {
  rooms: CartRoom[];
  addRoom: (room: Room, quantity?: number) => void;
  removeRoom: (cartItemId: string) => void;

  addOns: CartAddOn[];
  addAddOn: (addOn: CartAddOn) => void;
  removeAddOn: (addOnId: string) => void;
  updateAddOnQuantity: (addOnId: string, quantity: number) => void;

  calculateTotal: () => number;
  getNumberOfNights: () => number;

  bookingData: BookingData | null;
  setBookingData: React.Dispatch<React.SetStateAction<BookingData | null>>;
  updateBookingData: (data: BookingData) => void;
  bookingSetThisSession: boolean;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<CartRoom[]>([]);
  const [addOns, setAddOns] = useState<CartAddOn[]>([]);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [bookingSetThisSession, setBookingSetThisSession] = useState(false);

  // Always clear any legacy localStorage booking data to avoid stale UI
  useEffect(() => {
    try { localStorage.removeItem('bookingData'); } catch {}
  }, []);

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

  // Calculate total price (rooms + addOns)
  const calculateTotal = () => {
    const nights = getNumberOfNights();

    // Room total = room price * number of nights
    const roomTotal = rooms.reduce((total, room) => total + (room.price * nights), 0);
    
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
        getNumberOfNights,
        bookingData,
        setBookingData,
        updateBookingData,
        bookingSetThisSession
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
