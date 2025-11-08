"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getGalleryImages, deleteGalleryImage, GalleryImage } from '@/lib/firestoreService';
import { PlusIcon, TrashIcon, PhotoIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/admin/BackButton';

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
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

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(confirmId);
    const ok = await deleteGalleryImage(confirmId);
    if (ok) setItems(items.filter(i => i.id !== confirmId));
    setDeleting(null);
    setConfirmId(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-12 w-12 border-b-2 border-orange-500 rounded-full animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Dashboard" />
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="mt-2 text-gray-600">Upload images for the gallery. Choose the correct type so users can filter.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link href="/admin/gallery/new" className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"><PlusIcon className="h-4 w-4 mr-2"/>Add Image</Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first gallery image.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map(i => (
            <div key={i.id} className="group relative rounded-xl overflow-hidden bg-white shadow hover:shadow-lg transition-shadow duration-300 flex flex-col" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div className="px-3 py-2.5 text-center border-b border-gray-200 bg-white min-h-[40px] flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-800 block w-full">
                  {i.type ? i.type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'No Type'}
                </span>
              </div>
              <div className="relative w-full aspect-[4/3] bg-gray-100 flex-shrink-0">
                <img
                  src={i.imageUrl}
                  alt={i.type || 'Gallery image'}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/gallery/gallery-1.png'}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <Link href={`/admin/gallery/edit/${i.id}`} className="p-1.5 rounded bg-white/90 text-blue-600 hover:bg-white shadow"><PencilSquareIcon className="h-4 w-4"/></Link>
                  <button onClick={()=>setConfirmId(i.id)} disabled={deleting===i.id} className="p-1.5 rounded bg-white/90 text-red-600 hover:bg-white shadow disabled:opacity-50"><TrashIcon className="h-4 w-4"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete image?</h3>
            <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={()=>setConfirmId(null)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting===confirmId} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{deleting===confirmId?'Deleting...':'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


