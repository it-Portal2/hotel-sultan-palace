"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAdminRole } from "@/context/AdminRoleContext";
import { useToast } from "@/context/ToastContext";
import { getFoodOrders, updateFoodOrder } from "@/lib/services/fbOrderService";
import type { FoodOrder } from "@/lib/firestoreService";
import { processOrderInventoryDeduction } from "@/lib/inventoryService";
import { generateAndStoreReceipt } from "@/app/actions/receiptActions";
import OrderDetailsModal from "@/components/admin/food-orders/OrderDetailsModal";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PrinterIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All Active" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "out_for_delivery", label: "Out for Delivery" },
];

const statusColors: Record<string, { bg: string; text: string; dot: string }> =
  {
    pending: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      dot: "bg-yellow-500",
    },
    confirmed: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    preparing: {
      bg: "bg-orange-50 border-orange-200",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    ready: {
      bg: "bg-teal-50 border-teal-200",
      text: "text-teal-700",
      dot: "bg-teal-500",
    },
    out_for_delivery: {
      bg: "bg-purple-50 border-purple-200",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    delivered: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    cancelled: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
    },
  };

export default function AdminFoodOrdersPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getFoodOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusUpdate = async (
    orderId: string,
    status: FoodOrder["status"],
  ) => {
    if (isReadOnly) return;
    try {
      await updateFoodOrder(orderId, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }

      // Auto-trigger BOTH printers when order is confirmed (Phase 9)
      if (status === "confirmed") {
        try {
          await updateFoodOrder(orderId, {
            restaurantPrinted: false, // → KOT Listener 1 → Ramson (restaurant receipt)
            kitchenPrintRequested: true, // → KOT Listener 3 → POSX (kitchen ticket)
          } as any);

          // Phase 11: Generate receipt server-side at confirmation
          generateAndStoreReceipt(orderId).catch((err: unknown) =>
            console.error("[Receipt] Server generation failed:", err),
          );
        } catch (printErr) {
          console.error("Print trigger failed:", printErr);
        }
      }

      if (status === "delivered") {
        try {
          await processOrderInventoryDeduction(orderId, "Admin User");
          showToast("Order delivered & Inventory deducted", "success");
        } catch (invError) {
          console.error("Inventory Deduction Failed:", invError);
          showToast("Order delivered but Inventory update failed", "warning");
        }
      } else {
        const statusMessages: Record<string, string> = {
          confirmed: "✅ Order Confirmed! Receipt is being generated...",
          preparing: "🍳 Order is now being prepared",
          ready: "✅ Order is ready for pickup/delivery",
          out_for_delivery: "🛵 Order is out for delivery",
        };
        showToast(
          statusMessages[status] ||
            `Order status updated to ${status.replace(/_/g, " ")}`,
          "success",
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Failed to update order status", "error");
      loadOrders();
    }
  };

  const handleReprint = async (orderId: string) => {
    try {
      await updateFoodOrder(orderId, { reprintRequested: true } as any);
      showToast("Print request sent to restaurant printer", "success");
    } catch (error) {
      console.error("Error requesting reprint:", error);
      showToast("Failed to send print request", "error");
    }
  };

  const handleKitchenPrint = async (orderId: string) => {
    try {
      await updateFoodOrder(orderId, {
        kitchenPrintRequested: true,
      } as any);
      showToast("Print request sent to kitchen printer", "success");
    } catch (error) {
      console.error("Error requesting kitchen print:", error);
      showToast("Failed to send kitchen print request", "error");
    }
  };

  // Filter active orders only
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter((o) =>
      [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
      ].includes(o.status),
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.guestName.toLowerCase().includes(q) ||
          o.guestEmail?.toLowerCase().includes(q) ||
          (o.roomName && o.roomName.toLowerCase().includes(q)),
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [orders, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE),
  );
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const active = orders.filter((o) =>
      [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
      ].includes(o.status),
    );
    return {
      total: active.length,
      pending: active.filter((o) => o.status === "pending").length,
      ready: active.filter((o) => o.status === "ready").length,
    };
  }, [orders]);

  const sc = (status: string) => statusColors[status] || statusColors.pending;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6A00]" />
          <p className="text-sm text-gray-500 font-medium">Loading Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Service & Delivery Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Track ready orders and manage delivery/service to guests.
        </p>
      </div>

      <div className="p-6 flex-1 flex flex-col min-h-0 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 shrink-0">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Total Active
            </p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Pending
            </p>
            <p className="text-2xl font-black text-yellow-600 mt-1">
              {stats.pending}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Kitchen Ready
            </p>
            <p className="text-2xl font-black text-teal-600 mt-1">
              {stats.ready}
            </p>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 bg-gray-50/50">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap self-center">
              {filteredOrders.length} orders
            </span>
          </div>

          {/* Table */}
          {paginatedOrders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="font-medium text-gray-500">No orders found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      Order
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">
                      Location
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">
                      Items
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedOrders.map((order) => {
                    const s = sc(order.status);
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900 text-sm">
                            #{(order.orderNumber || "").replace(/^#/, "")}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                            {order.guestName}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm text-gray-600 capitalize truncate max-w-[100px]">
                            {order.roomName
                              ? `Room ${order.roomName}`
                              : (order.deliveryLocation || "N/A").replace(
                                  "_",
                                  " ",
                                )}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm text-gray-700 truncate max-w-[180px]">
                            {order.items.length} item
                            {order.items.length > 1 ? "s" : ""} —{" "}
                            {order.items
                              .slice(0, 2)
                              .map((i) => i.name)
                              .join(", ")}
                            {order.items.length > 2 && "..."}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">
                            ${order.totalAmount?.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                            />
                            {(order.status || "pending").replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Print */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReprint(order.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Print Request"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </button>

                            {/* Edit */}
                            {!isReadOnly &&
                              order.status !== "delivered" &&
                              order.status !== "cancelled" &&
                              order.status !== "confirmed" && (
                                <Link
                                  href={`/admin/food-orders/create?menuType=food&editOrderId=${order.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Order"
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </Link>
                              )}

                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3 py-1.5 text-xs font-bold text-[#FF6A00] bg-[#FF6A00]/5 hover:bg-[#FF6A00]/10 rounded-lg transition-colors border border-[#FF6A00]/20"
                            >
                              Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredOrders.length > ITEMS_PER_PAGE && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/30">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-bold">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredOrders.length,
                  )}
                </span>{" "}
                of <span className="font-bold">{filteredOrders.length}</span>{" "}
                results
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1,
                  )
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-1 text-gray-300 text-xs">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-[#FF6A00] text-white"
                            : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleStatusUpdate}
          isReadOnly={isReadOnly}
          onReprint={handleReprint}
          onKitchenPrint={handleKitchenPrint}
        />
      )}
    </div>
  );
}
