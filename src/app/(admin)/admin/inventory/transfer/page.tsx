"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    getInventoryItems,
    getInventoryDepartments,
    transferStockBulk,
} from '@/lib/inventoryService';
import type { InventoryItem, Department } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import {
    ArrowsRightLeftIcon,
    BuildingStorefrontIcon,
    ArrowRightIcon,
    PlusIcon,
    TrashIcon,
    CheckIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// ===== Types =====

interface TransferItem {
    itemId: string;
    name: string;
    unit: string;
    availableQty: number;
    transferQty: number;
    unitPrice: number;
}

// ===== Main Page =====

export default function TransferStockPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const [allItems, setAllItems] = useState<InventoryItem[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [fromLocation, setFromLocation] = useState('');
    const [toLocation, setToLocation] = useState('');
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Load initial data
    useEffect(() => {
        async function loadData() {
            try {
                const [itemsData, deptsData] = await Promise.all([
                    getInventoryItems(),
                    getInventoryDepartments(),
                ]);
                setAllItems(itemsData.filter(i => i.isActive));
                setDepartments(deptsData);

                const mainStore = deptsData.find(d => d.slug === 'main_store')?.slug;
                const kitchen = deptsData.find(d => d.slug === 'kitchen_bar')?.slug;
                if (mainStore) setFromLocation(mainStore);
                else if (deptsData.length > 0) setFromLocation(deptsData[0].slug);
                if (kitchen) setToLocation(kitchen);
                else if (deptsData.length > 1) setToLocation(deptsData[1].slug);
            } catch {
                showToast('Failed to load inventory data', 'error');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Clear transfer list when source changes
    useEffect(() => {
        setTransferItems([]);
    }, [fromLocation]);

    // Derive source items (items with stock at fromLocation)
    const sourceItems = allItems.filter(
        item => {
            const hasStock = (item.stockByLocation?.[fromLocation] ?? 0) > 0;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
            return hasStock && matchesSearch;
        }
    );

    // Already-added item IDs
    const addedIds = new Set(transferItems.map(t => t.itemId));

    // Add item to transfer list
    const handleAddItem = useCallback(
        (item: InventoryItem) => {
            if (addedIds.has(item.id)) return;
            const availableQty = item.stockByLocation?.[fromLocation] ?? 0;
            setTransferItems(prev => [
                ...prev,
                {
                    itemId: item.id,
                    name: item.name,
                    unit: item.unit,
                    availableQty,
                    transferQty: 1,
                    unitPrice: item.unitCost ?? 0,
                },
            ]);
        },
        [addedIds, fromLocation]
    );

    // Update transfer quantity for a row
    const handleQtyChange = (itemId: string, value: string) => {
        const num = parseFloat(value) || 0;
        setTransferItems(prev =>
            prev.map(t => (t.itemId === itemId ? { ...t, transferQty: num } : t))
        );
    };

    // Remove item from transfer list
    const handleRemove = (itemId: string) => {
        setTransferItems(prev => prev.filter(t => t.itemId !== itemId));
    };

    // Validation helpers
    const hasInvalidQty = transferItems.some(
        t => t.transferQty <= 0 || t.transferQty > t.availableQty
    );
    const canSubmit =
        transferItems.length > 0 &&
        fromLocation &&
        toLocation &&
        fromLocation !== toLocation &&
        !hasInvalidQty;

    // Totals
    const totalValue = transferItems.reduce(
        (sum, t) => sum + t.transferQty * t.unitPrice,
        0
    );

    // Submit handler
    const handleSubmit = async () => {
        if (!canSubmit) {
            if (fromLocation === toLocation)
                showToast('Source and Destination cannot be the same', 'error');
            else showToast('Fix validation errors before confirming', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await transferStockBulk(
                transferItems.map(t => ({
                    itemId: t.itemId,
                    fromLocationId: fromLocation,
                    toLocationId: toLocation,
                    quantity: t.transferQty,
                })),
                'Admin',
                notes || undefined
            );
            showToast(
                `${transferItems.length} item(s) transferred successfully!`,
                'success'
            );
            // Reset transfer list and reload items
            setTransferItems([]);
            setNotes('');
            const fresh = await getInventoryItems();
            setAllItems(fresh.filter(i => i.isActive));
        } catch (error: any) {
            showToast(error.message || 'Transfer failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className="p-12 text-center text-gray-500 text-lg">
                Loading Inventory...
            </div>
        );

    const fromDeptName =
        departments.find(d => d.slug === fromLocation)?.name ?? fromLocation;
    const toDeptName =
        departments.find(d => d.slug === toLocation)?.name ?? toLocation;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Page Header ── */}
                <div className="mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-[#FF6A00]">
                            <ArrowsRightLeftIcon className="h-8 w-8" />
                        </div>
                        Transfer Stock
                    </h1>
                    <p className="text-gray-500 mt-1 text-base">
                        Move multiple items between locations in a single atomic operation.
                    </p>
                </div>

                {/* ── Location Row ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                        {/* FROM */}
                        <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                                From (Source)
                            </label>
                            <div className="relative">
                                <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select
                                    value={fromLocation}
                                    onChange={e => setFromLocation(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] outline-none font-medium text-gray-900"
                                >
                                    <option value="" disabled>Select Source</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.slug}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center">
                            <div className="p-2 bg-white border border-gray-200 rounded-full shadow-sm">
                                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>

                        {/* TO */}
                        <div className="space-y-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <label className="block text-xs font-bold uppercase tracking-wider text-blue-500">
                                To (Destination)
                            </label>
                            <div className="relative">
                                <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                                <select
                                    value={toLocation}
                                    onChange={e => setToLocation(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-gray-900"
                                >
                                    <option value="" disabled>Select Destination</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.slug}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    {fromLocation && toLocation && fromLocation === toLocation && (
                        <p className="mt-3 text-sm text-red-500 font-medium">
                            ⚠ Source and destination cannot be the same location.
                        </p>
                    )}
                </div>

                {/* ── Two-column section layout ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* ── SECTION 1: Available Items ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <h2 className="text-base font-bold text-gray-900">
                                    Available Items
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Items with stock at <span className="font-semibold">{fromDeptName || '—'}</span>
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="relative w-48 md:w-64">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9 text-sm border-gray-200 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
                                    />
                                </div>
                                <Badge variant="secondary" className="bg-orange-50 text-[#FF6A00] border-orange-100 whitespace-nowrap">
                                    {sourceItems.length} items
                                </Badge>
                            </div>
                        </div>

                        <div className="overflow-auto flex-1 max-h-[480px]">
                            {sourceItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                                    <ArrowsRightLeftIcon className="h-10 w-10 opacity-30" />
                                    <p className="text-sm">No stock available at this source.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                            <TableHead className="font-semibold text-gray-600 w-1/2">Item Name</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-right">Avail. Qty</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-right">Price</TableHead>
                                            <TableHead className="w-16"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sourceItems.map(item => {
                                            const avail = item.stockByLocation?.[fromLocation] ?? 0;
                                            const added = addedIds.has(item.id);
                                            return (
                                                <TableRow
                                                    key={item.id}
                                                    className={`transition-colors ${added ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
                                                >
                                                    <TableCell>
                                                        <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                                        <div className="text-xs text-gray-400">{item.unit}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-gray-700 text-sm">
                                                        {Number.isInteger(avail) ? avail : Number(avail.toFixed(2))}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-gray-500">
                                                        {item.unitCost ? `$${item.unitCost.toFixed(2)}` : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <button
                                                            onClick={() => handleAddItem(item)}
                                                            disabled={added}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                                                added
                                                                    ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                                                    : 'bg-[#FF6A00]/10 text-[#FF6A00] hover:bg-[#FF6A00]/20'
                                                            }`}
                                                        >
                                                            {added
                                                                ? <><CheckIcon className="h-3 w-3" /> Added</>
                                                                : <><PlusIcon className="h-3 w-3" /> Add</>
                                                            }
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>

                    {/* ── SECTION 2: Transfer Items (Invoice Table) ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Transfer Items</h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Edit quantities &amp; confirm transfer
                                </p>
                            </div>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100">
                                {transferItems.length} selected
                            </Badge>
                        </div>

                        <div className="overflow-auto flex-1 max-h-[480px]">
                            {transferItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                                    <PlusIcon className="h-10 w-10 opacity-30" />
                                    <p className="text-sm">Add items from the left table.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                            <TableHead className="font-semibold text-gray-600">#</TableHead>
                                            <TableHead className="font-semibold text-gray-600">Item</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-right">Avail.</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-center">Transfer Qty</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-right">Total</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transferItems.map((t, idx) => {
                                            const isInvalid = t.transferQty <= 0 || t.transferQty > t.availableQty;
                                            const rowTotal = t.transferQty * t.unitPrice;
                                            return (
                                                <TableRow
                                                    key={t.itemId}
                                                    className={`transition-colors ${isInvalid ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}
                                                >
                                                    <TableCell className="text-gray-400 text-xs font-mono">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-gray-900 text-sm">{t.name}</div>
                                                        <div className="text-xs text-gray-400">{t.unit}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-gray-500 font-medium">
                                                        {Number.isInteger(t.availableQty) ? t.availableQty : Number(t.availableQty.toFixed(2))}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                max={t.availableQty}
                                                                value={t.transferQty}
                                                                onChange={e => handleQtyChange(t.itemId, e.target.value)}
                                                                className={`w-20 text-center px-2 py-1 rounded-md border text-sm font-bold outline-none focus:ring-2 transition-all ${
                                                                    isInvalid
                                                                        ? 'border-red-400 bg-red-50 text-red-700 ring-red-200 focus:ring-red-300'
                                                                        : 'border-gray-200 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]'
                                                                }`}
                                                            />
                                                            {isInvalid && (
                                                                <span className="text-[10px] text-red-500 font-medium leading-none">
                                                                    {t.transferQty <= 0 ? 'Must be > 0' : `Max: ${Number.isInteger(t.availableQty) ? t.availableQty : Number(t.availableQty.toFixed(2))}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm font-semibold text-gray-700">
                                                        {t.unitPrice > 0 ? `$${rowTotal.toFixed(2)}` : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <button
                                                            onClick={() => handleRemove(t.itemId)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        {/* Footer Summary */}
                        {transferItems.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Total items:</span>
                                    <span className="font-bold text-gray-900">{transferItems.length}</span>
                                </div>
                                {totalValue > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Total value:</span>
                                        <span className="font-bold text-[#FF6A00] text-base">${totalValue.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                                    <ArrowRightIcon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                    <span>
                                        <span className="font-semibold text-gray-700">{fromDeptName}</span>
                                        &nbsp;→&nbsp;
                                        <span className="font-semibold text-gray-700">{toDeptName}</span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Notes + Actions ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 max-w-lg">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Notes (Optional)
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Reason for transfer..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00] outline-none transition-all text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit || submitting}
                                className="px-8 py-2.5 bg-[#FF6A00] hover:bg-[#FF6A00]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-orange-200/50 transition-all active:scale-95 flex items-center gap-2 text-sm"
                            >
                                {submitting ? (
                                    <>
                                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                        Transferring...
                                    </>
                                ) : (
                                    <>
                                        <ArrowsRightLeftIcon className="h-4 w-4" />
                                        Confirm Transfer
                                        {transferItems.length > 0 && ` (${transferItems.length})`}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
