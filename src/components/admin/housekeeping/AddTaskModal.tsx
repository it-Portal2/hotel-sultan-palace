
import React, { useState } from 'react';
import {
    createHousekeepingTask,
    RoomType,
    SuiteType,
    HousekeepingTask
} from '@/lib/firestoreService';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    roomTypes: RoomType[];
}

export default function AddTaskModal({ isOpen, onClose, onSuccess, roomTypes }: AddTaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        roomName: '',
        taskType: 'cleaning' as HousekeepingTask['taskType'], // Default
        priority: 'medium' as HousekeepingTask['priority'],
        assignedTo: '',
        notes: '',
        scheduledDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Find suite type for the selected room
            const selectedRoom = roomTypes.find(r => r.roomName === formData.roomName);
            const suiteType = selectedRoom?.suiteType || 'Garden Suite';

            await createHousekeepingTask({
                roomName: formData.roomName,
                suiteType: suiteType as SuiteType,
                taskType: formData.taskType,
                priority: formData.priority,
                status: 'pending',
                assignedTo: formData.assignedTo || undefined,
                notes: formData.notes || undefined,
                scheduledTime: new Date(formData.scheduledDate),
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating task:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">

                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="addTaskForm" onSubmit={handleSubmit} className="space-y-4">

                        {/* Room Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Room *</label>
                            <select
                                required
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all"
                                value={formData.roomName}
                                onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                            >
                                <option value="">-- Choose a Room --</option>
                                {roomTypes.map(room => (
                                    <option key={room.id} value={room.roomName}>
                                        {room.roomName} ({room.suiteType})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Task Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Type *</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all"
                                    value={formData.taskType}
                                    onChange={(e) => setFormData({ ...formData, taskType: e.target.value as any })}
                                >
                                    <option value="checkout_cleaning">Checkout Cleaning</option>
                                    <option value="stayover_cleaning">Stayover Cleaning</option>
                                    <option value="deep_cleaning">Deep Cleaning</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="inspection">Inspection</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority *</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        {/* Assignee & Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign To</label>
                                <input
                                    type="text"
                                    placeholder="Staff Name"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all"
                                    value={formData.assignedTo}
                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Scheduled Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all"
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes / Instructions</label>
                            <textarea
                                rows={3}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] outline-none transition-all resize-none"
                                placeholder="Details about the task..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        type="button"
                        className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="addTaskForm"
                        disabled={loading || !formData.roomName}
                        className="flex-1 py-2.5 bg-[#FF6A00] text-white font-bold rounded-lg hover:bg-[#e65f00] transition-colors shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? 'Creating...' : 'Create Task'}
                    </button>
                </div>

            </div>
        </div>
    );
}
