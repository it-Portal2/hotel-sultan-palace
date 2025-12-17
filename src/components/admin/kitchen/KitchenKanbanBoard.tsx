import React from 'react';
import { FoodOrder } from '@/lib/firestoreService';
import KitchenOrderTicket from './KitchenOrderTicket';
import { InboxIcon, FireIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

interface KitchenKanbanBoardProps {
    orders: FoodOrder[];
    onUpdateStatus: (orderId: string, status: FoodOrder['status']) => void;
}

export default function KitchenKanbanBoard({ orders, onUpdateStatus }: KitchenKanbanBoardProps) {
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-x-auto pb-4">
            {/* Incoming / Pending Column */}
            <div className="flex-1 min-w-[320px] bg-gray-50 border border-gray-200 flex flex-col h-full max-h-[calc(100vh-180px)]">
                <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 text-blue-600">
                            <InboxIcon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">New Orders</h3>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{pendingOrders.length}</span>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {pendingOrders.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                            <InboxIcon className="h-8 w-8 mb-2 opacity-50" />
                            <span className="text-sm">No new orders</span>
                        </div>
                    ) : (
                        pendingOrders.map(order => (
                            <KitchenOrderTicket key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))
                    )}
                </div>
            </div>

            {/* Cooking / Preparing Column */}
            <div className="flex-1 min-w-[320px] bg-gray-50 border border-gray-200 flex flex-col h-full max-h-[calc(100vh-180px)]">
                <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-50 text-orange-600">
                            <FireIcon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Cooking</h3>
                    </div>
                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">{preparingOrders.length}</span>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {preparingOrders.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                            <FireIcon className="h-8 w-8 mb-2 opacity-50" />
                            <span className="text-sm">Station clear</span>
                        </div>
                    ) : (
                        preparingOrders.map(order => (
                            <KitchenOrderTicket key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))
                    )}
                </div>
            </div>

            {/* Ready to Serve Column */}
            <div className="flex-1 min-w-[320px] bg-gray-50 border border-gray-200 flex flex-col h-full max-h-[calc(100vh-180px)]">
                <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-50 text-green-600">
                            <CheckBadgeIcon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Ready to Serve</h3>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">{readyOrders.length}</span>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {readyOrders.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                            <CheckBadgeIcon className="h-8 w-8 mb-2 opacity-50" />
                            <span className="text-sm">No pending service</span>
                        </div>
                    ) : (
                        readyOrders.map(order => (
                            <KitchenOrderTicket key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
