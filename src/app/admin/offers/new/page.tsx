"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOffer } from '@/lib/firestoreService';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function NewOfferPage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    if (!storage) return;
    setUploading(true);
    try {
      const key = `offer-${Date.now()}`;
      const obj = storageRef(storage, `offers/${key}/${file.name}`);
      await uploadBytes(obj, file, { contentType: file.type });
      const url = await getDownloadURL(obj);
      setImageUrl(url);
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = await createOffer({ imageUrl });
      if (id) router.push('/admin/offers');
      else alert('Failed to create');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Offer Banner</h1>
        <p className="mt-2 text-gray-600">Upload a banner for the homepage carousel</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input type="url" value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} required className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="https://..." />
          <div className="mt-3 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleUpload(f);}} className="text-sm" />
            <button type="button" disabled={uploading} className="px-3 py-2 rounded-md bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50">{uploading?'Uploading...':'Upload & Use'}</button>
          </div>
          {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 w-full max-w-xl aspect-[5/1] object-cover rounded border" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={()=>router.push('/admin/offers')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving?'Saving...':'Create'}</button>
        </div>
      </form>
    </div>
  );
}


