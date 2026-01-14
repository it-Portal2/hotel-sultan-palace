"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getRooms, deleteRoom, Room } from '@/lib/firestoreService';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import RestrictedAction from '@/components/admin/RestrictedAction';
import RoomStats from '@/components/admin/rooms/RoomStats';
import RoomTable from '@/components/admin/rooms/RoomTable';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import MealPlanSettingsModal from '@/components/admin/rooms/MealPlanSettingsModal';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function AdminRoomsPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMealSettings, setShowMealSettings] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsData = await getRooms();
        setRooms(roomsData);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(room =>
      room.name.toLowerCase().includes(q) ||
      room.type.toLowerCase().includes(q)
    );
  }, [rooms, searchQuery]);

  const handleDelete = async (roomId: string) => {
    setConfirmId(roomId);
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      setDeleting(confirmId);
      const success = await deleteRoom(confirmId);
      if (success) {
        setRooms(prev => prev.filter(room => room.id !== confirmId));
        showToast('Room deleted successfully', 'success');
      } else {
        showToast('Failed to delete room', 'error');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      showToast('Failed to delete room', 'error');
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6A00]"></div>
          <p className="text-sm text-gray-500 font-medium">Loading Rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rooms & Suites</h1>
          <p className="text-sm text-gray-500 mt-1">Manage room definitions, pricing, and amenities.</p>
        </div>

        {/* Add Button */}
        {isReadOnly ? (
          <RestrictedAction message="You don't have permission to add rooms">
            <button disabled className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 cursor-not-allowed font-medium">
              <PlusIcon className="h-5 w-5" />
              Add Room
            </button>
          </RestrictedAction>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setShowMealSettings(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm rounded-md font-semibold text-sm"
            >
              <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
              Meal Plan Rates
            </button>
            <Link
              href="/admin/rooms/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6A00] text-white shadow-lg shadow-orange-200 hover:bg-[#e65f00] transition-colors font-bold text-sm rounded-md"
            >
              <PlusIcon className="h-5 w-5" />
              Add New Room
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <RoomStats totalRooms={rooms.length} />

      {/* Search Bar */}
      <div className="relative max-w-lg mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rooms..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none shadow-sm transition-all"
        />
      </div>

      {/* Table */}
      <RoomTable
        rooms={filteredRooms}
        isReadOnly={isReadOnly}
        onDelete={handleDelete}
        deletingId={deleting}
      />

      {/* Confirm Delete Modal */}
      <ConfirmationModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Room?"
        message="Are you sure you want to delete this room definition? This cannot be undone."
        confirmText={deleting === confirmId ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
      />

      <MealPlanSettingsModal
        isOpen={showMealSettings}
        onClose={() => setShowMealSettings(false)}
      />
    </div>
  );
}
