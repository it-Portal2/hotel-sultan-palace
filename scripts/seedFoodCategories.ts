/**
 * Firebase Food Categories Seeder Script
 *
 * Run this script with: npx tsx scripts/seedFoodCategories.ts
 *
 * This will add all food categories to the 'foodCategories' collection in Firestore
 * with each document having its own custom ID.
 *
 * Structure: 24 categories (3 parent with 9 children, 12 standalone)
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

// Collection name for food categories
const COLLECTION_NAME = "foodCategories";

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
// Food categories data (24 categories — matches PDF exactly)
// =============================================================================
const categories: Category[] = [
  // ============================================
  // 1. BREAKFAST MENU
  // ============================================
  // PDF: $25 flat set meal that includes egg choice + sides + hot drinks.
  // NOTE: Brewed coffee (Cappuccino, Americano, Espresso, Latte) is NOT
  //       included in the $25 — it is a separate add-on at $8.
  // ============================================
  {
    id: "cat_breakfast",
    name: "BREAKFAST MENU",
    sortOrder: 1,
    isActive: true,
    type: "food",
    availabilityType: "breakfast",
    availableHoursStart: "06:00",
    availableHoursEnd: "10:30",
    description:
      "$25 set meal. Brewed coffee (Cappuccino, Americano, Espresso, Latte) is an add-on at $8 — not included in the set.",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 2. SOUPS
  // ============================================
  // PDF: 7 soups. Seafood $8, Chicken Swahili $7, Chicken & Mushroom $7,
  //      rest are cream soups at $6 each.
  // ============================================
  {
    id: "cat_soups",
    name: "SOUPS",
    sortOrder: 2,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 3. MAIN COURSE  (Parent)
  // ============================================
  // PDF: Header section that holds 3 sub-sections: Seafoods, Chicken, Others.
  //      Cooking styles apply to ALL children:
  //      grilled, fried, baked, pan fried, masala, curry.
  //      Served with: Rice, Risotto, Mashed potatoes, French fries,
  //      Potato wedges, Vegetables.
  // ============================================
  {
    id: "cat_main_course",
    name: "MAIN COURSE",
    sortOrder: 3,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description:
      "All main courses can be cooked in grilled, fried, baked, pan fried, masala and curry style. Served with either: Rice, Risotto, Mashed potatoes, French fries, Potato wedges and Vegetables.",
    isParentCategory: true,
    parentCategoryId: "",
    imageUrl: "",
  },

  // --- Child: SEAFOODS ---
  // PDF: Tuna, Kingfish, Calamari, Octopus, King Prawns — all $15 per piece.
  {
    id: "cat_main_seafoods",
    name: "SEAFOODS",
    sortOrder: 4,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description:
      "$15 per piece. Items: Tuna, Kingfish, Calamari, Octopus, King Prawns.",
    isParentCategory: false,
    parentCategoryId: "cat_main_course",
    imageUrl: "",
  },

  // --- Child: CHICKEN ---
  // PDF: Chicken Leg, Chicken Breast — both $13 per piece.
  {
    id: "cat_main_chicken",
    name: "CHICKEN",
    sortOrder: 5,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "$13 per piece. Items: Chicken Leg, Chicken Breast.",
    isParentCategory: false,
    parentCategoryId: "cat_main_course",
    imageUrl: "",
  },

  // --- Child: OTHERS ---
  // PDF: Chicken Fried Rice, Chicken Pasta, Chicken Schnitzel.
  //      These are NOT per-piece — each has its own individual price.
  //      Chicken Schnitzel is served with vegetable and chips specifically.
  {
    id: "cat_main_others",
    name: "OTHERS",
    sortOrder: 6,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description:
      "Individually priced chicken dishes (NOT per-piece). Items: Chicken Fried Rice, Chicken Pasta, Chicken Schnitzel. Note: Chicken Schnitzel is served with vegetable and chips.",
    isParentCategory: false,
    parentCategoryId: "cat_main_course",
    imageUrl: "",
  },

  // ============================================
  // 4. APPETIZERS
  // ============================================
  // PDF: Standalone appetizers on the food menu page.
  //      Items: Chicken Finger, Spring Rolls, Samosa, Bruschetta,
  //      Sesame Fish, Tuna Tataki, Prawns Tempura, Zanzibar Kachori.
  //      Price range: $5 – $7.
  // ============================================
  {
    id: "cat_appetizers",
    name: "APPETIZERS",
    sortOrder: 7,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 5. INDIAN CHOICE  (Parent)
  // ============================================
  // PDF: Groups Indian food into 3 sub-sections:
  //      Indian Starters, Vegetarian, Non-Vegetarian.
  //      Indian Starters appears on the same page as the main
  //      Indian section in the PDF, so it is a child here.
  // ============================================
  {
    id: "cat_indian_choice",
    name: "INDIAN CHOICE",
    sortOrder: 8,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "",
    isParentCategory: true,
    parentCategoryId: "",
    imageUrl: "",
  },

  // --- Child: INDIAN STARTERS ---
  // PDF: Chicken Seekh Kebab, Samosa, Afgani Chicken, Tandoori Chicken,
  //      Kalmi Kebab, Paneer Tikka.
  //      Presented in different cooking styles: Tandoor, Afghan, Tikka & Kalmi Kebab.
  //      Price range: $7 – $19.
  {
    id: "cat_indian_starters",
    name: "INDIAN STARTERS",
    sortOrder: 9,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description:
      "Presented in different cooking styles: Tandoor, Afghan, Tikka & Kalmi Kebab.",
    isParentCategory: false,
    parentCategoryId: "cat_indian_choice",
    imageUrl: "",
  },

  // --- Child: VEGETARIAN ---
  // PDF: Paneer Masala, Kadai Paneer, Paneer Tikka Masala,
  //      Mixed Vegetables, Bhindi Masala, Dal Tadka, Dal Makani.
  //      Price range: $7 – $9.
  {
    id: "cat_indian_vegetarian",
    name: "VEGETARIAN",
    sortOrder: 10,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "",
    isParentCategory: false,
    parentCategoryId: "cat_indian_choice",
    imageUrl: "",
  },

  // --- Child: NON-VEGETARIAN ---
  // PDF: Kadai Chicken, Punjabi Chicken, Chicken Curry, Mutton Masala,
  //      Mutton Rogan Josh, Chilli Chicken, Chicken Biryani, Chicken Fried Rice.
  //      Price range: $12 – $15.
  {
    id: "cat_indian_non_vegetarian",
    name: "NON-VEGETARIAN",
    sortOrder: 11,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "",
    isParentCategory: false,
    parentCategoryId: "cat_indian_choice",
    imageUrl: "",
  },

  // ============================================
  // 6. PIZZA
  // ============================================
  // PDF: Focaccia ($5), Margherita, Chicken, Cheese, Hawaiian,
  //      Vegetable, Seafood, Sultan Special.
  //      Price range: $5 – $15.
  // ============================================
  {
    id: "cat_pizza",
    name: "PIZZA",
    sortOrder: 12,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 7. BURGERS
  // ============================================
  // PDF: Chicken Burger, Vegetable Burger, Cheese Burger.
  //      All served with French fries & salad.
  //      Price range: $6 – $7.
  // ============================================
  {
    id: "cat_burgers",
    name: "BURGERS",
    sortOrder: 13,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "All served with French fries & salad.",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 8. SALAD
  // ============================================
  // PDF: Seafood Salad, Greek Salad, Chickpeas Salad, Chicken Caesar,
  //      Prawns & Avocado, Mixed Salad, Hot Chicken Salad.
  //      Price range: $6 – $8.
  // ============================================
  {
    id: "cat_salad",
    name: "SALAD",
    sortOrder: 14,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 9. SANDWICHES
  // ============================================
  // PDF: New York Club, Tuna, Egg, Chicken, Vegetable.
  //      All served with French fries & salad.
  //      Price range: $8 – $12.
  // ============================================
  {
    id: "cat_sandwiches",
    name: "SANDWICHES",
    sortOrder: 15,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "All served with French fries & salad.",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 10. WRAPS
  // ============================================
  // PDF: Chicken Wrap, Vegetable Wrap, Seafood Wrap.
  //      All served with French fries & salad.
  //      Price range: $8 – $10.
  // ============================================
  {
    id: "cat_wraps",
    name: "WRAPS",
    sortOrder: 16,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "All served with French fries & salad.",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 11. SWAHILI DISHES
  // ============================================
  // PDF: Fried Changu, Roast Chicken, Octopus in Coconut Sauce,
  //      Green Banana & Mutton, Zanzibar Pilau, Calamari Stew, Beans.
  //      Price range: $12 – $20.
  // ============================================
  {
    id: "cat_swahili_dishes",
    name: "SWAHILI DISHES",
    sortOrder: 17,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 12. SPECIAL ORDERS
  // ============================================
  // PDF: Sultan Special Chicken Platter ($35), Seafood Platter ($45),
  //      Lobster ($25), Jumbo Prawns ($22).
  //      All served with vegetables and choice of side.
  // ============================================
  {
    id: "cat_special_orders",
    name: "SPECIAL ORDERS",
    sortOrder: 18,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description:
      "Served with vegetables and choice of: Rice, Potato wedges, Mashed potato or French fries.",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 13. PASTA
  // ============================================
  // PDF: Spaghetti ($10), Penne ($12), Tagliatelle ($14),
  //      Linguine ($14), Seafood Pasta ($15).
  //      All served with choice of sauce.
  // ============================================
  {
    id: "cat_pasta",
    name: "PASTA",
    sortOrder: 19,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description:
      "All pasta served with either: Tomato sauce, White cream sauce or Herb sauce.",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 14. DESSERTS
  // ============================================
  // PDF: Cake of the Day, Cheesecake, Tiramisu, Chocolate Grass,
  //      Fruit Salad, Fruit Platter, Ice Cream, Rice Kheer,
  //      Gajar ka Halwa, Shahi Tukda.
  //      Price range: $6 – $10.
  // ============================================
  {
    id: "cat_desserts",
    name: "DESSERTS",
    sortOrder: 20,
    isActive: true,
    type: "food",
    availabilityType: "all_day",
    availableHoursStart: "",
    availableHoursEnd: "",
    description: "",
    isParentCategory: false,
    parentCategoryId: "",
    imageUrl: "",
  },

  // ============================================
  // 15. NIGHT FOOD MENU  (Parent)
  // ============================================
  // PDF: Separate late-night menu.
  //      Available: 11:00 PM – 2:00 AM (23:00 – 02:00).
  //      Contains 3 sub-sections: Starters, Main Dish, Dessert.
  //      Smaller menu, lower prices than the main menu.
  // ============================================
  {
    id: "cat_night_food_menu",
    name: "NIGHT FOOD MENU",
    sortOrder: 21,
    isActive: true,
    type: "food",
    availabilityType: "night",
    availableHoursStart: "23:00",
    availableHoursEnd: "02:00",
    description: "Late-night menu. Available from 11:00 PM to 2:00 AM only.",
    isParentCategory: true,
    parentCategoryId: "",
    imageUrl: "",
  },

  // --- Child: STARTER & APPETIZER (Night) ---
  // PDF: Bruschetta, Veg Samosa, Chicken Samosa,
  //      Veg Sandwich, Chicken Sandwich.
  //      Price range: $5 – $6.
  {
    id: "cat_night_starters",
    name: "STARTER & APPETIZER",
    sortOrder: 22,
    isActive: true,
    type: "food",
    availabilityType: "night",
    availableHoursStart: "23:00",
    availableHoursEnd: "02:00",
    description: "",
    isParentCategory: false,
    parentCategoryId: "cat_night_food_menu",
    imageUrl: "",
  },

  // --- Child: MAIN DISH (Night) ---
  // PDF: Chicken Curry, Chips Mayai, Plain Chips, Plain Rice,
  //      Margherita Pizza, Hawaiian Pizza.
  //      Price range: $4 – $10.
  {
    id: "cat_night_main",
    name: "MAIN DISH",
    sortOrder: 23,
    isActive: true,
    type: "food",
    availabilityType: "night",
    availableHoursStart: "23:00",
    availableHoursEnd: "02:00",
    description: "",
    isParentCategory: false,
    parentCategoryId: "cat_night_food_menu",
    imageUrl: "",
  },

  // --- Child: DESSERT (Night) ---
  // PDF: Vanilla Ice Cream, Chocolate Ice Cream,
  //      Strawberry Ice Cream, Fruit Salad.
  //      All $6 each.
  {
    id: "cat_night_dessert",
    name: "DESSERT",
    sortOrder: 24,
    isActive: true,
    type: "food",
    availabilityType: "night",
    availableHoursStart: "23:00",
    availableHoursEnd: "02:00",
    description: "",
    isParentCategory: false,
    parentCategoryId: "cat_night_food_menu",
    imageUrl: "",
  },
];

async function seedFoodCategories() {
  console.log("🚀 Starting to seed food categories...\n");
  console.log(
    `📦 Total categories: ${categories.length} (Parent: ${categories.filter((c) => c.isParentCategory).length}, Child: ${categories.filter((c) => c.parentCategoryId).length}, Standalone: ${categories.filter((c) => !c.isParentCategory && !c.parentCategoryId).length})\n`,
  );

  const now = new Date();
  const batch = db.batch();

  for (const category of categories) {
    const { id, ...categoryData } = category;

    // Create document reference with custom ID
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
        ? " (parent)"
        : "";
    console.log(`📝 Prepared: ${category.name}${parentInfo}`);
  }

  try {
    await batch.commit();
    console.log(
      `\n✅ Successfully seeded ${categories.length} food categories to '${COLLECTION_NAME}' collection!`,
    );
  } catch (error) {
    console.error("\n❌ Error seeding food categories:", error);
    process.exit(1);
  }
}

// Run the seeder
seedFoodCategories()
  .then(() => {
    console.log("\n🎉 Seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed:", error);
    process.exit(1);
  });
