"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  XMarkIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import {
  getMenuItems,
  deleteMenuItem,
  MenuItem,
  getMenuCategories,
  MenuCategory,
  createMenuCategory,
  deleteMenuCategory
} from '@/lib/firestoreService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Drawer from '@/components/ui/Drawer';
import MenuForm from '@/components/admin/menu/MenuForm';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';

export default function AdminMenuPage() {
  const router = useRouter();
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<{ id: string, name: string } | null>(null);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // New Category State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [menuData, catData] = await Promise.all([
        getMenuItems(),
        getMenuCategories()
      ]);
      setItems(menuData);
      setCategories(catData);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      showToast('Failed to load menu data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMenuItem(deleteConfirm);
      setItems(items.filter(item => item.id !== deleteConfirm));
      setDeleteConfirm(null);
      showToast('Item deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      showToast('Failed to delete item', 'error');
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setIsDrawerOpen(true);
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatLabel) return;
    try {
      // Optimistic / Immediate Update
      const newId = await createMenuCategory({ name: newCatName, label: newCatLabel, parentId: null });

      if (newId) {
        setCategories(prev => [
          ...prev,
          {
            id: newId,
            name: newCatName,
            label: newCatLabel,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      }

      setIsCategoryModalOpen(false);
      setNewCatName("");
      setNewCatLabel("");
      // fetchData(); // Optional: still fetch to ensure consistency, but we already updated UI
      showToast('Category created', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create category', 'error');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    setDeleteCatConfirm({ id, name });
  };

  const executeDeleteCategory = async () => {
    if (!deleteCatConfirm) return;
    try {
      await deleteMenuCategory(deleteCatConfirm.id);
      fetchData();
      showToast('Category deleted', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete category', 'error');
    } finally {
      setDeleteCatConfirm(null);
    }
  };

  // --- Filter Logic ---
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Group Logic ---
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};

    // Sort items: Items with subcategory first, then others
    const sortedFiltered = [...filteredItems].sort((a, b) => {
      if (a.subcategory && !b.subcategory) return -1;
      if (!a.subcategory && b.subcategory) return 1;
      return 0;
    });

    sortedFiltered.forEach(item => {
      const sub = item.subcategory || 'Other';
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(item);
    });

    // Sort keys so 'Other' is last
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });

    return sortedKeys.reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [filteredItems]);


  if (loading) {
    return <div className="p-8 text-center flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A00]"></div></div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar for Categories */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-shrink-0 flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Categories</h2>
          <button onClick={() => setIsCategoryModalOpen(true)} className="text-[#FF6A00] hover:bg-[#FF6A00]/10 p-1.5 rounded-md transition-colors" title="Add Category">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${selectedCategory === 'All'
              ? 'bg-[#FF6A00]/10 text-[#FF6A00]'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            All Items
            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === 'All' ? 'bg-[#FF6A00]/20 text-[#FF6A00]' : 'bg-gray-100 text-gray-500'}`}>{items.length}</span>
          </button>

          {categories.filter(c => !c.parentId).map(cat => (
            <div key={cat.id} className="group relative">
              <button
                onClick={() => setSelectedCategory(cat.name)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${selectedCategory === cat.name
                  ? 'bg-[#FF6A00]/10 text-[#FF6A00]'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {cat.label}
                {selectedCategory === cat.name && <ChevronRightIcon className="h-4 w-4" />}
              </button>
              {!isReadOnly && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.label); }}
                  className="absolute right-1 top-2 p-1 text-gray-300 hover:text-red-500 hidden group-hover:block bg-white shadow-sm rounded border border-gray-100"
                  title="Delete Category"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* CLEAN HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between flex-shrink-0 z-10 w-full">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
              Menu Items
            </h1>
            <p className="text-gray-500 text-sm font-medium mt-1">Manage your food and beverage offerings</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
              />
            </div>
            {!isReadOnly && (
              <button
                onClick={handleAddClick}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-black font-bold border border-black uppercase tracking-wide text-xs shadow-sm active:scale-95 transition-all"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="hidden md:inline">Add Item</span>
                <span className="md:hidden">Add</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 pb-20 md:pb-6">

          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TagIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No items found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">Try adjusting your search or category filter, or create a new item.</p>
              <button onClick={handleAddClick} className="mt-6 text-[#FF6A00] font-medium hover:underline">Create new item</button>
            </div>
          ) : (
            <>
              {/* Desktop List View */}
              <div className="hidden md:block bg-white shadow-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Item Name</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">SKU</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tax</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Discount</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Open Price</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Cost</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(groupedItems).map(([subcategory, items]) => (
                      <React.Fragment key={subcategory}>
                        {subcategory !== 'Other' && (
                          <tr className="bg-gray-50/30">
                            <td colSpan={9} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                              <span className="w-1 h-3 bg-[#FF6A00] rounded-full"></span>
                              {subcategory}
                            </td>
                          </tr>
                        )}
                        {items.map((item) => (
                          <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="flex flex-col">
                                <span className="font-medium">{item.name}</span>
                                <div className="flex gap-1 mt-0.5">
                                  {item.hasVariants && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                      VARIANTS
                                    </span>
                                  )}
                                  {item.modifiers && item.modifiers.length > 0 && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                      MODS
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 uppercase text-xs font-medium tracking-wide">{item.category?.replace('_', ' ')}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.sku || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.taxGroup || 'VAT'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.hasDiscount || item.discountPercent ? <span className="text-green-600 font-bold">Yes</span> : 'No'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.openPrice ? 'Yes' : 'No'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                              {item.cost ? item.cost.toFixed(2) : '0.00'}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 font-mono">
                              {item.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} title={item.isAvailable ? "Available" : "Unavailable"}></span>
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-1.5 text-gray-500 hover:text-[#FF6A00] hover:bg-orange-50 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                {!isReadOnly && (
                                  <button
                                    onClick={() => setDeleteConfirm(item.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View - Redesigned Grid */}
              <div className="md:hidden overflow-auto flex-1 p-1 pb-24">
                {Object.entries(groupedItems).map(([subcategory, items]) => (
                  <React.Fragment key={subcategory}>
                    {subcategory !== 'Other' && (
                      <div className="px-1 py-2 text-xs font-black text-gray-400 uppercase tracking-widest mt-4 first:mt-0 flex items-center gap-2">
                        <span className="w-1 h-3 bg-[#FF6A00] rounded-full"></span>
                        {subcategory}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {items.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full relative group active:scale-95 transition-transform duration-200">
                          {/* Status Indicator */}
                          <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full z-10 border-2 border-white shadow-sm ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>

                          {/* Image Placeholder / Content */}
                          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <div className="text-gray-300 font-bold text-[10px] tracking-widest uppercase">No Image</div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                  <div className="text-white font-bold text-lg leading-none drop-shadow-sm">${item.price.toFixed(0)}</div>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="p-3 flex flex-col flex-1">
                            <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 mb-1">{item.name}</h3>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.hasVariants && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  VARIANTS
                                </span>
                              )}
                              {item.modifiers && item.modifiers.length > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  MODS
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mb-2 truncate">{item.description}</p>

                            <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                              <button
                                onClick={() => handleEditClick(item)}
                                className="flex-1 py-1.5 bg-orange-50 text-[#FF6A00] text-xs font-bold rounded text-center hover:bg-orange-100 transition-colors"
                              >
                                Edit
                              </button>
                              {!isReadOnly && (
                                <button
                                  onClick={() => setDeleteConfirm(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>

        {/* CONFIRMATION MODAL */}
        <ConfirmationModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Menu Item"
          message="Are you sure you want to delete this menu item? This action cannot be undone."
        />

        <ConfirmationModal
          isOpen={!!deleteCatConfirm}
          onClose={() => setDeleteCatConfirm(null)}
          onConfirm={executeDeleteCategory}
          title="Delete Custom Category"
          message={`Are you sure you want to delete the category "${deleteCatConfirm?.name}"? Items in it will need re-categorization.`}
        />

        {/* CATEGORY MODAL */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900">Add Category</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddCategory} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal Name (Slug)</label>
                  <input
                    required
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="e.g. main_course"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Label</label>
                  <input
                    required
                    value={newCatLabel}
                    onChange={e => setNewCatLabel(e.target.value)}
                    placeholder="e.g. Main Course"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] text-sm"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#FF6A00] text-white rounded-lg font-bold hover:bg-[#FF6A00]/90 transition shadow-lg shadow-orange-500/20">
                  Create Category
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FORM DRAWER */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={editingItem ? "Edit Menu Item" : "Add New Item"}
          size="lg"
        >
          <MenuForm
            initialData={editingItem}
            onSuccess={() => {
              setIsDrawerOpen(false);
              fetchData();
              showToast(editingItem ? 'Item updated' : 'Item created', 'success');
            }}
            onCancel={() => setIsDrawerOpen(false)}
          />
        </Drawer>

      </main>
    </div>
  );
}
