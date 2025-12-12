"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useMemo } from 'react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getKitchenOrders, updateFoodOrder, FoodOrder } from '@/lib/firestoreService';
import { ClockIcon, MapPinIcon, UserIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

export default function KitchenDashboardPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);

  useEffect(() => {
    if (!db) {
      (async () => {
        try {
          const data = await getKitchenOrders();
          setOrders(data);
        } catch (error) {
          console.error('Error loading kitchen orders:', error);
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    const q = query(
      collection(db, 'foodOrders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            scheduledDeliveryTime: data.scheduledDeliveryTime?.toDate(),
            actualDeliveryTime: data.actualDeliveryTime?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as FoodOrder;
        })
        .filter(order => 
          order.status === 'pending' || 
          order.status === 'confirmed' || 
          order.status === 'preparing' || 
          order.status === 'ready'
        )
        .sort((a, b) => {
          const aTime = a.createdAt.getTime();
          const bTime = b.createdAt.getTime();
          return bTime - aTime;
        });
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to orders:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      total: orders.length,
    };
  }, [orders]);

  const updateOrderStatus = async (orderId: string, status: FoodOrder['status'], kitchenStatus?: FoodOrder['kitchenStatus']) => {
    try {
      const updateData: any = { status };
      if (kitchenStatus) updateData.kitchenStatus = kitchenStatus;
      if (status === 'delivered') updateData.actualDeliveryTime = new Date();
      
      await updateFoodOrder(orderId, updateData);
      showToast(`Order ${status} successfully!`, 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    }
  };

  const getStatusColor = (status: FoodOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'confirmed':
        return 'text-blue-600 bg-blue-50';
      case 'preparing':
        return 'text-orange-600 bg-orange-50';
      case 'ready':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const deliveryLocationLabels: Record<string, string> = {
    in_room: 'In Room',
    restaurant: 'Restaurant',
    bar: 'Bar',
    beach_side: 'Beach Side',
    pool_side: 'Pool Side',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-8">
      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kitchen Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time food orders for kitchen staff • {currentDate}</p>
        </div>
        
        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Pending:</span>
            <span className="font-semibold text-gray-900">{stats.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">Preparing:</span>
            <span className="font-semibold text-gray-900">{stats.preparing}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Ready:</span>
            <span className="font-semibold text-gray-900">{stats.ready}</span>
          </div>
        </div>
      </div>

      {/* Clean Orders Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-gray-600">No active orders</p>
          <p className="text-sm text-gray-500 mt-2">Orders will appear here in real-time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:border-[#FF6A00] transition-all cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              {/* Guest Info */}
              <div className="space-y-1.5 mb-4 text-sm">
                <div className="flex items-center text-gray-700">
                  <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">{order.guestName}</span>
                </div>
                {order.roomNumber && (
                  <div className="flex items-center text-gray-700">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Room: {order.roomNumber}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-700">
                  <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{deliveryLocationLabels[order.deliveryLocation] || order.deliveryLocation}</span>
                </div>
                {order.scheduledDeliveryTime && (
                  <div className="flex items-center text-gray-700">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-xs">Delivery: {new Date(order.scheduledDeliveryTime).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">ITEMS:</p>
                <div className="space-y-1">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      • {item.name} x{item.quantity}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-sm text-gray-500">+{order.items.length - 3} more items</div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-lg font-bold text-[#FF6A00]">${order.totalAmount}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'confirmed', 'received');
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Accept
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'preparing', 'cooking');
                    }}
                    className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Start Cooking
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'ready', 'ready');
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'out_for_delivery');
                    }}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Out for Delivery
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Guest Information</h4>
                  <p className="text-sm text-gray-700">{selectedOrder.guestName}</p>
                  <p className="text-sm text-gray-700">{selectedOrder.guestPhone}</p>
                  {selectedOrder.roomNumber && (
                    <p className="text-sm text-gray-700 mt-1">Room: {selectedOrder.roomNumber}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Details</h4>
                  <p className="text-sm text-gray-700">
                    Location: {deliveryLocationLabels[selectedOrder.deliveryLocation] || selectedOrder.deliveryLocation}
                  </p>
                  {selectedOrder.scheduledDeliveryTime && (
                    <p className="text-sm text-gray-700 mt-1">
                      Scheduled: {new Date(selectedOrder.scheduledDeliveryTime).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 mt-1">
                    Prep Time: {selectedOrder.estimatedPreparationTime} mins
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price}</p>
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 mt-1">Note: {item.specialInstructions}</p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                  <span>Total Amount:</span>
                  <span className="text-[#FF6A00]">${selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
