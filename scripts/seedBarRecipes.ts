/**
 * Bar Recipe Seeder script
 * Reads from scripts/bar_ingrediant.json and adds bar recipes to the Firestore `recipes` collection
 * Run: npx tsx scripts/seedBarRecipes.ts
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

// Suggest inventory category for bar ingredients
function suggestBarCategoryName(name: string): string {
    const l = name.toLowerCase();
    if (l.includes("vodka") || l.includes("gin") || l.includes("rum") || l.includes("tequila") || l.includes("whiskey") || l.includes("konyagi") || l.includes("safari") || l.includes("cachaca")) return "spirits";
    if (l.includes("wine") || l.includes("prosecco") || l.includes("brut") || l.includes("sauvignon") || l.includes("merlot") || l.includes("chenin") || l.includes("chardonnay") || l.includes("shiraz") || l.includes("pinot") || l.includes("cabernet")) return "wines";
    if (l.includes("beer") || l.includes("lager") || l.includes("cider")) return "beers";
    if (l.includes("liqueur") || l.includes("amaretto") || l.includes("kahlua") || l.includes("campari") || l.includes("aperol") || l.includes("triple sec") || l.includes("curacao") || l.includes("limoncello") || l.includes("tia maria") || l.includes("bols") || l.includes("jager") || l.includes("amarula") || l.includes("creme de")) return "liqueurs";
    if (l.includes("juice") || l.includes("pineapple") || l.includes("orange") || l.includes("cranberry") || l.includes("mango") || l.includes("passion fruit")) return "juices";
    if (l.includes("milk") || l.includes("cream") || l.includes("coconut cream")) return "dairy";
    if (l.includes("syrup") || l.includes("grenadine") || l.includes("honey")) return "syrups_sweeteners";
    if (l.includes("soda") || l.includes("tonic") || l.includes("sprite") || l.includes("cola") || l.includes("ginger beer") || l.includes("ginger soda") || l.includes("sparkling")) return "soft_drinks";
    if (l.includes("tea") || l.includes("coffee") || l.includes("espresso")) return "beverages_non_alcoholic";
    if (l.includes("ice cream")) return "dairy";
    if (l.includes("mint") || l.includes("lime") || l.includes("lemon") || l.includes("orange peel") || l.includes("cucumber") || l.includes("ginger") || l.includes("banana") || l.includes("mango") || l.includes("apple") || l.includes("avocado") || l.includes("pineapple") || l.includes("spinach")) return "fresh_produce";
    if (l.includes("shisha") || l.includes("tobacco") || l.includes("charcoal") || l.includes("foil")) return "hookah_supplies";
    if (l.includes("salt") || l.includes("sugar") || l.includes("egg")) return "dry_goods";
    return "bar_miscellaneous";
}

async function seedBarRecipes() {
    console.log("🍹 Starting Bar Recipe Seeding...");
    const now = new Date();

    // 1. Load the bar ingredients JSON
    const ingrediantPath = path.join(__dirname, "bar_ingrediant.json");
    if (!fs.existsSync(ingrediantPath)) {
        console.error(`❌ File not found: ${ingrediantPath}`);
        return;
    }
    const ingrediantsData = JSON.parse(fs.readFileSync(ingrediantPath, "utf8"));
    const sourceRecipes = ingrediantsData.menu_items || [];
    console.log(`Loaded ${sourceRecipes.length} bar recipes from JSON.`);

    // 2. Fetch all bar menu items
    const menuItemsSnap = await db.collection("barMenuItems").get();
    const menuItems = menuItemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    console.log(`Loaded ${menuItems.length} bar menu items from Firestore.`);

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

        // Match the source recipe name with a bar menu item
        const sourceNameNormalized = sourceRecipe.name.toLowerCase().trim();

        const matchingMenuItem = menuItems.find(mi => {
            return mi.name.toLowerCase().trim() === sourceNameNormalized;
        });

        if (!matchingMenuItem) {
            console.warn(`⚠️ Skipped: Could not find matching Bar Menu Item for "${sourceRecipe.name}" (id: ${sourceRecipe.id})`);
            continue;
        }

        console.log(`\nProcessing Recipe for: ${matchingMenuItem.name}`);

        const recipeIngredients = [];
        let totalCost = 0;

        for (const ingredient of sourceRecipe.ingredients) {
            let invItem = inventoryItems.find(i => i.name.toLowerCase() === ingredient.name.toLowerCase());

            if (!invItem) {
                console.log(`   ➕ Creating new Inventory Item: ${ingredient.name}`);

                const newInvRef = db.collection("inventory").doc();
                const newInvData = {
                    name: ingredient.name,
                    sku: `BAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    category: suggestBarCategoryName(ingredient.name),
                    unit: ingredient.unit || "ml",
                    unitCost: 0,
                    currentStock: 0,
                    minLevel: 10,
                    maxLevel: 100,
                    reorderPoint: 20,
                    totalValue: 0,
                    isActive: true,
                    description: `Created automatically by Bar Recipe Seeder`,
                    stockByLocation: {
                        main_store: 0,
                        bar: 0
                    },
                    createdAt: now,
                    updatedAt: now
                };

                await newInvRef.set(newInvData);
                invItem = { id: newInvRef.id, ...newInvData };
                inventoryItems.push(invItem);
                createdInventoryItemCount++;
            }

            const costPerUnit = invItem.unitCost || 0;
            const ingredientTotalCost = ingredient.quantity * costPerUnit;
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

        const sellingPrice = matchingMenuItem.basePrice || matchingMenuItem.price || 0;
        const foodCostPercentage = sellingPrice ? (totalCost / sellingPrice) * 100 : 0;

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

    console.log(`\n🎉 Bar Seeding Complete!`);
    console.log(`Total new inventory items created: ${createdInventoryItemCount}`);
    console.log(`Total bar recipes processed: ${createdRecipesCount}`);
}

seedBarRecipes().catch(console.error);
