import React, { useMemo } from 'react';
import { FoodOrder } from '@/lib/firestoreService';
import KitchenOrderCard from './KitchenOrderCard';
import { ChevronRightIcon, InboxArrowDownIcon, FireIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

interface KitchenKanbanBoardProps {
    orders: FoodOrder[];
    onUpdateStatus: (orderId: string, status: FoodOrder['status']) => void;
}

export default function KitchenKanbanBoard({ orders, onUpdateStatus }: KitchenKanbanBoardProps) {

    const columns = useMemo(() => {
        return {
            pending: orders.filter(o => o.status === 'confirmed' || o.status === 'pending'),
            preparing: orders.filter(o => o.status === 'preparing'),
            ready: orders.filter(o => o.status === 'ready'),
        };
    }, [orders]);

    return (
        <div className="h-full flex flex-col relative w-full overflow-hidden">

            {/* Mobile Scroll Hint */}
            <div className="md:hidden absolute top-1/2 -translate-y-1/2 right-2 z-50 pointer-events-none opacity-50">
                <div className="animate-bounce-x bg-black/20 p-2 rounded-full backdrop-blur-sm">
                    <ChevronRightIcon className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Board Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex md:grid md:grid-cols-3 gap-0 h-full">

                {/* === PENDING COLUMN === */}
                <div className="flex-none w-[85vw] md:w-auto h-full flex flex-col snap-center border-r border-gray-200 bg-gray-100/50">
                    {/* Header */}
                    <div className="p-3 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                            <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">New</h2>
                        </div>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {columns.pending.length}
                        </span>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300">
                        {columns.pending.map(order => (
                            <KitchenOrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))}
                    </div>
                </div>

                {/* === PREPARING COLUMN === */}
                <div className="flex-none w-[85vw] md:w-auto h-full flex flex-col snap-center border-r border-gray-200 bg-gray-100/50">
                    {/* Header */}
                    <div className="p-3 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                            <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Cooking</h2>
                        </div>
                        <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {columns.preparing.length}
                        </span>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300">
                        {columns.preparing.map(order => (
                            <KitchenOrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))}
                    </div>
                </div>

                {/* === READY COLUMN === */}
                <div className="flex-none w-[85vw] md:w-auto h-full flex flex-col snap-center bg-gray-100/50">
                    {/* Header */}
                    <div className="p-3 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-green-600 rounded-full"></div>
                            <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Ready</h2>
                        </div>
                        <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {columns.ready.length}
                        </span>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300">
                        {columns.ready.map(order => (
                            <KitchenOrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
