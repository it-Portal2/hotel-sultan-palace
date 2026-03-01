/**
 * Bar Inventory Seeder
 * Reads bar_inventory_seed_part1.json & bar_inventory_seed_part2.json
 * and upserts all items into Firestore `inventory` collection.
 *
 * Run: npx tsx scripts/seedBarInventory.ts
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

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

interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    department: string;
    category: string;
    unit: string;
    currentStock: number;
    minStockLevel: number;
    reorderPoint: number;
    maxStockLevel: number;
    unitCost: number;
    location: string;
    purchaseUnit: string;
    conversionFactor: number;
    isActive: boolean;
}

async function seedBarInventory() {
    console.log("🍹 Starting Bar Inventory Seeding...\n");
    const now = new Date();

    // Load both JSON files
    const part1Path = path.join(__dirname, "bar_inventory_seed_part1.json");
    const part2Path = path.join(__dirname, "bar_inventory_seed_part2.json");

    if (!fs.existsSync(part1Path) || !fs.existsSync(part2Path)) {
        console.error("❌ One or both JSON files not found. Ensure both files exist in /scripts.");
        process.exit(1);
    }

    const part1Data = JSON.parse(fs.readFileSync(part1Path, "utf8"));
    const part2Data = JSON.parse(fs.readFileSync(part2Path, "utf8"));

    const allItems: InventoryItem[] = [
        ...(part1Data.inventoryItems || []),
        ...(part2Data.inventoryItems || []),
    ];

    console.log(`📦 Total bar items to seed: ${allItems.length}`);
    console.log(`   Part 1: ${part1Data.inventoryItems?.length ?? 0} items`);
    console.log(`   Part 2: ${part2Data.inventoryItems?.length ?? 0} items\n`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of allItems) {
        try {
            const docRef = db.collection("inventory").doc(item.id);
            const existing = await docRef.get();

            const docData = {
                name: item.name,
                sku: item.sku,
                department: item.department,
                category: item.category,
                unit: item.unit,
                currentStock: item.currentStock,
                minStockLevel: item.minStockLevel,
                reorderPoint: item.reorderPoint,
                maxStockLevel: item.maxStockLevel,
                unitCost: item.unitCost,
                totalValue: item.currentStock * item.unitCost,
                location: item.location,
                purchaseUnit: item.purchaseUnit,
                conversionFactor: item.conversionFactor,
                isActive: item.isActive,
                stockByLocation: {
                    main_store: item.currentStock,
                    bar: 0,
                },
                updatedAt: now,
            };

            if (!existing.exists) {
                await docRef.set({ ...docData, createdAt: now });
                console.log(`   ✅ Created: [${item.id}] ${item.name}`);
                created++;
            } else {
                await docRef.update(docData);
                console.log(`   🔄 Updated: [${item.id}] ${item.name}`);
                updated++;
            }
        } catch (err) {
            console.error(`   ❌ Error processing [${item.id}] ${item.name}:`, err);
            errors++;
        }
    }

    console.log(`\n🎉 Bar Inventory Seeding Complete!`);
    console.log(`   ✅ Created : ${created}`);
    console.log(`   🔄 Updated : ${updated}`);
    console.log(`   ❌ Errors  : ${errors}`);
    console.log(`   📦 Total   : ${allItems.length}`);
}

seedBarInventory().catch(console.error);
