"use client";

import React from 'react';
import Image from 'next/image';
import { MenuItem } from '@/lib/firestoreService';

interface TouchMenuGridProps {
    items: MenuItem[];
    onAddToCart: (item: MenuItem) => void;
}

export default function TouchMenuGrid({ items, onAddToCart }: TouchMenuGridProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => onAddToCart(item)}
                    className="
                        group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden 
                        hover:shadow-md hover:border-[#FF6A00] transition-all text-left h-[180px]
                        active:scale-95
                    "
                >
                    {/* Image Area - Placeholder if no image */}
                    <div className="h-28 w-full bg-gray-100 relative overflow-hidden">
                        {item.image ? (
                            // Note: In real app, standard next/image requires allow domains config. 
                            // Using standard img tag for safety if domain config is unknown, or unoptimized Image
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-300 font-bold text-3xl select-none">
                                {item.name.charAt(0)}
                            </div>
                        )}

                        {/* Price Tag Overlay */}
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold text-gray-900 shadow-sm">
                            ${item.price.toFixed(2)}
                        </div>

                        {/* Veg Indicator */}
                        {item.isVegetarian && (
                            <div className="absolute top-2 left-2 w-4 h-4 border border-green-600 flex items-center justify-center bg-white rounded-sm">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-tight group-hover:text-[#FF6A00]">
                            {item.name}
                        </h3>
                        {item.subcategory && (
                            <p className="text-[10px] text-gray-400 truncate">{item.subcategory}</p>
                        )}
                    </div>
                </button>
            ))}

            {items.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">
                    No items in this category.
                </div>
            )}
        </div>
    );
}
