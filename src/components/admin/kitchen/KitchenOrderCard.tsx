import React, { useState, useEffect } from "react";
import { FoodOrder } from "@/lib/firestoreService";
import { getRecipeByMenuItem, getInventoryItems } from "@/lib/inventoryService";
import { InventoryItem, Recipe } from "@/lib/firestoreService";
import {
  ClockIcon,
  FireIcon,
  CheckCircleIcon,
  MapPinIcon,
  UserIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XCircleIcon,
  CheckIcon,
  BoltIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  TagIcon,
} from "@heroicons/react/24/solid";

interface KitchenOrderCardProps {
  order: FoodOrder;
  onUpdateStatus: (
    orderId: string,
    status: FoodOrder["status"],
  ) => void | Promise<void>;
}

// Sub-component to handle ingredient fetching and display
function OrderItemIngredients({
  menuItemId,
  quantity,
  itemName,
}: {
  menuItemId: string;
  quantity: number;
  itemName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredientsStatus, setIngredientsStatus] = useState<
    Array<{
      name: string;
      required: number;
      available: number;
      unit: string;
      isLow: boolean;
    }>
  >([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [missingStock, setMissingStock] = useState(false);

  useEffect(() => {
    const checkStock = async () => {
      try {
        // 1. Get Recipe
        const fetchedRecipe = await getRecipeByMenuItem(menuItemId);
        if (!fetchedRecipe) {
          setLoading(false);
          return;
        }
        setRecipe(fetchedRecipe);

        // 2. Get Inventory Items needed
        // Note: In a real large-scale app, we might want to cache this or fetch all at once,
        // but for this scale fetching per item is acceptable for real-time accuracy.
        const allInventory = await getInventoryItems();

        const status = fetchedRecipe.ingredients.map((ing) => {
          const invItem = allInventory.find(
            (i) => i.id === ing.inventoryItemId,
          );
          const currentStock = invItem?.currentStock || 0;
          const requiredTotal = ing.quantity * quantity;

          return {
            name: ing.inventoryItemName,
            required: requiredTotal,
            available: currentStock,
            unit: ing.unit,
            isLow: currentStock < requiredTotal,
          };
        });

        setIngredientsStatus(status);

        if (status.some((i) => i.isLow)) {
          setMissingStock(true);
          // Auto-expand if critical
          setIsExpanded(true);
        }
      } catch (error) {
        console.error("Error checking stock", error);
      } finally {
        setLoading(false);
      }
    };

    checkStock();
  }, [menuItemId, quantity]);

  if (loading)
    return (
      <div className="animate-pulse h-4 w-20 bg-gray-100 rounded mt-1"></div>
    );
  if (!recipe) return null; // No recipe mapped, nothing to show

  return (
    <div className="mt-2">
      {/* Status Indicator / Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded transition-colors ${
          missingStock
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-100"
        }`}
      >
        {missingStock ? (
          <>
            <XCircleIcon className="h-3.5 w-3.5" />
            <span>Insufficient Ingredients</span>
          </>
        ) : (
          <>
            <CheckIcon className="h-3.5 w-3.5" />
            <span>Ingredients Available</span>
          </>
        )}
        {isExpanded ? (
          <ChevronUpIcon className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDownIcon className="h-3 w-3 ml-1" />
        )}
      </button>

      {/* Detailed Ingredient List */}
      {isExpanded && (
        <div className="mt-2 pl-2 border-l-2 border-gray-100 space-y-1">
          {ingredientsStatus.map((ing, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-gray-600 font-medium">{ing.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className={
                    ing.isLow ? "text-red-600 font-bold" : "text-gray-500"
                  }
                >
                  req: {ing.required.toFixed(2)}
                  {ing.unit}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${ing.isLow ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {ing.available.toFixed(2)}
                  {ing.unit} Stock
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Format elapsed time: "42m" for <60 min, "1h 42m" for ≥60 min
function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function KitchenOrderCard({
  order,
  onUpdateStatus,
}: KitchenOrderCardProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (status: FoodOrder["status"]) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const calculateElapsed = () => {
      const now = new Date();
      const created =
        order.createdAt instanceof Date
          ? order.createdAt
          : new Date(order.createdAt);
      const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
      setElapsedMinutes(diff);
    };
    calculateElapsed();
    const interval = setInterval(calculateElapsed, 60000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  // Status Colors (Header Backgrounds)
  let headerColor = "bg-gray-100 text-gray-700";
  let statusText = "Pending";

  if (order.status === "confirmed" || order.status === "pending") {
    headerColor = "bg-blue-600 text-white";
    statusText = "NEW ORDER";
  } else if (order.status === "preparing") {
    headerColor = "bg-orange-500 text-white";
    statusText = "PREPARING";
  } else if (order.status === "ready") {
    headerColor = "bg-green-600 text-white";
    statusText = "READY";
  } else if (order.status === "out_for_delivery") {
    headerColor = "bg-indigo-600 text-white";
    statusText = "SERVING";
  }

  const isLate = elapsedMinutes > 20;
  const isUrgentOrder = order.priority === "urgent";

  return (
    <div className="flex flex-col w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-auto flex-shrink-0">
      {/* TICKET HEADER */}
      <div
        className={`${headerColor} px-4 py-2 flex justify-between items-center`}
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight leading-none">
              #{(order.orderNumber || "").replace(/^#/, "")}
            </span>
            <span className="text-[10px] font-bold uppercase opacity-90 mt-0.5 tracking-wider">
              {statusText}
            </span>
          </div>
          {isUrgentOrder && (
            <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
              <BoltIcon className="h-3 w-3" />
              Urgent
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Scheduled Time Badge */}
          {order.scheduledDeliveryTime && (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${
                new Date() > new Date(order.scheduledDeliveryTime)
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-indigo-100 text-indigo-700 border border-indigo-200"
              }`}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              <span>
                Due:{" "}
                {new Date(order.scheduledDeliveryTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {/* Elapsed Timer */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${isLate && order.status !== "ready" ? "bg-orange-500 text-white animate-pulse" : "bg-black/20 text-white"}`}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            <span>{formatElapsed(elapsedMinutes)}</span>
          </div>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
            <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
            <span>
              {order.deliveryLocation?.replace("_", " ") || "Dine In"}
            </span>
            {order.roomName && <span className="text-gray-400 mx-1">|</span>}
            {order.roomName && <span> {order.roomName}</span>}
          </div>
          <div className="flex flex-col items-end">
            <div
              className="flex items-center gap-1.5 font-bold"
              title={order.guestName}
            >
              <UserIcon className="h-3.5 w-3.5 text-gray-400" />
              <span className="truncate max-w-[120px]">{order.guestName}</span>
            </div>
            {order.guestEmail && (
              <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                <EnvelopeIcon className="h-3 w-3" />
                <span>{order.guestEmail}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KITCHEN NOTES */}
      {order.notes && (
        <div className="mx-3 mt-2 flex items-start gap-1.5 bg-amber-50 p-2 rounded text-amber-800 text-xs font-semibold border border-amber-200">
          <ChatBubbleLeftIcon className="h-4 w-4 flex-shrink-0 text-amber-500 mt-0.5" />
          <span className="break-words min-w-0 flex-1">{order.notes}</span>
        </div>
      )}

      {/* ORDER ITEMS (Ticket Body) */}
      <div className="flex-1 p-0 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-200 bg-white">
        <ul className="divide-y divide-gray-100">
          {order.items.map((item, idx) => (
            <li
              key={`${order.id}-${idx}`}
              className="p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Quantity */}
                <div className="text-lg font-bold text-gray-900 min-w-[24px] text-center leading-none mt-0.5">
                  {item.quantity}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800 leading-tight">
                    {item.name}
                  </p>

                  {(item.variant ||
                    (item.selectedModifiers &&
                      item.selectedModifiers.length > 0)) && (
                    <div className="mt-1 space-y-0.5">
                      {item.variant && (
                        <p className="text-xs text-gray-500 font-medium">
                          <span className="text-gray-400">Size:</span>{" "}
                          {item.variant.name}
                        </p>
                      )}
                      {item.selectedModifiers?.map((mod, mIdx) => (
                        <p
                          key={mIdx}
                          className="text-xs text-gray-500 font-medium"
                        >
                          <span className="text-gray-400">+</span> {mod.name}
                        </p>
                      ))}
                    </div>
                  )}

                  {item.specialInstructions && (
                    <div className="mt-2 flex items-start gap-1.5 bg-red-50 p-2 rounded text-red-700 text-xs font-bold border border-red-100">
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.specialInstructions}</span>
                    </div>
                  )}

                  {/* Real-time Ingredient Status */}
                  {/* Only show for NEW orders. Once cooking, ingredients are already used. */}
                  {(order.status === "pending" ||
                    order.status === "confirmed") && (
                    <OrderItemIngredients
                      menuItemId={item.menuItemId}
                      quantity={item.quantity}
                      itemName={item.name}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ACTION FOOTER */}
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        {(order.status === "confirmed" || order.status === "pending") && (
          <button
            onClick={() => handleStatusUpdate("preparing")}
            disabled={isUpdating}
            className="w-full py-3 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg font-bold text-sm uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <div className="h-4 w-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FireIcon className="h-4 w-4" />
            )}
            {isUpdating ? "Updating..." : "Start Cooking"}
          </button>
        )}
        {order.status === "preparing" && (
          <button
            onClick={() => handleStatusUpdate("ready")}
            disabled={isUpdating}
            className="w-full py-3 bg-white border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white rounded-lg font-bold text-sm uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <div className="h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircleIcon className="h-4 w-4" />
            )}
            {isUpdating ? "Updating..." : "Mark Ready"}
          </button>
        )}
        {order.status === "ready" && (
          <button
            onClick={() => handleStatusUpdate("out_for_delivery")}
            disabled={isUpdating}
            className="w-full py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            {isUpdating ? "Updating..." : "Serve / Deliver"}
          </button>
        )}
        {order.status === "out_for_delivery" && (
          <button
            onClick={() => handleStatusUpdate("delivered")}
            disabled={isUpdating}
            className="w-full py-3 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <div className="h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            ) : null}
            {isUpdating ? "Updating..." : "Mark Delivered"}
          </button>
        )}
      </div>
    </div>
  );
}
