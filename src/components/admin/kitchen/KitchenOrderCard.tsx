import React, { useState, useEffect } from 'react';
import { FoodOrder } from '@/lib/firestoreService';
import {
    ClockIcon,
    FireIcon,
    CheckCircleIcon,
    MapPinIcon,
    UserIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

interface KitchenOrderCardProps {
    order: FoodOrder;
    onUpdateStatus: (orderId: string, status: FoodOrder['status']) => void;
}

export default function KitchenOrderCard({ order, onUpdateStatus }: KitchenOrderCardProps) {
    const [elapsedMinutes, setElapsedMinutes] = useState(0);

    useEffect(() => {
        const calculateElapsed = () => {
            const now = new Date();
            const created = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
            const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
            setElapsedMinutes(diff);
        };
        calculateElapsed();
        const interval = setInterval(calculateElapsed, 60000);
        return () => clearInterval(interval);
    }, [order.createdAt]);

    // Status Colors (Header Backgrounds)
    let headerColor = "bg-gray-100 text-gray-700";
    let statusText = "Pending";

    if (order.status === 'confirmed' || order.status === 'pending') {
        headerColor = "bg-blue-600 text-white";
        statusText = "NEW ORDER";
    } else if (order.status === 'preparing') {
        headerColor = "bg-orange-500 text-white";
        statusText = "PREPARING";
    } else if (order.status === 'ready') {
        headerColor = "bg-green-600 text-white";
        statusText = "READY";
    }

    const isLate = elapsedMinutes > 20;

    return (
        <div className="flex flex-col w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-auto flex-shrink-0">
            {/* TICKET HEADER */}
            <div className={`${headerColor} px-4 py-2 flex justify-between items-center`}>
                <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight leading-none">#{order.orderNumber}</span>
                    <span className="text-[10px] font-bold uppercase opacity-90 mt-0.5 tracking-wider">{statusText}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${isLate && order.status !== 'ready' ? 'bg-red-600 text-white animate-pulse' : 'bg-black/20 text-white'}`}>
                    <ClockIcon className="h-3.5 w-3.5" />
                    <span>{elapsedMinutes}m</span>
                </div>
            </div>

            {/* INFO BAR */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
                    <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                    <span>{order.deliveryLocation?.replace('_', ' ') || 'Dine In'}</span>
                    {order.roomNumber && <span className="text-gray-400 mx-1">|</span>}
                    {order.roomNumber && <span>RM {order.roomNumber}</span>}
                </div>
                <div className="flex items-center gap-1.5 truncate max-w-[100px]" title={order.guestName}>
                    <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate">{order.guestName}</span>
                </div>
            </div>

            {/* ORDER ITEMS (Ticket Body) */}
            <div className="flex-1 p-0 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-200 bg-white">
                <ul className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                        <li key={`${order.id}-${idx}`} className="p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                                {/* Quantity */}
                                <div className="text-lg font-bold text-gray-900 min-w-[24px] text-center leading-none mt-0.5">
                                    {item.quantity}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800 leading-tight">{item.name}</p>

                                    {(item.variant || (item.selectedModifiers && item.selectedModifiers.length > 0)) && (
                                        <div className="mt-1 space-y-0.5">
                                            {item.variant && (
                                                <p className="text-xs text-gray-500 font-medium">
                                                    <span className="text-gray-400">Size:</span> {item.variant.name}
                                                </p>
                                            )}
                                            {item.selectedModifiers?.map((mod, mIdx) => (
                                                <p key={mIdx} className="text-xs text-gray-500 font-medium">
                                                    <span className="text-gray-400">+</span> {mod.name}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {item.specialInstructions && (
                                        <div className="mt-2 flex items-start gap-1.5 bg-red-50 p-2 rounded text-red-700 text-xs font-bold border border-red-100">
                                            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                                            <span>{item.specialInstructions}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-3 bg-gray-50 border-t border-gray-100">
                {order.status === 'confirmed' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                        className="w-full py-3 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg font-bold text-sm uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <FireIcon className="h-4 w-4" />
                        Start Cooking
                    </button>
                )}
                {order.status === 'preparing' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'ready')}
                        className="w-full py-3 bg-white border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white rounded-lg font-bold text-sm uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="h-4 w-4" />
                        Mark Ready
                    </button>
                )}
                {order.status === 'ready' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'out_for_delivery')}
                        className="w-full py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        Serve / Deliver
                    </button>
                )}
            </div>
        </div>
    );
}
