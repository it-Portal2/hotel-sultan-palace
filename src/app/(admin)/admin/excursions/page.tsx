"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SparklesIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getExcursions, deleteExcursion, Excursion } from '@/lib/firestoreService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useAdminRole } from '@/context/AdminRoleContext';

export default function AdminExcursionsPage() {
  const { isReadOnly } = useAdminRole();
  const [items, setItems] = useState<Excursion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getExcursions();
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
      (item.title || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      setDeleting(confirmId);
      const ok = await deleteExcursion(confirmId);
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Excursions</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Manage homepage excursions and activities • {currentDate}</p>
        </div>

        <div className="flex items-center gap-3">
          {isReadOnly ? (
            <button disabled className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-400 cursor-not-allowed transition-all">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Excursion
            </button>
          ) : (
            <Link href="/admin/excursions/new" className="inline-flex items-center justify-center rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#FF6A00]/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Excursion
            </Link>
          )}
        </div>
      </div>

      {/* Stats & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-6 sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur-sm py-4 -my-4 border-b border-gray-100/50">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm text-gray-600 self-start lg:self-center">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Total Excursions: <strong className="text-gray-900">{items.length}</strong></span>
        </div>

        <div className="w-full lg:w-96 relative flex-shrink-0 ml-auto">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search excursions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 bg-white transition-all outline-none text-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Grid Layout */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="bg-orange-50 p-4 rounded-full mb-4">
            <SparklesIcon className="h-8 w-8 text-[#FF6A00]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No excursions found</h3>
          <p className="text-gray-500 mt-2 text-center max-w-sm">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Add your first excursion to showcase activities.'}
          </p>
          {!isReadOnly && !searchQuery && (
            <Link href="/admin/excursions/new" className="mt-6 text-[#FF6A00] font-medium hover:underline">
              Create an excursion
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((i) => (
            <div key={i.id} className="group relative break-inside-avoid bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#FF6A00]/30 transition-all duration-300 overflow-hidden">
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <Image
                  src={i.image}
                  alt={i.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/excursions/excursions_safari.png' }}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity duration-300" />

                {/* Delete Action (Top Right) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  {isReadOnly ? (
                    <div className="p-2 backdrop-blur-md bg-white/20 text-white rounded-lg cursor-not-allowed"><TrashIcon className="h-5 w-5" /></div>
                  ) : (
                    <button onClick={() => setConfirmId(i.id)} disabled={deleting === i.id} className="p-2 backdrop-blur-md bg-white/20 hover:bg-white text-white hover:text-red-600 rounded-lg shadow-sm transition-colors border border-white/20">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Content Overlay (Bottom Left) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-semibold text-lg leading-tight shadow-black/50 drop-shadow-md">{i.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Excursion"
        message="Are you sure you want to delete this excursion? This action cannot be undone."
        confirmText={deleting === confirmId ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
      />
    </div>
  );
}
