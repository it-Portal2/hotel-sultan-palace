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


export const receivePurchaseOrder = async (
    poId: string,
    data: {
        invoiceUrl?: string;
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

                // Update Inventory Item
                const updateData: any = {
                    currentStock: newStock,
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
            receivedDetails: {
                receivedAt: new Date(),
                receivedBy,
                items: data.items.map(i => ({
                    ...i,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(db, 'inventory', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });

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

export const checkAndCreateAutoReorder = async (inventoryItemId: string, newStock: number) => {
    if (!db) return;
    try {
        const itemRef = doc(db, 'inventory', inventoryItemId);
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) return;
        const item = itemSnap.data() as InventoryItem;

        // Check if reorder is needed
        const minStock = item.minStockLevel || 0;
        if (newStock > minStock) return; // Not low enough

        console.log(`[AutoReorder] Item ${item.name} is low (${newStock} <= ${minStock}). Checking for active POs...`);

        // Check if there's already a DRAFT PO for this supplier
        // We assume preferredSupplierId is on the item. If not, we can't auto-order.
        if (!item.preferredSupplierId) {
            console.warn(`[AutoReorder] No preferred supplier for ${item.name}. Skipping.`);
            return;
        }

        const suppliersRef = collection(db, 'purchaseOrders');
        const q = query(
            suppliersRef,
            where('supplierId', '==', item.preferredSupplierId),
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
                // Already in PO, log it.
                console.log(`[AutoReorder] Item already in Draft PO ${po.poNumber}.`);
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
                console.log(`[AutoReorder] Added ${item.name} to Draft PO ${po.poNumber}.`);
            }

        } else {
            // Create NEW Draft PO
            // Fetch supplier name for the PO record
            const supplierRef = doc(db, 'suppliers', item.preferredSupplierId);
            const supplierSnap = await getDoc(supplierRef);
            const supplierName = supplierSnap.exists() ? supplierSnap.data().name : "Unknown Supplier";

            await createPurchaseOrder({
                supplierId: item.preferredSupplierId,
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
                notes: "Auto-generated by Low Stock Alert"
            });
            console.log(`[AutoReorder] Created new Draft PO for ${item.name}.`);
        }

    } catch (error) {
        console.error("[AutoReorder] Failed:", error);
    }
};
