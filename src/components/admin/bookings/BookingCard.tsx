import React, { Fragment } from 'react';
import { Booking } from '@/lib/firestoreService';
import {
    CalendarIcon,
    UserIcon,
    EllipsisVerticalIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

interface BookingCardProps {
    booking: Booking;
    onSelect: (booking: Booking) => void;
    onCheckIn?: (booking: Booking, target?: HTMLElement) => void;
    onCheckOut?: (booking: Booking) => void;
    onStayOver?: (booking: Booking) => void;
    onCancel?: (booking: Booking) => void;
    allowedActions?: ('view' | 'check_in' | 'check_out' | 'stay_over')[];
}

export default function BookingCard({
    booking,
    onSelect,
    onCheckIn,
    onCheckOut,
    onStayOver,
    onCancel,
    allowedActions = ['view']
}: BookingCardProps) {
    // ... existing date logic ...
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Formatting Dates like "01/01/2026 05:30 am"
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();
    };

    const bookingDate = new Date(booking.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const totalAmount = booking.totalAmount || 0;
    const paidAmount = booking.paidAmount || 0;
    const balance = totalAmount - paidAmount;

    return (
        <div
            className="bg-white rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full group/card relative"
            onClick={() => onSelect(booking)}
        >
            {/* Header: Blue Icon + Name + ID */}
            <div className="p-3 flex items-start justify-between">
                <div className="flex gap-3 w-full">
                    {/* Blue Square with Initial */}
                    <div className="h-10 w-10 shrink-0 bg-[#0f172a] text-white flex items-center justify-center font-bold text-lg rounded-sm">
                        {booking.guestDetails.firstName[0]}
                    </div>

                    {/* Guest Name & ID */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#0f172a] uppercase truncate">
                                {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                            </h3>
                            {booking.guestDetails.phone && (
                                <UserIcon className="h-3 w-3 text-gray-400" />
                            )}
                        </div>

                        <div className="text-[11px] text-gray-500 font-medium truncate flex items-center gap-1">
                            {booking.bookingId || booking.id}
                            {booking.guestDetails.phone && (
                                <span className="text-gray-400">| {booking.guestDetails.phone}</span>
                            )}
                        </div>
                    </div>

                    {/* Three Dots Menu */}
                    <Menu as="div" className="relative shrink-0 -mt-1 -mr-1">
                        <Menu.Button onClick={(e) => e.stopPropagation()} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <EllipsisVerticalIcon className="h-5 w-5" />
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
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 user-select-none">
                                <div className="py-1">
                                    {/* VIEW DETAILS is always allowed */}
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button onClick={(e) => { e.stopPropagation(); onSelect(booking); }} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-700`}>
                                                View Details
                                            </button>
                                        )}
                                    </Menu.Item>

                                    {/* CHECK IN: Only if allowed AND status is confirmed */}
                                    {allowedActions.includes('check_in') && booking.status === 'confirmed' && onCheckIn && (
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCheckIn(booking, e.currentTarget as HTMLElement);
                                                    }}
                                                    className={`${active ? 'bg-indigo-50 text-indigo-700' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                                                >
                                                    Check In
                                                </button>
                                            )}
                                        </Menu.Item>
                                    )}

                                    {/* CHECK OUT: Only if allowed AND status is checked_in */}
                                    {allowedActions.includes('check_out') && booking.status === 'checked_in' && onCheckOut && (
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button onClick={(e) => { e.stopPropagation(); onCheckOut(booking); }} className={`${active ? 'bg-red-50 text-red-700' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-700`}>
                                                    Check Out
                                                </button>
                                            )}
                                        </Menu.Item>
                                    )}

                                    {/* STAY OVER: Only if allowed AND status is checked_in */}
                                    {allowedActions.includes('stay_over') && booking.status === 'checked_in' && onStayOver && (
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button onClick={(e) => { e.stopPropagation(); onStayOver(booking); }} className={`${active ? 'bg-blue-50 text-blue-700' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-700`}>
                                                    Stay Over
                                                </button>
                                            )}
                                        </Menu.Item>
                                    )}
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>

            {/* Grid Content */}
            <div className="px-4 pb-4 flex-1">
                {/* Check In / Nights / Check Out Row */}
                <div className="grid grid-cols-3 items-center mb-6">
                    {/* Left: Check In */}
                    <div className="text-left">
                        <div className="font-bold text-gray-700 text-sm">
                            {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-gray-500">
                            {new Date(booking.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                    </div>

                    {/* Center: Nights */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-base font-bold text-gray-800">{nights}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Nights</div>
                    </div>

                    {/* Right: Check Out */}
                    <div className="text-right">
                        <div className="font-bold text-gray-700 text-sm">
                            {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-gray-500">
                            {new Date(booking.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                    </div>
                </div>

                {/* Booking Date & Icons */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Booking Date</span>
                        <span className="text-xs text-gray-700 font-medium">{bookingDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <UserIcon className="h-4 w-4" />
                        <span className="text-xs font-bold">{booking.guests?.adults || 1}</span>
                        {(booking.guests?.children || 0) > 0 && (
                            <>
                                <span className="text-gray-300 text-lg mx-0.5">|</span>
                                <div className="text-[10px] font-bold">{booking.guests?.children}</div>
                            </>
                        )}
                    </div>
                </div>


                {/* Room / Rate Type */}
                <div className="mb-4">
                    <div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Room / Rate Type</div>
                    <div className="text-xs text-gray-800 font-bold uppercase leading-tight">
                        {booking.rooms[0]?.allocatedRoomType || booking.roomNumber || booking.rooms[0]?.suiteType || 'Unassigned'}
                        <span className="text-gray-400 font-normal"> / {booking.rooms[0]?.ratePlan || 'Standard Rate'}</span>
                    </div>
                </div>
            </div>

            {/* Footer: Financials */}
            <div className="border-t border-gray-100 p-3 bg-gray-50/50 rounded-b">
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Total</span>
                        <span className="font-bold text-gray-900">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Paid</span>
                        <span className="font-bold text-gray-900">${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-red-500 font-medium">Balance</span>
                        <span className="font-bold text-red-500">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
