"use client";

import React, { useState, useEffect } from 'react';
import { getMenuItems, getInventoryItems } from '@/lib/firestoreService'; // Import generic
import { createRecipe, getRecipeByMenuItem } from '@/lib/inventoryService';
import type { MenuItem, InventoryItem, Recipe } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { ChevronRightIcon, BeakerIcon } from '@heroicons/react/24/outline';

// Separate component for the Editor to keep file clean
function RecipeEditor({
    menuItem,
    inventoryItems,
    onClose
}: {
    menuItem: MenuItem,
    inventoryItems: InventoryItem[],
    onClose: () => void
}) {
    const { showToast } = useToast();
    const [ingredients, setIngredients] = useState<Array<{
        inventoryItemId: string;
        inventoryItemName: string;
        quantity: number;
        unit: string;
        costPerUnit: number;
    }>>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadRecipe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menuItem]);

    const loadRecipe = async () => {
        const recipe = await getRecipeByMenuItem(menuItem.id);
        if (recipe) {
            // Map existing ingredients
            setIngredients(recipe.ingredients.map(i => ({
                inventoryItemId: i.inventoryItemId,
                inventoryItemName: i.inventoryItemName,
                quantity: i.quantity,
                unit: i.unit,
                costPerUnit: i.costPerUnit
            })));
        }
        setLoading(false);
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { inventoryItemId: '', inventoryItemName: '', quantity: 0, unit: '', costPerUnit: 0 }]);
    };

    const updateIngredient = (index: number, field: string, value: any) => {
        const newIng = [...ingredients];
        const item = { ...newIng[index], [field]: value };

        if (field === 'inventoryItemId') {
            const invItem = inventoryItems.find(i => i.id === value);
            if (invItem) {
                item.inventoryItemName = invItem.name;
                item.unit = invItem.unit;
                item.costPerUnit = invItem.unitCost || 0;
            }
        }

        newIng[index] = item;
        setIngredients(newIng);
    };

    const removeIngredient = (index: number) => {
        const newIng = [...ingredients];
        newIng.splice(index, 1);
        setIngredients(newIng);
    };

    const totalCost = ingredients.reduce((sum, i) => sum + (i.quantity * i.costPerUnit), 0);
    const sellingPrice = menuItem.price || 0;
    const foodCostPercent = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;

    const handleSave = async () => {
        if (ingredients.some(i => !i.inventoryItemId)) {
            showToast("Please select items for all ingredients", "error");
            return;
        }

        setSaving(true);
        try {
            await createRecipe({
                menuItemId: menuItem.id,
                menuItemName: menuItem.name,
                ingredients: ingredients.map(i => ({
                    inventoryItemId: i.inventoryItemId,
                    inventoryItemName: i.inventoryItemName,
                    quantity: Number(i.quantity),
                    unit: i.unit,
                    costPerUnit: Number(i.costPerUnit),
                    totalCost: Number(i.quantity) * Number(i.costPerUnit)
                })),
                totalCost,
                sellingPrice: sellingPrice,
                foodCostPercentage: foodCostPercent,
                isActive: true
            });
            showToast("Recipe saved successfully", "success");
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Failed to save recipe", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Recipe...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg flex items-center justify-between border border-orange-100">
                <div>
                    <h3 className="font-bold text-gray-900">{menuItem.name}</h3>
                    <p className="text-sm text-gray-500">Selling Price: ${sellingPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Total Food Cost</p>
                    <p className="font-bold text-gray-900">${totalCost.toFixed(2)}</p>
                    <p className={`text-xs font-medium ${foodCostPercent > 35 ? 'text-red-500' : 'text-green-500'}`}>
                        {foodCostPercent.toFixed(1)}% Cost
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">Ingredient</label>
                            <select
                                value={ing.inventoryItemId}
                                onChange={e => updateIngredient(idx, 'inventoryItemId', e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1 outline-none focus:border-orange-500"
                            >
                                <option value="">Select Item...</option>
                                {inventoryItems.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-gray-500 block mb-1">Qty ({ing.unit})</label>
                            <input
                                type="number"
                                step="0.001"
                                value={ing.quantity}
                                onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1 outline-none focus:border-orange-500"
                            />
                        </div>
                        <div className="w-20 text-right pb-1">
                            <span className="text-sm font-medium text-gray-700">
                                ${(ing.quantity * ing.costPerUnit).toFixed(2)}
                            </span>
                        </div>
                        <button onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600 pb-1 px-1">
                            &times;
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={addIngredient}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 font-medium text-sm transition-colors"
            >
                + Add Ingredient
            </button>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors font-medium"
                >
                    {saving ? 'Saving...' : 'Save Recipe'}
                </button>
            </div>
        </div>
    );
}

export default function RecipesPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [menus, inv] = await Promise.all([
                getMenuItems(),
                getInventoryItems()
            ]);
            setMenuItems(menus.filter(m => (m.status === 'published' || !m.status) && m.category !== 'management'));
            setInventoryItems(inv.filter(i => i.isActive !== false));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = menuItems.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* CLEAN WHITE HEADER */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between z-10 w-full shadow-sm flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        Recipe Management
                    </h1>
                    <p className="text-sm text-gray-500">Map menu items to ingredients for automatic cost tracking.</p>
                </div>

                {/* Search - Full width on mobile, auto on desktop */}
                <div className="w-full md:w-auto relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BeakerIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Menu Items..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full md:w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] bg-gray-50 focus:bg-white transition-all text-sm"
                    />
                </div>
            </header>

            <div className="flex-1 overflow-hidden flex w-full">
                {/* Left: Menu List */}
                <div className="w-1/3 md:w-80 border-r border-gray-200 flex flex-col bg-white h-full z-0 shadow-sm">
                    <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Select Item
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Loading...</div>
                        ) : filteredItems.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No items found</div>
                        ) : (
                            filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-orange-50 transition-colors flex justify-between items-center group ${selectedItem?.id === item.id ? 'bg-orange-50 border-l-4 border-l-[#FF6A00]' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm group-hover:text-[#FF6A00] transition-colors">{item.name}</h4>
                                        <p className="text-xs text-gray-400">{item.category}</p>
                                    </div>
                                    <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-[#FF6A00]" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Recipe Editor */}
                <div className="flex-1 bg-gray-50 p-6 md:p-8 overflow-y-auto h-full w-full">
                    {selectedItem ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                                <div className="w-12 h-12 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]">
                                    <BeakerIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Configure Recipe</h2>
                                    <p className="text-sm text-gray-500">Define ingredients for <span className="font-bold text-gray-800">{selectedItem.name}</span></p>
                                </div>
                            </div>

                            <RecipeEditor
                                menuItem={selectedItem}
                                inventoryItems={inventoryItems}
                                onClose={() => setSelectedItem(null)}
                            />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <BeakerIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-600">No Item Selected</h3>
                            <p className="text-sm">Select a menu item from the list to configure its recipe</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

