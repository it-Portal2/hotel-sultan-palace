'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { getMenuItems, MenuItem, getMenuCategories, MenuCategory } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

export default function OrderHomePage() {
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0); // TODO: Implement real cart context

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, items] = await Promise.all([
                    getMenuCategories(),
                    getMenuItems()
                ]);
                setCategories(cats.sort((a, b) => (a.order || 0) - (b.order || 0)));
                // Filter popular/featured items (using isSpecial for now as a proxy or just random 5)
                setPopularItems(items.filter(i => i.isAvailable).slice(0, 5));
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="pb-20 bg-white min-h-screen">
            {/* Header */}
            <header className="px-4 pt-6 pb-2 bg-white sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Sultan Palace Kitchen</h1>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Open Now • 25-40 min delivery
                        </p>
                    </div>
                    <Link href="/order/cart" className="relative p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                        <ShoppingCartIcon className="h-6 w-6 text-gray-700" />
                        {cartCount > 0 && (
                            <span className="absolute top-0 right-0 bg-[#FF6A00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search dishes - breakfast, seafood..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all shadow-sm"
                    />
                </div>
            </header>

            {/* Promo Banner */}
            <div className="mt-4 px-4">
                <div className="relative w-full h-40 bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl overflow-hidden shadow-lg flex items-center p-5">
                    <div className="relative z-10 w-2/3">
                        <span className="text-orange-300 text-xs font-bold uppercase tracking-wider mb-1 block">Today's Special</span>
                        <h2 className="text-white text-xl font-bold leading-tight mb-2">Seafood Platter</h2>
                        <p className="text-blue-100 text-xs mb-3 line-clamp-2">Grilled fish, calamari, prawns, lobster served with garlic butter sauce.</p>
                        <button className="bg-[#FF6A00] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md hover:bg-[#FF6A00]/90 transition-transform active:scale-95">
                            View Menu
                        </button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                    {/* Note: In a real app, use a real image or the generate_image tool. For now, using CSS/Gradient placeholder */}
                    <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-yellow-400 rounded-full blur-2xl opacity-20"></div>
                </div>
            </div>

            {/* Categories */}
            <div className="mt-8">
                <div className="flex items-center justify-between px-4 mb-3">
                    <h3 className="text-base font-bold text-gray-900">Categories</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide snap-x">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse"></div>
                                <div className="w-12 h-3 bg-gray-100 rounded animate-pulse"></div>
                            </div>
                        ))
                    ) : (
                        categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/order/menu?category=${cat.id}`}
                                className="flex-shrink-0 flex flex-col items-center gap-2 group snap-start"
                            >
                                <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                                    {/* Placeholder for category icon/image */}
                                    <span className="text-xs font-bold text-[#FF6A00] uppercase text-center px-1 leading-none">{cat.label.slice(0, 2)}</span>
                                </div>
                                <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">{cat.label}</span>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Most Loved / Popular */}
            <div className="mt-4 px-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-900">Most Loved Dishes</h3>
                    <Link href="/order/menu" className="text-xs font-semibold text-[#FF6A00]">View all &rarr;</Link>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="flex gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-pulse">
                                <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-8 bg-gray-200 rounded w-20 mt-auto"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        popularItems.map((item) => (
                            <div key={item.id} className="flex gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                    {/* In real app, standard next/image would go here. For now, colored placeholder */}
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs text-center p-1">
                                        {item.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            item.name
                                        )}
                                    </div>
                                    {item.hasDiscount && (
                                        <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">
                                            Promo
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                                        <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-green-700">
                                            <span>★</span> 4.8
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="font-bold text-gray-900 text-lg">${item.price.toFixed(2)}</span>
                                        <button className="bg-green-50 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white transition-colors text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide">
                                            Add +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom Navigation spacer */}
            <div className="h-20"></div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <Link href="/order" className="flex flex-col items-center gap-1 text-[#FF6A00]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.632 8.632a.75.75 0 0 1-1.06 1.06l-.532-.532V18a3 3 0 0 1-3 3h-2.25a.75.75 0 0 1-.75-.75v-3.75a.75.75 0 0 0-.75-.75h-2.25a.75.75 0 0 0-.75.75v3.75a.75.75 0 0 1-.75.75H5.25a3 3 0 0 1-3-3V12.99l-.532.532a.75.75 0 0 1-1.06-1.06l8.632-8.621Z" />
                    </svg>
                    <span className="text-[10px] font-bold">Home</span>
                </Link>
                <Link href="/order/menu" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                    <span className="text-[10px] font-medium">Menu</span>
                </Link>
                <Link href="/order/track" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-[10px] font-medium">History</span>
                </Link>
                <Link href="/order/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            </div>
        </div>
    );
}
