"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BackButton from '@/components/admin/BackButton';
import { getMenuItem, updateMenuItem, MenuItem, getMenuCategories, MenuCategory } from '@/lib/firestoreService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const menuItemId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

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
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  const categoryOptions = useMemo(() => {
    return categories.filter(c => !c.parentId);
  }, [categories]);

  const subcategoryOptions = useMemo(() => {
    const selectedCat = categories.find(cat => cat.name === formData.category);
    return categories.filter(c => c.parentId === selectedCat?.id);
  }, [categories, formData.category]);

  useEffect(() => {
    loadMenuItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItemId]);

  const loadMenuItem = async () => {
    try {
      setLoading(true);
      const item = await getMenuItem(menuItemId);
      if (item) {
        setFormData({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          subcategory: item.subcategory || '',
          sku: item.sku || '',
          taxGroup: item.taxGroup || 'VAT',
          cost: item.cost || 0,
          hasDiscount: item.hasDiscount || false,
          openPrice: item.openPrice || false,
          image: item.image || '',
          isVegetarian: item.isVegetarian,
          isAvailable: item.isAvailable,
          preparationTime: item.preparationTime,
          rating: item.rating || 0,
          isSpecial: item.isSpecial || false,
          discountPercent: item.discountPercent || 0,
          hasVariants: item.hasVariants || false,
          variants: item.variants || [],
          modifiers: item.modifiers || []
        });
      } else {
        router.push('/admin/menu');
      }
    } catch (error) {
      console.error('Error loading menu item:', error);
      router.push('/admin/menu');
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);

    try {
      await updateMenuItem(menuItemId, formData);
      router.push('/admin/menu');
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert('Failed to update menu item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <BackButton href="/admin/menu" label="Back to Menu" />

      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Edit Menu Item</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Update menu item details</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 space-y-8">

        {/* Basic Information Section */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" placeholder="e.g., Seafood Platter" />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" placeholder="Describe the dish..." />
            </div>

            {/* Category */}
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
              }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]">
                {categoryOptions.length === 0 ? <option value="">No categories available</option> : categoryOptions.map(cat => <option key={cat.id} value={cat.name}>{cat.label}</option>)}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select value={formData.subcategory || ''} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]">
                {subcategoryOptions.length === 0 ? <option value="">No subcategories</option> : subcategoryOptions.map(sub => <option key={sub.id} value={sub.name}>{sub.label}</option>)}
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input type="text" value={formData.sku || ''} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" placeholder="e.g., SKU-001" />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
              <input type="number" min="0" max="5" step="0.1" value={formData.rating || ''} onChange={(e) => { const value = parseFloat(e.target.value); setFormData({ ...formData, rating: isNaN(value) ? 0 : value }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" />
            </div>
          </div>
        </div>

        {/* Pricing & Operations Section */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Pricing & Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
              <input type="number" required min="0" step="0.01" value={formData.price || ''} onChange={(e) => { const value = parseFloat(e.target.value); setFormData({ ...formData, price: isNaN(value) ? 0 : value }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" />
            </div>

            {/* Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost ($)</label>
              <input type="number" min="0" step="0.01" value={formData.cost || ''} onChange={(e) => { const value = parseFloat(e.target.value); setFormData({ ...formData, cost: isNaN(value) ? 0 : value }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" />
            </div>

            {/* Tax Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Group</label>
              <input type="text" value={formData.taxGroup || ''} onChange={(e) => setFormData({ ...formData, taxGroup: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" placeholder="VAT" />
            </div>

            {/* Preparation Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (mins) *</label>
              <input type="number" required min="1" value={formData.preparationTime || ''} onChange={(e) => { const value = parseInt(e.target.value); setFormData({ ...formData, preparationTime: isNaN(value) ? 30 : value }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" />
            </div>

            {/* Indicators */}
            <div className="md:col-span-2 flex flex-wrap gap-6 mt-2">
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
            {/* Discount Percent */}
            {formData.isSpecial && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Percent (%)</label>
                <input type="number" min="0" max="100" value={formData.discountPercent || ''} onChange={(e) => { const value = parseInt(e.target.value); setFormData({ ...formData, discountPercent: isNaN(value) ? 0 : value }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" />
              </div>
            )}
          </div>
        </div>

        {/* --- APP CONFIGURATION SECTION --- */}
        <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4 flex items-center justify-between">
            App Booking Configuration
            <span className="text-xs font-normal text-gray-500 bg-white px-2 py-1 rounded border">Advanced</span>
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
                  <div key={idx} className="flex gap-4 items-center animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Variant Name (e.g. Small)"
                      value={v.name}
                      onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-[#FF6A00] outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) => updateVariant(idx, 'price', parseFloat(e.target.value))}
                      className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-[#FF6A00] outline-none"
                    />
                    <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addVariant} className="text-sm font-bold text-[#FF6A00] flex items-center gap-1 hover:underline">
                  <PlusIcon className="h-4 w-4" /> Add Variant
                </button>
              </div>
            )}
          </div>

          {/* Modifiers Section */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Add-ons / Modifiers (e.g. Extra Cheese, Cooking Preference)</label>
            <div className="space-y-4">
              {formData.modifiers?.map((m, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group">
                  <button type="button" onClick={() => removeModifier(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold">Name</label>
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => updateModifier(idx, 'name', e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 text-sm border rounded focus:border-[#FF6A00] outline-none"
                        placeholder="e.g. Extra Cheese"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold">Price ($)</label>
                      <input
                        type="number"
                        value={m.price}
                        onChange={(e) => updateModifier(idx, 'price', parseFloat(e.target.value))}
                        className="w-full mt-1 px-2 py-1.5 text-sm border rounded focus:border-[#FF6A00] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold">Type</label>
                      <select
                        value={m.type}
                        onChange={(e) => updateModifier(idx, 'type', e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 text-sm border rounded focus:border-[#FF6A00] outline-none"
                      >
                        <option value="optional">Optional</option>
                        <option value="required">Required</option>
                        <option value="multiple">Multiple Choice</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold">Options (Comma sep.)</label>
                      <input
                        type="text"
                        placeholder="Rare, Medium, Well Done"
                        value={m.options?.join(', ') || ''}
                        onChange={(e) => updateModifier(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full mt-1 px-2 py-1.5 text-sm border rounded focus:border-[#FF6A00] outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addModifier} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#FF6A00] hover:text-[#FF6A00] transition flex justify-center items-center gap-2 font-medium">
                <PlusIcon className="h-5 w-5" /> Add Modifier
              </button>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]" />
          {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
          {formData.image && <img src={formData.image} alt="Preview" className="mt-4 h-32 w-32 object-cover rounded-lg" />}
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => router.push('/admin/menu')} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}
