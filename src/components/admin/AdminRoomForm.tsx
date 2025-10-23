"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom, updateRoom, getRoom, Room } from '@/lib/firestoreService';

interface AdminRoomFormProps {
  roomId?: string;
  isEdit?: boolean;
}

export default function AdminRoomForm({ roomId, isEdit = false }: AdminRoomFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formData, setFormData] = useState({
    name: 'Ocean View Suite',
    type: 'Ocean View',
    price: 300,
    description: 'This suite\'s standout feature is the Ocean with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with ocean views. The unit has 2 beds.',
    features: ['Private suite', '150 m²', 'Balcony'],
    amenities: ['Ocean view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi', 'Tea and coffee maker', 'Seating area', 'Wardrobe', 'Very good breakfast included'],
    size: '150 m²',
    view: 'Ocean view',
    beds: '1 Double bed, 1 Single bed',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    maxGuests: 3
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
              maxGuests: room.maxGuests
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
    setLoading(true);

    try {
      const roomData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
        amenities: formData.amenities.filter(a => a.trim() !== ''),
        price: Number(formData.price),
        maxGuests: Number(formData.maxGuests)
      };

      if (isEdit && roomId) {
        const success = await updateRoom(roomId, roomData);
        if (success) {
          router.push('/admin/rooms');
        } else {
          alert('Failed to update room');
        }
      } else {
        const newRoomId = await createRoom(roomData);
        if (newRoomId) {
          router.push('/admin/rooms');
        } else {
          alert('Failed to create room');
        }
      }
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Failed to save room');
    } finally {
      setLoading(false);
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
      {/* Pre-filled with Ocean View Suite information - you can modify as needed */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Form is pre-filled with Ocean View Suite information. 
          Use the quick templates below to switch between Ocean View ($300) and Garden Suite ($250), or modify any fields as needed.
        </p>
      </div>
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  />
                </div>

                <div className="col-span-6">
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    id="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    required
                    placeholder="https://example.com/room-image.jpg"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  />
                  
                  {/* Image Preview */}
                  {formData.image && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <img 
                        src={formData.image} 
                        alt="Room preview" 
                        className="w-32 h-20 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    💡 <strong>Tip:</strong> Use Unsplash, Pexels, or upload to your server. 
                    Current: Working Unsplash image for Garden Suite.
                  </p>
                  
                  {/* Quick Room Templates */}
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium text-gray-700 mb-2">Quick Room Templates:</p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setFormData({
                          name: 'Ocean View Suite',
                          type: 'Ocean View',
                          price: 300,
                          description: 'This suite\'s standout feature is the Ocean with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with ocean views. The unit has 2 beds.',
                          features: ['Private suite', '150 m²', 'Balcony'],
                          amenities: ['Ocean view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi', 'Tea and coffee maker', 'Seating area', 'Wardrobe', 'Very good breakfast included'],
                          size: '150 m²',
                          view: 'Ocean view',
                          beds: '1 Double bed, 1 Single bed',
                          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                          maxGuests: 3
                        })}
                        className="text-xs text-blue-600 hover:text-blue-800 underline block"
                      >
                        🌊 Ocean View Suite ($300) - Current
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          name: 'Garden Suite',
                          type: 'Garden View',
                          price: 250,
                          description: 'This suite\'s standout feature is the Garden with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.',
                          features: ['Private suite', '150 m²', 'Balcony'],
                          amenities: ['Garden view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi', 'Tea and coffee maker', 'Seating area', 'Wardrobe', 'Very good breakfast included'],
                          size: '150 m²',
                          view: 'Garden view',
                          beds: '1 Double bed, 1 Single bed',
                          image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                          maxGuests: 3
                        })}
                        className="text-xs text-blue-600 hover:text-blue-800 underline block"
                      >
                        🌿 Garden Suite ($250)
                      </button>
                    </div>
                  </div>
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
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
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

