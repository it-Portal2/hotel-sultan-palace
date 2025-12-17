import React, { useState, useEffect } from 'react';
import { FoodOrder } from '@/lib/firestoreService';
import { ClockIcon, MapPinIcon, CheckCircleIcon, FireIcon, BellAlertIcon } from '@heroicons/react/24/outline';

interface KitchenOrderTicketProps {
    order: FoodOrder;
    onUpdateStatus: (orderId: string, status: FoodOrder['status']) => void;
}

export default function KitchenOrderTicket({ order, onUpdateStatus }: KitchenOrderTicketProps) {
    const [elapsedMinutes, setElapsedMinutes] = useState(0);

    useEffect(() => {
        const calculateElapsed = () => {
            const start = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
            const now = new Date();
            const diff = Math.floor((now.getTime() - start.getTime()) / 60000);
            setElapsedMinutes(diff);
        };

        calculateElapsed();
        const interval = setInterval(calculateElapsed, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [order.createdAt]);

    const getUrgencyColor = () => {
        if (order.status === 'delivered' || order.status === 'ready') return 'bg-gray-50 border-gray-200';
        if (elapsedMinutes > 45) return 'bg-red-50 border-red-200 animate-pulse';
        if (elapsedMinutes > 30) return 'bg-orange-50 border-orange-200';
        return 'bg-white border-gray-200';
    };

    const getTimerColor = () => {
        if (order.status === 'delivered' || order.status === 'ready') return 'text-gray-500';
        if (elapsedMinutes > 45) return 'text-red-700 font-bold';
        if (elapsedMinutes > 30) return 'text-orange-700 font-bold';
        return 'text-green-700 font-medium';
    };

    return (
        <div className={`relative border shadow-sm flex flex-col w-full transition-all duration-300 ${getUrgencyColor()}`}>
            {/* Ticket Header - "Holes" simulation */}
            <div className="absolute -top-1 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSI1IiByPSI0IiBmaWxsPSIjZjNmNGY2IiAvPjwvc3ZnPg==')] bg-contain bg-repeat-x opacity-100"></div>

            <div className="p-4 border-b border-dashed border-gray-300">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-xs font-mono text-gray-500 uppercase">Order ID</span>
                        <h3 className="text-xl font-mono font-bold text-gray-900 leading-none mt-1">#{order.orderNumber.split('-')[1]}</h3>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${getTimerColor()}`}>
                        <ClockIcon className="h-4 w-4" />
                        <span>{elapsedMinutes}m</span>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-600 font-medium bg-white/50 px-2 py-1 border border-gray-200">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {order.roomNumber ? `Room ${order.roomNumber}` : (order.deliveryLocation || 'N/A')}
                    </div>
                    <span className="text-xs font-mono text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            {/* Ticket Body - Items */}
            <div className="p-4 flex-grow bg-white/50">
                <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start font-mono">
                                <span className="font-bold text-gray-900 w-6">{item.quantity}x</span>
                                <span className="flex-1 text-gray-800 font-medium px-2">{item.name}</span>
                            </div>
                            {item.specialInstructions && (
                                <div className="mt-1 ml-8 text-xs text-red-600 italic bg-red-50 p-1 border border-red-100 inline-block">
                                    Note: {item.specialInstructions}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Ticket Footer - Actions */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 mt-auto">
                {order.status === 'pending' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'confirmed')}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                        <CheckCircleIcon className="h-4 w-4" />
                        Accept Ticket
                    </button>
                )}
                {order.status === 'confirmed' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                        className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                        <FireIcon className="h-4 w-4" />
                        Start Cooking
                    </button>
                )}
                {order.status === 'preparing' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'ready')}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                        <BellAlertIcon className="h-4 w-4" />
                        Mark Ready
                    </button>
                )}
                {order.status === 'ready' && (
                    <div className="w-full py-2 bg-gray-100 text-gray-500 text-sm font-bold text-center border border-gray-200 uppercase tracking-wider flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-4 w-4" />
                        Completed
                    </div>
                )}
            </div>
        </div>
    );
}
