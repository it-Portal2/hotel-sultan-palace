'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Room {
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
}

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
type CartRoom = Room;

type CartAddOn = AddOn;

interface CartContextProps {
  rooms: CartRoom[];
  addRoom: (room: CartRoom) => void;
  removeRoom: (roomId: string) => void;

  addOns: CartAddOn[];
  addAddOn: (addOn: CartAddOn) => void;
  removeAddOn: (addOnId: string) => void;
  updateAddOnQuantity: (addOnId: string, quantity: number) => void;

  calculateTotal: () => number;

  bookingData: BookingData | null;
  setBookingData: React.Dispatch<React.SetStateAction<BookingData | null>>;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<CartRoom[]>([]);
  const [addOns, setAddOns] = useState<CartAddOn[]>([]);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  // Load bookingData from localStorage once (for backward compatibility)
  useEffect(() => {
    const loadBookingData = () => {
      const storedData = localStorage.getItem('bookingData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setBookingData(parsedData);
        } catch (error) {
          console.error('Error parsing bookingData from localStorage:', error);
        }
      }
    };

    // Load immediately
    loadBookingData();
  }, []);

  // Room handlers
  const addRoom = (room: CartRoom) => {
    setRooms((prevRooms) => {
      // Avoid duplicates, if needed, or allow multiples (customize as per your logic)
      if (prevRooms.find(r => r.id === room.id)) return prevRooms;
      return [...prevRooms, room];
    });
  };

  const removeRoom = (roomId: string) => {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
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

  // Calculate total price (rooms + addOns)
  const calculateTotal = () => {
    const roomTotal = rooms.reduce((total, room) => total + room.price, 0);
    const addOnTotal = addOns.reduce((total, item) => {
      let multiplier = 1;
      if (item.type === 'per_day' && bookingData) {
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        multiplier = nights;
      } else if (item.type === 'per_guest' && bookingData) {
        multiplier = bookingData.guests.adults;
      }
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
        bookingData,
        setBookingData
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
