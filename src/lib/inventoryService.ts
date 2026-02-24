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
    deleteDoc,
    setDoc
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

export type {
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
};

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

// Cleanup function to remove duplicates - RUN ONCE
export const cleanupDuplicates = async () => {
    if (!db) return;
    const firestore = db;

    // 1. Cleanup Locations
    const locs = await getInventoryLocations();
    const locMap = new Map<string, InventoryLocation[]>();
    locs.forEach(l => {
        const key = l.name.toLowerCase().trim();
        if (!locMap.has(key)) locMap.set(key, []);
        locMap.get(key)?.push(l);
    });

    for (const [name, duplicates] of locMap.entries()) {
        if (duplicates.length > 1) {
            console.log(`Cleaning up duplicate locations for: ${name}`);
            // Keep the one with a "loc_" ID if exists, otherwise the first one
            // Sort: prioritize "loc_" id, then oldest created
            duplicates.sort((a, b) => {
                const aHasId = a.id.startsWith('loc_');
                const bHasId = b.id.startsWith('loc_');
                if (aHasId && !bHasId) return -1;
                if (!aHasId && bHasId) return 1;
                // If both or neither have ID, keep oldest (if timestamp exists)
                return 0;
            });

            // Keep index 0, delete the rest
            const toDelete = duplicates.slice(1);
            for (const item of toDelete) {
                console.log(`Deleting duplicate location: ${item.name} (${item.id})`);
                await deleteDoc(doc(firestore, 'inventoryLocations', item.id));
            }
        }
    }

    // 2. Cleanup Departments
    const depts = await getInventoryDepartments();
    const deptMap = new Map<string, Department[]>();
    depts.forEach(d => {
        const key = d.name.toLowerCase().trim();
        if (!deptMap.has(key)) deptMap.set(key, []);
        deptMap.get(key)?.push(d);
    });

    for (const [name, duplicates] of deptMap.entries()) {
        if (duplicates.length > 1) {
            console.log(`Cleaning up duplicate departments for: ${name}`);
            const toDelete = duplicates.slice(1);
            for (const item of toDelete) {
                console.log(`Deleting duplicate department: ${item.name} (${item.id})`);
                await deleteDoc(doc(firestore, 'inventoryDepartments', item.id));
            }
        }
    }
};

export const seedDefaultLocations = async (): Promise<void> => {
    const defaults = [
        { id: "loc_main_store", name: "Main Store", type: "store" },
        { id: "loc_main_kitchen", name: "Main Kitchen", type: "kitchen" },
        { id: "loc_beach_bar", name: "Beach Bar", type: "outlet" },
        { id: "loc_pool_bar", name: "Pool Bar", type: "outlet" },
        { id: "loc_housekeeping", name: "Housekeeping Store", type: "store" }
    ];

    if (!db) return;
    const firestore = db;

    await Promise.all(defaults.map(async (loc) => {
        const docRef = doc(firestore, 'inventoryLocations', loc.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            await setDoc(docRef, {
                name: loc.name,
                type: loc.type as any,
                isActive: true,
                description: "Default location",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    }));
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


export const receivePurchaseOrder = async (
    poId: string,
    data: {
        invoiceUrl?: string;
        targetLocationId?: string; // New: Where the stock is going
        items: Array<{
            itemId: string;
            orderedQty: number;
            receivedQty: number; // Good stock
            rejectedQty: number; // Bad stock
            actualUnitCost?: number; // New price
            expiryDate?: string;
        }>;
        creditNoteRequested?: boolean;
        notes?: string;
    },
    receivedBy: string
) => {
    if (!db) throw new Error("Firestore not initialized");
    const firestore = db;

    await runTransaction(firestore, async (transaction) => {
        const poRef = doc(firestore, 'purchaseOrders', poId);
        const poSnap = await transaction.get(poRef);
        if (!poSnap.exists()) throw new Error("PO not found");

        const po = poSnap.data() as PurchaseOrder;

        if (po.status === 'received') {
            console.warn(`PO ${po.poNumber} already received. Skipping.`);
            return;
        }

        let totalReceivedValue = 0;
        let totalRejectedValue = 0;

        // Process Items
        for (const receivedItem of data.items) {
            const itemRef = doc(firestore, 'inventory', receivedItem.itemId);
            const itemSnap = await transaction.get(itemRef);

            // Calculate Values
            // Use the NEW cost if provided, otherwise the PO cost, otherwise 0
            const unitCost = receivedItem.actualUnitCost ?? (po.items.find(i => i.itemId === receivedItem.itemId)?.unitCost || 0);

            totalReceivedValue += (receivedItem.receivedQty * unitCost);
            totalRejectedValue += (receivedItem.rejectedQty * unitCost);

            if (itemSnap.exists()) {
                const invItem = itemSnap.data() as InventoryItem;
                const newStock = (invItem.currentStock || 0) + receivedItem.receivedQty;

                // Update Stock By Location
                // Default to 'main_store' key if no target provided (though UI should provide it)
                // We also need to ensuring the key exists or find the 'Main Store' ID dynamically?
                // For simplicity, we trust the ID or fallback to 'main_store' string if system uses that convention.
                // Based on `seedDefaultLocations`, one has name "Main Store" and type "store".
                // Ideally we use that ID. But let's rely on valid input.
                const targetLoc = data.targetLocationId || 'main_store';

                const currentLocStock = (invItem.stockByLocation && invItem.stockByLocation[targetLoc]) || 0;
                const newLocStock = currentLocStock + receivedItem.receivedQty;

                const updatedStockByLocation = { ...(invItem.stockByLocation || {}) };
                if (receivedItem.receivedQty > 0) {
                    updatedStockByLocation[targetLoc] = newLocStock;
                }

                // Update Inventory Item
                const updateData: any = {
                    currentStock: newStock,
                    stockByLocation: updatedStockByLocation,
                    lastRestocked: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                // Update Price if changed
                if (receivedItem.actualUnitCost !== undefined && receivedItem.actualUnitCost !== invItem.unitCost) {
                    updateData.unitCost = receivedItem.actualUnitCost;
                    updateData.totalValue = newStock * receivedItem.actualUnitCost; // Recalculate total value
                } else {
                    updateData.totalValue = newStock * (invItem.unitCost || 0);
                }

                if (receivedItem.expiryDate) {
                    updateData.expiryDate = new Date(receivedItem.expiryDate);
                }

                transaction.update(itemRef, updateData);

                // Create "Purchase" Transaction (Good Stock)
                if (receivedItem.receivedQty > 0) {
                    const transRef = doc(collection(firestore, 'inventoryTransactions'));
                    transaction.set(transRef, {
                        inventoryItemId: receivedItem.itemId,
                        itemName: invItem.name,
                        transactionType: 'purchase',
                        quantity: receivedItem.receivedQty,
                        unitCost: unitCost,
                        totalCost: receivedItem.receivedQty * unitCost,
                        previousStock: invItem.currentStock || 0,
                        newStock: newStock,
                        locationId: targetLoc, // Log the location
                        reason: `Received PO ${po.poNumber}`,
                        referenceId: poId,
                        performedBy: receivedBy,
                        createdAt: serverTimestamp()
                    });
                }

                // Create "Rejection/Loss" Transaction Log (Optional, but good for tracking)
                if (receivedItem.rejectedQty > 0) {
                    // We don't add stock then remove it, we just log the event.
                    // Or maybe we don't need a transaction if it never touched stock?
                    // Let's log it as 'waste' but with 0 quantity change just for record? 
                    // No, better to stick to the PO record for Rejections. 
                    // Inventory Transactions are strictly for stock movement.
                }
            }
        }

        const missingQtyTotal = data.items.reduce((acc, i) => acc + (i.orderedQty - i.receivedQty - i.rejectedQty), 0);

        // Final Financials
        const finalPayableAmount = totalReceivedValue; // We pay for what we accepted. 
        // NOTE: In some cases you pay for all and claim credit. 
        // But for this simple system, "Payable" = "Accepted Value".

        // Update PO
        transaction.update(poRef, {
            status: 'received',
            invoiceUrl: data.invoiceUrl || null,
            targetLocationId: data.targetLocationId || null, // Save where it went
            receivedDetails: {
                receivedAt: new Date(),
                receivedBy,
                items: data.items.map(i => ({
                    itemId: i.itemId,
                    orderedQty: i.orderedQty,
                    receivedQty: i.receivedQty,
                    rejectedQty: i.rejectedQty,
                    actualUnitCost: i.actualUnitCost ?? null, // Ensure not undefined
                    expiryDate: i.expiryDate ?? null, // Ensure not undefined
                    missingQty: i.orderedQty - i.receivedQty - i.rejectedQty
                })),
                totalReceivedValue,
                totalRejectedValue,
                finalPayableAmount,
                creditNoteRequested: data.creditNoteRequested || false,
                notes: data.notes || ''
            },
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
export const processOrderInventoryDeduction = async (orderId: string, performedBy: string, menuType: "food" | "bar" = "food") => {
    if (!db) throw new Error("Firestore not initialized");
    const firestore = db;

    const collectionName = menuType === "bar" ? "barOrders" : "foodOrders";
    const orderRef = doc(firestore, collectionName, orderId);

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

                        // Determine DEDUCTION LOCATION based on Menu Item Station
                        // Default to 'kitchen' or 'bar' based on item category or station
                        // This is a simple heuristic mapping
                        let targetLocation = 'main_store'; // Fallback
                        const station = item.station || 'kitchen'; // You might need to fetch item station if not in order

                        if (station === 'bar' || item.category === 'beverages' || item.category === 'liquors') {
                            targetLocation = 'bar';
                        } else {
                            targetLocation = 'kitchen';
                        }

                        // Check stock in specific location
                        const currentLocationStock = (currentInv.stockByLocation && currentInv.stockByLocation[targetLocation])
                            ? currentInv.stockByLocation[targetLocation]
                            : 0;

                        const deductionAmount = ingredient.quantity * item.quantity;

                        // Calculate New Location Stock
                        const newLocationStock = currentLocationStock - deductionAmount;

                        // Update stockByLocation map
                        const updatedStockByLocation = { ...(currentInv.stockByLocation || {}) };
                        updatedStockByLocation[targetLocation] = newLocationStock;

                        // Also update global count for backward compatibility / total asset value
                        const newGlobalStock = (currentInv.currentStock || 0) - deductionAmount;

                        transaction.update(invRef, {
                            currentStock: newGlobalStock,
                            stockByLocation: updatedStockByLocation,
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
                            previousStock: currentLocationStock, // Log location stock
                            newStock: newLocationStock,
                            locationId: targetLocation, // Track location
                            reason: `Order ${order.orderNumber} - ${item.name} (${targetLocation})`,
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

    // 3. Check Auto-Reorder (Side Effect - run after transaction)
    try {
        // We need to check stock for all items involved.
        // Re-fetching order logic is expensive, so maybe we optimize later.
        // For now, let's just do it.
        const orderSnap = await getDoc(orderRef); // Re-fetch to be sure? No, just use cached data from logic if possible?
        // Actually, we can't easily pass state out of runTransaction. 
        // We will just query the order items again or pass them.
        // To be safe and simple:
        // We know which items were in the order.
        const freshOrderSnap = await getDoc(orderRef);
        if (freshOrderSnap.exists()) {
            const orderData = freshOrderSnap.data() as FoodOrder;
            // We need to resolve recipes again to know which inventory items were touched.
            // This is double work but safe. 
            for (const item of orderData.items) {
                const recipesQuery = query(collection(db, 'recipes'), where('menuItemId', '==', item.menuItemId), limit(1));
                const recipeSnap = await getDocs(recipesQuery);
                if (!recipeSnap.empty) {
                    const recipe = recipeSnap.docs[0].data() as Recipe;
                    for (const ingredient of recipe.ingredients) {
                        // Check this item
                        const invRef = doc(db, 'inventory', ingredient.inventoryItemId);
                        const invSnap = await getDoc(invRef);
                        if (invSnap.exists()) {
                            await checkAndCreateAutoReorder(ingredient.inventoryItemId, invSnap.data().currentStock);
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("Auto-reorder check failed", e);
    }
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
        stockByLocation: {}, // Initialize empty map
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, 'inventory', id);

    // Firestore rejects `undefined` field values — strip them before writing.
    const sanitized = Object.fromEntries(
        Object.entries({ ...data, updatedAt: serverTimestamp() })
            .filter(([, v]) => v !== undefined)
    );

    await updateDoc(docRef, sanitized);

    // Check for auto-reorder if stock changed
    if (data.currentStock !== undefined) {
        checkAndCreateAutoReorder(id, data.currentStock).catch(err =>
            console.error("Auto-reorder check failed", err)
        );
    }
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
    performedBy: string,
    locationId?: string // New: Specific location
): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const firestore = db;

    await runTransaction(firestore, async (transaction) => {
        const itemRef = doc(firestore, 'inventory', itemId);
        const itemSnap = await transaction.get(itemRef);
        if (!itemSnap.exists()) throw new Error("Item not found");

        const item = itemSnap.data() as InventoryItem;
        const currentStock = item.currentStock || 0;

        // Handle Location Logic
        let updatedStockByLocation = { ...(item.stockByLocation || {}) };

        // If location is provided, we must check/update that specific location
        if (locationId) {
            const currentLocStock = updatedStockByLocation[locationId] || 0;
            const newLocStock = currentLocStock + quantity;

            if (newLocStock < 0) {
                // Block if specific location goes negative
                throw new Error(`Insufficient stock in selected location. Available: ${currentLocStock}`);
            }
            updatedStockByLocation[locationId] = newLocStock;
        }

        const newStock = currentStock + quantity;

        if (newStock < 0) throw new Error("Insufficient global stock");

        // Update Inventory
        transaction.update(itemRef, {
            currentStock: newStock,
            stockByLocation: updatedStockByLocation,
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
            locationId: locationId || null, // Ensure no undefined
            reason: reason,
            performedBy: performedBy,
            createdAt: serverTimestamp()
        });
    });

    // Check for auto-reorder after adjustment (if stock went down)
    if (quantity < 0) {
        // We need to know the NEW stock.
        // We can fetch it.
        const itemSnap = await getDoc(doc(db, 'inventory', itemId));
        if (itemSnap.exists()) {
            await checkAndCreateAutoReorder(itemId, itemSnap.data().currentStock);
        }
    }
};

// ==================== TRANSFER STOCK ====================

export const transferStock = async (
    itemId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
    performedBy: string,
    notes?: string
): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const firestore = db;

    await runTransaction(firestore, async (transaction) => {
        const itemRef = doc(firestore, 'inventory', itemId);
        const itemSnap = await transaction.get(itemRef);

        if (!itemSnap.exists()) throw new Error("Item not found");
        const item = itemSnap.data() as InventoryItem;

        const stockMap = item.stockByLocation || {};

        // Check Source Stock
        // If undefined, assume 0 (or assume 'Main Store' has all stock if strictly migrating?)
        // For safety, assume 0.
        const currentSourceStock = stockMap[fromLocationId] || 0;

        if (currentSourceStock < quantity) {
            throw new Error(`Insufficient stock in ${fromLocationId}. Available: ${currentSourceStock}`);
        }

        const currentDestStock = stockMap[toLocationId] || 0;

        // Update Map
        stockMap[fromLocationId] = currentSourceStock - quantity;
        stockMap[toLocationId] = currentDestStock + quantity;

        // Update Inventory Doc
        transaction.update(itemRef, {
            stockByLocation: stockMap,
            updatedAt: serverTimestamp()
        });

        // Log Transaction (Source - Out)
        const transRefOut = doc(collection(firestore, 'inventoryTransactions'));
        transaction.set(transRefOut, {
            inventoryItemId: itemId,
            itemName: item.name,
            transactionType: 'transfer_out',
            quantity: -quantity,
            unitCost: item.unitCost || 0,
            totalCost: (item.unitCost || 0) * quantity,
            previousStock: currentSourceStock,
            newStock: stockMap[fromLocationId],
            locationId: fromLocationId,
            reason: `Transfer to ${toLocationId}`,
            performedBy: performedBy,
            createdAt: serverTimestamp()
        });

        // Log Transaction (Dest - In)
        const transRefIn = doc(collection(firestore, 'inventoryTransactions'));
        transaction.set(transRefIn, {
            inventoryItemId: itemId,
            itemName: item.name,
            transactionType: 'transfer_in',
            quantity: quantity, // Positive
            unitCost: item.unitCost || 0,
            totalCost: (item.unitCost || 0) * quantity,
            previousStock: currentDestStock,
            newStock: stockMap[toLocationId],
            locationId: toLocationId,
            reason: `Transfer from ${fromLocationId}`,
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
// ==================== AUTO-REORDER LOGIC ====================

export const checkAndCreateAutoReorder = async (inventoryItemId: string, newStock: number): Promise<any> => {
    if (!db) return { status: 'error', message: 'No DB' };
    try {
        const itemRef = doc(db, 'inventory', inventoryItemId);
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) return { status: 'error', message: 'Item not found' };
        const item = itemSnap.data() as InventoryItem;

        // Check if reorder is needed
        const minStock = item.minStockLevel || 0;
        // console.log(`[AutoReorder] Checking ${item.name}: Stock=${newStock}, Min=${minStock}`);

        if (newStock > minStock) {
            return { status: 'skipped', message: `Stock ${newStock} > Min ${minStock}`, item: item.name };
        }

        // Check if there's already a DRAFT PO for this supplier
        // We assume preferredSupplierId is on the item. If not, we can't auto-order.
        // UPDATE: User wants draft created anyway. We will use a placeholder if missing.
        let targetSupplierId = item.preferredSupplierId;

        if (!targetSupplierId) {
            console.warn(`[AutoReorder] No preferred supplier for ${item.name}. Using 'pending' placeholder.`);
            targetSupplierId = 'pending';
        }

        const suppliersRef = collection(db, 'purchaseOrders');
        // If pending, we look for a draft with 'pending' supplier
        const q = query(
            suppliersRef,
            where('supplierId', '==', targetSupplierId),
            where('status', '==', 'draft'),
            limit(1)
        );
        const poSnap = await getDocs(q);

        const orderQty = (item.reorderQuantity && item.reorderQuantity > 0)
            ? item.reorderQuantity
            : (item.maxStockLevel ? (item.maxStockLevel - newStock) : 10); // Default fallback

        if (!poSnap.empty) {
            // Update existing Draft PO
            const poDoc = poSnap.docs[0];
            const po = poDoc.data() as PurchaseOrder;
            const existingItemIndex = po.items.findIndex(i => i.itemId === inventoryItemId);

            const newItems = [...po.items];
            if (existingItemIndex >= 0) {
                return { status: 'skipped', message: `Item already in PO ${po.poNumber}`, poId: po.id };
            } else {
                // Add to PO
                newItems.push({
                    itemId: inventoryItemId,
                    name: item.name,
                    unit: item.unit || 'units', // Include unit
                    quantity: orderQty,
                    unitCost: item.unitCost || 0,
                    totalCost: orderQty * (item.unitCost || 0)
                });

                const newTotal = newItems.reduce((sum, i) => sum + i.totalCost, 0);

                await updateDoc(poDoc.ref, {
                    items: newItems,
                    totalAmount: newTotal,
                    updatedAt: serverTimestamp()
                });
                return { status: 'success', message: `Added to existing PO ${po.poNumber}`, poId: po.id };
            }

        } else {
            // Create NEW Draft PO
            let supplierName = "Unknown Supplier";

            if (targetSupplierId !== 'pending') {
                try {
                    const supplierRef = doc(db, 'suppliers', targetSupplierId);
                    const supplierSnap = await getDoc(supplierRef);
                    if (supplierSnap.exists()) {
                        supplierName = supplierSnap.data().name;
                    }
                } catch (e) { console.error("Error fetching supplier name", e); }
            } else {
                supplierName = "Pending Assignment";
            }

            await createPurchaseOrder({
                supplierId: targetSupplierId,
                supplierName: supplierName,
                status: 'draft',
                items: [{
                    itemId: inventoryItemId,
                    name: item.name,
                    unit: item.unit || 'units', // Include unit
                    quantity: orderQty,
                    unitCost: item.unitCost || 0,
                    totalCost: orderQty * (item.unitCost || 0)
                }],
                totalAmount: orderQty * (item.unitCost || 0),
                notes: "Auto-generated by Low Stock Alert (Needs Supplier)"
            });
            return { status: 'success', message: `Created NEW PO for ${item.name}` };
        }

    } catch (error) {
        console.error("[AutoReorder] Failed:", error);
    }
};
