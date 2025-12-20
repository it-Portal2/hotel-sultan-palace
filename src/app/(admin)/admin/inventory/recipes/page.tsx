'use client';

import React, { useState, useEffect } from 'react';
import { getMenuItems, MenuItem } from '@/lib/firestoreService';
import { getRecipeByMenuItem } from '@/lib/inventoryService';
import { RecipeEditor } from '@/components/admin/inventory/RecipeEditor';
import { MagnifyingGlassIcon, ChevronRightIcon, ArchiveBoxIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { BeakerIcon } from '@heroicons/react/24/solid';

export default function RecipeListPage() {
    const [items, setItems] = useState<{ menuItem: MenuItem; hasRecipe: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null);

    // Initial Data Load
    useEffect(() => {
        const loadData = async () => {
            try {
                const menuItems = await getMenuItems();
                const itemsWithRecipe = await Promise.all(
                    menuItems.map(async (item) => {
                        const recipe = await getRecipeByMenuItem(item.id);
                        return { menuItem: item, hasRecipe: !!recipe };
                    })
                );
                // Sort by name
                itemsWithRecipe.sort((a, b) => a.menuItem.name.localeCompare(b.menuItem.name));
                setItems(itemsWithRecipe);
            } catch (error) {
                console.error("Error loading recipes", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredItems = items.filter(({ menuItem }) =>
        menuItem.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleItemClick = (id: string) => {
        setSelectedMenuItemId(id);
    };

    const handleBackToList = () => {
        setSelectedMenuItemId(null);
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <BeakerIcon className="h-10 w-10 text-gray-300 animate-pulse" />
                <p className="text-gray-500 font-medium">Loading Kitchen Data...</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-none">
                <h1 className="text-2xl font-bold text-gray-900">Recipe Management</h1>
                <p className="text-sm text-gray-500">Map menu items to ingredients for automatic cost tracking.</p>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT PANEL: Menu Item List */}
                <div className={`
                    w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col
                    ${selectedMenuItemId ? 'hidden md:flex' : 'flex'}
                `}>
                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6A00] focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredItems.map(({ menuItem, hasRecipe }) => (
                            <div
                                key={menuItem.id}
                                onClick={() => handleItemClick(menuItem.id)}
                                className={`
                                    group px-6 py-4 border-b border-gray-50 cursor-pointer transition-all
                                    hover:bg-orange-50
                                    ${selectedMenuItemId === menuItem.id ? 'bg-orange-50 border-l-4 border-l-[#FF6A00]' : 'border-l-4 border-l-transparent'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-medium ${selectedMenuItemId === menuItem.id ? 'text-[#FF6A00]' : 'text-gray-900'}`}>
                                        {menuItem.name}
                                    </h3>
                                    {hasRecipe && (
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" title="Recipe Configured" />
                                    )}
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>{menuItem.category}</span>
                                    <ChevronRightIcon className="h-3 w-3 text-gray-300 group-hover:text-orange-300" />
                                </div>
                            </div>
                        ))}

                        {filteredItems.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No items found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: Recipe Editor */}
                <div className={`
                    flex-1 bg-gray-50 flex flex-col relative
                    ${selectedMenuItemId ? 'flex' : 'hidden md:flex'}
                `}>
                    {selectedMenuItemId ? (
                        <>
                            {/* Mobile Back Button */}
                            <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center">
                                <button
                                    onClick={handleBackToList}
                                    className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                    Back to List
                                </button>
                            </div>

                            {/* Editor Component */}
                            <RecipeEditor menuItemId={selectedMenuItemId} />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                                <BeakerIcon className="h-12 w-12 text-gray-200" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Item</h3>
                            <p className="text-center max-w-xs">
                                Select a menu item from the list on the left to configure its recipe and ingredients.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
