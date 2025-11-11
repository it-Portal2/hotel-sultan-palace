"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  PlusIcon, 
  CalendarDaysIcon,
  SparklesIcon,
  PhotoIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  RectangleStackIcon,
  FilmIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAdminRole, AdminRole } from '@/lib/adminRoles';
import { AdminRoleProvider } from '@/context/AdminRoleContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>('readonly');
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { name: 'Rooms Management', href: '/admin/rooms', icon: BuildingOfficeIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { name: 'Room Types', href: '/admin/room-types', icon: BuildingOfficeIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { name: 'Room Availability', href: '/admin/room-availability', icon: CalendarDaysIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { name: 'Add-ons Management', href: '/admin/addons', icon: PlusIcon, color: 'text-green-500', bgColor: 'bg-green-50' },
    { name: 'Bookings', href: '/admin/bookings', icon: CalendarDaysIcon, color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { name: 'Excursions', href: '/admin/excursions', icon: SparklesIcon, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    { name: 'Testimonials', href: '/admin/testimonials', icon: ChatBubbleLeftRightIcon, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { name: 'Offers', href: '/admin/offers', icon: TagIcon, color: 'text-red-500', bgColor: 'bg-red-50' },
    { name: 'Contacts', href: '/admin/contacts', icon: EnvelopeIcon, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
    { name: 'Booking Enquiries', href: '/admin/booking-enquiries', icon: PhoneIcon, color: 'text-teal-500', bgColor: 'bg-teal-50' },
    { name: 'Story in Pictures', href: '/admin/story-pictures', icon: FilmIcon, color: 'text-amber-500', bgColor: 'bg-amber-50' },
    { name: 'Gallery', href: '/admin/gallery', icon: RectangleStackIcon, color: 'text-cyan-500', bgColor: 'bg-cyan-50' },
  ];

  useEffect(() => {
    if (!auth) {
      setAuthChecked(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const email = user?.email ?? null;
      setUserEmail(email);
      setAdminRole(getAdminRole(email));
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const isAuthorized = useMemo(() => {
    // Allowlist admin emails via env: comma-separated
    const allowList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (allowList.length === 0) {
      // If no allowlist configured, require any signed-in user
      return Boolean(userEmail);
    }
    return userEmail ? allowList.includes(userEmail.toLowerCase()) : false;
  }, [userEmail]);

  const isPublicAdminAuthRoute = useMemo(() => {
    if (!pathname) return false;
    return pathname.startsWith('/admin/login') || pathname.startsWith('/admin/signup');
  }, [pathname]);

  // For auth routes, render children without admin chrome (no sidebar/topbar)
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
    <div className="min-h-screen bg-[#FFFCF6]">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 cursor-pointer" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gradient-to-b from-[#0a1a2b] to-[#1a2a3b]">
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/80 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#FF6A00] text-white shadow-md border-l-4 border-[#FF6A00]'
                      : 'text-[#202c3b]/70 hover:bg-[#FF6A00]/10 hover:text-[#FF6A00] border-l-4 border-transparent'
                  }`}
                >
                  <div className={`mr-3 p-1.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-[#FF6A00]/5 group-hover:bg-[#FF6A00]/10'}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#202c3b]/60 group-hover:text-[#FF6A00]'}`} />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-gradient-to-b from-white to-[#FFFCF6] border-r border-[#be8c53]/20 shadow-lg">
          <div className="flex h-16 items-center px-4 border-b border-[#be8c53]/20 bg-white">
            <h1 className="text-xl font-bold text-[#202c3b]">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#FF6A00] text-white shadow-md border-l-4 border-[#FF6A00]'
                      : 'text-[#202c3b]/70 hover:bg-[#FF6A00]/10 hover:text-[#FF6A00] border-l-4 border-transparent'
                  }`}
                >
                  <div className={`mr-3 p-1.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-[#FF6A00]/5 group-hover:bg-[#FF6A00]/10'}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#202c3b]/60 group-hover:text-[#FF6A00]'}`} />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#be8c53]/20 bg-white/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-[#202c3b] hover:text-[#FF6A00] lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Link
                href="/"
                className="text-sm font-medium text-[#202c3b] hover:text-[#FF6A00] transition-colors"
              >
                Back to Site
              </Link>
              {!userEmail ? (
                <Link
                  href="/admin/login"
                  className="text-sm font-medium text-[#202c3b] hover:text-[#FF6A00] transition-colors"
                >
                  Login
                </Link>
              ) : (
                <>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-[#202c3b]">{userEmail}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {adminRole === 'readonly' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 rounded-md border border-amber-200 shadow-sm">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Read-Only Access
                          </span>
                        )}
                        {adminRole === 'full' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 shadow-sm">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Full Access
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={async () => { if (auth) { await signOut(auth); router.push('/admin/login'); } }}
                    className="text-sm font-medium text-[#202c3b] hover:text-[#FF6A00] transition-colors"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          {adminRole === 'readonly' && (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-lg shadow-sm p-5">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100">
                      <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-semibold text-amber-900 mb-1">
                      Read-Only Access Mode
                    </h3>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      You have view-only access to the admin dashboard. You can browse all data, bookings, and content, but <strong>cannot add, edit, or delete</strong> any information. For full administrative privileges, please contact the primary administrator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {adminRole === 'full' && (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-400 rounded-lg shadow-sm p-5">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100">
                      <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-semibold text-emerald-900 mb-1">
                      Full Administrative Access
                    </h3>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      You have complete access to all administrative features. You can <strong>view, add, edit, and delete</strong> bookings, rooms, gallery images, and all other content. Use this access responsibly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
    </AdminRoleProvider>
  );
}
