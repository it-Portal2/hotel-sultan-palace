import React, { useState, useEffect } from "react";
import { FoodOrder } from "@/lib/firestoreService";
import {
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  FireIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

interface KitchenOrderTicketProps {
  order: FoodOrder;
  onUpdateStatus: (orderId: string, status: FoodOrder["status"]) => void;
}

export default function KitchenOrderTicket({
  order,
  onUpdateStatus,
}: KitchenOrderTicketProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const start =
        order.createdAt instanceof Date
          ? order.createdAt
          : new Date(order.createdAt);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 60000);
      setElapsedMinutes(diff);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [order.createdAt]);

  // Border Color based on Wait Time
  const getUrgencyClasses = () => {
    if (order.status === "delivered" || order.status === "ready")
      return "border-emerald-500/50 shadow-emerald-900/20";
    if (elapsedMinutes > 45)
      return "border-red-500 shadow-red-900/50 animate-pulse ring-2 ring-red-500/20";
    if (elapsedMinutes > 30)
      return "border-orange-500 shadow-orange-900/40 ring-1 ring-orange-500/20";
    return "border-slate-600 shadow-lg";
  };

  const getTimerColor = () => {
    if (order.status === "delivered" || order.status === "ready")
      return "text-emerald-400";
    if (elapsedMinutes > 45) return "text-red-400 font-bold";
    if (elapsedMinutes > 30) return "text-orange-400 font-bold";
    return "text-blue-400 font-bold";
  };

  return (
    <div
      className={`relative flex flex-col w-full bg-slate-700 rounded-lg overflow-hidden transition-all duration-300 border-l-4 ${getUrgencyClasses()}`}
    >
      {/* Ticket Header */}
      <div className="p-3 bg-slate-800 border-b border-slate-600 flex justify-between items-start">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            Order ID
          </span>
          <h3 className="text-2xl font-black text-white leading-none font-mono tracking-tighter">
            #
            {(order.orderNumber || "").replace(/^#/, "").split("-")[1] ||
              (order.orderNumber || "").slice(-4)}
          </h3>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/50 border border-slate-600 ${getTimerColor()}`}
        >
          <ClockIcon className="h-4 w-4" />
          <span className="font-mono text-lg">{elapsedMinutes}m</span>
        </div>
      </div>

      <div className="px-3 py-2 bg-slate-750 flex items-center justify-between border-b border-slate-600/50">
        <div className="flex items-center text-xs text-slate-300 font-bold bg-slate-600/50 px-2 py-1 rounded border border-slate-500">
          <MapPinIcon className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
          {order.roomName
            ? `ROOM ${order.roomName}`
            : order.deliveryLocation?.toUpperCase() || "N/A"}
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {new Date(order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Ticket Body - Items */}
      <div className="p-3 flex-grow bg-slate-700">
        <ul className="space-y-2">
          {order.items.map((item, idx) => (
            <li
              key={idx}
              className="text-sm pb-2 border-b border-slate-600 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-start font-mono">
                <span className="font-bold text-white w-8 text-lg">
                  {item.quantity}
                </span>
                <span className="flex-1 text-slate-200 font-medium leading-tight pt-0.5">
                  {item.name}
                </span>
              </div>
              {item.specialInstructions && (
                <div className="mt-1.5 ml-8 text-xs text-red-300 italic bg-red-900/30 p-1.5 rounded border border-red-500/30 block">
                  Note: {item.specialInstructions}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Ticket Footer - Actions */}
      <div className="p-2 bg-slate-800 border-t border-slate-600 mt-auto">
        {order.status === "pending" && (
          <button
            onClick={() => onUpdateStatus(order.id, "confirmed")}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black shadow-lg shadow-blue-900/50 uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <CheckCircleIcon className="h-5 w-5" />
            Accept
          </button>
        )}
        {order.status === "confirmed" && (
          <button
            onClick={() => onUpdateStatus(order.id, "preparing")}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-black shadow-lg shadow-orange-900/50 uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <FireIcon className="h-5 w-5" />
            Cook
          </button>
        )}
        {order.status === "preparing" && (
          <button
            onClick={() => onUpdateStatus(order.id, "ready")}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-900/50 uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <BellAlertIcon className="h-5 w-5" />
            Ready
          </button>
        )}
        {order.status === "ready" && (
          <div className="w-full py-3 bg-slate-700 text-slate-400 text-sm font-bold text-center border border-slate-600 rounded uppercase tracking-wider flex items-center justify-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            Completed
          </div>
        )}
      </div>
    </div>
  );
}
