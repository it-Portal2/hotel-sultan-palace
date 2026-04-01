'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getFoodOrdersByDateRange } from '@/lib/services/fbOrderService';
import { FoodOrder } from '@/lib/types/foodMenu';
import { XMarkIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import FBDashboardSkeleton from '@/components/admin/inventory/FBDashboardSkeleton';

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCATIONS = [
  { id: 'restaurant', label: 'Restaurant (Dine-in)', icon: '🍽️' },
  { id: 'in_room', label: 'Room Service', icon: '🛏️' },
  { id: 'pool_side', label: 'Pool Side', icon: '🏊' },
  { id: 'beach_side', label: 'Beach Side', icon: '🏖️' },
  { id: 'bar', label: 'Bar', icon: '🍸' },
] as const;

const ORDER_TYPES = [
  { id: 'walk_in', label: 'Walk-in' },
  { id: 'takeaway', label: 'Takeaway' },
  { id: 'delivery', label: 'Delivery' },
] as const;

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', color: '#10B981' },
  { id: 'card', label: 'Card', color: '#1D69F9' },
  { id: 'online', label: 'Online', color: '#8B5CF6' },
  { id: 'complimentary', label: 'Complimentary', color: '#F59E0B' },
] as const;

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (date: any): string => {
  if (!date) return 'N/A';
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
};

const fmtAmt = (v: number) => `$${v.toFixed(2)}`;

const getPaymentBucket = (method?: string): string => {
  const m = (method || '').toLowerCase();
  if (m.includes('cash')) return 'cash';
  if (m.includes('card') || m.includes('credit') || m.includes('debit') || m.includes('mpesa') || m.includes('visa') || m.includes('mastercard')) return 'card';
  if (m.includes('online') || m.includes('transfer') || m.includes('bank')) return 'online';
  if (m.includes('comp') || m.includes('free') || m.includes('house')) return 'complimentary';
  return 'card';
};

const resolvePaymentSplit = (order: FoodOrder): Record<string, number> => {
  const split: Record<string, number> = {};
  const history = order.paymentHistory || [];
  if (history.length > 0) {
    for (const h of history) {
      const bucket = getPaymentBucket(h.method);
      split[bucket] = (split[bucket] || 0) + h.amount;
    }
    const histSum = history.reduce((s, p) => s + p.amount, 0);
    const gap = (order.paidAmount || 0) - histSum;
    if (gap > 0.01) {
      const bucket = getPaymentBucket(order.paymentMethod);
      split[bucket] = (split[bucket] || 0) + gap;
    }
  } else if ((order.paidAmount || 0) > 0) {
    const bucket = getPaymentBucket(order.paymentMethod);
    split[bucket] = order.paidAmount || 0;
  }
  return split;
};

// ─── Aggregation ──────────────────────────────────────────────────────────────

interface AggRow {
  totalOrders: number;
  totalAmount: number;
  cash: number;
  card: number;
  online: number;
  complimentary: number;
  orders: FoodOrder[];
}

const emptyAgg = (): AggRow => ({
  totalOrders: 0, totalAmount: 0,
  cash: 0, card: 0, online: 0, complimentary: 0,
  orders: [],
});

type AggData = Record<string, Record<string, AggRow>>;

function buildAgg(orders: FoodOrder[], pmFilter: string[]): AggData {
  const agg: AggData = {};
  for (const loc of LOCATIONS) agg[loc.id] = {};
  for (const loc of LOCATIONS)
    for (const ot of ORDER_TYPES)
      agg[loc.id][ot.id] = emptyAgg();

  for (const o of orders) {
    if (o.status === 'voided') continue;
    const locId = o.deliveryLocation as string;
    const otId = o.orderType as string;
    if (!agg[locId] || !agg[locId][otId]) continue;
    const split = resolvePaymentSplit(o);
    if (pmFilter.length > 0) {
      const buckets = Object.keys(split);
      const hasMatch = buckets.some(b => pmFilter.includes(b));
      if (!hasMatch) continue;
    }
    const row = agg[locId][otId];
    row.totalOrders++;
    row.totalAmount += o.totalAmount || 0;
    row.cash += split['cash'] || 0;
    row.card += split['card'] || 0;
    row.online += split['online'] || 0;
    row.complimentary += split['complimentary'] || 0;
    row.orders.push(o);
  }
  return agg;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: FoodOrder; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!mounted) return null;

  const due = (order.totalAmount || 0) - (order.paidAmount || 0);
  const history = order.paymentHistory || [];
  const histSum = history.reduce((s, p) => s + p.amount, 0);
  const missingAmt = (order.paidAmount || 0) - histSum;
  const allPayRows = [...history];
  if (missingAmt > 0.01) {
    allPayRows.unshift({ id: 'initial-virtual', amount: missingAmt, method: order.paymentMethod || 'Unknown', date: order.createdAt } as any);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div>
            <div className="text-sm font-bold text-gray-900">{order.orderNumber}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{fmtDate(order.createdAt)} • {order.guestName}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200 transition-colors bg-white shadow-sm border border-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left: Items */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Order Items ({order.items.length})</div>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs py-1 border-b border-gray-50 last:border-0">
                    <div className="flex-1 pr-4">
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="text-[10px] text-gray-400">{item.quantity} × {fmtAmt(item.price)}</div>
                    </div>
                    <div className="font-mono font-bold text-gray-700">{fmtAmt(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Subtotal</span>
                <span className="text-sm font-bold font-mono">{fmtAmt(order.totalAmount || 0)}</span>
              </div>
            </div>

            {/* Right: Payments */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Payment Ledger</div>
              <div className="space-y-2">
                {allPayRows.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 italic text-xs">No payments recorded.</div>
                ) : allPayRows.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="font-bold text-gray-800 uppercase text-[10px]">{h.method}</div>
                      <div className="text-[9px] text-gray-400">{fmtDate(h.date || order.createdAt)}</div>
                    </div>
                    <div className="font-mono font-bold text-blue-600">{fmtAmt(h.amount)}</div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-200 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase">Total Paid</span>
                  <span className="text-sm font-bold font-mono text-green-600">{fmtAmt(order.paidAmount || 0)}</span>
                </div>
                {due > 0.01 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-red-400 uppercase">Balance Due</span>
                    <span className="text-sm font-bold font-mono text-red-600">{fmtAmt(due)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function OrderSummaryRow({ order, onViewDetails }: { order: FoodOrder; onViewDetails: (o: FoodOrder) => void }) {
  const [expanded, setExpanded] = useState(false);
  const split = resolvePaymentSplit(order);
  return (
    <>
      <tr className={`text-xs border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${expanded ? 'bg-blue-50/20' : ''}`} onClick={() => setExpanded(!expanded)}>
        <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={`text-gray-300 transform transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>▶</span><span className="font-semibold text-gray-800">{order.orderNumber}</span></div></td>
        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${order.status === 'voided' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{order.status}</span></td>
        <td className="px-4 py-3 font-mono font-semibold">{fmtAmt(order.totalAmount || 0)}</td>
        <td className="px-4 py-3 font-mono text-green-700">{split.cash > 0 ? fmtAmt(split.cash) : '—'}</td>
        <td className="px-4 py-3 font-mono text-blue-700">{split.card > 0 ? fmtAmt(split.card) : '—'}</td>
        <td className="px-4 py-3 font-mono text-purple-700">{split.online > 0 ? fmtAmt(split.online) : '—'}</td>
        <td className="px-4 py-3 font-mono text-amber-700">{split.complimentary > 0 ? fmtAmt(split.complimentary) : '—'}</td>
        <td className="px-4 py-3" onClick={e => { e.stopPropagation(); onViewDetails(order); }}><button className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 transition-colors bg-blue-50/50 px-2 py-1 rounded"><EyeIcon className="w-3.5 h-3.5" /> Details</button></td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/30 shadow-inner"><td colSpan={8} className="px-12 py-4 text-[11px] text-gray-600">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Items Order Summary:</span>
            {order.items.map((item, i) => (<span key={i} className="bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm text-gray-700 font-medium">{item.quantity}× {item.name} <span className="text-gray-400 ml-1">({fmtAmt(item.price)})</span></span>))}
            {order.notes && <span className="italic text-gray-400 border-l pl-3 ml-2">Note: {order.notes}</span>}
          </div>
        </td></tr>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FBDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState<FoodOrder[]>([]);
  const [selectedModal, setSelectedModal] = useState<FoodOrder | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<string>(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterLocations, setFilterLocations] = useState<string[]>([]);
  const [filterOrderTypes, setFilterOrderTypes] = useState<string[]>([]);
  const [filterPayments, setFilterPayments] = useState<string[]>([]);


  // Tabs
  const [activeLocation, setActiveLocation] = useState<string>(LOCATIONS[0].id);
  const [activeOrderType, setActiveOrderType] = useState<string>(ORDER_TYPES[0].id);

  // Payment filter for the current view (level 3)
  const [filterPaymentView, setFilterPaymentView] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadData(); }, [startDate, endDate]);

  // Reset page & payment filter on tab change
  useEffect(() => {
    setCurrentPage(1);
    setFilterPaymentView([]);
  }, [activeLocation, activeOrderType, filterLocations, filterOrderTypes, filterPayments]);

  const loadData = async () => {
    try {
      setLoading(true);
      const start = new Date(startDate);
      const end = new Date(endDate); end.setHours(23, 59, 59, 999);
      const [food, bar] = await Promise.all([
        getFoodOrdersByDateRange(start, end, ['settled', 'delivered', 'confirmed', 'voided'], 'food'),
        getFoodOrdersByDateRange(start, end, ['settled', 'delivered', 'confirmed', 'voided'], 'bar'),
      ]);
      setRawOrders([...food, ...bar]);
    } catch (err) { console.error('FB Report Error:', err); } finally { setLoading(false); }
  };

  const filteredOrders = useMemo(() => {
    return rawOrders.filter(o => {
      if (filterLocations.length > 0 && !filterLocations.includes(o.deliveryLocation)) return false;
      if (filterOrderTypes.length > 0 && !filterOrderTypes.includes(o.orderType)) return false;
      return true;
    });
  }, [rawOrders, filterLocations, filterOrderTypes]);

  const aggData = useMemo(() => buildAgg(filteredOrders, filterPayments), [filteredOrders, filterPayments]);

  const stats = useMemo(() => {
    let sales = 0, paid = 0, orders = 0, cash = 0, card = 0, online = 0, comp = 0;
    filteredOrders.forEach(o => {
      if (o.status === 'voided') return;
      sales += o.totalAmount || 0; paid += o.paidAmount || 0; orders++;
      const s = resolvePaymentSplit(o);
      cash += s.cash || 0; card += s.card || 0; online += s.online || 0; comp += s.complimentary || 0;
    });
    return { sales, paid, due: sales - paid, orders, cash, card, online, comp };
  }, [filteredOrders]);

  const activeAggRow = (aggData[activeLocation] || {})[activeOrderType] || emptyAgg();

  // Filter orders by selected payment method
  const filteredViewOrders = useMemo(() => {
    if (filterPaymentView.length === 0) return activeAggRow.orders;
    return activeAggRow.orders.filter(o => {
      const split = resolvePaymentSplit(o);
      return filterPaymentView.some(pm => (split[pm] || 0) > 0);
    });
  }, [activeAggRow.orders, filterPaymentView]);

  const totalPages = Math.ceil(filteredViewOrders.length / PAGE_SIZE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredViewOrders.slice(start, start + PAGE_SIZE);
  }, [filteredViewOrders, currentPage]);

  const locationTotals = useMemo(() => {
    const totals: Record<string, { orders: number; amount: number }> = {};
    for (const loc of LOCATIONS) {
      totals[loc.id] = { orders: 0, amount: 0 };
      const locAgg = aggData[loc.id] || {};
      for (const ot of ORDER_TYPES) { const row = locAgg[ot.id]; if (row) { totals[loc.id].orders += row.totalOrders; totals[loc.id].amount += row.totalAmount; } }
    }
    return totals;
  }, [aggData]);

  const handleExport = useCallback(() => {
    const locLabel = LOCATIONS.find(l => l.id === activeLocation)?.label || activeLocation;
    const otLabel = ORDER_TYPES.find(o => o.id === activeOrderType)?.label || activeOrderType;
    
    const lines = [
      `F&B Report: ${locLabel} - ${otLabel}`,
      `Date Range: ${startDate} to ${endDate}`,
      '',
      '--- SELECTED VIEW SUMMARY ---',
      `Total Orders,${activeAggRow.totalOrders}`,
      `Total Amount,${activeAggRow.totalAmount.toFixed(2)}`,
      `Cash Split,${activeAggRow.cash.toFixed(2)}`,
      `Card Split,${activeAggRow.card.toFixed(2)}`,
      `Online Split,${activeAggRow.online.toFixed(2)}`,
      `Complimentary Split,${activeAggRow.complimentary.toFixed(2)}`,
      '',
      '--- OVERALL DASHBOARD TOTALS (All Categories) ---',
      `Total Sales,${stats.sales.toFixed(2)}`,
      `Total Collected,${stats.paid.toFixed(2)}`,
      `Total Due,${stats.due.toFixed(2)}`,
      `Total Orders,${stats.orders}`,
      '',
      '--- DETAILED ORDER HISTORY ---',
      ['Order #', 'Date', 'Guest', 'Status', 'Total', 'Cash', 'Card', 'Online', 'Complimentary', 'Items'].join(',')
    ];

    activeAggRow.orders.forEach(o => {
      const split = resolvePaymentSplit(o);
      const itemsStr = o.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
      const row = [
        o.orderNumber,
        fmtDate(o.createdAt),
        o.guestName || 'N/A',
        o.status,
        (o.totalAmount || 0).toFixed(2),
        (split.cash || 0).toFixed(2),
        (split.card || 0).toFixed(2),
        (split.online || 0).toFixed(2),
        (split.complimentary || 0).toFixed(2),
        `"${itemsStr}"`
      ];
      lines.push(row.join(','));
    });

    const fileName = `FB_Report_${locLabel}_${otLabel}_${startDate}_to_${endDate}.csv`.replace(/\s+/g, '_');
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }, [activeAggRow, activeLocation, activeOrderType, startDate, endDate, stats]);


  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Food &amp; Bar Reports</h1>
          <p className="text-xs text-gray-500 mt-0.5">Payment breakdown and transaction history</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-blue-100 outline-none" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-blue-100 outline-none" />

          <button 
            onClick={handleExport} 
            disabled={loading}
            className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 shadow-sm transition-all focus:ring-2 focus:ring-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {loading ? (
        <FBDashboardSkeleton />
      ) : (
        <>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Sales', v: stats.sales, c: 'text-gray-900' },
          { label: 'Collected', v: stats.paid, c: 'text-blue-600' },
          { label: 'Due', v: stats.due, c: 'text-red-500' },
          { label: 'Cash', v: stats.cash, c: 'text-green-600' },
          { label: 'Card', v: stats.card, c: 'text-blue-500' },
          { label: 'Online', v: stats.online, c: 'text-purple-600' },
          { label: 'Comp.', v: stats.comp, c: 'text-amber-600' },
          { label: 'Orders', v: stats.orders, c: 'text-gray-600', cur: false },
        ].map(s => (
          <div key={s.label} className="bg-white p-3 rounded-lg border shadow-sm transition-all hover:shadow-md hover:border-blue-100 group">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-400 transition-colors">{s.label}</div>
            <div className={`text-base font-bold mt-0.5 ${s.c}`}>{s.cur === false ? s.v : fmtAmt(s.v)}</div>
          </div>
        ))}
      </div>

      {/* Main Report Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">

        {/* Locations (Level 1) */}
        <div className="bg-gray-50/50 border-b flex flex-wrap pt-2 px-2">
          {LOCATIONS.map(loc => (
            <button key={loc.id} onClick={() => { setActiveLocation(loc.id); setActiveOrderType(ORDER_TYPES[0].id); }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${activeLocation === loc.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:bg-white/50'}`}>
              {loc.icon} {loc.label} <span className="ml-1 opacity-50 px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px]">{locationTotals[loc.id]?.orders || 0}</span>
            </button>
          ))}
        </div>

        {/* Order Types (Level 2) */}
        <div className="bg-white border-b flex px-4">
          {ORDER_TYPES.map(ot => {
            const row = (aggData[activeLocation] || {})[ot.id] || emptyAgg();
            const active = activeOrderType === ot.id;
            return (
              <button key={ot.id} onClick={() => setActiveOrderType(ot.id)}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${active ? 'border-orange-500 text-orange-600 bg-orange-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {ot.label} <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-300'}`}>{row.totalOrders}</span>
              </button>
            );
          })}
        </div>

        {/* Payment Method Filters (Level 2.5) */}
        <div className="bg-gray-50/30 border-b px-4 py-2 flex flex-wrap items-center gap-2">

          {PAYMENT_METHODS.map(pm => {
            const active = filterPaymentView.includes(pm.id);
            return (
              <button
                key={pm.id}
                onClick={() => {
                  setFilterPaymentView(prev =>
                    prev.includes(pm.id) ? prev.filter(x => x !== pm.id) : [...prev, pm.id]
                  );
                  setCurrentPage(1);
                }}
                style={active ? { backgroundColor: pm.color, borderColor: pm.color, color: '#fff' } : { borderColor: pm.color, color: pm.color }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all`}
              >
                {pm.label}
              </button>
            );
          })}
          {filterPaymentView.length > 0 && (
            <button
              onClick={() => setFilterPaymentView([])}
              className="px-3 py-1 rounded-full text-[10px] font-bold border border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-all"
            >
              Clear
            </button>
          )}
        </div>

        {/* Level 3 Content Area */}
        <div className="p-6">

          {/* TAB SUMMARY - Separated and Simplified */}
          {activeAggRow.totalOrders > 0 && filteredViewOrders.length === 0 && filterPaymentView.length > 0 && (
            <div className="mb-8 p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 italic">No orders found for the selected payment method(s).</div>
          )}
          {filteredViewOrders.length > 0 ? (
            <div className="mb-8 p-6 bg-blue-50/40 rounded-2xl border border-blue-100/50 flex flex-wrap items-center gap-x-12 gap-y-6 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selected Summary</span>
                <span className="text-2xl font-bold text-gray-900 mt-1">{activeAggRow.totalOrders} <span className="text-gray-400 font-normal text-sm uppercase tracking-wide">Orders</span></span>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden md:block" />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Net Total</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 font-mono">{fmtAmt(activeAggRow.totalAmount)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Cash</span>
                <span className="text-2xl font-bold text-green-700 mt-1 font-mono">{fmtAmt(activeAggRow.cash)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Card</span>
                <span className="text-2xl font-bold text-blue-700 mt-1 font-mono">{fmtAmt(activeAggRow.card)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">Online</span>
                <span className="text-2xl font-bold text-purple-700 mt-1 font-mono">{fmtAmt(activeAggRow.online)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Comp.</span>
                <span className="text-2xl font-bold text-amber-700 mt-1 font-mono">{fmtAmt(activeAggRow.complimentary)}</span>
              </div>
            </div>
          ) : filterPaymentView.length === 0 ? (
            <div className="mb-8 p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 italic">No transactions found for this category.</div>
          ) : null}

          {/* ORDER HISTORY TABLE */}
          {filteredViewOrders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Detailed Order History
                </h3>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order #</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-green-600 uppercase tracking-widest">Cash</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest">Card</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-purple-600 uppercase tracking-widest">Online</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-amber-600 uppercase tracking-widest">Comp.</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedOrders.map(order => (<OrderSummaryRow key={order.id} order={order} onViewDetails={setSelectedModal} />))}
                  </tbody>
                  {currentPage === totalPages && (
                    <tfoot className="bg-gray-50/50 font-bold border-t-2 border-gray-100">
                      <tr>
                        <td colSpan={2} className="px-5 py-5 text-gray-400 uppercase text-[9px] tracking-widest">Final Ledger Totals</td>
                        <td className="px-5 py-5 font-mono text-gray-900">{fmtAmt(activeAggRow.totalAmount)}</td>
                        <td className="px-5 py-5 font-mono text-green-700">{fmtAmt(activeAggRow.cash)}</td>
                        <td className="px-5 py-5 font-mono text-blue-700">{fmtAmt(activeAggRow.card)}</td>
                        <td className="px-5 py-5 font-mono text-purple-700">{fmtAmt(activeAggRow.online)}</td>
                        <td className="px-5 py-5 font-mono text-amber-700">{fmtAmt(activeAggRow.complimentary)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 pt-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filteredViewOrders.length)} of {filteredViewOrders.length} orders
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border bg-white shadow-sm text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-all"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'bg-white border text-gray-400 hover:border-blue-200 hover:text-blue-600'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border bg-white shadow-sm text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-all"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

        </>
      )}

      {selectedModal && <OrderDetailModal order={selectedModal} onClose={() => setSelectedModal(null)} />}
    </div>
  );
}
