"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { getGalleryImages, updateGalleryImage, GalleryType } from '@/lib/firestoreService';
import { storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';
import BackButton from '@/components/admin/BackButton';

const TYPES: {label:string; value: GalleryType}[] = [
  { label: 'Villas', value: 'villas' },
  { label: 'Pool', value: 'pool' },
  { label: 'Spa', value: 'spa' },
  { label: 'Beach', value: 'beach' },
  { label: 'Water Sports', value: 'water_sports' },
  { label: 'Restaurant & Bars', value: 'restaurant_bars' },
  { label: 'Facilities', value: 'facilities' },
];

export default function EditGalleryImagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.imageId as string;
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState<GalleryType>('villas');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => setIsAuthenticated(!!user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      const items = await getGalleryImages();
      const img = items.find(i => i.id === id);
      if (!img) {
        showToast('Image not found', 'error');
        router.push('/admin/gallery');
        return;
      }
      setImageUrl(img.imageUrl);
      setType(img.type);
      setLoading(false);
    })();
  }, [id, router, showToast]);

  const handleUpload = async (file: File) => {
    if (!storage) {
      showToast('Storage not available', 'error');
      return;
    }
    if (!isAuthenticated) {
      showToast('Please login first.', 'warning');
      setTimeout(() => router.push('/admin/login'), 1000);
      return;
    }
    setUploading(true);
    try {
      const key = `gallery-${Date.now()}`;
      const ext = file.name.split('.').pop();
      const obj = storageRef(storage, `gallery/${key}/${key}.${ext || 'png'}`);
      await uploadBytes(obj, file, { contentType: file.type });
      const url = await getDownloadURL(obj);
      setImageUrl(url);
      showToast('Image uploaded', 'success');
    } catch (e) {
      console.error(e);
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateGalleryImage(id, { imageUrl, type });
    setSaving(false);
    if (ok) {
      showToast('Saved successfully', 'success');
      router.push('/admin/gallery');
    } else {
      showToast('Save failed', 'error');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-12 w-12 border-b-2 border-orange-500 rounded-full animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <BackButton href="/admin/gallery" label="Back to Gallery" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Gallery Image</h1>
        <p className="mt-2 text-gray-600">Update the image and its type</p>
      </div>
      <form onSubmit={handleSave} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select value={type} onChange={(e)=>setType(e.target.value as GalleryType)} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500">
            {TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <div className="mt-2 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleUpload(f);}} />
            <button type="button" onClick={()=>{ if (imageUrl) window.open(imageUrl, '_blank'); }} className="px-3 py-2 text-sm rounded border">Open</button>
          </div>
          {imageUrl && (
            <div className="mt-3 relative inline-block" style={{ width: 'auto', height: '192px' }}>
              <Image src={imageUrl} alt="preview" fill className="object-contain rounded border" sizes="(max-width: 768px) 100vw, 400px" unoptimized style={{ width: 'auto', height: 'auto' }} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={()=>router.push('/admin/gallery')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving || uploading} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}


