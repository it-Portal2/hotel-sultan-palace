'use client';

import React, { useState, useEffect } from 'react';
import {
    getMenuItems,
    MenuItem,
    InventoryItem,
} from '@/lib/firestoreService';
import { getRecipeByMenuItem, getInventoryItems, createRecipe as createRecipeService } from '@/lib/inventoryService';
import { useToast } from '@/context/ToastContext';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface RecipeEditorProps {
    menuItemId: string;
}

export function RecipeEditor({ menuItemId }: RecipeEditorProps) {
    const { showToast } = useToast();

    const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [ingredients, setIngredients] = useState<Array<{
        inventoryItemId: string;
        inventoryItemName: string;
        quantity: number;
        unit: string;
        costPerUnit: number;
    }>>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load Menu Item Details
                const allMenuItems = await getMenuItems();
                const item = allMenuItems.find(i => i.id === menuItemId);
                setMenuItem(item || null);

                // Load All Inventory Items for Selection
                const allInventory = await getInventoryItems();
                setInventoryItems(allInventory);

                // Load Existing Recipe if any
                const existingRecipe = await getRecipeByMenuItem(menuItemId);
                if (existingRecipe) {
                    setIngredients(existingRecipe.ingredients);
                } else {
                    setIngredients([]);
                }
            } catch (error) {
                console.error("Error loading recipe data", error);
                showToast("Failed to load data", "error");
            } finally {
                setLoading(false);
            }
        };
        if (menuItemId) {
            loadData();
        }
    }, [menuItemId, showToast]);

    const handleAddIngredient = () => {
        if (inventoryItems.length === 0) return;
        const firstItem = inventoryItems[0];
        setIngredients([...ingredients, {
            inventoryItemId: firstItem.id,
            inventoryItemName: firstItem.name,
            quantity: 1,
            unit: firstItem.unit,
            costPerUnit: firstItem.unitCost || 0
        }]);
    };

    const handleRemoveIngredient = (index: number) => {
        const newIngredients = [...ingredients];
        newIngredients.splice(index, 1);
        setIngredients(newIngredients);
    };

    const handleIngredientChange = (index: number, field: string, value: any) => {
        const newIngredients = [...ingredients];
        const ingredient = { ...newIngredients[index] };

        if (field === 'inventoryItemId') {
            const selectedInvItem = inventoryItems.find(i => i.id === value);
            if (selectedInvItem) {
                ingredient.inventoryItemId = selectedInvItem.id;
                ingredient.inventoryItemName = selectedInvItem.name;
                ingredient.unit = selectedInvItem.unit;
                ingredient.costPerUnit = selectedInvItem.unitCost || 0;
            }
        } else if (field === 'quantity') {
            ingredient.quantity = parseFloat(value) || 0;
        }

        newIngredients[index] = ingredient;
        setIngredients(newIngredients);
    };

    const handleSave = async () => {
        if (!menuItem) return;
        setSaving(true);
        try {
            const totalCost = ingredients.reduce((sum, i) => sum + (i.quantity * i.costPerUnit), 0);

            await createRecipeService({
                menuItemId: menuItem.id,
                menuItemName: menuItem.name,
                ingredients: ingredients.map(i => ({
                    inventoryItemId: i.inventoryItemId,
                    inventoryItemName: i.inventoryItemName,
                    quantity: i.quantity,
                    unit: i.unit,
                    costPerUnit: i.costPerUnit,
                    totalCost: i.quantity * i.costPerUnit
                })),
                totalCost,
                sellingPrice: menuItem.price,
                foodCostPercentage: menuItem.price ? (totalCost / menuItem.price) * 100 : 0,
                isActive: true
            });

            showToast("Recipe saved successfully", "success");
        } catch (error) {
            console.error("Error saving recipe", error);
            showToast("Failed to save recipe", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Recipe Details...</div>;
    if (!menuItem) return <div className="p-8 text-center text-red-500">Menu Item Not Found</div>;

    const totalCost = ingredients.reduce((sum, i) => sum + (i.quantity * i.costPerUnit), 0);
    const profitMargin = menuItem.price - totalCost;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 mb-1">{menuItem.name} Recipe</h1>
                        <p className="text-sm text-gray-500">Configure ingredients for inventory deduction.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Selling Price</p>
                        <p className="text-lg font-bold text-gray-900">${menuItem.price.toFixed(2)}</p>
                    </div>
                </div>

                {/* Ingredients List */}
                <div className="space-y-3 mb-6">
                    {ingredients.map((ingredient, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-end gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Ingredient</label>
                                <select
                                    value={ingredient.inventoryItemId}
                                    onChange={(e) => handleIngredientChange(index, 'inventoryItemId', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:border-[#FF6A00] outline-none text-sm"
                                >
                                    {inventoryItems.map(item => (
                                        <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full sm:w-24">
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Qty ({ingredient.unit})</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={ingredient.quantity}
                                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:border-[#FF6A00] outline-none text-sm"
                                />
                            </div>
                            <div className="w-full sm:w-20 text-right">
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Cost</label>
                                <span className="text-sm font-medium text-gray-900 block py-2">
                                    ${(ingredient.quantity * ingredient.costPerUnit).toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={() => handleRemoveIngredient(index)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded self-end sm:self-auto"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={handleAddIngredient}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Ingredient
                    </button>
                </div>
            </div>

            {/* Sticky Footer Summary */}
            <div className="bg-white border-t border-gray-200 p-4">
                <div className="bg-gray-900 text-white rounded-xl p-4 flex justify-between items-center shadow-lg">
                    <div className="flex gap-6">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Cost</p>
                            <p className="text-lg font-bold text-red-400">${totalCost.toFixed(2)}</p>
                        </div>
                        <div className="w-px bg-gray-700"></div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Margin</p>
                            <p className="text-lg font-bold text-green-400">${profitMargin.toFixed(2)}</p>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#FF6A00] hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow transition-transform active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
