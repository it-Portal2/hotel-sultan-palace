import React, { useState, useEffect } from 'react';
import type { InventoryItem, InventoryCategory, InventoryDepartment, Department } from '@/lib/firestoreService';
import Drawer from '@/components/ui/Drawer';

interface InventoryModalProps {
    item: InventoryItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<InventoryItem>) => void;
    categories: InventoryCategory[];
    departments: Department[];
    defaultCategory?: string;
}

// Smart Location Suggestions based on Department for Sultan Palace
// Smart Location Suggestions based on Department for Sultan Palace
// We can keep this for now, mapped to slugs. If a slug matches, we show suggestions.
const LOCATION_SUGGESTIONS: Record<string, string[]> = {
    kitchen: ['Main Kitchen Store', 'Clubhouse Kitchen', 'Beach Restaurant Kitchen', 'Cold Room', 'Dry Store', 'Bakery'],
    bar: ['Main Bar (Clubhouse)', 'Beach Bar', 'Pool Bar', 'Wine Cellar', 'Dispense Bar'],
    spa: ['Spa Reception', 'Massage Room 1', 'Massage Room 2', 'Spa Store'],
    housekeeping: ['Main Linen Room', 'Laundry', 'Floor Pantry', 'Cleaning Store'],
    maintenance: ['Maintenance Workshop', 'Garden Shed', 'Pool Pump Room', 'Generator Room'],
    front_office: ['Reception Desk', 'Back Office Store', 'Stationery Cupboard'],
    other: ['General Store', 'Lost & Found']
};

export default function InventoryModal({
    item,
    isOpen,
    onClose,
    onSave,
    categories,
    departments,
    defaultCategory = ''
}: InventoryModalProps) {
    const defaultDept = departments.length > 0 ? departments[0].name : 'Kitchen';

    const [formData, setFormData] = useState({
        name: '',
        department: defaultDept as string,
        category: '', // will set default in effect
        sku: '',
        unit: 'piece',
        currentStock: '',
        minStockLevel: '',
        maxStockLevel: '',
        reorderPoint: '',
        unitCost: '',
        location: '',
        preferredSupplierId: '',
        purchaseUnit: '',
        conversionFactor: '',
        isActive: true,
    });

    const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);

    // Update state when item changes (for edit mode) or initial load
    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                department: item.department || defaultDept,
                category: item.category,
                sku: item.sku,
                unit: item.unit,
                currentStock: item.currentStock.toString(),
                minStockLevel: item.minStockLevel.toString(),
                maxStockLevel: item.maxStockLevel.toString(),
                reorderPoint: item.reorderPoint.toString(),
                unitCost: item.unitCost.toString(),
                location: item.location || '',
                preferredSupplierId: item.preferredSupplierId || '',
                purchaseUnit: item.purchaseUnit || '',
                conversionFactor: item.conversionFactor ? item.conversionFactor.toString() : '',
                isActive: item.isActive,
            });
        } else {
            // New Item Defaults
            setFormData({
                name: '',
                department: defaultDept,
                category: defaultCategory || (categories.length > 0 ? categories[0].name : ''),
                sku: '',
                unit: 'piece',
                currentStock: '',
                minStockLevel: '',
                maxStockLevel: '',
                reorderPoint: '',
                unitCost: '',
                location: '',
                preferredSupplierId: '',
                purchaseUnit: '',
                conversionFactor: '',
                isActive: true,
            });
        }
    }, [item, categories, departments, isOpen, defaultCategory]);

    // Update location suggestions when department changes
    useEffect(() => {
        // Try to match department name to a slug key in our suggestions, or use empty
        const deptSlug = departments.find(d => d.name === formData.department)?.slug || formData.department.toLowerCase();
        setLocationSuggestions(LOCATION_SUGGESTIONS[deptSlug] || []);
    }, [formData.department, departments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            unit: formData.unit as any,
            currentStock: parseFloat(formData.currentStock) || 0,
            minStockLevel: parseFloat(formData.minStockLevel) || 0,
            maxStockLevel: parseFloat(formData.maxStockLevel) || 0,
            reorderPoint: parseFloat(formData.reorderPoint) || 0,
            unitCost: parseFloat(formData.unitCost) || 0,
            purchaseUnit: formData.purchaseUnit || undefined,
            conversionFactor: parseFloat(formData.conversionFactor) || undefined,
        });
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={item ? 'Edit Inventory Item' : 'New Inventory Item'}
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        type="button"
                        className="px-5 py-2.5 bg-[#FF6A00] text-white rounded-lg font-medium hover:bg-[#FF6A00]/90 transition-colors shadow-sm"
                    >
                        {item ? 'Save Changes' : 'Create Item'}
                    </button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section: Classification */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Core Classification</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Department</label>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] bg-white transition-all shadow-sm"
                            >
                                {departments.length === 0 && <option value="Kitchen">Kitchen (Default)</option>}
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] bg-white transition-all"
                                >
                                    <option value="">Select Category...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">SKU / Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all uppercase placeholder:normal-case font-mono text-sm"
                                    placeholder="e.g. BEV-001"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Item Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Absolut Vodka 750ml"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Inventory Details */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Inventory Details</h3>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Current Stock */}
                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Current Stock</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="any"
                                    value={formData.currentStock}
                                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none font-bold text-gray-900"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                                        className="text-xs bg-gray-100 border-none rounded py-1 px-2 text-gray-600 focus:ring-0 cursor-pointer hover:bg-gray-200"
                                    >
                                        <option value="piece">PC</option>
                                        <option value="kg">KG</option>
                                        <option value="liter">L</option>
                                        <option value="bottle">BTL</option>
                                        <option value="box">CTN</option>
                                        <option value="pack">PKT</option>
                                        <option value="gram">G</option>
                                        <option value="ml">ML</option>
                                        <option value="can">CAN</option>
                                        <option value="other">OTH</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Unit Cost */}
                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Unit Cost</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="any"
                                    value={formData.unitCost}
                                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                                    className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Storage & Logistics */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pt-4 border-t border-gray-100">Storage & Logistics</h3>
                    <div className="space-y-4">
                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex justify-between">
                                <span>Storage Location</span>
                                {formData.department && <span className="text-[10px] uppercase font-bold text-[#FF6A00] bg-orange-50 px-2 py-0.5 rounded-full">{formData.department} Zone</span>}
                            </label>
                            <input
                                type="text"
                                list="location-suggestions"
                                placeholder="Select or type location..."
                                value={formData.location || ''}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all"
                            />
                            <datalist id="location-suggestions">
                                {locationSuggestions.map(loc => (
                                    <option key={loc} value={loc} />
                                ))}
                            </datalist>
                            <p className="text-xs text-gray-400 mt-1.5">
                                Start typing to see smart suggestions for {formData.department}.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Supplier</label>
                            <input
                                type="text"
                                placeholder="Supplier Name / ID"
                                value={formData.preferredSupplierId || ''}
                                onChange={(e) => setFormData({ ...formData, preferredSupplierId: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Min Level</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.minStockLevel}
                                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-center focus:border-[#FF6A00] outline-none text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Reorder Point</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.reorderPoint}
                                    onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-center focus:border-[#FF6A00] outline-none text-sm font-medium text-[#FF6A00]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Max Level</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.maxStockLevel}
                                    onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-center focus:border-[#FF6A00] outline-none text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Unit Conversion (New for Real World) */}
                    <div className="mt-4 grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                        <div className="col-span-2">
                            <h4 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span>Purchasing & Conversion</span>
                            </h4>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Purchase Unit</label>
                            <input
                                type="text"
                                placeholder="e.g. Case, Box"
                                value={formData.purchaseUnit}
                                onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                Conversion Factor
                                <span className="text-xs font-normal text-gray-500 ml-1">(1 {formData.purchaseUnit || 'Unit'} = ? {formData.unit})</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                placeholder="e.g. 24"
                                value={formData.conversionFactor}
                                onChange={(e) => setFormData({ ...formData, conversionFactor: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </Drawer >
    );
}
