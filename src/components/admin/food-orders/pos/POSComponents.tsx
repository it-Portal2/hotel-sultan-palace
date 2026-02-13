"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Booking, RoomTypeData } from "@/lib/firestoreService";
import {
  TrashIcon,
  ShoppingCartIcon,
  UserIcon,
  MapPinIcon,
  XMarkIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  MinusIcon,
  PlusIcon,
  CakeIcon,
  BeakerIcon,
  FireIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

// ================= TYPES =================
export interface POSVariant {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface POSGroupOption {
  name: string;
  priceMod: number;
  isAvailable?: boolean;
}

export interface POSGroup {
  groupName: string;
  required: boolean;
  minSelect: number;
  maxSelect: number | null;
  options: POSGroupOption[];
}

export interface POSItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  images?: string[]; // Multiple images for carousel
  category?: string;
  station?: string;
  kitchenSection?: string;
  sku?: string; // Stock Keeping Unit from menu item
  // Variant support
  itemType?: "simple" | "variant_based" | "complex_combo";
  hasVariants?: boolean;
  variants?: POSVariant[];
  hasGroups?: boolean;
  groups?: POSGroup[];
}

export interface CartItem extends POSItem {
  quantity: number;
  notes?: string;
  customPrice?: number; // Override price
  // Selected variant/options
  selectedVariant?: POSVariant;
  selectedModifiers?: { name: string; price: number }[];
}

// ================= ITEM DETAIL MODAL =================
interface ItemDetailModalProps {
  item: POSItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: POSItem,
    selectedVariant?: POSVariant,
    selectedModifiers?: { name: string; price: number }[],
  ) => void;
}

function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ItemDetailModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<POSVariant | null>(
    null,
  );
  const [selectedModifiers, setSelectedModifiers] = useState<
    { name: string; price: number }[]
  >([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setSelectedVariant(null);
      setSelectedModifiers([]);
      setCurrentImageIndex(0);
      setQuantity(1);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const isVariantBased =
    item.itemType === "variant_based" &&
    item.hasVariants &&
    item.variants &&
    item.variants.length > 0;
  const hasGroups =
    item.itemType === "complex_combo" &&
    item.hasGroups &&
    item.groups &&
    item.groups.length > 0;
  const images =
    item.images && item.images.length > 0
      ? item.images
      : item.image
        ? [item.image]
        : [];

  // Calculate running total
  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
  const itemTotal = (basePrice + modifiersTotal) * quantity;

  // Check if can add (variant required for variant_based)
  const canAdd = isVariantBased ? !!selectedVariant : true;

  const toggleModifier = (name: string, price: number) => {
    setSelectedModifiers((prev) => {
      const exists = prev.find((m) => m.name === name);
      if (exists) {
        return prev.filter((m) => m.name !== name);
      }
      return [...prev, { name, price }];
    });
  };

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(
        item,
        selectedVariant || undefined,
        selectedModifiers.length > 0 ? selectedModifiers : undefined,
      );
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {item.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Image Carousel */}
            {images.length > 0 && (
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={images[currentImageIndex] || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-56 sm:h-80 object-cover"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? "w-8 bg-[#FF6A00]"
                            : "w-2 bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Item Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[#FF6A00]">
                    {item.category}
                  </p>
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                    {item.description || "No description available"}
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold text-[#FF6A00]">
                {isVariantBased && item.variants && item.variants.length > 0
                  ? (() => {
                      const prices = item.variants
                        .filter((v) => v.isAvailable)
                        .map((v) => v.price)
                        .sort((a, b) => a - b);
                      if (prices.length === 0) return "N/A";
                      if (prices.length === 1)
                        return `$${prices[0].toFixed(2)}`;
                      return `$${prices[0].toFixed(2)} - $${prices[prices.length - 1].toFixed(2)}`;
                    })()
                  : `$${item.price.toFixed(2)}`}
              </div>
            </div>

            {/* Variant Selection */}
            {isVariantBased && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">Select Size/Type</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Required
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {item
                    .variants!.filter((v) => v.isAvailable)
                    .map((variant) => (
                      <label
                        key={variant.id}
                        className={`relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedVariant?.id === variant.id
                            ? "border-[#FF6A00] bg-orange-50"
                            : "border-gray-200 hover:border-gray-300 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="radio"
                            name="variant"
                            checked={selectedVariant?.id === variant.id}
                            onChange={() => setSelectedVariant(variant)}
                            className="w-5 h-5 text-[#FF6A00] cursor-pointer"
                          />
                          <span className="font-medium text-gray-900">
                            {variant.name}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">
                          ${variant.price.toFixed(2)}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Option Groups */}
            {hasGroups &&
              item.groups!.map((group) => (
                <div key={group.groupName} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">
                      {group.groupName}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        group.required
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {group.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {group.options
                      .filter((o) => o.isAvailable !== false)
                      .map((option) => {
                        const isSelected = selectedModifiers.some(
                          (m) => m.name === option.name,
                        );
                        return (
                          <label
                            key={option.name}
                            className={`relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "border-[#FF6A00] bg-orange-50"
                                : "border-gray-200 hover:border-gray-300 bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleModifier(option.name, option.priceMod)
                                }
                                className="w-5 h-5 text-[#FF6A00] rounded cursor-pointer"
                              />
                              <span className="font-medium text-gray-900">
                                {option.name}
                              </span>
                            </div>
                            {option.priceMod !== 0 && (
                              <span className="font-medium text-gray-700">
                                {option.priceMod > 0 ? "+" : ""}$
                                {option.priceMod.toFixed(2)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>
              ))}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Quantity</h3>
              <div className="flex items-center gap-3 bg-gray-100 rounded-xl w-fit px-4 py-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
                <span className="w-8 text-center font-bold text-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - CTA with Total */}
        <div className="sticky bottom-0 p-4 sm:p-6 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-[#FF6A00]">
                ${itemTotal.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className={`w-full py-4 font-bold text-white rounded-xl transition-all text-lg ${
              canAdd
                ? "bg-[#FF6A00] hover:bg-[#E55A00] active:scale-95"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {canAdd ? "Add to Order" : "Select Options"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= EDIT CART ITEM MODAL =================
interface EditCartItemModalProps {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    itemId: string,
    updates: { quantity?: number; notes?: string; customPrice?: number },
  ) => void;
}

function EditCartItemModal({
  item,
  isOpen,
  onClose,
  onUpdate,
}: EditCartItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [customPrice, setCustomPrice] = useState(0);

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setNotes(item.notes || "");
      setCustomPrice(item.customPrice ?? item.price);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    onUpdate(item.id, { quantity, notes, customPrice });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit Item</h3>
            <p className="text-sm text-gray-600 mt-1">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Quantity Control */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-bold"
              >
                <MinusIcon className="h-5 w-5" />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-bold focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-bold"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              Special Instructions (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., no onions, extra spicy..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          {/* Custom Price */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              Price Per Unit
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-600 font-bold">
                $
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={customPrice}
                onChange={(e) =>
                  setCustomPrice(parseFloat(e.target.value) || 0)
                }
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100 font-bold"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Unit Price:</span>
              <span className="font-bold text-gray-900">
                ${customPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-bold text-gray-900">{quantity}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-bold text-gray-900">Subtotal:</span>
              <span className="text-lg font-bold text-[#FF6A00]">
                ${(customPrice * quantity).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-900 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-[#FF6A00] text-white rounded-xl font-bold hover:bg-[#E55A00] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= VALIDATION HELPERS =================
const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isValidPhone = (s: string) =>
  /^\+?[\d\s-]{10,}$/.test(s.replace(/\s/g, ""));

// ================= CART SIDEBAR =================
interface POSCartProps {
  cart: CartItem[];
  onRemove: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: { quantity?: number }) => void;
  onSubmit: () => void;
  subtotal: number;
  taxAmount: number;
  taxType: "percentage" | "fixed";
  setTaxType: (val: "percentage" | "fixed") => void;
  taxValue: number;
  setTaxValue: (val: number) => void;
  total: number;
  isSubmitting: boolean;
  guestName: string;
  setGuestName: (val: string) => void;
  guestEmail: string;
  setGuestEmail: (val: string) => void;
  tableNumber: string;
  setTableNumber: (val: string) => void;
  roomName: string;
  setRoomName: (val: string) => void;
  waiterName: string;
  setWaiterName: (val: string) => void;
  preparedBy: string;
  setPreparedBy: (val: string) => void;
  printedBy: string;
  setPrintedBy: (val: string) => void;
  roomTypes: RoomTypeData[];
  activeGuests: Booking[];
  deliveryLocation: string;
  setDeliveryLocation: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  // New props for Urgent Order
  isUrgent?: boolean;
  onSetUrgent?: (val: boolean) => void;
  paymentStatus: string;
  setPaymentStatus: (val: string) => void;
  paidAmount: number;
  setPaidAmount: (val: number) => void;
  prepTime: number;
  setPrepTime: (val: number) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  validationErrors: Record<string, string>;
  setValidationErrors: (val: Record<string, string>) => void;
  discountType: "percentage" | "fixed";
  setDiscountType: (val: "percentage" | "fixed") => void;
  discountValue: number;
  setDiscountValue: (val: number) => void;
  discountAmount: number;
  orderType: "walk_in" | "takeaway" | "delivery" | "room_service";
  setOrderType: (
    val: "walk_in" | "takeaway" | "delivery" | "room_service",
  ) => void;
  // Bar Specific
  menuType: "food" | "bar";
  barLocation?: string;
  setBarLocation?: (val: string) => void;
  submitLabel?: string;
}

export function POSCart({
  cart,
  onRemove,
  onUpdateItem,
  onSubmit,
  subtotal,
  taxAmount,
  taxType,
  setTaxType,
  taxValue,
  setTaxValue,
  total,
  isSubmitting,
  guestName,
  setGuestName,
  guestEmail,
  setGuestEmail,
  tableNumber,
  setTableNumber,
  roomName,
  setRoomName,
  waiterName,
  setWaiterName,
  preparedBy,
  setPreparedBy,
  printedBy,
  setPrintedBy,
  roomTypes,
  activeGuests,
  deliveryLocation,
  setDeliveryLocation,
  notes,
  setNotes,
  paymentMethod,
  setPaymentMethod,
  isUrgent,
  onSetUrgent,
  paymentStatus,
  setPaymentStatus,
  paidAmount,
  setPaidAmount,
  prepTime,
  setPrepTime,
  setIsSidebarOpen,
  isSidebarOpen,
  validationErrors,
  setValidationErrors,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  discountAmount,
  orderType,
  setOrderType,
  menuType,
  barLocation,
  setBarLocation,
  submitLabel = "Place Order",
}: POSCartProps) {
  const [showGuestResults, setShowGuestResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredGuests = activeGuests
    .filter((g) =>
      `${g.guestDetails?.firstName || ""} ${g.guestDetails?.lastName || ""}`
        .toLowerCase()
        .includes(guestName.toLowerCase()),
    )
    .slice(0, 5);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowGuestResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectGuest = (guest: Booking) => {
    setGuestName(
      `${guest.guestDetails?.firstName || ""} ${guest.guestDetails?.lastName || ""}`,
    );
    setRoomName(guest.rooms?.[0]?.allocatedRoomType || "");
    setShowGuestResults(false);
  };

  useEffect(() => {
    if (paymentMethod === "Complimentary") {
      setPaymentStatus("paid");
      setPaidAmount(total);
    }
  }, [paymentMethod, total, setPaymentStatus, setPaidAmount]);

  const dueAmount =
    paymentMethod === "Complimentary"
      ? 0
      : paymentStatus === "paid"
        ? 0
        : Math.max(0, total - paidAmount);

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5 text-[#FF6A00]" />
            Order Cart
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 hover:bg-gray-200 rounded"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className={`flex-1 overflow-y-auto p-3 space-y-3 ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
        >
          {/* Cart Items - TOP (Industry Standard) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-600 uppercase flex items-center gap-2">
                <ShoppingCartIcon className="h-3 w-3" />
                Order Items ({cart.reduce((a, b) => a + b.quantity, 0)})
              </div>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No items added yet
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-semibold text-sm text-gray-900 block">
                        {item.name}
                      </span>
                      {/* Show selected modifiers */}
                      {item.selectedModifiers &&
                        item.selectedModifiers.length > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            +{" "}
                            {item.selectedModifiers
                              .map((m) => m.name)
                              .join(", ")}
                          </div>
                        )}
                      <div className="text-xs text-gray-400 mt-1">
                        ${(item.customPrice ?? item.price).toFixed(2)} each
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#FF6A00]">
                        $
                        {(
                          (item.customPrice ?? item.price) * item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            onRemove(item.id);
                          } else {
                            onUpdateItem(item.id, {
                              quantity: item.quantity - 1,
                            });
                          }
                        }}
                        disabled={isSubmitting}
                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MinusIcon className="h-4 w-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateItem(item.id, { quantity: item.quantity + 1 })
                        }
                        disabled={isSubmitting}
                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemove(item.id)}
                      disabled={isSubmitting}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove item"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Guest Details */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase">
              <UserIcon className="h-3 w-3" />
              Guest Details
            </div>

            {/* Guest Name Field */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Guest Name <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={searchRef}>
                <input
                  type="text"
                  placeholder="Enter guest name"
                  value={guestName}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    setShowGuestResults(true);
                    if (validationErrors.guestName) {
                      setValidationErrors({
                        ...validationErrors,
                        guestName: "",
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    validationErrors.guestName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {validationErrors.guestName && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {validationErrors.guestName}
                  </span>
                )}
                {showGuestResults &&
                  guestName.length > 0 &&
                  filteredGuests.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg rounded-lg mt-1 z-50 max-h-32 overflow-y-auto">
                      {filteredGuests.map((g) => (
                        <div
                          key={g.id}
                          onClick={() => selectGuest(g)}
                          className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm"
                        >
                          {g.guestDetails?.firstName} {g.guestDetails?.lastName}{" "}
                          - Room {g.rooms?.[0]?.allocatedRoomType || "N/A"}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Guest Contact (Email) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter guest email"
                value={guestEmail}
                disabled={isSubmitting}
                onChange={(e) => {
                  setGuestEmail(e.target.value);
                  if (validationErrors.guestEmail) {
                    setValidationErrors({
                      ...validationErrors,
                      guestEmail: "",
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  validationErrors.guestEmail
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
              />
              {validationErrors.guestEmail && (
                <span className="text-xs text-red-500 mt-1 block">
                  {validationErrors.guestEmail}
                </span>
              )}
            </div>
          </div>

          {/* Order & Location */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase">
              <MapPinIcon className="h-3 w-3" />
              Order & Location
            </div>

            {/* Bar Location (Only for Bar Menu) */}
            {menuType === "bar" && setBarLocation && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Bar Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={barLocation}
                  onChange={(e) => setBarLocation(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="main_bar">Main Bar</option>
                  <option value="beach_bar">Beach Bar</option>
                </select>
              </div>
            )}

            {/* Delivery Location */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Delivery Location
              </label>
              <select
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="restaurant">Restaurant (Dine-in)</option>
                <option value="in_room">Room Service</option>
                <option value="pool_side">Pool Side</option>
                <option value="beach_side">Beach Side</option>
                <option value="bar">Bar</option>
              </select>
            </div>

            {/* Order Type Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Order Type
              </label>
              {deliveryLocation === "in_room" ? (
                <input
                  type="text"
                  value="Room Service"
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              ) : (
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {(deliveryLocation === "restaurant" ||
                    deliveryLocation === "bar") && (
                    <>
                      <option value="walk_in">Walk In</option>
                      <option value="takeaway">Takeaway</option>
                      <option value="delivery">Delivery</option>
                    </>
                  )}
                  {(deliveryLocation === "pool_side" ||
                    deliveryLocation === "beach_side") && (
                    <>
                      <option value="walk_in">Walk In</option>
                      <option value="takeaway">Takeaway</option>
                      <option value="delivery">Delivery</option>
                    </>
                  )}
                </select>
              )}
            </div>

            {/* Table Number (for restaurant) */}
            {deliveryLocation === "restaurant" && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Table Number
                </label>
                <input
                  type="text"
                  placeholder="Enter table number"
                  value={tableNumber}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setTableNumber(e.target.value);
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed border-gray-300`}
                />
              </div>
            )}
            {/* Room Number (for room service) */}
            {deliveryLocation === "in_room" && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Room Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={roomName}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setRoomName(e.target.value);
                    if (validationErrors.roomName) {
                      setValidationErrors({
                        ...validationErrors,
                        roomName: "",
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    validationErrors.roomName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select a room</option>
                  {(() => {
                    const grouped = roomTypes.reduce(
                      (acc, room) => {
                        if (!room.isActive) return acc;
                        const suite = room.suiteType || "Other";
                        if (!acc[suite]) acc[suite] = [];
                        acc[suite].push(room);
                        return acc;
                      },
                      {} as Record<string, typeof roomTypes>,
                    );
                    return Object.entries(grouped).map(([suite, rooms]) => (
                      <optgroup key={suite} label={suite}>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.roomName}>
                            {room.roomName}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </select>
                {validationErrors.roomName && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {validationErrors.roomName}
                  </span>
                )}
              </div>
            )}

            {/* Staff Assignment */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-3">
              <div className="text-xs font-bold text-gray-600 uppercase flex items-center gap-2">
                <UserIcon className="h-3 w-3" />
                Staff Assignment
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Waiter Name
                  </label>
                  <input
                    type="text"
                    value={waiterName}
                    onChange={(e) => setWaiterName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter waiter name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Prepared By
                  </label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Chef/Staff name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Printed By
                  </label>
                  <input
                    type="text"
                    value={printedBy}
                    onChange={(e) => setPrintedBy(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Staff name"
                  />
                </div>
              </div>
            </div>

            {/* Kitchen Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Kitchen Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                placeholder="Special instructions or notes..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed h-16 resize-none"
              />
            </div>

            {/* Estimated Prep Time */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Estimated Prep Time (min)
              </label>
              <div className="flex gap-4 items-end">
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  disabled={isSubmitting}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value) || 30;
                    setPrepTime(Math.max(5, val));
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  min={5}
                />

                {/* Urgent Order Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none pb-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isUrgent || false}
                    onChange={(e) => onSetUrgent?.(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-5 h-5 accent-[#FF6A00] rounded focus:ring-[#FF6A00] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span
                    className={`text-sm font-semibold flex items-center gap-1.5 ${isUrgent ? "text-[#FF6A00]" : "text-gray-600"}`}
                  >
                    Urgent Order
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-3">
            <div className="text-xs font-bold text-gray-600 uppercase">
              Payment
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Card">Card</option>
                <option value="Complimentary">Complimentary</option>
              </select>
            </div>

            {/* Payment Status (not for Complimentary) */}
            {paymentMethod !== "Complimentary" && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="paid">Paid in Full</option>
                  <option value="due">Partial Payment / Due</option>
                </select>
              </div>
            )}

            {/* Paid Amount (only when status is due) */}
            {paymentMethod !== "Complimentary" && paymentStatus === "due" && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Amount Paid <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    setPaidAmount(val > total ? total : val);
                    if (validationErrors.paidAmount) {
                      setValidationErrors({
                        ...validationErrors,
                        paidAmount: "",
                      });
                    }
                  }}
                  placeholder="Enter amount received"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] ${
                    validationErrors.paidAmount
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  min={0}
                  max={total}
                />
                {validationErrors.paidAmount && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {validationErrors.paidAmount}
                  </span>
                )}
                <p className="text-xs text-gray-500">
                  How much has the customer paid now? The remaining will be
                  marked as due.
                </p>
              </div>
            )}

            {/* Complimentary Note */}
            {paymentMethod === "Complimentary" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-700">
                  This order is complimentary. No payment required.
                </p>
              </div>
            )}
          </div>
          {/* Discounts & Tax */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-3">
            <div className="text-xs font-bold text-gray-600 uppercase">
              Discounts & Tax
            </div>
            <div className="space-y-3">
              {/* Discount */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Discount
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "percentage" | "fixed")
                    }
                    className="text-xs border border-gray-300 rounded-l-lg py-2 px-2 focus:outline-none focus:border-[#FF6A00] bg-white min-w-[100px]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
                    min={0}
                  />
                </div>
              </div>

              {/* Tax */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tax
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={taxType}
                    onChange={(e) =>
                      setTaxType(e.target.value as "percentage" | "fixed")
                    }
                    className="text-xs border border-gray-300 rounded-l-lg py-2 px-2 focus:outline-none focus:border-[#FF6A00] bg-white min-w-[100px]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                  <input
                    type="number"
                    value={taxValue}
                    onChange={(e) => setTaxValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00]"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-3 border-t border-gray-300 bg-white space-y-2 shrink-0">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Tax</span>
            <span>+${taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-[#FF6A00]">${total.toFixed(2)}</span>
          </div>
          {paidAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Paid</span>
              <span>${paidAmount.toFixed(2)}</span>
            </div>
          )}
          {dueAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Due</span>
              <span>${dueAmount.toFixed(2)}</span>
            </div>
          )}
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#FF6A00] text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ================= MENU BROWSER (TABLE) =================
interface MenuBrowserProps {
  items: POSItem[];
  selectedItems: Set<string>;
  onToggleSelect: (itemId: string) => void;
  onAddToCart: (
    item: POSItem,
    selectedVariant?: POSVariant,
    selectedModifiers?: { name: string; price: number }[],
  ) => void;
}

export function MenuBrowser({
  items,
  selectedItems,
  onToggleSelect,
  onAddToCart,
}: MenuBrowserProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState<POSItem | null>(null);

  const itemsPerPage = 14;

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Search */}
      <div className="p-4 bg-white border-b border-gray-200 shrink-0">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>
      </div>

      {/* Grid View */}
      <div className="flex-1 overflow-auto p-4">
        {paginatedItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-max">
            {paginatedItems.map((item) => {
              // Calculate price display for variant-based items
              const priceDisplay = (() => {
                if (
                  item.hasVariants &&
                  item.variants &&
                  item.variants.length > 0
                ) {
                  const prices = item.variants
                    .filter((v) => v.isAvailable)
                    .map((v) => v.price)
                    .sort((a, b) => a - b);
                  if (prices.length === 0) return "N/A";
                  if (prices.length === 1) return `$${prices[0].toFixed(2)}`;
                  return `$${prices[0].toFixed(2)} - $${prices[prices.length - 1].toFixed(2)}`;
                }
                return `$${(item.price || 0).toFixed(2)}`;
              })();

              const isSelected = selectedItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`relative bg-white rounded-xl border-2 overflow-hidden shadow-sm transition-all hover:shadow-md ${
                    isSelected
                      ? "border-[#FF6A00] ring-2 ring-orange-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Image Container */}
                  {item.image && (
                    <div className="relative h-28 sm:h-32 bg-gray-100 overflow-hidden">
                      <img
                        src={item.image || ""}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.hasVariants && (
                        <div className="absolute top-2 right-2 bg-[#FF6A00] text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          Variants
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-3 flex flex-col gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {item.description || "No description"}
                      </p>
                      {/* Item details */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                          {item.category}
                        </span>
                        {item.hasVariants && item.variants && (
                          <span className="text-[10px] bg-orange-50 text-[#FF6A00] px-1.5 py-0.5 rounded font-medium">
                            {item.variants.filter((v) => v.isAvailable).length}{" "}
                            variants
                          </span>
                        )}
                        {(item as any).sku && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                            {(item as any).sku}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-lg font-bold text-[#FF6A00]">
                        {priceDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Actions - Overlay */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="flex gap-3">
                      <button
                        onClick={() => onToggleSelect(item.id)}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all text-white shadow-lg ${
                          isSelected
                            ? "bg-[#FF6A00] scale-110"
                            : "bg-gray-700/90 hover:bg-gray-900"
                        }`}
                        title={isSelected ? "Remove from order" : "Quick add"}
                      >
                        {isSelected ? (
                          <CheckIcon className="h-5 w-5 stroke-2" />
                        ) : (
                          <PlusIcon className="h-5 w-5 stroke-2" />
                        )}
                      </button>
                      <button
                        onClick={() => setDetailItem(item)}
                        className="w-11 h-11 bg-[#FF6A00] rounded-full flex items-center justify-center hover:bg-[#E55A00] transition-colors text-white shadow-lg"
                        title="View details & customize"
                      >
                        <EyeIcon className="h-5 w-5 stroke-2" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search
            </p>
          </div>
        )}
      </div>

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-sm font-medium text-gray-600">
            <span className="font-bold text-gray-900">{currentPage}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-gray-600">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let n = i + 1;
              if (totalPages > 5 && currentPage > 3) n = currentPage - 2 + i;
              if (totalPages > 5 && currentPage > totalPages - 2)
                n = totalPages - 4 + i;
              return (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`h-9 px-3 rounded-lg text-sm font-bold transition-all ${
                    currentPage === n
                      ? "bg-[#FF6A00] text-white shadow-md"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      <ItemDetailModal
        item={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}
