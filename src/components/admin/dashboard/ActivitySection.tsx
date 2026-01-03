import React, { useState } from 'react';
import {
    ClipboardDocumentIcon,
    CalendarDaysIcon,
    CreditCardIcon,
    ExclamationTriangleIcon,
    PhoneIcon,
    ChatBubbleLeftRightIcon,
    CheckBadgeIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ArrowPathIcon,
    ArchiveBoxIcon,
    UserGroupIcon,
    TagIcon,
    DocumentTextIcon,
    SparklesIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

interface NotificationItem {
    key: string;
    label: string;
    icon: React.ElementType;
    count: number;
}

interface ActivitySectionProps {
    notifications: {
        bookingInquiry: number;
        guestMessage: number;
        walkInGuest: number;
        onlineBooking: number; // New
        activeOffers: number;

        // Retain types for TS compatibility if needed, else remove/ignore in simple component
        // But for cleaner code, we only define what we use:
        [key: string]: number; // Allow flexible props or define explicity
    };
    activities: Array<{
        type: string;
        message: string;
        time: Date;
        status?: string
    }>;
}

export default function ActivitySection({ notifications, activities }: ActivitySectionProps) {
    const [activityFilter, setActivityFilter] = useState('All');

    const allNotifications: NotificationItem[] = [
        { key: 'bookingInquiry', label: 'Inquiries (Today)', icon: CalendarDaysIcon, count: notifications.bookingInquiry },
        { key: 'guestMessage', label: 'Guest Messages', icon: ChatBubbleLeftRightIcon, count: notifications.guestMessage },
        { key: 'walkInGuest', label: 'Walk-in Guests', icon: UserGroupIcon, count: notifications.walkInGuest },
        { key: 'onlineBooking', label: 'Online Bookings', icon: CreditCardIcon, count: notifications.onlineBooking },
        { key: 'activeOffers', label: 'Active Offers', icon: TagIcon, count: notifications.activeOffers },
    ];

    // All these keys are priority as per user request
    const priorityKeys = ['bookingInquiry', 'guestMessage', 'walkInGuest', 'onlineBooking', 'activeOffers'];

    const activeNotifications = allNotifications.filter(n => n.count > 0 || priorityKeys.includes(n.key));

    const filteredActivities = activityFilter === 'All'
        ? activities
        : activities.filter(a => a.status === activityFilter);

    return (
        <div className="flex flex-col gap-6 h-full">

            {/* Top: Critical Alerts Grid */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                {activeNotifications.slice(0, 4).map((item) => (
                    <div key={item.key} className="bg-white p-3 rounded-xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-2 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="p-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg flex-shrink-0">
                            <item.icon className="h-4 w-4 text-[#FF6A00]" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xl font-bold text-gray-800 leading-none mb-0.5">{item.count}</div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom: Activity Feed */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="text-lg font-bold text-gray-800 font-display">Live Activity Feed</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <select
                                className="appearance-none bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/10 hover:border-[#FF6A00]/30 transition-all cursor-pointer shadow-sm"
                                value={activityFilter}
                                onChange={(e) => setActivityFilter(e.target.value)}
                            >
                                <option value="All">All Activities</option>
                                <option value="New Booking">Bookings</option>
                                <option value="Cancellation">Cancellations</option>
                                <option value="User Action">System</option>
                            </select>
                            <ChevronDownIcon className="w-3 h-3 text-gray-400 absolute right-3 top-2.5 pointer-events-none group-hover:text-[#FF6A00]" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                    {filteredActivities.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {filteredActivities.map((activity, index) => (
                                <div key={index} className="p-4 hover:bg-orange-50/30 transition-colors flex gap-4 group">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.status === 'Cancellation' ? 'bg-red-50 text-red-500' :
                                            activity.status === 'New Booking' ? 'bg-emerald-50 text-emerald-500' :
                                                'bg-blue-50 text-blue-500'
                                            }`}>
                                            {activity.status === 'Cancellation' ? <ExclamationTriangleIcon className="w-5 h-5" /> :
                                                activity.status === 'New Booking' ? <CheckCircleIcon className="w-5 h-5" /> :
                                                    <ClipboardDocumentIcon className="w-5 h-5" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#FF6A00] transition-colors">{activity.message}</p>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                {activity.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${activity.status === 'Cancellation' ? 'bg-red-100 text-red-700' :
                                                activity.status === 'New Booking' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {activity.status || 'Info'}
                                            </span>
                                            <span className="text-[10px] text-gray-400">• {activity.time.toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ArchiveBoxIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No recent activity</p>
                            <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
