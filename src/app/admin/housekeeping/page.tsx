"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';
import { 
  getHousekeepingTasks, 
  updateHousekeepingTask,
  createHousekeepingTask,
  deleteHousekeepingTask,
  getRoomStatuses,
  updateRoomStatus,
  HousekeepingTask,
  SuiteType,
  RoomStatus
} from '@/lib/firestoreService';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function HousekeepingPage() {
  const { isReadOnly } = useAdminRole();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getHousekeepingTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, status: HousekeepingTask['status']) => {
    if (isReadOnly) return;
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Update task status
      await updateHousekeepingTask(taskId, { status });
      
      // If task is completed, update room status automatically
      if (status === 'completed' && task.roomName) {
        const { getRoomStatus } = await import('@/lib/firestoreService');
        const roomStatus = await getRoomStatus(task.roomName);
        
        if (roomStatus) {
          // Add to cleaning history
          const cleaningHistory = roomStatus.cleaningHistory || [];
          const historyType: 'checkout_cleaning' | 'stayover_cleaning' | 'deep_cleaning' | 'inspection' =
            task.taskType === 'maintenance' ? 'inspection' : task.taskType;
          cleaningHistory.push({
            date: new Date(),
            type: historyType,
            staffName: task.assignedTo,
            notes: task.notes,
          });

          // Update room status based on task type
          if (task.taskType === 'checkout_cleaning') {
            // After checkout cleaning, room becomes available
            await updateRoomStatus(roomStatus.id, {
              status: 'available',
              housekeepingStatus: 'clean',
              lastCleaned: new Date(),
              cleaningHistory: cleaningHistory,
              currentBookingId: undefined,
              currentCheckInDate: undefined,
              currentCheckOutDate: undefined,
              currentGuestName: undefined,
            });
          } else if (task.taskType === 'stayover_cleaning') {
            // Stayover cleaning - room remains occupied but is clean
            await updateRoomStatus(roomStatus.id, {
              housekeepingStatus: 'clean',
              lastCleaned: new Date(),
              cleaningHistory: cleaningHistory,
            });
          } else if (task.taskType === 'deep_cleaning' || task.taskType === 'inspection') {
            // Deep cleaning or inspection - room becomes available
            await updateRoomStatus(roomStatus.id, {
              status: 'available',
              housekeepingStatus: 'clean',
              lastCleaned: new Date(),
              cleaningHistory: cleaningHistory,
              currentBookingId: undefined,
              currentCheckInDate: undefined,
              currentCheckOutDate: undefined,
              currentGuestName: undefined,
            });
          }
        }
      }
      
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.assignedTo && task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: HousekeepingTask['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: HousekeepingTask['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const taskTypeLabels: Record<string, string> = {
    checkout_cleaning: 'Checkout Cleaning',
    stayover_cleaning: 'Stayover Cleaning',
    deep_cleaning: 'Deep Cleaning',
    maintenance: 'Maintenance',
    inspection: 'Inspection',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Dashboard" />
      
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Housekeeping Management</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Manage housekeeping tasks and room cleaning</p>
        <div className="mt-4 flex gap-4">
          <div className="px-4 py-2 bg-yellow-100 rounded-lg">
            <span className="text-sm font-medium text-yellow-800">Pending: {tasks.filter(t => t.status === 'pending').length}</span>
          </div>
          <div className="px-4 py-2 bg-blue-100 rounded-lg">
            <span className="text-sm font-medium text-blue-800">In Progress: {tasks.filter(t => t.status === 'in_progress').length}</span>
          </div>
          <div className="px-4 py-2 bg-green-100 rounded-lg">
            <span className="text-sm font-medium text-green-800">Completed: {tasks.filter(t => t.status === 'completed').length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by room, task type, or assigned staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-lg font-medium text-gray-600">No housekeeping tasks found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg overflow-hidden rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Task Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.roomName}</div>
                      <div className="text-xs text-gray-500">{task.suiteType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{taskTypeLabels[task.taskType] || task.taskType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignedTo ? (
                        <span className="text-sm text-gray-900">{task.assignedTo}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.estimatedTime && (
                        <div className="text-sm text-gray-900 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {task.estimatedTime} mins
                        </div>
                      )}
                      {task.actualTime && (
                        <div className="text-xs text-gray-500">
                          Actual: {task.actualTime} mins
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!isReadOnly && (
                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Start
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusUpdate(task.id, 'completed')}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Complete
                            </button>
                          )}
                          {task.status !== 'completed' && task.status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

