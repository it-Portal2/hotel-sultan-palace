"use client";

import React, { useEffect, useState } from 'react';
import { getAllBookingEnquiries, updateBookingEnquiryStatus, BookingEnquiry } from '@/lib/firestoreService';

export default function AdminBookingEnquiriesPage() {
  const [items, setItems] = useState<BookingEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getAllBookingEnquiries();
      setItems(data);
      setLoading(false);
    })();
  }, []);

  const setStatus = async (id: string, status: BookingEnquiry['status']) => {
    setUpdating(id);
    const ok = await updateBookingEnquiryStatus(id, status);
    if (ok) setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    setUpdating(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-12 w-12 border-b-2 border-orange-500 rounded-full animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#202C3B]">Booking Enquiries</h1>
          <p className="mt-1 text-sm md:text-base text-gray-600">Leads submitted from the booking enquiry form</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded border bg-white shadow-sm">Total <strong className="ml-1 text-[#202C3B]">{items.length}</strong></span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded border bg-white shadow-sm">New <strong className="ml-1 text-[#202C3B]">{items.filter(i=>i.status==='new').length}</strong></span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-sm">No booking enquiries yet.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white border-b">
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 w-[120px]">Name</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 w-[180px]">Email</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 w-[130px]">Phone</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 w-[200px]">Website</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 min-w-[300px]">Message</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 w-[120px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((i, idx) => (
                <tr key={i.id} className={idx % 2 ? 'bg-white' : 'bg-gray-50/40 hover:bg-gray-100/50 transition-colors'}>
                  <td className="px-4 md:px-6 py-3 text-sm text-[#202C3B] font-medium break-words">{i.name}</td>
                  <td className="px-4 md:px-6 py-3 text-sm break-words">
                    <a href={`mailto:${i.email}`} className="text-blue-700 hover:underline break-all">{i.email}</a>
                  </td>
                  <td className="px-4 md:px-6 py-3 text-sm text-gray-700 break-words">{i.phone}</td>
                  <td className="px-4 md:px-6 py-3 text-sm text-gray-700 break-words">
                    {i.website ? (
                      <a href={i.website.startsWith('http') ? i.website : `https://${i.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all text-xs">
                        {i.website.length > 30 ? `${i.website.substring(0, 30)}...` : i.website}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-3 text-sm text-gray-700">
                    <div className="max-w-full break-words whitespace-normal">{i.message}</div>
                  </td>
                  <td className="px-4 md:px-6 py-3 text-sm">
                    <select 
                      value={i.status} 
                      onChange={(e)=>setStatus(i.id, e.target.value as BookingEnquiry['status'])} 
                      disabled={updating===i.id} 
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


