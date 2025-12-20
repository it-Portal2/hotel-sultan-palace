'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem } from '@/lib/firestoreService';

export interface CartItem extends MenuItem {
    quantity: number;
    notes?: string;
    uniqueId: string; // To handle same item with different notes
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: MenuItem, quantity: number, notes?: string) => void;
    removeFromCart: (uniqueId: string) => void;
    updateQuantity: (uniqueId: string, delta: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('guest_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem('guest_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item: MenuItem, quantity: number, notes?: string) => {
        setCart(prev => {
            // Check if item with same ID and notes exists
            const existing = prev.find(i => i.id === item.id && i.notes === notes);
            if (existing) {
                return prev.map(i => i.uniqueId === existing.uniqueId ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, { ...item, quantity, notes, uniqueId: `${item.id}-${Date.now()}` }];
        });
    };

    const removeFromCart = (uniqueId: string) => {
        setCart(prev => prev.filter(i => i.uniqueId !== uniqueId));
    };

    const updateQuantity = (uniqueId: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.uniqueId === uniqueId) {
                const newQty = i.quantity + delta;
                return newQty > 0 ? { ...i, quantity: newQty } : i;
            }
            return i;
        }));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
