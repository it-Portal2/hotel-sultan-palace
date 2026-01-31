import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { createStockAdjustment, getInventoryDepartments, getInventoryLocations } from '@/lib/inventoryService';
import type { InventoryItem, InventoryDepartment, Department, InventoryLocation } from '@/lib/firestoreService';
import {
    ArrowPathIcon,
    ClipboardDocumentCheckIcon,
    TableCellsIcon,
    AdjustmentsVerticalIcon,
    ArchiveBoxIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,

    WrenchScrewdriverIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface StockAdjustmentsTabProps {
    initialItems: InventoryItem[];
    onRefresh: () => void;
}

export default function StockAdjustmentsTab({ initialItems, onRefresh }: StockAdjustmentsTabProps) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [initialItems]);

    const loadData = async () => {
        setLoading(true);
        try {
            // We use initialItems if provided (passed from parent), otherwise we would fetch
            // But here the parent passes everything.
            // However, we need DEPARTMENTS and LOCATIONS.
            const [depts, locs] = await Promise.all([
                getInventoryDepartments(),
                getInventoryLocations()
            ]);
            setDepartments(depts);
            setLocations(locs);

            if (initialItems) {
                setItems(initialItems);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-[#FF6A00]" />
                <span className="ml-3 text-lg text-gray-600">Loading data...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header / Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-1">
                <button
                    onClick={() => setActiveTab('single')}
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${activeTab === 'single'
                        ? 'bg-orange-50 text-[#FF6A00] shadow-sm ring-1 ring-[#FF6A00]/20'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <AdjustmentsVerticalIcon className="w-5 h-5" />
                    Single Adjustment
                </button>
                <button
                    onClick={() => setActiveTab('bulk')}
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${activeTab === 'bulk'
                        ? 'bg-orange-50 text-[#FF6A00] shadow-sm ring-1 ring-[#FF6A00]/20'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <TableCellsIcon className="w-5 h-5" />
                    Bulk Stock Take
                </button>
            </div>

            {activeTab === 'single' ? (
                <SingleAdjustmentForm items={items} departments={departments} locations={locations} onRefresh={onRefresh} setLoading={setLoading} loading={loading} showToast={showToast} />
            ) : (
                <BulkStockTakeForm items={items} departments={departments} locations={locations} onRefresh={onRefresh} setLoading={setLoading} loading={loading} showToast={showToast} />
            )}
        </div>
    );
}

// ==================== SINGLE ADJUSTMENT FORM (Redesigned) ====================

interface AdjustmentFormProps {
    items: InventoryItem[];
    departments: Department[];
    locations: InventoryLocation[];
    onRefresh: () => void;
    setLoading: (loading: boolean) => void;
    loading: boolean;
    showToast: (message: string, type: 'success' | 'error') => void;
}

// ==================== SINGLE ADJUSTMENT FORM (Redesigned) ====================

function SingleAdjustmentForm({ items, departments, locations, onRefresh, setLoading, loading, showToast }: AdjustmentFormProps) {
    const [formData, setFormData] = useState({
        itemId: '',
        quantity: 0,
        type: 'usage' as 'usage' | 'waste' | 'adjustment',
        reason: '',
        department: '',
        locationId: '' // New: Target location
    });

    useEffect(() => {
        // Only default if not set
        if (departments.length > 0 && !formData.department) {
            // Optional: Don't auto-select department to allow seeing "All Items" initially
            // setFormData(prev => ({ ...prev, department: departments[0].name }));
        }
        // Default location to Main Store or first available
        if (locations.length > 0 && !formData.locationId) {
            const store = locations.find(l => l.type === 'store');
            setFormData(prev => ({ ...prev, locationId: store?.id || locations[0].id }));
        }
    }, [departments, locations, formData.department, formData.locationId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalQuantity = Math.abs(formData.quantity);
            if (['usage', 'waste'].includes(formData.type)) {
                finalQuantity = -finalQuantity;
            }

            const reasonWithDept = `[${formData.department || 'General'}] ${formData.reason} `;

            await createStockAdjustment(
                formData.itemId,
                finalQuantity,
                formData.type as any,
                reasonWithDept,
                'Admin User',
                formData.locationId
            );

            showToast("Adjustment recorded", "success");
            setFormData({
                itemId: '',
                quantity: 0,
                type: 'usage',
                reason: '',
                department: '', // Reset to empty to show all items
                locationId: locations.length > 0 ? (locations.find(l => l.type === 'store')?.id || locations[0].id) : ''
            });
            onRefresh();
            onRefresh();
        } catch (error: any) {
            console.error(error);
            if (error.message === 'Insufficient stock' || error.toString().includes('Insufficient stock')) {
                showToast("Failed: Insufficient stock for this operation", "error");
            } else {
                showToast("Failed to record adjustment", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const selectedItem = items.find((i: InventoryItem) => i.id === formData.itemId);

    const adjustmentTypes = [
        { id: 'usage', label: 'Usage / Consumption', icon: ArchiveBoxIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'waste', label: 'Waste / Spoilage', icon: TrashIcon, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        // Transfer options removed - use Transfer Tab
        { id: 'adjustment', label: 'Correction (+/-)', icon: WrenchScrewdriverIcon, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
    ];

    return (
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-[#FF6A00]" />
                        Record Stock Movement
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Log inventory usage, waste, or manual adjustments.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* 1. Select Type (Visual Cards) */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">1. Select Movement Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {adjustmentTypes.map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, type: type.id as any })}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${formData.type === type.id
                                    ? `${type.border} ${type.bg} ring-1 ring-offset-2 ring-[#FF6A00]/20 shadow-sm`
                                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <type.icon className={`w-6 h-6 mb-2 ${type.color}`} />
                                <span className={`text-xs font-bold ${formData.type === type.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {type.label}
                                </span>
                                {formData.type === type.id && (
                                    <div className="absolute top-2 right-2">
                                        <CheckCircleIcon className={`w-4 h-4 ${type.color}`} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 2. Select Item & Dept */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">2. Item Details</label>
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Department</label>
                                <select
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] bg-white transition-all shadow-sm"
                                >
                                    <option value="">-- All Departments --</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Location</label>
                                <select
                                    required
                                    value={formData.locationId}
                                    onChange={e => setFormData({ ...formData, locationId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] bg-white transition-all shadow-sm"
                                >
                                    <option value="">-- Choose Location --</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name} ({loc.type})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1.5">
                                    Stock will be adjusted in this location.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Select Item</label>
                                <select
                                    required
                                    value={formData.itemId}
                                    onChange={e => setFormData({ ...formData, itemId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] bg-white transition-all shadow-sm"
                                >
                                    <option value="">-- Choose Item --</option>
                                    {items
                                        .filter((i: InventoryItem) => {
                                            if (!formData.department) return true; // Show all if no dept selected
                                            const itemDept = (i.department || '').toLowerCase().trim();
                                            const selectedDept = formData.department.toLowerCase().trim();
                                            return itemDept === selectedDept;
                                        })
                                        .map((item: InventoryItem) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} | Stock: {item.currentStock} {item.unit}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1.5">
                                    {formData.department ? `Showing items for ${formData.department} department only.` : 'Showing all items.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Quantity & Notes */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">3. Quantity & Notes</label>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Quantity
                                    {selectedItem && <span className="text-gray-500 font-normal ml-1">({selectedItem.unit})</span>}
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        value={formData.quantity || ''}
                                        onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 font-bold text-lg"
                                        placeholder="0.00"
                                    />
                                    {selectedItem && (
                                        <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-500 font-medium text-sm">
                                            {selectedItem.unit}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Reason / Notes</label>
                                <textarea
                                    required
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all shadow-sm"
                                    placeholder="Briefly explain the reason..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !formData.itemId || !formData.quantity}
                        className={`flex items-center gap-2 px-8 py-3 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 ${loading || !formData.itemId || !formData.quantity
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-[#FF6A00] hover:bg-[#FF6A00]/90'
                            }`}
                    >
                        {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
                        {loading ? 'Processing...' : 'Confirm Adjustment'}
                    </button>
                </div>
            </form >
        </div >
    );
}

// ==================== BULK STOCK TAKE FORM ====================

function BulkStockTakeForm({ items, departments, locations, onRefresh, setLoading, loading, showToast }: AdjustmentFormProps) {
    const [started, setStarted] = useState(false);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [filterDept, setFilterDept] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    const filteredItems = items.filter((i: InventoryItem) =>
        (!filterDept || (i.department || '').toLowerCase().trim() === filterDept.toLowerCase().trim())
    );

    const handleStart = () => {
        if (!filterDept) {
            showToast("Please select a department", "error");
            return;
        }
        const initCounts: Record<string, number> = {};
        setCounts(initCounts);
        setStarted(true);
    };

    const handleCountChange = (id: string, val: string) => {
        const num = parseFloat(val);
        setCounts(prev => ({
            ...prev,
            [id]: isNaN(num) ? 0 : num
        }));
    };

    const handleSubmitBulk = async () => {
        setConfirmModal({ isOpen: false });
        setLoading(true);
        try {
            const adjustments = [];
            for (const item of filteredItems) {
                const actual = counts[item.id];
                if (actual === undefined || actual === null) continue;

                const diff = actual - item.currentStock;
                if (Math.abs(diff) > 0.001) {
                    adjustments.push(
                        createStockAdjustment(
                            item.id,
                            diff,
                            'adjustment',
                            `[Bulk Take] ${notes} - Variance Correction`,
                            'Admin',
                            filterLocation || undefined
                        )
                    );
                }
            }

            await Promise.all(adjustments);
            showToast(`Processed ${adjustments.length} adjustments`, "success");
            setStarted(false);
            setNotes('');
            onRefresh();
        } catch (e) {
            console.error(e);
            showToast("Error processing bulk adjustments", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!started) {
        return (
            <div className="bg-white shadow-sm border border-gray-200 p-8 rounded-xl text-center max-w-2xl mx-auto mt-10">
                <TableCellsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Physical Stock Take</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Select a department to begin a bulk stock count. You will be presented with a list of items to enter actual physical quantities.
                </p>

                <div className="max-w-xs mx-auto space-y-4">
                    <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-white transition-all hover:border-gray-400"
                    >
                        <option value="">-- Select Department --</option>
                        {departments.map((dept: Department) => (
                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                    </select>

                    <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-white transition-all hover:border-gray-400"
                    >
                        <option value="">-- Select Location (Optional) --</option>
                        {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleStart}
                        className="w-full py-3 bg-[#FF6A00] text-white font-bold rounded-lg hover:bg-[#FF6A00]/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        disabled={!filterDept}
                    >
                        <ClipboardDocumentCheckIcon className="w-5 h-5" />
                        Start Counting
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-4 border-b border-gray-200 bg-orange-50/50 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Stock Take: {filterDept}</h3>
                    <p className="text-xs text-gray-500">{filteredItems.length} items to count</p>
                </div>
                <button
                    onClick={() => setStarted(false)}
                    className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                >
                    Cancel Stock Take
                </button>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">System Stock</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Actual Count</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredItems.map((item: InventoryItem) => {
                            const actual = counts[item.id];
                            const hasEntry = actual !== undefined;
                            const variance = hasEntry ? actual - item.currentStock : 0;
                            const hasVariance = hasEntry && Math.abs(variance) > 0.001;

                            return (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="font-bold text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                                        {item.purchaseUnit && (
                                            <div className="text-[10px] text-orange-600 mt-0.5">
                                                (Buy in {item.purchaseUnit} = {item.conversionFactor} {item.unit})
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-500">
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-500">
                                        {/* Show Stock for Selected Location if possible, else global */}
                                        {filterLocation && item.stockByLocation ? (item.stockByLocation[filterLocation] || 0) : item.currentStock} {item.unit}
                                        {filterLocation && <div className="text-[10px] text-gray-400">at location</div>}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                value={actual ?? ''}
                                                onChange={(e) => handleCountChange(item.id, e.target.value)}
                                                className={`w-24 px-2 py-1.5 border rounded text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6A00] transition-colors ${hasVariance ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200'
                                                    }`}
                                            />
                                            <span className="text-xs text-gray-400 font-medium w-8 text-left">{item.unit}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {hasEntry && hasVariance ? (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${variance > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                <input
                    type="text"
                    placeholder="Optional notes for this stock take..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg w-full md:w-auto focus:border-[#FF6A00] outline-none"
                />
                <button
                    onClick={() => setConfirmModal({ isOpen: true })}
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-[#FF6A00] text-white font-bold rounded-lg hover:bg-orange-600 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                    {loading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
                    Submit Stock Take
                </button>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={handleSubmitBulk}
                title="Confirm Stock Take"
                message="Are you sure you want to submit these counts? Any variances will be automatically recorded as adjustments."
                confirmText="Submit Adjustments"
                cancelText="Review"
            />
        </div>
    );
}
