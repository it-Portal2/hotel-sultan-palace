"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { getAllBookings, Booking, updateBooking } from '@/lib/firestoreService';
import { cancelBooking, confirmBooking } from '@/lib/bookingService';
import { useSearchParams } from 'next/navigation';
import { CalendarDaysIcon, MagnifyingGlassIcon,  ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import RestrictedAction from '@/components/admin/RestrictedAction';

export default function AdminBookingsPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
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

    if (startDate) {
      const s = new Date(startDate);
      list = list.filter(b => (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setDate(e.getDate() + 1);
      list = list.filter(b => (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) < e);
    }

    if (status !== 'all') {
      list = list.filter(b => b.status === status);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(b => {
        const id = (b.bookingId || b.id).toLowerCase();
        const name = `${b.guestDetails?.firstName || ''} ${b.guestDetails?.lastName || ''}`.toLowerCase();
        const email = (b.guestDetails?.email || '').toLowerCase();
        return id.includes(q) || name.includes(q) || email.includes(q);
      });
    }

    list.sort((a,b)=>{
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      if (sort === 'newest') return bTime - aTime;
      if (sort === 'oldest') return aTime - bTime;
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

  const stats = useMemo(() => {
    return {
      total: filtered.length,
      pending: filtered.filter(b => b.status === 'pending').length,
      confirmed: filtered.filter(b => b.status === 'confirmed').length,
      cancelled: filtered.filter(b => b.status === 'cancelled').length,
    };
  }, [filtered]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-8">
      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {search?.get('day') ? `Bookings for ${search?.get('day')}` : 'Manage all reservations'} • {currentDate}
          </p>
        </div>
        
        {/* Inline Stats - No boxes */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Pending:</span>
            <span className="font-semibold text-gray-900">{stats.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Confirmed:</span>
            <span className="font-semibold text-gray-900">{stats.confirmed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Cancelled:</span>
            <span className="font-semibold text-gray-900">{stats.cancelled}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar - Same style as room-status */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by booking ID, name, email..."
              className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
            />
          </div>
          <button 
            onClick={exportCsv} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#FF6A00] transition-colors border-b-2 border-transparent hover:border-[#FF6A00]"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>

        {/* Filter Tabs - Same style as room-status */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1 border-b-2 border-gray-200 pb-2">
            <button
              onClick={() => { setStatus('all'); setPage(1); }}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                status === 'all'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setStatus('pending'); setPage(1); }}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                status === 'pending'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => { setStatus('confirmed'); setPage(1); }}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                status === 'confirmed'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => { setStatus('cancelled'); setPage(1); }}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                status === 'cancelled'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cancelled
            </button>
          </div>
          
          {/* Date Filters - Inline */}
          <div className="flex items-center gap-2 ml-auto">
            <input 
              type="date" 
              value={startDate} 
              onChange={e => { setStartDate(e.target.value); setPage(1); }} 
              className="px-3 py-1 text-sm border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
              placeholder="From"
            />
            <span className="text-gray-400">→</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => { setEndDate(e.target.value); setPage(1); }} 
              className="px-3 py-1 text-sm border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
              placeholder="To"
            />
            <select 
              value={sort} 
              onChange={e => setSort(e.target.value as 'newest' | 'oldest' | 'amount_desc' | 'amount_asc')} 
              className="px-3 py-1 text-sm border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_desc">Amount: High to Low</option>
              <option value="amount_asc">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clean Table - No heavy boxes */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">No bookings found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Check-in / Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.map((b) => {
                  const guests = b.guests || { adults: 0, children: 0, rooms: 1 };
                  const rooms = b.rooms || [];
                  const statusColors = {
                    confirmed: 'bg-green-100 text-green-800 border-green-200',
                    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    cancelled: 'bg-red-100 text-red-800 border-red-200'
                  };
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelected(b)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{b.bookingId || b.id.slice(0,8)}</div>
                        <div className="text-xs text-gray-500">
                          {b.createdAt instanceof Date ? b.createdAt.toLocaleDateString() : new Date(b.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{b.guestDetails.firstName} {b.guestDetails.lastName}</div>
                        <div className="text-xs text-gray-500">{b.guestDetails.email}</div>
                        <div className="text-xs text-gray-400">{b.guestDetails.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(b.checkIn).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">→ {new Date(b.checkOut).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {guests.adults} Adults
                          {guests.children > 0 && `, ${guests.children} Children`}
                        </div>
                        <div className="text-xs text-gray-500">{guests.rooms} Room{guests.rooms > 1 ? 's' : ''}</div>
                        {rooms.some(r => r.allocatedRoomType) && (
                          <div className="text-xs text-green-600 mt-1">
                            {rooms.filter(r => r.allocatedRoomType).map(r => r.allocatedRoomType).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">${b.totalAmount?.toLocaleString() || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[b.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(b);
                          }}
                          className="text-[#FF6A00] hover:text-[#FF6A00]/80 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Simple Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, filtered.length)}</span> of <span className="font-medium">{filtered.length}</span> bookings
            </div>
            <div className="flex gap-2">
              <button 
                disabled={page<=1} 
                onClick={()=>setPage(p=>Math.max(1,p-1))} 
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  page<=1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-[#FF6A00] hover:text-[#FF6A00]'
                }`}
              >
                Previous
              </button>
              <button 
                disabled={page>=totalPages} 
                onClick={()=>setPage(p=>Math.min(totalPages,p+1))} 
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  page>=totalPages
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-[#FF6A00] hover:text-[#FF6A00]'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal - Keep existing */}
      {selected && (
        (() => {
          const guests = selected.guests || { adults: 0, children: 0, rooms: 1 };
          const rooms = selected.rooms || [];
          const addOns = selected.addOns || [];
          return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer" onClick={() => setSelected(null)}>
          <div className="bg-white rounded shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Booking Details</h3>
                <p className="text-gray-500 text-sm mt-1">Booking ID: {selected.bookingId || selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selected.guestDetails.firstName} {selected.guestDetails.lastName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selected.guestDetails.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{selected.guestDetails.phone}</p>
                    </div>
                    {selected.address && (
                      <div>
                        <p className="text-gray-500">Address</p>
                        <p className="font-medium text-gray-900">
                          {selected.address.address1}, {selected.address.city}, {selected.address.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 text-[#FF6A00] mr-2" />
                    Stay Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Check-in</p>
                      <p className="font-medium text-gray-900">{new Date(selected.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Check-out</p>
                      <p className="font-medium text-gray-900">{new Date(selected.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Guests</p>
                      <p className="font-medium text-gray-900">{guests.adults} Adults, {guests.children} Children, {guests.rooms} Room{guests.rooms > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Rooms</h4>
                  <div className="space-y-2">
                    {rooms.map((r, i) => (
                      <div key={i} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{r.type}</span>
                            {r.suiteType && (
                              <span className="ml-2 text-xs text-gray-500">({r.suiteType})</span>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-700">${r.price}</span>
                        </div>
                        {r.allocatedRoomType && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">Allocated Room:</span>
                            <span className="ml-2 text-sm font-semibold text-green-700">{r.allocatedRoomType}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Add-ons</h4>
                  {addOns.length > 0 ? (
                    <div className="space-y-2">
                      {addOns.map((a, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{a.name}</span>
                            <span className="text-xs text-gray-500 ml-2">x{a.quantity}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">${(a.price * a.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No add-ons selected</p>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-3xl font-bold text-gray-900">${selected.totalAmount?.toLocaleString() || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      selected.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      selected.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selected.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {isReadOnly ? (
                    <RestrictedAction message="You don't have permission to change booking status">
                      <div className="w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-center text-sm">
                        Status changes are disabled
                      </div>
                    </RestrictedAction>
                  ) : (
                    <>
                      {selected.status !== 'confirmed' && (
                        <button 
                          onClick={async () => {
                            try {
                              await confirmBooking(selected.id);
                              setSelected({ ...selected, status: 'confirmed' });
                              const updated = await getAllBookings();
                              setBookings(updated);
                              showToast('Booking confirmed successfully!', 'success');
                            } catch (error) {
                              console.error('Error confirming booking:', error);
                              showToast('Failed to confirm booking. Please try again.', 'error');
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          Mark as Confirmed
                        </button>
                      )}
                      {selected.status !== 'cancelled' && (
                        <button 
                          onClick={async () => {
                            if (confirm('Are you sure you want to cancel this booking? The room will be freed up automatically.')) {
                              try {
                                await cancelBooking(selected.id);
                                setSelected({ ...selected, status: 'cancelled' });
                                const updated = await getAllBookings();
                                setBookings(updated);
                                showToast('Booking cancelled successfully. Room has been freed up.', 'success');
                              } catch (error) {
                                console.error('Error cancelling booking:', error);
                                showToast('Failed to cancel booking. Please try again.', 'error');
                              }
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          Cancel Booking
                        </button>
                      )}
                      {selected.status === 'confirmed' && (
                        <button 
                          onClick={async () => {
                            await updateBooking(selected.id, { status: 'pending' });
                            setSelected({ ...selected, status: 'pending' });
                            const updated = await getAllBookings();
                            setBookings(updated);
                          }}
                          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                        >
                          Mark as Pending
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
          );
        })()
      )}
    </div>
  );
}
