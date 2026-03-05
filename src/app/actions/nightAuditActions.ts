'use server';

import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NightAuditLog, Booking, FoodOrder, Recipe, InventoryItem } from '@/lib/firestoreService';
import { createLedgerEntry, getLedgerEntries } from '@/lib/accountsService';
import { generateNightAuditPDF } from '@/lib/reportGenerator';
import { sendNightAuditReport } from '@/lib/emailService';

const BUSINESS_DAY_DOC_ID = 'current';

// Produces YYYY-MM-DD in LOCAL time (avoids UTC midnight shift for IST users)
const toLocalDateStr = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// Helper to get current business date on server (duplicate to avoid client/server import cycle)
const getCurrentBusinessDateServer = async (): Promise<Date> => {
    if (!db) return new Date();
    try {
        const docRef = doc(db, 'businessDays', BUSINESS_DAY_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return (docSnap.data()?.date as Timestamp).toDate();
        }
        return new Date();
    } catch (error) {
        console.error('Error fetching business date:', error);
        return new Date();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POS DATA TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface POSData {
    orders: FoodOrder[];
    totalOrders: number;
    // Revenue
    posSales: number;       // Σ subtotal
    tax: number;            // Σ tax
    discount: number;       // Σ discount
    total: number;          // Σ totalAmount
    payments: number;       // Σ paidAmount
    paymentBreakdown: Record<string, number>;
    // Cost & Profit
    foodCost: number;       // COGS
    orderRevenue: number;   // = posSales
    orderProfit: number;    // posSales - foodCost
    foodCostPercentage: number;
    // Analytics
    topDishes: { name: string; qty: number; revenue: number }[];
    mostConsumedIngredient: { name: string; qty: number; unit: string }[];
    highestCostDish: { name: string; cost: number } | null;
    highestRevenueDish: { name: string; revenue: number } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTE POS DATA  (pure function — no side effects)
// ─────────────────────────────────────────────────────────────────────────────

async function computePOSData(
    allOrders: FoodOrder[],
    startOfDay: Date,
    endOfDay: Date
): Promise<POSData> {
    // Filter: only settled/delivered within the audit window.
    // Use createdAt for day-membership to match the Firestore date query above.
    // Using updatedAt would cause late-settled orders to bleed into the next business day.
    const VALID_STATUSES = new Set<FoodOrder['status']>(['settled', 'delivered']);
    const orders = allOrders.filter(o => {
        if (!VALID_STATUSES.has(o.status)) return false;
        const ts = o.createdAt instanceof Date
            ? o.createdAt
            : new Date(o.createdAt as any);
        return ts >= startOfDay && ts <= endOfDay;
    });

    // ── Revenue aggregation ───────────────────────────────────────────────────
    let posSales = 0, tax = 0, discount = 0, total = 0, payments = 0;
    const paymentBreakdown: Record<string, number> = {};

    for (const o of orders) {
        posSales += o.subtotal || 0;
        tax += o.tax || 0;
        discount += o.discount || 0;
        total += o.totalAmount || 0;
        payments += o.paidAmount || 0;

        if (o.paymentMethod) {
            const method = o.paymentMethod.toLowerCase().replace(/\s+/g, '_');
            paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (o.paidAmount || o.totalAmount || 0);
        }
    }

    // ── Pre-load recipes & inventory (one bulk query each) ───────────────────
    if (!db) {
        return emptyPOS(orders);
    }

    const [recipesSnap, inventorySnap] = await Promise.all([
        getDocs(collection(db, 'recipes')),
        getDocs(collection(db, 'inventory')),
    ]);

    // menuItemId → Recipe
    const recipeMap = new Map<string, Recipe>();
    recipesSnap.docs.forEach(d => {
        const r = { id: d.id, ...d.data() } as Recipe;
        recipeMap.set(r.menuItemId, r);
    });

    // inventoryItemId → unitCost, name, unit
    const invMap = new Map<string, { unitCost: number; name: string; unit: string }>();
    inventorySnap.docs.forEach(d => {
        const item = d.data() as InventoryItem;
        invMap.set(d.id, {
            unitCost: item.unitCost || 0,
            name: item.name,
            unit: item.unit,
        });
    });

    // ── COGS + analytics ─────────────────────────────────────────────────────
    let foodCost = 0;
    const dishMap = new Map<string, { qty: number; revenue: number; cost: number }>();
    const ingMap = new Map<string, { qty: number; unit: string; name: string }>();

    for (const order of orders) {
        for (const item of order.items) {
            // Dish stats
            const existing = dishMap.get(item.name) || { qty: 0, revenue: 0, cost: 0 };
            existing.qty += item.quantity;
            existing.revenue += item.price * item.quantity;

            const recipe = recipeMap.get(item.menuItemId);
            if (recipe?.ingredients) {
                for (const ing of recipe.ingredients) {
                    const invEntry = invMap.get(ing.inventoryItemId);
                    // Use live unitCost from inventory; fall back to recipe snapshot
                    const unitCost = invEntry?.unitCost ?? ing.costPerUnit ?? 0;
                    const qtyUsed = ing.quantity * item.quantity;
                    const ingCost = qtyUsed * unitCost;

                    foodCost += ingCost;
                    existing.cost += ingCost;

                    // Ingredient aggregation
                    const ingExisting = ingMap.get(ing.inventoryItemId) || {
                        qty: 0,
                        unit: invEntry?.unit || ing.unit || '',
                        name: invEntry?.name || ing.inventoryItemName || ing.inventoryItemId,
                    };
                    ingExisting.qty += qtyUsed;
                    ingMap.set(ing.inventoryItemId, ingExisting);
                }
            }

            dishMap.set(item.name, existing);
        }
    }

    // ── Sort analytics ────────────────────────────────────────────────────────
    const dishArray = Array.from(dishMap.entries()).map(([name, v]) => ({ name, ...v }));

    const topDishes = [...dishArray]
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5)
        .map(({ name, qty, revenue }) => ({ name, qty, revenue }));

    const mostConsumedIngredient = Array.from(ingMap.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    const highestCostDish = dishArray.length > 0
        ? dishArray.reduce((best, d) => (d.cost > best.cost ? d : best))
        : null;

    const highestRevenueDish = dishArray.length > 0
        ? dishArray.reduce((best, d) => (d.revenue > best.revenue ? d : best))
        : null;

    const orderRevenue = posSales;
    const orderProfit = orderRevenue - foodCost;
    const foodCostPercentage = orderRevenue > 0 ? (foodCost / orderRevenue) * 100 : 0;

    return {
        orders,
        totalOrders: orders.length,
        posSales,
        tax,
        discount,
        total,
        payments,
        paymentBreakdown,
        foodCost,
        orderRevenue,
        orderProfit,
        foodCostPercentage,
        topDishes,
        mostConsumedIngredient,
        highestCostDish: highestCostDish ? { name: highestCostDish.name, cost: highestCostDish.cost } : null,
        highestRevenueDish: highestRevenueDish ? { name: highestRevenueDish.name, revenue: highestRevenueDish.revenue } : null,
    };
}

function emptyPOS(orders: FoodOrder[] = []): POSData {
    return {
        orders,
        totalOrders: orders.length, // preserve real count even when COGS preload is skipped
        posSales: 0,
        tax: 0,
        discount: 0,
        total: 0,
        payments: 0,
        paymentBreakdown: {},
        foodCost: 0,
        orderRevenue: 0,
        orderProfit: 0,
        foodCostPercentage: 0,
        topDishes: [],
        mostConsumedIngredient: [],
        highestCostDish: null,
        highestRevenueDish: null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN NIGHT AUDIT ACTION
// ─────────────────────────────────────────────────────────────────────────────

export type NightAuditResult =
    | { id: string }
    | { error: 'future_date' | 'already_audited' | 'db_error' };

export async function performNightAudit(
    staffId: string,
    staffName: string,
    businessDateStr?: string
): Promise<NightAuditResult | null> {
    if (!db) return null;

    try {
        // Resolve business date — use provided date string or fall back to Firestore current
        let businessDate: Date;
        if (businessDateStr) {
            // Parse YYYY-MM-DD in local time (avoid UTC shift)
            const [year, month, day] = businessDateStr.split('-').map(Number);
            businessDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        } else {
            businessDate = await getCurrentBusinessDateServer();
        }

        // ── Validation: no future dates ───────────────────────────────────────
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        if (businessDate > todayMidnight) {
            return { error: 'future_date' };
        }

        // ── Validation: no duplicate audits for same date ─────────────────────
        const dateStr = toLocalDateStr(businessDate);
        const logsRef = collection(db, 'nightAuditLogs');
        const logsSnap = await getDocs(logsRef);
        const alreadyAudited = logsSnap.docs.some(d => {
            const data = d.data();
            const logDate: Date | undefined = data.date?.toDate?.();
            if (!logDate) return false;
            const logDateStr = toLocalDateStr(logDate);
            return logDateStr === dateStr && (data.status === 'completed' || data.status === 'completed_with_warnings');
        });
        if (alreadyAudited) {
            return { error: 'already_audited' };
        }

        // Date helpers
        const nextDate = new Date(businessDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = toLocalDateStr(nextDate);
        const currentDateStr = toLocalDateStr(businessDate);

        const startOfDay = new Date(businessDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(businessDate);
        endOfDay.setHours(23, 59, 59, 999);

        // ── 1. Create Audit Log ───────────────────────────────────────────────
        const auditLogRef = collection(db, 'nightAuditLogs');
        const newLogRef = doc(auditLogRef);

        const auditLogData: NightAuditLog = {
            id: newLogRef.id,
            date: businessDate,
            startedAt: new Date(),
            auditedBy: staffId,
            status: 'in_progress',
            steps: {
                roomChargesPosted: false,
                roomStatusUpdated: false,
                reportsGenerated: false,
                businessDateRolled: false,
            },
            summary: {
                totalRevenue: 0,
                totalOccupiedRooms: 0,
                totalArrivals: 0,
                totalDepartures: 0,
            },
            createdAt: new Date(),
        };
        await setDoc(newLogRef, auditLogData);

        // ── 2. Post Room Charges (BOOKING LOGIC — DO NOT TOUCH) ───────────────
        const bookingsRef = collection(db, 'bookings');
        const occupiedQuery = query(bookingsRef, where('status', '==', 'checked_in'));
        const occupiedSnap = await getDocs(occupiedQuery);

        let totalRevenue = 0;
        let occupiedCount = 0;
        const stayingOver: Booking[] = [];

        const chargePromises = occupiedSnap.docs.map(async (bDoc) => {
            const booking = bDoc.data() as Booking;
            occupiedCount++;
            stayingOver.push(booking);

            const dailyRate = booking.rooms.reduce((sum, r) => sum + (r.price || 0), 0);
            if (dailyRate > 0) {
                totalRevenue += dailyRate;
                await createLedgerEntry({
                    date: businessDate,
                    entryType: 'income',
                    category: 'room_booking',
                    description: `Night Audit: Room Charge for ${booking.guestDetails.lastName} (Room ${booking.rooms[0].allocatedRoomType || 'Unassigned'})`,
                    amount: dailyRate,
                    paymentMethod: 'online',
                    referenceId: booking.id,
                    notes: `Posted during audit ${newLogRef.id}`,
                    createdBy: 'Night Audit System',
                    accountsReceivable: true,
                });
            }
        });
        await Promise.all(chargePromises);

        // ── 3. Fetch Finance, F&B & Housekeeping data in parallel ────────────
        const foodOrdersQuery = query(
            collection(db, 'foodOrders'),
            where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
            where('createdAt', '<=', Timestamp.fromDate(endOfDay))
        );
        const barOrdersQuery = query(
            collection(db, 'barOrders'),
            where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
            where('createdAt', '<=', Timestamp.fromDate(endOfDay))
        );
        const arrivalsQuery = query(bookingsRef, where('checkIn', '==', nextDateStr), where('status', '==', 'confirmed'));
        const departuresQuery = query(bookingsRef, where('checkOut', '==', nextDateStr), where('status', '==', 'checked_in'));
        const checkedOutQuery = query(bookingsRef, where('checkOut', '==', currentDateStr), where('status', '==', 'checked_out'));
        const roomStatusesRef = collection(db, 'room_statuses');

        const [
            ledgerEntries,
            foodOrdersSnap,
            barOrdersSnap,
            arrivalsSnap,
            departuresSnap,
            checkedOutSnap,
            roomStatusesSnap,
        ] = await Promise.all([
            getLedgerEntries(startOfDay, endOfDay),
            getDocs(foodOrdersQuery),
            getDocs(barOrdersQuery),
            getDocs(arrivalsQuery),
            getDocs(departuresQuery),
            getDocs(checkedOutQuery),
            getDocs(query(roomStatusesRef)),
        ]);

        // Hydrate FoodOrder dates
        const mapOrder = (d: any): FoodOrder => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                scheduledDeliveryTime: data.scheduledDeliveryTime?.toDate(),
                actualDeliveryTime: data.actualDeliveryTime?.toDate(),
            } as FoodOrder;
        };

        const allOrders: FoodOrder[] = [
            ...foodOrdersSnap.docs.map(mapOrder),
            ...barOrdersSnap.docs.map(mapOrder),
        ];

        const arrivalsTomorrow = arrivalsSnap.docs.map(d => d.data() as Booking);
        const departuresTomorrow = departuresSnap.docs.map(d => d.data() as Booking);
        const checkedOutToday: Booking[] = checkedOutSnap.docs.map(d => d.data() as Booking);
        const roomStatuses = roomStatusesSnap.docs.map(d => d.data());

        // ── 4. Compute POS Data ───────────────────────────────────────────────
        const posData = await computePOSData(allOrders, startOfDay, endOfDay);

        // ── 5. Update Log — Booking summary ──────────────────────────────────
        await updateDoc(newLogRef, {
            'steps.roomChargesPosted': true,
            'summary.totalRevenue': totalRevenue,
            'summary.totalOccupiedRooms': occupiedCount,
            'summary.totalArrivals': arrivalsTomorrow.length,
            'summary.totalDepartures': departuresTomorrow.length,
            // POS summary fields
            'summary.orderRevenue': posData.orderRevenue,
            'summary.totalOrders': posData.totalOrders,
            'summary.foodCost': posData.foodCost,
            'summary.orderProfit': posData.orderProfit,
            'summary.foodCostPercentage': posData.foodCostPercentage,
            'summary.posSales': posData.posSales,
            'summary.posTax': posData.tax,
            'summary.posDiscount': posData.discount,
            'summary.posPayments': posData.payments,
        });

        // ── 6. Roll Business Date ─────────────────────────────────────────────
        const businessDayRef = doc(db, 'businessDays', BUSINESS_DAY_DOC_ID);
        await updateDoc(businessDayRef, {
            date: nextDate,
            lastAuditDate: businessDate,
            status: 'open',
            updatedAt: serverTimestamp(),
        });

        // ── 7. Generate & Email Report ────────────────────────────────────────
        try {
            const pdfBuffer = generateNightAuditPDF({
                businessDate,
                stayingOver,
                arrivalsTomorrow,
                departuresTomorrow,
                checkedOutToday,
                generatedBy: staffName,
                financeData: {
                    ledgerEntries,
                    totalRevenue,
                },
                posData,
                housekeepingData: {
                    rooms: roomStatuses as any,
                },
            });

            console.log(`[NightAudit] Sending report to portalholdingsznz@gmail.com for date: ${businessDate}`);
            await sendNightAuditReport(pdfBuffer, 'portalholdingsznz@gmail.com', businessDate);
            console.log(`[NightAudit] Report sent successfully.`);

            await updateDoc(newLogRef, { 'steps.reportsGenerated': true });
        } catch (reportError) {
            console.error('Error generating/sending report:', reportError);
            await updateDoc(newLogRef, {
                error: reportError instanceof Error ? reportError.message : 'Unknown report error',
            });
        }

        // ── 8. Finalize ───────────────────────────────────────────────────────
        const finalStatus = (await getDoc(newLogRef)).data()?.error
            ? 'completed_with_warnings'
            : 'completed';

        await updateDoc(newLogRef, {
            status: finalStatus,
            completedAt: serverTimestamp(),
            'steps.businessDateRolled': true,
            'steps.roomStatusUpdated': true,
        });

        return { id: newLogRef.id };

    } catch (error) {
        console.error('Night Audit Failed:', error);
        return { error: 'db_error' };
    }
}
