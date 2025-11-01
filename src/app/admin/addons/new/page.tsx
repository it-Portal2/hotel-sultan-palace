"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAddOn } from '@/lib/firestoreService';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function NewAddOnPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    price: 0,
    type: 'per_room' as 'per_room' | 'per_guest' | 'per_day',
    description: '',
    image: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !storage) return;
    setUploading(true);
    try {
      const key = `${form.name || 'addon'}-${Date.now()}`.replace(/[^a-zA-Z0-9-_]/g, '-');
      const objRef = storageRef(storage, `addons/${key}/${selectedFile.name}`);
      await uploadBytes(objRef, selectedFile, { contentType: selectedFile.type });
      const url = await getDownloadURL(objRef);
      setForm(prev => ({ ...prev, image: url }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = await createAddOn({
        name: form.name,
        price: Number(form.price),
        type: form.type,
        description: form.description,
        image: form.image,
      });
      if (id) router.push('/admin/addons');
      else alert('Failed to create add-on');
    } catch (e) {
      console.error(e);
      alert('Failed to create add-on');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Add-on</h1>
        <p className="mt-2 text-gray-600">Create a new upsell service</p>
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
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <input name="image" value={form.image} onChange={handleChange} type="url" required className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="https://..." />
            <div className="mt-3 flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="text-sm" />
              <button type="button" onClick={handleUpload} disabled={!selectedFile || uploading} className="px-3 py-2 rounded-md bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload & Use'}</button>
            </div>
            {form.image && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-1">Preview:</p>
                <img src={form.image} alt="Add-on preview" className="w-32 h-20 object-cover rounded border" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push('/admin/addons')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{loading ? 'Saving...' : 'Create Add-on'}</button>
        </div>
      </form>
    </div>
  );
}


