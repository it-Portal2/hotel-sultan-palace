"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, TrashIcon, PhotoIcon, TagIcon } from '@heroicons/react/24/outline';
import { getOffers, deleteOffer, OfferBanner, getDiscountOffers, deleteDiscountOffer, DiscountOffer, updateDiscountOffer } from '@/lib/firestoreService';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';

export default function AdminOffersPage() {
  const { isReadOnly } = useAdminRole();
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [discounts, setDiscounts] = useState<DiscountOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'banner' | 'discount' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [bannersData, discountsData] = await Promise.all([
        getOffers(),
        getDiscountOffers()
      ]);
      setBanners(bannersData);
      setDiscounts(discountsData);
      setLoading(false);
    })();
  }, []);

  const confirmDelete = async () => {
    if (!confirmId || !confirmType) return;
    setDeleting(confirmId);
    let ok = false;
    if (confirmType === 'banner') {
      ok = await deleteOffer(confirmId);
      if (ok) setBanners(banners.filter(i => i.id !== confirmId));
    } else {
      ok = await deleteDiscountOffer(confirmId);
      if (ok) setDiscounts(discounts.filter(i => i.id !== confirmId));
    }
    setDeleting(null);
    setConfirmId(null);
    setConfirmType(null);
  };

  const toggleDiscountActive = async (id: string, currentActive: boolean) => {
    if (isReadOnly) return;
    const newActive = !currentActive;
    const ok = await updateDiscountOffer(id, { isActive: newActive });
    if (ok) {
      setDiscounts(discounts.map(d => 
        d.id === id 
          ? { ...d, isActive: newActive }
          : newActive ? { ...d, isActive: false } : d
      ));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-12 w-12 border-b-2 border-orange-500 rounded-full animate-spin"/></div>;

  return (
    <div className="space-y-8">
      <BackButton href="/admin" label="Back to Dashboard" />
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
          <p className="mt-2 text-gray-600">Manage banner images and discount offers</p>
        </div>
      </div>

      {/* Banners Section */}
      <div className="space-y-4">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Banners</h2>
            <p className="mt-1 text-sm text-gray-600">Banner images for the homepage Offers carousel</p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            {isReadOnly ? (
              <div className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">
                <PlusIcon className="h-4 w-4 mr-2" />Add Banner (Read-Only)
              </div>
            ) : (
              <Link href="/admin/offers/new" className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                <PlusIcon className="h-4 w-4 mr-2" />Add Banner
              </Link>
            )}
          </div>
        </div>

        {banners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No banners</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first banner.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {banners.map((i)=> (
                <li key={i.id}>
                  <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                    <img src={i.imageUrl} alt="offer" className="h-16 w-64 object-cover rounded" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/offer-image.jpg'}} />
                    {isReadOnly ? (
                      <div className="text-gray-400 cursor-not-allowed" title="Read-only mode: Deletion disabled">
                        <TrashIcon className="h-5 w-5"/>
                      </div>
                    ) : (
                      <button onClick={()=>{setConfirmId(i.id); setConfirmType('banner');}} disabled={deleting===i.id} className="text-red-600 hover:text-red-900 disabled:opacity-50"><TrashIcon className="h-5 w-5"/></button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Discounts Section */}
      <div className="space-y-4">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Discounts</h2>
            <p className="mt-1 text-sm text-gray-600">Manage discount percentages for room bookings</p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            {isReadOnly ? (
              <div className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">
                <PlusIcon className="h-4 w-4 mr-2" />Add Discount (Read-Only)
              </div>
            ) : (
              <Link href="/admin/offers/discount/new" className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                <PlusIcon className="h-4 w-4 mr-2" />Add Discount
              </Link>
            )}
          </div>
        </div>

        {discounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No discounts</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first discount offer.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {discounts.map((d)=> (
                <li key={d.id}>
                  <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">Discount: </span>
                        <span className="text-orange-600 font-bold text-lg">{d.discountPercent}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          d.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isReadOnly && (
                        <button
                          onClick={() => toggleDiscountActive(d.id, d.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            d.isActive
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {d.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {isReadOnly ? (
                        <div className="text-gray-400 cursor-not-allowed" title="Read-only mode: Deletion disabled">
                          <TrashIcon className="h-5 w-5"/>
                        </div>
                      ) : (
                        <button onClick={()=>{setConfirmId(d.id); setConfirmType('discount');}} disabled={deleting===d.id} className="text-red-600 hover:text-red-900 disabled:opacity-50"><TrashIcon className="h-5 w-5"/></button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {confirmId && confirmType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete {confirmType === 'banner' ? 'banner' : 'discount'}?
            </h3>
            <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={()=>{setConfirmId(null); setConfirmType(null);}} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting===confirmId} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{deleting===confirmId?'Deleting...':'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


