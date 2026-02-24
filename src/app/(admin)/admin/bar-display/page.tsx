"use client";

import { useState, useEffect } from "react";
import { onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { updateFoodOrder } from "@/lib/services/fbOrderService";
import type { FoodOrder } from "@/lib/firestoreService";
import { ClockIcon, PlusIcon } from "@heroicons/react/24/outline";
import { BeakerIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/context/ToastContext";

import BarKanbanBoard from "@/components/admin/bar-display/BarKanbanBoard";

export default function BarDisplayPage() {
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
            setLoading(false);
            return;
        }

        // Subscribe to barOrders collection (bar data only)
        const q = query(
            collection(db, "barOrders"),
            orderBy("createdAt", "asc"), // Oldest first so bartenders see queued orders first
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
                            order.status === "confirmed" ||
                            order.status === "preparing" ||
                            order.status === "ready",
                        // pending orders are excluded — they haven't been confirmed by admin yet
                    );

                setOrders(ordersData);
                setLoading(false);
            },
            (error) => {
                console.error("Error listening to bar orders:", error);
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
            const updateData: any = { status };
            if (status === "delivered") updateData.actualDeliveryTime = new Date();
            // Map bar-side status to kitchenStatus field for consistency
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
    const [filterLocation, setFilterLocation] = useState<
        "all" | "main_bar" | "beach_bar"
    >("all");
    const [showUrgentOnly, setShowUrgentOnly] = useState(false);

    // Derived State
    const filteredOrders = orders.filter((o) => {
        if (filterLocation !== "all" && o.barLocation !== filterLocation)
            return false;
        if (showUrgentOnly && o.priority !== "urgent") return false;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-500"></div>
                    <p className="text-slate-400 font-mono text-sm uppercase tracking-widest animate-pulse">
                        Initializing BDS...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between z-20 gap-4">
                {/* Title & Status */}
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                        <BeakerIcon className="h-6 w-6 text-purple-600" />
                        Bar Display System
                    </h1>
                    <div className="h-6 w-px bg-gray-300 mx-2"></div>
                    <div className="flex items-center gap-4">
                        <p className="text-gray-500 font-medium text-xs uppercase tracking-widest flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-purple-600" />
                            {formattedDate} •{" "}
                            <span className="text-gray-900">{formattedTime}</span>
                        </p>
                        <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-xs font-bold border border-green-200">
                            Live
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/food-orders/create?menuType=bar&returnUrl=/admin/bar-display">
                        <button className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-semibold text-xs uppercase tracking-wide">
                            <PlusIcon className="h-4 w-4" />
                            <span>New Bar Order</span>
                        </button>
                    </Link>

                    {/* Location Filter */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setFilterLocation("all")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterLocation === "all" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterLocation("main_bar")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterLocation === "main_bar" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Main Bar
                        </button>
                        <button
                            onClick={() => setFilterLocation("beach_bar")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterLocation === "beach_bar" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Beach Bar
                        </button>
                    </div>

                    {/* Urgency Toggle */}
                    <button
                        onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 transition-colors ${showUrgentOnly
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${showUrgentOnly ? "bg-red-600 animate-pulse" : "bg-gray-300"}`}
                        ></span>
                        Urgent Only
                    </button>

                    {/* Legend */}
                    <div className="hidden lg:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-100"></span>
                            <span className="text-xs font-bold text-gray-600">New</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100"></span>
                            <span className="text-xs font-bold text-gray-600">Mixing</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-100"></span>
                            <span className="text-xs font-bold text-gray-600">Ready</span>
                        </div>
                    </div>

                    <Link
                        href="/admin/bar-orders/history"
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                    >
                        <ClockIcon className="h-4 w-4" />
                        History
                    </Link>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-gray-100 relative">
                <BarKanbanBoard
                    orders={filteredOrders}
                    onUpdateStatus={updateOrderStatus}
                />
            </div>
        </div>
    );
}
