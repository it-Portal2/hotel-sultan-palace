"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { getRooms, deleteRoom, Room } from '@/lib/firestoreService';

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      setDeleting(roomId);
      const success = await deleteRoom(roomId);
      if (success) {
        setRooms(rooms.filter(room => room.id !== roomId));
      } else {
        alert('Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room');
    } finally {
      setDeleting(null);
    }
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
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
          <p className="mt-2 text-gray-600">Manage your hotel rooms and suites</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/admin/rooms/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Room
          </Link>
        </div>
      </div>

      {/* Rooms List */}
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new room.</p>
          <div className="mt-6">
            <Link
              href="/admin/rooms/new"
              className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Room
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {rooms.map((room) => (
              <li key={room.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="h-12 w-12 rounded-lg object-cover"
                        src={room.image}
                        alt={room.name}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {room.name}
                        </p>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">{room.type}</p>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">
                          ${room.price.toLocaleString()} per night
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/rooms/edit/${room.id}`}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(room.id)}
                      disabled={deleting === room.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deleting === room.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <TrashIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
