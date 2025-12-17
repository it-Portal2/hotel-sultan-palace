import React, { useState, useEffect } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
    getRoomStatus,
    markRoomForMaintenance,
    completeRoomMaintenance,
    getHousekeepingTasks,
    getCheckInOutRecords,
    RoomStatus,
    HousekeepingTask,
    CheckInOutRecord
} from '@/lib/firestoreService';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface RoomDetailsModalProps {
    roomName: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export default function RoomDetailsModal({ roomName, isOpen, onClose, onUpdate }: RoomDetailsModalProps) {
    const { isReadOnly } = useAdminRole();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
    const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
    const [checkInOutRecords, setCheckInOutRecords] = useState<CheckInOutRecord[]>([]);

    // Maintenance Form State
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
    const [maintenanceForm, setMaintenanceForm] = useState({
        startDate: '',
        endDate: '',
        reason: '',
        notes: '',
    });

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

    const handleMarkMaintenance = async () => {
        if (!roomStatus || isReadOnly) return;

        if (!maintenanceForm.reason || !maintenanceForm.startDate || !maintenanceForm.endDate) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            const success = await markRoomForMaintenance(
                roomName,
                new Date(maintenanceForm.startDate),
                new Date(maintenanceForm.endDate),
                maintenanceForm.reason + (maintenanceForm.notes ? ` - ${maintenanceForm.notes}` : '')
            );

            if (success) {
                setShowMaintenanceForm(false);
                setMaintenanceForm({ startDate: '', endDate: '', reason: '', notes: '' });
                await loadData();
                onUpdate();
                showToast('Room marked for maintenance', 'success');
            } else {
                showToast('Failed to mark room for maintenance', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to update room status', 'error');
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 backdrop-blur-xl z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{roomName} Details</h2>
                        {roomStatus && <p className="text-sm text-gray-500 mt-1">{roomStatus.suiteType}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6A00]"></div>
                        </div>
                    ) : !roomStatus ? (
                        <p className="text-center text-gray-500 py-12">Room data not found.</p>
                    ) : (
                        <>
                            {/* Status & Actions */}
                            <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 border border-gray-200 gap-4">
                                <div className="flex flex-col gap-1 w-full sm:w-auto">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current Status</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 text-sm font-bold capitalize border ${roomStatus.status === 'available' ? 'bg-green-100 text-green-800 border-green-200' :
                                            roomStatus.status === 'occupied' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                roomStatus.status === 'maintenance' ? 'bg-red-100 text-red-800 border-red-200' :
                                                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                                            }`}>
                                            {roomStatus.status.replace('_', ' ')}
                                        </span>
                                        <span className={`px-3 py-1 text-sm font-bold capitalize border ${(roomStatus.housekeepingStatus === 'clean' || roomStatus.housekeepingStatus === 'inspected') ? 'bg-green-50 text-green-700 border-green-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                            {roomStatus.housekeepingStatus?.replace('_', ' ') || 'Clean'}
                                        </span>
                                    </div>
                                </div>

                                {!isReadOnly && (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {roomStatus.status === 'maintenance' ? (
                                            <button
                                                onClick={handleMarkAvailable}
                                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-medium text-sm flex-1 sm:flex-none justify-center"
                                            >
                                                End Maintenance
                                            </button>
                                        ) : (
                                            <>
                                                {roomStatus.status === 'cleaning' && (
                                                    <button
                                                        onClick={handleMarkAvailable}
                                                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-medium text-sm flex-1 sm:flex-none justify-center"
                                                    >
                                                        Mark Clean
                                                    </button>
                                                )}
                                                {!showMaintenanceForm && (
                                                    <button
                                                        onClick={() => setShowMaintenanceForm(true)}
                                                        className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-medium text-sm flex-1 sm:flex-none justify-center"
                                                    >
                                                        Start Maintenance
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Maintenance Form */}
                            {showMaintenanceForm && (
                                <div className="bg-white border border-red-200 p-5 animate-fade-in shadow-sm">
                                    <h3 className="font-bold text-red-900 mb-4">Maintenance Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-red-800 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={maintenanceForm.startDate}
                                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, startDate: e.target.value })}
                                                className="w-full text-sm p-2 border border-red-300 focus:outline-none focus:border-red-600 focus:ring-0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-red-800 mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={maintenanceForm.endDate}
                                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, endDate: e.target.value })}
                                                className="w-full text-sm p-2 border border-red-300 focus:outline-none focus:border-red-600 focus:ring-0"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-red-800 mb-1">Reason</label>
                                            <select
                                                value={maintenanceForm.reason}
                                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, reason: e.target.value })}
                                                className="w-full text-sm p-2 border border-red-300 focus:outline-none focus:border-red-600 focus:ring-0"
                                            >
                                                <option value="">Select a reason...</option>
                                                <option value="AC Repair">AC Repair</option>
                                                <option value="Plumbing Issue">Plumbing Issue</option>
                                                <option value="Electrical Work">Electrical Work</option>
                                                <option value="Furniture Repair">Furniture Repair</option>
                                                <option value="Deep Cleaning">Deep Cleaning</option>
                                                <option value="Renovation">Renovation</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-red-800 mb-1">Notes</label>
                                            <textarea
                                                value={maintenanceForm.notes}
                                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                                                className="w-full text-sm p-2 border border-red-300 focus:outline-none focus:border-red-600 focus:ring-0"
                                                placeholder="Additional details..."
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            onClick={() => setShowMaintenanceForm(false)}
                                            className="px-4 py-2 text-sm text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleMarkMaintenance}
                                            className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                                        >
                                            Confirm Maintenance
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Cleaning History */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        Cleaning History
                                    </h3>
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-64 overflow-y-auto">
                                        {roomStatus.cleaningHistory && roomStatus.cleaningHistory.length > 0 ? (
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-2">Date</th>
                                                        <th className="px-4 py-2">Type</th>
                                                        <th className="px-4 py-2">Staff</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {[...roomStatus.cleaningHistory].reverse().map((h, i) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-gray-600">
                                                                {h.date ? new Date(h.date).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 capitalize">{h.type.replace('_', ' ')}</td>
                                                            <td className="px-4 py-3 text-gray-500">
                                                                {h.staffName}
                                                                {h.notes && <div className="text-xs text-gray-400 italic mt-0.5">{h.notes}</div>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">No cleaning history</div>
                                        )}
                                    </div>
                                </div>

                                {/* Booking / Check-in History */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        Guest History
                                    </h3>
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-64 overflow-y-auto">
                                        {checkInOutRecords.length > 0 ? (
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-2">Guest</th>
                                                        <th className="px-4 py-2">In/Out</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {checkInOutRecords.map(rec => (
                                                        <tr key={rec.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-medium text-gray-900">{rec.guestName}</td>
                                                            <td className="px-4 py-3 text-xs text-gray-500 space-y-1">
                                                                <div>In: {rec.checkInTime ? new Date(rec.checkInTime).toLocaleDateString() : 'N/A'}</div>
                                                                {rec.checkOutTime && <div>Out: {new Date(rec.checkOutTime).toLocaleDateString()}</div>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">No guest history</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
