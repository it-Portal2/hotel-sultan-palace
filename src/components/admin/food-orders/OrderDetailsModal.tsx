"use client";

import React, { useState, useEffect } from "react";
import { FoodOrder } from "@/lib/firestoreService";
import { checkOrderIngredients, type IngredientCheckResult } from "@/lib/inventoryService";
import Link from "next/link";
import {
  XMarkIcon,
  PrinterIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OrderDetailsModalProps {
  order: FoodOrder;
  onClose: () => void;
  onUpdateStatus: (id: string, status: FoodOrder["status"]) => void;
  isReadOnly: boolean;
  onReprint?: (orderId: string) => void;
  onKitchenPrint?: (orderId: string) => void;
  onBarPrint?: (orderId: string) => void;
}

export default function OrderDetailsModal({
  order,
  onClose,
  onUpdateStatus,
  isReadOnly,
  onReprint,
  onKitchenPrint,
  onBarPrint,
}: OrderDetailsModalProps) {
  const [liveOrder, setLiveOrder] = useState<FoodOrder>(order);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [reprintSent, setReprintSent] = useState(false);
  const [kitchenPrintSent, setKitchenPrintSent] = useState(false);
  const [barPrintSent, setBarPrintSent] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [ingredientCheckResults, setIngredientCheckResults] = useState<IngredientCheckResult[] | null>(null);
  const [ingredientCheckLoading, setIngredientCheckLoading] = useState(false);
  const [showIngredientCheck, setShowIngredientCheck] = useState(true);

  // Real-time listener for order updates
  useEffect(() => {
    setLiveOrder(order);

    if (!db || !order.id) return;

    const menuType = (order as any).menuType || "food";
    const collectionName = menuType === "bar" ? "barOrders" : "foodOrders";

    const unsub = onSnapshot(doc(db, collectionName, order.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveOrder({ ...data, id: docSnap.id } as FoodOrder);
      }
    });

    return () => unsub();
  }, [order]);

  // Auto-fetch ingredient availability when order is pending
  useEffect(() => {
    if (order.status !== 'pending' || !order.id) return;
    const menuType = (order as any).menuType || "food";
    setIngredientCheckLoading(true);
    setIngredientCheckResults(null);
    checkOrderIngredients(order.id, menuType)
      .then((results) => setIngredientCheckResults(results))
      .catch((err) => { console.error("Ingredient check failed", err); setIngredientCheckResults([]); })
      .finally(() => setIngredientCheckLoading(false));
  }, [order.id, order.status]);

  const handleReprint = () => {
    if (onReprint && !reprintSent) {
      onReprint(liveOrder.id);
      setReprintSent(true);
      setTimeout(() => setReprintSent(false), 2000);
    }
  };

  const handleKitchenPrint = () => {
    if (onKitchenPrint && !kitchenPrintSent) {
      onKitchenPrint(liveOrder.id);
      setKitchenPrintSent(true);
      setTimeout(() => setKitchenPrintSent(false), 2000);
    }
  };

  const handleBarPrint = () => {
    if (onBarPrint && !barPrintSent) {
      onBarPrint(liveOrder.id);
      setBarPrintSent(true);
      setTimeout(() => setBarPrintSent(false), 2000);
    }
  };

  const handleAction = async (status: FoodOrder["status"]) => {
    setLoadingAction(status);
    try {
      await onUpdateStatus(liveOrder.id, status);
    } finally {
      setLoadingAction(null);
    }
  };

  const deliveryLabels: Record<string, string> = {
    in_room: "In Room",
    restaurant: "Restaurant",
    bar: "Bar",
    beach_side: "Beach Side",
    pool_side: "Pool Side",
  };

  const orderTypeLabels: Record<string, string> = {
    walk_in: "Walk-In",
    takeaway: "Takeaway",
    room_service: "Room Service",
    delivery: "Delivery",
  };

  const statusConfig: Record<
    string,
    { bg: string; text: string; border: string; dot: string }
  > = {
    pending: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
      dot: "bg-yellow-500",
    },
    confirmed: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
    },
    preparing: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      dot: "bg-orange-500",
    },
    ready: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200",
      dot: "bg-teal-500",
    },
    out_for_delivery: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      dot: "bg-purple-500",
    },
    delivered: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    cancelled: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      dot: "bg-red-500",
    },
  };

  const sc = statusConfig[liveOrder.status] || statusConfig.pending;

  const formatDate = (d: any) => {
    if (!d) return "-";
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFinalized =
    liveOrder.status === "delivered" || liveOrder.status === "cancelled";

  // Action button helper
  const ActionBtn = ({
    label,
    status,
    color,
  }: {
    label: string;
    status: FoodOrder["status"];
    color: string;
  }) => (
    <button
      onClick={() => handleAction(status)}
      disabled={!!loadingAction}
      className={`flex-1 py-2.5 px-4 ${color} text-white text-sm font-bold rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2`}
    >
      {loadingAction === status ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </>
      ) : (
        label
      )}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ===== HEADER ===== */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    #{(liveOrder.orderNumber || "").replace(/^#/, "")}
                  </h3>
                  {liveOrder.receiptNo && (
                    <span className="text-xs text-gray-400 font-medium">
                      #{(liveOrder.receiptNo || "").replace(/^#/, "")}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text} border ${sc.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {(liveOrder.status || "pending").replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(liveOrder.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Edit — hidden after confirmation (Phase 9C) */}
              {!isReadOnly &&
                !isFinalized &&
                (liveOrder.status === "pending" || ((liveOrder as any).dueAmount || 0) > 0) && (
                  <Link
                    href={`/admin/food-orders/create?menuType=${(liveOrder as any).menuType || 'food'}&editOrderId=${liveOrder.id}&returnUrl=${typeof window !== 'undefined' ? window.location.pathname : ''}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF6A00]/10 text-[#FF6A00] hover:bg-[#FF6A00]/20 font-bold text-xs transition-colors"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    Edit
                  </Link>
                )}
              {/* Print — only show after order is confirmed */}
              {onReprint && liveOrder.status !== "pending" && (
                <button
                  onClick={handleReprint}
                  disabled={reprintSent}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-colors ${reprintSent
                    ? "bg-green-100 text-green-600"
                    : "bg-[#FF6A00]/10 text-[#FF6A00] hover:bg-[#FF6A00]/20"
                    }`}
                >
                  <PrinterIcon className="h-4 w-4" />
                  {reprintSent ? "Sent!" : "Print"}
                </button>
              )}
              {/* View Receipt / Generating Receipt */}
              {(liveOrder as any).receiptUrl ? (
                <a
                  href={(liveOrder as any).receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  View Receipt
                </a>
              ) : (
                // Show loading state if confirmed/past confirmed but no receipt yet
                (liveOrder.status === "confirmed" ||
                  liveOrder.status === "preparing" ||
                  liveOrder.status === "ready" ||
                  liveOrder.status === "out_for_delivery" ||
                  liveOrder.status === "delivered") && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed">
                    <svg
                      className="animate-spin h-3.5 w-3.5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating Receipt...
                  </div>
                )
              )}
              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ===== SCROLLABLE BODY ===== */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* --- Guest & Delivery Info --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" /> Guest Details
                </h4>
                <p className="text-sm font-semibold text-gray-900 break-words">
                  {liveOrder.guestName}
                </p>
                {liveOrder.guestEmail && liveOrder.guestEmail !== "N/A" && (
                  <p className="text-xs text-gray-500 mt-1 break-all">
                    {liveOrder.guestEmail}
                  </p>
                )}
                {liveOrder.roomName && (
                  <p className="text-xs font-semibold text-indigo-600 mt-1.5">
                    Room: {liveOrder.roomName}
                  </p>
                )}
                {liveOrder.tableNumber && (
                  <p className="text-xs text-gray-600 mt-1">
                    Table: {liveOrder.tableNumber}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <MapPinIcon className="h-3.5 w-3.5" /> Order Info
                </h4>
                <div className="space-y-1.5 text-xs text-gray-700">
                  <p>
                    <span className="font-medium text-gray-500">Location:</span>{" "}
                    {deliveryLabels[liveOrder.deliveryLocation] ||
                      liveOrder.deliveryLocation}
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Type:</span>{" "}
                    {orderTypeLabels[liveOrder.orderType] ||
                      liveOrder.orderType}
                  </p>
                  {liveOrder.waiterName && (
                    <p>
                      <span className="font-medium text-gray-500">Waiter:</span>{" "}
                      {liveOrder.waiterName}
                    </p>
                  )}
                  {liveOrder.preparedBy && (
                    <p>
                      <span className="font-medium text-gray-500">
                        Prepared:
                      </span>{" "}
                      {liveOrder.preparedBy}
                    </p>
                  )}
                  {liveOrder.printedBy && (
                    <p>
                      <span className="font-medium text-gray-500">
                        Printed:
                      </span>{" "}
                      {liveOrder.printedBy}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* --- Priority & Kitchen Notes --- */}
            {(liveOrder.priority === "urgent" || liveOrder.notes) && (
              <div className="flex flex-wrap gap-3">
                {liveOrder.priority === "urgent" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    URGENT ORDER
                  </div>
                )}
                {liveOrder.notes && (
                  <div className="flex-1 min-w-[200px] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 break-words">
                    <span className="font-bold">Kitchen Notes:</span>{" "}
                    {liveOrder.notes}
                  </div>
                )}
              </div>
            )}

            {liveOrder.estimatedPreparationTime && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <ClockIcon className="h-3.5 w-3.5" />
                Est. Prep: {liveOrder.estimatedPreparationTime} mins
              </div>
            )}

            {/* --- Order Items --- */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Items ({liveOrder.items.length})
              </h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                {liveOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex justify-between items-start gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 break-words">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                      {/* Variant */}
                      {item.variant && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md border border-purple-100">
                          {item.variant.name}
                          {item.variant.price > 0 &&
                            ` (+$${item.variant.price.toFixed(2)})`}
                        </span>
                      )}
                      {/* Modifiers */}
                      {item.selectedModifiers &&
                        item.selectedModifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedModifiers.map((mod, mi) => (
                              <span
                                key={mi}
                                className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded border border-blue-100"
                              >
                                {mod.name}
                                {mod.price > 0 && ` +$${mod.price.toFixed(2)}`}
                              </span>
                            ))}
                          </div>
                        )}
                      {/* Special Notes */}
                      {item.specialInstructions && (
                        <p className="mt-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 break-words">
                          📝 {item.specialInstructions}
                        </p>
                      )}
                      {/* Category/Station */}
                      {(item.category || item.station) && (
                        <div className="flex gap-1.5 mt-1">
                          {item.category && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              {item.category}
                            </span>
                          )}
                          {item.station && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              • {item.station}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Ingredient Availability Check (Pending orders only) --- */}
            {liveOrder.status === 'pending' && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowIngredientCheck(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {ingredientCheckLoading ? (
                      <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : ingredientCheckResults && ingredientCheckResults.some(r => !r.sufficient) ? (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      {ingredientCheckLoading
                        ? 'Checking ingredients...'
                        : ingredientCheckResults === null
                          ? 'Ingredient Availability'
                          : ingredientCheckResults.length === 0
                            ? 'No recipe data found'
                            : ingredientCheckResults.some(r => !r.sufficient)
                              ? `Insufficient Ingredients (${ingredientCheckResults.filter(r => !r.sufficient).length} item${ingredientCheckResults.filter(r => !r.sufficient).length > 1 ? 's' : ''})`
                              : 'All Ingredients Available'}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">{showIngredientCheck ? '▲' : '▼'}</span>
                </button>

                {showIngredientCheck && ingredientCheckResults && ingredientCheckResults.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {ingredientCheckResults.map((r) => (
                      <div
                        key={r.inventoryItemId}
                        className={`flex items-center justify-between px-4 py-2 text-xs ${r.sufficient ? 'bg-white' : 'bg-red-50'
                          }`}
                      >
                        <span className={`font-medium ${r.sufficient ? 'text-gray-700' : 'text-red-700 font-bold'}`}>
                          {r.ingredientName}
                        </span>
                        <div className="flex items-center gap-3 text-right">
                          <span className={`${r.sufficient ? 'text-gray-400' : 'text-red-500 font-bold'}`}>
                            req: {r.required}{r.unit}
                          </span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${r.sufficient
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {r.available}{r.unit} STOCK
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- Financials --- */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">
                  ${liveOrder.subtotal?.toFixed(2) || "0.00"}
                </span>
              </div>
              {liveOrder.tax > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Tax
                    {(liveOrder as any).taxDetails?.type &&
                      ` (${(liveOrder as any).taxDetails.type} ${(liveOrder as any).taxDetails.value}${(liveOrder as any).taxDetails.type === "percentage" ? "%" : ""})`}
                  </span>
                  <span className="font-medium">
                    +${liveOrder.tax?.toFixed(2)}
                  </span>
                </div>
              )}
              {liveOrder.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount
                    {(liveOrder as any).discountDetails?.type &&
                      ` (${(liveOrder as any).discountDetails.type} ${(liveOrder as any).discountDetails.value}${(liveOrder as any).discountDetails.type === "percentage" ? "%" : ""})`}
                  </span>
                  <span className="font-medium">
                    -${liveOrder.discount?.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-black text-[#FF6A00]">
                  ${liveOrder.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* --- Payment --- */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {liveOrder.paymentMethod && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Method
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {liveOrder.paymentMethod}
                  </p>
                </div>
              )}
              {liveOrder.paymentStatus && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Status
                  </p>
                  <p
                    className={`text-sm font-bold mt-0.5 capitalize ${liveOrder.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {liveOrder.paymentStatus}
                  </p>
                </div>
              )}
              {(liveOrder as any).paidAmount !== undefined && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Paid
                  </p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">
                    ${(liveOrder as any).paidAmount?.toFixed(2)}
                  </p>
                </div>
              )}
              {(liveOrder as any).dueAmount !== undefined &&
                (liveOrder as any).dueAmount > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Due
                    </p>
                    <p className="text-sm font-bold text-red-600 mt-0.5">
                      ${(liveOrder as any).dueAmount?.toFixed(2)}
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* ===== FOOTER ACTIONS ===== */}
          {!isReadOnly && (
            <div className="bg-white border-t border-gray-100 px-6 py-4 shrink-0">
              {!isFinalized ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  {liveOrder.status === "pending" && (
                    <ActionBtn
                      label="Confirm Order"
                      status="confirmed"
                      color="bg-blue-600 hover:bg-blue-700"
                    />
                  )}
                  {liveOrder.status === "confirmed" && (
                    <>
                      <ActionBtn
                        label="Start Preparing"
                        status="preparing"
                        color="bg-orange-600 hover:bg-orange-700"
                      />
                      {onKitchenPrint && (liveOrder as any).menuType !== "bar" && (
                        <button
                          onClick={handleKitchenPrint}
                          disabled={kitchenPrintSent || !!loadingAction}
                          className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${kitchenPrintSent
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-[#FF6A00] hover:bg-[#E55A00] text-white"
                            }`}
                        >
                          <PrinterIcon className="h-4 w-4" />
                          {kitchenPrintSent
                            ? "Sent to Kitchen!"
                            : "Print in Kitchen"}
                        </button>
                      )}

                      {onBarPrint && (liveOrder as any).menuType === "bar" && (
                        <button
                          onClick={handleBarPrint}
                          disabled={barPrintSent || !!loadingAction}
                          className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${barPrintSent
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-[#FF6A00] hover:bg-[#E55A00] text-white"
                            }`}
                        >
                          <PrinterIcon className="h-4 w-4" />
                          {barPrintSent
                            ? "Sent to Bar!"
                            : "Print in Bar"}
                        </button>
                      )}
                    </>
                  )}
                  {liveOrder.status === "preparing" && (
                    <ActionBtn
                      label="Mark Ready"
                      status="ready"
                      color="bg-teal-600 hover:bg-teal-700"
                    />
                  )}
                  {liveOrder.status === "ready" && (
                    <ActionBtn
                      label="Start Delivery"
                      status="out_for_delivery"
                      color="bg-purple-600 hover:bg-purple-700"
                    />
                  )}
                  {liveOrder.status === "out_for_delivery" && (
                    <ActionBtn
                      label="Delivered"
                      status="delivered"
                      color="bg-emerald-600 hover:bg-emerald-700"
                    />
                  )}
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={!!loadingAction}
                    className="flex-1 py-2.5 px-4 bg-white text-red-600 text-sm font-bold border border-gray-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    Cancel Order
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 font-medium italic">
                  This order is{" "}
                  <span className="font-bold">{liveOrder.status}</span>. No
                  further actions.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          handleAction("cancelled");
          setShowCancelConfirm(false);
        }}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel Order"
        cancelText="No, Keep Order"
      />
    </>
  );
}
