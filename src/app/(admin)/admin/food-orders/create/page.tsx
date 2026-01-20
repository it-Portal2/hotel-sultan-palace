"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMenuItems, getMenuCategories, createFoodOrder, MenuItem, getAllBookings, Booking } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { ArrowLeftIcon, MapIcon, ListBulletIcon, CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Components
import TouchMenuGrid from '@/components/admin/pos/TouchMenuGrid';
import { POSCart, MenuBrowser } from '@/components/admin/food-orders/pos/POSComponents';

interface CartItem extends MenuItem {
    quantity: number;
}



export default function POSCreatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    // Determine return path
    const returnUrl = searchParams.get('returnUrl') || '/admin/food-orders';

    // Data State
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeGuests, setActiveGuests] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Order Details State
    const [guestName, setGuestName] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [deliveryLocation, setDeliveryLocation] = useState<string>('restaurant');
    const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
    const [deliveryMode, setDeliveryMode] = useState<'asap' | 'scheduled'>('asap');
    const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
    const [notes, setNotes] = useState("");

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Initial Load
    useEffect(() => {
        async function loadData() {
            try {
                const [itemsData, catsData, bookingsData] = await Promise.all([
                    getMenuItems(),
                    getMenuCategories(),
                    getAllBookings() // Fetches all, we filter client side for 'checked_in'
                ]);
                setItems(itemsData.filter(i => i.isAvailable && i.status === 'published'));
                setCategories(catsData);

                // Filter only currently checked-in guests
                const checkedIn = bookingsData.filter(b => b.status === 'checked_in' || b.status === 'stay_over');
                setActiveGuests(checkedIn);

            } catch (error) {
                console.error("Failed to load POS data:", error);
                showToast("Failed to load menu/guests", "error");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Cart Logic
    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        showToast(`Added ${item.name}`, 'success');
    };

    const updateQty = (itemId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(i => i.quantity > 0));
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = 0;
    const total = subtotal;

    // Submit Logic
    const handleSubmitOrder = async () => {
        if (!guestName.trim()) {
            showToast("Please enter Guest Name", "error");
            return;
        }
        if (cart.length === 0) return;

        setSubmitting(true);
        try {
            // Calculate Schedule Time
            let finalDeliveryTime = new Date(Date.now() + 30 * 60000); // Default 30 mins
            if (deliveryMode === 'scheduled' && scheduledTime) {
                finalDeliveryTime = scheduledTime;
            }

            const orderData = {
                guestName: guestName,
                guestPhone: "N/A", // Could fetch from booking if selected
                roomNumber: roomNumber || null,
                deliveryLocation: deliveryLocation,
                status: 'pending' as const,
                paymentStatus: 'pending' as const,
                orderType: roomNumber ? 'room_service' : 'dine_in',
                kitchenStatus: 'received' as const,
                items: cart.map(i => ({
                    menuItemId: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price
                })),
                subtotal,
                tax,
                totalAmount: total,
                estimatedPreparationTime: 20,
                scheduledDeliveryTime: finalDeliveryTime, // Persist Schedule
                notes: notes, // Persist Notes
            };

            // @ts-ignore
            const orderId = await createFoodOrder(orderData);

            if (orderId) {
                showToast("Order sent to Kitchen!", "success");
                router.push(returnUrl);
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to place order", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-xl font-bold text-gray-400">Loading Menu...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col mr-0 md:mr-[384px]"> {/* Right margin for Fixed Cart (w-96 = 384px) */}

                {/* Header Bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Link href={returnUrl} className="p-2 -ml-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
                            <ArrowLeftIcon className="h-6 w-6" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">New POS Order</h1>
                            <p className="text-sm text-gray-500">Select items and enter guest details</p>
                        </div>
                    </div>
                </div>

                {/* Content Body - Menu Browser Direct */}
                <div className="flex-1 overflow-hidden relative">
                    <MenuBrowser categories={categories} items={items} onAddToCart={addToCart} />
                </div>
            </div>

            {/* Fixed Cart Sidebar */}
            <POSCart
                cart={cart}
                onRemove={removeFromCart}
                onUpdateQty={updateQty}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onSubmit={handleSubmitOrder}
                isSubmitting={submitting}
                canSubmit={cart.length > 0 && guestName.length > 0}
                guestName={guestName}
                setGuestName={setGuestName}
                roomNumber={roomNumber}
                setRoomNumber={setRoomNumber}
                activeGuests={activeGuests}
                deliveryLocation={deliveryLocation}
                setDeliveryLocation={setDeliveryLocation}
                scheduledTime={scheduledTime}
                setScheduledTime={setScheduledTime}
                deliveryMode={deliveryMode}
                setDeliveryMode={setDeliveryMode}
                notes={notes}
                setNotes={setNotes}
            />
        </div>
    );
}
