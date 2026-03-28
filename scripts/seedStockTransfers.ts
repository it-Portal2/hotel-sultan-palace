/**
 * Seed Stock Transfers
 * Re-aligns all existing inventory to originate in `main_store`.
 * Then simulates realistic operational stock transfers to `kitchen_bar` or `beach_bar`
 * based on item category, so recipes can deduct from these locations.
 * Creates proper `transfer_out` and `transfer_in` transaction logs.
 *
 * Run: npx tsx scripts/seedStockTransfers.ts
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

async function seedStockTransfers() {
    console.log("🚚 Starting Inventory Stock Transfers Seeding...\n");
    const now = new Date();

    const snapshot = await db.collection("inventory").get();
    if (snapshot.empty) {
        console.error("⚠️ No inventory documents found. Run the kitchen/bar seeders first.");
        process.exit(0);
    }

    console.log(`📦 Found ${snapshot.size} inventory items to process.\n`);
    let processed = 0;
    let transfers = 0;
    let errors = 0;

    const batchSize = 100;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
        try {
            const data = doc.data();
            const currentStock = data.currentStock || 0;
            const category = data.category?.toLowerCase() || '';
            const existingDepartment = data.department || '';

            // 1. Determine Target Location for Transfers
            let targetLocationId = '';
            const docId = doc.id.toLowerCase();

            // Priority 1: Check ID prefix from provided reference files
            if (docId.startsWith('bar-')) {
                targetLocationId = 'beach_bar';
            } else if (docId.startsWith('kit-')) {
                targetLocationId = 'kitchen_bar';
            }
            // Priority 2: Heuristics fallback
            else if (
                existingDepartment === 'Bar' ||
                category.toLowerCase().includes('beverage') ||
                category.toLowerCase().includes('liquor') ||
                category.toLowerCase().includes('wine') ||
                category.toLowerCase().includes('beer') ||
                category.toLowerCase().includes('soft') ||
                category.toLowerCase().includes('juice') ||
                category.toLowerCase().includes('mixer') ||
                category.toLowerCase().includes('spirit')
            ) {
                targetLocationId = 'beach_bar';
            } else {
                // By default, assume kitchen/food items
                targetLocationId = 'kitchen_bar';
            }

            // 2. Set Department strictly to "Main Store" (as the user requested "Main Store is the first store")
            // Wait, we won't overwrite `department` to keep category meta, we will just fix the locations.
            // Actually, the user asked: "manage all the items based on the departments ...  main store is the first store where all the items are placed"
            // We'll leave `department` as the operational category (Kitchen/Bar), but shift all stock to `main_store`.

            // 3. Define the transfer amount (e.g. 50% of the stock)
            const transferRatio = 0.50; // 50% transferred to operational front
            const transferQty = Math.floor(currentStock * transferRatio);
            const remainQty = currentStock - transferQty;

            // 4. Set exact `stockByLocation` to overwrite whatever garbage is there
            const updatedStockByLocation = {
                main_store: remainQty,
                [targetLocationId]: transferQty
            };

            const updateData = {
                stockByLocation: updatedStockByLocation,
                updatedAt: Timestamp.fromDate(now)
            };

            batch.update(doc.ref, updateData);

            // 5. Generate Transaction Logs for the transfer IF there is stock to transfer
            if (transferQty > 0) {
                // Transfer OUT from Main Store
                const transOutRef = db.collection('inventoryTransactions').doc();
                batch.set(transOutRef, {
                    inventoryItemId: doc.id,
                    itemName: data.name,
                    transactionType: 'transfer_out',
                    quantity: -transferQty,
                    unitCost: data.unitCost || 0,
                    totalCost: -(data.unitCost || 0) * transferQty,
                    previousStock: currentStock, // Technically had 100% in main store conceptually
                    newStock: remainQty,
                    locationId: 'main_store',
                    reason: `Initial Stock Setup - Transfer to ${targetLocationId === 'beach_bar' ? 'Beach Bar' : 'Kitchen Bar'}`,
                    performedBy: 'System Seeder',
                    createdAt: Timestamp.fromDate(now)
                });

                // Transfer IN to Target Location
                const transInRef = db.collection('inventoryTransactions').doc();
                batch.set(transInRef, {
                    inventoryItemId: doc.id,
                    itemName: data.name,
                    transactionType: 'transfer_in',
                    quantity: transferQty,
                    unitCost: data.unitCost || 0,
                    totalCost: (data.unitCost || 0) * transferQty,
                    previousStock: 0,
                    newStock: transferQty,
                    locationId: targetLocationId,
                    reason: `Initial Stock Setup - Received from Main Store`,
                    performedBy: 'System Seeder',
                    createdAt: Timestamp.fromDate(now)
                });

                transfers++;
            }

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

    console.log(`\n🎉 Stock Transfers Seeding Complete!`);
    console.log(`   ✅ Items Processed : ${processed}`);
    console.log(`   🚚 Transfers Made  : ${transfers}`);
    console.log(`   ❌ Errors          : ${errors}`);
}

seedStockTransfers().catch(console.error);
