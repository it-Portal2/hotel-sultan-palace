"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { TrashIcon, PlusIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/context/ToastContext";
import {
  getFoodCategories,
  createFoodMenuItem,
  updateFoodMenuItem,
  FoodCategory,
  FoodMenuItem,
} from "@/lib/firestoreService";
import {
  getDefaultFoodMenuItem,
  getDefaultVariant,
  getDefaultGroup,
  getDefaultGroupOption,
  KITCHEN_SECTION_OPTIONS,
  ITEM_TYPE_OPTIONS,
  ALLERGEN_OPTIONS,
  ItemType,
  KitchenSection,
  MenuItemVariant,
  MenuItemGroup,
} from "@/lib/types/foodMenu";

interface FoodMenuFormProps {
  initialData?: FoodMenuItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FoodMenuForm({
  initialData,
  onSuccess,
  onCancel,
}: FoodMenuFormProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<FoodMenuItem>>(
    initialData || getDefaultFoodMenuItem(),
  );

  useEffect(() => {
    (async () => {
      try {
        const cats = await getFoodCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching categories", error);
        showToast("Failed to load categories", "error");
      }
    })();
  }, [showToast]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(getDefaultFoodMenuItem());
    }
  }, [initialData]);

  const updateField = <K extends keyof FoodMenuItem>(
    field: K,
    value: FoodMenuItem[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = "Item name is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    if (!formData.kitchenSection)
      newErrors.kitchenSection = "Kitchen station is required";
    if (!formData.sku?.trim()) newErrors.sku = "SKU code is required";

    if (formData.itemType === "simple" && !formData.basePrice) {
      newErrors.basePrice = "Base price is required for simple items";
    }

    if (formData.itemType === "variant_based") {
      if (!formData.variants?.length) {
        newErrors.variants = "Add at least one variant";
      } else {
        const invalidVariant = formData.variants.find(
          (v) => !v.name || v.price === undefined,
        );
        if (invalidVariant)
          newErrors.variants = "All variants need name and price";
      }
    }

    if (formData.itemType === "complex_combo") {
      if (!formData.groups?.length) {
        newErrors.groups = "Add at least one choice group";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Build a detailed error message listing all issues
      const errorMessages = Object.values(newErrors);
      const errorCount = errorMessages.length;
      const errorSummary =
        errorCount === 1
          ? errorMessages[0]
          : `${errorCount} fields need attention: ${errorMessages.slice(0, 3).join(", ")}${errorCount > 3 ? "..." : ""}`;

      showToast(errorSummary, "error");

      // Scroll to first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const fieldElement = document.querySelector(
        `[data-field="${firstErrorField}"]`,
      );
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return false;
    }
    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storageRef = ref(storage, `food-menu/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      updateField("images", [...(formData.images || []), url]);
      showToast("Image uploaded", "success");
    } catch (error) {
      showToast("Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    updateField(
      "images",
      (formData.images || []).filter((_, i) => i !== index),
    );
  };

  const addVariant = () => {
    const newVariant = getDefaultVariant();
    newVariant.sortOrder = (formData.variants?.length || 0) + 1;
    updateField("variants", [...(formData.variants || []), newVariant]);
  };

  const removeVariant = (index: number) => {
    updateField(
      "variants",
      (formData.variants || []).filter((_, i) => i !== index),
    );
  };

  const updateVariant = (
    index: number,
    field: keyof MenuItemVariant,
    value: any,
  ) => {
    const updated = [...(formData.variants || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField("variants", updated);
  };

  const addGroup = () => {
    updateField("groups", [...(formData.groups || []), getDefaultGroup()]);
  };

  const removeGroup = (index: number) => {
    updateField(
      "groups",
      (formData.groups || []).filter((_, i) => i !== index),
    );
  };

  const updateGroup = (
    index: number,
    field: keyof MenuItemGroup,
    value: any,
  ) => {
    const updated = [...(formData.groups || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField("groups", updated);
  };

  const addGroupOption = (groupIndex: number) => {
    const updated = [...(formData.groups || [])];
    updated[groupIndex].options = [
      ...updated[groupIndex].options,
      getDefaultGroupOption(),
    ];
    updateField("groups", updated);
  };

  const removeGroupOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...(formData.groups || [])];
    updated[groupIndex].options = updated[groupIndex].options.filter(
      (_, i) => i !== optionIndex,
    );
    updateField("groups", updated);
  };

  const updateGroupOption = (
    groupIndex: number,
    optionIndex: number,
    field: string,
    value: any,
  ) => {
    const updated = [...(formData.groups || [])];
    updated[groupIndex].options[optionIndex] = {
      ...updated[groupIndex].options[optionIndex],
      [field]: value,
    };
    updateField("groups", updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (initialData?.id) {
        await updateFoodMenuItem(initialData.id, formData);
        showToast("Item updated successfully", "success");
      } else {
        await createFoodMenuItem(formData);
        showToast("Item created successfully", "success");
      }
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save item";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const activeCategories = categories.filter((c) => c.isActive);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      {/* SECTION: Basic Information */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Basic Information
        </h3>

        <div className="space-y-4">
          <div data-field="name">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., Seafood Soup"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 ${errors.name ? "border-red-500" : "border-gray-300"}`}
            />
            <p className="text-xs text-gray-500 mt-1">Name shown on menu</p>
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Ingredients or details shown to customers"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingredients or details shown to customers
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div data-field="sku">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                SKU Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sku || ""}
                onChange={(e) => updateField("sku", e.target.value)}
                placeholder="e.g., SFS008"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 ${errors.sku ? "border-red-500" : "border-gray-300"}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique stock code for inventory
              </p>
              {errors.sku && (
                <p className="text-xs text-red-500 mt-1">{errors.sku}</p>
              )}
            </div>
            <div data-field="kitchenSection">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Kitchen Station <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.kitchenSection || "continental"}
                onChange={(e) =>
                  updateField(
                    "kitchenSection",
                    e.target.value as KitchenSection,
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 ${errors.kitchenSection ? "border-red-500" : "border-gray-300"}`}
              >
                {KITCHEN_SECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Which kitchen area prepares this
              </p>
              {errors.kitchenSection && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.kitchenSection}
                </p>
              )}
            </div>
          </div>

          <div data-field="categoryId">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.categoryId || ""}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 ${errors.categoryId ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Select category...</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentCategoryId ? "└ " : ""}
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Which menu category this item belongs to
            </p>
            {errors.categoryId && (
              <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: Item Type & Pricing */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Item Type & Pricing
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Item Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ITEM_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.itemType === opt.value
                      ? "border-[#FF6A00] bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="itemType"
                    value={opt.value}
                    checked={formData.itemType === opt.value}
                    onChange={() => updateField("itemType", opt.value)}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">{opt.label}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {opt.description}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Simple = one price, Variant = customer picks size/flavor, Combo =
              multiple choices
            </p>
          </div>

          {formData.itemType === "simple" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Base Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.basePrice ?? ""}
                onChange={(e) =>
                  updateField("basePrice", parseFloat(e.target.value) || null)
                }
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 font-mono text-lg ${errors.basePrice ? "border-red-500" : "border-gray-300"}`}
              />
              <p className="text-xs text-gray-500 mt-1">Price before tax</p>
              {errors.basePrice && (
                <p className="text-xs text-red-500 mt-1">{errors.basePrice}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency || "USD"}
                onChange={(e) => updateField("currency", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50"
              >
                <option value="USD">USD</option>
                <option value="TZS">TZS</option>
                <option value="EUR">EUR</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Payment currency</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.taxPercent ?? 15}
                onChange={(e) =>
                  updateField("taxPercent", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50"
              />
              <p className="text-xs text-gray-500 mt-1">
                VAT percentage to add
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Variants (conditional) */}
      {formData.itemType === "variant_based" && (
        <div className="border-b pb-6" data-field="variants">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            Variants
            {errors.variants && (
              <span className="text-red-500 text-xs font-normal ml-2">
                {errors.variants}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Different options customer can choose (e.g., Vanilla, Chocolate)
          </p>

          <div className="space-y-3">
            {formData.variants?.map((variant, idx) => (
              <div
                key={variant.id}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
              >
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => updateVariant(idx, "name", e.target.value)}
                  placeholder="Variant name (e.g., Large)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(idx, "price", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Price"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={variant.isAvailable}
                    onChange={(e) =>
                      updateVariant(idx, "isAvailable", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  Available
                </label>
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-2 text-[#FF6A00] font-medium text-sm hover:underline"
            >
              <PlusIcon className="h-4 w-4" /> Add Variant
            </button>
          </div>
        </div>
      )}

      {/* SECTION: Choice Groups (conditional) */}
      {formData.itemType === "complex_combo" && (
        <div className="border-b pb-6" data-field="groups">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            Choice Groups
            {errors.groups && (
              <span className="text-red-500 text-xs font-normal ml-2">
                {errors.groups}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Groups of options customer must/can select from (e.g., "Choose Your
            Egg")
          </p>

          <div className="space-y-4">
            {formData.groups?.map((group, gIdx) => (
              <div
                key={gIdx}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    value={group.groupName}
                    onChange={(e) =>
                      updateGroup(gIdx, "groupName", e.target.value)
                    }
                    placeholder="Group Name (e.g., Choose Your Egg)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => removeGroup(gIdx)}
                    className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex gap-4 mb-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={group.required}
                      onChange={(e) =>
                        updateGroup(gIdx, "required", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    Required
                  </label>
                  <label className="flex items-center gap-1">
                    Min:{" "}
                    <input
                      type="number"
                      min="0"
                      value={group.minSelect}
                      onChange={(e) =>
                        updateGroup(
                          gIdx,
                          "minSelect",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-12 px-1 py-0.5 border rounded"
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Max:{" "}
                    <input
                      type="number"
                      min="0"
                      value={group.maxSelect ?? ""}
                      onChange={(e) =>
                        updateGroup(
                          gIdx,
                          "maxSelect",
                          parseInt(e.target.value) || null,
                        )
                      }
                      className="w-12 px-1 py-0.5 border rounded"
                      placeholder="∞"
                    />
                  </label>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-purple-300">
                  {group.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className="flex items-center gap-2 bg-white p-2 rounded"
                    >
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) =>
                          updateGroupOption(gIdx, oIdx, "name", e.target.value)
                        }
                        placeholder="Option name"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={opt.priceMod}
                        onChange={(e) =>
                          updateGroupOption(
                            gIdx,
                            oIdx,
                            "priceMod",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="+$"
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => removeGroupOption(gIdx, oIdx)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addGroupOption(gIdx)}
                    className="text-xs text-purple-600 font-medium hover:underline flex items-center gap-1"
                  >
                    <PlusIcon className="h-3 w-3" /> Add Option
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addGroup}
              className="flex items-center gap-2 text-purple-600 font-medium text-sm hover:underline"
            >
              <PlusIcon className="h-4 w-4" /> Add Choice Group
            </button>
          </div>
        </div>
      )}

      {/* SECTION: Dietary Information */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Dietary Information
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.isVeg || false}
              onChange={(e) => updateField("isVeg", e.target.checked)}
              className="w-4 h-4 text-green-600"
            />
            <div>
              <span className="text-sm font-medium">Vegetarian</span>
              <p className="text-[10px] text-gray-500">No meat or fish</p>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.isVegan || false}
              onChange={(e) => updateField("isVegan", e.target.checked)}
              className="w-4 h-4 text-green-600"
            />
            <div>
              <span className="text-sm font-medium">Vegan</span>
              <p className="text-[10px] text-gray-500">No animal products</p>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.isHalal || false}
              onChange={(e) => updateField("isHalal", e.target.checked)}
              className="w-4 h-4 text-green-600"
            />
            <div>
              <span className="text-sm font-medium">Halal</span>
              <p className="text-[10px] text-gray-500">Halal certified</p>
            </div>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Allergens
          </label>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((allergen) => (
              <label
                key={allergen}
                className={`flex items-center gap-1 px-3 py-1.5 border rounded-full cursor-pointer text-xs font-medium transition-colors ${
                  formData.allergens?.includes(allergen)
                    ? "bg-red-100 border-red-300 text-red-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.allergens?.includes(allergen) || false}
                  onChange={(e) => {
                    const current = formData.allergens || [];
                    updateField(
                      "allergens",
                      e.target.checked
                        ? [...current, allergen]
                        : current.filter((a) => a !== allergen),
                    );
                  }}
                  className="sr-only"
                />
                {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select all allergens present in this item
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Served With
          </label>
          <input
            type="text"
            value={formData.servedWith || ""}
            onChange={(e) => updateField("servedWith", e.target.value)}
            placeholder="e.g., Served with fries & salad"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50"
          />
          <p className="text-xs text-gray-500 mt-1">Fixed accompaniments</p>
        </div>
      </div>

      {/* SECTION: Night Menu */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Night Menu
        </h3>

        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.nightMenu?.isAvailable || false}
              onChange={(e) =>
                updateField("nightMenu", {
                  ...formData.nightMenu!,
                  isAvailable: e.target.checked,
                })
              }
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors ${formData.nightMenu?.isAvailable ? "bg-indigo-500" : "bg-gray-300"}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.nightMenu?.isAvailable ? "translate-x-5" : ""}`}
              />
            </div>
          </div>
          <div>
            <span className="font-semibold text-gray-700">
              Available on Night Menu
            </span>
            <p className="text-xs text-gray-500">
              Show this item on late-night menu
            </p>
          </div>
        </label>

        {formData.nightMenu?.isAvailable && (
          <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-indigo-200">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Night Menu Item ID
              </label>
              <input
                type="text"
                value={formData.nightMenu?.nightItemId || ""}
                onChange={(e) =>
                  updateField("nightMenu", {
                    ...formData.nightMenu!,
                    nightItemId: e.target.value,
                  })
                }
                placeholder="Optional: Link to different item"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Night Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.nightMenu?.overridePrice ?? ""}
                onChange={(e) =>
                  updateField("nightMenu", {
                    ...formData.nightMenu!,
                    overridePrice: parseFloat(e.target.value) || null,
                  })
                }
                placeholder="Different price for night"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION: Status & Visibility */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Status & Visibility
        </h3>

        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.isAvailable ?? true}
                onChange={(e) => updateField("isAvailable", e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors ${formData.isAvailable ? "bg-green-500" : "bg-gray-300"}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isAvailable ? "translate-x-5" : ""}`}
                />
              </div>
            </div>
            <div>
              <span className="font-semibold text-gray-700">
                Available for Order
              </span>
              <p className="text-xs text-gray-500">
                Turn off to hide from menu
              </p>
            </div>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPopular || false}
              onChange={(e) => updateField("isPopular", e.target.checked)}
              className="w-5 h-5 text-[#FF6A00] rounded"
            />
            <div>
              <span className="font-medium text-gray-700">Mark as Popular</span>
              <p className="text-xs text-gray-500">Show "Popular" badge</p>
            </div>
          </label>
        </div>
      </div>

      {/* SECTION: Item Photos */}
      <div className="border-b pb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Item Photos
        </h3>

        <div className="flex flex-wrap gap-3 mb-4">
          {formData.images?.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`Item ${idx + 1}`}
                className="w-24 h-24 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6A00] hover:bg-orange-50 transition-colors">
            <PhotoIcon className="h-6 w-6 text-gray-400" />
            <span className="text-xs text-gray-500 mt-1">
              {uploading ? "Uploading..." : "Add Photo"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500">Upload photos of this dish</p>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 disabled:opacity-50 font-bold shadow-md transition-colors"
        >
          {loading ? "Saving..." : initialData ? "Update Item" : "Create Item"}
        </button>
      </div>
    </form>
  );
}
