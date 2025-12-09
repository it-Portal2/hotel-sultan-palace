"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';
import { getFoodOrders, updateFoodOrder, FoodOrder } from '@/lib/firestoreService';
import { MagnifyingGlassIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function AdminFoodOrdersPage() {
  const { isReadOnly } = useAdminRole();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getFoodOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: FoodOrder['status']) => {
    if (isReadOnly) return;
    try {
      await updateFoodOrder(orderId, { status });
      await loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.guestPhone.includes(searchQuery) ||
      (order.roomNumber && order.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Food Orders Management</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Manage all food orders from guests</p>
        <div className="mt-4 flex gap-4">
          <div className="px-4 py-2 bg-yellow-100 rounded-lg">
            <span className="text-sm font-medium text-yellow-800">Pending: {orders.filter(o => o.status === 'pending').length}</span>
          </div>
          <div className="px-4 py-2 bg-green-100 rounded-lg">
            <span className="text-sm font-medium text-green-800">Delivered: {orders.filter(o => o.status === 'delivered').length}</span>
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg">
            <span className="text-sm font-medium text-gray-800">Total: {orders.length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, guest name, phone, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-lg font-medium text-gray-600">No orders found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg overflow-hidden rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room / Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.guestName}</div>
                      <div className="text-xs text-gray-500">{order.guestPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {order.roomNumber ? (
                        <div className="text-sm text-gray-900">Room: {order.roomNumber}</div>
                      ) : null}
                      <div className="text-xs text-gray-500">
                        {deliveryLocationLabels[order.deliveryLocation] || order.deliveryLocation}
                      </div>
                      {order.scheduledDeliveryTime && (
                        <div className="text-xs text-gray-500 mt-1">
                          <ClockIcon className="h-3 w-3 inline mr-1" />
                          {new Date(order.scheduledDeliveryTime).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.slice(0, 2).map(i => i.name).join(', ')}
                        {order.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">${order.totalAmount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[#FF6A00] hover:text-[#FF6A00]/80 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  {selectedOrder.guestEmail && (
                    <p className="text-sm text-gray-700">{selectedOrder.guestEmail}</p>
                  )}
                  {selectedOrder.roomNumber && (
                    <p className="text-sm text-gray-700 mt-2">Room: {selectedOrder.roomNumber}</p>
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

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                  <span>Total Amount:</span>
                  <span className="text-[#FF6A00]">${selectedOrder.totalAmount}</span>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex gap-3">
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <>
                      {selectedOrder.status === 'pending' && (
                        <button
                          onClick={() => {
                            handleStatusUpdate(selectedOrder.id, 'confirmed');
                            setSelectedOrder({ ...selectedOrder, status: 'confirmed' });
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Confirm Order
                        </button>
                      )}
                      {selectedOrder.status === 'ready' && (
                        <button
                          onClick={() => {
                            handleStatusUpdate(selectedOrder.id, 'delivered');
                            setSelectedOrder({ ...selectedOrder, status: 'delivered' });
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Mark as Delivered
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, 'cancelled');
                          setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

