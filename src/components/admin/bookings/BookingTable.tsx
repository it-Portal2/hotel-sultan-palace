import React, { Fragment } from 'react';
import { Booking } from '@/lib/firestoreService';
import PremiumLoader from '@/components/ui/PremiumLoader';
import {
    CalendarDaysIcon,
    UserIcon,
    EllipsisVerticalIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

interface BookingTableProps {
    bookings: Booking[];
    loading: boolean;
    onSelect: (booking: Booking) => void;
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onCheckIn?: (booking: Booking, target?: HTMLElement) => void;
    onCheckOut?: (booking: Booking) => void;
    onStayOver?: (booking: Booking) => void;
    onCancel?: (booking: Booking) => void;
    onEdit?: (booking: Booking) => void;
}

export default function BookingTable({
    bookings,
    loading,
    onSelect,
    page,
    pageSize,
    total,
    onPageChange,
    onCheckIn,
    onCheckOut,
    onStayOver,
    onCancel,
    onEdit
}: BookingTableProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const getStatusBadge = (status: string) => {
        const styles = {
            confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            pending: 'bg-amber-100 text-amber-800 border-amber-200',
            cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
            checked_in: 'bg-blue-100 text-blue-800 border-blue-200',
            checked_out: 'bg-gray-100 text-gray-800 border-gray-200',
            no_show: 'bg-gray-800 text-white border-gray-700',
            maintenance: 'bg-orange-100 text-orange-800 border-orange-200'
        };
        const label = status.replace('_', ' ').toUpperCase();
        const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${style} uppercase tracking-wider`}>
                {label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex justify-center items-center h-64">
                <PremiumLoader />
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-semibold text-lg mb-1">No Bookings Found</h3>
                <p className="text-gray-500">There are no bookings matching your current filters.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#f8f9fa]">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Guest
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Rooms
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Stay Dates
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Price
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Paid
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Balance
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {bookings.map((booking) => {
                            // Calculate nights
                            const start = new Date(booking.checkIn);
                            const end = new Date(booking.checkOut);
                            const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                            // Fix: Handle cases where paymentStatus is 'paid' but paidAmount is 0
                            const isMarkedPaid = booking.paymentStatus === 'paid' && (booking.paidAmount || 0) === 0;
                            const effectivePaid = isMarkedPaid ? (booking.totalAmount || 0) : (booking.paidAmount || 0);
                            const effectiveBalance = Math.max(0, (booking.totalAmount || 0) - effectivePaid);

                            return (
                                <tr
                                    key={booking.id}
                                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                    onClick={() => onSelect(booking)}
                                >
                                    {/* Guest Column */}
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
                                                {booking.guestDetails.firstName[0]}{booking.guestDetails.lastName[0]}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <span className="truncate max-w-[120px]">{booking.id.slice(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Rooms Column */}
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                            {booking.rooms.map(r => (r.suiteType || r.type).toUpperCase()).join(', ')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {booking.rooms.map(r => {
                                                const mealPlanMap: Record<string, string> = {
                                                    'BB': 'Bed & Breakfast',
                                                    'HB': 'Half Board',
                                                    'FB': 'Full Board'
                                                };
                                                const rateText = r.mealPlan ? mealPlanMap[r.mealPlan] : (r.ratePlan || 'Standard Rate');
                                                return r.suiteType ? (r.type === r.suiteType ? rateText : `${r.type} - ${rateText}`) : rateText;
                                            }).join(', ')}
                                        </div>
                                        {booking.rooms.some(r => r.allocatedRoomType) && (
                                            <div className="text-xs font-mono text-indigo-600 mt-0.5">
                                                #{booking.rooms.map(r => r.allocatedRoomType).join(', #')}
                                            </div>
                                        )}
                                    </td>

                                    {/* Dates Column */}
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex flex-col text-sm text-gray-900">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <span className="font-medium text-gray-700">
                                                    {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                </span>
                                                <ArrowRightIcon className="h-3 w-3 text-gray-400" />
                                                <span className="font-medium text-gray-700">
                                                    {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {nights} Night{nights !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Status Column */}
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        {getStatusBadge(booking.status)}
                                    </td>

                                    {/* Amount Columns */}
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                        <div className="text-sm font-bold text-gray-900">
                                            ${(booking.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                        <div className="text-sm font-medium text-emerald-600">
                                            ${effectivePaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                        <div className={`text-sm font-bold ${effectiveBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                            ${effectiveBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>

                                    {/* Actions Column */}
                                    <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Direct Action Buttons - Only show relevant ones */}
                                            {booking.status === 'confirmed' && onCheckIn && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCheckIn(booking, e.currentTarget);
                                                    }}
                                                    className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white font-bold border border-indigo-200 transition-colors shadow-sm"
                                                >
                                                    Check In
                                                </button>
                                            )}
                                            {booking.status === 'checked_in' && onCheckOut && (
                                                <button
                                                    onClick={() => onCheckOut(booking)}
                                                    className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-800 hover:text-white font-bold border border-gray-200 transition-colors shadow-sm"
                                                >
                                                    Check Out
                                                </button>
                                            )}

                                            {/* Context Menu */}
                                            <Menu as="div" className="relative inline-block text-left">
                                                <Menu.Button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                                    <span className="sr-only">Open options</span>
                                                    <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                                                </Menu.Button>

                                                <Transition
                                                    as={Fragment}
                                                    enter="transition ease-out duration-100"
                                                    enterFrom="transform opacity-0 scale-95"
                                                    enterTo="transform opacity-100 scale-100"
                                                    leave="transition ease-in duration-75"
                                                    leaveFrom="transform opacity-100 scale-100"
                                                    leaveTo="transform opacity-0 scale-95"
                                                >
                                                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 text-left">
                                                        <div className="py-1">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => onSelect(booking)}
                                                                        className={`${active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm`}
                                                                    >
                                                                        View Details
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => onEdit ? onEdit(booking) : onSelect(booking)}
                                                                        className={`${active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm`}
                                                                    >
                                                                        Edit Booking
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                            {booking.status === 'checked_in' && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => onSelect(booking)} // Placeholder: Open details to add service?
                                                                            className={`${active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm`}
                                                                        >
                                                                            Bill Service / Item
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                        </div>
                                                        <div className="py-1">
                                                            {booking.status === 'checked_in' && onStayOver && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => onStayOver(booking)}
                                                                            className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm font-medium`}
                                                                        >
                                                                            <ClockIcon className="mr-2 h-4 w-4 text-blue-500" />
                                                                            Stay Over
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                            {booking.status === 'confirmed' && onCheckIn && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onCheckIn(booking, e.currentTarget as HTMLElement);
                                                                            }}
                                                                            className={`${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm font-bold`}
                                                                        >
                                                                            Check In
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                            {booking.status === 'checked_in' && onCheckOut && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => onCheckOut(booking)}
                                                                            className={`${active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm`}
                                                                        >
                                                                            Check Out
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                            {['pending', 'confirmed', 'walk_in'].includes(booking.status) && onCancel && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => onCancel(booking)}
                                                                            className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600'} group flex w-full items-center px-4 py-2 text-sm`}
                                                                        >
                                                                            Cancel Booking
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                        </div>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium text-gray-900">{Math.min(total, (page - 1) * pageSize + 1)}</span> to{' '}
                            <span className="font-medium text-gray-900">{Math.min(total, page * pageSize)}</span> of{' '}
                            <span className="font-medium text-gray-900">{total}</span> results
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
