"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDiscountOffer } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import BackButton from '@/components/admin/BackButton';

export default function NewDiscountPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = await createDiscountOffer({ 
        discountPercent,
        isActive
      });
      if (id) {
        showToast('Discount offer created successfully!', 'success');
        router.push('/admin/offers');
      } else {
        showToast('Failed to create discount. Please try again.', 'error');
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <BackButton href="/admin/offers" label="Back to Offers" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Discount Offer</h1>
        <p className="mt-2 text-gray-600">Create a discount percentage for room bookings</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Percentage (%)
          </label>
          <input 
            type="number" 
            min="0" 
            max="100" 
            value={discountPercent} 
            onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)} 
            required
            className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" 
            placeholder="10" 
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter the discount percentage (0-100) that will be applied to room prices on the hotel page.
          </p>
        </div>
        <div>
          <label className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Set as active discount
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500 ml-7">
            Only one discount can be active at a time. Activating this will deactivate all other discounts.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={()=>router.push('/admin/offers')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving?'Saving...':'Create Discount'}</button>
        </div>
      </form>
    </div>
  );
}

