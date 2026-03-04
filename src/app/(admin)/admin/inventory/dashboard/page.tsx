"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon, ChartBarIcon, CubeIcon, FireIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import PremiumLoader from '@/components/ui/PremiumLoader';
import type { ProfitLossStatement, BalanceSheet } from '@/lib/financeAnalytics';

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

const fmtNum = (n: number, decimals = 2) => n.toFixed(decimals);

// Simple inline bar chart using SVG — no external library
function BarChart({ revenue, expense }: { revenue: number; expense: number }) {
    const max = Math.max(revenue, expense, 1);
    const rPct = (revenue / max) * 100;
    const ePct = (expense / max) * 100;

    // Profit logic
    const profit = revenue - expense;
    const pPct = ((Math.abs(profit)) / max) * 100;

    return (
        <div className="flex items-end gap-6 h-64 px-4 pb-2 border-b border-gray-100 mt-4">
            {/* Revenue Bar */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
                <span className="text-xl font-bold text-green-600 mb-2">{fmt(revenue)}</span>
                <div className="w-full max-w-[80px] bg-green-500 rounded-t-md transition-all duration-700" style={{ height: revenue === 0 ? '0%' : `${Math.max(rPct, 4)}%`, maxHeight: 'calc(100% - 70px)' }} />
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-3 h-6 flex items-center justify-center">Revenue</span>
            </div>

            {/* Expense Bar */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
                <span className="text-xl font-bold text-red-600 mb-2">{fmt(expense)}</span>
                <div className="w-full max-w-[80px] bg-red-500 rounded-t-md transition-all duration-700" style={{ height: expense === 0 ? '0%' : `${Math.max(ePct, 4)}%`, maxHeight: 'calc(100% - 70px)' }} />
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-3 h-6 flex items-center justify-center">Expense</span>
            </div>

            {/* Profit Bar */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
                <span className={`text-xl font-bold mb-2 ${profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {fmt(profit)}
                </span>
                <div
                    className={`w-full max-w-[80px] rounded-t-md transition-all duration-700 ${profit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                    style={{ height: profit === 0 ? '0%' : `${Math.max(pPct, 4)}%`, maxHeight: 'calc(100% - 70px)' }}
                />
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-3 h-6 flex items-center justify-center">Profit</span>
            </div>
        </div>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon }: {
    label: string; value: string; sub?: string; color: string; icon: React.ElementType;
}) {
    return (
        <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4`}>
            <div className={`p-2.5 rounded-lg ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
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

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/insights?filter=${filter}`);
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

    const filterLabel = {
        daily: 'Last 24 Hours',
        weekly: 'Last 7 Days',
        monthly: 'Last 30 Days',
        yearly: 'Last Year',
    }[filter];

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">

            {/* ── Header ── */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Insights Dashboard</h1>
                    <p className="text-sm text-gray-500">Revenue · Expenses · Profit · Inventory Consumption</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value as any)}
                        className="block w-40 rounded-lg border-gray-200 py-2 pl-3 pr-10 text-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer border"
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
                <div className="flex justify-center py-24">
                    <PremiumLoader />
                </div>
            )}

            {error && !loading && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {data && !loading && (() => {
                const revenue = data.pl.revenue.totalRevenue;
                const expense = data.pl.expenses.totalExpenses + data.pl.cogs.totalCOGS;
                const profit = data.pl.netIncome;
                const foodCostPct = revenue > 0 ? (data.pl.cogs.totalCOGS / revenue) * 100 : 0;

                return (
                    <>
                        {/* ── Section 1: KPI Cards ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <KpiCard
                                label="Revenue"
                                value={fmt(revenue)}
                                sub={filterLabel}
                                color="bg-green-500"
                                icon={ArrowTrendingUpIcon}
                            />
                            <KpiCard
                                label="Expense"
                                value={fmt(expense)}
                                sub={`COGS: ${fmt(data.pl.cogs.totalCOGS)}`}
                                color="bg-red-500"
                                icon={ArrowTrendingDownIcon}
                            />
                            <KpiCard
                                label="Net Profit"
                                value={fmt(profit)}
                                sub={`Margin: ${fmtNum(data.pl.marginPercent)}%`}
                                color={profit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}
                                icon={ChartBarIcon}
                            />
                            <KpiCard
                                label="Orders"
                                value={String(data.totalOrders)}
                                sub={`Food Cost: ${fmtNum(foodCostPct)}%`}
                                color="bg-orange-500"
                                icon={FireIcon}
                            />
                        </div>

                        {/* ── Section 2: Revenue vs Expense Chart + Food Cost % ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Bar Chart */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Revenue vs Expense</h3>
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">{filterLabel}</span>
                                </div>
                                <div className="p-6">
                                    <BarChart revenue={revenue} expense={expense} />
                                    <div className="mt-4 grid grid-cols-3 text-center text-sm border-t border-gray-100 pt-4">
                                        <div>
                                            <p className="text-gray-400 text-xs">Gross Profit</p>
                                            <p className="font-bold text-gray-900">{fmt(data.pl.grossProfit)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Operating Expenses</p>
                                            <p className="font-bold text-gray-900">{fmt(data.pl.expenses.totalExpenses)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Food Cost %</p>
                                            <p className={`font-bold ${foodCostPct > 35 ? 'text-red-600' : 'text-green-600'}`}>
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
                                </div>
                                <div className="p-6 space-y-3 text-sm">
                                    <Row label="Room Revenue" value={fmt(data.pl.revenue.roomRevenue)} />
                                    <Row label="Service Revenue" value={fmt(data.pl.revenue.serviceRevenue)} />
                                    <div className="border-t border-gray-100 pt-3">
                                        <Row label="COGS (F&B)" value={`(${fmt(data.pl.cogs.totalCOGS)})`} valueClass="text-red-600" />
                                        <Row label="Salaries & Ops" value={`(${fmt(data.pl.expenses.operating)})`} valueClass="text-red-600" />
                                        <Row label="Marketing" value={`(${fmt(data.pl.expenses.marketing)})`} valueClass="text-red-600" />
                                        <Row label="Maintenance" value={`(${fmt(data.pl.expenses.maintenance)})`} valueClass="text-red-600" />
                                    </div>
                                    <div className="border-t-2 border-gray-200 pt-3 flex justify-between font-bold">
                                        <span>Net Income</span>
                                        <span className={profit >= 0 ? 'text-green-600' : 'text-red-500'}>{fmt(profit)}</span>
                                    </div>
                                    <div className="pt-2 space-y-1 text-xs text-gray-400">
                                        <div className="flex justify-between">
                                            <span>Inventory Stock Value</span>
                                            <span className="text-gray-700 font-medium">{fmt(data.bs.assets.inventoryValue)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pending Payables</span>
                                            <span className="text-orange-600 font-medium">{fmt(data.bs.liabilities.accountsPayable)}</span>
                                        </div>
                                        {data.lowStockCount > 0 && (
                                            <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1.5 rounded text-xs font-medium">
                                                ⚠ {data.lowStockCount} item{data.lowStockCount > 1 ? 's' : ''} below minimum stock
                                            </div>
                                        )}
                                    </div>
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
                                        ) : (
                                            data.inventoryConsumption.map((row, i) => (
                                                <tr key={row.ingredientName} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-3 text-sm text-gray-400">{i + 1}</td>
                                                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.ingredientName}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-mono text-orange-700 font-semibold">
                                                        {row.totalQuantityUsed.toFixed(3)}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-500">{row.unit || '—'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
                                                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
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
                                                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
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
