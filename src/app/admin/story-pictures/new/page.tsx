"use client";

import React, { useState, useEffect } from 'react';
import { PhotoIcon, CloudArrowUpIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { createStoryImage } from '@/lib/firestoreService';
import { storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';
import BackButton from '@/components/admin/BackButton';

export default function NewStoryPicturePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'device'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const uploadSelectedFile = async (file: File) => {
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
      const key = `story-${Date.now()}`;
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}.${fileExt || 'png'}`;
      const obj = storageRef(storage, `story/${key}/${fileName}`);
      await uploadBytes(obj, file, { contentType: file.type });
      const url = await getDownloadURL(obj);
      if (!url || !url.includes('firebasestorage.googleapis.com')) {
        throw new Error('Invalid download URL received');
      }
      setImageUrl(url);
      setSelectedFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      showToast('Image uploaded successfully!', 'success');
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Please check your connection and try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadMethod('device');
    setImageUrl('');
    // Auto-upload immediately on selection
    await uploadSelectedFile(file);
  };

  const handleDeviceUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a file first.', 'warning');
      return;
    }
    await uploadSelectedFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If device method and a file is still selected but not uploaded, upload now
    if (uploadMethod === 'device' && selectedFile && !imageUrl) {
      await uploadSelectedFile(selectedFile);
    }
    if (!imageUrl) {
      showToast('Please provide an image (URL or upload).', 'warning');
      return;
    }
    setSaving(true);
    try {
      const id = await createStoryImage({ imageUrl, alt, title, text, author, location, createdAt: new Date(), updatedAt: new Date() } as unknown as { imageUrl: string; alt?: string; title?: string; text?: string; author?: string; location?: string; createdAt: Date; updatedAt: Date });
      if (id) {
        showToast('Story image created successfully!', 'success');
        router.push('/admin/story-pictures');
      } else {
        showToast('Failed to create story image. Please try again.', 'error');
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <BackButton href="/admin/story-pictures" label="Back to Story Pictures" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Story Image</h1>
        <p className="mt-2 text-gray-600">Upload a new image for the story section</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Alt text (optional)</label>
          <input value={alt} onChange={(e)=>setAlt(e.target.value)} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title (optional)</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Author (optional)</label>
            <input value={author} onChange={(e)=>setAuthor(e.target.value)} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location (optional)</label>
            <input value={location} onChange={(e)=>setLocation(e.target.value)} className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Story text (optional)</label>
          <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={5} className="mt-2 block w-full rounded-xl border border-gray-300 bg-gray-50/60 px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500" />
        </div>
        <div className="space-y-4">
          {/* Upload Method Selection */}
          <div className="flex gap-4 border-b pb-4">
            <button
              type="button"
              onClick={() => {
                setUploadMethod('url');
                setSelectedFile(null);
                setImageUrl('');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadMethod === 'url'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LinkIcon className="h-4 w-4 inline mr-2" />
              Use Image URL
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMethod('device');
                setImageUrl('');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadMethod === 'device'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PhotoIcon className="h-4 w-4 inline mr-2" />
              Upload from Device
            </button>
          </div>

          {/* URL Input Method */}
          {uploadMethod === 'url' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <LinkIcon className="h-4 w-4 text-gray-500" /> Image URL (paste a direct link)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}

          {/* Device Upload Method */}
          {uploadMethod === 'device' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <PhotoIcon className="h-4 w-4 text-gray-500" /> Upload from Device
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="text-sm"
                />
                {selectedFile && (
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleDeviceUpload}
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  <CloudArrowUpIcon className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload & Use'}
                </button>
              </div>
            </div>
          )}
        </div>
          {/* Image Preview */}
          {imageUrl && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Image Preview:</p>
              <div className="relative inline-block">
                <img 
                  src={imageUrl} 
                  alt="preview" 
                  className="w-full max-w-xl h-64 object-contain rounded-lg border-2 border-gray-300 shadow-sm bg-gray-50"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.error-display')) {
                      target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'error-display w-full max-w-xl h-64 rounded-lg border-2 border-red-300 bg-red-50 flex flex-col items-center justify-center gap-2 p-4';
                      errorDiv.innerHTML = `
                        <p class="text-sm font-medium text-red-600">Failed to load image</p>
                        <p class="text-xs text-red-500 text-center">Please check the URL or try uploading again.</p>
                        <button onclick="this.closest('.error-display').parentElement.querySelector('img').style.display='block'; this.closest('.error-display').remove()" class="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Retry</button>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                  onLoad={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      const errorDiv = parent.querySelector('.error-display');
                      if (errorDiv) {
                        errorDiv.remove();
                      }
                      target.style.display = 'block';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    setSelectedFile(null);
                    setUploadMethod('url');
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={()=>router.push('/admin/story-pictures')} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">{saving?'Saving...':'Create'}</button>
        </div>
      </form>
    </div>
  );
}


