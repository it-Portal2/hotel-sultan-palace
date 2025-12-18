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
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-x-auto pb-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
            {/* Incoming / Pending Column */}
            <div className="flex-1 min-w-[350px] bg-white border border-gray-200 rounded-lg flex flex-col h-full max-h-[calc(100vh-200px)] shadow-sm">
                <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                            <InboxIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm font-sans">New Orders</h3>
                            <p className="text-gray-500 text-xs text-left">Waiting for acceptance</p>
                        </div>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1 rounded-full">{pendingOrders.length}</span>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {pendingOrders.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                            <InboxIcon className="h-12 w-12 mb-3 opacity-20" />
                            <span className="text-sm font-medium opacity-60">No inbound orders</span>
                        </div>
                    ) : (
                        pendingOrders.map(order => (
                            <KitchenOrderTicket key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))
                    )}
                </div>
            </div>

            {/* Cooking / Preparing Column */}
            <div className="flex-1 min-w-[350px] bg-white border border-gray-200 rounded-lg flex flex-col h-full max-h-[calc(100vh-200px)] shadow-sm">
                <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                            <FireIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm font-sans">Prep Station</h3>
                            <p className="text-gray-500 text-xs text-left">Currently cooking</p>
                        </div>
                    </div>
                    <span className="bg-orange-100 text-orange-700 text-sm font-bold px-3 py-1 rounded-full">{preparingOrders.length}</span>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {preparingOrders.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                            <FireIcon className="h-12 w-12 mb-3 opacity-20" />
                            <span className="text-sm font-medium opacity-60">Station inactive</span>
                        </div>
                    ) : (
                        preparingOrders.map(order => (
                            <KitchenOrderTicket key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))
                    )}
                </div>
            </div>

            {/* Ready to Serve Column */}
            <div className="flex-1 min-w-[350px] bg-white border border-gray-200 rounded-lg flex flex-col h-full max-h-[calc(100vh-200px)] shadow-sm">
                <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                            <CheckBadgeIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm font-sans">Pass / Ready</h3>
                            <p className="text-gray-500 text-xs text-left">Ready for pickup</p>
                        </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">{readyOrders.length}</span>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {readyOrders.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                            <CheckBadgeIcon className="h-12 w-12 mb-3 opacity-20" />
                            <span className="text-sm font-medium opacity-60">Pass clear</span>
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
