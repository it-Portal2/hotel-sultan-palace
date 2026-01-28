import { createRequire } from 'module';
import path from 'path';
import * as dotenv from 'dotenv';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const require = createRequire(import.meta.url);

// 1. Load Environment Variables
try {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
    console.log("Environment loaded.");
} catch (e) {
    console.error("Failed to load env:", e);
}

// 2. Load Modules (Runtime, after Env)
const { db } = require('./firebase');
const { checkAndCreateAutoReorder } = require('./inventoryService');

const runVerification = async () => {
    console.log("Starting Verification for 'masala maggi'...");

    if (!db) {
        console.error("Database not initialized. Check firebase.ts and env vars.");
        return;
    }

    // 1. Find the item
    // Search for "masala maggi"
    let itemSnapshot = await getDocs(query(collection(db, 'inventory'), where('name', '==', 'masala maggi')));

    if (itemSnapshot.empty) {
        console.log("'masala maggi' (exact match) not found. Trying case-insensitive search...");
        const allItems = await getDocs(collection(db, 'inventory'));
        const found = allItems.docs.find(d => d.data().name.toLowerCase() === 'masala maggi');
        if (found) {
            itemSnapshot = await getDocs(query(collection(db, 'inventory'), where('name', '==', found.data().name)));
        }
    }

    if (itemSnapshot.empty) {
        console.error("ERROR: Item 'masala maggi' NOT FOUND in Inventory.");
        return;
    }

    const itemDoc = itemSnapshot.docs[0];
    const itemData = itemDoc.data();
    const itemId = itemDoc.id;

    console.log(`Found Item: ${itemData.name} (ID: ${itemId})`);
    console.log(`- Current Stock: ${itemData.currentStock}`);
    console.log(`- Min Stock Level: ${itemData.minStockLevel}`);
    console.log(`- Preferred Supplier ID: ${itemData.preferredSupplierId}`);

    if (!itemData.preferredSupplierId) {
        console.error("FAILURE ROOT CAUSE: Item has NO Preferred Supplier. Auto-order cannot function.");
        return;
    }

    // Check Supplier Name
    const supplierSnap = await getDoc(doc(db, 'suppliers', itemData.preferredSupplierId));
    if (supplierSnap.exists()) {
        console.log(`- Preferred Supplier Name: ${supplierSnap.data().name}`);
    } else {
        console.warn("- WARNING: Supplier ID exists in item, but Supplier Doc not found!");
    }

    // 2. Simulate Auto-Reorder Call
    console.log("Simulating Auto-Reorder Check...");
    await checkAndCreateAutoReorder(itemId, itemData.currentStock);

    console.log("Check completed. Inspect console logs above for '[AutoReorder]' messages.");
};

runVerification().catch(err => {
    console.error("Script Execution Failed:", err);
});
