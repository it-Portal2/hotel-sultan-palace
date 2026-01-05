"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { createMenuItem, updateMenuItem, MenuItem, getMenuCategories, MenuCategory } from '@/lib/firestoreService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface MenuFormProps {
    initialData?: MenuItem | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function MenuForm({ initialData, onSuccess, onCancel }: MenuFormProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<MenuCategory[]>([]);

    const [formData, setFormData] = useState<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>>({
        name: '',
        description: '',
        price: 0,
        category: '' as MenuItem['category'],
        subcategory: '',
        sku: '',
        taxGroup: 'VAT',
        cost: 0,
        hasDiscount: false,
        openPrice: false,
        image: '',
        isVegetarian: false,
        isAvailable: true,
        preparationTime: 30,
        rating: 0,
        isSpecial: false,
        discountPercent: 0,
        hasVariants: false,
        variants: [],
        modifiers: []
    });

    useEffect(() => {
        (async () => {
            try {
                const cats = await getMenuCategories();
                setCategories(cats);

                if (initialData) {
                    setFormData({
                        name: initialData.name,
                        description: initialData.description,
                        price: initialData.price,
                        category: initialData.category,
                        subcategory: initialData.subcategory || '',
                        sku: initialData.sku || '',
                        taxGroup: initialData.taxGroup || 'VAT',
                        cost: initialData.cost || 0,
                        hasDiscount: initialData.hasDiscount || false,
                        openPrice: initialData.openPrice || false,
                        image: initialData.image || '',
                        isVegetarian: initialData.isVegetarian,
                        isAvailable: initialData.isAvailable,
                        preparationTime: initialData.preparationTime,
                        rating: initialData.rating || 0,
                        isSpecial: initialData.isSpecial || false,
                        discountPercent: initialData.discountPercent || 0,
                        hasVariants: initialData.hasVariants || false,
                        variants: initialData.variants || [],
                        modifiers: initialData.modifiers || []
                    });
                } else if (cats.length) {
                    // Pre-select first category for new items
                    const parentCats = cats.filter(c => !c.parentId);
                    const first = parentCats[0];
                    if (first) {
                        const subcats = cats.filter(c => c.parentId === first.id);
                        setFormData(prev => ({
                            ...prev,
                            category: (first.name as MenuItem['category']),
                            subcategory: subcats[0]?.name || '',
                        }));
                    }
                }
            } catch (error) {
                console.error("Error fetching categories", error);
            }
        })();
    }, [initialData]);

    const categoryOptions = useMemo(() => {
        return categories.filter(c => !c.parentId);
    }, [categories]);

    const subcategoryOptions = useMemo(() => {
        const selectedCat = categories.find(cat => cat.name === formData.category);
        return categories.filter(c => c.parentId === selectedCat?.id);
    }, [categories, formData.category]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!storage) {
            alert('Storage not initialized. Please retry.');
            return;
        }

        setUploading(true);
        try {
            const storageRef = ref(storage, `menu-items/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setFormData({ ...formData, image: url });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    // --- Variants Helpers ---
    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...(prev.variants || []), { name: '', price: 0 }]
        }));
    };

    const removeVariant = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants?.filter((_, i) => i !== index)
        }));
    };

    const updateVariant = (index: number, field: 'name' | 'price', value: string | number) => {
        setFormData(prev => {
            const newVariants = [...(prev.variants || [])];
            if (newVariants[index]) {
                // @ts-ignore
                newVariants[index][field] = value;
            }
            return { ...prev, variants: newVariants };
        });
    };

    // --- Modifiers Helpers ---
    const addModifier = () => {
        setFormData(prev => ({
            ...prev,
            modifiers: [...(prev.modifiers || []), { name: '', price: 0, type: 'optional', options: [] }]
        }));
    };

    const removeModifier = (index: number) => {
        setFormData(prev => ({
            ...prev,
            modifiers: prev.modifiers?.filter((_, i) => i !== index)
        }));
    };

    const updateModifier = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newModifiers = [...(prev.modifiers || [])];
            if (newModifiers[index]) {
                // @ts-ignore
                newModifiers[index][field] = value;
            }
            return { ...prev, modifiers: newModifiers };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData?.id) {
                await updateMenuItem(initialData.id, formData);
            } else {
                if (categories.length === 0) {
                    alert('Please create categories first before adding menu items.');
                    return;
                }
                await createMenuItem(formData);
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving menu item:', error);
            alert('Failed to save menu item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-10">
            {/* Basic Information Section */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white" placeholder="e.g., Seafood Platter" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white" placeholder="Describe the dish..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select required value={formData.category} onChange={(e) => {
                                const newCategory = e.target.value as MenuItem['category'];
                                const selectedCat = categories.find(c => c.name === newCategory);
                                const subcats = categories.filter(c => c.parentId === selectedCat?.id);
                                setFormData({
                                    ...formData,
                                    category: newCategory,
                                    subcategory: subcats[0]?.name || '',
                                });
                            }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white">
                                {categoryOptions.length === 0 ? <option value="">No categories</option> : categoryOptions.map(cat => <option key={cat.id} value={cat.name}>{cat.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                            <select value={formData.subcategory || ''} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white">
                                {subcategoryOptions.length === 0 ? <option value="">No subcategories</option> : subcategoryOptions.map(sub => <option key={sub.id} value={sub.name}>{sub.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                            <input type="text" value={formData.sku || ''} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white" placeholder="SKU-001" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                            <input type="number" min="0" max="5" step="0.1" value={formData.rating || ''} onChange={(e) => { const value = parseFloat(e.target.value); setFormData({ ...formData, rating: isNaN(value) ? 0 : value }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing & Operations Section */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Pricing & Operations</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
                        <input type="number" required min="0" step="0.01" value={formData.price || ''} onChange={(e) => { const value = parseFloat(e.target.value); setFormData({ ...formData, price: isNaN(value) ? 0 : value }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cost ($)</label>
                        <input type="number" min="0" step="0.01" value={formData.cost || ''} onChange={(e) => { const value = parseFloat(e.target.value); setFormData({ ...formData, cost: isNaN(value) ? 0 : value }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tax Group</label>
                        <input type="text" value={formData.taxGroup || ''} onChange={(e) => setFormData({ ...formData, taxGroup: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white" placeholder="VAT" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (mins) *</label>
                        <input type="number" required min="1" value={formData.preparationTime || ''} onChange={(e) => { const value = parseInt(e.target.value); setFormData({ ...formData, preparationTime: isNaN(value) ? 30 : value }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50 focus:bg-white" />
                    </div>

                    <div className="col-span-2 flex flex-wrap gap-x-6 gap-y-3 mt-2">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={formData.hasDiscount || false} onChange={(e) => setFormData({ ...formData, hasDiscount: e.target.checked })} className="h-5 w-5 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded" />
                            <span className="ml-2 text-sm font-medium text-gray-700">Has Discount</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={formData.openPrice || false} onChange={(e) => setFormData({ ...formData, openPrice: e.target.checked })} className="h-5 w-5 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded" />
                            <span className="ml-2 text-sm font-medium text-gray-700">Open Price</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={formData.isVegetarian} onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })} className="h-5 w-5 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded" />
                            <span className="ml-2 text-sm font-medium text-gray-700">Vegetarian</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} className="h-5 w-5 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded" />
                            <span className="ml-2 text-sm font-medium text-gray-700">Available</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={formData.isSpecial} onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })} className="h-5 w-5 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded" />
                            <span className="ml-2 text-sm font-medium text-gray-700">Today&apos;s Special</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* --- APP CONFIGURATION SECTION --- */}
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4 flex items-center justify-between">
                    App Booking Configuration
                </h3>

                {/* Variants Toggle */}
                <div className="mb-6">
                    <label className="flex items-center cursor-pointer mb-4">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={formData.hasVariants || false} onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })} />
                            <div className={`block w-10 h-6 rounded-full ${formData.hasVariants ? 'bg-[#FF6A00]' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${formData.hasVariants ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <div className="ml-3 text-sm font-medium text-gray-700">Has Size Variants (e.g. Small, Large)</div>
                    </label>

                    {formData.hasVariants && (
                        <div className="space-y-3 pl-4 border-l-2 border-[#FF6A00]/20">
                            {formData.variants?.map((v, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Variant Name"
                                        value={v.name}
                                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                        className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#FF6A00] outline-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={v.price}
                                        onChange={(e) => updateVariant(idx, 'price', parseFloat(e.target.value))}
                                        className="w-24 px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#FF6A00] outline-none"
                                    />
                                    <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addVariant} className="text-xs font-bold text-[#FF6A00] flex items-center gap-1 hover:underline">
                                <PlusIcon className="h-4 w-4" /> Add Variant
                            </button>
                        </div>
                    )}
                </div>

                {/* Modifiers Section */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Add-ons / Modifiers</label>
                    <div className="space-y-4">
                        {formData.modifiers?.map((m, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative group">
                                <button type="button" onClick={() => removeModifier(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Name</label>
                                        <input
                                            type="text"
                                            value={m.name}
                                            onChange={(e) => updateModifier(idx, 'name', e.target.value)}
                                            className="w-full mt-0.5 px-2 py-1 text-xs border rounded focus:border-[#FF6A00] outline-none"
                                            placeholder="e.g. Extra Cheese"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Price ($)</label>
                                        <input
                                            type="number"
                                            value={m.price}
                                            onChange={(e) => updateModifier(idx, 'price', parseFloat(e.target.value))}
                                            className="w-full mt-0.5 px-2 py-1 text-xs border rounded focus:border-[#FF6A00] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Type</label>
                                        <select
                                            value={m.type}
                                            onChange={(e) => updateModifier(idx, 'type', e.target.value)}
                                            className="w-full mt-0.5 px-2 py-1 text-xs border rounded focus:border-[#FF6A00] outline-none"
                                        >
                                            <option value="optional">Optional</option>
                                            <option value="required">Required</option>
                                            <option value="multiple">Multiple Choice</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addModifier} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#FF6A00] hover:text-[#FF6A00] transition flex justify-center items-center gap-2 font-medium text-xs">
                            <PlusIcon className="h-4 w-4" /> Add Modifier
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] bg-gray-50" />
                {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                {formData.image && <img src={formData.image} alt="Preview" className="mt-4 h-32 w-32 object-cover rounded-lg" />}
            </div>

            <div className="flex gap-3 pt-6 border-t">
                <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 disabled:opacity-50 font-medium shadow-md md:shadow-lg">{loading ? 'Saving...' : 'Save Item'}</button>
            </div>
        </form>
    );
}
