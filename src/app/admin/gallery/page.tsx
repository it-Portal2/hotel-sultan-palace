"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getGalleryImages, deleteGalleryImage, GalleryImage } from '@/lib/firestoreService';
import { PlusIcon, TrashIcon, PencilSquareIcon, PhotoIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';

export default function AdminGalleryPage() {
  const { isReadOnly } = useAdminRole();
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => 
      (item.type || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const stats = useMemo(() => {
    const types = new Set(items.map(i => i.type));
    return {
      total: items.length,
      types: types.size,
    };
  }, [items]);

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(confirmId);
    const ok = await deleteGalleryImage(confirmId);
    if (ok) setItems(items.filter(i => i.id !== confirmId));
    setDeleting(null);
    setConfirmId(null);
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
          <h1 className="text-2xl font-semibold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">Upload images for the gallery • {currentDate}</p>
        </div>
        
        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Types:</span>
            <span className="font-semibold text-gray-900">{stats.types}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        {isReadOnly ? (
          <div className="inline-flex items-center rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">
            <PlusIcon className="h-4 w-4 mr-2"/>Add Image (Read-Only)
          </div>
        ) : (
          <Link href="/admin/gallery/new" className="inline-flex items-center rounded-lg bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors">
            <PlusIcon className="h-4 w-4 mr-2"/>Add Image
          </Link>
        )}
      </div>

      {/* Clean Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <PhotoIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600">No images found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search or add your first gallery image</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(i => (
            <div key={i.id} className="group relative rounded-lg overflow-hidden bg-white border border-gray-200 hover:border-[#FF6A00] transition-all">
              <div className="px-3 py-2 text-center border-b border-gray-200 bg-gray-50">
                <span className="text-xs font-semibold text-gray-800">
                  {i.type ? i.type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'No Type'}
                </span>
              </div>
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <Image
                  src={i.imageUrl}
                  alt={i.type || 'Gallery image'}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                  onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/gallery/gallery-1.png'}}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isReadOnly ? (
                    <>
                      <div className="p-1.5 rounded bg-white/90 text-gray-400 cursor-not-allowed shadow" title="Read-only mode: Editing disabled"><PencilSquareIcon className="h-4 w-4"/></div>
                      <div className="p-1.5 rounded bg-white/90 text-gray-400 cursor-not-allowed shadow" title="Read-only mode: Deletion disabled"><TrashIcon className="h-4 w-4"/></div>
                    </>
                  ) : (
                    <>
                      <Link href={`/admin/gallery/edit/${i.id}`} className="p-1.5 rounded bg-white/90 text-blue-600 hover:bg-white shadow transition-colors"><PencilSquareIcon className="h-4 w-4"/></Link>
                      <button onClick={()=>setConfirmId(i.id)} disabled={deleting===i.id} className="p-1.5 rounded bg-white/90 text-red-600 hover:bg-white shadow disabled:opacity-50 transition-colors"><TrashIcon className="h-4 w-4"/></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete image?</h3>
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
