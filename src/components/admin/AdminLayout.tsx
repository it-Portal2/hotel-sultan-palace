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
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAdminRoleSync, type AdminRole } from '@/lib/adminRoles';
import { AdminRoleProvider, useAdminRole } from '@/context/AdminRoleContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavigationItem[];
  defaultOpen?: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  requiresFullAdmin?: boolean;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>('readonly');
  const pathname = usePathname();
  const router = useRouter();

  // Organized navigation groups
  const navigationGroups: NavigationGroup[] = [
    {
      name: 'Dashboard',
      icon: Squares2X2Icon,
      items: [
        { name: 'Overview', href: '/admin', icon: HomeIcon, color: 'text-orange-500', bgColor: 'bg-orange-50' },
      ],
      defaultOpen: true
    },
    {
      name: 'Reservations & Bookings',
      icon: ClipboardDocumentListIcon,
      items: [
        { name: 'All Bookings', href: '/admin/bookings', icon: CalendarDaysIcon, color: 'text-purple-500', bgColor: 'bg-purple-50' },
        { name: 'Room Availability', href: '/admin/room-availability', icon: CalendarDaysIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
        { name: 'Booking Enquiries', href: '/admin/booking-enquiries', icon: PhoneIcon, color: 'text-teal-500', bgColor: 'bg-teal-50' },
      ],
      defaultOpen: true
    },
    {
      name: 'Rooms & Inventory',
      icon: BuildingOfficeIcon,
      items: [
        { name: 'Rooms Management', href: '/admin/rooms', icon: BuildingOfficeIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
        { name: 'Room Types', href: '/admin/room-types', icon: BuildingOfficeIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
        { name: 'Add-ons', href: '/admin/addons', icon: PlusIcon, color: 'text-green-500', bgColor: 'bg-green-50' },
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
      name: 'Housekeeping',
      icon: CleaningIcon,
      items: [
        { name: 'Room Status', href: '/admin/room-status', icon: HomeStatusIcon, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { name: 'Housekeeping Tasks', href: '/admin/housekeeping', icon: CleaningIcon, color: 'text-teal-600', bgColor: 'bg-teal-50' },
      ],
      defaultOpen: true
    },
    {
      name: 'Food & Beverage',
      icon: BeakerIcon,
      items: [
        { name: 'Menu Management', href: '/admin/menu', icon: BeakerIcon, color: 'text-rose-500', bgColor: 'bg-rose-50' },
        { name: 'Kitchen Dashboard', href: '/admin/kitchen', icon: BeakerIcon, color: 'text-orange-600', bgColor: 'bg-orange-50' },
        { name: 'Food Orders', href: '/admin/food-orders', icon: ShoppingBagIcon, color: 'text-amber-600', bgColor: 'bg-amber-50' },
      ],
      defaultOpen: true
    },
    {
      name: 'Guest Services',
      icon: WrenchScrewdriverIcon,
      items: [
        { name: 'Service Requests', href: '/admin/guest-services', icon: WrenchScrewdriverIcon, color: 'text-violet-600', bgColor: 'bg-violet-50' },
      ],
      defaultOpen: true
    },
    {
      name: 'Content Management',
      icon: PhotoIcon,
      items: [
        { name: 'Gallery', href: '/admin/gallery', icon: RectangleStackIcon, color: 'text-cyan-500', bgColor: 'bg-cyan-50' },
        { name: 'Story Pictures', href: '/admin/story-pictures', icon: FilmIcon, color: 'text-amber-500', bgColor: 'bg-amber-50' },
        { name: 'Testimonials', href: '/admin/testimonials', icon: ChatBubbleLeftRightIcon, color: 'text-pink-500', bgColor: 'bg-pink-50' },
        { name: 'Offers', href: '/admin/offers', icon: TagIcon, color: 'text-red-500', bgColor: 'bg-red-50' },
        { name: 'Excursions', href: '/admin/excursions', icon: MapPinIcon, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
      ],
      defaultOpen: false
    },
    {
      name: 'Communications',
      icon: EnvelopeIcon,
      items: [
        { name: 'Contacts', href: '/admin/contacts', icon: EnvelopeIcon, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
      ],
      defaultOpen: false
    },
    {
      name: 'Settings',
      icon: Cog6ToothIcon,
      items: [
        { name: 'Admin Users', href: '/admin/admin-users', icon: UserGroupIcon, color: 'text-gray-600', bgColor: 'bg-gray-50', requiresFullAdmin: true },
      ],
      defaultOpen: false
    },
  ];

  const filteredNavigationGroups = useMemo(() => {
    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.requiresFullAdmin) {
          return adminRole === 'full';
        }
        return true;
      })
    })).filter(group => group.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminRole]);

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
        <div className="max-w-md w-full bg-white border border-[#be8c53]/20 rounded-lg p-6 text-center shadow-lg">
          <h1 className="text-2xl font-semibold text-[#202c3b]">Restricted Area</h1>
          <p className="mt-2 text-[#202c3b]/70">You are not authorized to access the admin panel.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/admin/login" className="inline-flex items-center rounded-md bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors">Go to Login</Link>
            <Link href="/" className="inline-flex items-center rounded-md bg-[#be8c53] px-4 py-2 text-sm font-medium text-white hover:bg-[#be8c53]/90 transition-colors">Return to site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminRoleProvider>
      <AdminLayoutContent
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        pathname={pathname}
        adminRole={adminRole}
        userEmail={userEmail}
        navigationGroups={filteredNavigationGroups}
      >
        {children}
      </AdminLayoutContent>
    </AdminRoleProvider>
  );
}

function AdminLayoutContent({
  sidebarOpen,
  setSidebarOpen,
  pathname,
  adminRole,
  userEmail,
  navigationGroups,
  children
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  pathname: string;
  adminRole: AdminRole;
  userEmail: string | null;
  navigationGroups: NavigationGroup[];
  children: React.ReactNode;
}) {
  const { adminUser, isFullAdmin } = useAdminRole();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach(group => {
      initial[group.name] = group.defaultOpen ?? false;
    });
    return initial;
  });

  const roleLabels: Record<string, string> = {
    full: 'Full Admin',
    kitchen: 'Kitchen Staff',
    housekeeping: 'Housekeeping',
    front_desk: 'Check-in',
    manager: 'Manager',
    readonly: 'Read Only',
  };

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const renderNavigation = (onNavClick?: () => void) => {
    return (
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigationGroups.map((group) => {
          const hasActiveItem = group.items.some(item => isItemActive(item.href));
          const isGroupOpen = openGroups[group.name] ?? false;

          return (
            <div key={group.name} className="mb-2">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${hasActiveItem
                  ? 'text-[#FF6A00] bg-[#FF6A00]/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <group.icon className="h-4 w-4" />
                  {sidebarOpen && <span>{group.name}</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Group Items */}
              {isGroupOpen && sidebarOpen && (
                <div className="mt-1 space-y-1 ml-4 border-l-2 border-gray-200 pl-2">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onNavClick}
                        className={`group flex items-center px-3 py-2.5 text-sm font-medium transition-all ${isActive
                          ? 'bg-[#FF6A00] text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF6A00]'
                          }`}
                      >
                        <div className={`mr-3 p-1.5 ${isActive
                          ? 'bg-white/20'
                          : `${item.bgColor} ${item.color}`
                          }`}>
                          <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                        </div>
                        <span className="flex-1">{item.name}</span>
                        {isActive && (
                          <div className="h-2 w-2 bg-white"></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
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
      {/* Sidebar - Fixed position, always visible when open */}
      <div className={`fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 ease-in-out bg-white border-r border-gray-200 shadow-sm z-30 ${sidebarOpen ? 'w-72' : 'w-0'
        } overflow-hidden`}>
        <div className="flex h-16 items-center px-6 border-b border-gray-200 bg-gradient-to-r from-[#FF6A00] to-[#be8c53] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-white">Hotel Management</h1>
                <p className="text-xs text-white/80">Sultan Palace</p>
              </div>
            )}
          </div>
        </div>
        {renderNavigation(handleNavClick)}
      </div>

      {/* Main content - Adjusted for sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'
        }`}>
        {/* Top bar - Full Width Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-x-4 w-full px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="p-2 text-gray-700 hover:text-[#FF6A00] hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            {/* Quick Search - Center */}
            <div className="flex flex-1 justify-center max-w-lg mx-auto">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quick Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Side Icons and Admin Info */}
            <div className="flex items-center gap-x-3 lg:gap-x-4 ml-auto">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              {/* Messages */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <EnvelopeIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-blue-500 rounded-full"></span>
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
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
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
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md border ${adminUser.role === 'full'
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
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50" onClick={(e) => e.stopPropagation()}>
                          <div className="px-4 py-2 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">{adminUser?.name || userEmail.split('@')[0]}</p>
                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                            {adminUser && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md border mt-2 ${adminUser.role === 'full'
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
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <UserCircleIcon className="h-5 w-5 text-gray-600" />
                      {isFullAdmin && <PlusIcon className="h-4 w-4 text-[#FF6A00]" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
