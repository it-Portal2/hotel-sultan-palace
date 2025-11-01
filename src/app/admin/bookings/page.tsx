"use client";

import React, { useEffect, useState } from 'react';
import { getAllBookings, Booking } from '@/lib/firestoreService';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAllBookings();
        setBookings(data);
      } catch (e) {
        console.error('Error loading bookings:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-2 text-gray-600">All recent reservations</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-600">No bookings yet</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {bookings.map((b) => (
              <li key={b.id}>
                <button className="w-full text-left px-4 py-4 sm:px-6 hover:bg-gray-50" onClick={() => setSelected(b)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.guestDetails.firstName} {b.guestDetails.lastName}</p>
                      <p className="text-xs text-gray-500">{b.guestDetails.email} • {b.guestDetails.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">${b.totalAmount}</p>
                      <p className="text-xs text-gray-500">{b.checkIn} → {b.checkOut}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Guest</p>
                <p className="text-gray-600">{selected.guestDetails.firstName} {selected.guestDetails.lastName}</p>
                <p className="text-gray-600">{selected.guestDetails.email}</p>
                <p className="text-gray-600">{selected.guestDetails.phone}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Stay</p>
                <p className="text-gray-600">{selected.checkIn} → {selected.checkOut}</p>
                <p className="text-gray-600">Guests: {selected.guests.adults} adults / {selected.guests.children} children</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Rooms</p>
                <ul className="list-disc ml-5 text-gray-600">
                  {selected.rooms.map((r, i) => (
                    <li key={i}>{r.type} - ${r.price}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Add-ons</p>
                <ul className="list-disc ml-5 text-gray-600">
                  {selected.addOns.map((a, i) => (
                    <li key={i}>{a.name} x{a.quantity} - ${a.price}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Total</p>
                <p className="text-gray-900 font-semibold">${selected.totalAmount}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Status</p>
                <p className="text-gray-900 font-semibold">{selected.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


