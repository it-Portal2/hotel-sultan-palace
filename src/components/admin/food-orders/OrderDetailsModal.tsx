import React from 'react';
import { FoodOrder } from '@/lib/firestoreService';
import { XCircleIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import RestrictedAction from '@/components/admin/RestrictedAction';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface OrderDetailsModalProps {
    order: FoodOrder;
    onClose: () => void;
    onUpdateStatus: (id: string, status: FoodOrder['status']) => void;
    isReadOnly: boolean;
}

export default function OrderDetailsModal({ order, onClose, onUpdateStatus, isReadOnly }: OrderDetailsModalProps) {

    const deliveryLocationLabels: Record<string, string> = {
        in_room: 'In Room',
        restaurant: 'Restaurant',
        bar: 'Bar',
        beach_side: 'Beach Side',
        pool_side: 'Pool Side',
    };

    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

    return (
        <div className="fixed inset-0 z-50 flex justify-end items-start pt-16 pr-4 pb-4 animate-fade-in pointer-events-none">
            {/* Transparent Backdrop (Click to Close) - pointer-events-auto re-enables clicking */}
            <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={onClose}></div>

            {/* Drawer Content - Floating Right Panel */}
            <div
                className="relative bg-white shadow-2xl w-full max-w-md flex flex-col border border-gray-200 rounded-xl transform transition-transform duration-300 pointer-events-auto max-h-[calc(100vh-5rem)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Created: {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content & Actions (Scrollable) */}
                <div className="overflow-y-auto custom-scrollbar p-6">
                    <div className="space-y-6">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50/50 p-4 border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                                    <UserIcon className="h-5 w-5 text-[#FF6A00] mr-2" />
                                    Guest Details
                                </h4>
                                <p className="text-sm font-medium text-gray-900">{order.guestName}</p>
                                <p className="text-sm text-gray-500">{order.guestPhone}</p>
                                {order.guestEmail && <p className="text-sm text-gray-500">{order.guestEmail}</p>}
                                {order.roomNumber && <p className="text-sm font-semibold text-indigo-600 mt-1">Room: {order.roomNumber}</p>}
                            </div>

                            <div className="bg-gray-50/50 p-4 border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                                    <MapPinIcon className="h-5 w-5 text-[#FF6A00] mr-2" />
                                    Delivery Info
                                </h4>
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">Location:</span> {deliveryLocationLabels[order.deliveryLocation] || order.deliveryLocation}
                                </p>
                                {order.scheduledDeliveryTime && (
                                    <p className="text-sm text-gray-700 mt-1 flex items-center">
                                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                                        Scheduled: {new Date(order.scheduledDeliveryTime).toLocaleString()}
                                    </p>
                                )}
                                {order.estimatedPreparationTime && (
                                    <p className="text-sm text-gray-700 mt-1">
                                        Est. Prep: {order.estimatedPreparationTime} mins
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items List */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-wider">Order Items</h4>
                            <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start p-3 bg-white border border-gray-100 shadow-sm">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {item.quantity} x ${item.price.toFixed(2)}
                                            </p>
                                            {item.specialInstructions && (
                                                <p className="text-xs text-amber-600 mt-1 bg-amber-50 inline-block px-1.5 py-0.5">
                                                    Note: {item.specialInstructions}
                                                </p>
                                            )}
                                        </div>
                                        <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <span className="text-lg font-medium text-gray-500">Total Amount</span>
                            <span className="text-3xl font-bold text-[#FF6A00]">${order.totalAmount?.toFixed(2)}</span>
                        </div>

                        {/* Actions (Moved Inside Content) */}
                        <div className="pt-6 border-t border-gray-100">
                            {isReadOnly ? (
                                <RestrictedAction message="Action disabled">
                                    <button disabled className="w-full py-3 bg-gray-200 text-gray-500 font-bold cursor-not-allowed">
                                        Actions Disabled
                                    </button>
                                </RestrictedAction>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                        <>
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => onUpdateStatus(order.id, 'confirmed')}
                                                    className="flex-1 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                                >
                                                    Confirm Order
                                                </button>
                                            )}
                                            {order.status === 'confirmed' && (
                                                <button
                                                    onClick={() => onUpdateStatus(order.id, 'preparing')}
                                                    className="flex-1 py-3 bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200"
                                                >
                                                    Start Preparing
                                                </button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <button
                                                    onClick={() => onUpdateStatus(order.id, 'ready')}
                                                    className="flex-1 py-3 bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200"
                                                >
                                                    Mark Ready
                                                </button>
                                            )}
                                            {order.status === 'ready' && (
                                                <button
                                                    onClick={() => onUpdateStatus(order.id, 'out_for_delivery')}
                                                    className="flex-1 py-3 bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                                                >
                                                    Start Delivery
                                                </button>
                                            )}
                                            {order.status === 'out_for_delivery' && (
                                                <button
                                                    onClick={() => onUpdateStatus(order.id, 'delivered')}
                                                    className="flex-1 py-3 bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                                                >
                                                    Delivered
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setShowCancelConfirm(true)}
                                                className="flex-1 py-3 bg-white text-red-600 font-bold border border-gray-200 hover:bg-red-50 transition-colors"
                                            >
                                                Cancel Order
                                            </button>
                                        </>
                                    )}
                                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                                        <p className="w-full text-center text-gray-500 font-medium italic">
                                            This order is {order.status}. No further actions.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={() => {
                    onUpdateStatus(order.id, 'cancelled');
                    setShowCancelConfirm(false);
                }}
                title="Cancel Order"
                message="Are you sure you want to cancel this order? This action cannot be undone."
                confirmText="Yes, Cancel Order"
                cancelText="No, Keep Order"
            />
        </div >
    );
}
