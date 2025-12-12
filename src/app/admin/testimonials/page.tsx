"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { SparklesIcon, PlusIcon, TrashIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getTestimonials, deleteTestimonial, Testimonial } from '@/lib/firestoreService';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';

export default function AdminTestimonialsPage() {
  const { isReadOnly } = useAdminRole();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getTestimonials();
        setItems(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => 
      (item.name || '').toLowerCase().includes(q) ||
      (item.country || '').toLowerCase().includes(q) ||
      (item.text || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      setDeleting(confirmId);
      const ok = await deleteTestimonial(confirmId);
      if (ok) setItems(items.filter(i => i.id !== confirmId));
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64"><div className="h-12 w-12 border-b-2 border-[#FF6A00] rounded-full animate-spin" /></div>;

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
          <h1 className="text-2xl font-semibold text-gray-900">Testimonials</h1>
          <p className="text-sm text-gray-500 mt-1">Manage guest testimonials displayed on the homepage • {currentDate}</p>
        </div>
        
        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{items.length}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, country, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        {isReadOnly ? (
          <div className="inline-flex items-center rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">
            <PlusIcon className="h-4 w-4 mr-2"/>Add Testimonial (Read-Only)
          </div>
        ) : (
          <Link href="/admin/testimonials/new" className="inline-flex items-center rounded-lg bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors">
            <PlusIcon className="h-4 w-4 mr-2"/>Add Testimonial
          </Link>
        )}
      </div>

      {/* Clean List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <SparklesIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600">No testimonials found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search or add your first testimonial</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredItems.map((i) => (
              <div key={i.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EBDDCC] text-[#BE8C53] font-kaisei text-lg flex-shrink-0">
                    {i.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{i.name}</p>
                    <p className="text-sm text-gray-500">{i.country} ({i.countryCode})</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{i.text}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isReadOnly ? (
                    <>
                      <div className="text-gray-400 cursor-not-allowed" title="Read-only mode: Editing disabled">
                        <PencilIcon className="h-5 w-5" />
                      </div>
                      <div className="text-gray-400 cursor-not-allowed" title="Read-only mode: Deletion disabled">
                        <TrashIcon className="h-5 w-5" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href={`/admin/testimonials/edit/${i.id}`} className="text-blue-600 hover:text-blue-900 transition-colors">
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button onClick={()=>setConfirmId(i.id)} disabled={deleting===i.id} className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete testimonial?</h3>
            <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={()=>setConfirmId(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting===confirmId} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">{deleting===confirmId?'Deleting...':'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
