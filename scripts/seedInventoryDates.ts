/**
 * Inventory Dates Seeder
 * Patches `manufactureDate` and `expiryDate` onto all existing Firestore
 * `inventory` documents based on category-specific shelf-life rules.
 *
 * Shelf-life logic (realistic for a hotel kitchen/bar):
 *   meat / seafood  → manufactured 1-3 days ago, expires in 4-7 days
 *   dairy / produce → manufactured 3-7 days ago, expires in 7-14 days
 *   beverages       → manufactured 90-180 days ago, expires in 180-365 days
 *   spirits/wine    → manufactured 365-730 days ago, expires in 3-5 years
 *   dry / bakery / condiments / spices → manufactured 30-90 days ago, expires in 90-365 days
 *   default         → manufactured 30 days ago, expires in 90 days
 *
 * Run: npx tsx scripts/seedInventoryDates.ts
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a Date randomly offset from `base` within [minDays, maxDays].
 * Use negative values to go into the past.
 */
function offsetDate(base: Date, minDays: number, maxDays: number): Date {
    const days = minDays + Math.random() * (maxDays - minDays);
    return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

interface ShelfRule {
    mfgMin: number; // days ago (past, use negative)
    mfgMax: number;
    expMin: number; // days from manufacture date
    expMax: number;
}

const CATEGORY_RULES: Record<string, ShelfRule> = {
    // Perishables
    meat:       { mfgMin: -3,   mfgMax: -1,   expMin: 4,    expMax: 7    },
    seafood:    { mfgMin: -3,   mfgMax: -1,   expMin: 3,    expMax: 6    },
    dairy:      { mfgMin: -7,   mfgMax: -3,   expMin: 7,    expMax: 14   },
    produce:    { mfgMin: -7,   mfgMax: -2,   expMin: 7,    expMax: 21   },

    // Semi-perishable
    bakery:     { mfgMin: -5,   mfgMax: -1,   expMin: 5,    expMax: 14   },
    condiments: { mfgMin: -60,  mfgMax: -30,  expMin: 90,   expMax: 365  },
    sauces:     { mfgMin: -60,  mfgMax: -30,  expMin: 90,   expMax: 365  },
    spices:     { mfgMin: -90,  mfgMax: -30,  expMin: 180,  expMax: 730  },
    dry:        { mfgMin: -90,  mfgMax: -30,  expMin: 180,  expMax: 365  },
    "dry goods":{ mfgMin: -90,  mfgMax: -30,  expMin: 180,  expMax: 365  },
    grains:     { mfgMin: -90,  mfgMax: -30,  expMin: 180,  expMax: 365  },
    pasta:      { mfgMin: -90,  mfgMax: -30,  expMin: 180,  expMax: 730  },

    // Long shelf life
    beverages:  { mfgMin: -180, mfgMax: -90,  expMin: 180,  expMax: 365  },
    beer:       { mfgMin: -90,  mfgMax: -30,  expMin: 90,   expMax: 365  },
    wine:       { mfgMin: -730, mfgMax: -365, expMin: 365,  expMax: 1825 },
    spirits:    { mfgMin: -730, mfgMax: -365, expMin: 1825, expMax: 3650 },
    liqueur:    { mfgMin: -730, mfgMax: -365, expMin: 1825, expMax: 3650 },
    mixers:     { mfgMin: -180, mfgMax: -90,  expMin: 180,  expMax: 365  },
    juice:      { mfgMin: -30,  mfgMax: -7,   expMin: 14,   expMax: 90   },
    water:      { mfgMin: -180, mfgMax: -30,  expMin: 365,  expMax: 730  },
    soft:       { mfgMin: -180, mfgMax: -30,  expMin: 180,  expMax: 365  },
    "soft drinks":{ mfgMin: -180, mfgMax: -30, expMin: 180, expMax: 365  },
    cleaning:   { mfgMin: -365, mfgMax: -90,  expMin: 730,  expMax: 1825 },
    chemicals:  { mfgMin: -365, mfgMax: -90,  expMin: 730,  expMax: 1825 },
    packaging:  { mfgMin: -365, mfgMax: -90,  expMin: 1825, expMax: 3650 },
    equipment:  { mfgMin: -365, mfgMax: -90,  expMin: 1825, expMax: 3650 },
};

const DEFAULT_RULE: ShelfRule = { mfgMin: -30, mfgMax: -10, expMin: 60, expMax: 180 };

function getRuleForCategory(category: string): ShelfRule {
    const key = category?.toLowerCase().trim() ?? "";
    // direct match
    if (CATEGORY_RULES[key]) return CATEGORY_RULES[key];
    // partial match
    for (const [k, rule] of Object.entries(CATEGORY_RULES)) {
        if (key.includes(k) || k.includes(key)) return rule;
    }
    return DEFAULT_RULE;
}

// ── Main Seeder ───────────────────────────────────────────────────────────────

async function seedInventoryDates() {
    console.log("📅 Fixing Inventory Dates Seeding...\n");
    const now = new Date();

    const snapshot = await db.collection("inventory").get();

    if (snapshot.empty) {
        console.warn("⚠️  No inventory documents found. Run the kitchen/bar seeders first.");
        process.exit(0);
    }

    console.log(`📦 Found ${snapshot.size} inventory documents.\n`);

    let updated = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
        try {
            const data = doc.data();
            const category: string = data.category || "default";
            const rule = getRuleForCategory(category);

            const manufactureDate = offsetDate(now, rule.mfgMin, rule.mfgMax);
            const expiryDate = offsetDate(manufactureDate, rule.expMin, rule.expMax);

            await doc.ref.update({
                manufacturingDate: Timestamp.fromDate(manufactureDate),
                expiryDate: Timestamp.fromDate(expiryDate),
                manufactureDate: FieldValue.delete(), // Clean up old incorrect field
                updatedAt: Timestamp.fromDate(now),
            });

            const mfgStr = manufactureDate.toISOString().split("T")[0];
            const expStr = expiryDate.toISOString().split("T")[0];
            console.log(`   ✅ [${doc.id}] ${data.name} (${category}) → Mfg: ${mfgStr} | Exp: ${expStr}`);
            updated++;
        } catch (err) {
            console.error(`   ❌ Error processing [${doc.id}] ${doc.data().name}:`, err);
            errors++;
        }
    }

    console.log(`\n🎉 Inventory Dates Patch Complete!`);
    console.log(`   ✅ Updated  : ${updated}`);
    console.log(`   ❌ Errors   : ${errors}`);
    console.log(`   📦 Total    : ${snapshot.size}`);
}

seedInventoryDates().catch(console.error);
