import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    runTransaction,
    Timestamp,
    limit,
    deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type {
    Supplier,
    PurchaseOrder,
    InventoryItem,
    InventoryTransaction,
    Recipe,
    FoodOrder,
    LowStockAlert,
    InventoryCategory,
    Department,
    InventoryLocation
} from './firestoreService';

// ==================== CATEGORIES ====================

export const getInventoryCategories = async (): Promise<InventoryCategory[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'inventoryCategories'), orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryCategory));
    } catch (e) {
        console.error("Error fetching categories:", e);
        return [];
    }
};

export const createInventoryCategory = async (name: string, label: string): Promise<string> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, 'inventoryCategories'), {
        name,
        label,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const deleteInventoryCategory = async (id: string): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'inventoryCategories', id));
};

// ==================== DEPARTMENTS ====================

export const getInventoryDepartments = async (): Promise<Department[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'inventoryDepartments'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Department));
    } catch (e) {
        console.error("Error fetching departments:", e);
        return [];
    }
};

export const createInventoryDepartment = async (name: string): Promise<string> => {
    if (!db) throw new Error("Firestore not initialized");
    const slug = name.toLowerCase().replace(/\s+/g, '_');
    const docRef = await addDoc(collection(db, 'inventoryDepartments'), {
        name,
        slug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};

export const deleteInventoryDepartment = async (id: string): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'inventoryDepartments', id));
};

export const seedDefaultDepartments = async (): Promise<void> => {
    const defaults = ["Kitchen", "Bar", "Housekeeping", "Front Office", "Maintenance", "Spa", "Other"];
    const existing = await getInventoryDepartments();
    const existingNames = new Set(existing.map(d => d.name));

    const toCreate = defaults.filter(d => !existingNames.has(d));

    if (toCreate.length === 0) return;

    await Promise.all(toCreate.map(name => createInventoryDepartment(name)));
    await Promise.all(toCreate.map(name => createInventoryDepartment(name)));
};

// ==================== LOCATIONS ====================

export const getInventoryLocations = async (): Promise<InventoryLocation[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'inventoryLocations'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryLocation));
    } catch (e) {
        console.error("Error fetching locations:", e);
        return [];
    }
};

export const createInventoryLocation = async (data: Omit<InventoryLocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, 'inventoryLocations'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateInventoryLocation = async (id: string, data: Partial<InventoryLocation>): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, 'inventoryLocations', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteInventoryLocation = async (id: string): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'inventoryLocations', id));
};

export const seedDefaultLocations = async (): Promise<void> => {
    const defaults = [
        { name: "Main Store", type: "store" },
        { name: "Main Kitchen", type: "kitchen" },
        { name: "Beach Bar", type: "outlet" },
        { name: "Pool Bar", type: "outlet" },
        { name: "Housekeeping Store", type: "store" }
    ];
    const existing = await getInventoryLocations();
    if (existing.length > 0) return;

    await Promise.all(defaults.map(loc => createInventoryLocation({
        name: loc.name,
        type: loc.type as any,
        isActive: true,
        description: "Default location"
    })));
};

// ==================== SUPPLIERS ====================

export const getSuppliers = async (): Promise<Supplier[]> => {
    if (!db) return [];
    const q = query(collection(db, 'suppliers'), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
};

export const createSupplier = async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, 'suppliers'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateSupplier = async (id: string, data: Partial<Supplier>): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, 'suppliers', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteSupplier = async (id: string): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'suppliers', id));
};

// ==================== PURCHASE ORDERS ====================

export const createPurchaseOrder = async (poData: Partial<PurchaseOrder>): Promise<string> => {
    if (!db) throw new Error("Firestore not initialized");

    // Generate simple PO Number (improve in production with counters)
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

    const docRef = await addDoc(collection(db, 'purchaseOrders'), {
        ...poData,
        poNumber,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};

export const getAllPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'purchaseOrders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
            updatedAt: d.data().updatedAt?.toDate() || new Date(),
            // Map items if needed, but for count simple mapping is enough
        } as PurchaseOrder));
    } catch (e) {
        console.error("Error fetching pending POs:", e);
        return [];
    }
};

export const updatePurchaseOrder = async (id: string, data: Partial<PurchaseOrder>): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, 'purchaseOrders', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'purchaseOrders', id));
};

export const receivePurchaseOrder = async (poId: string, receivedItems: { itemId: string, quantity: number }[], receivedBy: string) => {
    if (!db) throw new Error("Firestore not initialized");
    const firestore = db;

    await runTransaction(firestore, async (transaction) => {
        const poRef = doc(firestore, 'purchaseOrders', poId);
        const poSnap = await transaction.get(poRef);
        if (!poSnap.exists()) throw new Error("PO not found");

        const po = poSnap.data() as PurchaseOrder;

        // Idempotency Check: Don't process if already received
        if (po.status === 'received') {
            console.warn(`PO ${po.poNumber} already received. Skipping.`);
            return;
        }

        // Update Inventory and Create Transactions
        for (const item of receivedItems) {
            const itemRef = doc(firestore, 'inventory', item.itemId);
            const itemSnap = await transaction.get(itemRef);
            if (!itemSnap.exists()) continue;

            const invItem = itemSnap.data() as InventoryItem;
            const newStock = (invItem.currentStock || 0) + item.quantity;

            // Update Inventory
            transaction.update(itemRef, {
                currentStock: newStock,
                lastRestocked: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Create Transaction Record
            const transRef = doc(collection(firestore, 'inventoryTransactions'));
            transaction.set(transRef, {
                inventoryItemId: item.itemId,
                itemName: invItem.name,
                transactionType: 'purchase',
                quantity: item.quantity,
                unitCost: invItem.unitCost || 0, // Should come from PO ideally
                totalCost: (invItem.unitCost || 0) * item.quantity,
                previousStock: invItem.currentStock || 0,
                newStock: newStock,
                reason: `Received PO ${po.poNumber}`,
                referenceId: poId,
                performedBy: receivedBy,
                createdAt: serverTimestamp()
            });
        }

        // Update PO Status
        transaction.update(poRef, {
            status: 'received',
            updatedAt: serverTimestamp()
        });
    });
};

// ==================== RECIPES & COSTING ====================

export const createRecipe = async (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, 'recipes'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};

export const getRecipeByMenuItem = async (menuItemId: string): Promise<Recipe | null> => {
    if (!db) return null;
    const q = query(collection(db, 'recipes'), where('menuItemId', '==', menuItemId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Recipe;
};

// ==================== STOCK DEDUCTION (THE MAGIC) ====================

// Call this when a Food Order is "Confirmed" or "Completed"
export const processOrderInventoryDeduction = async (orderId: string, performedBy: string) => {
    if (!db) throw new Error("Firestore not initialized");
    const firestore = db;

    const orderRef = doc(firestore, 'foodOrders', orderId);

    await runTransaction(firestore, async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error("Order not found");
        const order = orderSnap.data() as FoodOrder & { inventoryDeducted?: boolean };

        // 1. Idempotency Check
        if (order.inventoryDeducted) {
            console.warn(`Inventory already deducted for Order ${orderId}`);
            return; // Exit if already deducted
        }

        let hasDeductions = false;

        for (const item of order.items) {
            // Find Recipe
            const recipesQuery = query(collection(firestore, 'recipes'), where('menuItemId', '==', item.menuItemId), limit(1));
            const recipeSnap = await getDocs(recipesQuery);

            if (!recipeSnap.empty) {
                const recipe = recipeSnap.docs[0].data() as Recipe;
                hasDeductions = true;

                // Deduct Ingredients
                for (const ingredient of recipe.ingredients) {
                    const invRef = doc(firestore, 'inventory', ingredient.inventoryItemId);
                    const invSnap = await transaction.get(invRef);
                    if (invSnap.exists()) {
                        const currentInv = invSnap.data() as InventoryItem;
                        const deductionAmount = ingredient.quantity * item.quantity;
                        const newStock = (currentInv.currentStock || 0) - deductionAmount;

                        transaction.update(invRef, {
                            currentStock: newStock,
                            updatedAt: serverTimestamp()
                        });

                        // Create Transaction Record
                        const transRef = doc(collection(firestore, 'inventoryTransactions'));
                        transaction.set(transRef, {
                            inventoryItemId: ingredient.inventoryItemId,
                            itemName: currentInv.name,
                            transactionType: 'sales_deduction',
                            quantity: -deductionAmount,
                            unitCost: currentInv.unitCost || 0,
                            totalCost: (currentInv.unitCost || 0) * deductionAmount,
                            previousStock: currentInv.currentStock,
                            newStock: newStock,
                            reason: `Order ${order.orderNumber} - ${item.name}`,
                            referenceId: orderId,
                            performedBy: performedBy,
                            createdAt: serverTimestamp()
                        });
                    }
                }
            }
        }

        // 2. Mark as Deducted
        transaction.update(orderRef, {
            inventoryDeducted: true,
            updatedAt: serverTimestamp()
        });
    });
};

// ==================== BASIC INVENTORY CRUD ====================

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'inventory'), orderBy('name'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const createInventoryItem = async (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, 'inventory'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, 'inventory', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'inventory', id));
};

// ==================== STOCK ADJUSTMENTS ====================

export const createStockAdjustment = async (
    itemId: string,
    quantity: number, // positive (add) or negative (deduct)
    type: 'adjustment' | 'waste' | 'usage' | 'transfer_in' | 'transfer_out',
    reason: string,
    performedBy: string
): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const firestore = db;

    await runTransaction(firestore, async (transaction) => {
        const itemRef = doc(firestore, 'inventory', itemId);
        const itemSnap = await transaction.get(itemRef);
        if (!itemSnap.exists()) throw new Error("Item not found");

        const item = itemSnap.data() as InventoryItem;
        const currentStock = item.currentStock || 0;
        const newStock = currentStock + quantity;

        if (newStock < 0) throw new Error("Insufficient stock");

        // Update Inventory
        transaction.update(itemRef, {
            currentStock: newStock,
            updatedAt: serverTimestamp()
        });

        // Create Transaction Record
        const transRef = doc(collection(firestore, 'inventoryTransactions'));
        transaction.set(transRef, {
            inventoryItemId: itemId,
            itemName: item.name,
            transactionType: type,
            quantity: quantity,
            unitCost: item.unitCost || 0,
            totalCost: (item.unitCost || 0) * Math.abs(quantity),
            previousStock: currentStock,
            newStock: newStock,
            reason: reason,
            performedBy: performedBy,
            createdAt: serverTimestamp()
        });
    });
};

export const getInventoryTransactions = async (): Promise<InventoryTransaction[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'inventoryTransactions'), orderBy('createdAt', 'desc'), limit(100));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date()
        } as InventoryTransaction));
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const getLowStockAlerts = async (): Promise<LowStockAlert[]> => {
    const items = await getInventoryItems();
    return items
        .filter(i => (i.currentStock || 0) <= (i.minStockLevel || 0))
        .map(i => ({
            id: `alert-${i.id}`, // Generate a unique ID for the alert
            inventoryItemId: i.id,
            itemName: i.name,
            currentStock: i.currentStock || 0,
            minStockLevel: i.minStockLevel || 0,
            status: 'active',
            createdAt: new Date()
        }));
};
