"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getMenuItems, getMenuCategories, createFoodOrder, MenuItem } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { ArrowLeftIcon, MapIcon, ListBulletIcon, CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Components
import TableGrid from '@/components/admin/pos/TableGrid';
import TouchMenuGrid from '@/components/admin/pos/TouchMenuGrid';
import { POSCart } from '@/components/admin/food-orders/pos/POSComponents';

interface CartItem extends MenuItem {
    quantity: number;
}

type ViewMode = 'tables' | 'menu';

export default function POSCreatePage() {
    const router = useRouter();
    const { showToast } = useToast();

    // Data State
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Flow State
    const [viewMode, setViewMode] = useState<ViewMode>('tables');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Order State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Initial Load
    useEffect(() => {
        async function loadData() {
            try {
                const [itemsData, catsData] = await Promise.all([
                    getMenuItems(),
                    getMenuCategories()
                ]);
                setItems(itemsData.filter(i => i.isAvailable && i.status === 'published'));
                setCategories(catsData);
            } catch (error) {
                console.error("Failed to load POS data:", error);
                showToast("Failed to load menu", "error");
            } finally {
                setLoading(false);
            }
        }
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Selection Logic
    const handleTableSelect = (tableId: string) => {
        setSelectedTableId(tableId);
        setViewMode('menu');
        showToast(`Table ${tableId} Selected`, 'success');
    };

    // Filter Logic
    const filteredItems = useMemo(() => {
        if (selectedCategory === 'all') return items;
        // Check if category name matches (assuming category in item is label or id)
        // Ideally we match IDs. Let's assume item.category is the machine name
        return items.filter(i => i.category === selectedCategory);
    }, [items, selectedCategory]);

    // Cart Logic
    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
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
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    // Submit Logic
    const handleSubmitOrder = async () => {
        if (!selectedTableId) {
            showToast("Please select a table", "error");
            setViewMode('tables');
            return;
        }
        if (cart.length === 0) return;

        setSubmitting(true);
        try {
            const orderData = {
                // In real app, look up Table ID to get Room linkage if needed
                guestName: `Walk-in (Table ${selectedTableId})`,
                guestPhone: "N/A",
                roomNumber: selectedTableId, // Temporary mapping
                deliveryLocation: 'restaurant' as const,
                status: 'pending' as const,
                paymentStatus: 'pending' as const,
                orderType: 'dine_in' as const,
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
            };

            const orderId = await createFoodOrder(orderData);

            if (orderId) {
                showToast("Order sent to Kitchen!", "success");
                router.push('/admin/food-orders');
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to place order", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-xl font-bold text-gray-400">Loading System...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col mr-[400px]"> {/* Right margin for Fixed Cart */}

                {/* Header Bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/food-orders" className="p-2 -ml-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
                            <ArrowLeftIcon className="h-6 w-6" />
                        </Link>

                        {/* Mode Switcher */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('tables')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'tables' ? 'bg-white text-[#FF6A00] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <MapIcon className="w-4 h-4" />
                                Tables
                            </button>
                            <button
                                onClick={() => {
                                    if (!selectedTableId) showToast('Select a table first', 'error');
                                    else setViewMode('menu');
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'menu' ? 'bg-white text-[#FF6A00] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <ListBulletIcon className="w-4 h-4" />
                                Menu
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {selectedTableId && (
                            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg flex items-center gap-2 font-bold border border-orange-100">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                Table {selectedTableId} Selected
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative">

                    {/* View: TABLES */}
                    {viewMode === 'tables' && (
                        <div className="p-8 max-w-7xl mx-auto">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Select a Table</h2>
                            <TableGrid onSelectTable={handleTableSelect} />
                        </div>
                    )}

                    {/* View: MENU */}
                    {viewMode === 'menu' && (
                        <div className="flex h-full">
                            {/* Category Sidebar */}
                            <div className="w-48 bg-white border-r border-gray-200 overflow-y-auto py-4">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors border-l-4 ${selectedCategory === 'all' ? 'border-[#FF6A00] bg-orange-50 text-[#FF6A00]' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                                >
                                    All Items
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.name)} // Assuming using machine name
                                        className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors border-l-4 ${selectedCategory === cat.name ? 'border-[#FF6A00] bg-orange-50 text-[#FF6A00]' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Items Grid */}
                            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                                <TouchMenuGrid items={filteredItems} onAddToCart={addToCart} />
                            </div>
                        </div>
                    )}
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
                canSubmit={cart.length > 0 && !!selectedTableId}
            />
        </div>
    );
}
