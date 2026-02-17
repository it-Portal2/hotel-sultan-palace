import React from "react";
import {
  HomeIcon,
  BuildingOfficeIcon,
  PlusIcon,
  CalendarDaysIcon,
  RectangleStackIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  BuildingOffice2Icon,
  UserIcon,
  CreditCardIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  XCircleIcon,
  HomeIcon as HomeStatusIcon,
  WrenchIcon,
  LockClosedIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ShoppingCartIcon,
  TruckIcon,
  BeakerIcon,
  ShoppingBagIcon,
  PhotoIcon,
  FilmIcon,
  MapPinIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  QueueListIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { FaUserSlash as userSlashIcon } from "react-icons/fa";
import { CleaningIcon } from "../components/icons/CleaningIcon";

// Portal Types
export type PortalType =
  | "selection"
  | "operations"
  | "kitchen"
  | "website"
  | "finance"
  | "staff";

export interface NavigationGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavigationItem[];
  defaultOpen?: boolean;
  isSingleItem?: boolean;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  section?: string; // RBAC Section Key
  requiresFullAdmin?: boolean; // Legacy fallback
  locked?: boolean;
}

// Define Navigation Groups per Portal
export const portalNavigationGroups: Record<PortalType, NavigationGroup[]> = {
  selection: [], // No sidebar for selection
  operations: [
    {
      name: "Dashboard",
      icon: Squares2X2Icon,
      items: [
        {
          name: "Front Desk",
          href: "/admin/dashboard",
          icon: HomeIcon,
          color: "text-orange-500",
          bgColor: "bg-orange-50",
          section: "dashboard",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
    {
      name: "Front Office",
      icon: ClipboardDocumentListIcon,
      items: [
        {
          name: "All Bookings",
          href: "/admin/bookings",
          icon: CalendarDaysIcon,
          color: "text-purple-500",
          bgColor: "bg-purple-50",
          section: "bookings",
        },
        {
          name: "Room Availability",
          href: "/admin/room-availability",
          icon: CalendarDaysIcon,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          section: "room_availability",
        },
        {
          name: "Room View",
          href: "/admin/front-desk?tab=room_view",
          icon: RectangleStackIcon,
          color: "text-green-500",
          bgColor: "bg-green-50",
          section: "room_view",
        },
        {
          name: "Unsettled Folios",
          href: "/admin/unsettled-folios",
          icon: ReceiptPercentIcon,
          color: "text-red-600",
          bgColor: "bg-red-50",
          section: "unsettled_folios",
        },
        {
          name: "Insert Transaction",
          href: "/admin/insert-transaction",
          icon: PlusIcon,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          section: "transactions",
        },
        {
          name: "Guest Database",
          href: "/admin/guest-database",
          icon: UserGroupIcon,
          color: "text-cyan-600",
          bgColor: "bg-cyan-50",
          section: "guest_database",
        },
        {
          name: "Lost & Found",
          href: "/admin/lost-and-found",
          icon: ArchiveBoxIcon,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          section: "lost_found",
        },
      ],
      defaultOpen: true,
    },

    {
      name: "Rooms",
      icon: BuildingOfficeIcon,
      items: [
        {
          name: "Room List",
          href: "/admin/rooms",
          icon: BuildingOfficeIcon,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          section: "rooms_list",
        },
        {
          name: "Add-ons",
          href: "/admin/addons",
          icon: PlusIcon,
          color: "text-green-500",
          bgColor: "bg-green-50",
          section: "addons",
        },
        {
          name: "Room Types",
          href: "/admin/room-types",
          icon: BuildingOfficeIcon,
          color: "text-emerald-500",
          bgColor: "bg-emerald-50",
          section: "room_types",
        },
      ],
      defaultOpen: true,
    },
    {
      name: "Cashiering",
      icon: CurrencyDollarIcon,
      items: [
        {
          name: "Company Database",
          href: "/admin/cashiering?tab=companies",
          icon: BuildingOffice2Icon,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          section: "companies",
        },
        {
          name: "Sales Persons",
          href: "/admin/cashiering?tab=sales-persons",
          icon: UserIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
          section: "sales_persons",
        },
        {
          name: "Travel Agents",
          href: "/admin/cashiering?tab=travel-agents",
          icon: UserGroupIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          section: "travel_agents",
        },
        {
          name: "POS",
          href: "/admin/cashiering?tab=pos",
          icon: CreditCardIcon,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          section: "pos",
        }, // Assuming 'companies' section access or appropriate existing one
      ],
      defaultOpen: true,
    },

    {
      name: "Reports",
      icon: ChartBarIcon,
      items: [
        {
          name: "Analytics",
          href: "/admin/reports",
          icon: ChartBarIcon,
          color: "text-pink-600",
          bgColor: "bg-pink-50",
          section: "analytics",
        },
        {
          name: "Arrival List",
          href: "/admin/reports/arrival-list",
          icon: ClipboardDocumentListIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          section: "arrival_list",
        },
        {
          name: "Cancelled Reservations",
          href: "/admin/reports/cancelled",
          icon: XCircleIcon,
          color: "text-red-600",
          bgColor: "bg-red-50",
          section: "cancelled",
        },
        {
          name: "No Show Reservations",
          href: "/admin/reports/no-show",
          icon: userSlashIcon,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          section: "no_show",
        },
      ],
      defaultOpen: true,
    },

    {
      name: "Housekeeping",
      icon: CleaningIcon,
      items: [
        {
          name: "House Status",
          href: "/admin/housekeeping?tab=house-status",
          icon: HomeStatusIcon,
          color: "text-teal-600",
          bgColor: "bg-teal-50",
          section: "house status",
        },
        {
          name: "Maintenance Block",
          href: "/admin/housekeeping?tab=maintenance-block",
          icon: WrenchIcon,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          section: "maintenance block",
        },
        {
          name: "Work Order",
          href: "/admin/housekeeping?tab=work-order",
          icon: ClipboardDocumentListIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          section: "work order",
        },
      ],
      defaultOpen: true,
      isSingleItem: false,
    },

    {
      name: "Net Locks",
      icon: LockClosedIcon,
      items: [
        {
          name: "Net Locks",
          href: "/admin/cashiering/net-locks",
          icon: LockClosedIcon,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          section: "net_locks",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },

    {
      name: "Night Audit",
      icon: ClockIcon,
      items: [
        {
          name: "Night Audit",
          href: "/admin/front-desk/night-audit",
          icon: ClockIcon,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          section: "night_audit",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },

    {
      name: "Guest Services",
      icon: WrenchScrewdriverIcon,
      items: [
        {
          name: "Guest Services",
          href: "/admin/guest-services",
          icon: WrenchScrewdriverIcon,
          color: "text-violet-600",
          bgColor: "bg-violet-50",
          section: "guest_services",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },

    {
      name: "Inventory",
      icon: ClipboardDocumentListIcon,
      items: [
        {
          name: "Overview",
          href: "/admin/inventory?tab=overview",
          icon: Squares2X2Icon,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          section: "inventory_overview",
        },
        {
          name: "Items",
          href: "/admin/inventory?tab=items",
          icon: ListBulletIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          section: "inventory_items",
        },
        {
          name: "Purchase Orders",
          href: "/admin/inventory?tab=purchase_orders",
          icon: ShoppingCartIcon,
          color: "text-green-600",
          bgColor: "bg-green-50",
          section: "inventory_orders",
        },
        {
          name: "Suppliers",
          href: "/admin/inventory?tab=suppliers",
          icon: TruckIcon,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          section: "inventory_suppliers",
        },
        {
          name: "Adjustments",
          href: "/admin/inventory?tab=adjustments",
          icon: ClipboardDocumentListIcon,
          color: "text-red-600",
          bgColor: "bg-red-50",
          section: "inventory_adjustments",
        },
        {
          name: "Transfer Stock",
          href: "/admin/inventory/transfer",
          icon: ArrowsRightLeftIcon,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          section: "inventory_transfer",
        },
        {
          name: "Reports",
          href: "/admin/inventory?tab=reports",
          icon: ChartBarIcon,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          section: "inventory_reports",
        },
      ],
      defaultOpen: true,
      isSingleItem: false,
    },
  ],
  kitchen: [
    {
      name: "Kitchen",
      icon: BeakerIcon,
      items: [
        {
          name: "Dashboard",
          href: "/admin/kitchen",
          icon: HomeIcon,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          section: "kitchen_dashboard",
        },
        {
          name: "Service / Delivery",
          href: "/admin/food-orders",
          icon: ShoppingBagIcon,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          section: "kitchen_active_orders",
        },
        {
          name: "Order History",
          href: "/admin/kitchen/history",
          icon: ClipboardDocumentListIcon,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          section: "kitchen_history",
        },
      ],
      defaultOpen: true,
    },
    {
      name: "Bar",
      icon: BeakerIcon,
      items: [
        {
          name: "Dashboard",
          href: "/admin/bar-orders",
          icon: HomeIcon,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          section: "bar_dashboard",
        },
        {
          name: "Service / Delivery",
          href: "/admin/bar-orders/service",
          icon: ShoppingBagIcon,
          color: "text-pink-600",
          bgColor: "bg-pink-50",
          section: "bar_active_orders",
        },
        {
          name: "Order History",
          href: "/admin/bar-orders/history",
          icon: ClipboardDocumentListIcon,
          color: "text-indigo-500",
          bgColor: "bg-indigo-50",
          section: "bar_history",
        },
      ],
      defaultOpen: true,
    },
    {
      name: "Menu",
      icon: ClipboardDocumentListIcon,
      items: [
        {
          name: "Menu Items",
          href: "/admin/menu",
          icon: BeakerIcon,
          color: "text-rose-500",
          bgColor: "bg-rose-50",
          section: "menu_items",
        },
        {
          name: "Recipes / Costing",
          href: "/admin/menu/recipes",
          icon: BeakerIcon,
          color: "text-purple-500",
          bgColor: "bg-purple-50",
          section: "menu_recipes",
        },
      ],
      defaultOpen: true,
      isSingleItem: false, // changed to false to show both
    },
    {
      name: "Analytics",
      icon: ChartBarIcon,
      items: [
        {
          name: "F&B Stats",
          href: "/admin/fb-dashboard",
          icon: ChartBarIcon,
          color: "text-teal-500",
          bgColor: "bg-teal-50",
          section: "analytics",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
  ],
  website: [
    {
      name: "Content",
      icon: PhotoIcon,
      items: [
        {
          name: "Gallery",
          href: "/admin/gallery",
          icon: RectangleStackIcon,
          color: "text-cyan-500",
          bgColor: "bg-cyan-50",
          section: "gallery",
        },
        {
          name: "Story Pictures",
          href: "/admin/story-pictures",
          icon: FilmIcon,
          color: "text-amber-500",
          bgColor: "bg-amber-50",
          section: "story pictures",
        },
        {
          name: "Excursions",
          href: "/admin/excursions",
          icon: MapPinIcon,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50",
          section: "excursions",
        },
      ],
      defaultOpen: true,
    },
    {
      name: "Marketing",
      icon: TagIcon,
      items: [
        {
          name: "Offers",
          href: "/admin/offers",
          icon: TagIcon,
          color: "text-red-500",
          bgColor: "bg-red-50",
          section: "offers",
        },
        {
          name: "Testimonials",
          href: "/admin/testimonials",
          icon: ChatBubbleLeftRightIcon,
          color: "text-pink-500",
          bgColor: "bg-pink-50",
          section: "testimonials",
        },
        {
          name: "Reputation",
          href: "/admin/reputation-management",
          icon: StarIcon,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          section: "reputation",
        },
      ],
      defaultOpen: true,
    },
    {
      name: "Inquiries",
      icon: EnvelopeIcon,
      items: [
        {
          name: "Contact Msgs",
          href: "/admin/contacts",
          icon: EnvelopeIcon,
          color: "text-indigo-500",
          bgColor: "bg-indigo-50",
          section: "contact msgs",
        },
        {
          name: "Booking Enquiries",
          href: "/admin/booking-enquiries",
          icon: PhoneIcon,
          color: "text-teal-500",
          bgColor: "bg-teal-50",
          section: "booking enquiries",
        },
      ],
      defaultOpen: true,
    },
  ],
  finance: [
    {
      name: "Overview",
      icon: Squares2X2Icon,
      items: [
        {
          name: "Overview",
          href: "/admin/accounts?tab=overview",
          icon: Squares2X2Icon,
          color: "text-green-600",
          bgColor: "bg-green-50",
          section: "finance_ops",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
    {
      name: "Invoices",
      icon: DocumentTextIcon,
      items: [
        {
          name: "Invoices",
          href: "/admin/accounts?tab=invoices",
          icon: DocumentTextIcon,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          section: "finance_invoices",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
    {
      name: "Bills",
      icon: ShoppingBagIcon,
      items: [
        {
          name: "Bills",
          href: "/admin/accounts?tab=bills",
          icon: ShoppingBagIcon,
          color: "text-red-600",
          bgColor: "bg-red-50",
          section: "finance_bills",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
    {
      name: "Daily Expenses",
      icon: BanknotesIcon,
      items: [
        {
          name: "Daily Expenses",
          href: "/admin/accounts?tab=expenses",
          icon: BanknotesIcon,
          color: "text-rose-600",
          bgColor: "bg-rose-50",
          section: "finance_expenses",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
    {
      name: "Transactions",
      icon: QueueListIcon,
      items: [
        {
          name: "Transactions",
          href: "/admin/accounts?tab=transactions",
          icon: QueueListIcon,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          section: "finance_transactions",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
  ],
  staff: [
    {
      name: "Staff Directory",
      icon: UserGroupIcon,
      items: [
        {
          name: "Staff Directory",
          href: "/admin/staff",
          icon: UserGroupIcon,
          color: "text-cyan-600",
          bgColor: "bg-cyan-50",
          section: "directory",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
    {
      name: "Roles & Permissions",
      icon: ShieldCheckIcon,
      items: [
        {
          name: "Roles & Permissions",
          href: "/admin/roles",
          icon: ShieldCheckIcon,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          section: "roles_permissions",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
    {
      name: "System Users",
      icon: KeyIcon,
      items: [
        {
          name: "System Users",
          href: "/admin/users",
          icon: KeyIcon,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          section: "system_users",
        },
      ],
      defaultOpen: true,
      isSingleItem: true,
    },
  ],
};
