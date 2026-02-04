"use client";

import React, { useState, useEffect } from "react";
import {
  FoodCategory,
  AvailabilityType,
  CategoryType,
  getDefaultFoodCategory,
  AVAILABILITY_TYPE_OPTIONS,
} from "@/lib/types/foodMenu";
import { getFoodCategories } from "@/lib/firestoreService";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { TrashIcon, PhotoIcon } from "@heroicons/react/24/outline";

interface FoodCategoryFormProps {
  initialData?: FoodCategory | null;
  onSubmit: (data: Partial<FoodCategory>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function FoodCategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FoodCategoryFormProps) {
  const [formData, setFormData] = useState<Partial<FoodCategory>>(
    initialData || getDefaultFoodCategory(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parentCategories, setParentCategories] = useState<FoodCategory[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storageRef = ref(
        storage,
        `food-categories/${Date.now()}_${safeName}`,
      );
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      updateField("imageUrl", url);

      if (typeof window !== "undefined") {
        const event = new CustomEvent("showToast", {
          detail: { message: "Image uploaded successfully", type: "success" },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      if (typeof window !== "undefined") {
        const event = new CustomEvent("showToast", {
          detail: { message: "Failed to upload image", type: "error" },
        });
        window.dispatchEvent(event);
      }
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const loadParentCategories = async () => {
      const cats = await getFoodCategories();
      const parents = cats.filter(
        (c) => c.isParentCategory || !c.parentCategoryId,
      );
      setParentCategories(parents.filter((c) => c.id !== initialData?.id));
    };
    loadParentCategories();
  }, [initialData?.id]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Category name is required";
    }
    if (formData.sortOrder === undefined || formData.sortOrder < 0) {
      newErrors.sortOrder = "Display order must be 0 or greater";
    }
    if (!formData.type) {
      newErrors.type = "Category type is required";
    }
    if (!formData.availabilityType) {
      newErrors.availabilityType = "Availability is required";
    }
    if (formData.availabilityType === "custom") {
      if (!formData.availableHoursStart) {
        newErrors.availableHoursStart =
          "Start time is required for custom hours";
      }
      if (!formData.availableHoursEnd) {
        newErrors.availableHoursEnd = "End time is required for custom hours";
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

      // Show specific error in toast
      if (typeof window !== "undefined") {
        const event = new CustomEvent("showToast", {
          detail: { message: errorSummary, type: "error" },
        });
        window.dispatchEvent(event);
      }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const updateField = <K extends keyof FoodCategory>(
    field: K,
    value: FoodCategory[K],
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b pb-6 mb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Basic Information
        </h3>

        <div className="space-y-4">
          <div data-field="name">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. BREAKFAST MENU"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Display name shown to customers
            </p>
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div data-field="sortOrder">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Display Order <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.sortOrder ?? 1}
              onChange={(e) =>
                updateField("sortOrder", parseInt(e.target.value) || 0)
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 ${
                errors.sortOrder ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first. Use 1, 2, 3...
            </p>
            {errors.sortOrder && (
              <p className="text-xs text-red-500 mt-1">{errors.sortOrder}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Parent Category
            </label>
            <select
              value={formData.parentCategoryId || ""}
              onChange={(e) => updateField("parentCategoryId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50"
            >
              <option value="">None (Top Level)</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for standalone, or select parent for sub-category
            </p>
          </div>
        </div>
      </div>

      <div className="border-b pb-6 mb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Type & Availability
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div data-field="type">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {(["food", "bar"] as CategoryType[]).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={formData.type === type}
                    onChange={() => updateField("type", type)}
                    className="w-4 h-4 text-[#FF6A00]"
                  />
                  <span className="text-sm capitalize">{type}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Food for meals, Bar for drinks
            </p>
            {errors.type && (
              <p className="text-xs text-red-500 mt-1">{errors.type}</p>
            )}
          </div>

          <div data-field="availabilityType">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              When Available <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.availabilityType || "all_day"}
              onChange={(e) =>
                updateField(
                  "availabilityType",
                  e.target.value as AvailabilityType,
                )
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 ${
                errors.availabilityType ? "border-red-500" : "border-gray-300"
              }`}
            >
              {AVAILABILITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.availabilityType && (
              <p className="text-xs text-red-500 mt-1">
                {errors.availabilityType}
              </p>
            )}
          </div>
        </div>

        {formData.availabilityType === "custom" && (
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Available From <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.availableHoursStart || ""}
                onChange={(e) =>
                  updateField("availableHoursStart", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 ${
                  errors.availableHoursStart
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.availableHoursStart && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.availableHoursStart}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Available Until <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.availableHoursEnd || ""}
                onChange={(e) =>
                  updateField("availableHoursEnd", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 ${
                  errors.availableHoursEnd
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.availableHoursEnd && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.availableHoursEnd}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-b pb-6 mb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Additional Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Optional notes about this category"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional notes about this category
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category Image
            </label>

            {!formData.imageUrl ? (
              <div className="mt-1">
                <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-[#FF6A00] focus:outline-none hover:bg-gray-50">
                  <span className="flex items-center space-x-2">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF6A00]"></div>
                    ) : (
                      <PhotoIcon className="w-6 h-6 text-gray-600" />
                    )}
                    <span className="font-medium text-gray-600">
                      {uploading
                        ? "Uploading..."
                        : "Drop image or click to upload"}
                    </span>
                  </span>
                  <input
                    type="file"
                    name="file_upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            ) : (
              <div className="relative mt-2 inline-block">
                <img
                  src={formData.imageUrl}
                  alt="Category"
                  className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => updateField("imageUrl", "")}
                  className="absolute -top-2 -right-2 p-1 bg-white rounded-full text-red-500 shadow-md hover:bg-red-50 border border-gray-200"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-b pb-6 mb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Status
        </h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.isActive ?? true}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                formData.isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  formData.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Active</span>
            <p className="text-xs text-gray-500">
              Turn off to hide this category from menus
            </p>
          </div>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update Category"
              : "Create Category"}
        </button>
      </div>
    </form>
  );
}
