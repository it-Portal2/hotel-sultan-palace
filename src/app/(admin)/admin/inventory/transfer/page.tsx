"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getInventoryItems,
    getInventoryLocations,
    transferStock,
    InventoryItem,
    InventoryLocation
} from '@/lib/inventoryService';
import { useToast } from '@/context/ToastContext';
import {
    ArrowsRightLeftIcon,
    BuildingStorefrontIcon,
    CubeIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function TransferStockPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [fromLocation, setFromLocation] = useState<string>('');
    const [toLocation, setToLocation] = useState<string>('');
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        async function loadData() {
            try {
                const [itemsData, locsData] = await Promise.all([
                    getInventoryItems(),
                    getInventoryLocations()
                ]);
                setItems(itemsData.filter(i => i.isActive));
                setLocations(locsData);

                // Set Defaults
                const store = locsData.find(l => l.type === 'store')?.id;
                const kitchen = locsData.find(l => l.type === 'kitchen' || l.type === 'outlet')?.id;

                if (store) setFromLocation(store); // Default Source: Main Store
                if (kitchen) setToLocation(kitchen); // Default Dest: Kitchen/Outlet

            } catch (error) {
                console.error("Failed to load inventory data", error);
                showToast("Failed to load inventory data", "error");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const selectedItem = items.find(i => i.id === selectedItemId);

    // Get stock of selected item at FROM location
    const currentStockAtSource = selectedItem?.stockByLocation?.[fromLocation] || 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId || !fromLocation || !toLocation) {
            showToast("Please select item and locations", "error");
            return;
        }
        if (quantity <= 0) {
            showToast("Quantity must be greater than 0", "error");
            return;
        }
        if (fromLocation === toLocation) {
            showToast("Source and Destination cannot be the same", "error");
            return;
        }

        setSubmitting(true);
        try {
            await transferStock(
                selectedItemId,
                fromLocation,
                toLocation,
                quantity,
                "Admin User", // TODO: Replace with actual auth user
                notes
            );
            showToast("Stock transferred successfully!", "success");

            // Reset sensitive fields
            setQuantity(1);
            setNotes("");

            // Refresh Data (Simple reload for now to get fresh stock)
            // Ideally we update local state but refreshing ensures consistency
            window.location.reload();

        } catch (error: any) {
            console.error("Transfer failed", error);
            showToast(error.message || "Transfer failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Inventory...</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-[#FF6A00]">
                            <ArrowsRightLeftIcon className="h-8 w-8" />
                        </div>
                        Transfer Stock
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Move items between Store Room, Kitchen, and Bars.</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">

                        {/* Location Selector Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                            {/* Arrow Icon */}
                            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full border border-gray-100 shadow-sm">
                                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                            </div>

                            {/* FROM */}
                            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">From (Source)</label>
                                <div className="relative">
                                    <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <select
                                        value={fromLocation}
                                        onChange={(e) => setFromLocation(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] transition-all outline-none font-medium text-gray-900"
                                    >
                                        <option value="" disabled>Select Source</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* TO */}
                            <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <label className="block text-xs font-bold uppercase tracking-wider text-blue-500">To (Destination)</label>
                                <div className="relative">
                                    <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                                    <select
                                        value={toLocation}
                                        onChange={(e) => setToLocation(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
                                    >
                                        <option value="" disabled>Select Destination</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Item Selection */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-900">Select Item</label>
                                <div className="relative">
                                    <CubeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <select
                                        value={selectedItemId}
                                        onChange={(e) => setSelectedItemId(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] outline-none transition-all"
                                    >
                                        <option value="" disabled>Choose an item to transfer...</option>
                                        {items.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} (Current Store Stock: {item.currentStock || 0})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Stock Warning / Info */}
                                {selectedItemId && (
                                    <div className={`text-sm flex justify-between items-center px-3 py-2 rounded-lg ${currentStockAtSource < quantity ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                                        <span>Available at <strong>Source ({locations.find(l => l.id === fromLocation)?.name})</strong>:</span>
                                        <span className="font-bold text-lg">{currentStockAtSource} {selectedItem?.unit}</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-gray-900">Quantity to Transfer</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] outline-none transition-all font-mono text-lg"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-gray-900">Notes (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Reason for transfer..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex items-center justify-end gap-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !selectedItemId || quantity > currentStockAtSource}
                                className="px-8 py-3 bg-[#FF6A00] hover:bg-[#FF6A00]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-orange-200 transition-all transform active:scale-95 flex items-center gap-2"
                            >
                                {submitting ? 'Transferring...' : 'Confirm Transfer'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
