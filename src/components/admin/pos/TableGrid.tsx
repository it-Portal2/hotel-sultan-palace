"use client";

import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface Table {
    id: string;
    number: string;
    seats: number;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning';
    orderId?: string; // If occupied
}

// Mock Data (In real world, fetch from DB)
const TABLES: Table[] = [
    { id: 't1', number: 'T1', seats: 4, status: 'available' },
    { id: 't2', number: 'T2', seats: 2, status: 'occupied', orderId: 'ord_123' },
    { id: 't3', number: 'T3', seats: 6, status: 'available' },
    { id: 't4', number: 'T4', seats: 4, status: 'reserved' },
    { id: 't5', number: 'T5', seats: 2, status: 'available' },
    { id: 't6', number: 'T6', seats: 8, status: 'available' },
    { id: 't7', number: 'T7', seats: 4, status: 'cleaning' },
    { id: 't8', number: 'T8', seats: 2, status: 'available' },
];

export default function TableGrid({ onSelectTable }: { onSelectTable: (tableId: string) => void }) {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
            case 'occupied': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
            case 'reserved': return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
            case 'cleaning': return 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed';
            default: return 'bg-gray-50';
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
            {TABLES.map(table => (
                <button
                    key={table.id}
                    onClick={() => table.status !== 'cleaning' && onSelectTable(table.id)}
                    disabled={table.status === 'cleaning'}
                    className={`
                        aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all p-4
                        ${getStatusColor(table.status)}
                    `}
                >
                    <span className="text-2xl font-bold">{table.number}</span>
                    <div className="flex items-center gap-1 text-xs opacity-70">
                        <UserGroupIcon className="w-4 h-4" />
                        <span>{table.seats}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider mt-2 px-2 py-0.5 rounded-full bg-white/50">
                        {table.status}
                    </span>
                </button>
            ))}
        </div>
    );
}
