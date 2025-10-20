'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';

interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  type: 'per_stay' | 'per_day' | 'per_guest';
  quantity: number;
}

const addOns: AddOn[] = [
  {
    id: '1',
    name: 'Romantic Beach Dinner for Two',
    price: 245,
    description: 'Create magical memories with a private candlelit dinner by the ocean. Enjoy a cozy beachfront setting, personalized service, and a complimentary bottle of sparkling wine to toast the evening under the stars.',
    type: 'per_stay',
    quantity: 1
  },
  {
    id: '2',
    name: 'Daybed Classic Experience',
    price: 120,
    description: 'Reserve your exclusive beach daybed and indulge in personalized service throughout the day. Sip on fresh coconuts, enjoy a tropical fruit platter, and stay refreshed with cooling beverages. Relax with thoughtful amenities like sunscreen, soothing aloe vera, and after-sun care. A fully stocked minibar with wine, beer, and soft drinks completes your seaside retreat.',
    type: 'per_day',
    quantity: 1
  },
  {
    id: '3',
    name: "Couples' Massage Retreat",
    price: 150,
    description: "Unwind together with our signature couples' massage. Let expert therapists rejuvenate your body and mind in a serene setting inspired by the island's natural beauty — the perfect escape for two.",
    type: 'per_guest',
    quantity: 1
  },
  {
    id: '4',
    name: 'Private Airport Round-Trip Transfer',
    price: 150,
    description: 'Travel in comfort with a private airport transfer designed for convenience and exclusivity. Each car accommodates up to four passengers, ensuring a smooth and private journey to and from the resort.',
    type: 'per_stay',
    quantity: 1
  },
  {
    id: '5',
    name: 'Mnemba Atoll Snorkeling Tour',
    price: 70,
    description: 'Embark on a breathtaking snorkeling adventure at Mnemba Atoll. Explore crystal-clear waters teeming with vibrant coral reefs and colorful marine life — a true underwater paradise.',
    type: 'per_guest',
    quantity: 1
  }
];

export default function AddOnsPage() {
  const router = useRouter();
  const { bookingData, rooms, addOns: cartAddOns, addAddOn, removeAddOn, updateAddOnQuantity, calculateTotal } = useCart();

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

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 h-96">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">Add to your room</h1>
            <p className="text-lg mb-6">
              Enhance your stay with our premium services and experiences
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* Add-ons List */}
          <div className="flex-1">
            <div className="space-y-8">
              {addOns.map((addOn) => {
                // Find quantity in cart or fallback to 1 for UI
                const cartItem = cartAddOns.find(item => item.id === addOn.id);
                const quantity = cartItem ? cartItem.quantity : 1;

                return (
                  <div key={addOn.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="md:flex">
                      <div className="md:w-1/3">
                        <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">{addOn.name}</span>
                        </div>
                      </div>
                      <div className="md:w-2/3 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{addOn.name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl font-bold text-orange-500">
                                ${addOn.price} / {addOn.type === 'per_stay' ? 'Stay' : addOn.type === 'per_day' ? 'Day' : 'Guest'}
                              </span>
                              {addOn.type === 'per_day' && (
                                <span className="text-sm text-gray-500">Price applies per bed, per day</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-700 mb-6 text-sm leading-relaxed">
                          {addOn.description}
                        </p>

                        {/* Quantity Selector */}
                        {(addOn.type === 'per_day' || addOn.type === 'per_guest') && (
                          <div className="mb-4">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-gray-700">
                                {addOn.type === 'per_day' ? 'Number of Days' : 'Number of guests'}
                              </span>
                              <div className="flex items-center border border-gray-300 rounded">
                                <button
                                  onClick={() => updateAddOnQuantity(addOn.id, quantity - 1)}
                                  className="p-2 hover:bg-gray-100"
                                  disabled={quantity <= 1}
                                >
                                  -
                                </button>
                                <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                                <button
                                  onClick={() => updateAddOnQuantity(addOn.id, quantity + 1)}
                                  className="p-2 hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => addAddOn(addOn)}
                          className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                        >
                          Add to my Stay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="w-96">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Your Cart ({rooms.length + cartAddOns.length} Item{rooms.length + cartAddOns.length !== 1 ? 's' : ''})
              </h2>

              {/* Room Item */}
              {rooms.map((room) => (
                <div key={room.id} className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <div className="text-orange-500 font-bold">${room.price}.00</div>
                  </div>
                  <div className="text-sm text-gray-500">1 Night Stay</div>
                  <p className="text-gray-600 text-sm mt-2">
                    {formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)}
                  </p>
                </div>
              ))}

              {/* Add-on Items */}
              {cartAddOns.map((item) => (
                <div key={item.id} className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <button
                      onClick={() => removeAddOn(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-500 font-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {item.quantity > 1 ? `${item.quantity}x ` : ''}
                      {item.type === 'per_stay' ? 'Per Stay' : item.type === 'per_day' ? 'Per Day' : 'Per Guest'}
                    </span>
                  </div>
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
                onClick={() => router.push('/checkout')}
                className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors mt-4"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
