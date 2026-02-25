"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FoodOrder } from "@/lib/types/foodMenu";
import { updateFoodOrder } from "@/lib/services/fbOrderService";
import OrderDetailsModal from "@/components/admin/food-orders/OrderDetailsModal";
import { useAdminRole } from "@/context/AdminRoleContext";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All History" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
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
    bg: "bg-gray-100 border-gray-300",
    text: "text-gray-600",
    dot: "bg-gray-500",
  },
  pending: {
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
};

export default function KitchenHistoryPage() {
  const { isReadOnly } = useAdminRole();

  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);

  useEffect(() => {
    const firestore = db;
    if (!firestore) return;

    // Build query constraints based on date range
    const constraints: any[] = [orderBy("createdAt", "desc")];

    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      constraints.unshift(where("createdAt", ">=", start));
    }

    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      constraints.unshift(where("createdAt", "<=", end));
    }

    const q = query(collection(firestore, "foodOrders"), ...constraints);

    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as FoodOrder,
      );
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dateFrom, dateTo]);

  const handleStatusUpdate = async (
    orderId: string,
    status: FoodOrder["status"],
  ) => {
    if (isReadOnly) return;
    try {
      await updateFoodOrder(orderId, { status });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleReprint = async (orderId: string) => {
    try {
      await updateFoodOrder(orderId, { reprintRequested: true } as any);
    } catch (error) {
      console.error("Error requesting reprint:", error);
    }
  };

  // Filter for history orders
  const historyOrders = useMemo(
    () =>
      orders.filter((o) =>
        ["delivered", "cancelled", "completed"].includes(o.status),
      ),
    [orders],
  );

  const filteredData = useMemo(() => {
    let data = historyOrders;

    if (statusFilter !== "all") {
      data = data.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.guestName.toLowerCase().includes(q) ||
          (o.roomName && o.roomName.toLowerCase().includes(q)),
      );
    }
    return data;
  }, [historyOrders, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );
  const paginatedOrders = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo]);

  // Stats
  const stats = useMemo(
    () => ({
      total: historyOrders.length,
      delivered: historyOrders.filter((o) => o.status === "delivered").length,
      cancelled: historyOrders.filter((o) => o.status === "cancelled").length,
      late: historyOrders.filter((o) => {
        const created =
          o.createdAt && (o.createdAt as any).toDate
            ? (o.createdAt as any).toDate()
            : new Date();
        const delivered =
          o.actualDeliveryTime && (o.actualDeliveryTime as any).toDate
            ? (o.actualDeliveryTime as any).toDate()
            : new Date();
        return (delivered.getTime() - created.getTime()) / 1000 / 60 > 45;
      }).length,
    }),
    [historyOrders],
  );

  const sc = (status: string) => statusColors[status] || statusColors.pending;

  const formatTime = (d: any) => {
    if (!d) return "-";
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between z-20 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <ClockIcon className="h-7 w-7 text-gray-600" />
            Order History
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Review past orders (Delivered, Cancelled, Completed).
          </p>
        </div>
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
              className="px-3 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors whitespace-nowrap"
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                Total History
              </p>
              <p className="text-2xl font-black text-gray-800 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 text-lg">
              📦
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                Delivered
              </p>
              <p className="text-2xl font-black text-teal-600 mt-1">
                {stats.delivered}
              </p>
            </div>
            <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center border border-teal-100">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                Cancelled
              </p>
              <p className="text-2xl font-black text-red-600 mt-1">
                {stats.cancelled}
              </p>
            </div>
            <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center border border-red-100 text-lg">
              ✕
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                Late Orders
              </p>
              <p className="text-2xl font-black text-orange-600 mt-1">
                {stats.late}
              </p>
            </div>
            <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
              <ClockIcon className="h-5 w-5" />
            </div>
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
                placeholder="Search by Order #, Guest, or Room..."
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
              {filteredData.length} records
            </span>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A00] mx-auto mb-3" />
                <p className="text-xs font-medium uppercase tracking-widest">
                  Loading Archives...
                </p>
              </div>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-500">No orders found.</p>
                <p className="text-xs mt-1">
                  Try adjusting the date or search query.
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
                            {formatTime(order.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                            {order.guestName}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[120px]">
                            {order.roomName
                              ? `Room ${order.roomName}`
                              : (order.deliveryLocation || "N/A").replace(
                                "_",
                                " ",
                              )}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm text-gray-700 truncate max-w-[200px]">
                            {order.items
                              .slice(0, 2)
                              .map((i) => `${i.quantity}x ${i.name}`)
                              .join(", ")}
                            {order.items.length > 2 &&
                              ` +${order.items.length - 2} more`}
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
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
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
          {filteredData.length > ITEMS_PER_PAGE && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/30">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-bold">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}
                </span>{" "}
                of <span className="font-bold">{filteredData.length}</span>{" "}
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
        />
      )}
    </div>
  );
}
