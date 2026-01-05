import React from 'react';

interface DailyReportProps {
    data: {
        rooms: {
            total: number;
            ood: number; // Out of Order
            available: number;
            rented: number;
            vacant: number;
            comp: number; // Complimentary
            houseUse: number;
            dayUse: number;
            occupancyPercentage: number;
        };
        guests: {
            adults: number;
            children: number;
            arrivals: number;
            departures: number;
            inHouse: number;
            dayUse: number;
            walkIn: number;
        };
        revenue: {
            roomRevenue: number;
            tax: number;
            fb: number;
            other: number;
            totalRevenue: number;
            payments: number;
            adr: number;
            revPar: number;
        };
        breakdown?: {
            cash: number;
            card: number;
            transfer: number;
        }
    };
}

export default function DailyReportTable({ data }: DailyReportProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden font-sans">
            {/* Premium Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-200">
                        PMS
                    </div>
                    <div>
                        <h3 className="text-gray-900 font-bold text-base tracking-tight">Daily Flash Report</h3>
                        <p className="text-gray-400 text-xs font-medium">Synced with Property Management System</p>
                    </div>
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Live Data
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                {/* Room Statistics Column */}
                <div className="p-6 space-y-5">
                    <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Room Operations
                    </h4>

                    {/* Key Metric */}
                    <div className="flex justify-between items-end mb-4 bg-indigo-50/50 p-3 rounded-lg border border-indigo-50">
                        <div>
                            <span className="text-xs text-indigo-900 font-semibold block mb-0.5">Occupancy Rate</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-extrabold text-indigo-700">{data.rooms.occupancyPercentage.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-indigo-400 font-medium">Target: 75%</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Row label="Total Value Inventory" value={data.rooms.total} />
                        <Row label="Maintenance / OOO" value={data.rooms.ood} isError={data.rooms.ood > 0} />
                        <div className="my-2 border-t border-dashed border-gray-100"></div>
                        <Row label="Available to Sell" value={data.rooms.available} isHighlight />
                        <Row label="Rented (Occupied)" value={data.rooms.rented} />
                        <Row label="Comp / House Use" value={data.rooms.comp + data.rooms.houseUse} />
                        <Row label="Vacant Rooms" value={data.rooms.vacant} />
                    </div>
                </div>

                {/* Guest Statistics Column */}
                <div className="p-6 space-y-5">
                    <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Guest Flow
                    </h4>

                    {/* Guest Summary Card */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-50 text-center">
                            <span className="text-[10px] text-emerald-800 font-bold uppercase block mb-1">Arrivals</span>
                            <span className="text-xl font-bold text-gray-800">{data.guests.arrivals}</span>
                        </div>
                        <div className="p-3 bg-red-50/50 rounded-lg border border-red-50 text-center">
                            <span className="text-[10px] text-red-800 font-bold uppercase block mb-1">Departures</span>
                            <span className="text-xl font-bold text-gray-800">{data.guests.departures}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Row label="Adults in House" value={data.guests.adults} />
                        <Row label="Children in House" value={data.guests.children} />
                        <Row label="Total Guests" value={data.guests.inHouse} isBold />
                        <div className="my-2 border-t border-dashed border-gray-100"></div>
                        <Row label="Walk-Ins" value={data.guests.walkIn} />
                        <Row label="Day Use" value={data.guests.dayUse} />
                    </div>
                </div>

                {/* Financials Column */}
                <div className="p-6 bg-gray-50/30">
                    <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Revenue Snapshot
                    </h4>

                    <div className="space-y-3 mt-4">
                        {data.revenue.roomRevenue > 0 && (
                            <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-gray-500 font-medium">Room Revenue</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(data.revenue.roomRevenue)}</span>
                            </div>
                        )}
                        {(data.revenue.fb + data.revenue.other) > 0 && (
                            <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-gray-500 font-medium">F&B / Other</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(data.revenue.fb + data.revenue.other)}</span>
                            </div>
                        )}
                        {data.revenue.tax > 0 && (
                            <div className="flex justify-between items-center py-1 border-b border-gray-200 pb-3">
                                <span className="text-sm text-gray-500 font-medium">Taxes & Fees</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(data.revenue.tax)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-base text-gray-800 font-bold">Total Revenue</span>
                            <span className="text-lg font-extrabold text-emerald-600 tracking-tight">{formatCurrency(data.revenue.totalRevenue)}</span>
                        </div>

                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ADR</span>
                                <div className="text-sm font-bold text-gray-800 mt-0.5">{formatCurrency(data.revenue.adr)}</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">RevPAR</span>
                                <div className="text-sm font-bold text-gray-800 mt-0.5">{formatCurrency(data.revenue.revPar)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-2 border-t border-gray-100 flex justify-between text-[10px] text-gray-400 font-medium">
                <span>System Auto-Audit</span>
                <span>Generated: {new Date().toLocaleString()}</span>
            </div>
        </div>
    );
}

// Sub-component for clean rows
function Row({ label, value, isError = false, isHighlight = false, isBold = false }: { label: string, value: string | number, isError?: boolean, isHighlight?: boolean, isBold?: boolean }) {
    // Hide if value is 0 or "0"
    if (value === 0 || value === '0' || value === 0.00 || value === '$0.00') return null;

    return (
        <div className="flex justify-between items-center group">
            <span className={`text-xs ${isHighlight ? 'text-blue-600 font-semibold print:text-black' : 'text-gray-500 group-hover:text-gray-700 transition-colors print:text-gray-900'}`}>
                {label}
            </span>
            <span className={`text-sm ${isError ? 'text-red-600 font-bold print:text-black' : isBold || isHighlight ? 'text-gray-900 font-bold print:text-black' : 'text-gray-700 font-medium print:text-black'}`}>
                {value}
            </span>
        </div>
    );
}
