"use client";

import React, { useState, useEffect, useMemo } from 'react';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { getFoodOrders, updateFoodOrder, FoodOrder } from '@/lib/firestoreService';
import { MagnifyingGlassIcon, ClockIcon, FunnelIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function AdminFoodOrdersPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getFoodOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: FoodOrder['status']) => {
    if (isReadOnly) return;
    try {
      await updateFoodOrder(orderId, { status });
      await loadOrders();
      showToast(`Order ${status} successfully!`, 'success');
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(q) ||
        order.guestName.toLowerCase().includes(q) ||
        order.guestPhone.includes(q) ||
        (order.roomNumber && order.roomNumber.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [orders, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
    };
  }, [orders]);

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
      case 'out_for_delivery':
        return 'text-purple-600 bg-purple-50';
      case 'delivered':
        return 'text-emerald-600 bg-emerald-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
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
      <BackButton href="/admin" label="Back to Dashboard" />
      
      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Food Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all food orders from guests • {currentDate}</p>
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
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Delivered:</span>
            <span className="font-semibold text-gray-900">{stats.delivered}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, guest name, phone, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none px-3 py-2 text-sm"
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
      </div>

      {/* Clean Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-gray-600">No orders found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room / Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
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
                      {order.roomNumber && (
                        <div className="text-sm text-gray-900">Room: {order.roomNumber}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        {deliveryLocationLabels[order.deliveryLocation] || order.deliveryLocation}
                      </div>
                      {order.scheduledDeliveryTime && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
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
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[#FF6A00] hover:text-[#FF6A00]/80 font-medium border-b-2 border-transparent hover:border-[#FF6A00] transition-colors"
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
                  {selectedOrder.guestEmail && (
                    <p className="text-sm text-gray-700">{selectedOrder.guestEmail}</p>
                  )}
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
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Confirm Order
                        </button>
                      )}
                      {selectedOrder.status === 'ready' && (
                        <button
                          onClick={() => {
                            handleStatusUpdate(selectedOrder.id, 'delivered');
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark as Delivered
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, 'cancelled');
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
