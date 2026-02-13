/**
 * Firebase Beverage Categories Seeder Script
 *
 * Run this script with: npx tsx scripts/seedBeverageCategories.ts
 *
 * This will add all beverage categories to the 'foodCategories' collection in Firestore
 * with each document having its own custom ID.
 *
 * Structure: 20 categories (1 root + 19 sub-categories)
 * Hierarchy: Beverages → [Alcoholic/Non-Alcoholic] → [Spirits/Wines/...] → [Vodka/Gin/...]
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    console.error(
      "❌ FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set",
    );
    console.log(
      "\nMake sure your .env file contains FIREBASE_SERVICE_ACCOUNT_JSON with your service account JSON.",
    );
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (error) {
    console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error);
    process.exit(1);
  }
}

const db = getFirestore();

// Collection name for bar categories (separate from foodCategories)
const COLLECTION_NAME = "barCategories";

// Category interface
interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  type: "food" | "bar";
  availabilityType:
    | "all_day"
    | "breakfast"
    | "lunch"
    | "dinner"
    | "night"
    | "custom";
  availableHoursStart: string;
  availableHoursEnd: string;
  description: string;
  isParentCategory: boolean;
  parentCategoryId: string;
  imageUrl: string;
}

// =============================================================================
// SULTAN OF ZANZIBAR — BEVERAGE CATEGORIES
// =============================================================================
// Source: FINAL_Beverage_Menu_$fixed.pdf
// Total: 20 categories (1 root + 19 sub-categories)
// Hierarchy: Beverages → [Alcoholic/Non-Alcoholic] → [Spirits/Wines/...] → [Vodka/Gin/...]
// =============================================================================

const beverageCategories: Category[] = [
  // ===========================================================================
  // LEVEL 1 — ROOT CATEGORY
  // ===========================================================================

  {
    id: "cat_beverages",
    name: "Beverages",
    sortOrder: 100, // Comes after all food categories
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description:
      "Complete beverage menu including alcoholic and non-alcoholic drinks",
    isParentCategory: true,
    parentCategoryId: "", // Root level — no parent
    imageUrl: "",
  },

  // ===========================================================================
  // LEVEL 2 — MAIN DIVISIONS (Alcoholic / Non-Alcoholic / Other)
  // ===========================================================================

  {
    id: "cat_alcoholic",
    name: "Alcoholic Beverages",
    sortOrder: 1,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Cocktails, wines, spirits and liqueurs",
    isParentCategory: true,
    parentCategoryId: "cat_beverages",
    imageUrl: "",
  },

  {
    id: "cat_non_alcoholic",
    name: "Non-Alcoholic Beverages",
    sortOrder: 2,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description:
      "Smoothies, milkshakes, mocktails, iced tea and health boosters",
    isParentCategory: true,
    parentCategoryId: "cat_beverages",
    imageUrl: "",
  },

  {
    id: "cat_smokers",
    name: "Smokers",
    sortOrder: 3,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Hookah and shisha",
    isParentCategory: false, // Leaf category — contains actual menu items
    parentCategoryId: "cat_beverages",
    imageUrl: "",
  },

  // ===========================================================================
  // LEVEL 3 — ALCOHOLIC SUB-DIVISIONS (Spirits / Wines / Cocktails)
  // ===========================================================================

  {
    id: "cat_spirits",
    name: "Spirits",
    sortOrder: 1,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Premium spirits by the shot or bottle",
    isParentCategory: true,
    parentCategoryId: "cat_alcoholic",
    imageUrl: "",
  },

  {
    id: "cat_wines",
    name: "Wines",
    sortOrder: 2,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Red, white and sparkling wines by the glass or bottle",
    isParentCategory: true,
    parentCategoryId: "cat_alcoholic",
    imageUrl: "",
  },

  {
    id: "cat_cocktails",
    name: "Cocktails",
    sortOrder: 3,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Classic and signature cocktails crafted by our bartenders",
    isParentCategory: false, // Leaf category — contains actual menu items
    parentCategoryId: "cat_alcoholic",
    imageUrl: "",
  },

  // ===========================================================================
  // LEVEL 4 — SPIRITS BREAKDOWN (Vodka / Gin / Tequila / Whiskey / Rum / Liqueurs)
  // ===========================================================================

  {
    id: "cat_vodka",
    name: "Vodka",
    sortOrder: 1,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Premium vodka selection",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_spirits",
    imageUrl: "",
  },

  {
    id: "cat_gin",
    name: "Gin",
    sortOrder: 2,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Premium gin selection",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_spirits",
    imageUrl: "",
  },

  {
    id: "cat_tequila",
    name: "Tequila",
    sortOrder: 3,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Premium tequila selection",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_spirits",
    imageUrl: "",
  },

  {
    id: "cat_whiskey",
    name: "Whiskey",
    sortOrder: 4,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Premium whiskey selection",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_spirits",
    imageUrl: "",
  },

  {
    id: "cat_rum",
    name: "Rum",
    sortOrder: 5,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Premium rum selection",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_spirits",
    imageUrl: "",
  },

  {
    id: "cat_liqueurs",
    name: "Liqueurs",
    sortOrder: 6,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Premium liqueur selection",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_spirits",
    imageUrl: "",
  },

  // ===========================================================================
  // LEVEL 4 — WINES BREAKDOWN (Red / White / Sparkling)
  // ===========================================================================

  {
    id: "cat_red_wines",
    name: "Red Wines",
    sortOrder: 1,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Curated selection of red wines",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_wines",
    imageUrl: "",
  },

  {
    id: "cat_white_wines",
    name: "White Wines",
    sortOrder: 2,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Curated selection of white wines",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_wines",
    imageUrl: "",
  },

  {
    id: "cat_sparkling_wines",
    name: "Sparkling Wines",
    sortOrder: 3,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Prosecco, brut and other sparkling wines",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_wines",
    imageUrl: "",
  },

  // ===========================================================================
  // LEVEL 3 — NON-ALCOHOLIC SUB-CATEGORIES
  // ===========================================================================

  {
    id: "cat_iced_tea_coffee",
    name: "Iced Tea & Coffee",
    sortOrder: 1,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Refreshing iced beverages",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_non_alcoholic",
    imageUrl: "",
  },

  {
    id: "cat_smoothies",
    name: "Smoothies",
    sortOrder: 2,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Fresh fruit and healthy smoothies",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_non_alcoholic",
    imageUrl: "",
  },

  {
    id: "cat_boosters",
    name: "Boosters",
    sortOrder: 3,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Health-focused vitamin and nutrient boosters",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_non_alcoholic",
    imageUrl: "",
  },

  {
    id: "cat_milkshakes",
    name: "Milkshakes",
    sortOrder: 4,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Classic ice cream milkshakes",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_non_alcoholic",
    imageUrl: "",
  },

  {
    id: "cat_mocktails",
    name: "Mocktails",
    sortOrder: 5,
    isActive: true,
    type: "bar",
    availabilityType: "all_day",
    availableHoursStart: "00:00",
    availableHoursEnd: "23:59",
    description: "Non-alcoholic cocktail alternatives",
    isParentCategory: false, // Leaf category
    parentCategoryId: "cat_non_alcoholic",
    imageUrl: "",
  },
];

// =============================================================================
// CATEGORY HIERARCHY VISUALIZATION
// =============================================================================
/*
cat_beverages (ROOT)
├── cat_alcoholic
│   ├── cat_spirits
│   │   ├── cat_vodka
│   │   ├── cat_gin
│   │   ├── cat_tequila
│   │   ├── cat_whiskey
│   │   ├── cat_rum
│   │   └── cat_liqueurs
│   ├── cat_wines
│   │   ├── cat_red_wines
│   │   ├── cat_white_wines
│   │   └── cat_sparkling_wines
│   └── cat_cocktails
├── cat_non_alcoholic
│   ├── cat_iced_tea_coffee
│   ├── cat_smoothies
│   ├── cat_boosters
│   ├── cat_milkshakes
│   └── cat_mocktails
└── cat_smokers
*/

// =============================================================================
// SEEDER FUNCTION
// =============================================================================
async function seedBeverageCategories() {
  console.log("\n🍹 Starting Beverage Categories Seeder...\n");
  console.log(`📦 Collection: ${COLLECTION_NAME}`);
  console.log(`📊 Total categories: ${beverageCategories.length}\n`);

  const batch = db.batch();
  const now = new Date();

  for (const category of beverageCategories) {
    const { id, ...categoryData } = category;
    const docRef = db.collection(COLLECTION_NAME).doc(id);

    // Add timestamps
    const dataWithTimestamps = {
      ...categoryData,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(docRef, dataWithTimestamps);
    const parentInfo = category.parentCategoryId
      ? ` (child of ${category.parentCategoryId})`
      : category.isParentCategory
        ? " (root)"
        : "";
    console.log(`📝 Prepared: ${category.name}${parentInfo}`);
  }

  try {
    await batch.commit();
    console.log(
      `\n✅ Successfully seeded ${beverageCategories.length} beverage categories to '${COLLECTION_NAME}' collection!`,
    );
  } catch (error) {
    console.error("\n❌ Error seeding beverage categories:", error);
    process.exit(1);
  }
}

// Run the seeder
seedBeverageCategories()
  .then(() => {
    console.log("\n🎉 Beverage categories seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed:", error);
    process.exit(1);
  });
