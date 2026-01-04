import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
    getRoomStatus,
    completeRoomMaintenance,
    getHousekeepingTasks,
    getCheckInOutRecords,
    markRoomForMaintenance,
    RoomStatus,
    HousekeepingTask,
    CheckInOutRecord,
    Room,
    Booking,
    RoomType
} from '@/lib/firestoreService';
import {
    XMarkIcon,
    UserIcon,
    CalendarDaysIcon,
    CreditCardIcon,
    UsersIcon,
    PhoneIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';
import BlockRoomModal, { BlockRoomData } from '@/components/admin/stayview/BlockRoomModal';
import { FaBed, FaWifi, FaTv, FaSnowflake, FaConciergeBell, FaBroom, FaTools, FaBan } from 'react-icons/fa';

interface RoomDetailsModalProps {
    roomName: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;

    // New Props for Rich Data
    activeBooking?: Booking;
    roomMetadata?: RoomType;
    hideActions?: boolean;
}

export default function RoomDetailsModal({
    roomName,
    isOpen,
    onClose,
    onUpdate,
    activeBooking,
    roomMetadata,
    hideActions = false
}: RoomDetailsModalProps) {
    const { isReadOnly } = useAdminRole();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
    const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
    const [checkInOutRecords, setCheckInOutRecords] = useState<CheckInOutRecord[]>([]);

    // Block / Maintenance Modal State
    const [showBlockModal, setShowBlockModal] = useState(false);

    useEffect(() => {
        if (isOpen && roomName) {
            loadData();
        }
    }, [isOpen, roomName]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [status, allTasks, records] = await Promise.all([
                getRoomStatus(roomName),
                getHousekeepingTasks(),
                getCheckInOutRecords(),
            ]);

            setRoomStatus(status);
            setTasks(allTasks.filter(t => t.roomName === roomName));
            setCheckInOutRecords(records.filter(r => r.roomName === roomName));
        } catch (error) {
            console.error('Error loading room details:', error);
            showToast('Failed to load room details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAvailable = async () => {
        if (!roomStatus || isReadOnly) return;
        try {
            const success = await completeRoomMaintenance(roomName);
            if (success) {
                await loadData();
                onUpdate();
                showToast('Room marked as available', 'success');
            } else {
                showToast('Failed to mark room as available', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to update room status', 'error');
        }
    };

    const handleBlockSuccess = async () => {
        await loadData();
        onUpdate();
        setShowBlockModal(false);
        showToast('Room blocked for maintenance', 'success');
    };

    if (!isOpen) return null;

    // Helper to format dates
    const formatDate = (dateStr?: string | Date) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Helper for Status Badge
    const renderStatusBadge = () => {
        if (!roomStatus) return null;
        let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
        let label = roomStatus.status.replace('_', ' ');

        if (roomStatus.status === 'available') {
            colorClass = 'bg-green-100 text-green-800 border-green-200';
        } else if (roomStatus.status === 'occupied') {
            colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
        } else if (roomStatus.status === 'maintenance') {
            colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
            label = 'Maintenance Block';
        } else if (roomStatus.housekeepingStatus === 'dirty') {
            // Priority override for badge if needed, though status usually takes precedence
            // label += ' (Dirty)';
        }

        return (
            <span className={`px-3 py-1 text-sm font-bold capitalize rounded-full border ${colorClass} shadow-sm`}>
                {label}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Right Side Drawer */}
            <div className="relative w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto flex flex-col animate-slide-in-right transform transition-transform">

                {/* 1. Header Section */}
                <div className="flex flex-col p-6 border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{roomName}</h2>
                                {renderStatusBadge()}
                            </div>
                            <p className="text-sm text-gray-500 font-medium">{roomMetadata?.suiteType || roomStatus?.suiteType}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <XMarkIcon className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Quick Room Stats / Metadata */}
                    {roomMetadata && (
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1"><FaBed className="text-gray-400" /> {roomMetadata.suiteType}</span>
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-8 flex-1 bg-gray-50/50">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A00]"></div>
                        </div>
                    ) : !roomStatus ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">Room data unavailable.</p>
                        </div>
                    ) : (
                        <>
                            {/* 2. ACTIVE BOOKING SECTION (If Occupied/Reserved) */}
                            {activeBooking && (
                                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-blue-100 ring-1 ring-blue-50">
                                    <div className="bg-blue-50/50 px-5 py-3 border-b border-blue-100 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide flex items-center gap-2">
                                            <UserIcon className="w-4 h-4" /> Current Guest
                                        </h3>
                                        <span className="text-xs font-mono text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                            #{activeBooking.bookingId?.slice(-6) || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                                                {activeBooking.guestDetails.firstName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-gray-900 leading-tight">
                                                    {activeBooking.guestDetails.firstName} {activeBooking.guestDetails.lastName}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5" /> {activeBooking.guestDetails.phone}</span>
                                                    {/* Email can be added here if needed */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Check In</div>
                                                <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                                    <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                                                    {formatDate(activeBooking.checkIn)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Check Out</div>
                                                <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                                    <CalendarDaysIcon className="w-4 h-4 text-red-500" />
                                                    {formatDate(activeBooking.checkOut)}
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-gray-200 mt-2 col-span-2 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <UsersIcon className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-700">{activeBooking.guests.adults} Adults, {activeBooking.guests.children} Kids</span>
                                                </div>
                                                <div className="text-sm font-bold text-gray-900">
                                                    Balance: ₹{activeBooking.totalAmount || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. HOUSEKEEPING & STATUS */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <FaBroom className="w-24 h-24" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2 relative z-10">
                                    <FaBroom className="w-4 h-4 text-orange-500" /> Housekeeping Status
                                </h3>

                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Condition</div>
                                        <div className={`
                                            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold capitalize
                                            ${(roomStatus.housekeepingStatus === 'clean' || roomStatus.housekeepingStatus === 'inspected')
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-orange-50 text-orange-800 border-orange-200'}
                                        `}>
                                            <span className={`w-2 h-2 rounded-full ${(roomStatus.housekeepingStatus === 'clean' || roomStatus.housekeepingStatus === 'inspected') ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                            {roomStatus.housekeepingStatus?.replace('_', ' ') || 'Clean'}
                                        </div>
                                    </div>

                                    {!hideActions && !isReadOnly && (
                                        <div className="flex gap-2">
                                            {/* Action Buttons are HIDDEN by default in Room View per requirements */}
                                            {/* If hideActions is FALSE (e.g. from Housekeeping module), show buttons */}
                                            {(roomStatus.status === 'cleaning' || roomStatus.housekeepingStatus === 'dirty') && (
                                                <button
                                                    onClick={handleMarkAvailable}
                                                    className="px-4 py-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 font-medium text-xs rounded-lg shadow-sm transition-all"
                                                >
                                                    Mark Clean
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Maintenance Alert */}
                                {roomStatus.status === 'maintenance' && (
                                    <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200 flex items-start gap-3">
                                        <FaTools className="w-5 h-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">Under Maintenance</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                This room is currently blocked for maintenance.
                                                {roomStatus.maintenanceStartDate && (
                                                    <span className="block mt-0.5">
                                                        Until: {new Date(roomStatus.maintenanceEndDate as any).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>


                            {/* 4. Action Buttons (Only if NOT hidden) */}
                            {!hideActions && !isReadOnly && (
                                <div className="grid grid-cols-2 gap-3">
                                    {roomStatus.status === 'maintenance' ? (
                                        <button
                                            onClick={handleMarkAvailable}
                                            className="col-span-2 py-3 bg-green-600 text-white hover:bg-green-700 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <FaTools className="w-4 h-4" /> Unblock Room
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowBlockModal(true)}
                                            className="col-span-2 py-3 bg-gray-800 text-white hover:bg-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <FaBan className="w-4 h-4 text-gray-400" /> Block / Maintenance
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* 5. HISTORY TABS / LISTS */}
                            <div className="space-y-6">
                                {/* Cleaning History */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Recent Activity</h3>
                                    <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-2">
                                        {/* Cleaning Events */}
                                        {roomStatus.cleaningHistory && roomStatus.cleaningHistory.length > 0 &&
                                            [...roomStatus.cleaningHistory].reverse().slice(0, 3).map((h, i) => (
                                                <div key={`clean-${i}`} className="ml-6 relative group">
                                                    <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-gray-300 border-2 border-white group-hover:bg-[#FF6A00] transition-colors"></div>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800 capitalize">{h.type.replace('_', ' ')}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">by {h.staffName || 'Staff'}</div>
                                                        </div>
                                                        <div className="text-xs text-gray-400 font-mono">
                                                            {h.date ? new Date(h.date).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        }

                                        {/* Guest History Interleaved? Keeping separate for now as per original logic but cleaner */}
                                    </div>

                                    {(!roomStatus.cleaningHistory || roomStatus.cleaningHistory.length === 0) && (
                                        <div className="text-sm text-gray-400 italic pl-2">No recent cleaner activity.</div>
                                    )}
                                </div>

                                {/* Previous Guests */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Previous Guests</h3>
                                    <div className="space-y-2">
                                        {checkInOutRecords.slice(0, 3).map(rec => (
                                            <div key={rec.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {rec.guestName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-800">{rec.guestName}</div>
                                                        <div className="text-[10px] text-gray-400">Checked Out</div>
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-gray-500">
                                                    {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleDateString() : '-'}
                                                </div>
                                            </div>
                                        ))}
                                        {checkInOutRecords.length === 0 && (
                                            <div className="text-sm text-gray-400 italic pl-2">No guest history.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Block Room Modal - Only shown if actions allowed and triggered */}
            {showBlockModal && roomStatus && !hideActions && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBlockModal(false)}></div>
                    <div className="relative z-10 w-full max-w-lg">
                        <BlockRoomModal
                            isOpen={true}
                            onClose={() => setShowBlockModal(false)}
                            rooms={[{
                                id: roomStatus.id || 'temp-id',
                                name: roomName,
                                roomName: roomName,
                                suiteType: roomStatus.suiteType,
                                status: roomStatus.status,
                                // @ts-ignore - satisfying minimal Room interface for the modal
                                type: roomStatus.suiteType,
                                price: 0
                            } as unknown as Room]}
                            suiteTypes={[roomStatus.suiteType]}
                            initialData={{
                                roomName: roomName,
                                suiteType: roomStatus.suiteType,
                                selectedRooms: [roomName]
                            }}
                            onSave={async (data: BlockRoomData) => {
                                try {
                                    for (const range of data.ranges) {
                                        if (range.startDate && range.endDate) {
                                            await markRoomForMaintenance(
                                                roomName,
                                                new Date(range.startDate),
                                                new Date(range.endDate),
                                                data.reason
                                            );
                                        }
                                    }
                                    handleBlockSuccess();
                                } catch (error) {
                                    console.error('Error blocking room:', error);
                                    showToast('Failed to block room', 'error');
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
