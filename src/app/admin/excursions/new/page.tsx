"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExcursion } from '@/lib/firestoreService';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function NewExcursionPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', image: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    if (!storage) return;
    setUploading(true);
    try {
      const key = `${form.title || 'excursion'}-${Date.now()}`.replace(/[^a-zA-Z0-9-_]/g, '-');
      const obj = storageRef(storage, `excursions/${key}/${file.name}`);
      await uploadBytes(obj, file, { contentType: file.type });
      const url = await getDownloadURL(obj);
      setForm(prev => ({ ...prev, image: url }));
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = await createExcursion({ title: form.title, image: form.image });
      if (id) router.push('/admin/excursions');
      else alert('Failed to create');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Excursion</h1>
        <p className="mt-2 text-gray-600">Create a new excursion card for the homepage section</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} required className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input value={form.image} onChange={(e)=>setForm({...form, image: e.target.value})} type="url" required className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          <div className="mt-3 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleUpload(f);}} className="text-sm" />
            <button type="button" disabled={uploading} className="px-3 py-2 rounded-md bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50">{uploading?'Uploading...':'Upload & Use'}</button>
          </div>
          {form.image && <img src={form.image} alt="preview" className="mt-2 w-40 h-24 object-cover rounded border" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={()=>router.push('/admin/excursions')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving?'Saving...':'Create'}</button>
        </div>
      </form>
    </div>
  );
}


