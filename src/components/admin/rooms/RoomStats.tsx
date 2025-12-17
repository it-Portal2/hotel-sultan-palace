import React from 'react';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

interface RoomStatsProps {
    totalRooms: number;
}

export default function RoomStats({ totalRooms }: RoomStatsProps) {
    return (
        <div className="grid grid-cols-1 mb-6">
            <div className="bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Room Definitions</p>
                    <p className="text-3xl font-bold text-gray-900">{totalRooms}</p>
                </div>
                <div className="p-3 bg-indigo-50">
                    <BuildingOffice2Icon className="h-8 w-8 text-indigo-600" />
                </div>
            </div>
        </div>
    );
}
