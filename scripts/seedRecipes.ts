/**
 * Recipe Seeder script
 * Reads from scripts/ingrediant.json and adds recipes to the firestore `recipes` collection
 * Run: npx tsx scripts/seedRecipes.ts
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
        console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON not set");
        process.exit(1);
    }
    const sa = JSON.parse(serviceAccountJson);
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
}

const db = getFirestore();

// Standardize category matching for inventory
function suggestCategoryName(title: string): string {
    const l = title.toLowerCase();
    if (l.includes("vegetables") || l.includes("tomato") || l.includes("onion") || l.includes("garlic") || l.includes("potato") || l.includes("capsicum") || l.includes("carrot")) return "vegetables";
    if (l.includes("chicken") || l.includes("mutton") || l.includes("beef") || l.includes("fish") || l.includes("prawn") || l.includes("tuna") || l.includes("seafood")) return "meat_seafood";
    if (l.includes("oil") || l.includes("vinegar")) return "oils_fats";
    if (l.includes("flour") || l.includes("rice") || l.includes("pasta") || l.includes("spaghetti") || l.includes("bread") || l.includes("bun") || l.includes("pizza dough")) return "dry_goods";
    if (l.includes("salt") || l.includes("pepper") || l.includes("sugar") || l.includes("cumin") || l.includes("coriander") || l.includes("turmeric") || l.includes("masala") || l.includes("herbs") || l.includes("basil")) return "spices";
    if (l.includes("milk") || l.includes("cream") || l.includes("cheese") || l.includes("butter") || l.includes("yogurt") || l.includes("ghee")) return "dairy";
    return "miscellaneous";
}


async function seedRecipes() {
    console.log("🚀 Starting Recipe Seeding...");
    const now = new Date();

    // 1. Load the ingredients JSON
    const ingrediantPath = path.join(__dirname, "ingrediant.json");
    if (!fs.existsSync(ingrediantPath)) {
        console.error(`❌ File not found: ${ingrediantPath}`);
        return;
    }
    const ingrediantsData = JSON.parse(fs.readFileSync(ingrediantPath, 'utf8'));
    const sourceRecipes = ingrediantsData.menu_items || [];
    console.log(`Loaded ${sourceRecipes.length} recipes from JSON.`);

    // 2. Fetch all menu items
    const menuItemsSnap = await db.collection("foodMenuItems").get();
    const menuItems = menuItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    console.log(`Loaded ${menuItems.length} menu items from Firestore.`);

    // 3. Fetch all inventory items
    const inventorySnap = await db.collection("inventory").get();
    const inventoryItems = inventorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    console.log(`Loaded ${inventoryItems.length} inventory items from Firestore.`);

    let createdRecipesCount = 0;
    let createdInventoryItemCount = 0;

    for (const sourceRecipe of sourceRecipes) {
        // Require an id field in the JSON
        if (!sourceRecipe.id) {
            console.warn(`⚠️ Skipped: No id field for "${sourceRecipe.name}"`);
            continue;
        }

        // Try to match the source recipe name with a menu item
        const sourceNameNormalized = sourceRecipe.name.toLowerCase().trim().replace(" (combo)", "");

        const matchingMenuItem = menuItems.find(mi => {
            const miNameNormalized = mi.name.toLowerCase().trim().replace(" (combo)", "");
            return miNameNormalized === sourceNameNormalized;
        });

        if (!matchingMenuItem) {
            console.warn(`⚠️ Skipped: Could not find matching Menu Item for "${sourceRecipe.name}" (id: ${sourceRecipe.id})`);
            continue;
        }

        console.log(`\nProcessing Recipe for: ${matchingMenuItem.name}`);

        const recipeIngredients = [];
        let totalCost = 0;

        for (const ingredient of sourceRecipe.ingredients) {
            let invItem = inventoryItems.find(i => i.name.toLowerCase() === ingredient.name.toLowerCase());

            if (!invItem) {
                // We need to create the inventory item!
                console.log(`   ➕ Creating new Inventory Item: ${ingredient.name}`);

                // create a temporary new doc ref so we can get its ID immediately
                const newInvRef = db.collection("inventory").doc();
                const newInvData = {
                    name: ingredient.name,
                    sku: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Basic random SKU
                    category: suggestCategoryName(ingredient.name),
                    unit: ingredient.unit || "pcs",
                    unitCost: 0, // No cost provided in JSON, default to 0
                    currentStock: 0,
                    minLevel: 10,
                    maxLevel: 100,
                    reorderPoint: 20,
                    totalValue: 0,
                    isActive: true,
                    description: `Created automatically by Recipe Seeder`,
                    stockByLocation: {
                        main_store: 0,
                        kitchen: 0
                    },
                    createdAt: now,
                    updatedAt: now
                };

                await newInvRef.set(newInvData);

                invItem = { id: newInvRef.id, ...newInvData };
                inventoryItems.push(invItem); // Add so next iteration can reuse it
                createdInventoryItemCount++;
            }

            const costPerUnit = invItem.unitCost || 0;
            const ingredientTotalCost = (ingredient.quantity * costPerUnit);
            totalCost += ingredientTotalCost;

            recipeIngredients.push({
                inventoryItemId: invItem.id,
                inventoryItemName: invItem.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                costPerUnit: costPerUnit,
                totalCost: ingredientTotalCost
            });
        }

        // Now save the Recipe to Firestore
        const sellingPrice = matchingMenuItem.basePrice || matchingMenuItem.price || 0;
        const foodCostPercentage = sellingPrice ? (totalCost / sellingPrice) * 100 : 0;

        // Check if recipe already exists using the deterministic document ID

        const recipeData = {
            id: sourceRecipe.id,
            menuItemId: matchingMenuItem.id,
            menuItemName: matchingMenuItem.name,
            ingredients: recipeIngredients,
            totalCost: totalCost,
            sellingPrice: sellingPrice,
            foodCostPercentage: foodCostPercentage,
            isActive: true,
            updatedAt: now,
        };

        // Use the JSON id as the Firestore document ID for deterministic, predictable IDs
        const recipeRef = db.collection("recipes").doc(sourceRecipe.id);
        const existingDoc = await recipeRef.get();

        if (!existingDoc.exists) {
            await recipeRef.set({
                ...recipeData,
                createdAt: now
            });
            console.log(`   ✅ Created recipe [${sourceRecipe.id}] for ${matchingMenuItem.name}`);
        } else {
            await recipeRef.update(recipeData);
            console.log(`   🔄 Updated recipe [${sourceRecipe.id}] for ${matchingMenuItem.name}`);
        }
        createdRecipesCount++;
    }

    console.log(`\n🎉 Seeding Complete!`);
    console.log(`Total new inventory items created: ${createdInventoryItemCount}`);
    console.log(`Total recipes processed: ${createdRecipesCount}`);
}

seedRecipes().catch(console.error);
