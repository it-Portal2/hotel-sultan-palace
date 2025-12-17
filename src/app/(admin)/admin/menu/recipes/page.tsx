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
    const foodCostPercent = menuItem.price > 0 ? (totalCost / menuItem.price) * 100 : 0;

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
                sellingPrice: menuItem.price,
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
                    <p className="text-sm text-gray-500">Selling Price: ${menuItem.price.toFixed(2)}</p>
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
            setMenuItems(menus.filter(m => m.status === 'published' && m.category !== 'management'));
            setInventoryItems(inv.filter(i => i.isActive !== false));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = menuItems.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Recipe Management</h1>
                <p className="text-gray-500">Map menu items to ingredients for automatic cost tracking.</p>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex">
                {/* Left: Menu List */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <input
                            type="text"
                            placeholder="Search Menu..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#FF6A00] outline-none"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-orange-50 transition-colors flex justify-between items-center group ${selectedItem?.id === item.id ? 'bg-orange-50 border-l-4 border-l-[#FF6A00]' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div>
                                    <h4 className="font-medium text-gray-900 group-hover:text-[#FF6A00] transition-colors">{item.name}</h4>
                                    <p className="text-xs text-gray-500">{item.category}</p>
                                </div>
                                <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-[#FF6A00]" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Recipe Editor */}
                <div className="flex-1 bg-gray-50/50 p-8 overflow-y-auto">
                    {selectedItem ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <BeakerIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Configure Recipe</h2>
                                    <p className="text-sm text-gray-500">Define ingredients for {selectedItem.name}</p>
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
                            <BeakerIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a menu item to configure its recipe</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

