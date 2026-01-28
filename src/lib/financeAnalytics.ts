import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { Booking, LedgerEntry, PurchaseOrder, InventoryItem } from './firestoreService';

// --- Types ---

export interface ProfitLossStatement {
    revenue: {
        roomRevenue: number;
        serviceRevenue: number; // Food, etc.
        totalRevenue: number;
    };
    cogs: {
        inventoryOrFoodCost: number;
        totalCOGS: number;
    };
    grossProfit: number;
    expenses: {
        operating: number; // Salaries, Utilities
        marketing: number;
        administrative: number;
        maintenance: number;
        other: number;
        totalExpenses: number;
    };
    netIncome: number;
    marginPercent: number;
}

export interface BalanceSheet {
    assets: {
        cashAndEquivalents: number; // Calculated from Ledger 'income' that is paid
        accountsReceivable: number; // Unpaid Bookings
        inventoryValue: number; // Current Stock Value
        totalAssets: number;
    };
    liabilities: {
        accountsPayable: number; // Unpaid Purchase Orders
        salesTaxPayable: number; // Simple placeholder
        totalLiabilities: number;
    };
    equity: {
        retainedEarnings: number; // Assets - Liabilities
        totalEquity: number;
    };
}

// --- Helpers ---

const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getEndOfMonth = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
};

// --- Core Functions ---

/**
 * Calculates Profit & Loss for a specific date range.
 * Revenue = Bookings (Paid & Completed ideally, but simplified to 'checked_out' or 'confirmed' for accrual)
 * Expenses = Ledger Entries (type='expense')
 */
export const getProfitLossStatement = async (startDate: Date, endDate: Date): Promise<ProfitLossStatement> => {
    if (!db) throw new Error("Firestore is not initialized");
    try {
        const startTs = Timestamp.fromDate(startDate);
        const endTs = Timestamp.fromDate(endDate);

        // 1. Fetch Revenue (Bookings)
        // In a real accrual system, we'd split booking value across days. 
        // For simplicity: We take the full booking value if detailed check-out is within range.
        // 1. Fetch Revenue (Bookings)
        // In a real accrual system, we'd split booking value across days. 
        // For simplicity: We take the full booking value if detailed check-out is within range.
        const bookingsRef = collection(db!, 'bookings');

        // Optimized: Query by date only, filter status in memory to avoid composite index
        // Using 'checkOut' (string YYYY-MM-DD) as per other services
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const bookingsQ = query(
            bookingsRef,
            where('checkOut', '>=', startStr),
            where('checkOut', '<=', endStr)
        );
        const bookingDocs = await getDocs(bookingsQ);

        let roomRevenue = 0;
        let serviceRevenue = 0;

        bookingDocs.forEach(doc => {
            const b = doc.data() as Booking;
            // Filter in memory
            if (['checked_out', 'confirmed'].includes(b.status)) {
                roomRevenue += b.totalAmount || 0;
            }
        });

        // 2. Fetch Expenses (Ledger)
        // UPDATED: Corrected collection name to 'accountsLedger' (was 'ledger')
        const ledgerRef = collection(db!, 'accountsLedger');

        // Optimized: Query by date range only, filter entryType in memory
        const ledgerQ = query(
            ledgerRef,
            where('date', '>=', startTs),
            where('date', '<=', endTs)
            // Removed: where('entryType', '==', 'expense') to avoid composite index
        );
        const ledgerDocs = await getDocs(ledgerQ);

        let operating = 0;
        let marketing = 0;
        let administrative = 0;
        let maintenance = 0;
        let other = 0;
        let foodCost = 0;

        ledgerDocs.forEach(doc => {
            const entry = doc.data() as LedgerEntry;

            // Filter: Must be expense
            if (entry.entryType !== 'expense') return;

            const amt = entry.amount || 0;
            switch (entry.category) {
                case 'salary':
                case 'utilities':
                    operating += amt;
                    break;
                case 'marketing':
                    marketing += amt;
                    break;
                case 'maintenance':
                case 'supplies':
                    maintenance += amt;
                    break;
                case 'Food':
                case 'Beverage':
                case 'food_beverage':
                    foodCost += amt;
                    break;
                default:
                    if (['admin', 'office'].includes(entry.category as any)) administrative += amt;
                    else other += amt;
            }
        });

        const totalRevenue = roomRevenue + serviceRevenue;
        const totalCOGS = foodCost; // Cost of Goods Sold (simplified to F&B costs)
        const grossProfit = totalRevenue - totalCOGS;
        const totalExpenses = operating + marketing + administrative + maintenance + other;
        const netIncome = grossProfit - totalExpenses;
        const marginPercent = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

        return {
            revenue: { roomRevenue, serviceRevenue, totalRevenue },
            cogs: { inventoryOrFoodCost: foodCost, totalCOGS },
            grossProfit,
            expenses: { operating, marketing, administrative, maintenance, other, totalExpenses },
            netIncome,
            marginPercent
        };

    } catch (error) {
        console.error("Error calculating P&L:", error);
        throw error;
    }
};

/**
 * Calculates Balance Sheet (Snapshot as of NOW).
 * Assets = Cash + AR + Stock
 * Liabilities = AP
 */
export const getBalanceSheet = async (): Promise<BalanceSheet> => {
    if (!db) throw new Error("Firestore is not initialized");
    try {
        // --- ASSETS ---

        // 1. Cash Position (Simplified: Sum of all Income - Sum of all Expenses in Ledger)
        // NOTE: This is a heavy query if ledger grows large. In production, we'd use an aggregated 'running_balance' doc.
        // For now, we fetch 'cleared' transactions.
        // UPDATED: Corrected collection name to 'accountsLedger'
        const ledgerRef = collection(db!, 'accountsLedger');
        const allLedgerDocs = await getDocs(query(ledgerRef, where('status', '==', 'cleared')));

        let cashAndEquivalents = 0;
        allLedgerDocs.forEach(doc => {
            const entry = doc.data() as LedgerEntry;
            if (entry.entryType === 'income') cashAndEquivalents += entry.amount;
            else if (entry.entryType === 'expense') cashAndEquivalents -= entry.amount;
        });

        // 2. Accounts Receivable (AR) = Unpaid "Checked Out" Bookings or "Pending" Invoices
        const bookingsRef = collection(db!, 'bookings');
        // Optimized: Filter paymentStatus only, check status in memory
        const arQ = query(bookingsRef, where('paymentStatus', '==', 'pending'));
        const arDocs = await getDocs(arQ);

        const accountsReceivable = arDocs.docs.reduce((sum, doc) => {
            const b = doc.data() as Booking;
            if (b.status !== 'cancelled') {
                return sum + (b.totalAmount || 0);
            }
            return sum;
        }, 0);

        // 3. Inventory Value = Sum of (Quantity * Unit Cost) for all items
        const invRef = collection(db!, 'inventory_items');
        const invDocs = await getDocs(invRef);
        const inventoryValue = invDocs.docs.reduce((sum, doc) => {
            const item = doc.data() as InventoryItem;
            return sum + (item.currentStock * item.unitCost);
        }, 0);

        const totalAssets = cashAndEquivalents + accountsReceivable + inventoryValue;

        // --- LIABILITIES ---

        // 1. Accounts Payable (AP) = Unpaid Purchase Orders
        const poRef = collection(db!, 'purchase_orders');
        // Optimized: 'status' IN query is fine unless we sort differently.
        const apQ = query(poRef, where('status', 'in', ['ordered', 'received']));
        // Assuming 'ordered/received' implies we owe money if paymentStatus is missing or pending.
        // We'll filter manually for payment status if field exists, else assume unpaid.

        const poDocs = await getDocs(apQ);
        let accountsPayable = 0;
        poDocs.forEach(doc => {
            const po = doc.data() as PurchaseOrder;
            // Check if we have a payment status field (e.g. paidDate or similar).
            // Using logic: if no 'paidDate' and no 'paymentMethod', it's payable.
            if (!po.paidDate && !po.paymentMethod) {
                accountsPayable += po.totalAmount;
            }
        });

        const salesTaxPayable = 0; // Placeholder
        const totalLiabilities = accountsPayable + salesTaxPayable;

        // --- EQUITY ---
        const retainedEarnings = totalAssets - totalLiabilities;

        return {
            assets: { cashAndEquivalents, accountsReceivable, inventoryValue, totalAssets },
            liabilities: { accountsPayable, salesTaxPayable, totalLiabilities },
            equity: { retainedEarnings, totalEquity: retainedEarnings }
        };

    } catch (error) {
        console.error("Error calculating Balance Sheet:", error);
        throw error;
    }
};
