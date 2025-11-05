"use client";

import React, { useState, useEffect } from 'react';
import { PhotoIcon, CloudArrowUpIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { createOffer } from '@/lib/firestoreService';
import { storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';

export default function NewOfferPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

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
      const key = `offer-${Date.now()}`;
      const fileExt = file.name.split('.').pop();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const fileName = `${key}.${fileExt || 'png'}`;
      const obj = storageRef(storage, `offers/${key}/${fileName}`);
      await uploadBytes(obj, file, { contentType: file.type });
      const url = await getDownloadURL(obj);
      setImageUrl(url);
      showToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      let errorMsg = 'Unable to upload image. ';
      if (err?.code === 'storage/unauthorized') {
        errorMsg = 'Please make sure you are logged in and try again.';
      } else if (err?.code === 'storage/quota-exceeded') {
        errorMsg = 'Storage limit reached. Please contact administrator.';
      } else if (err?.code === 'storage/canceled') {
        errorMsg = 'Upload was cancelled.';
      } else {
        errorMsg = 'Please check your connection and try again.';
      }
      showToast(errorMsg, 'error');
    } finally { 
      setUploading(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = await createOffer({ imageUrl });
      if (id) {
        showToast('Offer banner created successfully!', 'success');
        router.push('/admin/offers');
      } else {
        showToast('Failed to create offer. Please try again.', 'error');
      }
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
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><LinkIcon className="h-4 w-4 text-gray-500" /> Image URL (paste a direct link)</label>
          <input type="url" value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} required className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="https://..." />
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
              <PhotoIcon className="h-4 w-4" /> Upload from device
            </div>
            <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleUpload(f);}} className="text-sm" />
            <button type="button" disabled={uploading} className="px-3 py-2 rounded-md bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50 inline-flex items-center gap-2"><CloudArrowUpIcon className="h-4 w-4" /> {uploading?'Uploading...':'Upload & Use'}</button>
          </div>
          {imageUrl && (
            <div className="mt-3 relative inline-block">
              <img 
                src={imageUrl} 
                alt="preview" 
                className="w-full max-w-xl aspect-[5/1] object-cover rounded-lg border-2 border-gray-300 shadow-sm"
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
        <div className="flex justify-end gap-3">
          <button type="button" onClick={()=>router.push('/admin/offers')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving?'Saving...':'Create'}</button>
        </div>
      </form>
    </div>
  );
}


