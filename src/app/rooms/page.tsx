'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  features: string[];
  amenities: string[];
  size: string;
  view: string;
  beds: string;
}

const rooms: Room[] = [
  {
    id: '1',
    name: 'Garden View Suite',
    type: 'Garden view',
    price: 545,
    description: "This suite's standout feature is the Garden with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.",
    features: ['Private suite', '150 m²', 'Balcony'],
    amenities: ['Garden view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi'],
    size: '150 m²',
    view: 'Garden view',
    beds: '1 Double bed, 1 Single bed'
  },
  {
    id: '2',
    name: 'Ocean View Suite',
    type: 'Ocean View',
    price: 545,
    description: "This suite's standout feature is the Ocean with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.",
    features: ['Private suite', '150 m²', 'Balcony'],
    amenities: ['Garden view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi'],
    size: '150 m²',
    view: 'Ocean view',
    beds: '1 Double bed, 1 Single bed'
  },
  {
    id: '3',
    name: 'Imperial Suite',
    type: 'Imperial suite',
    price: 545,
    description: "This suite's standout feature is the pool with a view. Boasting a private entrance, this air-conditioned suite includes 1 living room, 1 separate bedroom and 1 bathroom with a bath and a shower. The spacious suite offers a tea and coffee maker, a seating area, a wardrobe as well as a balcony with garden views. The unit has 2 beds.",
    features: ['Private suite', '150 m²', 'Balcony'],
    amenities: ['Garden view', 'Pool with a view', 'Air conditioning', 'Ensuite bathroom', 'Free WiFi'],
    size: '150 m²',
    view: 'Pool view',
    beds: '1 single bed, 1 double bed'
  }
];

export default function RoomsPage() {
  const router = useRouter();
  const { bookingData, rooms: cartRooms, addRoom, removeRoom, calculateTotal } = useCart();

  // Redirect if there's no booking data or loading
  React.useEffect(() => {
    if (!bookingData) {
      router.push('/');
    }
  }, [bookingData, router]);

  if (!bookingData) {
    return <div>Loading...</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFCF6]">
      <Header />

      {/* Hero Section with Booking Summary */}
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 h-96">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">Available Rooms</h1>
            <p className="text-lg mb-6">
              {formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)} • 
              {bookingData.guests.adults} Adults, {bookingData.guests.children} Children
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Rooms List */}
          <div className="flex-1">
            <div className="space-y-8">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">{room.name}</span>
                      </div>
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">{room.name}</h3>
                          <p className="text-gray-600 mb-2">{room.beds}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-500">${room.price} / Night</div>
                          <p className="text-sm text-gray-500">including general taxes and fees</p>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {room.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-4 h-4 bg-gray-300 rounded"></div>
                            {feature}
                          </div>
                        ))}
                      </div>

                      {/* Amenities */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {room.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-4 h-4 bg-gray-300 rounded"></div>
                            {amenity}
                          </div>
                        ))}
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                        {room.description}
                      </p>

                      {/* Booking Info */}
                      <div className="bg-green-50 p-3 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-green-800 text-sm">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span>Very good breakfast included</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-800 text-sm mt-1">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span>Free cancellation before 15 November 2025</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-800 text-sm mt-1">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span>Pay nothing until 10 November 2025</span>
                        </div>
                      </div>

                      <button
                        onClick={() => addRoom(room)}
                        className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="w-96">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Your Cart ({cartRooms.length} Item{cartRooms.length !== 1 ? 's' : ''})
              </h2>

              {cartRooms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items in cart</p>
              ) : (
                <div className="space-y-4">
                  {cartRooms.map((room) => (
                    <div key={room.id} className="border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{room.name}</h3>
                        <button
                          onClick={() => removeRoom(room.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-500 font-bold">${room.price}.00</span>
                        <span className="text-gray-500 text-sm">1 Night Stay</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-2">
                        {formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)}
                      </p>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-xl font-bold text-orange-500">${calculateTotal().toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">including general taxes and fees</p>
                  </div>

                  <button
                    onClick={() => router.push('/add-ons')}
                    className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors mt-4"
                  >
                    Go to Add-ons
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
