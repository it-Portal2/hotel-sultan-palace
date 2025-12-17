import React from 'react';
import { HousekeepingTask } from '@/lib/firestoreService';
import { ClockIcon, PlayIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import RestrictedAction from '@/components/admin/RestrictedAction';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface HousekeepingTableProps {
    tasks: HousekeepingTask[];
    onUpdateStatus: (taskId: string, status: HousekeepingTask['status']) => void;
    isReadOnly: boolean;
}

export default function HousekeepingTable({ tasks, onUpdateStatus, isReadOnly }: HousekeepingTableProps) {

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-700 bg-red-50 border-red-100';
            case 'high': return 'text-orange-700 bg-orange-50 border-orange-100';
            case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-100';
            case 'low': return 'text-green-700 bg-green-50 border-green-100';
            default: return 'text-gray-700 bg-gray-50 border-gray-100';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
            case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'completed': return 'text-green-600 bg-green-50 border-green-100';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-16 bg-white border border-gray-100 shadow-sm">
                <p className="text-lg font-medium text-gray-600">No tasks found</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
        );
    }

    const [confirmState, setConfirmState] = React.useState<{ isOpen: boolean; taskId: string | null }>({
        isOpen: false,
        taskId: null
    });

    return (
        <>
            <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Room / Area</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time Info</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{task.roomName || 'General Area'}</div>
                                        {task.suiteType && <div className="text-xs text-gray-500">{task.suiteType}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 capitalize">{task.taskType.replace('_', ' ')}</div>
                                        {task.notes && (
                                            <div className="text-xs text-gray-500 truncate max-w-[150px]" title={task.notes}>
                                                "{task.notes}"
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {task.assignedTo ? (
                                            <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-0.5">
                                                {task.assignedTo}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs text-gray-500">
                                            Created: {new Date(task.createdAt).toLocaleDateString()}
                                        </div>
                                        {task.scheduledTime && (
                                            <div className="text-xs text-blue-600 font-medium">
                                                Due: {new Date(task.scheduledTime).toLocaleDateString()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 text-xs font-bold border ${getStatusColor(task.status)}`}>
                                            {task.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {!isReadOnly && task.status !== 'completed' && task.status !== 'cancelled' && (
                                            <div className="flex justify-end gap-2">
                                                {task.status === 'pending' && (
                                                    <button
                                                        onClick={() => onUpdateStatus(task.id, 'in_progress')}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors"
                                                    >
                                                        <PlayIcon className="h-4 w-4" />
                                                        Start
                                                    </button>
                                                )}
                                                {task.status === 'in_progress' && (
                                                    <button
                                                        onClick={() => onUpdateStatus(task.id, 'completed')}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                        Complete
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setConfirmState({ isOpen: true, taskId: task.id })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition-colors"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false, taskId: null })}
                onConfirm={() => {
                    if (confirmState.taskId) {
                        onUpdateStatus(confirmState.taskId, 'cancelled');
                        setConfirmState({ isOpen: false, taskId: null });
                    }
                }}
                title="Cancel Task"
                message="Are you sure you want to cancel this housekeeping task? This action cannot be undone."
                confirmText="Yes, Cancel Task"
                cancelText="No, Keep Task"
            />
        </>
    );
}
