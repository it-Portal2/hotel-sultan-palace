import React from 'react';
import { FoodOrder } from '@/lib/firestoreService';
import { ClockIcon } from '@heroicons/react/24/outline';

interface OrderTableProps {
    orders: FoodOrder[];
    onSelect: (order: FoodOrder) => void;
    statusColors: (status: string) => string;
}

export default function OrderTable({ orders, onSelect, statusColors }: OrderTableProps) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-16 bg-white border border-gray-100 shadow-sm">
                <p className="text-lg font-medium text-gray-600">No orders found</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {orders.map((order) => (
                            <tr
                                key={order.id}
                                className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                onClick={() => onSelect(order)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-gray-900 font-mono">{order.orderNumber}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{order.guestName}</div>
                                    <div className="text-xs text-gray-500">{order.guestPhone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-700 capitalize">
                                        {order.roomNumber ? `Room ${order.roomNumber}` : (order.deliveryLocation || 'N/A').replace('_', ' ')}
                                    </div>
                                    {order.scheduledDeliveryTime && (
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <ClockIcon className="h-3 w-3" />
                                            {new Date(order.scheduledDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 font-medium">
                                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                        {order.items.map(i => i.name).join(', ')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-gray-900">${order.totalAmount?.toFixed(2)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 text-xs font-medium border ${statusColors(order.status || 'pending')}`}>
                                        {(order.status || 'pending').replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(order);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium hover:bg-indigo-50 px-3 py-1.5 transition-colors"
                                    >
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
