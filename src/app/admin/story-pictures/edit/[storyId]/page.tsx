"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStoryImage, updateStoryImage } from '@/lib/firestoreService';
import { storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';

export default function EditStoryPicturePage() {
  const router = useRouter();
  const params = useParams();
  const storyId = (params?.storyId as string) || '';
  const { showToast } = useToast();

  const [imageUrl, setImageUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
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
      const data = await getStoryImage(storyId);
      if (!data) {
        showToast('Story image not found', 'error');
        router.push('/admin/story-pictures');
        return;
      }
      setImageUrl(data.imageUrl || '');
      setAlt(data.alt || '');
      setTitle(data.title || '');
      setText(data.text || '');
      setAuthor(data.author || '');
      setLocation(data.location || '');
      setLoading(false);
    })();
  }, [storyId, router, showToast]);

  const uploadFile = async (file: File) => {
    if (!storage) {
      showToast('Storage not available. Refresh the page.', 'error');
      return;
    }
    if (!isAuthenticated) {
      showToast('Please login first.', 'warning');
      setTimeout(() => router.push('/admin/login'), 1000);
      return;
    }
    setUploading(true);
    try {
      const key = `story-${Date.now()}`;
      const ext = file.name.split('.').pop();
      const fileName = `${key}.${ext || 'png'}`;
      const obj = storageRef(storage, `story/${key}/${fileName}`);
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
    const ok = await updateStoryImage(storyId, { imageUrl, alt, title, text, author, location });
    setSaving(false);
    if (ok) {
      showToast('Saved successfully', 'success');
      router.push('/admin/story-pictures');
    } else {
      showToast('Save failed', 'error');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-12 w-12 border-b-2 border-orange-500 rounded-full animate-spin"/></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Story Image</h1>
        <p className="mt-2 text-gray-600">Update image and details</p>
      </div>
      <form onSubmit={handleSave} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Alt</label>
            <input value={alt} onChange={(e)=>setAlt(e.target.value)} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Author</label>
            <input value={author} onChange={(e)=>setAuthor(e.target.value)} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input value={location} onChange={(e)=>setLocation(e.target.value)} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Text</label>
          <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={6} className="mt-2 block w-full rounded-xl border border-gray-300 bg-gray-50/60 px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <div className="mt-2 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) uploadFile(f);}} />
            <button type="button" onClick={()=>{ if (imageUrl) window.open(imageUrl, '_blank'); }} className="px-3 py-2 text-sm rounded border">Open</button>
          </div>
          {imageUrl && (
            <div className="mt-3">
              <img src={imageUrl} alt="preview" className="h-40 w-auto rounded border" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={()=>router.push('/admin/story-pictures')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving || uploading} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}


