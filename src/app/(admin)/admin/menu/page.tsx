"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

import { useAdminRole } from '@/context/AdminRoleContext';
import { useSidebar } from '@/context/SidebarContext';
import { useToast } from '@/context/ToastContext';
import {
  getMenuItems,
  deleteMenuItem,
  MenuItem,
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,

  MenuCategory
} from '@/lib/firestoreService';

type CategoryWithSubs = {
  id?: string;
  name: string;
  label: string;
  subcategories?: { id?: string; name: string; label: string }[];
};

export default function AdminMenuPage() {
  const { isReadOnly } = useAdminRole();
  const { sidebarOpen } = useSidebar();
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ id: string; name: string } | null>(null);
  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<{ id?: string; name: string; label: string; parentId: string | null }>({
    name: '',
    label: '',
    parentId: null
  });
  const [defaultFilter, setDefaultFilter] = useState('Default');

  const buildCategoryTree = (cats: MenuCategory[]): CategoryWithSubs[] => {
    if (!cats.length) return [];
    const byId: Record<string, CategoryWithSubs> = {};
    const roots: CategoryWithSubs[] = [];

    cats.forEach(c => {
      byId[c.id] = { id: c.id, name: c.name, label: c.label, subcategories: [] };
    });

    cats.forEach(c => {
      const parent = c.parentId ? byId[c.parentId] : null;
      if (parent) {
        parent.subcategories = parent.subcategories || [];
        parent.subcategories.push({ id: c.id, name: c.name, label: c.label });
      } else {
        roots.push(byId[c.id]);
      }
    });

    return roots;
  };

  const loadCategories = async () => {
    try {
      setCatLoading(true);
      const data = await getMenuCategories();
      const tree = buildCategoryTree(data);
      setCategories(tree);
      if (tree.length > 0) {
        if (!tree.find(c => c.name === selectedCategory)) {
          const first = tree[0];
          setSelectedCategory(first.name);
          setExpandedCategories(new Set([first.name]));
          setSelectedSubcategory(first?.subcategories?.[0]?.name || null);
        }
      } else {
        setSelectedCategory('');
        setSelectedSubcategory(null);
        setExpandedCategories(new Set());
      }
    } catch (e) {
      console.error(e);
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

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
    loadCategories();
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

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (categoryName: string, subcategory?: string) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategory(subcategory || null);
    // Auto-expand when selecting
    if (subcategory) {
      setExpandedCategories(prev => new Set([...prev, categoryName]));
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = menuItems.filter(item => {
      if (item.category !== selectedCategory) return false;
      if (selectedSubcategory && item.subcategory !== selectedSubcategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (item.name || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.sku || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
    return filtered;
  }, [menuItems, selectedCategory, selectedSubcategory, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredItems.forEach(item => {
      const groupKey = item.subcategory || 'Other';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleCategorySave = async () => {
    if (!categoryForm.name || !categoryForm.label) {
      showToast('Name and label are required', 'error');
      return;
    }
    try {
      const parentCat = categories.find(c => c.id === categoryForm.parentId || c.name === categoryForm.parentId);
      const parentKey = parentCat ? parentCat.id || null : null;
      if (categoryForm.id) {
        await updateMenuCategory(categoryForm.id, {
          name: categoryForm.name,
          label: categoryForm.label,
          parentId: parentKey,
        });
      } else {
        await createMenuCategory({
          name: categoryForm.name,
          label: categoryForm.label,
          parentId: parentKey,
          order: Date.now(),
        });
        if (parentCat) {
          setSelectedCategory(parentCat.name);
          setExpandedCategories(prev => new Set([...prev, parentCat.name]));
          setSelectedSubcategory(categoryForm.name);
        } else {
          setSelectedCategory(categoryForm.name);
          setSelectedSubcategory(null);
        }
      }
      setShowCategoryModal(false);
      setCategoryForm({ name: '', label: '', parentId: null });
      await loadCategories();
      showToast('Category saved successfully', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to save category', 'error');
    }
  };

  const handleCategoryDelete = async (catId?: string, catName?: string) => {
    if (!catId && !catName) return;
    const inUse = menuItems.some(item => item.category === catName || item.subcategory === catName);
    if (inUse) {
      showToast('Cannot delete: category in use by items', 'error');
      return;
    }
    if (catId && catName) {
      setDeleteCategoryConfirm({ id: catId, name: catName });
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryConfirm) return;
    try {
      await deleteMenuCategory(deleteCategoryConfirm.id);
      await loadCategories();
      showToast('Category deleted successfully', 'success');
      setDeleteCategoryConfirm(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to delete category', 'error');
    }
  };

  if (loading || catLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-8rem)] gap-0">
      {/* Left Sidebar - Categories */}
      <div className={`w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:w-0 overflow-hidden opacity-0 hidden' : 'md:w-64 opacity-100'}`}>
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 uppercase">Categories</h2>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-sm text-gray-500 mb-2">No categories yet</p>
                <p className="text-xs text-gray-400">Click "Add Category" below to create your first category</p>
              </div>
            ) : (
              categories.map((category) => {
                const isExpanded = expandedCategories.has(category.name);
                const isSelected = selectedCategory === category.name && !selectedSubcategory;
                const hasSubcategories = category.subcategories && category.subcategories.length > 0;

                return (
                  <div key={category.name} className="mb-1">
                    <div className="flex items-center group gap-1">
                      <button
                        onClick={() => hasSubcategories ? toggleCategory(category.name) : handleCategorySelect(category.name)}
                        className={`flex-1 flex items-center justify-between px-3 py-2 text-sm font-medium rounded transition-colors ${isSelected
                          ? 'bg-[#FF6A00] text-white'
                          : 'text-gray-700 hover:bg-orange-50'
                          }`}
                      >
                        <span className="uppercase text-xs font-semibold">{category.label}</span>
                        {hasSubcategories && (
                          isExpanded ?
                            <ChevronDownIcon className="h-4 w-4" /> :
                            <ChevronRightIcon className="h-4 w-4" />
                        )}
                      </button>
                      {!isReadOnly && (
                        <>
                          <button
                            onClick={() => {
                              setCategoryForm({ id: category.id, name: category.name, label: category.label, parentId: null });
                              setShowCategoryModal(true);
                            }}
                            className="p-1 text-[#FF6A00] opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit Category"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCategoryDelete(category.id, category.name)}
                            className="p-1 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Category"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCategoryForm({ id: undefined, name: '', label: '', parentId: category.id || category.name || null });
                              setShowCategoryModal(true);
                            }}
                            className="p-1 text-[#FF6A00] opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Add Subcategory"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                    {isExpanded && hasSubcategories && (
                      <div className="ml-3 mt-1 space-y-1">
                        {category.subcategories?.map((sub) => {
                          const isSubSelected = selectedCategory === category.name && selectedSubcategory === sub.name;
                          return (
                            <div key={sub.name} className="flex items-center group/sub gap-1">
                              <button
                                onClick={() => handleCategorySelect(category.name, sub.name)}
                                className={`flex-1 text-left px-3 py-1.5 text-xs rounded transition-colors ${isSubSelected
                                  ? 'bg-orange-50 text-[#FF6A00] font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                              >
                                {sub.label}
                              </button>
                              {!isReadOnly && (
                                <>
                                  <button
                                    onClick={() => {
                                      setCategoryForm({ id: sub.id, name: sub.name, label: sub.label, parentId: category.id || null });
                                      setShowCategoryModal(true);
                                    }}
                                    className="p-1 text-[#FF6A00] opacity-0 group-hover/sub:opacity-100 transition-opacity"
                                    title="Edit Subcategory"
                                  >
                                    <PencilSquareIcon className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleCategoryDelete(sub.id, sub.name)}
                                    className="p-1 text-red-600 opacity-0 group-hover/sub:opacity-100 transition-opacity"
                                    title="Delete Subcategory"
                                  >
                                    <XMarkIcon className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Add Category Button */}
        {!isReadOnly && (
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => {
                setCategoryForm({ id: undefined, name: '', label: '', parentId: null });
                setShowCategoryModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#FF6A00] border border-[#FF6A00] rounded hover:bg-orange-50 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Category
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        <div className="p-6 space-y-4 flex-1 flex flex-col">


          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Item Lookup</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
              {!isReadOnly && (
                <Link
                  href="/admin/menu/new"
                  className="inline-flex items-center rounded bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </Link>
              )}
            </div>
          </div>

          {/* Items Table */}
          {filteredItems.length === 0 ? (
            <div className="flex-1 bg-white border border-gray-200 rounded flex items-center justify-center">
              <div className="text-center py-12">
                <p className="text-lg font-medium text-gray-400">No Record Found!</p>
                <p className="text-sm text-gray-500 mt-2">Try adding items to this category</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white border border-gray-200 rounded overflow-hidden flex flex-col">
              <div className="hidden md:block overflow-auto flex-1">
                <table className="w-full">
                  <thead className="bg-orange-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tax Group</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Discount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Open Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {Object.entries(groupedItems).map(([subcategory, items]) => (
                      <React.Fragment key={subcategory}>
                        {subcategory !== 'Other' && (
                          <tr className="bg-gray-50">
                            <td colSpan={10} className="px-4 py-2 text-sm font-semibold text-gray-700">
                              {subcategory}
                            </td>
                          </tr>
                        )}
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => handleSelectItem(item.id)}
                                className="rounded border-gray-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 uppercase">{item.category.replace('_', ' ')}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.sku || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.taxGroup || 'VAT'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.hasDiscount || item.discountPercent ? 'Yes' : 'No'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.openPrice ? 'Yes' : 'No'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.cost ? item.cost.toFixed(2) : '0.00'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'
                                  }`}></span>
                                <Link
                                  href={`/admin/menu/edit/${item.id}`}
                                  className="text-[#FF6A00] hover:text-[#FF6A00]/80 transition-colors"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Link>
                                {!isReadOnly && (
                                  <button
                                    onClick={() => setDeleteConfirm(item.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
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
              <div className="md:hidden overflow-auto flex-1 p-3 pb-24 bg-gray-50/50">
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
                          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full z-10 ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>

                          {/* Image Placeholder / Content */}
                          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
                            <div className="text-gray-300 font-bold text-[10px] tracking-widest uppercase">Item</div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <div className="text-white font-bold text-lg leading-none drop-shadow-sm">${item.price.toFixed(0)}</div>
                            </div>
                          </div>

                          <div className="p-3 flex flex-col flex-1">
                            <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 mb-1">{item.name}</h3>
                            <p className="text-[10px] text-gray-500 mb-2">{item.sku}</p>

                            <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                              <Link
                                href={`/admin/menu/edit/${item.id}`}
                                className="flex-1 py-1.5 bg-orange-50 text-[#FF6A00] text-xs font-bold rounded text-center"
                              >
                                Edit
                              </Link>
                              {!isReadOnly && (
                                <button
                                  onClick={() => setDeleteConfirm(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500"
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
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            handleDelete(deleteConfirm);
          }
        }}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Category Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteCategoryConfirm}
        onClose={() => setDeleteCategoryConfirm(null)}
        onConfirm={confirmDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteCategoryConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-transparent" onClick={() => setShowCategoryModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 space-y-4 border border-gray-100" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)' }}>
            <h3 className="text-lg font-semibold text-gray-900">
              {categoryForm.id ? 'Edit ' : 'Add '}
              {categoryForm.parentId ? 'Subcategory' : 'Category'}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  value={categoryForm.label}
                  onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                  placeholder="e.g., BREAKFAST"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (unique key)</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                  placeholder="e.g., breakfast"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent (optional)</label>
                <select
                  value={categoryForm.parentId || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
                >
                  <option value="">Top-level Category</option>
                  {categories.map(c => (
                    <option key={c.id || c.name} value={c.id || c.name}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCategorySave}
                className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
