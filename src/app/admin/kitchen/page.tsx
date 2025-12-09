"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { onSnapshot, collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import BackButton from '@/components/admin/BackButton';
import { getKitchenOrders, updateFoodOrder, FoodOrder } from '@/lib/firestoreService';
import { ClockIcon, MapPinIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';

export default function KitchenDashboardPage() {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);

  useEffect(() => {
    // If Firestore isn't available (SSR or init), fallback to server fetch
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

    // Real-time listener for kitchen orders
    // Note: Using where with 'in' and orderBy requires an index, so we filter and sort in memory
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
        // Filter kitchen orders in memory (pending, confirmed, preparing, ready)
        .filter(order => 
          order.status === 'pending' || 
          order.status === 'confirmed' || 
          order.status === 'preparing' || 
          order.status === 'ready'
        )
        // Sort by createdAt (already sorted by query, but ensure descending)
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

  const updateOrderStatus = async (orderId: string, status: FoodOrder['status'], kitchenStatus?: FoodOrder['kitchenStatus']) => {
    try {
      const updateData: any = { status };
      if (kitchenStatus) updateData.kitchenStatus = kitchenStatus;
      if (status === 'delivered') updateData.actualDeliveryTime = new Date();
      
      await updateFoodOrder(orderId, updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: FoodOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getKitchenStatusColor = (status?: FoodOrder['kitchenStatus']) => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'cooking':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Dashboard" />
      
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Kitchen Dashboard</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Real-time food orders for kitchen staff</p>
        <div className="mt-4 flex gap-4">
          <div className="px-4 py-2 bg-yellow-100 rounded-lg">
            <span className="text-sm font-medium text-yellow-800">Pending: {orders.filter(o => o.status === 'pending').length}</span>
          </div>
          <div className="px-4 py-2 bg-orange-100 rounded-lg">
            <span className="text-sm font-medium text-orange-800">Preparing: {orders.filter(o => o.status === 'preparing').length}</span>
          </div>
          <div className="px-4 py-2 bg-green-100 rounded-lg">
            <span className="text-sm font-medium text-green-800">Ready: {orders.filter(o => o.status === 'ready').length}</span>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-lg font-medium text-gray-600">No active orders</p>
          <p className="text-sm text-gray-500 mt-2">Orders will appear here in real-time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Order #{order.orderNumber}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              {/* Guest Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-700">
                  <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">{order.guestName}</span>
                </div>
                {order.roomNumber && (
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Room: {order.roomNumber}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-700">
                  <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{deliveryLocationLabels[order.deliveryLocation] || order.deliveryLocation}</span>
                </div>
                {order.scheduledDeliveryTime && (
                  <div className="flex items-center text-sm text-gray-700">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Delivery: {new Date(order.scheduledDeliveryTime).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="mb-4">
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

              {/* Kitchen Status */}
              <div className="mb-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getKitchenStatusColor(order.kitchenStatus)}`}>
                  Kitchen: {order.kitchenStatus?.toUpperCase() || 'PENDING'}
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-lg font-bold text-[#FF6A00]">${order.totalAmount}</span>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'confirmed', 'received');
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
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
                    className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
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
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
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
                    className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
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
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-white to-[#FFFCF6] border-b border-[#be8c53]/20 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#202c3b]">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-[#202c3b]/70 text-sm mt-1">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#202c3b]/70 hover:text-[#FF6A00]"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Guest Information</h4>
                  <p className="text-sm text-gray-700">{selectedOrder.guestName}</p>
                  <p className="text-sm text-gray-700">{selectedOrder.guestPhone}</p>
                  {selectedOrder.roomNumber && (
                    <p className="text-sm text-gray-700">Room: {selectedOrder.roomNumber}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Details</h4>
                  <p className="text-sm text-gray-700">
                    Location: {deliveryLocationLabels[selectedOrder.deliveryLocation] || selectedOrder.deliveryLocation}
                  </p>
                  {selectedOrder.scheduledDeliveryTime && (
                    <p className="text-sm text-gray-700">
                      Scheduled: {new Date(selectedOrder.scheduledDeliveryTime).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-700">
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

