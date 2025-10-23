'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { getAddOns, AddOn } from '@/lib/firestoreService';
import { BsFilterSquare } from "react-icons/bs";
import { 
  User, 
  Calendar, 
  Edit, 
  Trash2, 
  Tag, 
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

interface BookingData {
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
  nights?: number;
}

// AddOn interface is now imported from firestoreService

export default function AddOnsPage() {
  const router = useRouter();
  const { bookingData, rooms, addOns: cartAddOns, addAddOn, removeAddOn, updateAddOnQuantity, calculateTotal } = useCart();
  const [roomData, setRoomData] = useState<{ name: string; price: number; description?: string } | null>(null);
  const [buttonStates, setButtonStates] = useState<{[key: string]: 'add' | 'cancel' | 'update' | 'success'}>({});
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to home if no booking data
    if (!bookingData) {
      router.push('/');
      return;
    }

    // Use selected room from cart instead of localStorage
    if (rooms.length > 0) {
      const selectedRoom = rooms[0];
      setRoomData({
        name: selectedRoom.name,
        price: selectedRoom.price,
        description: selectedRoom.description
      });
    } else {
      // Set default room data if no room selected
      setRoomData({
        name: 'Garde suite',
        price: 545,
        description: 'This suite\'s standout feature is the pool with a view. Boasting a private entrance, this air...'
      });
    }
  }, [bookingData, router, rooms]);

  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        setLoading(true);
        const addOnsData = await getAddOns();
        setAddOns(addOnsData);
      } catch (error) {
        console.error('Error fetching add-ons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAddOns();
  }, []);

  const addToCart = (addOn: AddOn) => {
    addAddOn({ 
      ...addOn, 
      quantity: 1,
      type: addOn.type === 'per_room' ? 'per_stay' : addOn.type
    });
    setButtonStates(prev => ({ ...prev, [addOn.id]: 'success' }));
  };

  const handleCancel = (addOnId: string) => {
    setButtonStates(prev => ({ ...prev, [addOnId]: 'add' }));
  };

  const handleUpdate = (addOnId: string) => {
    console.log('Update clicked for:', addOnId);
    
    const addOn = addOns.find(item => item.id === addOnId);
    if (addOn) {
      // Success message handled by button state
      setTimeout(() => {
        // Reset button state after 3 seconds
      }, 3000);
    }
  };

  const removeFromCart = (addOnId: string) => {
    removeAddOn(addOnId);
  };

  const updateQuantity = (addOnId: string, quantity: number) => {
    const newQuantity = Math.max(1, quantity);
    updateAddOnQuantity(addOnId, newQuantity);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!bookingData) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading add-ons...</p>
        </div>
      </div>
    );
  }

  console.log('Current button states:', buttonStates);

  return (
    <div className="min-h-screen bg-[#FFFCF6]">
       <style jsx global>{`
        header {
          background-color: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(8px);
        }
        header * {
          color: white !important;
        }
      `}</style>
      <Header />
      
      {/* Navigation Section */}
      <div className="w-full px-4 mt-40">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => router.push('/rooms')}
            className="flex items-center gap-5 text-black"
          >
            <ArrowLeft size={26} strokeWidth={2} />
            <span className="text-xl font-semibold">Add to your room</span>
          </button>
        </div>
      </div>
      
      {/* Booking Form Section */}
      <div className="w-full  px-4 py-6 -mt-18">
        <div className="max-w-[730px] pr-10 mt-15">
          <div className="bg-[#F8F5EF] rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              
              {/* Guest Input */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#655D4E] text-xs font-semibold">
                  <User size={16} />
                  <span>Guest</span>
                </div>
                <div className="bg-[rgba(255,255,255,0.1)] border border-[#655D4E] rounded-md p-2 h-8 flex items-center">
                  <span className="text-[#423B2D] text-xs font-semibold">
                    {bookingData.guests.adults} guests, {bookingData.guests.rooms} room
                  </span>
                </div>
              </div>
              
              {/* Check-in Date */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#655D4E] text-xs font-semibold">
                  <Calendar size={14} />
                  <span>Check-in</span>
                </div>
                <div className="bg-[rgba(255,255,255,0.1)] border border-[#655D4E] rounded-md p-2 h-8 flex items-center">
                  <span className="text-[#423B2D] text-xs font-semibold">
                    {formatDate(bookingData.checkIn)}
                  </span>
                </div>
              </div>

              {/* Check-out Date */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#655D4E] text-xs font-semibold">
                  <Calendar size={14} />
                  <span>Check-Out</span>
                </div>
                <div className="bg-[rgba(255,255,255,0.1)] border border-[#655D4E] rounded-md p-2 h-8 flex items-center">
                  <span className="text-[#423B2D] text-xs font-semibold">
                    {formatDate(bookingData.checkOut)}
                  </span>
                </div>
              </div>

              {/* Filter Button */}
              <div className="flex flex-col items-start gap-1">
                <div className="text-[#3A3326] text-xs font-semibold mb-1">Filter by</div>
                <button className="flex items-center justify-center gap-1 bg-[#FF6A00] text-white px-2 py-1 rounded-md w-12 h-8">
                  <BsFilterSquare size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 mb-16 lg:mb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Add-ons List */}
            <div className="flex-1 lg:max-w-3xl">
              <div className="space-y-6 lg:space-y-8">
              {addOns.map((addOn) => (
                  <div key={addOn.id} className="bg-[rgba(152,152,152,0.07)] rounded-lg overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                      {/* Left Side - Image and Features */}
                      <div className="w-full lg:w-[245.43px] flex-shrink-0">
                        {/* Add-on Image */}
                        <div className="w-[245.43px] h-[228px] relative mb-3 overflow-hidden bg-gray-200">
                          <Image 
                            src={addOn.image} 
                            alt={addOn.name}
                            fill
                            className="object-cover object-center"
                            sizes="245px"
                          />
                        </div>

                      </div>

                      {/* Right Side - Add-on Details */}
                      <div className="w-full lg:w-[443px] p-8 flex flex-col gap-4">
                        {/* Add-on Info */}
                        <div>
                          <h3 className="text-2xl font-semibold text-[#423B2D] mb-2">{addOn.name}</h3>
                          <div className="flex flex-col gap-1 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[#FF6A00] font-bold text-xl">
                                ${addOn.price} / {addOn.type === 'per_room' ? 'Stay' : addOn.type === 'per_day' ? 'each stay' : addOn.type === 'per_guest' ? 'average per guest / stay' : 'Guest'}
                            </span>
                            </div>
                            {addOn.type === 'per_day' && (
                              <span className="text-[#655D4E] text-xs font-semibold uppercase">Price applies per bed, per day</span>
                            )}
                        </div>
                      </div>

                      {/* Description */}
                        <p className="text-[#423B2D] text-base leading-6 flex-grow">
                        {addOn.description}
                      </p>

                      {/* Quantity Selector for applicable items */}
                      {(addOn.type === 'per_day' || addOn.type === 'per_guest') && (
                        <div className="mb-4">
                            <div className="flex flex-col gap-2">
                              <span className="text-sm font-medium text-[#423B2D]">
                              {addOn.type === 'per_day' ? 'Number of Days' : 'Number of guests'}
                            </span>
                              <div className="flex items-center border border-[#110D0A] rounded w-[310px] h-[37px]">
                              <button
                                onClick={() => updateQuantity(addOn.id, (cartAddOns.find(item => item.id === addOn.id)?.quantity || 1) - 1)}
                                  className="flex items-center justify-center w-8 h-8 text-[#423B2D] hover:bg-gray-100"
                              >
                                  <span className="text-lg">-</span>
                              </button>
                                <span className="flex-1 text-center text-[#000000] font-semibold text-[15px]">
                                {cartAddOns.find(item => item.id === addOn.id)?.quantity || 1}
                              </span>
                              <button
                                onClick={() => updateQuantity(addOn.id, (cartAddOns.find(item => item.id === addOn.id)?.quantity || 1) + 1)}
                                  className="flex items-center justify-center w-8 h-8 text-[#423B2D] hover:bg-gray-100"
                              >
                                  <span className="text-lg">+</span>
                              </button>
                              </div>
                          </div>
                        </div>
                      )}

                        {buttonStates[addOn.id] === 'success' ? (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleCancel(addOn.id)}
                              className="bg-[rgba(255,43,43,0.22)] text-[#FF0B0B] font-semibold px-4 py-2 rounded text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdate(addOn.id)}
                              className="bg-[rgba(255,106,0,0.29)] text-[#FF6A00] font-semibold px-4 py-2 rounded text-sm"
                            >
                              Update
                            </button>
                            <div className="flex items-center gap-2 text-[#0C9C16] font-semibold px-4 py-2 text-sm">
                              <span>Successfully Added</span>
                              <CheckCircle size={20} color="#0C9C16" />
                            </div>
                          </div>
                        ) : (
                      <button
                        onClick={() => addToCart(addOn)}
                            className="bg-[#FF6A00] text-white font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center w-full h-10 text-sm rounded"
                      >
                        Add to my Stay
                      </button>
                        )}
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
            <div className="w-[520px] -mt-28 flex-shrink-0">
              <div className="bg-[#FFFCF6] rounded-lg shadow-lg border border-[rgba(101,93,78,0.15)] p-0 lg:sticky lg:top-8">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-[#3A3326] mb-4">
                    Your Cart (Item - {cartAddOns.length + (roomData ? 1 : 0)})
                  </h2>
                  
                  {/* Divider Line */}
                  <div className="w-full h-px bg-[rgba(66,59,45,0.13)] mb-6"></div>
                
                  {/* Cart Content */}
                  <div className="bg-[#F8F5EF] p-6 rounded-lg">
                    {/* Room Item */}
                    {roomData && (
                      <div className="mb-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[#423B2D] mb-2">
                              {roomData.name}
                            </h3>
                            <p className="text-sm text-[#423B2D] leading-relaxed mb-2">
                              {roomData.description || "This suite's standout feature is the pool with a view. Boasting a private entrance, this air..."}
                            </p>
                            <p className="text-sm text-black font-semibold mb-2">
                              {bookingData?.checkIn && bookingData?.checkOut 
                                ? `${formatDate(bookingData.checkIn)} - ${formatDate(bookingData.checkOut)}`
                                : 'Thu, Nov 20, 2025 - Fri, Nov 21, 2025'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {/* Room Price and Details */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-[#FF6A00] text-white px-3 py-1 rounded text-sm font-semibold">
                              {bookingData ? `${bookingData.guests.rooms} Night Stay` : '1 Night Stay'}
                            </div>
                            <div className="text-[#655D4E] text-sm">Taxes and Fees</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-[#FF6A00]">${roomData.price}</div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                              <Edit size={12} color="#FF6A00" />
                            </div>
                            Edit
                          </button>
                          <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                              <Trash2 size={12} color="#FF6A00" />
                            </div>
                            Remove
                          </button>
                          <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                              <Tag size={12} color="#FF6A00" />
                            </div>
                            Apply Offer
                          </button>
                        </div>
                        
                        {/* Divider Line */}
                        <div className="w-full h-px bg-[rgba(0,0,0,0.02)] my-4"></div>
                      </div>
                    )}

                    {/* Add-on Items */}
                    {cartAddOns.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[#423B2D] mb-2">
                              {item.name}
                            </h3>
                          </div>
                        </div>
                        
                        {/* Add-on Price and Details */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-4">
                            <div className="text-[#655D4E] text-sm">Taxes and Fees</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-[#FF6A00]">${(item.price * (item.quantity || 1)).toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                              <Edit size={12} color="#FF6A00" />
                            </div>
                            Edit
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold"
                          >
                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                              <Trash2 size={12} color="#FF6A00" />
                            </div>
                            Remove
                          </button>
                          <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                              <Tag size={12} color="#FF6A00" />
                            </div>
                            Apply Offer
                          </button>
                        </div>
                        
                        {/* Divider Line for add-ons */}
                        <div className="w-full h-px bg-[rgba(0,0,0,0.06)] my-4"></div>
                      </div>
                    ))}

                    {/* Total Section */}
                    <div className="mt-6 pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-black">Total</h3>
                          <p className="text-xs text-[#655D4E]">including general taxes and fees</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-[#1D2A3A]">
                            ${calculateTotal().toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="w-full h-px bg-[rgba(0,0,0,0.61)] my-6" style={{borderStyle: 'dashed'}}></div>

                  {/* Checkout Button */}
                  <button
                    onClick={() => router.push('/checkout')}
                    className="w-full bg-[#FF6A00] text-white py-3 px-6 font-semibold hover:bg-orange-600 transition-colors text-lg"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
