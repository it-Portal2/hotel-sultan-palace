"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BackButton from '@/components/admin/BackButton';
import { getMenuItem, updateMenuItem, MenuItem, getMenuCategories, MenuCategory } from '@/lib/firestoreService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

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
          image: item.image || '',
          isVegetarian: item.isVegetarian,
          isAvailable: item.isAvailable,
          preparationTime: item.preparationTime,
          rating: item.rating || 0,
          isSpecial: item.isSpecial || false,
          discountPercent: item.discountPercent || 0,
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
    <div className="space-y-6">
      <BackButton href="/admin/menu" label="Back to Menu" />

      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Edit Menu Item</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Update menu item details</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
              placeholder="e.g., Seafood Platter"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
              placeholder="Describe the dish..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => {
                const newCategory = e.target.value as MenuItem['category'];
                const selectedCat = categories.find(c => c.name === newCategory);
                const subcats = categories.filter(c => c.parentId === selectedCat?.id);
                setFormData({
                  ...formData,
                  category: newCategory,
                  subcategory: subcats[0]?.name || '',
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
            >
              {categoryOptions.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                categoryOptions.map(cat => (
                  <option key={cat.id} value={cat.name as MenuItem['category']}>{cat.label}</option>
                ))
              )}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <select
              value={formData.subcategory || ''}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
            >
              {subcategoryOptions.length === 0 ? (
                <option value="">No subcategories</option>
              ) : (
                subcategoryOptions.map((sub) => (
                  <option key={sub.id} value={sub.name}>{sub.label}</option>
                ))
              )}
            </select>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU
            </label>
            <input
              type="text"
              value={formData.sku || ''}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
              placeholder="e.g., SKU-001"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price ($) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({ ...formData, price: isNaN(value) ? 0 : value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.cost || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({ ...formData, cost: isNaN(value) ? 0 : value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Tax Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Group
            </label>
            <input
              type="text"
              value={formData.taxGroup || ''}
              onChange={(e) => setFormData({ ...formData, taxGroup: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
              placeholder="VAT"
            />
          </div>

          {/* Preparation Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preparation Time (minutes) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.preparationTime || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setFormData({ ...formData, preparationTime: isNaN(value) ? 30 : value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (1-5)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({ ...formData, rating: isNaN(value) ? 0 : value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
            />
            {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
            {formData.image && (
              <img src={formData.image} alt="Preview" className="mt-4 h-32 w-32 object-cover rounded-lg" />
            )}
          </div>

          {/* Checkboxes */}
          <div className="md:col-span-2 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hasDiscount || false}
                onChange={(e) => setFormData({ ...formData, hasDiscount: e.target.checked })}
                className="h-4 w-4 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Discount</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.openPrice || false}
                onChange={(e) => setFormData({ ...formData, openPrice: e.target.checked })}
                className="h-4 w-4 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Open Price</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isVegetarian}
                onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                className="h-4 w-4 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Vegetarian</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="h-4 w-4 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Available</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isSpecial}
                onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                className="h-4 w-4 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Today&apos;s Special</span>
            </label>
          </div>

          {/* Discount */}
          {formData.isSpecial && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Percent (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discountPercent || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData({ ...formData, discountPercent: isNaN(value) ? 0 : value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/menu')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

