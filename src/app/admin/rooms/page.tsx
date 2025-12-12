"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getRooms, deleteRoom, Room } from '@/lib/firestoreService';
import { useAdminRole } from '@/context/AdminRoleContext';
import RestrictedAction from '@/components/admin/RestrictedAction';

export default function AdminRoomsPage() {
  const { isReadOnly } = useAdminRole();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        setRooms(rooms.filter(room => room.id !== confirmId));
      } else {
        alert('Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room');
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
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
          <h1 className="text-2xl font-semibold text-gray-900">Rooms Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hotel rooms and suites • {currentDate}</p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Inline Stats */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{rooms.length}</span>
          </div>
          
          {/* Add Button */}
          {isReadOnly ? (
            <RestrictedAction message="You don't have permission to add rooms">
              <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent">
                <PlusIcon className="h-4 w-4" />
                Add Room
              </div>
            </RestrictedAction>
          ) : (
            <Link
              href="/admin/rooms/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#FF6A00] border-b-2 border-[#FF6A00] hover:text-[#FF6A00]/80 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Room
            </Link>
          )}
        </div>
      </div>

      {/* Simple Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by room name or type..."
          className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
        />
      </div>

      {/* Clean Table */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-16">
          <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">No rooms found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery ? 'Try adjusting your search' : 'Get started by creating a new room'}
          </p>
          {!isReadOnly && !searchQuery && (
            <div className="mt-6">
              <Link
                href="/admin/rooms/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#FF6A00] border-b-2 border-[#FF6A00] hover:text-[#FF6A00]/80 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Add New Room
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price per Night</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                          <Image
                            className="object-cover"
                            src={room.image}
                            alt={room.name}
                            fill
                            sizes="48px"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.src = '/figma/rooms-imperial-suite.png';
                            }}
                          />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{room.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{room.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ${room.price.toLocaleString()} <span className="text-gray-500 text-xs font-normal">/night</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        {isReadOnly ? (
                          <>
                            <RestrictedAction message="You don't have permission to edit rooms">
                              <div className="text-gray-400">
                                <PencilIcon className="h-5 w-5" />
                              </div>
                            </RestrictedAction>
                            <RestrictedAction message="You don't have permission to delete rooms">
                              <div className="text-gray-400">
                                <TrashIcon className="h-5 w-5" />
                              </div>
                            </RestrictedAction>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/admin/rooms/edit/${room.id}`}
                              className="text-[#FF6A00] hover:text-[#FF6A00]/80 transition-colors"
                              title="Edit Room"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(room.id)}
                              disabled={deleting === room.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                              title="Delete Room"
                            >
                              {deleting === room.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                              ) : (
                                <TrashIcon className="h-5 w-5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete room?</h3>
            <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting === confirmId}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting === confirmId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
