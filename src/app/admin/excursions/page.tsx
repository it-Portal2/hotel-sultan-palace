"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SparklesIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getExcursions, deleteExcursion, Excursion } from '@/lib/firestoreService';

export default function AdminExcursionsPage() {
  const [items, setItems] = useState<Excursion[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <div className="flex justify-center items-center h-64"><div className="h-12 w-12 border-b-2 border-orange-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Excursions</h1>
          <p className="mt-2 text-gray-600">Manage homepage excursions (static section shows first 5, extras appear under “View All”)</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link href="/admin/excursions/new" className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"><PlusIcon className="h-4 w-4 mr-2"/>Add Excursion</Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No excursions</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first excursion.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {items.map((i) => (
              <li key={i.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex items-center">
                    <img src={i.image} alt={i.title} className="h-12 w-20 object-cover rounded" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/excursions/excursions_safari.png'}}/>
                    <p className="ml-4 text-sm font-medium text-gray-900">{i.title}</p>
                  </div>
                  <button onClick={()=>setConfirmId(i.id)} disabled={deleting===i.id} className="text-red-600 hover:text-red-900 disabled:opacity-50">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete item?</h3>
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


