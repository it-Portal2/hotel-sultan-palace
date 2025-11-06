"use client";

import React, { useState, useEffect } from 'react';
import { PhotoIcon, CloudArrowUpIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { createRoom, updateRoom, getRoom, Room } from '@/lib/firestoreService';
import { storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';

interface AdminRoomFormProps {
  roomId?: string;
  isEdit?: boolean;
}

export default function AdminRoomForm({ roomId, isEdit = false }: AdminRoomFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    price: 0,
    description: '',
    features: [''],
    amenities: [''],
    size: '',
    view: '',
    beds: '',
    image: '',
    maxGuests: 1,
    cancellationFreeDays: 2
  });

  useEffect(() => {
    if (isEdit && roomId) {
      const fetchRoom = async () => {
        try {
          setFetching(true);
          const room = await getRoom(roomId);
          if (room) {
            setFormData({
              name: room.name,
              type: room.type,
              price: room.price,
              description: room.description,
              features: room.features,
              amenities: room.amenities,
              size: room.size,
              view: room.view,
              beds: room.beds,
              image: room.image,
              maxGuests: room.maxGuests,
              cancellationFreeDays: (room as { cancellationFreeDays?: number }).cancellationFreeDays ?? 2
            });
          }
        } catch (error) {
          console.error('Error fetching room:', error);
        } finally {
          setFetching(false);
        }
      };

      fetchRoom();
    }
  }, [isEdit, roomId]);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field: 'features' | 'amenities', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'features' | 'amenities') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'features' | 'amenities', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If file is selected but not uploaded, upload it first
    if (selectedFile && !formData.image) {
      showToast('Please upload the selected image first.', 'warning');
      return;
    }
    
    if (!formData.image || formData.image.trim() === '') {
      showToast('Please provide an image URL or upload an image.', 'warning');
      return;
    }
    
    setLoading(true);

    try {
      const roomData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
        amenities: formData.amenities.filter(a => a.trim() !== ''),
        price: Number(formData.price),
        maxGuests: Number(formData.maxGuests),
        cancellationFreeDays: Number((formData as { cancellationFreeDays?: number }).cancellationFreeDays ?? 0),
        image: formData.image.trim() // Ensure no extra spaces
      };

      if (isEdit && roomId) {
        const success = await updateRoom(roomId, roomData);
        if (success) {
          showToast('Room updated successfully!', 'success');
          router.push('/admin/rooms');
        } else {
          showToast('Failed to update room. Please try again.', 'error');
        }
      } else {
        const newRoomId = await createRoom(roomData);
        if (newRoomId) {
          showToast('Room created successfully!', 'success');
          router.push('/admin/rooms');
        } else {
          showToast('Failed to create room. Please try again.', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving room:', error);
      showToast('Failed to save room. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
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
      const key = roomId || `${formData.name || 'room'}-${Date.now()}`;
      const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '-');
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `${safeKey}.${fileExt}`;
      const objRef = storageRef(storage, `rooms/${safeKey}/${fileName}`);
      await uploadBytes(objRef, selectedFile, { contentType: selectedFile.type });
      const url = await getDownloadURL(objRef);
      
      // Ensure URL is properly formatted
      if (url && url.trim() !== '') {
        setFormData(prev => ({ ...prev, image: url.trim() }));
        setSelectedFile(null);
        // Reset file input
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

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Room Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                Basic information about the room.
              </p>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Room Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    minLength={2}
                    className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Room Type
                  </label>
                  <input
                    type="text"
                    name="type"
                    id="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    minLength={2}
                    className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price per Night ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min={0}
                    className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="cancellationFreeDays" className="block text-sm font-medium text-gray-700">
                    Free Cancellation (days before check-in)
                  </label>
                  <input
                    type="number"
                    name="cancellationFreeDays"
                    id="cancellationFreeDays"
                    value={(formData as { cancellationFreeDays?: number }).cancellationFreeDays || ''}
                    onChange={handleInputChange}
                    min={0}
                    className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700">
                    Max Guests
                  </label>
                  <input
                    type="number"
                    name="maxGuests"
                    id="maxGuests"
                    value={formData.maxGuests}
                    onChange={handleInputChange}
                    required
                    min={1}
                    className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    minLength={10}
                    className="mt-2 block w-full min-h-[140px] rounded-xl border border-gray-300 bg-gray-50/60 px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                    Size
                  </label>
                  <input
                    type="text"
                    name="size"
                    id="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="view" className="block text-sm font-medium text-gray-700">
                    View
                  </label>
                  <input
                    type="text"
                    name="view"
                    id="view"
                    value={formData.view}
                    onChange={handleInputChange}
                    className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="beds" className="block text-sm font-medium text-gray-700">
                    Beds
                  </label>
                  <input
                    type="text"
                    name="beds"
                    id="beds"
                    value={formData.beds}
                    onChange={handleInputChange}
                    className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="image" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <LinkIcon className="h-4 w-4 text-gray-500" /> Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    id="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="Image URL will appear here after upload or paste URL"
                    className="mt-2 block w-full h-12 rounded-xl border border-gray-300 bg-gray-50/60 px-4 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                  />

                  {/* Local file upload */}
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                      <PhotoIcon className="h-4 w-4" /> Upload from device
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-700"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="px-3 py-2 rounded-md bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        <CloudArrowUpIcon className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload & Use'}
                      </button>
                      {selectedFile && (
                        <span className="text-xs text-gray-600 truncate">{selectedFile.name}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Image Preview */}
                  {formData.image && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Preview:</p>
                      <div className="relative inline-block">
                        <img 
                          src={formData.image} 
                          alt="Room preview" 
                          className="w-64 h-40 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
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
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Features</h3>
              <p className="mt-1 text-sm text-gray-500">
                Key features of the room.
              </p>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <div className="space-y-3">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleArrayChange('features', index, e.target.value)}
                      className="flex-1 h-11 rounded-xl border border-gray-300 bg-gray-50/60 px-3 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('features', index)}
                      className="px-3 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('features')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Add Feature
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Amenities</h3>
              <p className="mt-1 text-sm text-gray-500">
                Available amenities in the room.
              </p>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <div className="space-y-3">
                {formData.amenities.map((amenity, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={amenity}
                      onChange={(e) => handleArrayChange('amenities', index, e.target.value)}
                      className="flex-1 h-11 rounded-xl border border-gray-300 bg-gray-50/60 px-3 text-base shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('amenities', index)}
                      className="px-3 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('amenities')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Add Amenity
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/rooms')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Room' : 'Create Room')}
          </button>
        </div>
      </form>
    </div>
  );
}

