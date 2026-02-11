"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  getKitchenOrders,
  updateFoodOrder,
  FoodOrder,
} from "@/lib/firestoreService";
import { ClockIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/context/ToastContext";

import KitchenKanbanBoard from "@/components/admin/kitchen/KitchenKanbanBoard";

export default function KitchenDashboardPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!db) {
      (async () => {
        try {
          const data = await getKitchenOrders();
          setOrders(data);
        } catch (error) {
          console.error("Error loading kitchen orders:", error);
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    const q = query(
      collection(db, "foodOrders"),
      orderBy("createdAt", "asc"), // Oldest first for KDS usually
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs
          .map((doc) => {
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
          .filter(
            (order) =>
              order.status === "pending" ||
              order.status === "confirmed" ||
              order.status === "preparing" ||
              order.status === "ready",
          );

        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to orders:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (
    orderId: string,
    status: FoodOrder["status"],
  ): Promise<void> => {
    try {
      // Inventory Deduction Hook
      if (status === "preparing") {
        const { processOrderInventoryDeduction } =
          await import("@/lib/inventoryService");
        await processOrderInventoryDeduction(orderId, "Kitchen Staff");
      }

      const updateData: any = { status };
      if (status === "delivered") updateData.actualDeliveryTime = new Date();
      if (status === "preparing") updateData.kitchenStatus = "cooking";
      if (status === "ready") updateData.kitchenStatus = "ready";

      await updateFoodOrder(orderId, updateData);
      showToast(`Order marked as ${status.replace("_", " ")}`, "success");
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Failed to update order status", "error");
    }
  };

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Filter State
  const [filterType, setFilterType] = useState<
    "all" | "walk_in" | "room_service"
  >("all");
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);

  // Derived State
  const filteredOrders = orders.filter((o) => {
    if (filterType !== "all" && o.orderType !== filterType) return false;
    if (showUrgentOnly && o.priority !== "urgent") return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
          <p className="text-slate-400 font-mono text-sm uppercase tracking-widest animate-pulse">
            Initializing KDS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* CLEAN HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between z-20 gap-4">
        {/* Title & Status */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            Kitchen Display System
          </h1>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <div className="flex items-center gap-4">
            <p className="text-gray-500 font-medium text-xs uppercase tracking-widest flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-orange-600" />
              {formattedDate} •{" "}
              <span className="text-gray-900">{formattedTime}</span>
            </p>
            <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-xs font-bold border border-green-200">
              Live
            </div>
          </div>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center gap-4">
          <Link href="/admin/food-orders/create?returnUrl=/admin/kitchen">
            <button className="flex items-center gap-2 px-3 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-semibold text-xs uppercase tracking-wide">
              <PlusIcon className="h-4 w-4" />
              <span>New Order</span>
            </button>
          </Link>
          {/* Type Filter */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === "all" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("room_service")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === "room_service" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              Room Service
            </button>
            <button
              onClick={() => setFilterType("walk_in")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === "walk_in" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              Walk-In
            </button>
          </div>

          {/* Urgency Toggle */}
          <button
            onClick={() => setShowUrgentOnly(!showUrgentOnly)}
            className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 transition-colors ${
              showUrgentOnly
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${showUrgentOnly ? "bg-red-600 animate-pulse" : "bg-gray-300"}`}
            ></span>
            Urgent Only
          </button>

          <div className="hidden lg:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100"></span>
              <span className="text-xs font-bold text-gray-600">New</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-100"></span>
              <span className="text-xs font-bold text-gray-600">Cooking</span>
            </div>
          </div>

          <Link
            href="/admin/kitchen/history"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <ClockIcon className="h-4 w-4" />
            History
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-gray-100 relative">
        <KitchenKanbanBoard
          orders={filteredOrders}
          onUpdateStatus={updateOrderStatus}
        />
      </div>
    </div>
  );
}
