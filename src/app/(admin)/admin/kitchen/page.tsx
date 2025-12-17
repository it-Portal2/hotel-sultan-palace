"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useMemo } from 'react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getKitchenOrders, updateFoodOrder, FoodOrder } from '@/lib/firestoreService';
import { ClockIcon, MapPinIcon, UserIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

import KitchenKanbanBoard from '@/components/admin/kitchen/KitchenKanbanBoard';

export default function KitchenDashboardPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);

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
      orderBy('createdAt', 'asc') // Oldest first for KDS usually
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
        );
      // .sort logic handled by KDS (usually FIFO)

      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to orders:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, status: FoodOrder['status']) => {
    try {
      // Inventory Deduction Hook
      // If status moves to 'preparing', we confirm stock usage
      if (status === 'preparing') {
        // Dynamic import to avoid SSR issues if any, or just standard import is fine
        const { processOrderInventoryDeduction } = await import('@/lib/inventoryService');
        await processOrderInventoryDeduction(orderId, 'Kitchen Staff');
      }

      const updateData: any = { status };
      if (status === 'delivered') updateData.actualDeliveryTime = new Date();
      if (status === 'preparing') updateData.kitchenStatus = 'cooking';
      if (status === 'ready') updateData.kitchenStatus = 'ready';

      await updateFoodOrder(orderId, updateData);
      showToast(`Order marked as ${status.replace('_', ' ')}`, 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-gray-500 font-mono text-sm uppercase tracking-wide">Connecting to KDS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-lg font-mono rounded-sm">KDS</span>
            Kitchen Display System
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">{currentDate} • Active Orders: {orders.length}</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-white border border-gray-300"></span>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-orange-50 border border-orange-200"></span>
            <span>{'>'} 30m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-red-50 border border-red-200"></span>
            <span>{'>'} 45m</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <KitchenKanbanBoard orders={orders} onUpdateStatus={updateOrderStatus} />
      </div>
    </div>
  );
}
