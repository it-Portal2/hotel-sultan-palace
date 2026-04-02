"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon, ChartBarIcon, CubeIcon, FireIcon, TrophyIcon, ExclamationTriangleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import DashboardSkeleton from '@/components/admin/inventory/DashboardSkeleton';
import type { ProfitLossStatement, BalanceSheet } from '@/lib/financeAnalytics';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';

// ── Types for API response ────────────────────────────────────────────────────
interface DishStat { name: string; qty: number; revenue: number; }
interface ConsumptionRow { ingredientName: string; totalQuantityUsed: number; unit: string; }
interface InsightsData {
    pl: ProfitLossStatement;
    bs: BalanceSheet;
    totalOrders: number;
    topDishes: DishStat[];
    highestRevenueDish: DishStat | null;
    inventoryConsumption: ConsumptionRow[];
    mostConsumedIngredient: ConsumptionRow[];
    lowStockCount: number;
    dateRange: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtNum = (n: number | undefined | null, decimals = 2) => (n ?? 0).toFixed(decimals);

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ revenue, cogs, profit }: { revenue: number; cogs: number; profit: number }) {
    const max = Math.max(revenue, cogs, Math.abs(profit), 1);
    const rPct = (revenue / max) * 100;
    const cPct = (cogs / max) * 100;
    const pPct = (Math.abs(profit) / max) * 100;

    return (
        <div className="flex items-end gap-6 h-60 px-4 pb-2 border-b border-gray-100 mt-4">
            {/* Revenue Bar */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
                <span className="text-xl font-bold text-green-600 mb-2">{fmt(revenue)}</span>
                <div
                    className="w-full max-w-[80px] bg-green-500 rounded-t-lg transition-all duration-700"
                    style={{ height: revenue === 0 ? '0%' : `${Math.max(rPct, 4)}%`, maxHeight: 'calc(100% - 70px)' }}
                />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-3">Revenue</span>
            </div>

            {/* COGS Bar */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
                <span className="text-xl font-bold text-red-500 mb-2">{fmt(cogs)}</span>
                <div
                    className="w-full max-w-[80px] bg-red-400 rounded-t-lg transition-all duration-700"
                    style={{ height: cogs === 0 ? '0%' : `${Math.max(cPct, 4)}%`, maxHeight: 'calc(100% - 70px)' }}
                />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-3">COGS</span>
            </div>

            {/* Profit Bar */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
                <span className={`text-xl font-bold mb-2 ${profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {fmt(profit)}
                </span>
                <div
                    className={`w-full max-w-[80px] rounded-t-lg transition-all duration-700 ${profit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                    style={{ height: profit === 0 ? '0%' : `${Math.max(pPct, 4)}%`, maxHeight: 'calc(100% - 70px)' }}
                />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-3">Profit</span>
            </div>
        </div>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, iconBg, icon: Icon }: {
    label: string; value: string; sub?: string; iconBg: string; icon: React.ElementType;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div className={`p-2.5 rounded-lg ${iconBg} shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function InsightsDashboardPage() {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [consumptionPage, setConsumptionPage] = useState(1);
    const CONSUMPTION_PAGE_SIZE = 10;


    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const user = getAuth().currentUser;
            if (!user) throw new Error('Not authenticated. Please sign in.');
            const token = await user.getIdToken();
            const res = await fetch(`/api/v1/insights?filter=${filter}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch insights');
            const json = await res.json();
            setData(json);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setConsumptionPage(1); }, [filter]);


    const filterLabel = {
        daily: 'Last 24 Hours',
        weekly: 'Last 7 Days',
        monthly: 'Last 30 Days',
        yearly: 'Last Year',
    }[filter];

    return (
        <div className="min-h-screen bg-gray-50/60 p-6 space-y-6">

            {/* ── Header ── */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Insights Dashboard</h1>
                    <p className="text-sm text-gray-400">Revenue · COGS · Profit · Inventory Consumption</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value as any)}
                        className="block w-40 rounded-lg border border-gray-200 py-2 pl-3 pr-10 text-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer"
                    >
                        <option value="daily">Last 24 Hours</option>
                        <option value="weekly">Last 7 Days</option>
                        <option value="monthly">Last 30 Days</option>
                        <option value="yearly">Last Year</option>
                    </select>
                    <button
                        onClick={load}
                        className="p-2 hover:bg-orange-50 text-gray-400 hover:text-orange-500 rounded-full transition-colors"
                        title="Refresh"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* ── Loading / Error ── */}
            {loading && (
                <DashboardSkeleton />
            )}

            {error && !loading && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {data && !loading && (() => {
                // ── Core Calculations ──
                // Revenue = POS service revenue (+ room revenue if any)
                const revenue = data.pl.revenue.totalRevenue;
                // Expense = COGS only (food & beverage cost — no operational expenses)
                const cogs = data.pl.cogs.totalCOGS;
                // Profit = Revenue - COGS
                const profit = revenue - cogs;
                // Food Cost % = COGS / Revenue × 100
                const foodCostPct = revenue > 0 ? (cogs / revenue) * 100 : 0;

                const foodCostColor =
                    foodCostPct < 25 ? 'text-green-600' :
                        foodCostPct <= 35 ? 'text-yellow-600' :
                            'text-red-600';

                const foodCostBg =
                    foodCostPct < 25 ? 'bg-green-50 border-green-200 text-green-700' :
                        foodCostPct <= 35 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                            'bg-red-50 border-red-200 text-red-700';

                return (
                    <>
                        {/* ── Section 1: KPI Cards ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <KpiCard
                                label="Revenue"
                                value={fmt(revenue)}
                                sub={filterLabel}
                                iconBg="bg-green-500"
                                icon={ArrowTrendingUpIcon}
                            />
                            <KpiCard
                                label="Expense (COGS)"
                                value={fmt(cogs)}
                                sub="Food & Beverage Cost"
                                iconBg="bg-red-500"
                                icon={ArrowTrendingDownIcon}
                            />
                            <KpiCard
                                label="Net Profit"
                                value={fmt(profit)}
                                sub={`Margin: ${fmtNum(revenue > 0 ? (profit / revenue) * 100 : 0)}%`}
                                iconBg={profit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}
                                icon={ChartBarIcon}
                            />
                            <KpiCard
                                label="Orders"
                                value={String(data.totalOrders)}
                                sub={`Food Cost: ${fmtNum(foodCostPct)}%`}
                                iconBg="bg-orange-500"
                                icon={FireIcon}
                            />
                        </div>

                        {/* ── Section 2: Chart + P&L Snapshot ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Bar Chart */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Revenue / COGS / Profit Overview</h3>
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">{filterLabel}</span>
                                </div>
                                <div className="p-6">
                                    <BarChart revenue={revenue} cogs={cogs} profit={profit} />

                                    {/* Summary Row */}
                                    <div className="mt-4 grid grid-cols-2 text-center text-sm border-t border-gray-100 pt-4 gap-4">
                                        <div>
                                            <p className="text-gray-400 text-xs mb-0.5">Net Profit</p>
                                            <p className={`font-bold text-base ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(profit)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs mb-0.5">Food Cost %</p>
                                            <p className={`font-bold text-base ${foodCostColor}`}>
                                                {fmtNum(foodCostPct)}%
                                            </p>
                                        </div>
                                    </div>


                                </div>
                            </div>

                            {/* P&L Snapshot */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-800">P&L Snapshot</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{filterLabel}</p>
                                </div>
                                <div className="p-6 space-y-2.5 text-sm">

                                    {/* Revenue */}
                                    {data.pl.revenue.roomRevenue > 0 && (
                                        <Row label="Room Revenue" value={fmt(data.pl.revenue.roomRevenue)} />
                                    )}
                                    <Row label="Service Revenue" value={fmt(data.pl.revenue.serviceRevenue)} />

                                    {/* Divider */}
                                    <div className="border-t border-dashed border-gray-200 pt-2.5">
                                        <Row
                                            label="COGS (F&B)"
                                            value={`(${fmt(cogs)})`}
                                            valueClass="text-red-500 font-semibold"
                                        />
                                    </div>

                                    {/* Net Income */}
                                    <div className="border-t-2 border-gray-800 pt-3 flex justify-between font-bold text-base">
                                        <span className="text-gray-800">Net Income</span>
                                        <span className={profit >= 0 ? 'text-green-600' : 'text-red-500'}>{fmt(profit)}</span>
                                    </div>

                                    {/* Balance Sheet Info */}
                                    <div className="pt-3 space-y-1.5 text-xs text-gray-400 border-t border-gray-100">
                                        <div className="flex justify-between">
                                            <span>Inventory Stock Value</span>
                                            <span className="text-gray-700 font-medium">{fmt(data.bs.assets.inventoryValue)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pending Payables</span>
                                            <span className="text-orange-600 font-medium">{fmt(data.bs.liabilities.accountsPayable)}</span>
                                        </div>
                                    </div>

                                    {/* Inventory Alert */}
                                    {data.lowStockCount > 0 && (
                                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                                            <div className="flex items-center gap-2 text-yellow-800 font-semibold text-xs">
                                                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 shrink-0" />
                                                Inventory Alert
                                            </div>
                                            <p className="text-xs text-yellow-700">
                                                {data.lowStockCount} ingredient{data.lowStockCount > 1 ? 's' : ''} below minimum stock level
                                            </p>
                                            <Link
                                                href="/admin/inventory"
                                                className="inline-flex items-center text-xs font-semibold text-yellow-800 underline underline-offset-2 hover:text-yellow-900"
                                            >
                                                View Inventory →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Inventory Consumption Table ── */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <CubeIcon className="w-5 h-5 text-gray-500" />
                                    <h3 className="font-bold text-gray-800">Inventory Consumption</h3>
                                </div>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                    Based on sales deductions from existing transactions
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 text-left tracking-wider">#</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Ingredient / Item</th>
                                            <th className="px-6 py-3 text-right tracking-wider">Consumed</th>
                                            <th className="px-6 py-3 text-left tracking-wider">Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.inventoryConsumption.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                                                    No consumption data yet. Transactions appear when orders are fulfilled.
                                                </td>
                                            </tr>
                                        ) : (() => {
                                            const total = data.inventoryConsumption.length;
                                            const totalPages = Math.ceil(total / CONSUMPTION_PAGE_SIZE);
                                            const startIdx = (consumptionPage - 1) * CONSUMPTION_PAGE_SIZE;
                                            const paginated = data.inventoryConsumption.slice(startIdx, startIdx + CONSUMPTION_PAGE_SIZE);

                                            return (
                                                <>
                                                    {paginated.map((row, i) => (
                                                        <tr key={row.ingredientName} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-3 text-sm text-gray-400">{startIdx + i + 1}</td>
                                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.ingredientName}</td>
                                                            <td className="px-6 py-3 text-sm text-right font-mono text-orange-700 font-semibold">
                                                                {row.totalQuantityUsed.toFixed(3)}
                                                            </td>
                                                            <td className="px-6 py-3 text-sm text-gray-500">{row.unit || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {data.inventoryConsumption.length > CONSUMPTION_PAGE_SIZE && (
                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                        Showing {(consumptionPage - 1) * CONSUMPTION_PAGE_SIZE + 1} to {Math.min(consumptionPage * CONSUMPTION_PAGE_SIZE, data.inventoryConsumption.length)} of {data.inventoryConsumption.length} items
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            disabled={consumptionPage === 1}
                                            onClick={() => setConsumptionPage(p => Math.max(1, p - 1))}
                                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-500 hover:border-orange-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeftIcon className="w-4 h-4" />
                                        </button>
                                        
                                        {(() => {
                                            const totalPages = Math.ceil(data.inventoryConsumption.length / CONSUMPTION_PAGE_SIZE);
                                            return Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setConsumptionPage(p)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${consumptionPage === p 
                                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-100' 
                                                        : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-200 hover:text-orange-500'}`}
                                                >
                                                    {p}
                                                </button>
                                            ));
                                        })()}

                                        <button
                                            disabled={consumptionPage >= Math.ceil(data.inventoryConsumption.length / CONSUMPTION_PAGE_SIZE)}
                                            onClick={() => setConsumptionPage(p => Math.min(Math.ceil(data.inventoryConsumption.length / CONSUMPTION_PAGE_SIZE), p + 1))}
                                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-orange-500 hover:border-orange-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* ── Section 4: Top Analytics ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">

                            {/* Top 5 Dishes by Quantity */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                    <FireIcon className="w-5 h-5 text-orange-500" />
                                    <h3 className="font-bold text-gray-800">Top 5 by Quantity</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {data.topDishes.length === 0
                                        ? <EmptyState label="No order data" />
                                        : data.topDishes.map((d, i) => (
                                            <div key={d.name} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0
                                                        ${i === 0 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{d.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-orange-600 ml-2 shrink-0">{d.qty} pcs</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {/* Most Consumed Ingredient */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                    <CubeIcon className="w-5 h-5 text-blue-500" />
                                    <h3 className="font-bold text-gray-800">Most Consumed Ingredients</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {data.mostConsumedIngredient.length === 0
                                        ? <EmptyState label="No consumption data" />
                                        : data.mostConsumedIngredient.map((d, i) => (
                                            <div key={d.ingredientName} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0
                                                        ${i === 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">{d.ingredientName}</span>
                                                </div>
                                                <span className="text-sm font-bold text-blue-600 ml-2 shrink-0">
                                                    {d.totalQuantityUsed.toFixed(2)} {d.unit}
                                                </span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {/* Highest Revenue Dish */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                    <TrophyIcon className="w-5 h-5 text-yellow-500" />
                                    <h3 className="font-bold text-gray-800">Highest Revenue Dish</h3>
                                </div>
                                {data.highestRevenueDish
                                    ? (
                                        <div className="p-6 text-center space-y-3">
                                            <div className="w-16 h-16 rounded-full bg-yellow-50 border-2 border-yellow-400 flex items-center justify-center mx-auto">
                                                <TrophyIcon className="w-8 h-8 text-yellow-500" />
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">{data.highestRevenueDish.name}</p>
                                            <p className="text-2xl font-bold text-green-600">{fmt(data.highestRevenueDish.revenue)}</p>
                                            <p className="text-xs text-gray-400">{data.highestRevenueDish.qty} orders placed</p>
                                        </div>
                                    )
                                    : <EmptyState label="No revenue data" />
                                }

                                {/* Top 5 by Revenue list */}
                                {data.topDishes.length > 0 && (
                                    <>
                                        <div className="px-6 pb-1 pt-2 text-xs text-gray-400 uppercase tracking-widest font-semibold">
                                            Top 5 by Revenue
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {[...data.topDishes]
                                                .sort((a, b) => b.revenue - a.revenue)
                                                .slice(0, 5)
                                                .map((d, i) => (
                                                    <div key={d.name} className="px-6 py-2 flex items-center justify-between hover:bg-gray-50 text-sm">
                                                        <span className="text-gray-600 truncate max-w-[160px]">{i + 1}. {d.name}</span>
                                                        <span className="font-semibold text-green-600 ml-2 shrink-0">{fmt(d.revenue)}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                );
            })()}
        </div>
    );
}

// ── Helper sub-components ─────────────────────────────────────────────────────
const Row = ({ label, value, valueClass = 'text-gray-700' }: { label: string; value: string; valueClass?: string }) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-500">{label}</span>
        <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
);

const EmptyState = ({ label }: { label: string }) => (
    <div className="px-6 py-8 text-center text-sm text-gray-400">{label}</div>
);
