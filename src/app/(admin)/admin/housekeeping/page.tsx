"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import {
  getRoomStatuses,
  getRoomTypes,
  updateRoomStatus,
  RoomStatus,
  RoomType,
  SuiteType,
  getRooms,
  Room,
  setRoomMaintenance,
  resolveRoomMaintenance,
  getAllBookings,
  Booking
} from '@/lib/firestoreService';
import HouseStatusView from '@/components/admin/housekeeping/HouseStatusView';
import MaintenanceBlockView from '@/components/admin/housekeeping/MaintenanceBlockView';
import WorkOrderView from '@/components/admin/housekeeping/WorkOrderView';
import { BlockRoomData } from '@/components/admin/stayview/BlockRoomModal';




export default function HousekeepingPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'house-status';

  // Data State
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  // const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]); // Removed: Managed by WorkOrderView
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const SUITE_TYPES: SuiteType[] = ['Garden Suite', 'Imperial Suite', 'Ocean Suite'];

  useEffect(() => {
    loadData();
  }, [currentTab]); // Reload potentially if tab switching requires fresh data, though usually shared data is fine.

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusesData, typesData, roomsData, bookingsData] = await Promise.all([
        getRoomStatuses(),
        getRoomTypes(),
        getRooms(),
        // getWorkOrders(), // Removed
        getAllBookings()
      ]);
      setRoomStatuses(statusesData);
      setRoomTypes(typesData);
      setRooms(roomsData);
      // setWorkOrders(workOrdersData); // Removed
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading housekeeping data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (roomStatusId: string, status: RoomStatus['housekeepingStatus']) => {
    if (isReadOnly) return;
    try {
      const roomStatus = roomStatuses.find(r => r.id === roomStatusId);

      await updateRoomStatus(roomStatusId, {
        housekeepingStatus: status,
        lastCleaned: status === 'clean' ? new Date() : (roomStatus?.lastCleaned || undefined)
      });

      await loadData();
      showToast(`Room updated to ${status}`, 'success');
    } catch (error) {
      console.error('Error updating room status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleBlockRoom = async (data: BlockRoomData) => {
    if (isReadOnly) return;
    try {
      const promises = data.selectedRooms.map(async (roomName) => {
        const range = data.ranges[0];
        if (range) {
          const start = new Date(range.startDate);
          const end = new Date(range.endDate);
          // Add 1 day to end date to make it inclusive for the calendar (Start <= d < End)
          end.setDate(end.getDate() + 1);

          return setRoomMaintenance(
            roomName,
            start,
            end,
            data.reason
          );
        }
      });

      await Promise.all(promises);
      await loadData();
      showToast('Rooms blocked for maintenance', 'success');
    } catch (error: any) {
      console.error("Error blocking rooms:", error);
      showToast(error.message || 'Failed to block rooms', 'error');
    }
  };

  const handleUnblockRoom = async (roomStatusId: string) => {
    if (isReadOnly) return;
    try {
      // Fix: resolveRoomMaintenance expects roomName, not ID.
      const status = roomStatuses.find(r => r.id === roomStatusId);
      if (!status) {
        throw new Error("Room status not found for ID: " + roomStatusId);
      }

      await resolveRoomMaintenance(status.roomName);
      await loadData();
      showToast('Maintenance completed', 'success');
    } catch (error) {
      console.error("Error unblocking room:", error);
      showToast('Failed to unblock room', 'error');
    }
  };




  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Housekeeping Management</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor room status and manage maintenance tasks.</p>
      </div>

      <div className="mt-6">
        {currentTab === 'house-status' && (
          <HouseStatusView
            roomStatuses={roomStatuses}
            roomTypes={roomTypes}
            bookings={bookings}
            suiteTypes={SUITE_TYPES}
            onUpdateStatus={handleUpdateStatus}
            isLoading={loading}
          />
        )}
        {currentTab === 'maintenance-block' && (
          <MaintenanceBlockView
            roomStatuses={roomStatuses}
            rooms={roomTypes
              .sort((a, b) => a.roomName.localeCompare(b.roomName))
              .map(rt => ({
                id: rt.id,
                name: rt.roomName,
                roomName: rt.roomName,
                suiteType: rt.suiteType,
                type: rt.suiteType,
                price: 0,
                description: '',
                amenities: rt.amenities || [],
                size: '',
                view: '',
                beds: '',
                image: '',
                maxGuests: 0,
                createdAt: rt.createdAt,
                updatedAt: rt.updatedAt
              } as Room))}
            suiteTypes={['Garden Suite', 'Imperial Suite', 'Ocean Suite']} // Ensure these match SuiteType
            bookings={bookings}
            onBlockRoom={handleBlockRoom}
            onUnblockRoom={async (id, isBooking) => {
              if (isBooking) {
                // Handle legacy booking unblock
                await import('@/lib/firestoreService').then(m => m.updateBooking(id, { status: 'cancelled' }));
                await loadData();
                showToast('Maintenance block removed', 'success');
              } else {
                // Handle standard room status unblock
                // @ts-ignore
                handleUnblockRoom(id);
              }
            }}
            isLoading={loading}
          />
        )}
        {currentTab === 'work-order' && (
          <WorkOrderView
            rooms={roomTypes
              .sort((a, b) => a.roomName.localeCompare(b.roomName))
              .map(rt => ({
                id: rt.id,
                name: rt.roomName,
                roomName: rt.roomName,
                suiteType: rt.suiteType,
                type: rt.suiteType,
                price: 0,
                description: '',
                amenities: rt.amenities || [],
                size: '',
                view: '',
                beds: '',
                image: '',
                maxGuests: 0,
                createdAt: rt.createdAt,
                updatedAt: rt.updatedAt
              } as Room))}
          />
        )}
      </div>
    </div>
  );
}
