"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { getFoodOrders, updateFoodOrder, FoodOrder } from '@/lib/firestoreService';
import { processOrderInventoryDeduction } from '@/lib/inventoryService';
import OrderStats from '@/components/admin/food-orders/OrderStats';
import OrderFilters from '@/components/admin/food-orders/OrderFilters';
import OrderList from '@/components/admin/food-orders/OrderList';
import OrderDetailsModal from '@/components/admin/food-orders/OrderDetailsModal';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function AdminFoodOrdersPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  // State
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);

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

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusUpdate = async (orderId: string, status: FoodOrder['status']) => {
    if (isReadOnly) return;
    try {
      await updateFoodOrder(orderId, { status });

      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }


      // TRIGGER INVENTORY DEDUCTION
      if (status === 'delivered') {
        try {
          await processOrderInventoryDeduction(orderId, 'Admin User'); // In real app, pass current user name
          showToast('Order delivered & Inventory deducted', 'success');
        } catch (invError) {
          console.error("Inventory Deduction Failed:", invError);
          showToast('Order delivered but Inventory update failed', 'warning');
        }
      } else {
        showToast(`Order status updated to ${status.replace('_', ' ')}`, 'success');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
      // Revert if failed (optional, but good practice)
      loadOrders();
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // 1. Filter: ONLY Active Orders
    filtered = filtered.filter(o =>
      ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
    );

    // 2. Filter by Status Dropdown
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(q) ||
        order.guestName.toLowerCase().includes(q) ||
        order.guestPhone.includes(q) ||
        (order.roomNumber && order.roomNumber.toLowerCase().includes(q))
      );
    }

    // Sort by Date Descending
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      activeOrders: orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      readyOrders: orders.filter(o => o.status === 'ready').length,
    };
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'preparing': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'ready': return 'text-teal-600 bg-teal-50 border-teal-100';
      case 'out_for_delivery': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'delivered': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6A00]"></div>
          <p className="text-sm text-gray-500 font-medium">Loading Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Service & Delivery Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Track ready orders and manage delivery/service to guests.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* New Order button moved to Kitchen Dashboard primarily */}
        </div>
      </div>

      <div className="p-6 pb-2">
        {/* Stats */}
        {/* Mapping to OrderStats props: total, pending, delivered (using ready as 3rd metric for active page?) */}
        {/* Let's adjust simple metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Active</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Kitchen Ready</p>
            <p className="text-2xl font-bold text-teal-600 mt-1">{stats.readyOrders}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters
        query={searchQuery}
        setQuery={setSearchQuery}
        status={statusFilter}
        setStatus={setStatusFilter}
      />

      {/* Table */}
      <OrderList
        orders={filteredOrders}
        onSelect={setSelectedOrder} // Ensure this matches (val) => setSelectedOrder(val)
        statusColors={getStatusColor}
      />

      {/* Modal / Drawer */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleStatusUpdate}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}

