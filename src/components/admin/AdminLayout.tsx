"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  BuildingOfficeIcon,
  PlusIcon,
  CalendarDaysIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  RectangleStackIcon,
  FilmIcon,
  TagIcon,
  BeakerIcon,
  ShoppingBagIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  HomeIcon as HomeStatusIcon,
  UserGroupIcon,
  SparklesIcon as CleaningIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  KeyIcon,
  BellIcon,
  PhotoIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  StarIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  TruckIcon,
  WrenchIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAdminRoleSync, type AdminRole } from '@/lib/adminRoles';
import { AdminRoleProvider, useAdminRole } from '@/context/AdminRoleContext';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Portal Types
type PortalType = 'selection' | 'operations' | 'kitchen' | 'website' | 'finance' | 'staff';

interface NavigationGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavigationItem[];
  defaultOpen?: boolean;
  isSingleItem?: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  requiresFullAdmin?: boolean;
}

// Helper to determine portal from path
const getPortalFromPath = (path: string): PortalType => {
  if (path === '/admin') return 'selection';
  if (path.startsWith('/admin/kitchen') || path.startsWith('/admin/food-orders') || path.startsWith('/admin/menu') || path.startsWith('/admin/fb-dashboard')) return 'kitchen';
  if (path.startsWith('/admin/gallery') || path.startsWith('/admin/story-pictures') || path.startsWith('/admin/testimonials') || path.startsWith('/admin/offers') || path.startsWith('/admin/excursions') || path.startsWith('/admin/contacts') || path.startsWith('/admin/reputation-management') || path.startsWith('/admin/booking-enquiries')) return 'website';
  if (path.startsWith('/admin/accounts')) return 'finance';
  if (path.startsWith('/admin/staff') || path.startsWith('/admin/admin-users')) return 'staff';
  return 'operations'; // Default to operations for dashboard, bookings, rooms, etc.
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>('readonly');
  const pathname = usePathname();

  const currentPortal = useMemo(() => getPortalFromPath(pathname), [pathname]);

  // Define Navigation Groups per Portal
  const portalNavigationGroups: Record<PortalType, NavigationGroup[]> = {
    selection: [], // No sidebar for selection
    operations: [
      {
        name: 'Dashboard',
        icon: Squares2X2Icon,
        items: [
          { name: 'Front Desk', href: '/admin/dashboard', icon: HomeIcon, color: 'text-orange-500', bgColor: 'bg-orange-50' },
        ],
        defaultOpen: true,
        isSingleItem: true
      },
      {
        name: 'Reservations',
        icon: ClipboardDocumentListIcon,
        items: [
          { name: 'All Bookings', href: '/admin/bookings', icon: CalendarDaysIcon, color: 'text-purple-500', bgColor: 'bg-purple-50' },
          { name: 'Room Availability', href: '/admin/room-availability', icon: CalendarDaysIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
        ],
        defaultOpen: true
      },

      {
        name: 'Front Office',
        icon: KeyIcon,
        items: [
          { name: 'Check-in', href: '/admin/front-desk', icon: UserGroupIcon, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
          { name: 'Checkout', href: '/admin/checkout', icon: CreditCardIcon, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
        ],
        defaultOpen: true
      },
      {
        name: 'Rooms',
        icon: BuildingOfficeIcon,
        items: [
          { name: 'Room List', href: '/admin/rooms', icon: BuildingOfficeIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
          { name: 'Add-ons', href: '/admin/addons', icon: PlusIcon, color: 'text-green-500', bgColor: 'bg-green-50' },
          { name: 'Room Types', href: '/admin/room-types', icon: BuildingOfficeIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
        ],
        defaultOpen: true
      },

      {
        name: 'Night Audit',
        icon: ClockIcon,
        items: [
          { name: 'Night Audit', href: '/admin/front-desk/night-audit', icon: ClockIcon, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        ],
        defaultOpen: true,
        isSingleItem: true
      },

      {
        name: 'Guest Services',
        icon: WrenchScrewdriverIcon,
        items: [
          { name: 'Guest Services', href: '/admin/guest-services', icon: WrenchScrewdriverIcon, color: 'text-violet-600', bgColor: 'bg-violet-50' },
        ],
        defaultOpen: true,
        isSingleItem: true
      },

      {
        name: 'Housekeeping',
        icon: CleaningIcon,
        items: [
          { name: 'Housekeeping', href: '/admin/housekeeping', icon: CleaningIcon, color: 'text-teal-600', bgColor: 'bg-teal-50' },
        ],
        defaultOpen: true,
        isSingleItem: true
      },

      {
        name: 'Inventory',
        icon: ClipboardDocumentListIcon,
        items: [
          { name: 'Inventory', href: '/admin/inventory', icon: ClipboardDocumentListIcon, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        ],
        defaultOpen: true,
        isSingleItem: true
      },

      {
        name: 'Reports',
        icon: ChartBarIcon,
        items: [
          { name: 'Analytics', href: '/admin/reports', icon: ChartBarIcon, color: 'text-pink-600', bgColor: 'bg-pink-50' },
          { name: 'Accounts', href: '/admin/accounts', icon: CurrencyDollarIcon, color: 'text-green-600', bgColor: 'bg-green-50' }, // Shared link
        ],
        defaultOpen: true,
        isSingleItem: true
      },
    ],
    kitchen: [
      {
        name: 'Kitchen',
        icon: BeakerIcon,
        items: [
          { name: 'Dashboard', href: '/admin/kitchen', icon: HomeIcon, color: 'text-orange-600', bgColor: 'bg-orange-50' },
          { name: 'Active Orders', href: '/admin/food-orders', icon: ShoppingBagIcon, color: 'text-amber-600', bgColor: 'bg-amber-50' },
          { name: 'Order History', href: '/admin/kitchen/history', icon: ClipboardDocumentListIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
        ],
        defaultOpen: true
      },
      {
        name: 'Menu',
        icon: ClipboardDocumentListIcon,
        items: [
          { name: 'Menu Items', href: '/admin/menu', icon: BeakerIcon, color: 'text-rose-500', bgColor: 'bg-rose-50' },
          { name: 'Recipes / Costing', href: '/admin/menu/recipes', icon: BeakerIcon, color: 'text-purple-500', bgColor: 'bg-purple-50' },
        ],
        defaultOpen: true,
        isSingleItem: false // changed to false to show both
      },
      {
        name: 'Analytics',
        icon: ChartBarIcon,
        items: [
          { name: 'F&B Stats', href: '/admin/fb-dashboard', icon: ChartBarIcon, color: 'text-teal-500', bgColor: 'bg-teal-50' },
        ],
        defaultOpen: true,
        isSingleItem: true
      },
    ],
    website: [
      {
        name: 'Content',
        icon: PhotoIcon,
        items: [
          { name: 'Gallery', href: '/admin/gallery', icon: RectangleStackIcon, color: 'text-cyan-500', bgColor: 'bg-cyan-50' },
          { name: 'Story Pictures', href: '/admin/story-pictures', icon: FilmIcon, color: 'text-amber-500', bgColor: 'bg-amber-50' },
          { name: 'Excursions', href: '/admin/excursions', icon: MapPinIcon, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
        ],
        defaultOpen: true
      },
      {
        name: 'Marketing',
        icon: TagIcon,
        items: [
          { name: 'Offers', href: '/admin/offers', icon: TagIcon, color: 'text-red-500', bgColor: 'bg-red-50' },
          { name: 'Testimonials', href: '/admin/testimonials', icon: ChatBubbleLeftRightIcon, color: 'text-pink-500', bgColor: 'bg-pink-50' },
          { name: 'Reputation', href: '/admin/reputation-management', icon: StarIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
        ],
        defaultOpen: true
      },
      {
        name: 'Inquiries',
        icon: EnvelopeIcon,
        items: [
          { name: 'Contact Msgs', href: '/admin/contacts', icon: EnvelopeIcon, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
          { name: 'Booking Enquiries', href: '/admin/booking-enquiries', icon: PhoneIcon, color: 'text-teal-500', bgColor: 'bg-teal-50' },
        ],
        defaultOpen: true
      },
    ],
    finance: [
      {
        name: 'Finance',
        icon: CurrencyDollarIcon,
        items: [
          { name: 'Accounts Overview', href: '/admin/accounts', icon: CurrencyDollarIcon, color: 'text-green-600', bgColor: 'bg-green-50' },
          { name: 'Transactions', href: '/admin/accounts?tab=transactions', icon: ClipboardDocumentListIcon, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        ],
        defaultOpen: true
      },
    ],
    staff: [
      {
        name: 'Staff',
        icon: UserGroupIcon,
        items: [
          { name: 'Directory', href: '/admin/staff', icon: UserGroupIcon, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
          { name: 'Admin Users', href: '/admin/admin-users', icon: KeyIcon, color: 'text-gray-600', bgColor: 'bg-gray-50', requiresFullAdmin: true },
        ],
        defaultOpen: true
      },
    ],
  };

  const filteredNavigationGroups = useMemo(() => {
    const groups = portalNavigationGroups[currentPortal] || [];
    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.requiresFullAdmin) {
          return adminRole === 'full';
        }
        return true;
      })
    })).filter(group => group.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminRole, currentPortal]);

  useEffect(() => {
    if (!auth) {
      setAuthChecked(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const email = user?.email ?? null;
      setUserEmail(email);
      setAdminRole(getAdminRoleSync(email));
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const isAuthorized = useMemo(() => {
    const allowList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (allowList.length === 0) {
      return Boolean(userEmail);
    }
    return userEmail ? allowList.includes(userEmail.toLowerCase()) : false;
  }, [userEmail]);

  const isPublicAdminAuthRoute = useMemo(() => {
    if (!pathname) return false;
    return pathname.startsWith('/admin/login') || pathname.startsWith('/admin/signup');
  }, [pathname]);

  if (isPublicAdminAuthRoute) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  if (!isAuthorized && !isPublicAdminAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF6] px-4">
        <div className="max-w-md w-full bg-white border border-[#be8c53]/20 p-6 text-center shadow-lg">
          <h1 className="text-2xl font-semibold text-[#202c3b]">Restricted Area</h1>
          <p className="mt-2 text-[#202c3b]/70">You are not authorized to access the admin panel.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/admin/login" className="inline-flex items-center bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors">Go to Login</Link>
            <Link href="/" className="inline-flex items-center bg-[#be8c53] px-4 py-2 text-sm font-medium text-white hover:bg-[#be8c53]/90 transition-colors">Return to site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminRoleProvider>
      <SidebarProvider>
        <AdminLayoutContent
          pathname={pathname}
          userEmail={userEmail}
          currentPortal={currentPortal}
          navigationGroups={filteredNavigationGroups}
        >
          {children}
        </AdminLayoutContent>
      </SidebarProvider>
    </AdminRoleProvider>
  );
}

function AdminLayoutContent({
  pathname,
  userEmail,
  currentPortal,
  navigationGroups,
  children
}: {
  pathname: string;
  userEmail: string | null;
  currentPortal: PortalType;
  navigationGroups: NavigationGroup[];
  children: React.ReactNode;
}) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { adminUser, isFullAdmin } = useAdminRole();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Helper to find which group should be open based on current path
  const getInitialOpenGroups = () => {
    const initial: Record<string, boolean> = {};
    let foundActive = false;

    navigationGroups.forEach(group => {
      // Check if this group has the active item
      const hasActiveItem = group.items.some(item =>
        item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
      );

      // If found active group, open it. 
      // Also if it's the very first group and nothing else is active, maybe open it? 
      // User said "open only tab at a time", implying initially active one should be open.
      if (hasActiveItem && !foundActive) {
        initial[group.name] = true;
        foundActive = true;
      } else {
        initial[group.name] = false;
      }
    });

    return initial;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenGroups);

  // Effect to reset open groups when navigationGroups change
  useEffect(() => {
    setOpenGroups(getInitialOpenGroups());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationGroups, pathname]); // Re-eval when path changes to keep sync? checking user intent.. active tab should stay open.

  const roleLabels: Record<string, string> = {
    full: 'Full Admin',
    kitchen: 'Kitchen Staff',
    housekeeping: 'Housekeeping',
    front_desk: 'Check-in',
    manager: 'Manager',
    readonly: 'Read Only',
  };

  const portalTitles: Record<PortalType, string> = {
    selection: 'Portal Selection',
    operations: 'Hotel Operations',
    kitchen: 'Kitchen & Orders',
    website: 'Website Management',
    finance: 'Accounts & Finance',
    staff: 'Staff Management'
  };

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => {
      const isCurrentlyOpen = prev[groupName];
      // Accordion Logic: If not open, open it and close ALL others. If open, just close it.
      const newState: Record<string, boolean> = {};
      navigationGroups.forEach(g => newState[g.name] = false); // Default all to false

      if (!isCurrentlyOpen) {
        newState[groupName] = true;
      }
      return newState;
    });
  };

  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const renderNavigation = (onNavClick?: () => void) => {
    return (
      <nav className="flex-1 space-y-0 px-0 py-4 overflow-y-auto">
        {navigationGroups.map((group) => {
          // If it's a single item group, render as direct link (no dropdown)
          if (group.isSingleItem && group.items.length > 0) {
            const item = group.items[0];
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={group.name}
                href={item.href}
                onClick={onNavClick}
                className={`group flex items-center px-6 py-4 text-sm font-semibold transition-all border-l-4 ${isActive
                  ? 'border-[#FF6A00] bg-orange-50 text-[#FF6A00]'
                  : 'border-transparent text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <div className={`mr-4 ${isActive ? 'text-[#FF6A00]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  <group.icon className="h-5 w-5" />
                </div>
                {sidebarOpen && <span className="flex-1 uppercase tracking-wide text-xs">{group.name}</span>}
              </Link>
            );
          }

          // Multi-item groups render as dropdown
          const hasActiveItem = group.items.some(item => isItemActive(item.href));
          const isGroupOpen = openGroups[group.name] ?? false;

          return (
            <div key={group.name} className="border-b border-gray-100 last:border-0">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center justify-between px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${hasActiveItem
                  ? 'text-[#FF6A00] bg-orange-50/50'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {sidebarOpen && <span>{group.name}</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDownIcon
                    className={`h-3 w-3 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Group Items */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50/30 ${isGroupOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavClick}
                      className={`group flex items-center pl-10 pr-6 py-3 text-sm font-medium transition-all border-l-4 ${isActive
                        ? 'border-[#FF6A00] text-[#FF6A00] bg-orange-50'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    );
  };

  // Close sidebar when navigation item is clicked
  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && currentPortal !== 'selection' && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive: Overlay on mobile, Push on Desktop */}
      {currentPortal !== 'selection' && (
        <div className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out bg-white border-r border-gray-200 shadow-xl md:shadow-sm ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'
          } overflow-hidden`}>
          <div className="flex h-16 items-center px-6 border-b border-gray-200 bg-gradient-to-r from-[#FF6A00] to-[#be8c53] flex-shrink-0">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-white/20">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <h1 className="text-lg font-bold text-white whitespace-nowrap">{portalTitles[currentPortal]}</h1>
                <p className="text-xs text-white/80 whitespace-nowrap">Sultan Palace</p>
              </div>
              {/* Mobile Close Button inside Sidebar Header */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto text-white md:hidden"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          {renderNavigation(handleNavClick)}
        </div>
      )}

      {/* Main content - Responsive Margin */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen && currentPortal !== 'selection' ? 'md:ml-72' : ''
        }`}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-x-4 w-full px-4 sm:px-6 lg:px-8">
            {currentPortal !== 'selection' && (
              <button
                type="button"
                className="p-2 text-gray-700 hover:text-[#FF6A00] hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <XMarkIcon className="h-6 w-6 hidden md:block" /> // Show X only on desktop here, mobile has it in sidebar
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
                {/* Mobile: Hamburger always shows sidebar, back/close is handled by backdrop or sidebar internal close */}
                <Bars3Icon className="h-6 w-6 md:hidden" />
              </button>
            )}

            {/* If selection portal, show logo/branding instead of hamburger */}
            {currentPortal === 'selection' && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FF6A00]/10 rounded-md">
                  <BuildingOfficeIcon className="h-6 w-6 text-[#FF6A00]" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">Sultan Palace <span className="text-[#FF6A00]">Admin</span></span>
              </div>
            )}
            {/* Quick Search - Center */}
            <div className="flex flex-1 justify-center max-w-lg mx-auto">
              <div className="relative w-full">
                <button
                  onClick={() => {
                    const input = document.getElementById('global-search') as HTMLInputElement;
                    if (input?.value.trim()) {
                      router.push(`/admin/bookings?query=${encodeURIComponent(input.value.trim())}`);
                    }
                  }}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </button>
                <input
                  id="global-search"
                  type="text"
                  placeholder="Quick Search (Enter to search)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        router.push(`/admin/bookings?query=${encodeURIComponent(val)}`);
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Right Side Icons and Admin Info */}
            <div className="flex items-center gap-x-3 lg:gap-x-4 ml-auto">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500"></span>
              </button>
              {/* Messages */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <EnvelopeIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-blue-500"></span>
              </button>
              <Link
                href="/"
                className="hidden sm:block text-sm font-medium text-gray-700 hover:text-[#FF6A00] transition-colors"
              >
                Back to Site
              </Link>
              {!userEmail ? (
                <Link
                  href="/admin/login"
                  className="text-sm font-medium text-gray-700 hover:text-[#FF6A00] transition-colors"
                >
                  Login
                </Link>
              ) : (
                <div className="relative">
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors border border-gray-200"
                      >
                        <UserCircleIcon className="h-5 w-5 text-gray-600" />
                        <div className="flex flex-col items-start text-left">
                          {adminUser?.name ? (
                            <span className="text-sm font-semibold text-gray-900">{adminUser.name}</span>
                          ) : (
                            <span className="text-sm font-semibold text-gray-900">{userEmail.split('@')[0]}</span>
                          )}
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">{userEmail}</span>
                        </div>
                        {adminUser && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border ${adminUser.role === 'full'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : adminUser.role === 'manager'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : adminUser.role === 'kitchen'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : adminUser.role === 'housekeeping'
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                                  : adminUser.role === 'front_desk'
                                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            {roleLabels[adminUser.role] || 'Read Only'}
                          </span>
                        )}
                        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg border border-gray-200 py-2 z-50" onClick={(e) => e.stopPropagation()}>
                          <div className="px-4 py-2 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">{adminUser?.name || userEmail.split('@')[0]}</p>
                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                            {adminUser && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border mt-2 ${adminUser.role === 'full'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : adminUser.role === 'manager'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : adminUser.role === 'kitchen'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : adminUser.role === 'housekeeping'
                                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                                      : adminUser.role === 'front_desk'
                                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                {roleLabels[adminUser.role] || 'Read Only'}
                              </span>
                            )}
                          </div>

                          {isFullAdmin && (
                            <>
                              <Link
                                href="/admin/admin-users"
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <UserGroupIcon className="h-4 w-4" />
                                Manage Admin Users
                              </Link>
                              <div className="border-t border-gray-200 my-1"></div>
                            </>
                          )}

                          <button
                            onClick={async () => {
                              if (auth) {
                                await signOut(auth);
                                router.push('/admin/login');
                              }
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:hidden">
                    <button
                      onClick={() => router.push(isFullAdmin ? '/admin/admin-users' : '#')}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircleIcon className="h-5 w-5 text-gray-600" />
                      {isFullAdmin && <PlusIcon className="h-4 w-4 text-[#FF6A00]" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* If NOT selection, show back to portal button in the right actions */}
            {currentPortal !== 'selection' && (
              <div className="ml-4 lg:ml-6 flex items-center">
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-semibold text-[#FF6A00] bg-[#FF6A00]/5 hover:bg-[#FF6A00]/10 border border-[#FF6A00]/20 rounded transition-colors"
                >
                  Switch Portal
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            {children}
          </div>
        </main>
      </div>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </div>
  );
}
