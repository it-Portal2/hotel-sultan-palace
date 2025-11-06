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

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { name: 'Rooms Management', href: '/admin/rooms', icon: BuildingOfficeIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' },
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
      setUserEmail(user?.email ?? null);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthorized && !isPublicAdminAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 text-center shadow">
          <h1 className="text-2xl font-semibold text-gray-900">Restricted Area</h1>
          <p className="mt-2 text-gray-600">You are not authorized to access the admin panel.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/admin/login" className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Go to Login</Link>
            <Link href="/" className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Return to site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
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
                      ? `${item.bgColor} ${item.color} shadow-md border-l-4 ${item.color.replace('text-', 'border-')}`
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
                  }`}
                >
                  <div className={`mr-3 p-1.5 rounded-md ${isActive ? item.bgColor : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-700'}`} />
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
        <div className="flex flex-grow flex-col overflow-y-auto bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-sm">
          <div className="flex h-16 items-center px-4 border-b border-gray-200 bg-white">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
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
                      ? `${item.bgColor} ${item.color} shadow-md border-l-4 ${item.color.replace('text-', 'border-')}`
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
                  }`}
                >
                  <div className={`mr-3 p-1.5 rounded-md ${isActive ? item.bgColor : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-700'}`} />
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
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Back to Site
              </Link>
              {!userEmail ? (
                <Link
                  href="/admin/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Login
                </Link>
              ) : (
                <>
                  <span className="hidden sm:inline text-sm text-gray-600">{userEmail}</span>
                  <button
                    onClick={async () => { if (auth) { await signOut(auth); router.push('/admin/login'); } }}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
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
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
