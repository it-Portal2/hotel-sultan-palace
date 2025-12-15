"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlusIcon, TrashIcon, PhotoIcon, TagIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getOffers, deleteOffer, OfferBanner, getSpecialOffers, deleteSpecialOffer, SpecialOffer } from '@/lib/firestoreService';

import { useAdminRole } from '@/context/AdminRoleContext';
import RestrictedAction from '@/components/admin/RestrictedAction';

const isOfferExpired = (offer: SpecialOffer): boolean => {
  if (!offer.endDate) return false;
  const now = new Date();
  const endDate = new Date(offer.endDate);
  endDate.setHours(23, 59, 59, 999);
  return now > endDate;
};

const getOfferStatus = (offer: SpecialOffer): { label: string; className: string } => {
  if (isOfferExpired(offer)) {
    return { label: 'Expired', className: 'bg-red-100 text-red-800' };
  }
  if (offer.isActive) {
    return { label: 'Active', className: 'bg-green-100 text-green-800' };
  }
  return { label: 'Inactive', className: 'bg-gray-100 text-gray-800' };
};

export default function AdminOffersPage() {
  const { isReadOnly } = useAdminRole();
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredSpecialOffers = useMemo(() => {
    if (!searchQuery.trim()) return specialOffers;
    const q = searchQuery.toLowerCase();
    return specialOffers.filter(offer =>
      (offer.title || '').toLowerCase().includes(q) ||
      (offer.description || '').toLowerCase().includes(q) ||
      (offer.couponCode || '').toLowerCase().includes(q)
    );
  }, [specialOffers, searchQuery]);

  const stats = useMemo(() => {
    return {
      banners: banners.length,
      specialOffers: specialOffers.length,
      activeOffers: specialOffers.filter(o => o.isActive && !isOfferExpired(o)).length,
    };
  }, [banners, specialOffers]);

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-12 w-12 border-b-2 border-[#FF6A00] rounded-full animate-spin" /></div>;

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-8">


      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Offers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage banner images and discount offers • {currentDate}</p>
        </div>

        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Banners:</span>
            <span className="font-semibold text-gray-900">{stats.banners}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-gray-600">Special:</span>
            <span className="font-semibold text-gray-900">{stats.specialOffers}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Active:</span>
            <span className="font-semibold text-gray-900">{stats.activeOffers}</span>
          </div>
        </div>
      </div>

      {/* Banners Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Banners</h2>
            <p className="text-sm text-gray-500 mt-1">Banner images for the homepage Offers carousel</p>
          </div>
          {isReadOnly ? (
            <RestrictedAction message="You don't have permission to add banners">
              <div className="inline-flex items-center rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
                <PlusIcon className="h-4 w-4 mr-2" />Add Banner
              </div>
            </RestrictedAction>
          ) : (
            <Link href="/admin/offers/new" className="inline-flex items-center rounded-lg bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors">
              <PlusIcon className="h-4 w-4 mr-2" />Add Banner
            </Link>
          )}
        </div>

        {banners.length === 0 ? (
          <div className="text-center py-16">
            <PhotoIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-600">No banners</p>
            <p className="text-sm text-gray-500 mt-2">Add your first banner</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {banners.map((i) => (
                <div key={i.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="relative h-16 w-64 flex-shrink-0">
                    <Image src={i.imageUrl} alt="offer" fill className="object-cover rounded" sizes="256px" unoptimized onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/offer-image.jpg' }} />
                  </div>
                  <div className="flex items-center gap-3">
                    {!isReadOnly && (
                      <Link href={`/admin/offers/edit/${i.id}`} className="text-blue-600 hover:text-blue-900 transition-colors">
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                    )}
                    {isReadOnly ? (
                      <RestrictedAction message="You don't have permission to delete banners">
                        <div className="text-gray-400">
                          <TrashIcon className="h-5 w-5" />
                        </div>
                      </RestrictedAction>
                    ) : (
                      <button onClick={() => { setConfirmId(i.id); setConfirmType('banner'); }} disabled={deleting === i.id} className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"><TrashIcon className="h-5 w-5" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Special Offers Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Special Offers</h2>
            <p className="text-sm text-gray-500 mt-1">Create special offers (Holi, New Year, Valentine, etc.) with push notifications</p>
          </div>
          {isReadOnly ? (
            <RestrictedAction message="You don't have permission to add special offers">
              <div className="inline-flex items-center rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
                <PlusIcon className="h-4 w-4 mr-2" />Add Special Offer
              </div>
            </RestrictedAction>
          ) : (
            <Link href="/admin/offers/special/new" className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors">
              <PlusIcon className="h-4 w-4 mr-2" />Add Special Offer
            </Link>
          )}
        </div>

        {/* Simple Search Bar for Special Offers */}
        {specialOffers.length > 0 && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search special offers by title, description, or coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
            />
          </div>
        )}

        {filteredSpecialOffers.length === 0 ? (
          <div className="text-center py-16">
            <TagIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-600">No special offers found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchQuery ? 'Try adjusting your search' : 'Add your first special offer'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredSpecialOffers.map((offer) => {
                const status = getOfferStatus(offer);
                return (
                  <div key={offer.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
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
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900">{offer.title}</h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{offer.description}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.className}`}>
                              {status.label}
                            </span>
                            {offer.couponCode && (
                              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-orange-100 text-orange-800">
                                Code: {offer.couponCode}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {offer.discountType === 'percentage'
                                ? `${offer.discountValue}% off`
                                : `$${offer.discountValue} off`}
                            </span>
                            {offer.endDate && (
                              <span className="text-xs text-gray-500">
                                Expires: {new Date(offer.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {!isReadOnly && (
                          <Link href={`/admin/offers/special/edit/${offer.id}`} className="text-blue-600 hover:text-blue-900 transition-colors">
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                        )}
                        {isReadOnly ? (
                          <RestrictedAction message="You don't have permission to delete special offers">
                            <div className="text-gray-400">
                              <TrashIcon className="h-5 w-5" />
                            </div>
                          </RestrictedAction>
                        ) : (
                          <button
                            onClick={() => { setConfirmId(offer.id); setConfirmType('special'); }}
                            disabled={deleting === offer.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {confirmId && confirmType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete {confirmType === 'banner' ? 'banner' : 'special offer'}?
            </h3>
            <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setConfirmId(null); setConfirmType(null); }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting === confirmId} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">{deleting === confirmId ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
