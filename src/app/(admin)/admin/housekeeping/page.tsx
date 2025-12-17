"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
  getHousekeepingTasks,
  updateHousekeepingTask,
  updateRoomStatus,
  HousekeepingTask,
  getRoomStatuses,
  getRoomTypes,
  RoomStatus,
  RoomType,
  SuiteType
} from '@/lib/firestoreService';
import HousekeepingStats from '@/components/admin/housekeeping/HousekeepingStats';
import HousekeepingFilters from '@/components/admin/housekeeping/HousekeepingFilters';
import HousekeepingTable from '@/components/admin/housekeeping/HousekeepingTable';
import { Tab } from '@headlessui/react';
import { Squares2X2Icon, ListBulletIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import RoomDetailsModal from '@/components/admin/housekeeping/RoomDetailsModal';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function HousekeepingPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const router = useRouter();

  // State for Tasks
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // State for Room Status
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomLoading, setRoomLoading] = useState(true);
  const [selectedSuite, setSelectedSuite] = useState<SuiteType | 'all'>('all');

  // Modal State
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
    loadRoomData();
  }, []);

  const loadTasks = async () => {
    try {
      setTaskLoading(true);
      const data = await getHousekeepingTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setTaskLoading(false);
    }
  };

  const loadRoomData = async () => {
    try {
      setRoomLoading(true);
      const [statuses, types] = await Promise.all([
        getRoomStatuses(),
        getRoomTypes(),
      ]);
      setRoomStatuses(statuses);
      setRoomTypes(types);
    } catch (error) {
      console.error('Error loading room data:', error);
    } finally {
      setRoomLoading(false);
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
        // Logic to update room status (simplified for brevity, ensuring same logic as before)
        const roomStatus = roomStatuses.find(r => r.roomName === task.roomName);
        if (roomStatus) {
          const historyType = task.taskType === 'maintenance' ? 'inspection' : task.taskType;
          const newHistory = [
            ...(roomStatus.cleaningHistory || []),
            {
              date: new Date(),
              type: historyType,
              staffName: task.assignedTo || 'Unassigned',
              notes: task.notes || '',
            }
          ];

          // Determing new status based on task type
          let updates: any = {
            housekeepingStatus: 'clean',
            lastCleaned: new Date(),
            cleaningHistory: newHistory
          };

          if (task.taskType === 'checkout_cleaning' || task.taskType === 'deep_cleaning') {
            updates.status = 'available';
            updates.currentBookingId = null; // Clear booking info if making available
          }

          await updateRoomStatus(roomStatus.id, updates);
        }
      }

      await loadTasks();
      await loadRoomData(); // Reload rooms to reflect changes
      showToast(`Task ${status.replace('_', ' ')} successfully!`, 'success');
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Failed to update task status', 'error');
    }
  };

  // Filter Logic
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

  // Room Grid Logic
  const filteredRooms = useMemo(() => {
    let filtered = roomTypes;
    if (selectedSuite !== 'all') {
      filtered = filtered.filter(rt => rt.suiteType === selectedSuite);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rt =>
        rt.roomName.toLowerCase().includes(query) ||
        rt.suiteType.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [roomTypes, selectedSuite, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Housekeeping Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage cleaning tasks and monitor room status.</p>
        </div>
        <button
          onClick={() => { loadTasks(); loadRoomData(); }}
          className="bg-white border border-gray-200 text-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Info Alert for Workflow */}
      <div className="bg-blue-50 border border-blue-100 p-4 flex gap-3 text-sm text-blue-800">
        <InformationCircleIcon className="w-5 h-5 flex-shrink-0 text-blue-500" />
        <div>
          <p className="font-semibold">How it works:</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-blue-700/80">
            <li><strong>Checkout:</strong> When a guest is checked out, the room automatically becomes <span className="font-semibold text-red-600">Dirty</span> and a <span className="font-semibold">Maintenance/Cleaning Task</span> is created.</li>
            <li><strong>Tasks:</strong> Assign tasks to staff. When they mark a task as <span className="font-semibold text-green-600">Completed</span>, the room status automatically updates to <span className="font-semibold text-green-600">Clean/Available</span>.</li>
          </ul>
        </div>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 bg-gray-100 p-1 w-fit">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-32 py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none focus:ring-0',
                selected
                  ? 'bg-white shadow-sm text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <ListBulletIcon className="w-4 h-4" />
              Tasks List
            </div>
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-32 py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none focus:ring-0',
                selected
                  ? 'bg-white shadow-sm text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              )
            }
          >
            <div className="flex items-center justify-center gap-2">
              <Squares2X2Icon className="w-4 h-4" />
              Room Grid
            </div>
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel className="space-y-6 focus:outline-none">
            <HousekeepingStats stats={stats} />
            <HousekeepingFilters
              query={searchQuery}
              setQuery={setSearchQuery}
              status={statusFilter}
              setStatus={setStatusFilter}
              priority={priorityFilter}
              setPriority={setPriorityFilter}
            />
            {taskLoading ? (
              <div className="text-center py-10">Loading Tasks...</div>
            ) : (
              <HousekeepingTable
                tasks={filteredTasks}
                onUpdateStatus={handleStatusUpdate}
                isReadOnly={isReadOnly}
              />
            )}
          </Tab.Panel>

          <Tab.Panel className="focus:outline-none">
            {/* Room Grid View (Consolidated from Room Status Page) */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
                <h2 className="text-lg font-semibold text-gray-900">Live Room Status</h2>
                <div className="flex gap-2">
                  <select
                    value={selectedSuite}
                    onChange={(e) => setSelectedSuite(e.target.value as any)}
                    className="border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-0"
                  >
                    <option value="all">All Suites</option>
                    <option value="Garden Suite">Garden Suite</option>
                    <option value="Imperial Suite">Imperial Suite</option>
                    <option value="Ocean Suite">Ocean Suite</option>
                  </select>
                </div>
              </div>

              {roomLoading ? (
                <div className="text-center py-10">Loading Rooms...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {filteredRooms.map(room => {
                    const status = roomStatuses.find(s => s.roomName === room.roomName);
                    const housekeepingStatus = status?.housekeepingStatus || 'clean';
                    const isClean = housekeepingStatus === 'clean' || housekeepingStatus === 'inspected';

                    return (
                      <div
                        key={room.id}
                        className={`p-3 border-2 text-center cursor-pointer hover:shadow-md transition-all ${isClean ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'
                          }`}
                        onClick={() => setSelectedRoomName(room.roomName)}
                      >
                        <div className="font-bold text-gray-900">{room.roomName}</div>
                        <div className={`text-xs mt-1 font-medium ${isClean ? 'text-green-700' : 'text-red-700'}`}>
                          {housekeepingStatus.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 capitalize">
                          {status?.status || 'Available'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Room Details Modal */}
      {selectedRoomName && (
        <RoomDetailsModal
          isOpen={true}
          roomName={selectedRoomName}
          onClose={() => setSelectedRoomName(null)}
          onUpdate={loadRoomData}
        />
      )}
    </div>
  );
}
