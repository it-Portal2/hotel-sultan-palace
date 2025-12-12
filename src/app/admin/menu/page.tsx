"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { getMenuItems, deleteMenuItem, MenuItem } from '@/lib/firestoreService';

export default function AdminMenuPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu items:', error);
      showToast('Failed to load menu items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    try {
      await deleteMenuItem(id);
      setMenuItems(menuItems.filter(item => item.id !== id));
      setDeleteConfirm(null);
      showToast('Menu item deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      showToast('Failed to delete menu item', 'error');
    }
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const stats = useMemo(() => {
    return {
      total: menuItems.length,
      available: menuItems.filter(i => i.isAvailable).length,
      unavailable: menuItems.filter(i => !i.isAvailable).length,
    };
  }, [menuItems]);

  const categoryLabels: Record<string, string> = {
    all: 'All Categories',
    breakfast: 'Breakfast',
    soups: 'Soups',
    main_course: 'Main Course',
    seafood: 'Seafood',
    indian_dishes: 'Indian Dishes',
    pizza: 'Pizza',
    desserts: 'Desserts',
    beverages: 'Beverages',
    snacks: 'Snacks',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-8">
      <BackButton href="/admin" label="Back to Dashboard" />
      
      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Menu Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage food menu items for Sultan Palace Kitchen • {currentDate}</p>
        </div>
        
        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Available:</span>
            <span className="font-semibold text-gray-900">{stats.available}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Unavailable:</span>
            <span className="font-semibold text-gray-900">{stats.unavailable}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none px-3 py-2 text-sm"
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {!isReadOnly && (
          <Link
            href="/admin/menu/new"
            className="inline-flex items-center rounded-lg bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Menu Item
          </Link>
        )}
      </div>

      {/* Clean Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-gray-600">No menu items found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Add your first menu item to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prep Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 line-clamp-1 mt-1">{item.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {item.isVegetarian && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Veg
                              </span>
                            )}
                            {item.isSpecial && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Special
                              </span>
                            )}
                            {item.rating && (
                              <span className="text-xs text-gray-500">⭐ {item.rating}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{item.category.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">${item.price}</div>
                      {item.discountPercent && (
                        <div className="text-xs text-green-600">
                          {item.discountPercent}% off
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.preparationTime} mins</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/menu/edit/${item.id}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        {!isReadOnly && (
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Menu Item</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this menu item? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-b-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
