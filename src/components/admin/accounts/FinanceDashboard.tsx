import React from 'react';
import type { ProfitLossStatement, BalanceSheet } from '@/lib/financeAnalytics';
import { formatCurrency } from '@/lib/currency';

interface FinanceDashboardProps {
    pl: ProfitLossStatement | null;
    bs: BalanceSheet | null;
    loading: boolean;
    dateRange: string;
    currencySettings: {
        baseCurrency: string;
        rates: Record<string, number>;
    };
}

export default function FinanceDashboard({ pl, bs, loading, dateRange, currencySettings }: FinanceDashboardProps) {
    if (loading) {
        return <div className="p-12 text-center text-gray-400">Loading Financial Data...</div>;
    }

    if (!pl || !bs) {
        return <div className="p-12 text-center text-gray-400">No data available for this period.</div>;
    }

    // Helper to format using the settings
    const fmt = (val: number) => formatCurrency(val, currencySettings.baseCurrency, currencySettings.rates, 'USD');
    // Note: The 'baseSettingCurrency' arg in formatCurrency is the one defined in DB as "1.00".
    // We assume the DB setting 'baseCurrency' IS the "1.00" currency. 
    // And that's also what we want to Display by default? 
    // Actually, usually users set "Base Currency" as "USD" meaning they want to SEE USD. 
    // And the Rates are "1 USD = 2500 TZS". 
    // So if TZS is data, we convert to USD.

    // Colors
    const isPositive = pl.netIncome >= 0;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Net Income</h4>
                    <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        {fmt(pl.netIncome)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Margin: {pl.marginPercent.toFixed(1)}%</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Revenue</h4>
                    <div className="text-2xl font-bold text-gray-900">
                        {fmt(pl.revenue.totalRevenue)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Rooms: {fmt(pl.revenue.roomRevenue)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cash on Hand</h4>
                    <div className="text-2xl font-bold text-blue-600">
                        {fmt(bs.assets.cashAndEquivalents)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Liquid Assets</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payables (AP)</h4>
                    <div className="text-2xl font-bold text-orange-500">
                        {fmt(bs.liabilities.accountsPayable)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Outstanding Vendor Bills</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Profit & Loss Statement */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Profit & Loss Statement</h3>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">{dateRange}</span>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Revenue Section */}
                        <div>
                            <div className="flex justify-between font-semibold text-gray-700 mb-2">
                                <span>Revenue</span>
                            </div>
                            <div className="pl-4 space-y-1 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Room Revenue</span>
                                    <span>{fmt(pl.revenue.roomRevenue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Service & F&B Revenue</span>
                                    <span>{fmt(pl.revenue.serviceRevenue)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 mt-1 pt-1">
                                    <span>Total Value</span>
                                    <span>{fmt(pl.revenue.totalRevenue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* COGS */}
                        <div>
                            <div className="flex justify-between font-semibold text-gray-700 mb-2">
                                <span>Cost of Goods Sold (COGS)</span>
                            </div>
                            <div className="pl-4 space-y-1 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>F&B / Inventory Cost</span>
                                    <span>({fmt(pl.cogs.inventoryOrFoodCost)})</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 mt-1 pt-1">
                                    <span>Gross Profit</span>
                                    <span>{fmt(pl.grossProfit)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div>
                            <div className="flex justify-between font-semibold text-gray-700 mb-2">
                                <span>Operating Expenses</span>
                            </div>
                            <div className="pl-4 space-y-1 text-sm text-gray-600">
                                <Row label="Salaries & Operations" value={pl.expenses.operating} fmt={fmt} />
                                <Row label="Marketing" value={pl.expenses.marketing} fmt={fmt} />
                                <Row label="Maintenance" value={pl.expenses.maintenance} fmt={fmt} />
                                <Row label="Admin & Other" value={pl.expenses.administrative + pl.expenses.other} fmt={fmt} />
                                <div className="flex justify-between font-bold text-red-600 border-t border-gray-100 mt-1 pt-1">
                                    <span>Total Expenses</span>
                                    <span>({fmt(pl.expenses.totalExpenses)})</span>
                                </div>
                            </div>
                        </div>

                        {/* Net Income */}
                        <div className="border-t-2 border-gray-100 pt-3 flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">Net Income</span>
                            <span className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                {fmt(pl.netIncome)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Balance Sheet */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Balance Sheet</h3>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">As of Today</span>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Assets */}
                        <div>
                            <div className="flex justify-between font-bold text-blue-700 mb-3 border-b border-blue-100 pb-1">
                                <span>ASSETS</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <Row label="Cash & Equivalents" value={bs.assets.cashAndEquivalents} fmt={fmt} />
                                <Row label="Accounts Receivable (Pending Invoices)" value={bs.assets.accountsReceivable} fmt={fmt} />
                                <Row label="Inventory Value (Stock)" value={bs.assets.inventoryValue} fmt={fmt} />
                                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                                    <span>Total Assets</span>
                                    <span>{fmt(bs.assets.totalAssets)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Liabilities */}
                        <div>
                            <div className="flex justify-between font-bold text-red-700 mb-3 border-b border-red-100 pb-1">
                                <span>LIABILITIES</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <Row label="Accounts Payable (Vendor Bills)" value={bs.liabilities.accountsPayable} fmt={fmt} />
                                <Row label="Sales Tax Payable" value={bs.liabilities.salesTaxPayable} fmt={fmt} />
                                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                                    <span>Total Liabilities</span>
                                    <span>{fmt(bs.liabilities.totalLiabilities)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Equity */}
                        <div>
                            <div className="flex justify-between font-bold text-gray-700 mb-3 border-b border-gray-100 pb-1">
                                <span>EQUITY</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <Row label="Retained Earnings" value={bs.equity.retainedEarnings} fmt={fmt} />
                                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                                    <span>Total Equity</span>
                                    <span>{fmt(bs.equity.totalEquity)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Row = ({ label, value, fmt }: { label: string; value: number; fmt: (v: number) => string }) => (
    <div className="flex justify-between items-center">
        <span>{label}</span>
        <span>{fmt(value)}</span>
    </div>
);
