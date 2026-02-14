export type AvailabilityType =
  | "all_day"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "night"
  | "custom";

export type CategoryType = "food" | "bar";

/** Distinguishes food vs bar orders. Shared across services & UI. */
export type MenuType = "food" | "bar";

export interface FoodCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  type: CategoryType;
  availabilityType: AvailabilityType;
  availableHoursStart: string;
  availableHoursEnd: string;
  description: string;
  isParentCategory: boolean;
  parentCategoryId: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ItemType = "simple" | "variant_based" | "complex_combo";

export type KitchenSection =
  | "breakfast"
  | "continental"
  | "indian"
  | "swahili"
  | "seafood"
  | "night"
  | "pastry"
  | "bar";

export interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface MenuItemGroupOption {
  name: string;
  priceMod: number;
  isAvailable?: boolean;
  description?: string;
}

export interface MenuItemGroup {
  groupName: string;
  required: boolean;
  minSelect: number;
  maxSelect: number | null;
  options: MenuItemGroupOption[];
}

export interface MenuItemDiscount {
  isActive: boolean;
  type: "percentage" | "fixed";
  value: number;
}

export interface MenuItemNightMenu {
  isAvailable: boolean;
  nightItemId: string;
  overridePrice: number | null;
}

export interface FoodMenuItem {
  id: string;
  name: string;
  description: string;
  images: string[];
  categoryId: string;
  kitchenSection: KitchenSection;
  basePrice: number | null;
  currency: string;
  taxPercent: number;
  discount: MenuItemDiscount;
  itemType: ItemType;
  hasVariants: boolean;
  variants: MenuItemVariant[];
  hasGroups: boolean;
  groups: MenuItemGroup[];
  servedWith: string;
  nightMenu: MenuItemNightMenu;
  isVeg: boolean;
  isVegan: boolean;
  isHalal: boolean;
  allergens: string[];
  isAvailable: boolean;
  isPopular: boolean;
  sku: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ALLERGEN_OPTIONS = [
  "gluten",
  "dairy",
  "eggs",
  "nuts",
  "peanuts",
  "shellfish",
  "fish",
  "soy",
  "sesame",
] as const;

export const KITCHEN_SECTION_OPTIONS: {
  value: KitchenSection;
  label: string;
}[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "continental", label: "Continental" },
  { value: "indian", label: "Indian" },
  { value: "swahili", label: "Swahili" },
  { value: "seafood", label: "Seafood" },
  { value: "night", label: "Night Kitchen" },
  { value: "pastry", label: "Pastry & Desserts" },
  { value: "bar", label: "Bar" },
];

export const AVAILABILITY_TYPE_OPTIONS: {
  value: AvailabilityType;
  label: string;
}[] = [
  { value: "all_day", label: "All Day" },
  { value: "breakfast", label: "Breakfast Only" },
  { value: "lunch", label: "Lunch Only" },
  { value: "dinner", label: "Dinner Only" },
  { value: "night", label: "Night Only" },
  { value: "custom", label: "Custom Hours" },
];

export const ITEM_TYPE_OPTIONS: {
  value: ItemType;
  label: string;
  description: string;
}[] = [
  {
    value: "simple",
    label: "Simple Item",
    description: "Single price, no choices",
  },
  {
    value: "variant_based",
    label: "Variant-Based",
    description: "Customer picks one variant (size/flavor)",
  },
  {
    value: "complex_combo",
    label: "Complex Combo",
    description: "Multiple choice groups (e.g., breakfast combo)",
  },
];

export const getDefaultFoodCategory = (): Partial<FoodCategory> => ({
  name: "",
  sortOrder: 1,
  isActive: true,
  type: "food",
  availabilityType: "all_day",
  availableHoursStart: "",
  availableHoursEnd: "",
  description: "",
  isParentCategory: false,
  parentCategoryId: "",
  imageUrl: "",
});

export const getDefaultFoodMenuItem = (): Partial<FoodMenuItem> => ({
  name: "",
  description: "",
  images: [],
  categoryId: "",
  kitchenSection: "continental",
  basePrice: null,
  currency: "USD",
  taxPercent: 15,
  discount: { isActive: false, type: "percentage", value: 0 },
  itemType: "simple",
  hasVariants: false,
  variants: [],
  hasGroups: false,
  groups: [],
  servedWith: "",
  nightMenu: { isAvailable: false, nightItemId: "", overridePrice: null },
  isVeg: false,
  isVegan: false,
  isHalal: false,
  allergens: [],
  isAvailable: true,
  isPopular: false,
  sku: "",
});

export const getDefaultVariant = (): MenuItemVariant => ({
  id: `var_${Date.now()}`,
  name: "",
  price: 0,
  isAvailable: true,
  sortOrder: 1,
});

export const getDefaultGroup = (): MenuItemGroup => ({
  groupName: "",
  required: true,
  minSelect: 1,
  maxSelect: 1,
  options: [],
});

export const getDefaultGroupOption = (): MenuItemGroupOption => ({
  name: "",
  priceMod: 0,
  isAvailable: true,
});

// ═════════════════════════════════════════════════════════════════════════════
// ORDER TYPES (moved from firestoreService.ts)
// ═════════════════════════════════════════════════════════════════════════════

export interface FoodOrder {
  id: string;
  orderNumber: string;
  receiptNo?: string;
  rtNo?: string;
  bookingId?: string;
  guestName: string;
  guestEmail?: string;
  roomName?: string;
  tableNumber?: string;
  waiterName?: string;
  preparedBy?: string;
  printedBy?: string;
  deliveryLocation:
    | "in_room"
    | "restaurant"
    | "bar"
    | "beach_side"
    | "pool_side";
  orderType: "walk_in" | "takeaway" | "room_service" | "delivery";
  menuType?: MenuType;
  barLocation?: "main_bar" | "beach_bar";
  priority?: "urgent" | "normal";
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
    variant?: { name: string; price: number };
    selectedModifiers?: Array<{ name: string; price: number }>;
    category?: string;
    station?: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  taxDetails?: {
    type: "percentage" | "fixed";
    value: number;
    amount: number;
  };
  discountDetails?: {
    type: "percentage" | "fixed";
    value: number;
    amount: number;
  };
  status:
    | "pending"
    | "running"
    | "settled"
    | "voided"
    | "confirmed"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  kitchenStatus: "received" | "cooking" | "ready" | "delivered";
  scheduledDeliveryTime?: Date;
  estimatedPreparationTime: number;
  actualDeliveryTime?: Date;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod?: string;
  paidAmount?: number;
  dueAmount?: number;
  userId?: string;
  ownerId?: string;
  notes?: string;
  voidReason?: string;
  createdAt: Date;
  updatedAt: Date;
  orderTime?: Date;
  revenueRecorded?: boolean;
  inventoryDeducted?: boolean;
  restaurantPrinted?: boolean;
  restaurantPrintedAt?: Date;
  reprintRequested?: boolean;
  kitchenPrintRequested?: boolean;
  kitchenPrinted?: boolean;
  kitchenPrintedAt?: Date;
  barPrinted?: boolean;
  barPrintedAt?: Date;
  receiptUrl?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// REVENUE TYPES (moved from firestoreService.ts)
// ═════════════════════════════════════════════════════════════════════════════

export interface FBRevenue {
  id: string;
  date: Date;
  totalSales: number;
  totalPayment: number;
  totalOrders: number;
  totalDiscount: number;
  totalCustomers: number;
  totalVoid: number;
  orderTypeSummary: Record<string, number>;
  paymentSummary: Record<string, number>;
  categorySummary: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FBWeeklyRevenue {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  orders: number;
  averageOrderValue: number;
}
