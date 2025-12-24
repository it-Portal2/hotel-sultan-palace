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
    <div className="space-y-12 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Offers & Promotions</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Manage banners and special deals • {currentDate}</p>
        </div>
      </div>

      {/* Banners Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Banners</h2>
            <p className="text-sm text-gray-500 mt-1">Carousels displayed on the homepage</p>
          </div>
          {isReadOnly ? (
            <RestrictedAction message="You don't have permission to add banners">
              <div className="inline-flex items-center rounded-xl border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400">
                <PlusIcon className="h-5 w-5 mr-2" />Add Banner
              </div>
            </RestrictedAction>
          ) : (
            <Link href="/admin/offers/new" className="inline-flex items-center rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-[#FF6A00] transition-colors shadow-sm">
              <PlusIcon className="h-5 w-5 mr-2 text-[#FF6A00]" />Add Banner
            </Link>
          )}
        </div>

        {banners.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">No banners active. Add one to showcase promotions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((i) => (
              <div key={i.id} className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 bg-white">
                <div className="relative h-48 w-full bg-gray-100">
                  <Image src={i.imageUrl} alt="offer" fill className="object-cover" sizes="400px" unoptimized onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/offer-image.jpg' }} />
                  {/* Actions Overlay */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isReadOnly && (
                      <Link href={`/admin/offers/edit/${i.id}`} className="p-2 backdrop-blur-md bg-white/90 hover:bg-white text-blue-600 rounded-lg shadow-sm transition-colors"><PencilIcon className="h-4 w-4" /></Link>
                    )}
                    {isReadOnly ? (
                      <div className="p-2 bg-white/50 text-gray-400 rounded-lg"><TrashIcon className="h-4 w-4" /></div>
                    ) : (
                      <button onClick={() => { setConfirmId(i.id); setConfirmType('banner'); }} disabled={deleting === i.id} className="p-2 backdrop-blur-md bg-white/90 hover:bg-white text-red-600 rounded-lg shadow-sm transition-colors"><TrashIcon className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-px bg-gray-100" />

      {/* Special Offers Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Special Offers</h2>
            <p className="text-sm text-gray-500 mt-1">Discount codes and seasonal deals</p>
          </div>
          {isReadOnly ? (
            <RestrictedAction message="You don't have permission to add special offers">
              <div className="inline-flex items-center rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400">
                <PlusIcon className="h-5 w-5 mr-2" />Add Special Offer
              </div>
            </RestrictedAction>
          ) : (
            <Link href="/admin/offers/special/new" className="inline-flex items-center rounded-xl bg-[#FF6A00] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#FF6A00]/90 transition-all">
              <PlusIcon className="h-5 w-5 mr-2" />Add Special Offer
            </Link>
          )}
        </div>

        {/* Search */}
        {specialOffers.length > 0 && (
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 bg-white transition-all outline-none text-sm placeholder:text-gray-400"
            />
          </div>
        )}

        {filteredSpecialOffers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <TagIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No special offers</h3>
            <p className="text-gray-500 mt-1">Create coupons and deals for your customers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSpecialOffers.map((offer) => {
              const status = getOfferStatus(offer);
              return (
                <div key={offer.id} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#FF6A00]/30 transition-all duration-300 overflow-hidden">

                  <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                    {offer.imageUrl ? (
                      <Image src={offer.imageUrl} alt={offer.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="400px" unoptimized onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/offer-image.jpg'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300"><TagIcon className="h-12 w-12" /></div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm uppercase tracking-wide ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{offer.title}</h3>
                      <div className="flex items-center gap-2">
                        {!isReadOnly && (
                          <Link href={`/admin/offers/special/edit/${offer.id}`} className="text-gray-400 hover:text-blue-600 transition-colors"><PencilIcon className="h-4 w-4" /></Link>
                        )}
                        <button onClick={() => { setConfirmId(offer.id); setConfirmType('special'); }} disabled={deleting === offer.id} className="text-gray-400 hover:text-red-600 transition-colors"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{offer.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium uppercase">Discount</span>
                        <span className="text-lg font-bold text-[#FF6A00]">
                          {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `$${offer.discountValue}`}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {/* Targeting Info */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400 uppercase font-medium">Target:</span>
                          <span className="text-xs font-semibold text-gray-600">
                            {offer.targetAudience === 'specific_rooms' ? `${offer.roomTypes?.length || 0} Suites` : 'All Rooms'}
                          </span>
                        </div>

                        {/* Coupon Info */}
                        {offer.couponMode === 'unique_per_user' ? (
                          <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Unique Codes</span>
                        ) : offer.couponCode ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-sm font-semibold bg-gray-100 px-2 py-1 rounded text-gray-700">{offer.couponCode}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No Coupon</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmId && confirmType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Delete {confirmType === 'banner' ? 'banner' : 'offer'}?
            </h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setConfirmId(null); setConfirmType(null); }} className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting === confirmId} className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/30">{deleting === confirmId ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
