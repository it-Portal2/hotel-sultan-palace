"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PhotoIcon, CloudArrowUpIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { getAddOns, updateAddOn } from '@/lib/firestoreService';
import { storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';
import BackButton from '@/components/admin/BackButton';

export default function EditAddOnPage({ params }: { params: Promise<{ addOnId: string }> }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: 0,
    type: 'per_room' as 'per_room' | 'per_guest' | 'per_day',
    description: '',
    image: '',
  });

  useEffect(() => {
    (async () => {
      const p = await params;
      setId(p.addOnId);
      try {
        const list = await getAddOns();
        const a = list.find(x => x.id === p.addOnId);
        if (a) {
          setForm({ name: a.name, price: a.price, type: a.type, description: a.description, image: a.image });
        }
      } catch (e) {
        console.error('Error loading add-on', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !storage) {
      showToast('Please select a file first.', 'warning');
      return;
    }
    if (!isAuthenticated) {
      showToast('Please login first to upload images.', 'warning');
      setTimeout(() => router.push('/admin/login'), 1500);
      return;
    }
    setUploading(true);
    try {
      const key = `${form.name || 'addon'}-${Date.now()}`.replace(/[^a-zA-Z0-9-_]/g, '-');
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `${key}.${fileExt}`;
      const objRef = storageRef(storage, `addons/${key}/${fileName}`);
      await uploadBytes(objRef, selectedFile, { contentType: selectedFile.type });
      const url = await getDownloadURL(objRef);
      
      // Ensure URL is properly formatted
      if (url && url.trim() !== '') {
        setForm(prev => ({ ...prev, image: url.trim() }));
        setSelectedFile(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        showToast('Image uploaded successfully! URL has been set.', 'success');
      } else {
        throw new Error('Failed to get image URL');
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If file is selected but not uploaded, upload it first
    if (selectedFile && !form.image) {
      showToast('Please upload the selected image first.', 'warning');
      return;
    }
    
    if (!form.image || form.image.trim() === '') {
      showToast('Please provide an image URL or upload an image.', 'warning');
      return;
    }
    
    setSaving(true);
    try {
      const ok = await updateAddOn(id, {
        name: form.name,
        price: Number(form.price),
        type: form.type,
        description: form.description,
        image: form.image.trim(), // Ensure no extra spaces
      });
      if (ok) {
        showToast('Add-on updated successfully!', 'success');
        router.push('/admin/addons');
      } else {
        showToast('Failed to update add-on. Please try again.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to update add-on. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/admin/addons" label="Back to Add-ons" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Add-on</h1>
        <p className="mt-2 text-gray-600">Update add-on details</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div className="grid grid-cols-6 gap-6">
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="name" value={form.name} onChange={handleChange} required className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} min={0} required className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>

          <div className="col-span-6 sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500">
              <option value="per_room">Per room</option>
              <option value="per_guest">Per guest</option>
              <option value="per_day">Per day</option>
            </select>
          </div>

          <div className="col-span-6">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="mt-2 block w-full rounded-xl border border-gray-300 bg-gray-50/60 px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>

          <div className="col-span-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><LinkIcon className="h-4 w-4 text-gray-500" /> Image URL</label>
            <input name="image" value={form.image} onChange={handleChange} type="url" className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="Image URL will appear here after upload or paste URL" />
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                <PhotoIcon className="h-4 w-4" /> Upload from device
              </div>
              <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="text-sm" />
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleUpload} disabled={!selectedFile || uploading} className="px-3 py-2 rounded-md bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50 inline-flex items-center gap-2"><CloudArrowUpIcon className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload & Use'}</button>
                {selectedFile && (
                  <span className="text-xs text-gray-600 truncate">{selectedFile.name}</span>
                )}
              </div>
            </div>
            {form.image && (
              <div className="mt-3 relative inline-block w-64 h-40">
                <p className="text-xs font-semibold text-gray-600 mb-2">Preview:</p>
                <Image 
                  src={form.image} 
                  alt="Add-on preview" 
                  fill
                  className="object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                  sizes="256px"
                  unoptimized
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'w-64 h-40 rounded-lg border-2 border-red-300 bg-red-50 flex items-center justify-center';
                      errorDiv.innerHTML = '<p class="text-xs text-red-600">Failed to load image</p>';
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push('/admin/addons')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving ? 'Saving...' : 'Update Add-on'}</button>
        </div>
      </form>
    </div>
  );
}


