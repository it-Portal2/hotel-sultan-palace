import React, { useState, useEffect, useMemo } from 'react';
import {
    getRoomStatuses,
    getRoomTypes,
    getRooms,
    RoomStatus,
    RoomType,
    getAllBookings,
    Booking,
    SuiteType
} from '@/lib/firestoreService';
import {
    FaBed, // Clean/Vacant
    FaBroom, // Dirty
    FaUser, // Occupied (Icon)
    FaTools, // Maintenance
    FaBan, // Blocked
    FaCheckCircle, // Reserved
    FaDoorOpen, // Due Out/Vacant
    FaClock // Due Out
} from 'react-icons/fa';
import {
    CalendarDaysIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import RoomDetailsModal from '@/components/admin/housekeeping/RoomDetailsModal';

interface RoomViewGridProps {
    isReadOnly: boolean;
}

const SUITE_TYPES: SuiteType[] = ['Garden Suite', 'Imperial Suite', 'Ocean Suite'];

export default function RoomViewGrid({ isReadOnly }: RoomViewGridProps) {
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [statuses, setStatuses] = useState<RoomStatus[]>([]);
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSuite, setFilterSuite] = useState<string>('all');
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [r, s, b] = await Promise.all([
                getRoomTypes(),
                getRoomStatuses(),
                getAllBookings()
            ]);
            setRooms(r);
            setStatuses(s);
            setAllBookings(b);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Normalize Date Helper
    const normalizeDate = (d: string | Date) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date;
    };

    // DATE RANGE LOGIC HELPER (From RoomAvailability)
    const isDateInRange = (d: number, start: number, end: number) => {
        return d >= start && d < end;
    };

    const summaryStats = useMemo(() => {
        const totalRoomsCount = rooms.length || 15;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        let vacant = 0;
        let occupied = 0;
        let reserved = 0;
        let blocked = 0;
        let dueOut = 0;
        const dirty = statuses.filter(rs => rs.housekeepingStatus === 'dirty').length;

        rooms.forEach((room) => {
            // 1. Check for Active Booking (Occupied/Reserved/DueOut) including MAINTENANCE type bookings
            const booking = allBookings.find(b => {
                if (b.status === 'cancelled' || b.status === 'no_show') return false;
                // Matches Room
                if (!b.rooms.some(r => r.allocatedRoomType === room.roomName || r.type === room.roomName)) return false;

                const start = normalizeDate(b.checkIn).getTime();
                const end = normalizeDate(b.checkOut).getTime();

                // Standard Overlap [Start, End)
                return isDateInRange(todayTime, start, end);
            });

            // 2. Check Blocks (Maintenance) Logic from RoomAvailability
            const roomStatus = statuses.find(rs => rs.roomName === room.roomName);
            let isInMaintenance = false;

            if (roomStatus?.status === 'maintenance') {
                // DATE CHECK for Status-Based Maintenance (Fixing Frangipani issue)
                if (roomStatus.maintenanceStartDate && roomStatus.maintenanceEndDate) {
                    const mStart = normalizeDate(roomStatus.maintenanceStartDate).getTime();
                    const mEnd = normalizeDate(roomStatus.maintenanceEndDate).getTime();
                    if (isDateInRange(todayTime, mStart, mEnd)) {
                        isInMaintenance = true;
                    }
                } else {
                    // Fallback if no dates, assume active
                    isInMaintenance = true;
                }
            }

            // Stats Increment
            if (booking) {
                const status = booking.status;
                const checkOutDate = normalizeDate(booking.checkOut);
                const isDueOut = checkOutDate.getTime() === todayTime;

                // MAINTENANCE BOOKING FIX (Hibiscus issue)
                if (status === 'maintenance') {
                    blocked++;
                } else if (status === 'checked_in') {
                    // It is Occupied
                    occupied++;



                    if (isDueOut) {
                        dueOut++;
                    }
                } else if (status === 'confirmed') {
                    reserved++;

                    vacant++;
                } else {
                    occupied++;
                }
            } else {

                const dueOutBooking = allBookings.find(b => {
                    if (b.status !== 'checked_in') return false;
                    // Matches Room
                    if (!b.rooms.some(r => r.allocatedRoomType === room.roomName || r.type === room.roomName)) return false;
                    return normalizeDate(b.checkOut).getTime() === todayTime;
                });

                const isClean = statuses.find(s => s.roomName === room.roomName)?.housekeepingStatus === 'clean';

                if (dueOutBooking) {
                    // It is occupied (checked in)
                    occupied++;
                    dueOut++;
                } else if (isInMaintenance) {
                    blocked++;
                } else {
                    vacant++;
                }
            }
        });


        return { totalRooms: totalRoomsCount, vacant, occupied, reserved, blocked, dirty, dueOut };
    }, [rooms, allBookings, statuses]);


    // Determine Room Visual State
    const getRoomVisuals = (room: RoomType) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        const roomStatus = statuses.find(s => s.roomName === room.roomName);
        const housekeeping = roomStatus?.housekeepingStatus || 'clean';

        // Use matching logic to finding active booking
        const booking = allBookings.find(b => {
            if (b.status === 'cancelled' || b.status === 'no_show') return false;
            if (!b.rooms.some(r => r.allocatedRoomType === room.roomName || r.type === room.roomName)) return false;

            const start = normalizeDate(b.checkIn).getTime();
            const end = normalizeDate(b.checkOut).getTime();

            // Check inclusive to catch Due Out today if checked_in
            if (normalizeDate(b.checkOut).getTime() === todayTime && b.status === 'checked_in') return true;

            return isDateInRange(todayTime, start, end);
        });

        let status: 'vacant' | 'occupied' | 'reserved' | 'blocked' | 'due_out' = 'vacant';
        let colorClass = 'bg-green-50 text-green-700 border-green-200'; // Vacant Default
        let label = 'Vacant';
        let icon = <FaBed className="w-5 h-5 mx-auto" />;

        // Priority Logic matches RoomAvailability

        // 1. Maintenance Logic (Date Checked)
        let isMaintenanceStatus = false;
        if (roomStatus?.status === 'maintenance') {
            if (roomStatus.maintenanceStartDate && roomStatus.maintenanceEndDate) {
                const mStart = normalizeDate(roomStatus.maintenanceStartDate).getTime();
                const mEnd = normalizeDate(roomStatus.maintenanceEndDate).getTime();
                if (isDateInRange(todayTime, mStart, mEnd)) {
                    isMaintenanceStatus = true;
                }
            } else {
                isMaintenanceStatus = true;
            }
        }


        if (booking) {
            // Handling Booking Types
            if (booking.status === 'maintenance') {
                // This is a "Maintenance Block" booking (Hibiscus)
                status = 'blocked';
                colorClass = 'bg-gray-100 text-gray-600 border-gray-200';
                label = 'Blocked';
                icon = <FaTools className="w-5 h-5 mx-auto opacity-50" />;
            } else if (booking.status === 'stay_over') {
                status = 'occupied'; // Treat as occupied for filters
                colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
                label = 'Stay Over';
                icon = <FaUser className="w-5 h-5 mx-auto" />;
            } else {
                const checkOutDate = normalizeDate(booking.checkOut);
                const isDueOut = checkOutDate.getTime() === today.getTime();

                if (booking.status === 'checked_in') {

                    if (isDueOut && housekeeping !== 'clean') {
                        status = 'due_out';
                        colorClass = 'bg-red-50 text-red-700 border-red-200';
                        label = 'Due Out';
                        icon = <FaClock className="w-5 h-5 mx-auto" />;
                    } else {
                        status = 'occupied';
                        colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
                        label = 'Occupied';
                        icon = <FaUser className="w-5 h-5 mx-auto" />;
                    }
                } else if (booking.status === 'confirmed') {
                    status = 'reserved';
                    colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                    label = 'Reserved';
                    icon = <FaCheckCircle className="w-5 h-5 mx-auto" />;
                }
            }
        } else if (isMaintenanceStatus) {
            // No booking, but maintenance status is active (Date Checked)
            status = 'blocked';
            // Lighter style matching other cards (Pastel Gray)
            colorClass = 'bg-gray-100 text-gray-600 border-gray-300';
            label = 'Maintenance';
            icon = <FaTools className="w-5 h-5 mx-auto opacity-60" />;
        } else if (housekeeping === 'dirty') {
            // Vacant & Dirty
            colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
            label = 'Dirty';
            icon = <FaBroom className="w-5 h-5 mx-auto" />;
        }

        return { status, colorClass, label, icon, booking, housekeeping };
    };


    const filteredRooms = rooms.filter(room => {
        const visuals = getRoomVisuals(room);

        if (filterSuite !== 'all' && room.suiteType !== filterSuite) return false;

        if (filterStatus === 'all') return true;
        if (filterStatus === 'vacant') return visuals.status === 'vacant';
        if (filterStatus === 'occupied') return visuals.status === 'occupied' || visuals.status === 'due_out';
        if (filterStatus === 'reserved') return visuals.status === 'reserved';
        if (filterStatus === 'blocked') return visuals.status === 'blocked';
        if (filterStatus === 'due_out') return visuals.status === 'due_out';
        if (filterStatus === 'dirty') return visuals.housekeeping === 'dirty';

        return true;
    });

    // Prepare data for the selected room modal
    const selectedRoomData = useMemo(() => {
        if (!selectedRoomName) return null;
        const room = rooms.find(r => r.roomName === selectedRoomName);
        if (!room) return null;

        // Use the same visual logic to find the ACTIVE booking for this room
        const { booking } = getRoomVisuals(room);

        return {
            room,
            booking
        };
    }, [selectedRoomName, rooms, allBookings, statuses]);

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading Room View...</div>;
    }

    return (
        <div className="space-y-4 font-sans">
            {/* Unified Controls Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 flex-shrink-0 z-30 shadow-sm rounded-lg border sticky top-0">
                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">

                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-2 py-1.5 shadow-sm flex-shrink-0">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-700 min-w-[90px]">{currentDate.toLocaleDateString()}</span>
                    </div>

                    <div className="h-6 w-px bg-gray-200 flex-shrink-0"></div>

                    {/* Stats Pills - Oval Style */}
                    <div className="flex items-center gap-4 text-sm font-medium flex-nowrap">
                        <button onClick={() => setFilterStatus('all')} className={`flex items-center gap-1.5 rounded-full px-3 py-1 shadow-sm whitespace-nowrap transition-all ${filterStatus === 'all' ? 'ring-2 ring-gray-400' : ''} bg-gray-100 text-gray-600 border border-gray-200`}>
                            <span>All</span>
                            <span className="font-bold text-gray-900">{summaryStats.totalRooms}</span>
                        </button>
                        <button onClick={() => setFilterStatus('vacant')} className={`flex items-center gap-1.5 rounded-full px-3 py-1 shadow-sm whitespace-nowrap transition-all ${filterStatus === 'vacant' ? 'ring-2 ring-green-400' : ''} bg-green-50 text-green-700 border border-green-100`}>
                            <span>Vacant</span>
                            <span className="font-bold text-green-900">{summaryStats.vacant}</span>
                        </button>
                        <button onClick={() => setFilterStatus('occupied')} className={`flex items-center gap-1.5 rounded-full px-3 py-1 shadow-sm whitespace-nowrap transition-all ${filterStatus === 'occupied' ? 'ring-2 ring-blue-400' : ''} bg-blue-50 text-blue-700 border border-blue-100`}>
                            <span>Occupied</span>
                            <span className="font-bold text-blue-900">{summaryStats.occupied}</span>
                        </button>
                        <button onClick={() => setFilterStatus('reserved')} className={`flex items-center gap-1.5 rounded-full px-3 py-1 shadow-sm whitespace-nowrap transition-all ${filterStatus === 'reserved' ? 'ring-2 ring-yellow-400' : ''} bg-yellow-50 text-yellow-700 border border-yellow-100`}>
                            <span>Reserved</span>
                            <span className="font-bold text-yellow-900">{summaryStats.reserved}</span>
                        </button>
                        <button onClick={() => setFilterStatus('blocked')} className={`flex items-center gap-1.5 rounded-full px-3 py-1 shadow-sm whitespace-nowrap transition-all ${filterStatus === 'blocked' ? 'ring-2 ring-gray-400' : ''} bg-gray-50 text-gray-700 border border-gray-200`}>
                            <span>Blocked</span>
                            <span className="font-bold text-gray-900">{summaryStats.blocked}</span>
                        </button>
                        <button onClick={() => setFilterStatus('due_out')} className={`flex items-center gap-1.5 rounded-full px-3 py-1 shadow-sm whitespace-nowrap transition-all ${filterStatus === 'due_out' ? 'ring-2 ring-red-400' : ''} bg-red-50 text-red-700 border border-red-100`}>
                            <span>Due Out</span>
                            <span className="font-bold text-red-900">{summaryStats.dueOut}</span>
                        </button>
                        <button onClick={() => setFilterStatus('dirty')} className={`flex items-center gap-1.5 rounded-full px-3 py-1 shadow-sm whitespace-nowrap transition-all ${filterStatus === 'dirty' ? 'ring-2 ring-orange-400' : ''} bg-orange-50 text-orange-700 border border-orange-100`}>
                            <span>Dirty</span>
                            <span className="font-bold text-orange-900">{summaryStats.dirty}</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={filterSuite}
                        onChange={(e) => setFilterSuite(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                    >
                        <option value="all">All Room Types</option>
                        {SUITE_TYPES.map(suite => (
                            <option key={suite} value={suite}>{suite}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredRooms.map(room => {
                    const { status, colorClass, label, icon, booking, housekeeping } = getRoomVisuals(room);

                    return (
                        <div
                            key={room.id}
                            onClick={() => setSelectedRoomName(room.roomName)}
                            className={`
                                relative p-4 rounded-xl border shadow-sm cursor-pointer transition-all duration-200 
                                hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                                flex flex-col justify-between min-h-[140px]
                                ${colorClass}
                                ${status === 'blocked' ? 'opacity-80' : 'opacity-100'}
                            `}
                        >
                            {/* Dirty Badge */}
                            {housekeeping === 'dirty' && status !== 'blocked' && (
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded border border-orange-200 shadow-sm flex items-center gap-1">
                                    <FaBroom className="w-2.5 h-2.5" /> Dirty
                                </div>
                            )}

                            {/* Top: Room Info */}
                            <div>
                                <h3 className="text-lg font-bold leading-none">{room.roomName}</h3>
                                <p className="text-[10px] uppercase font-bold tracking-wider opacity-70 mt-1">{room.suiteType}</p>
                            </div>

                            {/* Center: Visual Status */}
                            <div className="flex-1 flex flex-col items-center justify-center py-2">
                                {(booking && status !== 'blocked') ? (
                                    <div className="text-center w-full">
                                        <div className="flex justify-center mb-1">
                                            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-sm border border-white/30 text-current">
                                                <span className="font-bold text-xs">{booking.guestDetails.firstName.charAt(0)}</span>
                                            </div>
                                        </div>
                                        <p className="font-bold text-sm truncate px-2 leading-tight">
                                            {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                                        </p>
                                        <p className="text-[10px] opacity-80 mt-0.5 font-medium">
                                            #{booking.bookingId?.slice(-6) || 'BOOKING'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="opacity-40 transform scale-125">
                                        {icon}
                                    </div>
                                )}
                            </div>

                            {/* Bottom: Status Text */}
                            <div className="mt-2 text-center border-t border-black/5 pt-2">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-white/30 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm border border-white/20">
                                    {label}
                                </span>
                            </div>

                        </div>
                    );
                })}
            </div>

            {selectedRoomName && selectedRoomData && (
                <RoomDetailsModal
                    isOpen={true}
                    roomName={selectedRoomName}
                    onClose={() => setSelectedRoomName(null)}
                    onUpdate={() => loadData()}
                    activeBooking={selectedRoomData.booking}
                    roomMetadata={selectedRoomData.room}
                    hideActions={true}
                />
            )}
        </div>
    );
}
