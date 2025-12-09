"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/admin/BackButton';
import { createGuestService, getAllBookings, GuestService, Booking } from '@/lib/firestoreService';

export default function NewGuestServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [formData, setFormData] = useState<Omit<GuestService, 'id' | 'createdAt' | 'updatedAt'>>({
    guestName: '',
    guestPhone: '',
    roomNumber: '',
    serviceCategory: 'other',
    serviceType: 'other',
    description: '',
    amount: 0,
    status: 'requested',
    requestedAt: new Date(),
    bookingId: undefined,
    notes: undefined,
    requestSource: 'web',
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await getAllBookings();
      // Show only active bookings
      const activeBookings = data.filter(b => 
        b.status === 'confirmed' || b.status === 'checked_in'
      );
      setBookings(activeBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleBookingChange = (bookingId: string) => {
    if (bookingId === '') {
      setFormData({
        ...formData,
        bookingId: undefined,
        guestName: '',
        guestPhone: '',
        roomNumber: '',
      });
      return;
    }

    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setFormData({
        ...formData,
        bookingId: bookingId,
        guestName: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
        guestPhone: booking.guestDetails.phone,
        roomNumber: booking.rooms[0]?.allocatedRoomType || booking.roomNumber || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const serviceData = {
        ...formData,
        requestedAt: new Date(),
        // Remove empty optional fields
        roomNumber: formData.roomNumber || undefined,
        bookingId: formData.bookingId || undefined,
        notes: formData.notes || undefined,
      };
      
      await createGuestService(serviceData);
      router.push('/admin/guest-services');
    } catch (error) {
      console.error('Error creating guest service:', error);
      alert('Failed to create service request');
    } finally {
      setLoading(false);
    }
  };

  const serviceTypes: GuestService['serviceType'][] = [
    'laundry',
    'housekeeping',
    'spa',
    'transport',
    'concierge',
    'room_service',
    'game',
    'other',
  ];

  const serviceTypeLabels: Record<GuestService['serviceType'], string> = {
    laundry: 'Laundry Service',
    housekeeping: 'Housekeeping',
    spa: 'Spa & Wellness',
    transport: 'Transport',
    concierge: 'Concierge',
    room_service: 'Room Service',
    game: 'Game Facility',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <BackButton href="/admin/guest-services" label="Back to Guest Services" />
      
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Add Service Request</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Create a new guest service request</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Link to Booking (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link to Booking (Optional)
            </label>
            <select
              value={formData.bookingId || ''}
              onChange={(e) => handleBookingChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
            >
              <option value="">No Booking Link</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.bookingId || booking.id} - {booking.guestDetails.firstName} {booking.guestDetails.lastName} 
                  {booking.rooms[0]?.allocatedRoomType ? ` (${booking.rooms[0].allocatedRoomType})` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              If linked to a booking, guest details will be auto-filled
            </p>
          </div>

          {/* Guest Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guest Name *
            </label>
            <input
              type="text"
              required
              value={formData.guestName}
              onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
              placeholder="e.g., John Doe"
            />
          </div>

          {/* Guest Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guest Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.guestPhone}
              onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
              placeholder="e.g., +1234567890"
            />
          </div>

          {/* Room Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Number (Optional)
            </label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
              placeholder="e.g., DESERT ROSE"
            />
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type *
            </label>
            <select
              required
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as GuestService['serviceType'] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
            >
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {serviceTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Amount ($) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
              placeholder="Describe the service request in detail..."
            />
          </div>

          {/* Notes (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
              placeholder="Any additional notes or special instructions..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/guest-services')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Service Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

