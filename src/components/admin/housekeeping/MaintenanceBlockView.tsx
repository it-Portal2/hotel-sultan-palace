import React, { useState } from 'react';
import { RoomStatus, RoomType, SuiteType, Room } from '@/lib/firestoreService';
import BlockRoomModal, { BlockRoomData } from '@/components/admin/stayview/BlockRoomModal';
import { WrenchIcon, TrashIcon, PencilSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface MaintenanceBlockViewProps {
    roomStatuses: RoomStatus[];
    rooms: Room[]; // Full room objects needed for modal
    bookings?: any[]; // Allow passing bookings to catch legacy blocks
    suiteTypes: SuiteType[];
    onBlockRoom: (data: BlockRoomData) => Promise<void>;
    onUnblockRoom: (id: string, isBooking?: boolean) => Promise<void>;
    isLoading: boolean;
}

export default function MaintenanceBlockView({
    roomStatuses,
    rooms,
    bookings = [],
    suiteTypes,
    onBlockRoom,
    onUnblockRoom,
    isLoading
}: MaintenanceBlockViewProps) {
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [editingBlock, setEditingBlock] = useState<{ id: string, isBooking: boolean, data: BlockRoomData } | null>(null);
    const [blockToUnblock, setBlockToUnblock] = useState<{ id: string, isBooking: boolean, roomName: string } | null>(null);

    // 1. Filter Rooms currently in maintenance from RoomStatus
    const maintenanceRooms = roomStatuses.filter(r => r.status === 'maintenance').map(s => ({
        id: s.id,
        roomName: s.roomName,
        suiteType: s.suiteType,
        reason: s.maintenanceReason || 'Maintenance',
        startDate: s.maintenanceStartDate,
        endDate: s.maintenanceEndDate,
        isBooking: false
    }));

    // 2. Filter Rooms currently in maintenance from Bookings (Legacy/Front Office blocks)
    // We only care about active maintenance bookings (future or current)
    const normalizeDate = (d: any) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date;
    };
    const today = normalizeDate(new Date()).getTime();

    const maintenanceBookings = bookings.filter(b => {
        if (b.status !== 'maintenance') return false;
        // Check if relevant (end date >= today)
        const end = normalizeDate(b.checkOut).getTime();
        return end >= today;
    }).map(b => ({
        id: b.id,
        roomName: b.rooms[0]?.allocatedRoomType || 'Unknown',
        suiteType: b.rooms[0]?.suiteType || 'Garden Suite',
        reason: b.notes || 'Maintenance Block',
        startDate: b.checkIn,
        endDate: b.checkOut,
        isBooking: true
    }));

    // Merge lists
    const allMaintenanceBlocks = [...maintenanceRooms, ...maintenanceBookings];

    const handleSaveBlock = async (data: BlockRoomData) => {
        try {
            // If editing, remove the old block first
            if (editingBlock) {
                await onUnblockRoom(editingBlock.id, editingBlock.isBooking);
            }
            await onBlockRoom(data);
            setShowBlockModal(false);
            setEditingBlock(null);
        } catch (error) {
            console.error("Error saving block:", error);
        }
    };

    const handleEditClick = (block: any) => {
        const toDateStr = (d: any, adjustDays = 0) => {
            if (!d) return '';
            const date = new Date(d);
            // Set to Noon to avoid timezone shifts
            date.setHours(12, 0, 0, 0);
            date.setDate(date.getDate() + adjustDays);
            return date.toISOString().split('T')[0];
        };

        const initialData: BlockRoomData = {
            ranges: [{
                startDate: toDateStr(block.startDate),
                // Subtract 1 day from endDate because it's stored exclusively (next day)
                endDate: toDateStr(block.endDate, -1)
            }],
            suiteType: block.suiteType,
            selectedRooms: [block.roomName],
            reason: block.reason
        };

        setEditingBlock({ id: block.id, isBooking: block.isBooking, data: initialData });
        setShowBlockModal(true);
    };

    const confirmUnblock = async () => {
        if (!blockToUnblock) return;
        await onUnblockRoom(blockToUnblock.id, blockToUnblock.isBooking);
        setBlockToUnblock(null);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading maintenance blocks...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Maintenance Blocks</h2>
                    <p className="text-sm text-gray-500">Manage room blocks for maintenance or repairs.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingBlock(null);
                        setShowBlockModal(true);
                    }}
                    className="bg-[#FF6A00] text-white px-4 py-2 text-sm font-bold rounded shadow hover:bg-[#e65f00] transition-colors flex items-center gap-2"
                >
                    <WrenchIcon className="w-4 h-4" />
                    Block Room
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {allMaintenanceBlocks.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <WrenchIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No rooms are currently under maintenance.</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suite</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allMaintenanceBlocks.map((block) => (
                                <tr key={block.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{block.roomName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{block.suiteType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${block.isBooking ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {block.reason}
                                            {block.isBooking && <span className="ml-1 text-[10px] opacity-70">(Legacy)</span>}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {block.startDate ? new Date(block.startDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {block.endDate ? new Date(block.endDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setBlockToUnblock({ id: block.id, isBooking: block.isBooking, roomName: block.roomName })}
                                            className="text-red-500 hover:text-red-700 font-semibold text-xs border border-red-200 bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition-colors"
                                        >
                                            Unblock
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(block)}
                                            className="ml-2 text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {allMaintenanceBlocks.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-400 shadow-sm">
                        <WrenchIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No rooms under maintenance.</p>
                    </div>
                ) : (
                    allMaintenanceBlocks.map((block) => (
                        <div key={block.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            {block.roomName}
                                            <span className="text-[10px] uppercase font-normal text-gray-500 border border-gray-200 px-1.5 rounded bg-gray-50">{block.suiteType}</span>
                                        </h3>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${block.isBooking ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {block.reason}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded border border-gray-100">
                                    <div className='flex flex-col'>
                                        <span className='uppercase text-[10px] font-bold text-gray-400'>Start</span>
                                        <span className='font-medium text-gray-700'>{block.startDate ? new Date(block.startDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className='w-px h-6 bg-gray-200'></div>
                                    <div className='flex flex-col'>
                                        <span className='uppercase text-[10px] font-bold text-gray-400'>End</span>
                                        <span className='font-medium text-gray-700'>{block.endDate ? new Date(block.endDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setBlockToUnblock({ id: block.id, isBooking: block.isBooking, roomName: block.roomName })}
                                    className="w-full flex justify-center items-center gap-2 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-100 hover:bg-red-100 active:scale-[0.98] transition-all"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Unblock Room
                                </button>
                                <button
                                    onClick={() => handleEditClick(block)}
                                    className="w-full flex justify-center items-center gap-2 py-2.5 bg-blue-50 text-blue-600 font-bold text-sm rounded-lg border border-blue-100 hover:bg-blue-100 active:scale-[0.98] transition-all"
                                >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    Edit Block
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <BlockRoomModal
                isOpen={showBlockModal}
                onClose={() => setShowBlockModal(false)}
                onSave={handleSaveBlock}
                rooms={rooms}
                suiteTypes={suiteTypes}
                initialData={editingBlock?.data}
            />

            {/* Unblock Confirmation Modal */}
            {blockToUnblock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setBlockToUnblock(null)}>
                    <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm border border-gray-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Unblock {blockToUnblock.roomName}?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Are you sure you want to remove this maintenance block? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setBlockToUnblock(null)}
                                className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmUnblock}
                                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none shadow-sm"
                            >
                                Confirm Unblock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
