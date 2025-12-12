"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { 
  getRoomStatus, 
  updateRoomStatus, 
  getHousekeepingTasks,
  getCheckInOutRecords,
  RoomStatus,
  HousekeepingTask,
  CheckInOutRecord
} from '@/lib/firestoreService';
export default function RoomDetailsPage() {
  const params = useParams();
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const roomName = params.roomName as string;
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [checkInOutRecords, setCheckInOutRecords] = useState<CheckInOutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    reason: '',
    endDate: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [status, allTasks, records] = await Promise.all([
        getRoomStatus(roomName),
        getHousekeepingTasks(),
        getCheckInOutRecords(),
      ]);
      
      setRoomStatus(status);
      // Filter tasks for this room
      setTasks(allTasks.filter(t => t.roomName === roomName));
      // Filter records for this room
      setCheckInOutRecords(records.filter(r => r.roomName === roomName));
    } catch (error) {
      console.error('Error loading room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkMaintenance = async () => {
    if (!roomStatus || isReadOnly) return;
    
    try {
      await updateRoomStatus(roomStatus.id, {
        status: 'maintenance',
        maintenanceStartDate: new Date(),
        maintenanceReason: maintenanceForm.reason,
        maintenanceNotes: maintenanceForm.notes,
      });
      setShowMaintenanceModal(false);
      setMaintenanceForm({ reason: '', endDate: '', notes: '' });
      await loadData();
      showToast('Room marked for maintenance', 'success');
    } catch (error) {
      console.error('Error updating room status:', error);
      showToast('Failed to update room status', 'error');
    }
  };

  const handleMarkAvailable = async () => {
    if (!roomStatus || isReadOnly) return;
    
    try {
      await updateRoomStatus(roomStatus.id, {
        status: 'available',
        housekeepingStatus: 'clean',
        maintenanceStartDate: undefined,
        maintenanceEndDate: new Date(),
        maintenanceReason: undefined,
      });
      await loadData();
      showToast('Room marked as available', 'success');
    } catch (error) {
      console.error('Error updating room status:', error);
      showToast('Failed to update room status', 'error');
    }
  };

  const getStatusColor = (status: RoomStatus['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cleaning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reserved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!roomStatus) {
    return (
      <div className="space-y-6">
        <BackButton href="/admin/room-status" label="Back to Room Status" />
        <div className="text-center py-16 bg-white rounded shadow-lg border border-gray-100">
          <p className="text-lg font-medium text-gray-600">Room not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/admin/room-status" label="Back to Room Status" />
      
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded p-6 border border-[#be8c53]/20 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">{roomStatus.roomName}</h1>
            <p className="mt-2 text-[#202c3b]/70 text-lg">{roomStatus.suiteType}</p>
          </div>
          <div className="flex gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(roomStatus.status)}`}>
              {roomStatus.status.toUpperCase()}
            </span>
            {!isReadOnly && (
              <>
                {roomStatus.status === 'cleaning' && (
                  <button
                    onClick={handleMarkAvailable}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark Available
                  </button>
                )}
                {roomStatus.status !== 'maintenance' && (
                  <button
                    onClick={() => setShowMaintenanceModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Mark Maintenance
                  </button>
                )}
                {roomStatus.status === 'maintenance' && (
                  <button
                    onClick={handleMarkAvailable}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    End Maintenance
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className="bg-white rounded shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Status</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-gray-900">{roomStatus.status.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Housekeeping Status</p>
              <p className="font-semibold text-gray-900">{roomStatus.housekeepingStatus?.toUpperCase() || 'CLEAN'}</p>
            </div>
            {roomStatus.currentGuestName && (
              <div>
                <p className="text-sm text-gray-600">Current Guest</p>
                <p className="font-semibold text-gray-900">{roomStatus.currentGuestName}</p>
              </div>
            )}
            {roomStatus.currentCheckInDate && (
              <div>
                <p className="text-sm text-gray-600">Check-in Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(roomStatus.currentCheckInDate).toLocaleString()}
                </p>
              </div>
            )}
            {roomStatus.currentBookingId && (
              <div>
                <p className="text-sm text-gray-600">Booking ID</p>
                <p className="font-semibold text-gray-900">{roomStatus.currentBookingId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cleaning History */}
        <div className="bg-white rounded shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cleaning History</h2>
          {roomStatus.lastCleaned && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">Last Cleaned</p>
              <p className="font-semibold text-gray-900">
                {new Date(roomStatus.lastCleaned).toLocaleString()}
              </p>
            </div>
          )}
          {roomStatus.cleaningHistory && roomStatus.cleaningHistory.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {roomStatus.cleaningHistory.slice().reverse().map((cleaning, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {cleaning.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(cleaning.date).toLocaleString()}
                      </p>
                      {cleaning.staffName && (
                        <p className="text-xs text-gray-500 mt-1">By: {cleaning.staffName}</p>
                      )}
                    </div>
                  </div>
                  {cleaning.notes && (
                    <p className="text-xs text-gray-600 mt-2">{cleaning.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No cleaning history available</p>
          )}
        </div>

        {/* Recent Housekeeping Tasks */}
        <div className="bg-white rounded shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tasks</h2>
          {tasks.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {task.taskType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.status.replace('_', ' ').toUpperCase()}
                      </p>
                      {task.completedTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          Completed: {new Date(task.completedTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tasks for this room</p>
          )}
        </div>

        {/* Check-in/Check-out History */}
        <div className="bg-white rounded shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Check-in/Check-out History</h2>
          {checkInOutRecords.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {checkInOutRecords.slice(0, 5).map(record => (
                <div key={record.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{record.guestName}</p>
                    {record.checkInTime && (
                      <p className="text-xs text-gray-500">
                        Check-in: {new Date(record.checkInTime).toLocaleString()}
                      </p>
                    )}
                    {record.checkOutTime && (
                      <p className="text-xs text-gray-500">
                        Check-out: {new Date(record.checkOutTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No check-in/out records</p>
          )}
        </div>
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mark Room for Maintenance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.reason}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  placeholder="e.g., AC repair, plumbing issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected End Date</label>
                <input
                  type="date"
                  value={maintenanceForm.endDate}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
                  placeholder="Additional maintenance details..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkMaintenance}
                disabled={!maintenanceForm.reason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Mark Maintenance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

