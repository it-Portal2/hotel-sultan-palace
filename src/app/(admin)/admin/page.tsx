"use client";

import React from 'react';
import Link from 'next/link';
import {
    BuildingOfficeIcon,
    GlobeAltIcon,
    CakeIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    ArrowRightIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAdminRole } from '@/context/AdminRoleContext';

export default function AdminPortalSelection() {
    const { adminUser, isFullAdmin, hasPortalAccess } = useAdminRole();

    const portals = [
        {
            id: 'operations',
            name: 'EHMS / Hotel Operations',
            description: 'Daily hotel operations, bookings, front desk, and housekeeping.',
            icon: BuildingOfficeIcon,
            href: '/admin/dashboard',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-100',
            hoverBorder: 'hover:border-orange-300',
            portalKey: 'front_office' // Mapping to RBAC key
        },
        {
            id: 'kitchen',
            name: 'Kitchen & Food Orders',
            description: 'Kitchen dashboard, order management, and menu updates.',
            icon: CakeIcon,
            href: '/admin/kitchen',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-100',
            hoverBorder: 'hover:border-amber-300',
            portalKey: 'kitchen'
        },
        {
            id: 'website',
            name: 'Website Management',
            description: 'Manage gallery, stories, offers, testimonials, and content.',
            icon: GlobeAltIcon,
            href: '/admin/gallery',
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            borderColor: 'border-cyan-100',
            hoverBorder: 'hover:border-cyan-300',
            portalKey: 'settings' // Assuming website falls under settings or its own key if created
        },
        {
            id: 'finance',
            name: 'Accounts & Finance',
            description: 'Financial overview, accounts payable/receivable, and reports.',
            icon: CurrencyDollarIcon,
            href: '/admin/accounts',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-100',
            hoverBorder: 'hover:border-green-300',
            portalKey: 'accounts'
        },
        {
            id: 'staff',
            name: 'Staff & Roles',
            description: 'Manage staff directory, roles, and system access permissions.',
            icon: UserGroupIcon,
            href: '/admin/staff',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-100',
            hoverBorder: 'hover:border-indigo-300',
            portalKey: 'users'
        }
    ];

    const checkAccess = (portalKey: string) => {
        if (isFullAdmin) return true;
        // Fallback for website/others not strictly in RBAC yet or use generic check
        if (hasPortalAccess) return hasPortalAccess(portalKey);
        return false;
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Welcome to <span className="text-[#FF6A00]">Sultan Palace</span> Portal
                </h2>
                <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
                    Select a portal below to access specific management tools.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {portals.map((portal) => {
                    const authorized = checkAccess(portal.portalKey);

                    if (authorized) {
                        return (
                            <Link
                                key={portal.id}
                                href={portal.href}
                                className={`group relative bg-white p-8 rounded-2xl shadow-sm border transaction-all duration-300 hover:shadow-lg ${portal.borderColor} ${portal.hoverBorder}`}
                            >
                                <div className={`absolute top-8 right-8 p-3 rounded-xl ${portal.bgColor} bg-opacity-50 group-hover:bg-opacity-100 transition-all`}>
                                    <portal.icon className={`h-8 w-8 ${portal.color}`} />
                                </div>

                                <div className="mt-4">
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#FF6A00] transition-colors">
                                        {portal.name}
                                    </h3>
                                    <p className="mt-4 text-gray-500 text-sm leading-relaxed min-h-[60px]">
                                        {portal.description}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center text-sm font-medium text-gray-900 group-hover:text-[#FF6A00]">
                                    Enter Portal
                                    <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        );
                    } else {
                        // Disabled View
                        return (
                            <div
                                key={portal.id}
                                className={`relative bg-gray-50 p-8 rounded-2xl border border-gray-200 opacity-70 cursor-not-allowed`}
                            >
                                <div className={`absolute top-8 right-8 p-3 rounded-xl bg-gray-200`}>
                                    <portal.icon className={`h-8 w-8 text-gray-400`} />
                                </div>

                                <div className="mt-4">
                                    <h3 className="text-xl font-bold text-gray-500">
                                        {portal.name}
                                    </h3>
                                    <p className="mt-4 text-gray-400 text-sm leading-relaxed min-h-[60px]">
                                        {portal.description}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center text-sm font-medium text-gray-400">
                                    Access Restricted
                                    <div className="ml-auto group relative flex justify-center">
                                        <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 whitespace-nowrap">
                                            Contact Admin for access
                                        </span>
                                        <span className="h-4 w-4 rounded-full bg-gray-400 text-white text-[10px] flex items-center justify-center font-bold">?</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                })}
            </div>

            <div className="mt-16 text-center">
                <p className="text-sm text-gray-400">
                    Need help? <a href="#" className="text-gray-600 underline hover:text-[#FF6A00]">Contact Support</a> or view <Link href="/admin/docs" className="text-gray-600 underline hover:text-[#FF6A00]">Documentation</Link>.
                </p>
            </div>
        </div>
    );
}
