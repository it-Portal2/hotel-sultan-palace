"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getAllContactForms, updateContactFormStatus, ContactForm } from '@/lib/firestoreService';
import BackButton from '@/components/admin/BackButton';
import { MagnifyingGlassIcon, EnvelopeIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function AdminContactsPage() {
  const [items, setItems] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getAllContactForms();
      setItems(data);
      setLoading(false);
    })();
  }, []);

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        (i.name || '').toLowerCase().includes(q) ||
        (i.email || '').toLowerCase().includes(q) ||
        (i.phone || '').toLowerCase().includes(q) ||
        (i.message || '').toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [items, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      new: items.filter(i => i.status === 'new').length,
      read: items.filter(i => i.status === 'read').length,
      replied: items.filter(i => i.status === 'replied').length,
    };
  }, [items]);

  const setStatus = async (id: string, status: ContactForm['status']) => {
    setUpdating(id);
    const ok = await updateContactFormStatus(id, status);
    if (ok) setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    setUpdating(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-12 w-12 border-b-2 border-[#FF6A00] rounded-full animate-spin"/></div>;

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-8">
      <BackButton href="/admin" label="Back to Dashboard" />
      
      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contact Forms</h1>
          <p className="text-sm text-gray-500 mt-1">Leads submitted from the site contact form • {currentDate}</p>
        </div>
        
        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">New:</span>
            <span className="font-semibold text-gray-900">{stats.new}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Read:</span>
            <span className="font-semibold text-gray-900">{stats.read}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Replied:</span>
            <span className="font-semibold text-gray-900">{stats.replied}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="flex gap-1 border-b-2 border-gray-200 pb-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === 'new'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              New
            </button>
            <button
              onClick={() => setStatusFilter('read')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === 'read'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Read
            </button>
            <button
              onClick={() => setStatusFilter('replied')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === 'replied'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Replied
            </button>
          </div>
        </div>
      </div>

      {/* Clean Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <EnvelopeIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600">No contact submissions found</p>
          <p className="text-sm text-gray-500 mt-2">No submissions match your current filters</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{i.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`mailto:${i.email}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all">
                        {i.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{i.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-md break-words">{i.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={i.status}
                        onChange={(e)=>setStatus(i.id, e.target.value as ContactForm['status'])}
                        disabled={updating===i.id}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#FF6A00] disabled:opacity-50 ${
                          i.status === 'new' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          i.status === 'read' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}
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
        </div>
      )}
    </div>
  );
}
