"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  ReceiptPercentIcon,
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
  ListBulletIcon,
  ShoppingCartIcon,

  ClipboardDocumentCheckIcon,
  LockClosedIcon,
  BuildingOffice2Icon,
  ChartPieIcon,
  GlobeAltIcon,
  XCircleIcon,
  UserIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { UserIcon as UserIconSolid } from '@heroicons/react/24/solid';
import { FaUserSlash as userSlashIcon } from 'react-icons/fa';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAdminRoleSync, type AdminRole } from '@/lib/adminRoles';
import { useAdminRole } from '@/context/AdminRoleContext';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

import {
  type PortalType,
  type NavigationGroup,
  type NavigationItem,
  portalNavigationGroups
} from '@/lib/adminNavigation';

// Helper to determine portal from path
const getPortalFromPath = (path: string): PortalType => {
  // Normalize path by removing trailing slash if present (except for root '/')
  const normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

  if (normalizedPath === '/admin') return 'selection';
  if (normalizedPath.startsWith('/admin/kitchen') || normalizedPath.startsWith('/admin/food-orders') || normalizedPath.startsWith('/admin/menu') || normalizedPath.startsWith('/admin/fb-dashboard')) return 'kitchen';
  if (normalizedPath.startsWith('/admin/gallery') || normalizedPath.startsWith('/admin/story-pictures') || normalizedPath.startsWith('/admin/testimonials') || normalizedPath.startsWith('/admin/offers') || normalizedPath.startsWith('/admin/excursions') || normalizedPath.startsWith('/admin/contacts') || normalizedPath.startsWith('/admin/reputation-management') || normalizedPath.startsWith('/admin/booking-enquiries')) return 'website';
  if (normalizedPath.startsWith('/admin/accounts')) return 'finance';
  if (normalizedPath.startsWith('/admin/staff') || normalizedPath.startsWith('/admin/users') || normalizedPath.startsWith('/admin/roles')) return 'staff';
  return 'operations'; // Default to operations for dashboard, bookings, rooms, etc.
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { adminUser, userEmail, isLoading: isRoleLoading, hasSectionAccess } = useAdminRole();
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();

  // Update auth check when role context is ready
  useEffect(() => {
    if (!isRoleLoading) {
      setAuthChecked(true);
    }
  }, [isRoleLoading]);

  const currentPortal = useMemo(() => getPortalFromPath(pathname), [pathname]);



  const filteredNavigationGroups = useMemo(() => {
    const groups = portalNavigationGroups[currentPortal] || [];
    return groups.map(group => ({
      ...group,
      items: group.items.map(item => {
        let isLocked = false;

        // Legacy fallback
        if (item.requiresFullAdmin) {
          if (!(adminUser?.role === 'super_admin' || adminUser?.role === 'manager')) {
            isLocked = true;
          }
        }

        // Granular Check
        const portal = currentPortal;
        const actualPortalKey = portal === 'operations' ? 'front_office' : portal;

        let hasAccess = true;

        if (item.section) {
          hasAccess = hasSectionAccess(actualPortalKey, item.section);
        } else {
          // Fallback for items without explicit section tag
          const groupToSection: Record<string, string> = {
            'Dashboard': 'dashboard',
            'Reservations': 'reservations',
            'Front Office': 'front_office',
            'Rooms': 'rooms',
            'Night Audit': 'night_audit',
            'Guest Services': 'guest_services',
            'Housekeeping': 'housekeeping',
            'Inventory': 'inventory',
            'Reports': 'reports',
            'Kitchen': 'kitchen_dashboard',
            'Menu': 'menu_management',
            'Analytics': 'analytics',
            'Content': 'content',
            'Marketing': 'marketing',
            'Inquiries': 'inquiries',
            'Finance': 'finance_dashboard',
            'Staff': 'directory'
          };

          const inferredSection = groupToSection[group.name];
          if (inferredSection) {
            hasAccess = hasSectionAccess(actualPortalKey, inferredSection);
          }
        }

        if (!hasAccess) isLocked = true;

        return { ...item, locked: isLocked };
      })
    }));
    // removed .filter(group => group.items.length > 0) so even locked items show up
  }, [adminUser, currentPortal, hasSectionAccess]);



  const isAuthorized = useMemo(() => {
    // 1. Legacy Check (Env Var)
    const allowList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const legacyAuth = userEmail ? allowList.includes(userEmail.toLowerCase()) : false;

    // 2. Firestore Check (adminUser object exists)
    const firestoreAuth = !!adminUser;

    // 3. Fallback: If env var list is empty, treat any logged in user as potentially authorized (dangerous, but matching legacy logic if env is missing)
    // Actually, safer to deny if strict. But let's stick to: "If allowList is empty, rely on presence of userEmail?" -> No, that's unsafe.
    // If allowList is empty and no adminUser, deny.

    return legacyAuth || firestoreAuth;
  }, [userEmail, adminUser]);

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
  const searchParams = useSearchParams();
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


    const newInitial = getInitialOpenGroups();

    setOpenGroups(prev => {
      const nextState = { ...prev };


      return newInitial;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationGroups, pathname]);

  const roleLabels: Record<string, string> = {
    super_admin: 'System Administrator',
    manager: 'Manager',
    receptionist: 'Front Desk',
    chef: 'Head Chef',
    housekeeper: 'Housekeeping',
    auditor: 'Night Auditor',
    accountant: 'Accountant',
    custom: 'Staff Member',
    // Legacy support
    full: 'Full Admin',
    kitchen: 'Kitchen Staff',
    housekeeping_legacy: 'Housekeeping',
    front_desk: 'Check-in',
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
    // Split href into path and query
    const [targetPath, targetQueryString] = href.split('?');

    // 1. Base Path Check
    const isPathMatch = targetPath === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(targetPath);

    if (!isPathMatch) return false;

    // 2. Query Param Check (if href has specific params)
    // 2. Query Param Check (if href has specific params)
    if (targetQueryString) {
      if (!searchParams) return false;
      const targetParams = new URLSearchParams(targetQueryString);

      // Strict Check: All params in target must be present and equal in current searchParams
      for (const [key, value] of Array.from(targetParams.entries())) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }

    return true;
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
                    item.locked ? (
                      <div
                        key={item.name}
                        className="group flex items-center pl-10 pr-4 py-3 text-sm font-medium border-l-4 border-transparent text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                        title="Access Restricted - Contact Administrator"
                      >
                        <span className="flex-1">{item.name}</span>
                        <LockClosedIcon className="h-4 w-4 text-gray-400 ml-2" />
                      </div>
                    ) : (
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
                    )
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    );
  };

  // Check if current route is restricted
  const isRestricted = useMemo(() => {
    // If we are on the selection page, never restrict (it handles its own logic/visibility)
    if (currentPortal === 'selection') return false;

    // Find the active navigation item corresponding to this page
    for (const group of navigationGroups) {
      const item = group.items.find(i => isItemActive(i.href));
      if (item && item.locked) {
        return true;
      }
    }
    return false;
  }, [navigationGroups, pathname, currentPortal]);

  // Close sidebar when navigation item is clicked
  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Backdrop */}
      {/* Overlay Backdrop - Visible on all screen sizes when sidebar is open */}
      {/* Backdrop Removed as per user request */}

      {/* Sidebar - Responsive: Overlay on mobile, Push on Desktop */}
      {currentPortal !== 'selection' && (
        <div className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out bg-white border-r border-gray-200 shadow-xl md:shadow-sm print:hidden ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'
          } overflow-hidden`}>
          <div className="flex h-16 items-center px-6 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-3 w-full">
              <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-orange-50 text-[#FF6A00]">
                <BuildingOfficeIcon className="h-5 w-5" />
              </div>
              <div className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <h1 className="text-sm font-bold text-gray-900 tracking-tight whitespace-nowrap">{portalTitles[currentPortal]}</h1>
              </div>
              {/* Close Button - Visible on all devices */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          {renderNavigation(handleNavClick)}
        </div>
      )}

      {/* Main content - No margin shift (Overlay mode) */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 print:ml-0 print:w-full">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white shadow-sm print:hidden">
          <div className="flex items-center gap-x-4 w-full px-4 sm:px-6 lg:px-8">
            {currentPortal !== 'selection' && (
              <button
                type="button"
                className="p-2 text-gray-700 hover:text-[#FF6A00] hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <XMarkIcon className="h-6 w-6 hidden md:block" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
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
              {/* Notifications - Links to Dashboard/Activity */}
              <Link
                href="/admin/dashboard"
                className="relative p-2 text-gray-400 hover:text-[#FF6A00] transition-colors"
                title="View Notifications"
              >
                <BellIcon className="h-5 w-5" />
              </Link>

              {/* Messages - Links to Contact Messages */}
              <Link
                href="/admin/contacts"
                className="relative p-2 text-gray-400 hover:text-[#FF6A00] transition-colors"
                title="View Messages"
              >
                <EnvelopeIcon className="h-5 w-5" />
              </Link>

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
                        {/* Only show role badge if it differs significantly from the name, or just keep it simple. 
                            User complained about "System Administrator" appearing twice. 
                            If name IS "System Administrator", don't show the badge. 
                        */}
                        {adminUser && adminUser.name !== 'System Administrator' && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border rounded bg-gray-100 text-gray-700 border-gray-200`}>
                            {roleLabels[adminUser.role] || adminUser.role}
                          </span>
                        )}
                        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg border border-gray-200 py-2 z-50" onClick={(e) => e.stopPropagation()}>
                          <div className="px-4 py-2 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">{adminUser?.name || userEmail.split('@')[0]}</p>
                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                            {adminUser && adminUser.name !== 'System Administrator' && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border mt-2 rounded bg-gray-100 text-gray-700 border-gray-200`}>
                                {roleLabels[adminUser.role] || adminUser.role}
                              </span>
                            )}
                          </div>



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
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            {isRestricted ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <LockClosedIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
                <p className="text-gray-500 mt-2 max-w-md">
                  You do not have permission to view this section. Please contact your system administrator if you believe this is an error.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              children
            )}
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
