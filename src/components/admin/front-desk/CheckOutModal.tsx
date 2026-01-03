import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Booking, HousekeepingTask } from '@/lib/firestoreService';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface CheckOutModalProps {
    booking: Booking;
    roomIndex?: number;
    position?: { top: number, left: number };
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

export default function CheckOutModal({ booking, roomIndex, onClose, onConfirm, processing, position }: CheckOutModalProps) {
    const [formData, setFormData] = useState<CheckOutData>({
        staffName: '',
        depositReturned: false,
        notes: '',
        housekeepingPriority: 'high',
        housekeepingAssignee: '',
    });

    // Animation State
    const [isOpen, setIsOpen] = useState(false);

    React.useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsOpen(true));
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    const rIndex = roomIndex !== undefined ? roomIndex : 0;
    const targetRoom = booking.rooms[rIndex] || booking.rooms[0];
    const roomName = targetRoom.allocatedRoomType || 'Unassigned';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(formData);
    };

    // --- CONTEXTUAL VERTICAL POSITIONING ---
    const WINDOW_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 900;
    const DRAWER_ESTIMATED_HEIGHT = 450;
    let verticalTop = 20;

    if (position) {
        verticalTop = position.top;
        verticalTop = Math.max(20, verticalTop - 50);
        if (verticalTop + DRAWER_ESTIMATED_HEIGHT > WINDOW_HEIGHT) {
            verticalTop = Math.max(20, WINDOW_HEIGHT - DRAWER_ESTIMATED_HEIGHT - 20);
        }
    }

    return (
        <Transition.Root show={isOpen} as={Fragment} afterLeave={onClose}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/10 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-out duration-500 sm:duration-500"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in duration-500 sm:duration-500"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel
                                    className="pointer-events-auto w-[900px] max-w-full"
                                    style={{ marginTop: `${verticalTop}px` }}
                                >
                                    <div className="flex flex-col bg-white shadow-2xl rounded-l-2xl border border-gray-100 overflow-hidden max-h-[calc(100vh-40px)]">
                                        <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center shrink-0">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Check-Out Guest</h3>
                                                <p className="text-gray-500 text-sm mt-0.5 font-mono">ID: {booking.bookingId}</p>
                                            </div>
                                            <button onClick={handleClose} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors rounded-full">
                                                <XCircleIcon className="h-6 w-6" />
                                            </button>
                                        </div>

                                        <div className="p-6 bg-white overflow-y-auto custom-scrollbar flex-1 space-y-6">
                                            {/* Automation Info */}
                                            <div className="bg-gray-50/50 p-4 border border-gray-100 flex items-start gap-3 rounded-lg">
                                                <div className="p-2 bg-green-100 text-green-600 mt-0.5 rounded-full">
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

                                            <form id="checkOutForm" onSubmit={handleSubmit} className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Processed By (Staff Name) *</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400"
                                                        value={formData.staffName}
                                                        onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                                                        placeholder="Enter your name"
                                                    />
                                                </div>

                                                <div className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, depositReturned: !formData.depositReturned })}>
                                                    <div className={`relative flex items-center justify-center w-5 h-5 mr-3 border rounded transition-colors ${formData.depositReturned ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
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
                                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Housekeeping Settings</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Priority</label>
                                                            <select
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
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
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Assign To (Optional)</label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400"
                                                                value={formData.housekeepingAssignee}
                                                                onChange={(e) => setFormData({ ...formData, housekeepingAssignee: e.target.value })}
                                                                placeholder="Staff Name"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Notes / Comments</label>
                                                    <textarea
                                                        rows={3}
                                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                                                        value={formData.notes}
                                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                        placeholder="Any feedback or issues..."
                                                    />
                                                </div>
                                            </form>
                                        </div>

                                        <div className="bg-gray-50/50 border-t border-gray-100 p-6 flex gap-3 sticky bottom-0 z-10">
                                            <button
                                                onClick={handleClose}
                                                type="button"
                                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm rounded-xl uppercase tracking-wide text-xs"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                form="checkOutForm"
                                                disabled={processing || !formData.staffName}
                                                className="flex-1 py-3 bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200 disabled:opacity-50 disabled:shadow-none rounded-xl uppercase tracking-wide text-xs"
                                            >
                                                {processing ? 'Processing...' : 'Confirm Check-out'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
