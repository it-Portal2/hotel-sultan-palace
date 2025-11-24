"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlusIcon, TrashIcon, PhotoIcon, TagIcon, PencilIcon } from '@heroicons/react/24/outline';
import { getOffers, deleteOffer, OfferBanner, getSpecialOffers, deleteSpecialOffer, SpecialOffer } from '@/lib/firestoreService';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';

export default function AdminOffersPage() {
  const { isReadOnly } = useAdminRole();
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'banner' | 'special' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [bannersData, specialOffersData] = await Promise.all([
        getOffers(),
        getSpecialOffers()
      ]);
      setBanners(bannersData);
      setSpecialOffers(specialOffersData);
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
    } else if (confirmType === 'special') {
      ok = await deleteSpecialOffer(confirmId);
      if (ok) setSpecialOffers(specialOffers.filter(i => i.id !== confirmId));
    }
    setDeleting(null);
    setConfirmId(null);
    setConfirmType(null);
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
                    <div className="relative h-16 w-64">
                      <Image src={i.imageUrl} alt="offer" fill className="object-cover rounded" sizes="256px" unoptimized onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/offer-image.jpg'}} />
                    </div>
                    <div className="flex items-center gap-3">
                      {!isReadOnly && (
                        <Link href={`/admin/offers/edit/${i.id}`} className="text-blue-600 hover:text-blue-900">
                          <PencilIcon className="h-5 w-5"/>
                        </Link>
                      )}
                      {isReadOnly ? (
                        <div className="text-gray-400 cursor-not-allowed" title="Read-only mode: Deletion disabled">
                          <TrashIcon className="h-5 w-5"/>
                        </div>
                      ) : (
                        <button onClick={()=>{setConfirmId(i.id); setConfirmType('banner');}} disabled={deleting===i.id} className="text-red-600 hover:text-red-900 disabled:opacity-50"><TrashIcon className="h-5 w-5"/></button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Special Offers Section */}
      <div className="space-y-4">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Special Offers</h2>
            <p className="mt-1 text-sm text-gray-600">Create special offers (Holi, New Year, Valentine, etc.) with push notifications</p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            {isReadOnly ? (
              <div className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">
                <PlusIcon className="h-4 w-4 mr-2" />Add Special Offer (Read-Only)
              </div>
            ) : (
              <Link href="/admin/offers/special/new" className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
                <PlusIcon className="h-4 w-4 mr-2" />Add Special Offer
              </Link>
            )}
          </div>
        </div>
        {specialOffers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No special offers</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first special offer.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {specialOffers.map((offer) => (
                <li key={offer.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          {offer.imageUrl && (
                            <div className="relative h-20 w-32 flex-shrink-0">
                              <Image 
                                src={offer.imageUrl} 
                                alt={offer.title} 
                                fill 
                                className="object-cover rounded" 
                                sizes="128px" 
                                unoptimized 
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/offer-image.jpg';
                                }} 
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{offer.description}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                offer.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {offer.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {offer.couponCode && (
                                <span className="px-2 py-1 rounded text-xs font-mono font-medium bg-orange-100 text-orange-800">
                                  Code: {offer.couponCode}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {offer.discountType === 'percentage' 
                                  ? `${offer.discountValue}% off`
                                  : `$${offer.discountValue} off`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {!isReadOnly && (
                          <Link href={`/admin/offers/special/edit/${offer.id}`} className="text-blue-600 hover:text-blue-900">
                            <PencilIcon className="h-5 w-5"/>
                          </Link>
                        )}
                        {isReadOnly ? (
                          <div className="text-gray-400 cursor-not-allowed" title="Read-only mode: Deletion disabled">
                            <TrashIcon className="h-5 w-5"/>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {setConfirmId(offer.id); setConfirmType('special');}} 
                            disabled={deleting === offer.id} 
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <TrashIcon className="h-5 w-5"/>
                          </button>
                        )}
                      </div>
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
              Delete {confirmType === 'banner' ? 'banner' : 'special offer'}?
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


