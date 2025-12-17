"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { SparklesIcon, PlusIcon, TrashIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getTestimonials, deleteTestimonial, Testimonial } from '@/lib/firestoreService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Testimonials</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Manage guest reviews and feedback • {currentDate}</p>
        </div>

        <div className="flex items-center gap-3">
          {isReadOnly ? (
            <button disabled className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-400 cursor-not-allowed transition-all">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Testimonial
            </button>
          ) : (
            <Link href="/admin/testimonials/new" className="inline-flex items-center justify-center rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#FF6A00]/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Testimonial
            </Link>
          )}
        </div>
      </div>

      {/* Stats & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-6 sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur-sm py-4 -my-4 border-b border-gray-100/50">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm text-gray-600 self-start lg:self-center">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          <span>Total Reviews: <strong className="text-gray-900">{items.length}</strong></span>
        </div>

        <div className="w-full lg:w-96 relative flex-shrink-0 ml-auto">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 bg-white transition-all outline-none text-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Card Grid Layout */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="bg-orange-50 p-4 rounded-full mb-4">
            <SparklesIcon className="h-8 w-8 text-[#FF6A00]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No testimonials found</h3>
          <p className="text-gray-500 mt-2 text-center max-w-sm">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Add your first guest testimonial to build trust.'}
          </p>
          {!isReadOnly && !searchQuery && (
            <Link href="/admin/testimonials/new" className="mt-6 text-[#FF6A00] font-medium hover:underline">
              Add a review
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((i) => (
            <div key={i.id} className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#FF6A00]/30 transition-all duration-300 overflow-hidden">
              <div className="p-6 flex flex-col h-full">
                {/* Header: Avatar & Name */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#EBDDCC] text-[#BE8C53] flex items-center justify-center text-lg font-serif font-bold shadow-inner">
                      {i.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">{i.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {i.countryCode && (
                          <span className="text-lg leading-none" role="img" aria-label={i.country}>{i.countryCode}</span>
                        )}
                        <span className="text-xs text-gray-500 font-medium">{i.country}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isReadOnly && (
                      <Link href={`/admin/testimonials/edit/${i.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><PencilIcon className="h-4 w-4" /></Link>
                    )}
                    {isReadOnly ? (
                      <button disabled className="p-1.5 text-gray-300 cursor-not-allowed"><TrashIcon className="h-4 w-4" /></button>
                    ) : (
                      <button onClick={() => setConfirmId(i.id)} disabled={deleting === i.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>

                {/* Quote Content */}
                <div className="relative">
                  <span className="absolute -top-2 -left-1 text-4xl text-gray-200 font-serif leading-none">“</span>
                  <p className="relative z-10 text-gray-600 text-sm leading-relaxed italic line-clamp-4 pl-4">
                    {i.text}
                  </p>
                </div>
              </div>

              {/* Decorative bottom bar */}
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#FF6A00]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial? This action cannot be undone."
        confirmText={deleting === confirmId ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
      />
    </div>
  );
}
