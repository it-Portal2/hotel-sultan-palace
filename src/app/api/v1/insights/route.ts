import { NextRequest, NextResponse } from 'next/server';
import { getProfitLossStatement, getBalanceSheet } from '@/lib/financeAnalytics';
import { getFoodOrdersByDateRange } from '@/lib/services/fbOrderService';
import type { FoodOrder } from '@/lib/services/fbOrderService';
import { getInventoryItems } from '@/lib/inventoryService';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Recipe } from '@/lib/firestoreService';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
    // ── Authentication Guard ──────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        await getAdminAuth().verifyIdToken(idToken);
    } catch {
        return NextResponse.json({ error: 'Unauthorized: invalid or expired token' }, { status: 401 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    try {
        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'monthly';

        // Phase 4: Date Filter Validation (Strict Bounds)
        const endDate = new Date();
        const startDate = new Date();
        if (filter === 'daily') startDate.setDate(endDate.getDate() - 1);
        else if (filter === 'weekly') startDate.setDate(endDate.getDate() - 7);
        else if (filter === 'monthly') startDate.setMonth(endDate.getMonth() - 1);
        else startDate.setFullYear(endDate.getFullYear() - 1); // yearly

        // Valid terminal statuses for completed/settled F&B sales
        const validStatuses: Array<FoodOrder['status']> = ['settled', 'delivered'];

        // Firestore-filtered fetch: only documents in the date range with a valid status
        const [pl, bs, foodOrders, barOrders, inventoryItems, recipesSnap] = await Promise.all([
            getProfitLossStatement(startDate, endDate),
            getBalanceSheet(),
            getFoodOrdersByDateRange(startDate, endDate, validStatuses, 'food'),
            getFoodOrdersByDateRange(startDate, endDate, validStatuses, 'bar'),
            getInventoryItems(),
            getDocs(collection(db!, 'recipes'))
        ]);

        const recipes = recipesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Recipe));
        const recipeMapByMenuId = new Map<string, Recipe>();
        recipes.forEach(r => recipeMapByMenuId.set(r.menuItemId, r));

        const inventoryItemMap = new Map<string, any>();
        inventoryItems.forEach(i => inventoryItemMap.set(i.id, i));

        // Orders are already date+status filtered by Firestore
        const filteredOrders = [...foodOrders, ...barOrders];

        // If 0 F&B orders in range, F&B figures are zero but real operating expenses still apply
        if (filteredOrders.length === 0) {
            return NextResponse.json({
                pl: {
                    ...pl,
                    revenue: { totalRevenue: 0, serviceRevenue: 0, roomRevenue: 0 },
                    cogs: { totalCOGS: 0, inventoryOrFoodCost: 0 },
                    grossProfit: 0,
                    expenses: pl.expenses, // real operating expenses — never overwrite with zeros
                    netIncome: -(pl.expenses.totalExpenses),
                    marginPercent: 0
                },
                fbRevenue: 0,
                fbCOGS: 0,
                fbProfit: 0,
                foodCostPct: 0,
                bs,
                totalOrders: 0,
                topDishes: [],
                highestRevenueDish: null,
                inventoryConsumption: [],
                mostConsumedIngredient: [],
                lowStockCount: inventoryItems.filter(i => (i.currentStock || 0) <= (i.minStockLevel || 0)).length,
                dateRange: filter,
            });
        }

        const totalOrders = filteredOrders.length;

        // Phase 2, Step 2: Revenue = Σ order.totalAmount
        const fbRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        let fbCOGS = 0;
        const consumptionMap = new Map<string, { qty: number; unit: string; cost: number; name: string }>();
        const dishMap = new Map<string, { qty: number; revenue: number }>();

        for (const order of filteredOrders) {
            for (const item of order.items) {
                // Tracking Top Dishes Analytics
                const dKey = item.name;
                const dExisting = dishMap.get(dKey) || { qty: 0, revenue: 0 };
                dExisting.qty += item.quantity;
                dExisting.revenue += item.price * item.quantity;
                dishMap.set(dKey, dExisting);

                // Phase 2, Step 3: Calculate strict COGS and Phase 3: real Inventory Consumption
                const recipe = recipeMapByMenuId.get(item.menuItemId || '');
                if (recipe && recipe.ingredients) {
                    for (const ing of recipe.ingredients) {
                        const invItem = inventoryItemMap.get(ing.inventoryItemId);
                        const unitCost = invItem?.unitCost || 0;
                        const qtyUsed = ing.quantity * item.quantity;
                        const cost = qtyUsed * unitCost;

                        fbCOGS += cost;

                        // Map realistic consumption directly linked to sale
                        const cKey = ing.inventoryItemId;
                        const cExisting = consumptionMap.get(cKey) || {
                            qty: 0,
                            unit: invItem?.unit || ing.unit || '',
                            cost: 0,
                            name: invItem?.name || ing.inventoryItemName || 'Unknown Ingredient'
                        };
                        cExisting.qty += qtyUsed;
                        cExisting.cost += cost;
                        consumptionMap.set(cKey, cExisting);
                    }
                }
            }
        }

        // Phase 2, Step 4: Profit = Revenue - COGS
        const fbProfit = fbRevenue - fbCOGS;
        const foodCostPct = fbRevenue > 0 ? (fbCOGS / fbRevenue) * 100 : 0;

        // Top Analytics Sorts
        const topDishes = Array.from(dishMap.entries())
            .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        const highestRevenueDish = Array.from(dishMap.entries())
            .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 1)[0] || null;

        const inventoryConsumption = Array.from(consumptionMap.values())
            .map(v => ({
                ingredientName: v.name,
                totalQuantityUsed: parseFloat(v.qty.toFixed(3)),
                unit: v.unit,
                costConsumed: parseFloat(v.cost.toFixed(2))
            }))
            .sort((a, b) => b.totalQuantityUsed - a.totalQuantityUsed);

        const mostConsumedIngredient = inventoryConsumption.slice(0, 5);
        const lowStockCount = inventoryItems.filter(i => (i.currentStock || 0) <= (i.minStockLevel || 0)).length;

        return NextResponse.json({
            pl: {
                ...pl,
                revenue: {
                    ...pl.revenue,
                    totalRevenue: fbRevenue,
                    serviceRevenue: fbRevenue, // F&B revenue only
                    roomRevenue: 0 // Do not mix booking revenue into F&B specific view
                },
                cogs: {
                    totalCOGS: fbCOGS,
                    inventoryOrFoodCost: fbCOGS
                },
                grossProfit: fbProfit,
                expenses: pl.expenses, // real operating expenses from P&L service
                netIncome: fbProfit - pl.expenses.totalExpenses,
                marginPercent: fbRevenue > 0 ? ((fbProfit - pl.expenses.totalExpenses) / fbRevenue) * 100 : 0
            },
            fbRevenue,
            fbCOGS,
            fbProfit,
            foodCostPct,
            bs,
            totalOrders,
            topDishes,
            highestRevenueDish,
            inventoryConsumption,
            mostConsumedIngredient,
            lowStockCount,
            dateRange: filter,
        });
    } catch (error: any) {
        console.error('[Insights API] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to load insights' }, { status: 500 });
    }
}
