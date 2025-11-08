"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getStoryImages, deleteStoryImage, StoryImage } from '@/lib/firestoreService';
import { PlusIcon, TrashIcon, PhotoIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/admin/BackButton';

export default function AdminStoryPicturesPage() {
  const [items, setItems] = useState<StoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const dedupeRun = useRef(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getStoryImages();
      setItems(data);
      setLoading(false);

      // One-time background de-duplication (same imageUrl+title+text)
      if (!dedupeRun.current) {
        dedupeRun.current = true;
        try {
          const keyOf = (i: StoryImage) => `${i.imageUrl}|${i.title || ''}|${(i.text || '').slice(0,64)}`;
          const seen = new Map<string, string>(); // key -> id to keep
          const toDelete: string[] = [];
          for (const it of data) {
            const k = keyOf(it);
            if (!seen.has(k)) {
              seen.set(k, it.id);
            } else {
              toDelete.push(it.id);
            }
          }
          if (toDelete.length) {
            // delete extras silently and update UI
            await Promise.all(toDelete.map(id => deleteStoryImage(id)));
            const remainingIds = new Set<string>([...seen.values()]);
            setItems(prev => prev.filter(i => remainingIds.has(i.id)));
          }
        } catch (e) {
          console.warn('De-duplication skipped:', e);
        }
      }
    })();
  }, []);

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(confirmId);
    const ok = await deleteStoryImage(confirmId);
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
          <h1 className="text-3xl font-bold text-gray-900">Story in Pictures</h1>
          <p className="mt-2 text-gray-600">Add images for the home &apos;Story in Pictures&apos; gallery</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link href="/admin/story-pictures/new" className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"><PlusIcon className="h-4 w-4 mr-2"/>Add Image</Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first story image.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {items.map(i => (
              <li key={i.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6 gap-4">
                  <div className="flex items-center gap-4">
                    <img src={i.imageUrl} alt={i.alt || 'image'} className="h-16 w-32 object-cover rounded" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/story/story1.png'}} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{i.title || i.alt || 'Untitled story'}</p>
                      {(i.author || i.location) && (
                        <p className="text-xs text-gray-500 truncate">{[i.author, i.location].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/story-pictures/edit/${i.id}`} title="Edit" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
                      <PencilSquareIcon className="h-5 w-5" />
                    </Link>
                    <button onClick={()=>setConfirmId(i.id)} title="Delete" disabled={deleting===i.id} className="text-red-600 hover:text-red-900 disabled:opacity-50"><TrashIcon className="h-5 w-5"/></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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


