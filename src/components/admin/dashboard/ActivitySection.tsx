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
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface NotificationItem {
    key: string;
    label: string;
    icon: React.ElementType;
    count: number;
}

interface ActivitySectionProps {
    notifications: {
        workOrder: number;
        bookingInquiry: number;
        paymentFailed: number;
        overbooking: number;
        guestPortal: number;
        guestMessage: number;
        cardVerificationFailed: number;
        tasks: number;
        review: number;
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
        { key: 'workOrder', label: 'Work Order', icon: ClipboardDocumentIcon, count: notifications.workOrder },
        { key: 'bookingInquiry', label: 'Booking Inquiry', icon: CalendarDaysIcon, count: notifications.bookingInquiry },
        { key: 'paymentFailed', label: 'Payment Failed', icon: CreditCardIcon, count: notifications.paymentFailed },
        { key: 'overbooking', label: 'Overbooking', icon: ExclamationTriangleIcon, count: notifications.overbooking },
        { key: 'guestPortal', label: 'Guest Portal', icon: PhoneIcon, count: notifications.guestPortal },
        { key: 'guestMessage', label: 'Guest Message', icon: ChatBubbleLeftRightIcon, count: notifications.guestMessage },
        { key: 'cardVerificationFailed', label: 'Card Verification', icon: CreditCardIcon, count: notifications.cardVerificationFailed },
        { key: 'tasks', label: 'Tasks', icon: CheckBadgeIcon, count: notifications.tasks },
        { key: 'review', label: 'Review', icon: CheckCircleIcon, count: notifications.review }
    ];

    const activeNotifications = allNotifications.filter(n => n.count > 0 || ['bookingInquiry', 'guestMessage', 'workOrder'].includes(n.key));

    const filteredActivities = activityFilter === 'All'
        ? activities
        : activities.filter(a => a.status === activityFilter);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notifications */}
            <div className="bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Notifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                    {activeNotifications.map((item) => (
                        <div key={item.key} className="flex items-start group">
                            <div className="mr-3 mt-1 p-2 bg-gray-50 group-hover:bg-[#FF6A00]/10 transition-colors">
                                <item.icon className="h-5 w-5 text-gray-500 group-hover:text-[#FF6A00] transition-colors" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-gray-800 leading-none group-hover:text-[#FF6A00] transition-colors">{item.count}</div>
                                <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                            </div>
                        </div>
                    ))}
                    {activeNotifications.length === 0 && (
                        <div className="col-span-3 text-center text-gray-400 text-sm py-8">
                            No new notifications
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Feeds */}
            <div className="bg-white p-6 shadow-sm border border-gray-100 flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Activity Feed</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                className="appearance-none bg-gray-50 border border-transparent hover:border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 transition-all cursor-pointer"
                                value={activityFilter}
                                onChange={(e) => setActivityFilter(e.target.value)}
                            >
                                <option value="All">All Activities</option>
                                <option value="New Booking">New Bookings</option>
                                <option value="Modification">Modifications</option>
                                <option value="Cancellation">Cancellations</option>
                                <option value="User Action">User Actions</option>
                            </select>
                            <ChevronDownIcon className="w-3 h-3 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
                        </div>
                        <button className="p-1.5 text-gray-400 hover:text-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors">
                            <ArrowPathIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px] scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                    {filteredActivities.length > 0 ? (
                        filteredActivities.map((activity, index) => (
                            <div key={index} className="flex gap-4 p-3 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.status === 'Cancellation' ? 'bg-red-500' :
                                    activity.status === 'New Booking' ? 'bg-emerald-500' :
                                        activity.status === 'User Action' ? 'bg-blue-500' : 'bg-gray-400'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 leading-snug break-words">
                                        {activity.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] text-gray-400 bg-white border border-gray-100 px-2 py-0.5">
                                            {activity.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {activity.time.toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-400 text-sm py-12 flex flex-col items-center">
                            <div className="w-12 h-12 bg-gray-50 flex items-center justify-center mb-3">
                                <ClipboardDocumentIcon className="h-6 w-6 text-gray-300" />
                            </div>
                            No activities found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
