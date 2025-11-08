"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { getOffers, deleteOffer, OfferBanner } from '@/lib/firestoreService';
import BackButton from '@/components/admin/BackButton';

export default function AdminOffersPage() {
  const [items, setItems] = useState<OfferBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getOffers();
      setItems(data);
      setLoading(false);
    })();
  }, []);

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(confirmId);
    const ok = await deleteOffer(confirmId);
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
          <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
          <p className="mt-2 text-gray-600">Upload banner images for the homepage Offers carousel</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link href="/admin/offers/new" className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
            <PlusIcon className="h-4 w-4 mr-2" />Add Offer
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No offers</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first banner.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {items.map((i)=> (
              <li key={i.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <img src={i.imageUrl} alt="offer" className="h-16 w-64 object-cover rounded" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/offer-image.jpg'}} />
                  <button onClick={()=>setConfirmId(i.id)} disabled={deleting===i.id} className="text-red-600 hover:text-red-900 disabled:opacity-50"><TrashIcon className="h-5 w-5"/></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete banner?</h3>
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


