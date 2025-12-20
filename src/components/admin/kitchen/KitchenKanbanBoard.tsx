import React, { useMemo } from 'react';
import { FoodOrder } from '@/lib/firestoreService';
import KitchenOrderCard from './KitchenOrderCard';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface KitchenKanbanBoardProps {
    orders: FoodOrder[];
    onUpdateStatus: (orderId: string, status: FoodOrder['status']) => void;
}

export default function KitchenKanbanBoard({ orders, onUpdateStatus }: KitchenKanbanBoardProps) {

    const columns = useMemo(() => {
        return {
            pending: orders.filter(o => o.status === 'confirmed' || o.status === 'pending'),
            cooking: orders.filter(o => o.status === 'preparing'),
            ready: orders.filter(o => o.status === 'ready'),
        };
    }, [orders]);

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gray-50/50 relative">
            {/* Mobile Scroll Hint */}
            <div className="md:hidden absolute top-20 right-0 z-50 pointer-events-none">
                <div className="animate-bounce-x bg-white/80 p-1 rounded-l-full shadow-md border border-gray-200">
                    <ChevronRightIcon className="h-6 w-6 text-slate-600" />
                </div>
            </div>
            {/* Desktop: Grid | Mobile: Snap Scroll Row */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex md:grid md:grid-cols-3 gap-4 md:gap-6 p-4">

                {/* NEW ORDERS */}
                <div className="flex-none w-[85vw] md:w-auto h-full flex flex-col bg-white rounded-xl shadow-sm border-t-4 border-t-yellow-400 border-x border-b border-gray-100 snap-center">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-yellow-50/30">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                            </span>
                            <h2 className="font-bold text-gray-800 uppercase tracking-wider text-sm">New Orders</h2>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full">{columns.pending.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                        {columns.pending.map(order => (
                            <KitchenOrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))}
                        {columns.pending.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                                <span className="opacity-50 text-4xl mb-2">🍽️</span>
                                No new orders
                            </div>
                        )}
                    </div>
                </div>

                {/* COOKING */}
                <div className="flex-none w-[85vw] md:w-auto h-full flex flex-col bg-white rounded-xl shadow-sm border-t-4 border-t-orange-500 border-x border-b border-gray-100 snap-center">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-orange-50/30">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                            <h2 className="font-bold text-gray-800 uppercase tracking-wider text-sm">Preparing</h2>
                        </div>
                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">{columns.cooking.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                        {columns.cooking.map(order => (
                            <KitchenOrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))}
                        {columns.cooking.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                                <span className="opacity-50 text-4xl mb-2">👨‍🍳</span>
                                Nothing cooking
                            </div>
                        )}
                    </div>
                </div>

                {/* READY */}
                <div className="flex-none w-[85vw] md:w-auto h-full flex flex-col bg-white rounded-xl shadow-sm border-t-4 border-t-green-500 border-x border-b border-gray-100 snap-center">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-green-50/30">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                            <h2 className="font-bold text-gray-800 uppercase tracking-wider text-sm">Ready to Serve</h2>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">{columns.ready.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                        {columns.ready.map(order => (
                            <KitchenOrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                        ))}
                        {columns.ready.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                                <span className="opacity-50 text-4xl mb-2">✅</span>
                                No ready orders
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
