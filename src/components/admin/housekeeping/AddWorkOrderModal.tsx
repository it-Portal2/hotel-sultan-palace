import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Room, SuiteType, WorkOrderPriority } from '@/lib/firestoreService';

interface AddWorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    rooms: Room[];
}

const ISSUE_TYPES = [
    'Plumbing', 'Electrical', 'Appliance', 'Furniture', 'HVAC (AC/Heating)', 'Housekeeping', 'Other'
];

export default function AddWorkOrderModal({ isOpen, onClose, onSubmit, rooms }: AddWorkOrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        roomName: '',
        issueType: 'Plumbing',
        priority: 'medium' as WorkOrderPriority,
        description: '',
        reportedBy: 'Housekeeping',
        isBlockRequired: false
    });
    const [customCategory, setCustomCategory] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCustomCategory('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.roomName || !formData.description) return;

        setLoading(true);
        try {
            // Use custom category if 'Other' is selected
            const finalIssueType = formData.issueType === 'Other' && customCategory.trim()
                ? customCategory.trim()
                : formData.issueType;

            await onSubmit({
                ...formData,
                issueType: finalIssueType
            });
            onClose();
            // Reset form
            setFormData({
                roomName: '',
                issueType: 'Plumbing',
                priority: 'medium',
                description: '',
                reportedBy: 'Housekeeping',
                isBlockRequired: false
            });
            setCustomCategory('');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-transparent transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />

                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    <div className="pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 bg-white shadow-xl flex flex-col h-full border-l border-gray-200">

                        {/* Header */}
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6 bg-gray-50 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900" id="slide-over-title">
                                Create Work Order
                            </h2>
                            <div className="ml-3 flex h-7 items-center">
                                <button
                                    type="button"
                                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close panel</span>
                                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Room Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.roomName}
                                        onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                        required
                                    >
                                        <option value="">Select a Room</option>
                                        {rooms.map(room => (
                                            <option key={room.id} value={room.roomName}>{room.roomName} ({room.suiteType})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Issue Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category</label>
                                    <select
                                        value={formData.issueType}
                                        onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                                    >
                                        {ISSUE_TYPES.filter(t => t !== 'Other').map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                        <option value="Other">Custom</option>
                                    </select>
                                    {formData.issueType === 'Other' && (
                                        <input
                                            type="text"
                                            placeholder="Enter Custom Category..."
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            className="mt-2 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400 animate-fade-in"
                                            required={formData.issueType === 'Other'}
                                        />
                                    )}
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['low', 'medium', 'high', 'critical'].map((p) => (
                                            <label
                                                key={p}
                                                className={`
                                                    flex items-center justify-center py-2 px-1 text-xs font-medium uppercase rounded-md border cursor-pointer transition-all
                                                    ${formData.priority === p
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <input
                                                    type="radio"
                                                    name="priority"
                                                    value={p}
                                                    checked={formData.priority === p}
                                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                                    className="sr-only"
                                                />
                                                {p}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Describe the issue in detail..."
                                        required
                                    />
                                </div>

                                {/* Reported By */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reported By</label>
                                    <input
                                        type="text"
                                        value={formData.reportedBy}
                                        onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>

                                {/* Block Room Toggle */}
                                <div className="rounded-md bg-red-50 p-4 border border-red-100">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <input
                                                id="block-room"
                                                type="checkbox"
                                                checked={formData.isBlockRequired}
                                                onChange={(e) => setFormData({ ...formData, isBlockRequired: e.target.checked })}
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-1"
                                            />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">
                                                <label htmlFor="block-room">Request Room Block (Maintenance)</label>
                                            </h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>
                                                    Checking this will immediately mark the room as status "Maintenance" in the system, preventing new bookings.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                onClick={handleSubmit}
                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
