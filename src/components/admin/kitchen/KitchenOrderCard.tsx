import React, { useMemo } from 'react';
import { FoodOrder } from '@/lib/firestoreService';
import { ClockIcon, CheckCircleIcon, FireIcon, MapPinIcon, UserIcon, EllipsisVerticalIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface KitchenOrderCardProps {
    order: FoodOrder;
    onUpdateStatus: (orderId: string, status: FoodOrder['status']) => void;
}

export default function KitchenOrderCard({ order, onUpdateStatus }: KitchenOrderCardProps) {
    // Calculate elapsed time
    const elapsedTime = useMemo(() => {
        const now = new Date();
        const created = new Date(order.createdAt);
        const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60); // minutes
        return diff;
    }, [order.createdAt]); // Note: In real app, need a timer to update this every minute

    const isLate = elapsedTime > 30;
    const isVeryLate = elapsedTime > 45;

    const getStatusStyles = () => {
        if (order.status === 'confirmed') return 'border-l-yellow-500 bg-white shadow-sm hover:shadow-md';
        if (order.status === 'preparing') return 'border-l-orange-500 bg-white shadow-sm hover:shadow-md';
        if (order.status === 'ready') return 'border-l-green-500 bg-white shadow-sm hover:shadow-md';
        return 'border-gray-200 bg-white';
    };

    return (
        <div className={`rounded-xl border border-gray-100 border-l-4 p-4 transition-all flex flex-col h-full ${getStatusStyles()}`}>

            {/* Header: Order #, Guest, Time */}
            <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-gray-800 tracking-tight">#{order.orderNumber}</h3>
                        {order.orderType === 'room_service' && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Room</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <UserIcon className="h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-[120px] font-medium text-gray-600">{order.guestName}</span>
                    </div>
                </div>

                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${isVeryLate ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' :
                        isLate ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                            'bg-gray-50 text-gray-600 border border-gray-100'
                    }`}>
                    <ClockIcon className="h-3.5 w-3.5" />
                    <span>{elapsedTime}m</span>
                    {isVeryLate && <ExclamationTriangleIcon className="h-3.5 w-3.5 ml-1" />}
                </div>
            </div>

            {/* Items List */}
            <div className="flex-1 space-y-2 mb-4 overflow-y-auto max-h-[220px] scrollbar-thin scrollbar-thumb-gray-100 pr-1">
                {order.items.map((item, idx) => (
                    <div key={`${order.id}-${idx}`} className="flex items-start gap-3 group">
                        {/* Qty Badge */}
                        <span className="flex-shrink-0 bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-md min-w-[24px] text-center border border-gray-200 group-hover:bg-gray-200 transition-colors">
                            {item.quantity}x
                        </span>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 leading-snug group-hover:text-gray-900">{item.name}</p>
                            {item.specialInstructions && (
                                <p className="text-xs text-red-500 font-medium italic mt-0.5 bg-red-50 p-1 rounded inline-block">
                                    "{item.specialInstructions}"
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Location & Tags */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-xs font-medium text-gray-500 border border-gray-100">
                    <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                    <span className="uppercase tracking-wide">{order.deliveryLocation?.replace('_', ' ') || 'Dine In'}{order.roomNumber ? ` - ${order.roomNumber}` : ''}</span>
                </div>
            </div>

            {/* Dynamic Actions */}
            <div className="mt-auto pt-3 border-t border-gray-50 flex gap-2">
                {order.status === 'confirmed' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <FireIcon className="h-4 w-4" />
                        Start Preparing
                    </button>
                )}
                {order.status === 'preparing' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'ready')}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="h-4 w-4" />
                        Mark Ready
                    </button>
                )}
                {order.status === 'ready' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'out_for_delivery')}
                        className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <span className="text-xl leading-none">🛎️</span>
                        Serve / Deliver
                    </button>
                )}
            </div>
        </div>
    );
}
