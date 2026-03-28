/**
 * Reset Stock to Main Store
 * Resets all existing inventory to originate 100% in `main_store`.
 * Removes all stock from `kitchen_bar` and `beach_bar`.
 *
 * Run: npx tsx scripts/resetToMainStore.ts
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON not set in .env");
        process.exit(1);
    }
    const sa = JSON.parse(serviceAccountJson);
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
}

const db = getFirestore();

async function resetToMainStore() {
    console.log("🚚 Resetting Inventory Stock 100% to Main Store...\n");
    const now = new Date();

    const snapshot = await db.collection("inventory").get();
    if (snapshot.empty) {
        console.error("⚠️ No inventory documents found.");
        process.exit(0);
    }

    console.log(`📦 Found ${snapshot.size} inventory items to process.\n`);
    let processed = 0;
    let errors = 0;

    const batchSize = 100;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
        try {
            const data = doc.data();
            const currentStock = data.currentStock || 0;
            
            // Set 100% of stock to main_store and update alignment
            const updatedStockByLocation = {
                main_store: currentStock
            };

            const updateData = {
                category: "f_b_items",
                department: "Main Store",
                location: "Main Store",
                stockByLocation: updatedStockByLocation,
                updatedAt: Timestamp.fromDate(now)
            };

            batch.update(doc.ref, updateData);

            processed++;
            batchCount++;

            // Commit batch if we reach the limit
            if (batchCount >= batchSize) {
                await batch.commit();
                console.log(`   ... Committed batch of ${batchCount} items ...`);
                batch = db.batch();
                batchCount = 0;
            }
        } catch (err) {
            console.error(`❌ Error processing [${doc.id}]:`, err);
            errors++;
        }
    }

    // Commit any remaining
    if (batchCount > 0) {
        await batch.commit();
        console.log(`   ... Committed final batch of ${batchCount} items ...`);
    }

    // Also delete any transfer_out/transfer_in transactions we just made to clean up history (optional, but good)
    const txSnapshot = await db.collection("inventoryTransactions")
        .where("performedBy", "==", "System Seeder")
        .get();
        
    let txBatch = db.batch();
    let txBatchCount = 0;
    for (const txDoc of txSnapshot.docs) {
        txBatch.delete(txDoc.ref);
        txBatchCount++;
        if (txBatchCount >= batchSize) {
            await txBatch.commit();
            txBatch = db.batch();
            txBatchCount = 0;
        }
    }
    if (txBatchCount > 0) {
        await txBatch.commit();
    }
    if (txSnapshot.size > 0) {
        console.log(`   🧹 Cleaned up ${txSnapshot.size} auto-generated transfer transaction logs.`);
    }

    console.log(`\n🎉 Stock Reset Complete! All items are 100% in Main Store.`);
    console.log(`   ✅ Items Processed : ${processed}`);
    console.log(`   ❌ Errors          : ${errors}`);
}

resetToMainStore().catch(console.error);
