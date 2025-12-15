/* eslint-disable @typescript-eslint/no-explicit-any */
// Inventory Management CRUD Operations Extension
import {
    collection as firestoreCollection,
    doc as firestoreDoc,
    getDocs as firestoreGetDocs,
    getDoc as firestoreGetDoc,
    addDoc as firestoreAddDoc,
    updateDoc as firestoreUpdateDoc,
    query as firestoreQuery,
    orderBy as firestoreOrderBy,
    where as firestoreWhere,
    serverTimestamp as firestoreServerTimestamp
} from 'firebase/firestore';
import { db as firestoreDb } from './firebase';
import type {
    InventoryItem,
    InventoryTransaction,
    LowStockAlert,
    LedgerEntry,
    Expense,
    FinancialSummary
} from './firestoreService';

// ==================== Inventory Management CRUD Operations ====================

// Get all inventory items
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    if (!firestoreDb) return [];
    try {
        const inventoryRef = firestoreCollection(firestoreDb, 'inventory');
        const q = firestoreQuery(inventoryRef, firestoreWhere('isActive', '==', true), firestoreOrderBy('name', 'asc'));
        const querySnapshot = await firestoreGetDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                expiryDate: data.expiryDate?.toDate(),
                lastRestocked: data.lastRestocked?.toDate(),
            } as InventoryItem;
        });
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        return [];
    }
};

// Get single inventory item
export const getInventoryItem = async (id: string): Promise<InventoryItem | null> => {
    if (!firestoreDb) return null;
    try {
        const itemRef = firestoreDoc(firestoreDb, 'inventory', id);
        const itemSnap = await firestoreGetDoc(itemRef);
        if (itemSnap.exists()) {
            const data = itemSnap.data();
            return {
                id: itemSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                expiryDate: data.expiryDate?.toDate(),
                lastRestocked: data.lastRestocked?.toDate(),
            } as InventoryItem;
        }
        return null;
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        return null;
    }
};

// Create inventory item
export const createInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!firestoreDb) return null;
    try {
        const inventoryRef = firestoreCollection(firestoreDb, 'inventory');
        const docRef = await firestoreAddDoc(inventoryRef, {
            ...itemData,
            createdAt: firestoreServerTimestamp(),
            updatedAt: firestoreServerTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating inventory item:', error);
        return null;
    }
};

// Update inventory item
export const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>): Promise<boolean> => {
    if (!firestoreDb) return false;
    try {
        const itemRef = firestoreDoc(firestoreDb, 'inventory', id);
        await firestoreUpdateDoc(itemRef, {
            ...itemData,
            updatedAt: firestoreServerTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating inventory item:', error);
        return false;
    }
};

// Delete inventory item (soft delete)
export const deleteInventoryItem = async (id: string): Promise<boolean> => {
    if (!firestoreDb) return false;
    try {
        const itemRef = firestoreDoc(firestoreDb, 'inventory', id);
        await firestoreUpdateDoc(itemRef, {
            isActive: false,
            updatedAt: firestoreServerTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return false;
    }
};

// Record inventory transaction
export const recordInventoryTransaction = async (
    transactionData: Omit<InventoryTransaction, 'id' | 'createdAt'>
): Promise<string | null> => {
    if (!firestoreDb) return null;
    try {
        // Update inventory item stock
        const itemRef = firestoreDoc(firestoreDb, 'inventory', transactionData.inventoryItemId);
        const updateData: any = {
            currentStock: transactionData.newStock,
            updatedAt: firestoreServerTimestamp(),
        };
        if (transactionData.transactionType === 'purchase') {
            updateData.lastRestocked = firestoreServerTimestamp();
        }
        await firestoreUpdateDoc(itemRef, updateData);

        // Record transaction
        const transactionsRef = firestoreCollection(firestoreDb, 'inventoryTransactions');
        const docRef = await firestoreAddDoc(transactionsRef, {
            ...transactionData,
            createdAt: firestoreServerTimestamp(),
        });

        // Check if stock is below reorder point and create alert
        const item = await getInventoryItem(transactionData.inventoryItemId);
        if (item && item.currentStock <= item.reorderPoint) {
            await createLowStockAlert(item);
        }

        return docRef.id;
    } catch (error) {
        console.error('Error recording inventory transaction:', error);
        return null;
    }
};

// Get inventory transactions
export const getInventoryTransactions = async (
    itemId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<InventoryTransaction[]> => {
    if (!firestoreDb) return [];
    try {
        const transactionsRef = firestoreCollection(firestoreDb, 'inventoryTransactions');
        let q = firestoreQuery(transactionsRef, firestoreOrderBy('createdAt', 'desc'));

        if (itemId) {
            q = firestoreQuery(transactionsRef, firestoreWhere('inventoryItemId', '==', itemId), firestoreOrderBy('createdAt', 'desc'));
        }

        const querySnapshot = await firestoreGetDocs(q);
        let transactions = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
            } as InventoryTransaction;
        });

        // Filter by date range if provided
        if (startDate || endDate) {
            transactions = transactions.filter(t => {
                const transDate = t.createdAt;
                if (startDate && transDate < startDate) return false;
                if (endDate && transDate > endDate) return false;
                return true;
            });
        }

        return transactions;
    } catch (error) {
        console.error('Error fetching inventory transactions:', error);
        return [];
    }
};

// Create low stock alert
const createLowStockAlert = async (item: InventoryItem): Promise<void> => {
    if (!firestoreDb) return;
    try {
        // Check if alert already exists
        const alertsRef = firestoreCollection(firestoreDb, 'lowStockAlerts');
        const q = firestoreQuery(
            alertsRef,
            firestoreWhere('inventoryItemId', '==', item.id),
            firestoreWhere('status', '==', 'active')
        );
        const existing = await firestoreGetDocs(q);

        if (existing.empty) {
            await firestoreAddDoc(alertsRef, {
                inventoryItemId: item.id,
                itemName: item.name,
                currentStock: item.currentStock,
                minStockLevel: item.minStockLevel,
                status: 'active',
                createdAt: firestoreServerTimestamp(),
            });
        }
    } catch (error) {
        console.error('Error creating low stock alert:', error);
    }
};

// Get low stock alerts
export const getLowStockAlerts = async (): Promise<LowStockAlert[]> => {
    if (!firestoreDb) return [];
    try {
        const alertsRef = firestoreCollection(firestoreDb, 'lowStockAlerts');
        const q = firestoreQuery(alertsRef, firestoreWhere('status', '==', 'active'), firestoreOrderBy('createdAt', 'desc'));
        const querySnapshot = await firestoreGetDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                resolvedAt: data.resolvedAt?.toDate(),
            } as LowStockAlert;
        });
    } catch (error) {
        console.error('Error fetching low stock alerts:', error);
        return [];
    }
};

// Resolve low stock alert
export const resolveLowStockAlert = async (id: string): Promise<boolean> => {
    if (!firestoreDb) return false;
    try {
        const alertRef = firestoreDoc(firestoreDb, 'lowStockAlerts', id);
        await firestoreUpdateDoc(alertRef, {
            status: 'resolved',
            resolvedAt: firestoreServerTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error resolving low stock alert:', error);
        return false;
    }
};

// Get inventory value report
export const getInventoryValueReport = async (): Promise<{ totalValue: number; categoryBreakdown: Record<string, number> }> => {
    if (!firestoreDb) return { totalValue: 0, categoryBreakdown: {} };
    try {
        const items = await getInventoryItems();
        let totalValue = 0;
        const categoryBreakdown: Record<string, number> = {};

        items.forEach(item => {
            const itemValue = item.currentStock * item.unitCost;
            totalValue += itemValue;
            categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + itemValue;
        });

        return { totalValue, categoryBreakdown };
    } catch (error) {
        console.error('Error generating inventory value report:', error);
        return { totalValue: 0, categoryBreakdown: {} };
    }
};

// Get inventory usage report
export const getInventoryUsageReport = async (
    startDate: Date,
    endDate: Date
): Promise<{ itemName: string; totalUsage: number; totalCost: number }[]> => {
    if (!firestoreDb) return [];
    try {
        const transactions = await getInventoryTransactions(undefined, startDate, endDate);
        const usageMap: Record<string, { totalUsage: number; totalCost: number }> = {};

        transactions
            .filter(t => t.transactionType === 'usage')
            .forEach(t => {
                if (!usageMap[t.itemName]) {
                    usageMap[t.itemName] = { totalUsage: 0, totalCost: 0 };
                }
                usageMap[t.itemName].totalUsage += t.quantity;
                usageMap[t.itemName].totalCost += t.totalCost;
            });

        return Object.entries(usageMap).map(([itemName, data]) => ({
            itemName,
            ...data,
        }));
    } catch (error) {
        console.error('Error generating inventory usage report:', error);
        return [];
    }
};
