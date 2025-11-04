"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTestimonial } from '@/lib/firestoreService';

export default function NewTestimonialPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', country: '', countryCode: '', text: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = await createTestimonial({ 
        name: form.name, 
        country: form.country,
        countryCode: form.countryCode.toLowerCase(),
        text: form.text
      });
      if (id) router.push('/admin/testimonials');
      else alert('Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Testimonial</h1>
        <p className="mt-2 text-gray-600">Create a new guest testimonial</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Guest Name</label>
          <input 
            value={form.name} 
            onChange={(e)=>setForm({...form, name: e.target.value})} 
            required 
            className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input 
            value={form.country} 
            onChange={(e)=>setForm({...form, country: e.target.value})} 
            required 
            placeholder="e.g., India, United States"
            className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country Code (ISO 2-letter)</label>
          <input 
            value={form.countryCode} 
            onChange={(e)=>setForm({...form, countryCode: e.target.value})} 
            required 
            maxLength={2}
            placeholder="e.g., in, us, gb"
            className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 uppercase" 
          />
          <p className="mt-1 text-xs text-gray-500">Two-letter country code for flag display (e.g., in, us, gb)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Testimonial Text</label>
          <textarea 
            value={form.text} 
            onChange={(e)=>setForm({...form, text: e.target.value})} 
            required 
            rows={6}
            className="mt-2 block w-full rounded-xl border border-gray-300 bg-gray-50/60 px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" 
          />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={()=>router.push('/admin/testimonials')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving?'Saving...':'Create'}</button>
        </div>
      </form>
    </div>
  );
}

