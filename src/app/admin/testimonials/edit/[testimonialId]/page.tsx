"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { updateTestimonial, Testimonial } from '@/lib/firestoreService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getTestimonialById(id: string): Promise<Testimonial | null> {
  if (!db) return null;
  try {
    const d = doc(db, 'testimonials', id);
    const snap = await getDoc(d);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      name: data.name,
      country: data.country,
      countryCode: data.countryCode,
      text: data.text,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Testimonial;
  } catch (e) {
    console.error('Error fetching testimonial:', e);
    return null;
  }
}

export default function EditTestimonialPage() {
  const router = useRouter();
  const params = useParams();
  const testimonialId = params.testimonialId as string;
  const [form, setForm] = useState({ name: '', country: '', countryCode: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getTestimonialById(testimonialId);
        if (data) {
          setForm({
            name: data.name,
            country: data.country,
            countryCode: data.countryCode,
            text: data.text,
          });
        } else {
          alert('Testimonial not found');
          router.push('/admin/testimonials');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [testimonialId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await updateTestimonial(testimonialId, { 
        name: form.name, 
        country: form.country,
        countryCode: form.countryCode.toLowerCase(),
        text: form.text
      });
      if (ok) router.push('/admin/testimonials');
      else alert('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="h-12 w-12 border-b-2 border-orange-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Testimonial</h1>
        <p className="mt-2 text-gray-600">Update guest testimonial details</p>
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
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving?'Saving...':'Update'}</button>
        </div>
      </form>
    </div>
  );
}

