"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
  getHousekeepingTasks,
  updateHousekeepingTask,
  updateRoomStatus,
  HousekeepingTask
} from '@/lib/firestoreService';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function HousekeepingPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
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
      showToast(`Task ${status} successfully!`, 'success');
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Failed to update task status', 'error');
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        task.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.assignedTo && task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      total: tasks.length,
    };
  }, [tasks]);

  const getStatusColor = (status: HousekeepingTask['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: HousekeepingTask['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-700';
      case 'high':
        return 'text-orange-700';
      case 'medium':
        return 'text-yellow-700';
      case 'low':
        return 'text-green-700';
      default:
        return 'text-gray-700';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-8">
      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Housekeeping Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Manage cleaning and maintenance tasks • {currentDate}</p>
        </div>

        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Pending:</span>
            <span className="font-semibold text-gray-900">{stats.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">In Progress:</span>
            <span className="font-semibold text-gray-900">{stats.inProgress}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Completed:</span>
            <span className="font-semibold text-gray-900">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by room, task type, or assigned staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="flex gap-1 border-b-2 border-gray-200 pb-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'all'
                ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'pending'
                ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'in_progress'
                ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'completed'
                ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Completed
            </button>
          </div>
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none px-3 py-2 text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Clean Table */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">No housekeeping tasks found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Task Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
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
                      <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
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
                      <div className="text-sm text-gray-900">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.scheduledTime ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {new Date(task.scheduledTime).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(task.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Not scheduled</span>
                      )}
                      {task.status === 'completed' && task.completedTime && (
                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          Done: {new Date(task.completedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!isReadOnly && (
                        <div className="flex items-center gap-2">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                              className="text-blue-600 hover:text-blue-800 font-medium border-b-2 border-transparent hover:border-blue-600 transition-colors"
                            >
                              Start
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusUpdate(task.id, 'completed')}
                              className="text-green-600 hover:text-green-800 font-medium border-b-2 border-transparent hover:border-green-600 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {task.status !== 'completed' && task.status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                              className="text-red-600 hover:text-red-800 font-medium border-b-2 border-transparent hover:border-red-600 transition-colors"
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
