"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { getFoodOrders, updateFoodOrder, FoodOrder } from '@/lib/firestoreService';
import OrderStats from '@/components/admin/food-orders/OrderStats';
import OrderFilters from '@/components/admin/food-orders/OrderFilters';
import OrderTable from '@/components/admin/food-orders/OrderTable';
import OrderDetailsModal from '@/components/admin/food-orders/OrderDetailsModal';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function AdminFoodOrdersPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
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

      showToast(`Order status updated to ${status.replace('_', ' ')}`, 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
      // Revert if failed (optional, but good practice)
      loadOrders();
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

    // Sort by Date Descending
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Food Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage, track, and update guest food orders.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/food-orders/create"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#FF6A00] text-white font-bold rounded-lg shadow-sm hover:bg-[#FF6A00]/90 transition-all text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New POS Order
          </Link>
        </div>
      </div>

      {/* Stats */}
      <OrderStats stats={stats} />

      {/* Filters */}
      <OrderFilters
        query={searchQuery}
        setQuery={setSearchQuery}
        status={statusFilter}
        setStatus={setStatusFilter}
      />

      {/* Table */}
      <OrderTable
        orders={filteredOrders}
        onSelect={setSelectedOrder}
        statusColors={getStatusColor}
      />

      {/* Modal */}
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
