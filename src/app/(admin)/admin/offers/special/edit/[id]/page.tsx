"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PhotoIcon, CloudArrowUpIcon, LinkIcon, CalendarIcon, UserGroupIcon, HomeModernIcon, TicketIcon } from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';
import { storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';
import BackButton from '@/components/admin/BackButton';
import { getSpecialOffer, updateSpecialOffer } from '@/lib/firestoreService';

const SUITE_TYPES = [
  'Garden Suite',
  'Imperial Suite',
  'Ocean Suite'
];

export default function EditSpecialOfferPage() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sendNotification, setSendNotification] = useState(false); // Default false for edits to avoid spam
  const [isActive, setIsActive] = useState(true);

  // Date fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Person fields
  const [minPersons, setMinPersons] = useState<number>(1);
  const [maxPersons, setMaxPersons] = useState<number>(10);
  const [applyToAllPersons, setApplyToAllPersons] = useState(false);

  // Targeting
  const [targetAudience, setTargetAudience] = useState<'all' | 'specific_rooms'>('all');
  const [selectedSuites, setSelectedSuites] = useState<string[]>([]);

  // Discount fields
  // Discount fields
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'pay_x_stay_y'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [stayNights, setStayNights] = useState<number>(3);
  const [payNights, setPayNights] = useState<number>(2);

  // Coupon configuration
  const [couponMode, setCouponMode] = useState<'none' | 'static' | 'unique_per_user'>('static');
  const [staticCouponCode, setStaticCouponCode] = useState('');

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadOffer = async () => {
      if (!offerId) return;
      setLoading(true);
      try {
        const offer = await getSpecialOffer(offerId);
        if (!offer) {
          showToast('Offer not found', 'error');
          router.push('/admin/offers');
          return;
        }

        setTitle(offer.title);
        setDescription(offer.description);
        setImageUrl(offer.imageUrl);
        // Don't set sendNotification to true automatically on edit to prevent accidental spam
        setIsActive(offer.isActive);
        setStartDate(offer.startDate || '');
        setEndDate(offer.endDate || '');
        setMinPersons(offer.minPersons || 1);
        setMaxPersons(offer.maxPersons || 10);
        setApplyToAllPersons(offer.applyToAllPersons);

        // Handle Targeting migration
        if (offer.targetAudience) {
          setTargetAudience(offer.targetAudience);
          setSelectedSuites(offer.roomTypes || []);
        } else {
          // Backward compatibility
          const legacyOffer = offer as any;
          if (legacyOffer.applyToAllRooms || !offer.roomTypes || offer.roomTypes.length === 0) {
            setTargetAudience('all');
          } else {
            setTargetAudience('specific_rooms');
            setSelectedSuites(offer.roomTypes);
          }
        }

        setDiscountType(offer.discountType);
        setDiscountValue(offer.discountValue);
        if (offer.stayNights) setStayNights(offer.stayNights);
        if (offer.payNights) setPayNights(offer.payNights);

        // Handle Coupon migration
        if (offer.couponMode) {
          setCouponMode(offer.couponMode);
          if (offer.couponCode) setStaticCouponCode(offer.couponCode);
        } else {
          // Infer from data
          if (offer.couponCode) {
            setCouponMode('static');
            setStaticCouponCode(offer.couponCode);
          } else {
            setCouponMode('none');
            // Or could be 'unique_per_user' if we had that logic before? No, before we only had static or null.
          }
        }

      } catch (error) {
        console.error('Error loading offer:', error);
        showToast('Failed to load offer', 'error');
        router.push('/admin/offers');
      } finally {
        setLoading(false);
      }
    };
    loadOffer();
  }, [offerId, router, showToast]);

  const handleUpload = async (file: File) => {
    if (!storage) {
      showToast('Storage service is not available. Please refresh the page.', 'error');
      return;
    }
    if (!isAuthenticated) {
      showToast('Please login first to upload images.', 'warning');
      setTimeout(() => router.push('/admin/login'), 1500);
      return;
    }
    setUploading(true);
    try {
      const key = `special-offer-${Date.now()}`;
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}.${fileExt || 'png'}`;
      const obj = storageRef(storage, `special-offers/${key}/${fileName}`);
      await uploadBytes(obj, file, { contentType: file.type });
      const url = await getDownloadURL(obj);
      setImageUrl(url);
      showToast('Image uploaded successfully!', 'success');
    } catch (err: unknown) {
      console.error('Image upload failed:', err);
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSuiteToggle = (suite: string) => {
    if (selectedSuites.includes(suite)) {
      setSelectedSuites(selectedSuites.filter(s => s !== suite));
    } else {
      setSelectedSuites([...selectedSuites, suite]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (targetAudience === 'specific_rooms' && selectedSuites.length === 0) {
      showToast('Please select at least one suite type.', 'error');
      return;
    }

    // Validation for code is handled implicitly (blank = none, filled = static)
    // We can skip the explicit checks.

    // Validate dates
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      showToast('End date must be after start date.', 'error');
      return;
    }

    // Validate persons
    if (minPersons > maxPersons) {
      showToast('Minimum persons cannot be greater than maximum persons.', 'error');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title,
        description,
        imageUrl,
        sendNotification,
        isActive,
        startDate: startDate || null,
        endDate: endDate || null,
        minPersons: applyToAllPersons ? null : minPersons,
        maxPersons: applyToAllPersons ? null : maxPersons,
        applyToAllPersons,

        // Targeting
        targetAudience,
        roomTypes: targetAudience === 'specific_rooms' ? selectedSuites : [],

        discountType,
        discountValue: discountType === 'pay_x_stay_y' ? 0 : discountValue,
        stayNights: discountType === 'pay_x_stay_y' ? stayNights : null as any,
        payNights: discountType === 'pay_x_stay_y' ? payNights : null as any,

        // Coupon Logic
        // Coupon Logic - Derived
        couponMode: (staticCouponCode ? 'static' : 'none') as 'static' | 'none',
        couponCode: staticCouponCode || null,
      };

      const success = await updateSpecialOffer(offerId, updateData);

      if (success) {
        if (sendNotification) {
          try {
            const offerLink = `/offers?highlight=${offerId}`;
            const bookLink = `/hotel?specialOffer=${offerId}`;
            const notificationBody = couponMode === 'static'
              ? `${description}\n\n🎫 Use Code: ${staticCouponCode}`
              : description;

            await fetch('/api/notifications/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: `📢 Update: ${title}`,
                body: notificationBody,
                imageUrl: imageUrl,
                url: offerLink,
                bookUrl: bookLink,
                couponCode: couponMode === 'static' ? staticCouponCode : undefined,
              }),
            });
          } catch (ignore) { /* empty */ }
        }
        showToast('Special offer updated successfully!', 'success');
        router.push('/admin/offers');
      } else {
        showToast('Failed to update offer', 'error');
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      showToast('Failed to update offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-12 w-12 border-b-2 border-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <BackButton href="/admin/offers" label="Back to Offers" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Special Offer</h1>
        <p className="mt-2 text-gray-600">Update offer details, targeting, and coupons</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="p-8 space-y-8">

          {/* Basic Info Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Offer Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Image Upload Simplified */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative h-24 w-40 rounded-lg overflow-hidden border border-gray-200 group">
                      <Image src={imageUrl} alt="preview" fill className="object-cover" unoptimized />
                      <button type="button" onClick={() => setImageUrl('')} className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-white text-xs font-medium">Remove</button>
                    </div>
                  ) : (
                    <div className="h-24 w-40 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                      <PhotoIcon className="h-6 w-6 mb-1" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Paste image URL..."
                      className="w-full h-10 rounded-lg border-gray-200 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">OR</span>
                      <label className="cursor-pointer px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors">
                        Upload New File
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                      </label>
                      {uploading && <span className="text-xs text-orange-600 animate-pulse">Uploading...</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Targeting Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
              <HomeModernIcon className="h-5 w-5 text-gray-500" /> Room Targeting
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${targetAudience === 'all' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="audience" value="all" checked={targetAudience === 'all'} onChange={() => setTargetAudience('all')} className="absolute top-4 right-4 text-orange-600 focus:ring-orange-500" />
                <span className="font-semibold text-gray-900">All Rooms</span>
                <span className="text-sm text-gray-500 mt-1">Offer applies to any room booking</span>
              </label>

              <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${targetAudience === 'specific_rooms' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="audience" value="specific_rooms" checked={targetAudience === 'specific_rooms'} onChange={() => setTargetAudience('specific_rooms')} className="absolute top-4 right-4 text-orange-600 focus:ring-orange-500" />
                <span className="font-semibold text-gray-900">Specific Suites</span>
                <span className="text-sm text-gray-500 mt-1">Limit offer to specific suite types</span>
              </label>
            </div>

            {targetAudience === 'specific_rooms' && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in-down">
                <span className="block text-sm font-medium text-gray-700 mb-3">Select Eligible Suites:</span>
                <div className="flex flex-wrap gap-3">
                  {SUITE_TYPES.map(suite => (
                    <label key={suite} className={`px-4 py-2 rounded-lg border cursor-pointer transition-all select-none ${selectedSuites.includes(suite) ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}>
                      <input type="checkbox" className="hidden" checked={selectedSuites.includes(suite)} onChange={() => handleSuiteToggle(suite)} />
                      {suite}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coupon Configuration */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-gray-500" /> Coupon Configuration
            </h3>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={staticCouponCode}
                    onChange={(e) => setStaticCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    className="w-full h-12 rounded-xl border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-orange-500 font-mono text-lg tracking-wider pl-4"
                    placeholder="e.g. SUMMER-2024"
                  />
                  {staticCouponCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 flex items-center gap-1 text-xs font-medium bg-green-50 px-2 py-1 rounded">
                      <TicketIcon className="w-3 h-3" />
                      Active
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'OFF');
                    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                    setStaticCouponCode(`${prefix}-${random}`);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 shadow-sm text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <CloudArrowUpIcon className="w-5 h-5" /> {/* Reusing an icon, or could use generic refresh */}
                  Generate Random
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                {staticCouponCode ? (
                  <span className="text-orange-600">Users must enter this code to get the discount.</span>
                ) : (
                  <span className="text-gray-500 italic">Leave blank for automatic discount (No code required).</span>
                )}
              </p>
            </div>
          </div>

          {/* Date & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border-gray-200 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border-gray-200 bg-gray-50" />
            </div>
          </div>

          {/* Persons */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <UserGroupIcon className="h-4 w-4 text-gray-500" /> Number of Persons
            </label>
            <div className="mb-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={applyToAllPersons}
                  onChange={(e) => setApplyToAllPersons(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Apply to all number of persons</span>
              </label>
            </div>
            {!applyToAllPersons && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                  <input type="number" min="1" max="20" value={minPersons} onChange={(e) => setMinPersons(Number(e.target.value) || 1)} className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                  <input type="number" min="1" max="20" value={maxPersons} onChange={(e) => setMaxPersons(Number(e.target.value) || 10)} className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3" />
                </div>
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Discount Settings</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Type</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                  <option value="pay_x_stay_y">Pay X Stay Y (e.g. Stay 3 Pay 2)</option>
                </select>
              </div>

              {discountType === 'pay_x_stay_y' ? (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Stay Nights</label>
                    <input
                      type="number"
                      min="2"
                      value={stayNights}
                      onChange={(e) => setStayNights(Number(e.target.value))}
                      className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Pay Nights</label>
                    <input
                      type="number"
                      min="1"
                      max={stayNights - 1}
                      value={payNights}
                      onChange={(e) => setPayNights(Number(e.target.value))}
                      className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Value</label>
                  <input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value) || 0)} className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3" />
                </div>
              )}
            </div>
            {discountType === 'pay_x_stay_y' && (
              <p className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                ℹ️ Customer stays for <strong>{stayNights} nights</strong> but only pays for <strong>{payNights} nights</strong>.
              </p>
            )}
          </div>

          <div className="flex items-center gap-6 pt-6 border-t">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 text-orange-600 rounded focus:ring-orange-500" />
              <span className="text-gray-900 font-medium">Active</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} className="h-5 w-5 text-orange-600 rounded focus:ring-orange-500" />
              <span className="text-gray-900 font-medium">Resend Notification</span>
            </label>
          </div>

        </div>

        <div className="bg-gray-50 px-8 py-5 flex justify-end gap-3 border-t border-gray-100">
          <button type="button" onClick={() => router.push('/admin/offers')} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-white hover:border-gray-300 transition-all">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-lg shadow-orange-500/30 disabled:opacity-70 disabled:shadow-none transition-all transform hover:-translate-y-0.5">
            {saving ? 'Updating...' : 'Update Offer'}
          </button>
        </div>
      </form>
    </div>
  );
}

