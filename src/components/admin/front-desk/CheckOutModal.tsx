import React, { useState } from 'react';
import { Booking, HousekeepingTask } from '@/lib/firestoreService';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface CheckOutModalProps {
    booking: Booking;
    roomIndex?: number;
    onClose: () => void;
    onConfirm: (data: CheckOutData) => Promise<void>;
    processing: boolean;
}

export interface CheckOutData {
    staffName: string;
    depositReturned: boolean;
    notes?: string;
    housekeepingPriority: 'low' | 'medium' | 'high' | 'urgent';
    housekeepingAssignee?: string;
}

export default function CheckOutModal({ booking, roomIndex, onClose, onConfirm, processing }: CheckOutModalProps) {
    const [formData, setFormData] = useState<CheckOutData>({
        staffName: '',
        depositReturned: false,
        notes: '',
        housekeepingPriority: 'high',
        housekeepingAssignee: '',
    });

    const rIndex = roomIndex !== undefined ? roomIndex : 0;
    const targetRoom = booking.rooms[rIndex] || booking.rooms[0];
    const roomName = targetRoom.allocatedRoomType || 'Unassigned';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="fixed inset-0 bg-transparent" onClick={onClose}></div>
            <div className="relative bg-white shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-gray-100" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)' }}>
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Check-Out Guest</h3>
                        <p className="text-gray-500 text-sm mt-0.5 font-mono">ID: {booking.bookingId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Automation Info */}
                    <div className="bg-gray-50/50 p-4 border border-gray-100 flex items-start gap-3">
                        <div className="p-2 bg-green-100 text-green-600 mt-0.5">
                            <span className="sr-only">Info</span>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Automation Enabled</p>
                            <p className="text-sm text-gray-500 mt-0.5">
                                A housekeeping task will be automatically created for <strong>Room {roomName}</strong> upon check-out.
                            </p>
                        </div>
                    </div>

                    <form id="checkOutForm" onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Processed By (Staff Name) *</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400"
                                value={formData.staffName}
                                onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className="flex items-center p-4 bg-white border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, depositReturned: !formData.depositReturned })}>
                            <div className={`relative flex items-center justify-center w-5 h-5 mr-3 border transition-colors ${formData.depositReturned ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                {formData.depositReturned && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <label className="text-sm font-medium text-gray-900 cursor-pointer select-none flex-1">
                                Confirm Security Deposit Returned
                            </label>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={formData.depositReturned}
                                readOnly
                            />
                        </div>

                        <div className="pt-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Housekeeping Settings</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                        value={formData.housekeepingPriority}
                                        onChange={(e) => setFormData({ ...formData, housekeepingPriority: e.target.value as any })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Assign To (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400"
                                        value={formData.housekeepingAssignee}
                                        onChange={(e) => setFormData({ ...formData, housekeepingAssignee: e.target.value })}
                                        placeholder="Staff Name"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes / Comments</label>
                            <textarea
                                rows={2}
                                className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any feedback or issues..."
                            />
                        </div>
                    </form>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 p-6 flex gap-3 sticky bottom-0 z-10">
                    <button
                        onClick={onClose}
                        type="button"
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="checkOutForm"
                        disabled={processing || !formData.staffName}
                        className="flex-1 py-3 bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        {processing ? 'Processing...' : 'Confirm Check-out'}
                    </button>
                </div>
            </div>
        </div>
    );
}
