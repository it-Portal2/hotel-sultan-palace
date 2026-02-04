"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  XMarkIcon,
  TagIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import {
  getFoodCategories,
  getFoodMenuItems,
  createFoodCategory,
  updateFoodCategory,
  deleteFoodCategory,
  deleteFoodMenuItem,
  FoodCategory,
  FoodMenuItem,
} from "@/lib/firestoreService";
// import {
//   getDefaultFoodCategory,
//   AVAILABILITY_TYPE_OPTIONS,
//   AvailabilityType,
//   CategoryType,
// } from "@/lib/types/foodMenu";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Drawer from "@/components/ui/Drawer";
import FoodMenuForm from "@/components/admin/menu/FoodMenuForm";
import FoodCategoryForm from "@/components/admin/menu/FoodCategoryForm";
import { useAdminRole } from "@/context/AdminRoleContext";
import { useToast } from "@/context/ToastContext";

export default function AdminMenuPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();

  const [items, setItems] = useState<FoodMenuItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("All");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<FoodCategory | null>(
    null,
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodMenuItem | null>(null);

  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(
    null,
  );
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuData, catData] = await Promise.all([
        getFoodMenuItems(),
        getFoodCategories(),
      ]);
      setItems(menuData);
      setCategories(catData);
    } catch (error) {
      console.error("Error fetching menu data:", error);
      showToast("Failed to load menu data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteFoodMenuItem(deleteConfirm);
      setItems(items.filter((item) => item.id !== deleteConfirm));
      setDeleteConfirm(null);
      showToast("Item deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting menu item:", error);
      showToast("Failed to delete item", "error");
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setIsDrawerOpen(true);
  };

  const handleEditClick = (item: FoodMenuItem) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setIsCategoryDrawerOpen(true);
  };

  const handleEditCategoryClick = (cat: FoodCategory) => {
    setEditingCategory(cat);
    setIsCategoryDrawerOpen(true);
  };

  const handleCategorySubmit = async (data: Partial<FoodCategory>) => {
    setIsCategorySubmitting(true);
    try {
      if (editingCategory) {
        await updateFoodCategory(editingCategory.id, data);
        showToast("Category updated successfully", "success");
      } else {
        await createFoodCategory(data);
        showToast("Category created successfully", "success");
      }
      // Refetch data FIRST, then close the drawer
      await fetchData();
      setEditingCategory(null);
      setIsCategoryDrawerOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save category";
      showToast(message, "error");
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const executeDeleteCategory = async () => {
    if (!deleteCatConfirm) return;
    try {
      await deleteFoodCategory(deleteCatConfirm.id);
      fetchData();
      showToast("Category deleted", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete category";
      showToast(message, "error");
    } finally {
      setDeleteCatConfirm(null);
    }
  };

  const filteredItems = useMemo(() => {
    // Get child category IDs for the selected category
    const getChildIds = (parentId: string): string[] => {
      return categories
        .filter((c) => c.parentCategoryId === parentId)
        .map((c) => c.id);
    };

    const childIds =
      selectedCategoryId !== "All" ? getChildIds(selectedCategoryId) : [];
    const allCategoryIds =
      selectedCategoryId !== "All" ? [selectedCategoryId, ...childIds] : [];

    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategoryId === "All" ||
        allCategoryIds.includes(item.categoryId);
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategoryId, categories]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, FoodMenuItem[]> = {};

    filteredItems.forEach((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      const catName = cat?.name || "Uncategorized";
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(item);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });

    return sortedKeys.reduce(
      (acc, key) => {
        acc[key] = groups[key];
        return acc;
      },
      {} as Record<string, FoodMenuItem[]>,
    );
  }, [filteredItems, categories]);

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const getItemPrice = (item: FoodMenuItem): string => {
    if (item.itemType === "variant_based" && item.variants?.length) {
      const prices = item.variants.map((v) => v.price).filter((p) => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max
          ? min.toFixed(2)
          : `${min.toFixed(2)} - ${max.toFixed(2)}`;
      }
    }
    return item.basePrice?.toFixed(2) || "-";
  };

  // Get all child category IDs for a parent category
  const getChildCategoryIds = (parentId: string): string[] => {
    return categories
      .filter((c) => c.parentCategoryId === parentId)
      .map((c) => c.id);
  };

  // Count items in a category INCLUDING child categories
  const getItemCountForCategory = (categoryId: string): number => {
    const childIds = getChildCategoryIds(categoryId);
    const allCategoryIds = [categoryId, ...childIds];
    return items.filter((item) => allCategoryIds.includes(item.categoryId))
      .length;
  };

  // Get items for a category INCLUDING child categories
  const getItemsForCategory = (categoryId: string): FoodMenuItem[] => {
    const childIds = getChildCategoryIds(categoryId);
    const allCategoryIds = [categoryId, ...childIds];
    return items.filter((item) => allCategoryIds.includes(item.categoryId));
  };

  const parentCategories = categories.filter(
    (c) => c.isParentCategory || !c.parentCategoryId,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6A00]"></div>
          <p className="text-gray-500 text-sm font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:flex h-full shadow-xl md:shadow-none flex-shrink-0`}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
            Categories
          </h2>
          <div className="flex items-center gap-1">
            {!isReadOnly && (
              <button
                onClick={handleAddCategoryClick}
                className="text-[#FF6A00] hover:bg-[#FF6A00]/10 p-1.5 rounded-md transition-colors"
                title="Add Category"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            onClick={() => setSelectedCategoryId("All")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
              selectedCategoryId === "All"
                ? "bg-[#FF6A00]/10 text-[#FF6A00]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            All Items
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${selectedCategoryId === "All" ? "bg-[#FF6A00]/20 text-[#FF6A00]" : "bg-gray-100 text-gray-500"}`}
            >
              {items.length}
            </span>
          </button>

          {parentCategories.map((cat) => {
            const itemCount = getItemCountForCategory(cat.id);
            const isSelected = selectedCategoryId === cat.id;

            return (
              <div key={cat.id} className="group relative">
                <button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                    isSelected
                      ? "bg-[#FF6A00]/10 text-[#FF6A00]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {cat.name}
                    {!cat.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded">
                        Hidden
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-[#FF6A00]/20 text-[#FF6A00]" : "bg-gray-100 text-gray-500"}`}
                    >
                      {itemCount}
                    </span>
                    {isSelected && <ChevronRightIcon className="h-4 w-4" />}
                  </div>
                </button>
                {!isReadOnly && (
                  <div className="absolute right-1 top-1.5 hidden group-hover:flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategoryClick(cat);
                      }}
                      className="p-1 text-gray-300 hover:text-[#FF6A00] bg-white shadow-sm rounded border border-gray-100"
                      title="Edit Category"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteCatConfirm(cat);
                      }}
                      className="p-1 text-gray-300 hover:text-red-500 bg-white shadow-sm rounded border border-gray-100"
                      title="Delete Category"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between flex-shrink-0 z-10 w-full">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg -ml-2"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                Menu Items
              </h1>
              <p className="text-gray-500 text-xs md:text-sm font-medium mt-1">
                Manage your food and beverage offerings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, description, SKU..."
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
              <h3 className="text-lg font-medium text-gray-900">
                No items found
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">
                Try adjusting your search or category filter, or create a new
                item.
              </p>
              <button
                onClick={handleAddClick}
                className="mt-6 text-[#FF6A00] font-medium hover:underline"
              >
                Create new item
              </button>
            </div>
          ) : (
            <div className="bg-white shadow-lg border border-gray-200 overflow-hidden rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px] md:min-w-0">
                  <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Item Name
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Category
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        SKU
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Type
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Kitchen
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Price
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(groupedItems).map(
                      ([categoryName, categoryItems]) => (
                        <React.Fragment key={categoryName}>
                          {categoryName !== "Uncategorized" && (
                            <tr className="bg-gray-50/30">
                              <td
                                colSpan={7}
                                className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"
                              >
                                <span className="w-1 h-3 bg-[#FF6A00] rounded-full"></span>
                                {categoryName}
                              </td>
                            </tr>
                          )}
                          {categoryItems.map((item) => (
                            <tr
                              key={item.id}
                              className="group hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                  <div className="flex gap-1 mt-0.5">
                                    {item.hasVariants && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                        VARIANTS
                                      </span>
                                    )}
                                    {item.hasGroups && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                        COMBO
                                      </span>
                                    )}
                                    {item.isPopular && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                        POPULAR
                                      </span>
                                    )}
                                    {item.isVeg && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                        VEG
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 uppercase text-xs font-medium tracking-wide">
                                {getCategoryName(item.categoryId)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                                {item.sku || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.itemType === "simple"
                                      ? "bg-gray-100 text-gray-600"
                                      : item.itemType === "variant_based"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {item.itemType === "simple"
                                    ? "SIMPLE"
                                    : item.itemType === "variant_based"
                                      ? "VARIANT"
                                      : "COMBO"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                                {item.kitchenSection?.replace("_", " ")}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-gray-900 font-mono">
                                ${getItemPrice(item)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={`inline-block w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${item.isAvailable ? "bg-green-500" : "bg-red-500"}`}
                                    title={
                                      item.isAvailable
                                        ? "Available"
                                        : "Unavailable"
                                    }
                                  ></span>
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
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Delete Item Modal */}
        <ConfirmationModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Menu Item"
          message="Are you sure you want to delete this menu item? This action cannot be undone."
        />

        {/* Delete Category Modal */}
        <ConfirmationModal
          isOpen={!!deleteCatConfirm}
          onClose={() => setDeleteCatConfirm(null)}
          onConfirm={executeDeleteCategory}
          title="Delete Category"
          message={`Are you sure you want to delete "${deleteCatConfirm?.name}"? This will fail if there are items in this category.`}
        />

        {/* Menu Item Drawer */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={editingItem ? "Edit Menu Item" : "Add New Item"}
          size="lg"
        >
          <FoodMenuForm
            initialData={editingItem}
            onSuccess={() => {
              setIsDrawerOpen(false);
              fetchData();
            }}
            onCancel={() => setIsDrawerOpen(false)}
          />
        </Drawer>

        {/* Category Drawer */}
        <Drawer
          isOpen={isCategoryDrawerOpen}
          onClose={() => setIsCategoryDrawerOpen(false)}
          title={editingCategory ? "Edit Category" : "Add Category"}
          size="lg"
        >
          <FoodCategoryForm
            initialData={editingCategory}
            onSubmit={handleCategorySubmit}
            onCancel={() => setIsCategoryDrawerOpen(false)}
            isSubmitting={isCategorySubmitting}
          />
        </Drawer>
      </main>
    </div>
  );
}
