import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    FunnelIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    WrenchScrewdriverIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import {
    getWorkOrders,
    updateWorkOrder,
    WorkOrder,
    WorkOrderStatus,
    Room
} from '@/lib/firestoreService';
import AddWorkOrderModal from './AddWorkOrderModal';
import { useAdminRole } from '@/context/AdminRoleContext';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface WorkOrderViewProps {
    rooms: Room[];
}

export default function WorkOrderView({ rooms }: WorkOrderViewProps) {
    const { isReadOnly } = useAdminRole();
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filter, setFilter] = useState<'active' | 'history'>('active');

    const loadData = async () => {
        setLoading(true);
        try {
            // In a real app with many records, we'd filter at API level
            // Here we fetch all (recent) and filter active/history in memory or request filtered
            const data = await getWorkOrders('all');
            setWorkOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (data: any) => {
        // We can import createWorkOrder here.
        const { createWorkOrder, markRoomForMaintenance } = await import('@/lib/firestoreService');

        await createWorkOrder(data);

        // Handle Block Maintenance if requested
        if (data.isBlockRequired && data.roomName) {
            try {
                // Default to blocking today until further notice (or 1 day default)
                // The form doesn't define dates, so we assume "Indefinite" or "Today onwards"
                // For now, let's block for 3 days by default or until unlocked.
                const today = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 3); // 3 day default block for Work Order

                await markRoomForMaintenance(
                    data.roomName,
                    today,
                    endDate,
                    `Work Order: ${data.issueType} - ${data.description.substring(0, 30)}...`
                );
            } catch (err) {
                console.error("Failed to auto-block room", err);
            }
        }

        await loadData();
    };

    const handleUpdateStatus = async (id: string, newStatus: WorkOrderStatus) => {
        if (isReadOnly) return;
        try {
            await updateWorkOrder(id, { status: newStatus });
            await loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // Filter Logic
    const filteredOrders = workOrders.filter(order => {
        if (filter === 'active') {
            return ['open', 'in_progress'].includes(order.status);
        } else {
            return ['resolved', 'cancelled'].includes(order.status);
        }
    });

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-50 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case 'open': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full border border-red-200 font-medium">Open</span>;
            case 'in_progress': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-200 font-medium flex items-center gap-1"><WrenchScrewdriverIcon className="w-3 h-3" /> In Progress</span>;
            case 'resolved': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200 font-medium flex items-center gap-1"><CheckCircleIcon className="w-3 h-3" /> Resolved</span>;
            default: return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Closed</span>;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Active Orders
                    </button>
                    <button
                        onClick={() => setFilter('history')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Order History
                    </button>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm"
                    disabled={isReadOnly}
                >
                    <PlusIcon className="w-4 h-4" />
                    Create Work Order
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading Work Orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <WrenchScrewdriverIcon className="w-12 h-12 mb-3 opacity-20" />
                        <p>No {filter} work orders found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-gray-900">{order.roomName}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider ${getPriorityColor(order.priority)}`}>
                                            {order.priority}
                                        </span>
                                        <span className="text-sm text-gray-500 font-medium px-2 py-0.5 bg-gray-50 rounded border border-gray-100">
                                            {order.issueType}
                                        </span>
                                    </div>
                                    <div>
                                        {getStatusBadge(order.status)}
                                    </div>
                                </div>

                                <p className="text-gray-700 mb-4 text-sm leading-relaxed max-w-3xl">
                                    {order.description}
                                </p>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                                    <div className="flex gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="w-3 h-3" />
                                            {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </span>
                                        <span>Reported by: <span className="text-gray-600 font-medium">{order.reportedBy}</span></span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {order.status === 'open' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'in_progress')}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 text-xs font-medium transition-colors"
                                            >
                                                Start Work
                                            </button>
                                        )}
                                        {order.status === 'in_progress' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'resolved')}
                                                className="px-3 py-1.5 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 text-xs font-medium transition-colors flex items-center gap-1"
                                            >
                                                <CheckCircleIcon className="w-3 h-3" /> Mark Resolved
                                            </button>
                                        )}
                                        {order.status !== 'resolved' && order.status !== 'cancelled' && (
                                            <button
                                                onClick={() => confirm('Cancel this work order?') && handleUpdateStatus(order.id, 'cancelled')}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Cancel Order"
                                            >
                                                <FaTimes className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AddWorkOrderModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleCreate}
                rooms={rooms}
            />
        </div>
    );
}
