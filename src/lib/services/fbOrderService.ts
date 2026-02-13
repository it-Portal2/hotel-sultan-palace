import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";

// Import cross-module dependencies that stay in firestoreService
import {
  getRoomStatus,
  getBooking,
  updateBooking,
  addTransaction,
  updateDailyFBRevenue,
} from "../firestoreService";
import type { FoodOrder } from "../types/foodMenu";

// Re-export for consumers
export type { FoodOrder };

// ─── Collection ─────────────────────────────────────────────────────────────
const FOOD_ORDERS = "foodOrders";
const BAR_ORDERS = "barOrders";

// Helper to get collection name
const getCollectionName = (menuType?: "food" | "bar") => {
  return menuType === "bar" ? BAR_ORDERS : FOOD_ORDERS;
};

// ═════════════════════════════════════════════════════════════════════════════
// READ
// ═════════════════════════════════════════════════════════════════════════════

export const getFoodOrders = async (
  status?: FoodOrder["status"],
  menuType?: "food" | "bar",
): Promise<FoodOrder[]> => {
  if (!db) return [];
  try {
    const colName = getCollectionName(menuType);
    const c = collection(db, colName);
    const qy = query(c, orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);
    let orders = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        scheduledDeliveryTime: data.scheduledDeliveryTime?.toDate(),
        actualDeliveryTime: data.actualDeliveryTime?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as FoodOrder;
    });

    if (status) orders = orders.filter((o) => o.status === status);

    // If menuType is NOT provided, we technically only fetched FOOD_ORDERS (default).
    // If we want both, we'd need to fetch both collections.
    // For now, adhering to 'separate collections' means we fetch specific types.
    // The previous implementation filtered by property. Now we fetch by collection.
    // If explicit menuType provided, we are good.
    // If not provided, we return FOOD orders (backward compat).

    return orders;
  } catch (e) {
    console.error("Error fetching food orders:", e);
    return [];
  }
};

export const getFoodOrder = async (id: string): Promise<FoodOrder | null> => {
  if (!db) return null;
  try {
    // Try Food Orders first
    let r = doc(db, FOOD_ORDERS, id);
    let s = await getDoc(r);

    // If not found, try Bar Orders
    if (!s.exists()) {
      r = doc(db, BAR_ORDERS, id);
      s = await getDoc(r);
    }

    if (!s.exists()) return null;

    const data = s.data();
    return {
      id: s.id,
      ...data,
      scheduledDeliveryTime: data.scheduledDeliveryTime?.toDate(),
      actualDeliveryTime: data.actualDeliveryTime?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as FoodOrder;
  } catch (e) {
    console.error("Error getting food order:", e);
    return null;
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// ATOMIC COUNTERS
// ═════════════════════════════════════════════════════════════════════════════

export const getNextOrderNumber = async (): Promise<string> => {
  if (!db) throw new Error("Firestore not initialized");
  const counterRef = doc(db, "counters", "foodOrders");
  const nextNum = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let current = 0;
    if (counterDoc.exists()) {
      current = counterDoc.data().lastOrderNumber || 0;
    }
    const next = current + 1;
    transaction.set(counterRef, { lastOrderNumber: next }, { merge: true });
    return next;
  });
  return `ORD-${String(nextNum).padStart(4, "0")}`;
};

export const getNextReceiptNumber = async (): Promise<string> => {
  if (!db) throw new Error("Firestore not initialized");
  const counterRef = doc(db, "counters", "foodOrders");
  const nextNum = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let current = 0;
    if (counterDoc.exists()) {
      current = counterDoc.data().lastReceiptNumber || 0;
    }
    const next = current + 1;
    transaction.set(counterRef, { lastReceiptNumber: next }, { merge: true });
    return next;
  });
  return `REC-${String(nextNum).padStart(4, "0")}`;
};

// ═════════════════════════════════════════════════════════════════════════════
// CREATE
// ═════════════════════════════════════════════════════════════════════════════

export const createFoodOrder = async (
  data: Omit<FoodOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">,
): Promise<{ id: string; orderNumber: string; receiptNo: string } | null> => {
  if (!db) return null;
  try {
    // Generate guaranteed-unique sequential order & receipt numbers
    const orderNumber = await getNextOrderNumber();
    const receiptNo = await getNextReceiptNumber();

    // AUTOMATIC BOOKING LINKING
    if (data.roomName && !data.bookingId) {
      try {
        const roomStatus = await getRoomStatus(data.roomName);
        if (
          roomStatus &&
          roomStatus.status === "occupied" &&
          roomStatus.currentBookingId
        ) {
          data.bookingId = roomStatus.currentBookingId;
          console.log(
            `Auto-linked Order to Booking: ${roomStatus.currentBookingId} for Room ${data.roomName}`,
          );
        }
      } catch (err) {
        console.warn("Failed to auto-link booking:", err);
      }
    }

    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });
    // Server-generated values — set AFTER spread to prevent client overwrite
    cleanData.orderNumber = orderNumber;
    cleanData.receiptNo = receiptNo;

    const colName = getCollectionName(data.menuType);
    const c = collection(db, colName);
    const dr = await addDoc(c, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      revenueRecorded: false,
    });

    // Update booking if bookingId exists
    if (data.bookingId) {
      const booking = await getBooking(data.bookingId);
      if (booking) {
        const foodOrderIds = booking.foodOrderIds || [];
        if (!foodOrderIds.includes(dr.id)) {
          const currentTotal = booking.totalAmount || 0;
          const orderTotal = data.totalAmount || 0;

          await updateBooking(data.bookingId, {
            foodOrderIds: [...foodOrderIds, dr.id],
            totalAmount: currentTotal + orderTotal,
            updatedAt: new Date(),
          });

          // AUTO-PAYMENT TRANSACTION
          if (
            data.paymentStatus === "paid" &&
            data.paymentMethod &&
            data.paymentMethod !== "Room Charge"
          ) {
            await addTransaction({
              bookingId: data.bookingId,
              amount: orderTotal,
              type: "payment",
              category: "F&B",
              description: `F&B Payment: ${orderNumber} (${data.paymentMethod})`,
              code: data.paymentMethod.toUpperCase(),
              userId: data.userId || "POS",
              reference: orderNumber,
              date: new Date(),
            });
          }
        }
      }
    }

    return { id: dr.id, orderNumber, receiptNo };
  } catch (e) {
    console.error("Error creating food order:", e);
    return null;
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// UPDATE
// ═════════════════════════════════════════════════════════════════════════════

export const updateFoodOrder = async (
  id: string,
  data: Partial<FoodOrder>,
): Promise<boolean> => {
  if (!db) return false;
  try {
    // Check if we need to record revenue (status changed to delivered/paid)
    if (data.status === "delivered" || data.paymentStatus === "paid") {
      const currentOrder = await getFoodOrder(id);
      if (currentOrder && !currentOrder.revenueRecorded) {
        await updateDailyFBRevenue(new Date(), {
          ...currentOrder,
          ...data,
        } as FoodOrder);
        data.revenueRecorded = true;
        console.log("Revenue Recorded for Order:", id);
      }
    }

    // Remove undefined values - Firestore doesn't accept undefined
    const cleanData: any = {};
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });

    // Determine collection by trying to find valid doc
    // Optimization: if we start passing menuType to updateFoodOrder, we can skip this check.
    // For now, check existence.
    let colName = FOOD_ORDERS;
    let r = doc(db, FOOD_ORDERS, id);
    let s = await getDoc(r);

    if (!s.exists()) {
      colName = BAR_ORDERS;
      r = doc(db, BAR_ORDERS, id);
    }

    await updateDoc(r, { ...cleanData, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error("Error updating food order:", e);
    return false;
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// DELETE
// ═════════════════════════════════════════════════════════════════════════════

export const deleteFoodOrder = async (id: string): Promise<boolean> => {
  if (!db) return false;
  try {
    // Try delete from both, or checking first
    let r = doc(db, FOOD_ORDERS, id);
    await deleteDoc(r);
    // Also try bar orders (if it was there, this won't hurt, or we check first)
    // Deleting non-existent doc is fine in firestore (no error),
    // but better to be precise?
    // Since IDs should be unique, we can attempt both or check.
    // Attempting both is cheaper than reading first.
    const rBar = doc(db, BAR_ORDERS, id);
    await deleteDoc(rBar);
    return true;
  } catch (e) {
    console.error("Error deleting food order:", e);
    return false;
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// KITCHEN QUERIES
// ═════════════════════════════════════════════════════════════════════════════

export const getKitchenOrders = async (): Promise<FoodOrder[]> => {
  if (!db) return [];
  try {
    const orders = await getFoodOrders();
    return orders.filter(
      (o) =>
        o.status === "pending" ||
        o.status === "confirmed" ||
        o.status === "preparing" ||
        o.status === "ready",
    );
  } catch (e) {
    console.error("Error fetching kitchen orders:", e);
    return [];
  }
};
