"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { getAllBookings, Booking } from '@/lib/firestoreService';
import { useSearchParams } from 'next/navigation';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const search = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all'|'pending'|'confirmed'|'cancelled'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sort, setSort] = useState<'newest'|'oldest'|'amount_desc'|'amount_asc'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAllBookings();
        setBookings(data);
      } catch (e) {
        console.error('Error loading bookings:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = bookings.slice();

    // optional day filter via query param
    const day = search?.get('day');
    if (day) {
      const start = new Date(day);
      const end = new Date(day);
      end.setDate(end.getDate() + 1);
      list = list.filter(b => {
        const created = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return created >= start && created < end;
      });
    }

    // date range filter
    if (startDate) {
      const s = new Date(startDate);
      list = list.filter(b => (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setDate(e.getDate() + 1);
      list = list.filter(b => (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) < e);
    }

    // status filter
    if (status !== 'all') {
      list = list.filter(b => b.status === status);
    }

    // search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(b => {
        const id = (b.bookingId || b.id).toLowerCase();
        const name = `${b.guestDetails?.firstName || ''} ${b.guestDetails?.lastName || ''}`.toLowerCase();
        const email = (b.guestDetails?.email || '').toLowerCase();
        return id.includes(q) || name.includes(q) || email.includes(q);
      });
    }

    // sort
    list.sort((a,b)=>{
      if (sort === 'newest') return ((b.createdAt as any) - (a.createdAt as any));
      if (sort === 'oldest') return ((a.createdAt as any) - (b.createdAt as any));
      if (sort === 'amount_desc') return (b.totalAmount||0) - (a.totalAmount||0);
      if (sort === 'amount_asc') return (a.totalAmount||0) - (b.totalAmount||0);
      return 0;
    });

    return list;
  }, [bookings, search, query, status, startDate, endDate, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const exportCsv = () => {
    const headers = ['BookingID','Guest','Email','CheckIn','CheckOut','Adults','Children','Rooms','Total','Status','CreatedAt'];
    const rows = filtered.map(b => [
      b.bookingId || b.id,
      `${b.guestDetails?.firstName||''} ${b.guestDetails?.lastName||''}`.trim(),
      b.guestDetails?.email||'',
      new Date(b.checkIn).toISOString().slice(0,10),
      new Date(b.checkOut).toISOString().slice(0,10),
      b.guests?.adults||0,
      b.guests?.children||0,
      b.guests?.rooms||1,
      b.totalAmount||0,
      b.status,
      (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)).toISOString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-2 text-gray-600">All recent reservations{search?.get('day') ? ` — ${search?.get('day')}` : ''}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-md shadow flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
          <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Booking ID, name, email" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
          <select value={status} onChange={e => { setStatus(e.target.value as any); setPage(1); }} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">From</label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Sort</label>
          <select value={sort} onChange={e => setSort(e.target.value as any)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={exportCsv} className="px-3 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700">Export CSV</button>
        </div>
      </div>

      {(filtered.length === 0) ? (
        <div className="text-center py-12 text-gray-600">No bookings yet</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {paginated.map((b) => (
              <li key={b.id}>
                <button className="w-full text-left px-4 py-4 sm:px-6 hover:bg-gray-50" onClick={() => setSelected(b)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.guestDetails.firstName} {b.guestDetails.lastName}</p>
                      <p className="text-xs text-gray-500">{b.guestDetails.email} • {b.guestDetails.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">${b.totalAmount}</p>
                      <p className="text-xs text-gray-500">{b.checkIn} → {b.checkOut}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className={`px-3 py-1.5 text-sm rounded border ${page<=1?'text-gray-400 border-gray-200':'text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Prev</button>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className={`px-3 py-1.5 text-sm rounded border ${page>=totalPages?'text-gray-400 border-gray-200':'text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Next</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Guest</p>
                <p className="text-gray-600">{selected.guestDetails.firstName} {selected.guestDetails.lastName}</p>
                <p className="text-gray-600">{selected.guestDetails.email}</p>
                <p className="text-gray-600">{selected.guestDetails.phone}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Stay</p>
                <p className="text-gray-600">{selected.checkIn} → {selected.checkOut}</p>
                <p className="text-gray-600">Guests: {selected.guests.adults} adults / {selected.guests.children} children</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Rooms</p>
                <ul className="list-disc ml-5 text-gray-600">
                  {selected.rooms.map((r, i) => (
                    <li key={i}>{r.type} - ${r.price}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Add-ons</p>
                <ul className="list-disc ml-5 text-gray-600">
                  {selected.addOns.map((a, i) => (
                    <li key={i}>{a.name} x{a.quantity} - ${a.price}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Total</p>
                <p className="text-gray-900 font-semibold">${selected.totalAmount}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Status</p>
                <p className="text-gray-900 font-semibold">{selected.status}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setSelected({ ...selected, status: 'confirmed' })} className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700">Mark Confirmed</button>
                  <button onClick={() => setSelected({ ...selected, status: 'cancelled' })} className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700">Mark Cancelled</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


