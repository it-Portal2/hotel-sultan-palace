import React, { useState } from 'react';
import { Room } from '@/lib/firestoreService';
import Image from 'next/image';
import Link from 'next/link';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import RestrictedAction from '@/components/admin/RestrictedAction';
import PremiumLoader from '@/components/ui/PremiumLoader';

interface RoomTableProps {
    rooms: Room[];
    isReadOnly: boolean;
    onDelete: (id: string) => void;
    deletingId: string | null;
}

export default function RoomTable({ rooms, isReadOnly, onDelete, deletingId }: RoomTableProps) {
    if (rooms.length === 0) {
        return (
            <div className="text-center py-12 bg-white border border-gray-100 shadow-sm">
                <p className="text-gray-500">No rooms found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Room Details</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price/Night</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {rooms.map((room) => (
                            <tr key={room.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-12 overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                            <Image
                                                src={room.image || '/placeholder-room.jpg'}
                                                alt={room.name}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                            />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{room.name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{room.description?.slice(0, 50)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {room.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-600">
                                        {room.maxGuests} Guests
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {room.beds} Beds
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-sm font-bold text-gray-900">${room.price.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {isReadOnly ? (
                                            <RestrictedAction message="Edit disabled">
                                                <button className="p-2 text-gray-300 cursor-not-allowed">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                            </RestrictedAction>
                                        ) : (
                                            <>
                                                <Link
                                                    href={`/admin/rooms/edit/${room.id}`}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => onDelete(room.id)}
                                                    disabled={deletingId === room.id}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    {deletingId === room.id ? (
                                                        <PremiumLoader size="small" />
                                                    ) : (
                                                        <TrashIcon className="w-4 h-4" />
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
    );
}
