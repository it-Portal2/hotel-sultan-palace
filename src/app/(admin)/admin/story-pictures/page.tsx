"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getStoryImages, deleteStoryImage, StoryImage } from '@/lib/firestoreService';
import { PlusIcon, TrashIcon, PhotoIcon, PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

import { useAdminRole } from '@/context/AdminRoleContext';

export default function AdminStoryPicturesPage() {
  const { isReadOnly } = useAdminRole();
  const [items, setItems] = useState<StoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const dedupeRun = useRef(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getStoryImages();
      setItems(data);
      setLoading(false);

      if (!dedupeRun.current) {
        dedupeRun.current = true;
        try {
          const keyOf = (i: StoryImage) => `${i.imageUrl}|${i.title || ''}|${(i.text || '').slice(0, 64)}`;
          const seen = new Map<string, string>();
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

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.alt || '').toLowerCase().includes(q) ||
      (item.author || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(confirmId);
    const ok = await deleteStoryImage(confirmId);
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Story in Pictures</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Curate the visual journey of your hotel • {currentDate}</p>
        </div>

        <div className="flex items-center gap-3">
          {isReadOnly ? (
            <button disabled className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-400 cursor-not-allowed transition-all">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Story
            </button>
          ) : (
            <Link href="/admin/story-pictures/new" className="inline-flex items-center justify-center rounded-xl bg-[#FF6A00] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#FF6A00]/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Story
            </Link>
          )}
        </div>
      </div>

      {/* Stats & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-6 sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur-sm py-4 -my-4 border-b border-gray-100/50">

        {/* Simple Stats Pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm text-gray-600 self-start lg:self-center">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Total Stories: <strong className="text-gray-900">{items.length}</strong></span>
        </div>

        <div className="w-full lg:w-96 relative flex-shrink-0 ml-auto">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, author, location..."
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
            <PhotoIcon className="h-8 w-8 text-[#FF6A00]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No stories found</h3>
          <p className="text-gray-500 mt-2 text-center max-w-sm">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Start building your visual story by adding your first image.'}
          </p>
          {!isReadOnly && !searchQuery && (
            <Link href="/admin/story-pictures/new" className="mt-6 text-[#FF6A00] font-medium hover:underline">
              Create a story
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(i => (
            <div key={i.id} className="group relative break-inside-avoid bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#FF6A00]/30 transition-all duration-300 overflow-hidden flex flex-col">

              {/* Image Container */}
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                <Image
                  src={i.imageUrl}
                  alt={i.alt || 'Story image'}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/story/story1.png' }}
                />

                {/* Overlay actions */}
                <div className="absolute top-3 right-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  {isReadOnly ? (
                    <>
                      <div className="p-2 backdrop-blur-md bg-white/20 hover:bg-white/30 text-white rounded-lg cursor-not-allowed"><PencilSquareIcon className="h-5 w-5" /></div>
                      <div className="p-2 backdrop-blur-md bg-white/20 hover:bg-white/30 text-white rounded-lg cursor-not-allowed"><TrashIcon className="h-5 w-5" /></div>
                    </>
                  ) : (
                    <>
                      <Link href={`/admin/story-pictures/edit/${i.id}`} className="p-2 backdrop-blur-md bg-white/20 hover:bg-white text-white hover:text-blue-600 rounded-lg shadow-sm transition-colors border border-white/20">
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                      <button onClick={() => setConfirmId(i.id)} disabled={deleting === i.id} className="p-2 backdrop-blur-md bg-white/20 hover:bg-white text-white hover:text-red-600 rounded-lg shadow-sm transition-colors border border-white/20">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 text-lg">{i.title || 'Untitled Story'}</h3>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                    {i.author || 'Unknown Author'}
                  </span>
                  {i.location && (
                    <span className="flex items-center gap-1.5 text-orange-600/80 font-medium">
                      <span className="w-1 h-1 rounded-full bg-orange-400"></span>
                      {i.location}
                    </span>
                  )}
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
        title="Delete story?"
        message="Are you sure you want to delete this story? This action cannot be undone."
        confirmText={deleting === confirmId ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
      />
    </div>
  );
}
