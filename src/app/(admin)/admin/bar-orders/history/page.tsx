"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAdminRole } from "@/context/AdminRoleContext";
import { useToast } from "@/context/ToastContext";
import { getFoodOrders, updateFoodOrder } from "@/lib/services/fbOrderService";
import type { FoodOrder } from "@/lib/firestoreService";
import OrderDetailsModal from "@/components/admin/food-orders/OrderDetailsModal";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 15;

// History-only statuses
const HISTORY_STATUSES = ["delivered", "cancelled", "completed"] as const;

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All History" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const BAR_LOCATION_OPTIONS = [
  { value: "all", label: "All Locations" },
  { value: "main_bar", label: "Main Bar" },
  { value: "beach_bar", label: "Beach Bar" },
];

const statusColors: Record<string, { bg: string; text: string; dot: string }> =
{
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
  completed: {
    bg: "bg-teal-50 border-teal-200",
    text: "text-teal-700",
    dot: "bg-teal-500",
  },
};

export default function BarOrdersHistoryPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);

  // ── Load bar orders from barOrders collection ──────────────────────────────
  const loadOrders = async () => {
    try {
      setLoading(true);
      // menuType="bar" → fetches from barOrders collection
      const data = await getFoodOrders(undefined, "bar");
      setOrders(data);
    } catch (error) {
      console.error("Error loading bar order history:", error);
      showToast("Failed to load bar order history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Status update (for modal actions) ─────────────────────────────────────
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
      showToast(
        `Order status updated to ${status.replace(/_/g, " ")}`,
        "success",
      );
    } catch (error) {
      console.error("Error updating bar order status:", error);
      showToast("Failed to update order status", "error");
      loadOrders();
    }
  };

  // ── Only show history statuses ─────────────────────────────────────────────
  const historyOrders = useMemo(
    () =>
      orders.filter((o) =>
        (HISTORY_STATUSES as readonly string[]).includes(o.status),
      ),
    [orders],
  );

  // ── Filtered + searched ────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let filtered = historyOrders;

    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(
        (o) => (o as any).barLocation === locationFilter,
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.guestName?.toLowerCase().includes(q) ||
          o.guestEmail?.toLowerCase().includes(q) ||
          (o.roomName && o.roomName.toLowerCase().includes(q)),
      );
    }

    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((o) => new Date(o.createdAt) >= start);
    }

    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((o) => new Date(o.createdAt) <= end);
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [historyOrders, statusFilter, locationFilter, searchQuery, dateFrom, dateTo]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE),
  );
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, locationFilter, dateFrom, dateTo]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      total: historyOrders.length,
      delivered: historyOrders.filter((o) => o.status === "delivered").length,
      cancelled: historyOrders.filter((o) => o.status === "cancelled").length,
      revenue: historyOrders
        .filter((o) => o.status === "delivered" || (o.status as string) === "completed")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };
  }, [historyOrders]);

  const sc = (status: string) =>
    statusColors[status] || {
      bg: "bg-gray-50 border-gray-200",
      text: "text-gray-700",
      dot: "bg-gray-400",
    };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          <p className="text-sm text-gray-500 font-medium">
            Loading Bar Order History...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <BeakerIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Bar Order History
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Completed and cancelled bar orders
            </p>
          </div>
        </div>

        {/* ── Date Range Picker ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white px-3 py-2 rounded-lg border border-gray-300 flex items-center gap-2 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
            />
          </div>
          <div className="bg-white px-3 py-2 rounded-lg border border-gray-300 flex items-center gap-2 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="px-3 py-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors whitespace-nowrap"
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col min-h-0 space-y-4">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              Total Orders
            </p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
              <CheckCircleIcon className="h-3 w-3" />
              Delivered
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {stats.delivered}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
              <XCircleIcon className="h-3 w-3" />
              Cancelled
            </p>
            <p className="text-2xl font-black text-red-500 mt-1">
              {stats.cancelled}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Revenue
            </p>
            <p className="text-2xl font-black text-purple-600 mt-1">
              ${stats.revenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 bg-gray-50/50">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by order #, guest, room..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Bar location filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
            >
              {BAR_LOCATION_OPTIONS.map((opt) => (
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
              <div className="text-center py-12">
                <BeakerIcon className="h-12 w-12 text-purple-200 mx-auto mb-3" />
                <p className="font-medium text-gray-500">
                  No bar order history found
                </p>
                <p className="text-xs mt-1 text-gray-400">
                  Try adjusting your filters
                </p>
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
                      Bar Location
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
                    const barLocation = (order as any).barLocation as
                      | string
                      | undefined;
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        {/* Order # + time */}
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900 text-sm">
                            #{(order.orderNumber || "").replace(/^#/, "")}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString([], {
                              day: "2-digit",
                              month: "short",
                            })}{" "}
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                        {/* Guest */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                            {order.guestName}
                          </p>
                          {order.roomName && (
                            <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">
                              Room {order.roomName}
                            </p>
                          )}
                        </td>
                        {/* Bar location */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          {barLocation ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${barLocation === "main_bar"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                            >
                              {barLocation === "main_bar"
                                ? "Main Bar"
                                : "Beach Bar"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        {/* Items */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm text-gray-700 truncate max-w-[200px]">
                            {order.items.length} item
                            {order.items.length > 1 ? "s" : ""} —{" "}
                            {order.items
                              .slice(0, 2)
                              .map((i) => i.name)
                              .join(", ")}
                            {order.items.length > 2 && "..."}
                          </p>
                        </td>
                        {/* Amount */}
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">
                            ${order.totalAmount?.toFixed(2)}
                          </span>
                        </td>
                        {/* Status badge */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                            />
                            {(order.status || "").replace("_", " ")}
                          </span>
                        </td>
                        {/* View Details */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                          >
                            View Details
                          </button>
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
                of{" "}
                <span className="font-bold">{filteredOrders.length}</span>{" "}
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
                        className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${currentPage === page
                          ? "bg-purple-600 text-white"
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

      {/* View Details Modal — reuses existing OrderDetailsModal (auto-routes to barOrders via menuType) */}
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
