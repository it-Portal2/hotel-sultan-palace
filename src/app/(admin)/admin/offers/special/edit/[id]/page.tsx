"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PhotoIcon, CloudArrowUpIcon, LinkIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';
import { storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';
import BackButton from '@/components/admin/BackButton';
import { getSpecialOffer, updateSpecialOffer } from '@/lib/firestoreService';

const ROOM_TYPES = [
  'Suite with Garden View',
  'Queen Room With Sea View',
  'Deluxe Room With Sea View',
  'All Rooms'
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
  const [sendNotification, setSendNotification] = useState(true);
  const [isActive, setIsActive] = useState(true);
  
  // Date fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Person fields
  const [minPersons, setMinPersons] = useState<number>(1);
  const [maxPersons, setMaxPersons] = useState<number>(10);
  const [applyToAllPersons, setApplyToAllPersons] = useState(false);
  
  // Room selection
  const [selectedRooms, setSelectedRooms] = useState<string[]>(['All Rooms']);
  const [applyToAllRooms, setApplyToAllRooms] = useState(true);
  
  // Discount fields
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  
  // Coupon code
  const [couponCode, setCouponCode] = useState('');
  const [generateCoupon, setGenerateCoupon] = useState(false);

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
        setSendNotification(offer.sendNotification);
        setIsActive(offer.isActive);
        setStartDate(offer.startDate || '');
        setEndDate(offer.endDate || '');
        setMinPersons(offer.minPersons || 1);
        setMaxPersons(offer.maxPersons || 10);
        setApplyToAllPersons(offer.applyToAllPersons);
        setSelectedRooms(offer.roomTypes);
        setApplyToAllRooms(offer.applyToAllRooms);
        setDiscountType(offer.discountType);
        setDiscountValue(offer.discountValue);
        setCouponCode(offer.couponCode || '');
        setGenerateCoupon(!offer.couponCode);
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
      let errorMsg = 'Unable to upload image. ';
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError?.code === 'storage/unauthorized') {
        errorMsg = 'Please make sure you are logged in and try again.';
      } else if (firebaseError?.code === 'storage/quota-exceeded') {
        errorMsg = 'Storage limit reached. Please contact administrator.';
      } else if (firebaseError?.code === 'storage/canceled') {
        errorMsg = 'Upload was cancelled.';
      } else {
        errorMsg = 'Please check your connection and try again.';
      }
      showToast(errorMsg, 'error');
    } finally { 
      setUploading(false); 
    }
  };

  const handleRoomToggle = (room: string) => {
    if (room === 'All Rooms') {
      setSelectedRooms(['All Rooms']);
      setApplyToAllRooms(true);
      return;
    }
    setApplyToAllRooms(false);
    setSelectedRooms(prev => {
      const filtered = prev.filter(r => r !== 'All Rooms');
      if (filtered.includes(room)) {
        return filtered.filter(r => r !== room);
      } else {
        return [...filtered, room];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

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
      // Keep existing coupon code or generate new one
      let finalCouponCode = couponCode.trim();
      if (generateCoupon && !finalCouponCode) {
        // Auto-generate coupon code
        const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'OFF';
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        finalCouponCode = `${prefix}${randomNum}`;
      }

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
        roomTypes: applyToAllRooms ? ['All Rooms'] : selectedRooms,
        applyToAllRooms,
        discountType,
        discountValue,
        couponCode: finalCouponCode || null,
      };

      const success = await updateSpecialOffer(offerId, updateData);
      
      if (success) {
        showToast('Special offer updated successfully!', 'success');
        router.push('/admin/offers');
      } else {
        showToast('Failed to update special offer. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating special offer:', error);
      showToast('Failed to update special offer. Please try again.', 'error');
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-12 w-12 border-b-2 border-orange-500 rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/admin/offers" label="Back to Offers" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Special Offer</h1>
        <p className="mt-2 text-gray-600">Update special offer details</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Offer Title <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required
            className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" 
            placeholder="e.g., Holi Special Offer, New Year Celebration, Valentine's Day Package"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required
            rows={4}
            className="mt-2 block w-full rounded-xl border border-gray-300 bg-gray-50/60 px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" 
            placeholder="Describe your special offer..."
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <LinkIcon className="h-4 w-4 text-gray-500" /> Image URL (paste a direct link)
          </label>
          <input 
            type="url" 
            value={imageUrl} 
            onChange={(e) => setImageUrl(e.target.value)} 
            className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" 
            placeholder="https://..." 
          />
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
              <PhotoIcon className="h-4 w-4" /> Upload from device
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                const f = e.target.files?.[0]; 
                if (f) handleUpload(f);
              }} 
              className="text-sm" 
            />
            <button 
              type="button" 
              disabled={uploading} 
              className="px-3 py-2 rounded-md bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <CloudArrowUpIcon className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload & Use'}
            </button>
          </div>
          {imageUrl && (
            <div className="mt-3 relative inline-block w-full max-w-xl" style={{ aspectRatio: '5/1' }}>
              <Image 
                src={imageUrl} 
                alt="preview" 
                fill
                className="object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                sizes="(max-width: 768px) 100vw, 640px"
                unoptimized
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'w-full max-w-xl aspect-[5/1] rounded-lg border-2 border-red-300 bg-red-50 flex items-center justify-center';
                    errorDiv.innerHTML = '<p class="text-sm text-red-600">Failed to load image</p>';
                    parent.appendChild(errorDiv);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                title="Remove image"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" /> Start Date
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" 
            />
            <p className="mt-1 text-xs text-gray-500">Leave empty for no start date limit</p>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" /> End Date
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" 
            />
            <p className="mt-1 text-xs text-gray-500">Leave empty for no end date limit</p>
          </div>
        </div>

        {/* Number of Persons */}
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
              <span className="text-sm font-medium text-gray-700">
                Apply to all number of persons
              </span>
            </label>
          </div>
          {!applyToAllPersons && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Minimum Persons</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={minPersons} 
                  onChange={(e) => setMinPersons(Number(e.target.value) || 1)}
                  className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500" 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Maximum Persons</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={maxPersons} 
                  onChange={(e) => setMaxPersons(Number(e.target.value) || 10)}
                  className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Room Types Selection */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Applicable Room Types</label>
          <div className="mb-3">
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={applyToAllRooms} 
                onChange={(e) => {
                  setApplyToAllRooms(e.target.checked);
                  if (e.target.checked) {
                    setSelectedRooms(['All Rooms']);
                  }
                }}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Apply to all room types
              </span>
            </label>
          </div>
          {!applyToAllRooms && (
            <div className="grid grid-cols-2 gap-2">
              {ROOM_TYPES.filter(r => r !== 'All Rooms').map((room) => (
                <label key={room} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedRooms.includes(room)} 
                    onChange={() => handleRoomToggle(room)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{room}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Discount Settings */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Discount Settings</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Discount Type</label>
              <select 
                value={discountType} 
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Discount Value {discountType === 'percentage' ? '(%)' : '($)'}
              </label>
              <input 
                type="number" 
                min="0" 
                max={discountType === 'percentage' ? 100 : 10000}
                step={discountType === 'percentage' ? 1 : 10}
                value={discountValue} 
                onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500" 
              />
            </div>
          </div>
        </div>

        {/* Coupon Code */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Coupon Code</label>
          <div className="mb-3">
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={generateCoupon} 
                onChange={(e) => {
                  setGenerateCoupon(e.target.checked);
                  if (e.target.checked) {
                    setCouponCode('');
                  }
                }}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Auto-generate new coupon code
              </span>
            </label>
          </div>
          {!generateCoupon && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Custom Coupon Code</label>
              <input 
                type="text" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={20}
                className="block w-full h-10 rounded-lg border border-gray-300 bg-gray-50/60 px-3 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500 font-mono" 
                placeholder="e.g., HOLI2024, NEWYEAR25"
              />
              <p className="mt-1 text-xs text-gray-500">Only letters and numbers allowed (max 20 characters)</p>
            </div>
          )}
          {generateCoupon && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                A new coupon code will be auto-generated when you update the offer (e.g., HOL1234)
              </p>
            </div>
          )}
        </div>

        {/* Status and Notification */}
        <div className="border-t pt-4 space-y-3">
          <div>
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Set as active offer
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-7">
              Active offers will be visible to users
            </p>
          </div>
          <div>
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={sendNotification} 
                onChange={(e) => setSendNotification(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Send push notification to all users (on update)
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-7">
              Users who have enabled notifications will receive a push notification about this update
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => router.push('/admin/offers')} 
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving} 
            className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Special Offer'}
          </button>
        </div>
      </form>
    </div>
  );
}

