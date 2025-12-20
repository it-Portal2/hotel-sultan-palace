'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { getMenuItems, MenuItem, getMenuCategories, MenuCategory } from '@/lib/firestoreService';

function MenuContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category');

    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, allItems] = await Promise.all([
                    getMenuCategories(),
                    getMenuItems()
                ]);
                setCategories([
                    { id: 'all', name: 'all', label: 'All', parentId: null } as MenuCategory,
                    ...cats.sort((a, b) => (a.order || 0) - (b.order || 0))
                ]);
                setItems(allItems);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === categories.find(c => c.id === selectedCategory)?.name || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return item.isAvailable && matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 shadow-sm">
                <div className="px-4 py-4 flex items-center justify-between">
                    <Link href="/order" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeftIcon className="h-6 w-6 text-gray-800" />
                    </Link>
                    <div className="flex-1 px-4">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search food..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-gray-200"
                            />
                        </div>
                    </div>
                    <button className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors">
                        <FunnelIcon className="h-6 w-6 text-gray-800" />
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="flex overflow-x-auto px-4 pb-2 scrollbar-hide gap-3 border-b border-gray-100">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-colors border ${selectedCategory === cat.id
                                    ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Item List */}
            <div className="p-4 space-y-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                    {selectedCategory === 'all' ? 'All Menu' : categories.find(c => c.id === selectedCategory)?.label}
                </h2>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400">No items found.</p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                            <div className="flex-shrink-0 w-28 h-28 bg-gray-100 rounded-xl overflow-hidden relative">
                                {/* Image Placeholder */}
                                {item.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs text-center p-2">
                                        {item.name}
                                    </div>
                                )}
                                {/* Veg/Non-Veg Indicator */}
                                <div className={`absolute top-2 left-2 w-4 h-4 rounded-sm border flex items-center justify-center bg-white ${item.isVegetarian ? 'border-green-600' : 'border-red-600'}`}>
                                    <div className={`w-2 h-2 rounded-full ${item.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="font-bold text-lg text-gray-900">${item.price.toFixed(2)}</span>
                                    <button className="bg-green-50 text-green-600 px-4 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-green-600 hover:text-white transition-all border border-green-200">
                                        Add +
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function OrderMenuPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Loading menu...</div>}>
            <MenuContent />
        </Suspense>
    );
}
