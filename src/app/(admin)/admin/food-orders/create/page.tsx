"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getFoodMenuItems,
  getFoodCategories,
  getBarMenuItems,
  getBarCategories,
} from "@/lib/services/fbMenuService";
import {
  createFoodOrder,
  updateFoodOrder,
  getFoodOrder,
} from "@/lib/services/fbOrderService";
import { getAllBookings, getAllRoomTypes } from "@/lib/firestoreService";
import type { Booking, RoomTypeData } from "@/lib/firestoreService";
import type { FoodCategory } from "@/lib/types/foodMenu";
import { processOrderInventoryDeduction } from "@/lib/inventoryService";
import {
  uploadReceiptToStorage,
  generateReceiptNumber,
  generateOrderNumber,
} from "@/lib/receiptGenerator";
import { useToast } from "@/context/ToastContext";
import { ArrowLeftIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import {
  POSCart,
  MenuBrowser,
  POSItem,
  CartItem,
} from "@/components/admin/food-orders/pos/POSComponents";

export default function POSCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const returnUrl = searchParams.get("returnUrl") || "/admin/food-orders";
  const menuType = (searchParams.get("menuType") as "food" | "bar") || "food";

  // Data State
  const [items, setItems] = useState<POSItem[]>([]);
  const [activeGuests, setActiveGuests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Order Details
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [roomName, setRoomName] = useState("");
  const [waiterName, setWaiterName] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [printedBy, setPrintedBy] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("restaurant");
  const [orderType, setOrderType] = useState<
    "walk_in" | "takeaway" | "delivery" | "room_service"
  >("walk_in");
  const [barLocation, setBarLocation] = useState("main_bar");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paidAmount, setPaidAmount] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [taxType, setTaxType] = useState<"percentage" | "fixed">("percentage");
  const [taxValue, setTaxValue] = useState(18);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [prepTime, setPrepTime] = useState(30);
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const editOrderId = searchParams.get("editOrderId");
  const [isEditing, setIsEditing] = useState(false);

  // ... (existing state)

  // Effect to load existing order for editing
  useEffect(() => {
    async function loadOrder() {
      if (!editOrderId) return;
      try {
        setLoading(true);
        const order = await getFoodOrder(editOrderId);
        if (order) {
          setIsEditing(true);
          // Populate Form
          setGuestName(order.guestName || "");
          setGuestEmail(order.guestEmail || "");
          setRoomName(order.roomName || "");
          setTableNumber(order.tableNumber || "");
          setDeliveryLocation(order.deliveryLocation || "restaurant");
          setBarLocation(order.barLocation || "main_bar");
          setOrderType(order.orderType as any);
          setPaymentMethod(order.paymentMethod || "Cash");
          setPaymentStatus(order.paymentStatus || "paid");
          setPaidAmount(order.paidAmount || 0);
          setNotes(order.notes || "");
          setWaiterName(order.waiterName || "");
          setPreparedBy(order.preparedBy || "");
          setPrintedBy(order.printedBy || "");
          setIsUrgent(order.priority === "urgent");

          // Populate Cart
          const mappedCart: CartItem[] = order.items.map((item) => ({
            id: item.menuItemId || `item-${Math.random()}`,
            name: item.name,
            description: "", // Required by POSItem
            price: item.price,
            quantity: item.quantity,
            // specialInstructions mapped to notes for cart
            notes: item.specialInstructions,
            customPrice: item.price, // Assuming price snapshot

            // Reconstruct variant/modifiers strictly typed
            selectedVariant: item.variant
              ? {
                  id: "v-loaded",
                  name: item.variant.name,
                  price: item.variant.price,
                  isAvailable: true,
                }
              : undefined,
            selectedModifiers: item.selectedModifiers || [],
            category: item.category,
            station: item.station,
          }));
          setCart(mappedCart);

          // Update Selection State
          setSelectedItems(
            new Set(mappedCart.map((item) => item.id.split("::")[0])),
          );

          // Financials
          setDiscountValue(order.discount || 0);
          setTaxValue(order.tax || 0);
          // Note context: discountType/taxType might need inferring if not saved explicitly
          // For now assuming defaults or fixed values from order if mapped
        }
      } catch (error) {
        console.error("Failed to load order", error);
        showToast("Failed to load order details", "error");
      } finally {
        setLoading(false);
      }
    }

    if (editOrderId) {
      loadOrder();
    }
  }, [editOrderId]);

  // Effect to enforce Order Type rules based on Location
  useEffect(() => {
    if (deliveryLocation === "in_room") {
      setOrderType("room_service");
    } else if (
      deliveryLocation === "restaurant" ||
      deliveryLocation === "bar"
    ) {
      if (orderType !== "takeaway") {
        setOrderType("walk_in");
      }
    } else if (
      deliveryLocation === "pool_side" ||
      deliveryLocation === "beach_side"
    ) {
      if (orderType !== "delivery") {
        setOrderType("walk_in");
      }
    }
  }, [deliveryLocation]);
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [itemsData, catsData, bookingsData, roomTypesData] =
          await Promise.all([
            menuType === "bar" ? getBarMenuItems() : getFoodMenuItems(),
            menuType === "bar" ? getBarCategories() : getFoodCategories(),
            getAllBookings(),
            getAllRoomTypes(),
          ]);

        const mappedItems: POSItem[] = itemsData
          .filter((i) => i.isAvailable)
          .map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description || "",
            price: item.basePrice || 0,
            image: item.images?.[0] || "",
            images: item.images || [],
            category:
              catsData.find((c) => c.id === item.categoryId)?.name || "",
            station: item.kitchenSection || "continental",
            kitchenSection: item.kitchenSection, // Added for menu filtering
            sku: item.sku || "", // Pass actual SKU from menu item
            itemType: item.itemType || "simple",
            hasVariants: item.hasVariants || false,
            variants:
              item.variants?.map((v, idx) => ({
                id: `${item.id}-v${idx}`,
                name: v.name,
                price: v.price,
                isAvailable: v.isAvailable ?? true,
              })) || [],
            hasGroups: item.hasGroups || false,
            groups:
              item.groups?.map((g) => ({
                groupName: g.groupName,
                required: g.required,
                minSelect: g.minSelect || 0,
                maxSelect: g.maxSelect || null,
                options: g.options.map((o) => ({
                  name: o.name,
                  priceMod: o.priceMod || 0,
                  isAvailable: o.isAvailable ?? true,
                })),
              })) || [],
          }));
        setItems(mappedItems);

        const checkedIn = bookingsData.filter(
          (b) => b.status === "checked_in" || b.status === "stay_over",
        );
        setActiveGuests(checkedIn);
        setRoomTypes(roomTypesData);
      } catch (error) {
        console.error("Failed to load POS data:", error);
        showToast("Failed to load menu/guests", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [menuType]);

  // Toggle checkbox selection
  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      setCart((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      newSelected.add(itemId);
      const item = items.find((i) => i.id === itemId);
      if (item) {
        setCart((prev) => [...prev, { ...item, quantity: 1 }]);
      }
    }
    setSelectedItems(newSelected);
  };

  // Add to cart from modal (handles variants and modifiers)
  const addToCart = (
    item: POSItem,
    selectedVariant?: {
      id: string;
      name: string;
      price: number;
      isAvailable: boolean;
    },
    selectedModifiers?: { name: string; price: number }[],
  ) => {
    // Create unique cart item ID based on variant selection
    const cartItemId = selectedVariant
      ? `${item.id}::${selectedVariant.id}`
      : item.id;

    // Calculate final price
    const basePrice = selectedVariant ? selectedVariant.price : item.price;
    const modifiersTotal =
      selectedModifiers?.reduce((sum, m) => sum + m.price, 0) || 0;
    const finalPrice = basePrice + modifiersTotal;

    // Create display name with variant
    const displayName = selectedVariant
      ? `${item.name} - ${selectedVariant.name}`
      : item.name;

    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          ...item,
          id: cartItemId,
          name: displayName,
          price: finalPrice,
          quantity: 1,
          selectedVariant: selectedVariant,
          selectedModifiers: selectedModifiers,
        },
      ];
    });
    setSelectedItems((prev) => new Set(prev).add(item.id));
    showToast(`Added ${displayName}`, "success");
  };

  // Update cart item
  const updateCartItem = (
    itemId: string,
    updates: { quantity?: number; notes?: string; customPrice?: number },
  ) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => {
          if (item.id === itemId) {
            return { ...item, ...updates };
          }
          return item;
        })
        .filter((i) => i.quantity > 0);

      // Update selection
      setSelectedItems(new Set(updated.map((i) => i.id)));
      return updated;
    });
  };

  // Remove from cart
  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  // Totals
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.customPrice ?? item.price) * item.quantity,
    0,
  );

  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue < 0) return 0;
    if (discountType === "fixed") return Math.min(discountValue, subtotal);
    return (subtotal * discountValue) / 100;
  }, [subtotal, discountValue, discountType]);

  const taxAmount = useMemo(() => {
    if (!taxValue || taxValue < 0) return 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    if (taxType === "fixed") return taxValue;
    return (taxableAmount * taxValue) / 100;
  }, [subtotal, discountAmount, taxValue, taxType]);

  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  // Validation helpers
  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  // Submit
  const handleSubmitOrder = async () => {
    // Validate all fields
    const errors: Record<string, string> = {};

    if (!guestName.trim() || guestName.trim().length < 2) {
      errors.guestName = "Guest name required (min 2 chars)";
    }

    if (!guestEmail.trim() || !isValidEmail(guestEmail.trim())) {
      errors.guestEmail = "Valid email address required";
    }

    // if (deliveryLocation === "restaurant" && !tableNumber.trim()) {
    //   errors.tableNumber = "Table number required for dine-in";
    // }

    if (deliveryLocation === "in_room" && !roomName.trim()) {
      errors.roomName = "Room selection required";
    }

    // Validate paid amount when payment is due
    if (paymentMethod !== "Complimentary" && paymentStatus === "due") {
      if (paidAmount < 0) {
        errors.paidAmount = "Amount paid cannot be negative";
      } else if (paidAmount >= total) {
        errors.paidAmount = "If fully paid, select 'Paid in Full' status";
      }
    }

    if (cart.length === 0) {
      showToast("Please add at least 1 item", "error");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Show specific error messages instead of generic message
      const errorMessages = Object.values(errors).slice(0, 3).join(". ");
      showToast(errorMessages, "error");
      return;
    }

    setValidationErrors({});

    setSubmitting(true);
    try {
      // Order & receipt numbers are now generated server-side by createFoodOrder()
      // using Firestore atomic counters for guaranteed uniqueness

      // Calculate paid/due correctly based on payment status
      const finalPaidAmount =
        paymentMethod === "Complimentary"
          ? total
          : paymentStatus === "paid"
            ? total
            : paidAmount;
      const finalDueAmount =
        paymentMethod === "Complimentary"
          ? 0
          : paymentStatus === "paid"
            ? 0
            : Math.max(0, total - paidAmount);

      const orderData = {
        guestName: guestName || "Walk-in",
        guestEmail: guestEmail || "N/A",
        tableNumber:
          deliveryLocation === "restaurant" && tableNumber ? tableNumber : null,
        roomName: deliveryLocation === "in_room" && roomName ? roomName : null,
        waiterName: waiterName || null,
        preparedBy: preparedBy || null,
        printedBy: printedBy || null,
        deliveryLocation,
        status: isEditing ? undefined : ("pending" as const), // Don't reset status on edit unless needed
        orderType: orderType as any,
        menuType,
        barLocation:
          menuType === "bar"
            ? (barLocation as "main_bar" | "beach_bar")
            : undefined,
        priority: isUrgent ? "urgent" : "normal",
        // kitchenStatus: "received" as const, // Don't reset kitchen status
        items: cart.map((i) => ({
          menuItemId: i.id.split("::")[0], // Get base item ID
          name: i.name,
          sku: i.sku || null, // Pass actual SKU from menu item
          quantity: i.quantity,
          price: i.customPrice ?? i.price,
          category: i.category || null,
          station: i.station || null,
          notes: i.notes || null,
          variant: i.selectedVariant
            ? { name: i.selectedVariant.name, price: i.selectedVariant.price }
            : null,
          selectedModifiers:
            i.selectedModifiers && i.selectedModifiers.length > 0
              ? i.selectedModifiers
              : null,
        })),
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        totalAmount: total,
        taxDetails: {
          type: taxType,
          value: taxValue,
          amount: taxAmount,
        },
        discountDetails: {
          type: discountType,
          value: discountValue,
          amount: discountAmount,
        },
        estimatedPreparationTime: prepTime,
        notes: notes || null,
        paymentMethod,
        paymentStatus:
          paymentMethod === "Complimentary" ? "paid" : paymentStatus,
        paidAmount: finalPaidAmount,
        dueAmount: finalDueAmount,
        // restaurantPrinted NOT set — print only triggers on confirmation (Phase 9)
        reprintRequested: false, // Reset reprint if edited
      };

      if (isEditing && editOrderId) {
        // UPDATE MODE
        // @ts-ignore
        const success = await updateFoodOrder(editOrderId, orderData);

        if (success) {
          showToast("Order updated successfully!", "success");

          // Regenerate Receipt (Optional but good for consistency)
          try {
            // Fetch fresh order to get numbers
            const updatedOrder = await getFoodOrder(editOrderId);
            if (updatedOrder) {
              const receiptUrl = await uploadReceiptToStorage({
                order: {
                  ...updatedOrder,
                  // Overlay current form data to ensure receipt matches what we just saved
                  // (in case fetch is stale, though await update should ensure consistency)
                } as any,
              });
              if (receiptUrl) {
                await updateFoodOrder(editOrderId, { receiptUrl } as any);
              }
            }
          } catch (e) {
            console.error("Receipt regen failed", e);
          }

          router.push(returnUrl);
        } else {
          showToast("Failed to update order", "error");
        }
      } else {
        // CREATE MODE
        // @ts-ignore
        const result = await createFoodOrder({
          ...orderData,
          status: "pending",
          kitchenStatus: "received",
        });

        if (result) {
          try {
            await processOrderInventoryDeduction(result.id, "POS System");
          } catch (invError) {
            console.error("Inventory deduction failed", invError);
          }

          showToast("Order sent to Kitchen!", "success");

          try {
            // Use server-generated IDs from createFoodOrder result
            const receiptUrl = await uploadReceiptToStorage({
              order: {
                id: result.id,
                orderNumber: result.orderNumber, // Server-generated unique number
                receiptNo: result.receiptNo, // Server-generated unique number
                guestName: guestName || "Walk-in",
                guestEmail: guestEmail || "N/A", // Add contact info
                roomName: roomName || null,
                waiterName: waiterName || null,
                preparedBy: preparedBy || null,
                printedBy: printedBy || null,
                tableNumber: tableNumber || null,
                deliveryLocation: deliveryLocation as any,
                orderType: orderType as any,
                items: cart.map((i) => ({
                  menuItemId: i.id,
                  name: i.name,
                  sku: i.sku || null, // Pass actual SKU from menu item
                  quantity: i.quantity,
                  price: i.customPrice ?? i.price,
                  specialInstructions: i.notes || null,
                  variant: i.selectedVariant
                    ? {
                        name: i.selectedVariant.name,
                        price: i.selectedVariant.price,
                      }
                    : null,
                  selectedModifiers:
                    i.selectedModifiers && i.selectedModifiers.length > 0
                      ? i.selectedModifiers
                      : null,
                })),
                subtotal,
                tax: taxAmount,
                discount: discountAmount,
                totalAmount: total,
                taxDetails: {
                  type: taxType,
                  value: taxValue,
                  amount: taxAmount,
                },
                discountDetails: {
                  type: discountType,
                  value: discountValue,
                  amount: discountAmount,
                },
                status: "pending" as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                paymentMethod,
                paymentStatus:
                  paymentMethod === "Complimentary" ? "paid" : paymentStatus,
                paidAmount: finalPaidAmount,
                dueAmount: finalDueAmount,
              } as any,
            });

            // Save receipt URL to order document
            if (receiptUrl) {
              await updateFoodOrder(result.id, { receiptUrl } as any);
            }
          } catch (receiptError) {
            console.error("Receipt failed:", receiptError);
          }

          router.push(returnUrl);
        }
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to place order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-lg font-bold text-gray-400">
        Loading {menuType === "bar" ? "Bar" : "Food"} Menu...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-sm md:mr-96">
        <div className="flex items-center gap-4 flex-1">
          <Link
            href={returnUrl}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit" : "Create New"}{" "}
              {menuType === "bar" ? "Bar" : "Food"} Order
            </h1>
            <p className="text-xs text-gray-500">
              {isEditing
                ? "Update details & items"
                : "Select items & add guest details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/food-orders/create?menuType=${
              menuType === "food" ? "bar" : "food"
            }&returnUrl=${returnUrl}`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6A00] whitespace-nowrap"
          >
            Switch to {menuType === "food" ? "Bar" : "Food"}
            <span className="hidden sm:inline">&nbsp;Order</span>
          </Link>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Cart Total
            </p>
            <p className="text-2xl font-bold text-[#FF6A00] leading-none mt-1">
              ${total.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {cart.reduce((a, b) => a + b.quantity, 0)} item
              {cart.reduce((a, b) => a + b.quantity, 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-3 bg-[#FF6A00] text-white rounded-lg hover:bg-[#E55A00] transition-colors relative shadow-lg"
          >
            <ShoppingCartIcon className="h-6 w-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 md:mr-96 overflow-hidden">
          <MenuBrowser
            items={items}
            selectedItems={selectedItems}
            onToggleSelect={toggleSelectItem}
            onAddToCart={addToCart}
          />
        </div>

        <POSCart
          submitLabel={isEditing ? "Update Order" : "Place Order"}
          cart={cart}
          onRemove={removeFromCart}
          onUpdateItem={updateCartItem}
          subtotal={subtotal}
          taxType={taxType}
          setTaxType={setTaxType}
          taxValue={taxValue}
          setTaxValue={setTaxValue}
          taxAmount={taxAmount}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          discountAmount={discountAmount}
          total={total}
          onSubmit={handleSubmitOrder}
          isSubmitting={submitting}
          guestName={guestName}
          setGuestName={setGuestName}
          guestEmail={guestEmail}
          setGuestEmail={setGuestEmail}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          roomName={roomName}
          setRoomName={setRoomName}
          waiterName={waiterName}
          setWaiterName={setWaiterName}
          preparedBy={preparedBy}
          setPreparedBy={setPreparedBy}
          printedBy={printedBy}
          setPrintedBy={setPrintedBy}
          roomTypes={roomTypes}
          activeGuests={activeGuests}
          deliveryLocation={deliveryLocation}
          setDeliveryLocation={setDeliveryLocation}
          notes={notes}
          setNotes={setNotes}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          isUrgent={isUrgent}
          onSetUrgent={setIsUrgent}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          paidAmount={paidAmount}
          setPaidAmount={setPaidAmount}
          prepTime={prepTime}
          setPrepTime={setPrepTime}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          validationErrors={validationErrors}
          setValidationErrors={setValidationErrors}
          orderType={orderType}
          setOrderType={setOrderType}
          menuType={menuType}
          barLocation={barLocation}
          setBarLocation={setBarLocation}
        />
      </div>
    </div>
  );
}
