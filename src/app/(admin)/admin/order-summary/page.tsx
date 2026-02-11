"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  ArrowPathIcon,
  PrinterIcon,
  TrashIcon,
  BoltIcon,
  UserIcon,
  ArrowDownTrayIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

import { useAdminRole } from "@/context/AdminRoleContext";
import { useToast } from "@/context/ToastContext";
import {
  getFBOrdersSummary,
  voidFBOrder,
  changeOrderOwner,
  splitFBOrder,
  FoodOrder,
} from "@/lib/firestoreService";

type OrderStatus = "all" | "running" | "settled" | "voided";

export default function OrderSummaryPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [orderToVoid, setOrderToVoid] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const date = selectedDate ? new Date(selectedDate) : undefined;
      const data = await getFBOrdersSummary(date, statusFilter);
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(q) ||
        order.receiptNo?.toLowerCase().includes(q) ||
        order.guestName.toLowerCase().includes(q) ||
        order.roomName?.toLowerCase().includes(q),
    );
  }, [orders, searchQuery]);

  const stats = useMemo(() => {
    return {
      all: orders.length,
      running: orders.filter((o) => o.status === "running").length,
      settled: orders.filter((o) => o.status === "settled").length,
      voided: orders.filter((o) => o.status === "voided").length,
    };
  }, [orders]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleVoid = async () => {
    if (!orderToVoid || !voidReason.trim()) {
      showToast("Please provide a reason for voiding", "error");
      return;
    }
    try {
      const success = await voidFBOrder(orderToVoid, voidReason);
      if (success) {
        showToast("Order voided successfully", "success");
        setShowVoidModal(false);
        setVoidReason("");
        setOrderToVoid(null);
        await loadOrders();
      } else {
        showToast("Failed to void order", "error");
      }
    } catch (error) {
      console.error("Error voiding order:", error);
      showToast("Failed to void order", "error");
    }
  };

  const handleReprintReceipt = (orderId: string) => {
    // TODO: Implement receipt printing
    showToast("Receipt printing feature coming soon", "info");
  };

  const handleReprintKOT = (orderId: string) => {
    // TODO: Implement KOT printing
    showToast("KOT printing feature coming soon", "info");
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    showToast("PDF download feature coming soon", "info");
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 border-b-2 border-[#FF6A00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Order Summary
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all food & beverage orders
          </p>
        </div>
      </div>

      {/* Date Picker and Status Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "text-[#FF6A00] border-b-2 border-[#FF6A00]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All {stats.all}
            </button>
            <button
              onClick={() => setStatusFilter("running")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === "running"
                  ? "text-[#FF6A00] border-b-2 border-[#FF6A00]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Running {stats.running}
            </button>
            <button
              onClick={() => setStatusFilter("settled")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                statusFilter === "settled"
                  ? "text-[#FF6A00] border-b-2 border-[#FF6A00]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Settled
              {stats.settled > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-green-500 rounded-full">
                  {stats.settled}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter("voided")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                statusFilter === "voided"
                  ? "text-[#FF6A00] border-b-2 border-[#FF6A00]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Voided
              {stats.voided > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                  {stats.voided}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Selected Records */}
        {selectedOrders.size > 0 && (
          <div className="text-sm text-[#1D69F9]">
            {selectedOrders.size} record(s) selected
          </div>
        )}
      </div>

      {/* Search and Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => showToast("Recall feature coming soon", "info")}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#FF6A00] transition-colors border-b-2 border-transparent hover:border-[#FF6A00] flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Recall
          </button>
          <button
            onClick={() =>
              selectedOrders.size > 0 &&
              handleReprintReceipt(Array.from(selectedOrders)[0])
            }
            disabled={selectedOrders.size === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#FF6A00] transition-colors border-b-2 border-transparent hover:border-[#FF6A00] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PrinterIcon className="h-4 w-4" />
            Reprint Receipt
          </button>
          <button
            onClick={() =>
              selectedOrders.size > 0 &&
              handleReprintKOT(Array.from(selectedOrders)[0])
            }
            disabled={selectedOrders.size === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#FF6A00] transition-colors border-b-2 border-transparent hover:border-[#FF6A00] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PrinterIcon className="h-4 w-4" />
            Reprint KOT
          </button>
          {!isReadOnly && (
            <>
              <button
                onClick={() => {
                  if (selectedOrders.size > 0) {
                    setOrderToVoid(Array.from(selectedOrders)[0]);
                    setShowVoidModal(true);
                  }
                }}
                disabled={selectedOrders.size === 0}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors border-b-2 border-transparent hover:border-red-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4" />
                Void
              </button>
              <button
                onClick={() => showToast("Split feature coming soon", "info")}
                disabled={selectedOrders.size === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#FF6A00] transition-colors border-b-2 border-transparent hover:border-[#FF6A00] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BoltIcon className="h-4 w-4" />
                Split
              </button>
              <button
                onClick={() =>
                  showToast("Change Owner feature coming soon", "info")
                }
                disabled={selectedOrders.size === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#FF6A00] transition-colors border-b-2 border-transparent hover:border-[#FF6A00] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserIcon className="h-4 w-4" />
                Change Owner
              </button>
            </>
          )}
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#FF6A00] transition-colors border-b-2 border-transparent hover:border-[#FF6A00] flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-lg font-medium text-gray-400">No Record Found!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedOrders.size === filteredOrders.length &&
                        filteredOrders.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order <span className="text-gray-400">▼</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    R/T No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{(order.orderNumber || "").replace(/^#/, "")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(order.orderTime || order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.receiptNo
                        ? `#${(order.receiptNo || "").replace(/^#/, "")}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.rtNo || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {order.orderType?.replace("_", " ") || "Dine In"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.guestName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.userId || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          order.status === "settled"
                            ? "bg-green-100 text-green-700"
                            : order.status === "running"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "voided"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Void Order
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for voiding
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowVoidModal(false);
                  setVoidReason("");
                  setOrderToVoid(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Void Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
