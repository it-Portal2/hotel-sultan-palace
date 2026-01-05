import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { SuiteType, Room } from '@/lib/firestoreService';

interface BlockRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: BlockRoomData) => Promise<void>;
    initialData?: Partial<BlockRoomData>;
    rooms: Room[];
    suiteTypes: SuiteType[];
}

export interface BlockRoomData {
    ranges: { startDate: string; endDate: string }[];
    suiteType: SuiteType | '';
    selectedRooms: string[]; // Room names
    reason: string;
    roomName?: string;
}

const REASONS = [
    'BLOCKED',
    'Bathroom Ceiling is fallen off',
    'ceiling has fallen down',
    'ELECTRICITY ISSUE',
    'Hasan',
    'Request from the guest',
    'Room floor damage',
    'Room has no AC',
    'Select Reason' // Placeholder
];

export default function BlockRoomModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    rooms,
    suiteTypes
}: BlockRoomModalProps) {
    const [dateRanges, setDateRanges] = useState<{ startDate: string; endDate: string }[]>([
        { startDate: '', endDate: '' }
    ]);
    const [suiteType, setSuiteType] = useState<SuiteType | ''>('Garden Suite');
    const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
    const [reason, setReason] = useState<string>('');
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [customReason, setCustomReason] = useState('');
    const [activeReason, setActiveReason] = useState('');

    // Dropdown states
    const [showRoomDropdown, setShowRoomDropdown] = useState(false);
    const [showReasonDropdown, setShowReasonDropdown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset or load initial data
            if (initialData) {
                if (initialData.ranges && initialData.ranges.length > 0) {
                    setDateRanges(initialData.ranges);
                } else {
                    // If initialData provides start/end but not ranges array (compatibility)
                    // @ts-ignore
                    if (initialData.startDate && initialData.endDate) {
                        // @ts-ignore
                        setDateRanges([{ startDate: initialData.startDate, endDate: initialData.endDate }]);
                    } else {
                        const today = new Date().toISOString().split('T')[0];
                        setDateRanges([{ startDate: today, endDate: today }]);
                    }
                }

                setSuiteType(initialData.suiteType || 'Garden Suite');
                if (initialData.selectedRooms) {
                    setSelectedRooms(initialData.selectedRooms);
                } else if (initialData.roomName) {
                    setSelectedRooms([initialData.roomName]);
                }
                setReason(initialData.reason || '');
            } else {
                // Defaults
                const today = new Date().toISOString().split('T')[0];
                setDateRanges([{ startDate: today, endDate: today }]);
                setSuiteType('Garden Suite');
                setSelectedRooms([]);
                setReason('');
            }
        }
    }, [isOpen, initialData]);


    // Filter rooms by selected suite
    // Using dynamic data passed from props instead of hardcoded lists
    const availableRooms = rooms.filter(r => {
        // Robust filter:
        if (!r.suiteType) return false;
        return r.suiteType.trim().toLowerCase() === suiteType.trim().toLowerCase();
    });

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSelectAll(e.target.checked);
        if (e.target.checked) {
            setSelectedRooms(availableRooms.map(r => r.roomName || r.name));
        } else {
            setSelectedRooms([]);
        }
    };

    const handleRoomToggle = (roomName: string) => {
        setSelectedRooms(prev => {
            if (prev.includes(roomName)) {
                const newSelection = prev.filter(r => r !== roomName);
                setIsSelectAll(false);
                return newSelection;
            } else {
                const newSelection = [...prev, roomName];
                if (newSelection.length === availableRooms.length) {
                    setIsSelectAll(true);
                }
                return newSelection;
            }
        });
    };

    const handleAddDateRange = () => {
        const today = new Date().toISOString().split('T')[0];
        setDateRanges(prev => [...prev, { startDate: today, endDate: today }]);
    };

    const handleRemoveDateRange = (index: number) => {
        setDateRanges(prev => prev.filter((_, i) => i !== index));
    };

    const handleDateChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
        setDateRanges(prev => {
            const newRanges = [...prev];
            newRanges[index] = { ...newRanges[index], [field]: value };
            return newRanges;
        });
    };

    const handleSave = () => {
        onSave({
            ranges: dateRanges,
            suiteType: suiteType as SuiteType,
            selectedRooms,
            reason: activeReason || reason || 'Maintenance'
        });
        onClose();
    };

    const getReasonDisplay = () => {
        if (activeReason) return activeReason;
        return "Select Reason";
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Block Room</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

                    {/* Date Ranges */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                        <div className="space-y-2">
                            {dateRanges.map((range, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border border-gray-300 rounded px-2 py-1.5 ">
                                        <input
                                            type="date"
                                            value={range.startDate}
                                            onChange={(e) => handleDateChange(index, 'startDate', e.target.value)}
                                            className="border-none p-0 text-sm focus:ring-0 text-gray-700 w-full"
                                        />
                                        <span className="text-gray-400 text-sm">→</span>
                                        <input
                                            type="date"
                                            value={range.endDate}
                                            onChange={(e) => handleDateChange(index, 'endDate', e.target.value)}
                                            className="border-none p-0 text-sm focus:ring-0 text-gray-700 w-full text-right"
                                        />
                                    </div>
                                    {index > 0 && (
                                        <button onClick={() => handleRemoveDateRange(index)} className="text-red-400 hover:text-red-600">
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    {index === 0 && (
                                        <div className="w-5"></div> /* Spacer for alignment */
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={handleAddDateRange}
                                className="text-blue-500 text-sm font-medium hover:text-blue-600 flex items-center gap-1 border border-blue-500 rounded px-3 py-1 bg-white hover:bg-blue-50 transition-colors"
                            >
                                Add Range
                            </button>
                        </div>
                    </div>

                    {/* Room Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type</label>
                        <div className="relative">
                            <select
                                value={suiteType}
                                onChange={(e) => {
                                    setSuiteType(e.target.value as SuiteType);
                                    setSelectedRooms([]); // Clear selection on type change
                                    setIsSelectAll(false);
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
                            >
                                {suiteTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-2.5 pointer-events-none text-gray-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Room Checkboxes (Custom Dropdown behavior) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Room</label>
                        <div className="relative">
                            <div
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center"
                                onClick={() => setShowRoomDropdown(!showRoomDropdown)}
                            >
                                <span className="truncate">
                                    {selectedRooms.length > 0 ? selectedRooms.join(', ') : 'Select Room'}
                                </span>
                                <svg className={`h-4 w-4 text-gray-500 transition-transform ${showRoomDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </div>

                            {showRoomDropdown && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-b shadow-lg mt-[-1px]">
                                    <div className="px-3 py-2 border-b border-gray-100">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isSelectAll}
                                                onChange={handleSelectAll}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                            />
                                            <span className="text-sm text-gray-700">Select All</span>
                                        </label>
                                    </div>
                                    {availableRooms.map((room) => (
                                        <div key={room.id} className="px-3 py-2 hover:bg-gray-50">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRooms.includes(room.roomName || room.name)}
                                                    onChange={() => handleRoomToggle(room.roomName || room.name)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                />
                                                <span className="text-sm text-gray-700">{room.roomName || room.name}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={activeReason}
                                onChange={(e) => setActiveReason(e.target.value)}
                                placeholder="Select Reason"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                onFocus={() => setShowReasonDropdown(true)}
                            // onBlur={() => setTimeout(() => setShowReasonDropdown(false), 200)} // Delay to allow click
                            />
                            <div className="absolute right-3 top-2.5 pointer-events-none text-gray-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>

                            {showReasonDropdown && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-b shadow-lg mt-1">
                                    {REASONS.map((r, idx) => (
                                        <div
                                            key={idx}
                                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                                            onClick={() => {
                                                if (r !== 'Select Reason') {
                                                    setActiveReason(r);
                                                } else {
                                                    setActiveReason('');
                                                }
                                                setShowReasonDropdown(false);
                                            }}
                                        >
                                            {r}
                                        </div>
                                    ))}
                                    <div className="p-2 border-t border-gray-100 flex gap-2">
                                        <input
                                            type="text"
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            placeholder="Add custom reason"
                                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                                        />
                                        <button
                                            onClick={() => {
                                                if (customReason.trim()) {
                                                    setActiveReason(customReason);
                                                    setShowReasonDropdown(false);
                                                    setCustomReason('');
                                                }
                                            }}
                                            className="text-blue-500 text-xs font-bold"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            )}
                            {/* Invisible backdrop to close dropdown on click outside */}
                            {showReasonDropdown && (
                                <div className="fixed inset-0 z-0 bg-transparent" onClick={() => setShowReasonDropdown(false)} />
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
                    <button
                        onClick={() => {
                            setSelectedRooms([]);
                            setReason('');
                            setSuiteType('Garden Suite');
                            setDateRanges([{ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }]);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={selectedRooms.length === 0}
                        className={`px-6 py-2 text-sm font-medium text-white rounded shadow-sm transition-colors ${selectedRooms.length > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'
                            }`}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
