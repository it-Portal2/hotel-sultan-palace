"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getGalleryImages, deleteGalleryImage, GalleryImage } from '@/lib/firestoreService';
import { PlusIcon, TrashIcon, PencilSquareIcon, PhotoIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

import { useAdminRole } from '@/context/AdminRoleContext';

export default function AdminGalleryPage() {
  const { isReadOnly } = useAdminRole();
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const dedupeRun = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getGalleryImages();
      setItems(data);
      setLoading(false);

      if (!dedupeRun.current) {
        dedupeRun.current = true;
        try {
          const keyOf = (i: GalleryImage) => `${i.imageUrl}|${i.type}`;
          const seen = new Map<string, string>();
          const toDelete: string[] = [];
          for (const it of data) {
            const k = keyOf(it);
            if (!seen.has(k)) seen.set(k, it.id); else toDelete.push(it.id);
          }
          if (toDelete.length) {
            await Promise.all(toDelete.map(id => deleteGalleryImage(id)));
            const keep = new Set(seen.values());
            setItems(prev => prev.filter(i => keep.has(i.id)));
          }
        } catch (e) {
          console.warn('Gallery dedupe skipped:', e);
        }
      }
    })();
  }, []);

  const uniqueTypes = useMemo(() => {
    const types = new Set(items.map(i => i.type || 'Uncategorized'));
    return ['All', ...Array.from(types).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (selectedType !== 'All') {
      filtered = filtered.filter(i => (i.type || 'Uncategorized') === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.type || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, searchQuery, selectedType]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      types: uniqueTypes.length - 1, // Subtract 'All'
    };
  }, [items, uniqueTypes]);

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(confirmId);
    const ok = await deleteGalleryImage(confirmId);
    if (ok) setItems(items.filter(i => i.id !== confirmId));
    setDeleting(null);
    setConfirmId(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-12 w-12 border-b-2 border-[#FF6A00] rounded-full animate-spin" /></div>;

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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gallery</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Manage your website's visual content • {currentDate}</p>
        </div>

        <div className="flex items-center gap-3">
          {isReadOnly ? (
            <button disabled className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-400 cursor-not-allowed transition-all">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Image
            </button>
          ) : (
            <Link href="/admin/gallery/new" className="inline-flex items-center justify-center rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#FF6A00]/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Image
            </Link>
          )}
        </div>
      </div>

      {/* Stats & Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-6 sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur-sm py-4 -my-4 border-b border-gray-100/50">

        {/* Category Pills */}
        <div className="flex-1 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2">
            {uniqueTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${selectedType === type
                  ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-md shadow-orange-500/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#FF6A00] hover:text-[#FF6A00]'
                  }`}
              >
                {type === 'All' ? 'All Images' : type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-64 relative flex-shrink-0">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 bg-white transition-all outline-none text-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Masonry-style Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="bg-orange-50 p-4 rounded-full mb-4">
            <PhotoIcon className="h-8 w-8 text-[#FF6A00]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No images found</h3>
          <p className="text-gray-500 mt-2 text-center max-w-sm">
            {searchQuery || selectedType !== 'All'
              ? 'Try adjusting your filters or search query to find what you\'re looking for.'
              : 'Get started by adding your first image to the gallery.'}
          </p>
          {!isReadOnly && !searchQuery && selectedType === 'All' && (
            <Link href="/admin/gallery/new" className="mt-6 text-[#FF6A00] font-medium hover:underline">
              Upload an image
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(i => (
            <div key={i.id} className="group relative break-inside-avoid bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#FF6A00]/30 transition-all duration-300 overflow-hidden">

              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <Image
                  src={i.imageUrl}
                  alt={i.type || 'Gallery image'}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/gallery/gallery-1.png' }}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Actions Overlay */}
                <div className="absolute top-3 right-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  {isReadOnly ? (
                    <>
                      <div className="p-2 backdrop-blur-md bg-white/20 hover:bg-white/30 text-white rounded-lg cursor-not-allowed" title="Read Only"><PencilSquareIcon className="h-5 w-5" /></div>
                      <div className="p-2 backdrop-blur-md bg-white/20 hover:bg-white/30 text-white rounded-lg cursor-not-allowed" title="Read Only"><TrashIcon className="h-5 w-5" /></div>
                    </>
                  ) : (
                    <>
                      <Link href={`/admin/gallery/edit/${i.id}`} className="p-2 backdrop-blur-md bg-white/20 hover:bg-white text-white hover:text-blue-600 rounded-lg shadow-sm transition-colors border border-white/20">
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                      <button onClick={() => setConfirmId(i.id)} disabled={deleting === i.id} className="p-2 backdrop-blur-md bg-white/20 hover:bg-white text-white hover:text-red-600 rounded-lg shadow-sm transition-colors border border-white/20">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    {i.type ? i.type.replace(/_/g, ' ') : 'Uncategorized'}
                  </span>
                </div>
                {/* <p className="text-xs text-gray-400 mt-2">Added on {new Date().toLocaleDateString()}</p> */}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Image"
        message="Are you sure you want to remove this image from the gallery? This action helps keep your portfolio clean but cannot be undone."
        confirmText={deleting === confirmId ? 'Deleting...' : 'Delete Image'}
        cancelText="Keep Image"
      />
    </div>
  );
}
