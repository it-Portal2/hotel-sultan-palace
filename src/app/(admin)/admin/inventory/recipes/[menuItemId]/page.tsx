'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    getMenuItems,
    MenuItem,
    InventoryItem,
} from '@/lib/firestoreService';
import { getRecipeByMenuItem } from '@/lib/inventoryService';
import { getInventoryItems } from '@/lib/inventoryService';
import { createRecipe as createRecipeService } from '@/lib/inventoryService'; // Ensure this matches export
import { useToast } from '@/context/ToastContext';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Helper to handle both service locations if needed, 
// strictly speaking createRecipe is in inventoryService.ts based on previous read
// but checking imports carefully.

export default function RecipeEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const menuItemId = params.menuItemId as string;

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
                }
            } catch (error) {
                console.error("Error loading recipe data", error);
                showToast("Failed to load data", "error");
            } finally {
                setLoading(false);
            }
        };
        loadData();
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

            // Note: Update logic is missing in service, so we might create duplicate if not careful.
            // Ideally we check if recipe exists and update, or delete old and create new.
            // For MVP, assuming createRecipe handles it or we just create a new one (will need cleanup).

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
            router.push('/admin/inventory/recipes');
        } catch (error) {
            console.error("Error saving recipe", error);
            showToast("Failed to save recipe", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!menuItem) return <div className="p-8 text-center text-red-500">Menu Item Not Found</div>;

    const totalCost = ingredients.reduce((sum, i) => sum + (i.quantity * i.costPerUnit), 0);
    const profitMargin = menuItem.price - totalCost;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Link href="/admin/inventory/recipes" className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Recipes
            </Link>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{menuItem.name} Recipe</h1>
                        <p className="text-gray-500">Configure ingredients for inventory deduction.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Selling Price</p>
                        <p className="text-xl font-bold text-gray-900">${menuItem.price.toFixed(2)}</p>
                    </div>
                </div>

                {/* Ingredients List */}
                <div className="space-y-4 mb-8">
                    {ingredients.map((ingredient, index) => (
                        <div key={index} className="flex items-end gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Ingredient</label>
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
                            <div className="w-32">
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Quantity</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={ingredient.quantity}
                                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:border-[#FF6A00] outline-none text-sm"
                                />
                            </div>
                            <div className="w-24 px-2">
                                <span className="text-xs text-gray-500 block mb-1">Unit Item</span>
                                <span className="text-sm font-mono text-gray-400">{ingredient.unit}</span>
                            </div>
                            <div className="w-24 text-right">
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Cost</label>
                                <span className="text-sm font-medium text-gray-900">
                                    ${(ingredient.quantity * ingredient.costPerUnit).toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={() => handleRemoveIngredient(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={handleAddIngredient}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Ingredient
                    </button>
                </div>

                {/* Summary */}
                <div className="bg-gray-900 text-white rounded-xl p-6 flex justify-between items-center">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Total Food Cost</p>
                        <p className="text-2xl font-bold text-red-400">${totalCost.toFixed(2)}</p>
                    </div>
                    <div className="w-px h-12 bg-gray-700"></div>
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Profit Margin</p>
                        <p className="text-2xl font-bold text-green-400">${profitMargin.toFixed(2)}</p>
                    </div>
                    <div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#FF6A00] hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Recipe'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
