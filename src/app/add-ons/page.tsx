'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { getAddOns, AddOn } from '@/lib/firestoreService';
import { 
  Edit, 
  Trash2, 
  Tag, 
  CheckCircle
} from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import BookingForm from '@/components/booking/BookingForm';



export default function AddOnsPage() {
  const router = useRouter();
  const { bookingData, rooms, addOns: cartAddOns, addAddOn, removeAddOn, removeRoom, updateAddOnQuantity, calculateTotal } = useCart();
  const [roomData, setRoomData] = useState<{ name: string; price: number; description?: string } | null>(null);
  const [buttonStates, setButtonStates] = useState<{[key: string]: 'add' | 'cancel' | 'update' | 'success' | 'removed'}>({});
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (rooms.length > 0) {
      const selectedRoom = rooms[0];
      setRoomData({
        name: selectedRoom.name,
        price: selectedRoom.price,
        description: selectedRoom.description
      });
    } else {
      setRoomData(null);
    }
  }, [rooms]);

  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        setLoading(true);
        const addOnsData = await getAddOns();
        console.log('Loaded add-ons data:', addOnsData);
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
    removeAddOn(addOnId);
    setButtonStates(prev => ({ ...prev, [addOnId]: 'add' }));
  };

  const handleUpdate = (addOnId: string) => {
    console.log('Update clicked for:', addOnId);
    
    const addOn = addOns.find(item => item.id === addOnId);
    if (addOn) {
      
      setTimeout(() => {
     
      }, 3000);
    }
  };

  const removeFromCart = (addOnId: string) => {
    removeAddOn(addOnId);
    setButtonStates(prev => ({ ...prev, [addOnId]: 'removed' }));
    // Reset to 'add' after 2 seconds
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [addOnId]: 'add' }));
    }, 2000);
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
    return (
      <div className="min-h-screen bg-[#FFFCF6] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Booking Data</h2>
          <p className="text-gray-600 mb-6">Please start by selecting your dates and room first.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-[#FF6A00] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Start Booking
          </button>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-white">
       <style jsx global>{`
        header {
          background-color: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(8px);
          position: relative;
        }
        header::after {
          content: '';
          position: absolute;
          bottom: -60px;
          left: 0;
          right: 0;
          height: 60px;
          background-color: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 1;
        }
        header * {
          color: white !important;
        }
      `}</style>
      <Header />
      
      <section className="w-full relative" style={{ paddingTop: '191px', zIndex: 10000 }}>
        <div className="max-w-[1512px] mx-auto px-4 md:px-[168px]">
          <div className="w-full max-w-[1177px] mx-auto">
            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr] items-center gap-x-4 mb-2 relative -mt-[30px]" style={{ zIndex: 10001 }}>
              <span className="text-[rgba(255,255,255,0.69)] text-[16px] font-normal text-center">Check in</span>
              <span className="text-[rgba(255,255,255,0.69)] text-[16px] font-normal text-center">Check out</span>
              <span className="text-[rgba(255,255,255,0.69)] text-[16px] font-normal text-left pl-2">Guests</span>
            </div>
            <div className="rounded-[9px] border-[2.3px] border-[#BE8C53] overflow-hidden bg-white relative" style={{ zIndex: 10001 }}>
              <BookingForm 
                navigateOnSubmit={false}
                borderColorClass="border-[#BE8C53]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Section */}
      <div className="w-full px-4 md:px-[230px] pt-[40px] md:pt-[60px]">
        <div className="max-w-6xl">
          <button 
            onClick={() => {
              router.push('/hotel#rooms-section');
              setTimeout(() => {
                const roomsSection = document.getElementById('rooms-section');
                if (roomsSection) {
                  roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 300);
            }}
            className="flex items-center gap-5 text-black"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span className="text-xl font-semibold">Add to room</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-full mb-16 lg:mb-20 pt-[40px] md:pt-[60px]">
        <div className="max-w-[1512px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
          {/* Add-ons List */}
            <div className="w-full lg:w-[844px] lg:pl-[63px] px-4 lg:pr-0">
              <div className="space-y-[28px]">
              {addOns.map((addOn) => (
                  <div key={addOn.id} className="bg-[rgba(152,152,152,0.07)] overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                      {/* Left Side - Image and Features */}
                      <div className="w-full lg:w-[245px] flex-shrink-0">
                        {/* Add-on Image */}
                        <div className="w-full h-56 md:h-64 lg:w-[245px] lg:h-[228px] relative mb-0 overflow-hidden bg-gray-200">
                          <Image 
                            src={addOn.image} 
                            alt={addOn.name}
                            fill
                            className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                            sizes="(max-width: 1024px) 100vw, 245px"
                          />
                        </div>

                      </div>

                      {/* Right Side - Add-on Details */}
                      <div className="w-full flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-4">
                        {/* Add-on Info */}
                        <div>
                          <h3 className="text-[25px] font-semibold text-[#423B2D] mb-2">{addOn.name}</h3>
                          <div className="flex flex-col gap-1 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[#1D69F9] font-bold text-[22px]">
                                ${addOn.price} / {addOn.type === 'per_room' ? 'Stay' : addOn.type === 'per_day' ? 'each stay' : addOn.type === 'per_guest' ? 'average per guest / stay' : 'Guest'}
                            </span>
                            </div>
                            {addOn.type === 'per_day' && (
                              <span className="text-[#655D4E] text-[10px] font-semibold uppercase">Price applies per bed, per day</span>
                            )}
                        </div>
                      </div>

                      {/* Description */}
                        <p className="text-[#423B2D] text-base leading-[1.625] flex-grow">
                        {addOn.description}
                      </p>

                      {/* Quantity Selector for applicable items */}
                      {(addOn.type === 'per_day' || addOn.type === 'per_guest') && (
                        <div className="mb-4">
                            <div className="flex flex-col gap-2">
                              <span className="text-[15px] font-normal text-[#423B2D]">
                              {addOn.type === 'per_day' ? 'Number of Days' : 'Number of guests'}
                            </span>
                              <div className="flex items-center border border-[#110D0A] rounded-[4px] w-full max-w-[310px] h-[37px]">
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

                        {(() => {
                          const isInCart = cartAddOns.find(item => item.id === addOn.id);
                          const buttonState = buttonStates[addOn.id];
                          
                          if (buttonState === 'removed') {
                            return (
                              <div className="flex items-center justify-center gap-2 text-[#FF0B0B] font-semibold px-4 py-2 text-sm">
                                <span>Removed</span>
                                <CheckCircle size={20} color="#FF0B0B" />
                              </div>
                            );
                          } else if (isInCart || buttonState === 'success') {
                            return (
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => handleCancel(addOn.id)}
                                  className="bg-[rgba(255,43,43,0.22)] text-[#FF0B0B] font-semibold px-4 py-2 rounded text-sm hover:bg-[#FF0B0B]/20 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdate(addOn.id)}
                                  className="bg-[rgba(255,106,0,0.29)] text-[#FF6A00] font-semibold px-4 py-2 rounded text-sm hover:bg-[#FF6A00]/20 transition-colors"
                                >
                                  Update
                                </button>
                                <div className="flex items-center gap-2 text-[#0C9C16] font-semibold px-4 py-2 text-sm">
                                  <span>Successfully Added</span>
                                  <CheckCircle size={20} color="#0C9C16" />
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <button
                                onClick={() => addToCart(addOn)}
                                className="bg-[#1D69F9] text-white font-semibold hover:bg-[#1D69F9]/80 transition-colors flex items-center justify-center w-full h-[50px] text-[18px] rounded"
                              >
                                Add to my Stay
                              </button>
                            );
                          }
                        })()}
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          
            <div className="w-full lg:w-[534px] flex-shrink-0 mt-6 lg:mt-0 px-4 lg:px-0">
              <div className={" bg-[#F8F8F8] p-5 lg:p-[26px] lg:sticky lg:top-28"}>
                  <h2 className="text-[22px] font-bold text-[#3A3326] mb-2">
                    Your Cart (Item - {cartAddOns.length + (roomData ? 1 : 0)})
                  </h2>
                  
                  {/* Divider Line */}
                  <div className="h-[1px] w-full rounded bg-[rgba(66,59,45,0.13)] mb-5"></div>
                
                  {/* Cart Content */}
                  <div className="bg-white p-6 rounded-lg">
                    {/* Room Item */}
                    {roomData && (
                      <div className="mb-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-[22px] font-semibold text-[#423B2D] mb-2">
                              {roomData.name}
                            </h3>
                            <p className="text-[14px] text-[#423B2D] leading-[1.714] mb-2">
                              {roomData.description || "This suite's standout feature is the pool with a view. Boasting a private entrance, this air..."}
                            </p>
                            <p className="text-[15px] text-[#1D69F9] font-bold mb-2">
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
                            <div className="text-[#1D69F9] px-3 py-1 rounded text-[15px] font-bold">
                              {bookingData ? 
                                (() => {
                                  const checkIn = new Date(bookingData.checkIn);
                                  const checkOut = new Date(bookingData.checkOut);
                                  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                                  return `${nights} Night Stay`;
                                })() 
                                : '1 Night Stay'
                              }
                            </div>
                            <div className="text-[#655D4E] text-[16px]">Taxes and Fees</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[18px] font-semibold text-[#1D2A3A]">${roomData.price.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => {
                              router.push('/hotel#rooms-section');
                              // Scroll to rooms section after navigation
                              setTimeout(() => {
                                const roomsSection = document.getElementById('rooms-section');
                                if (roomsSection) {
                                  roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 300);
                            }}
                            className="flex items-center gap-1 text-[#3F3F3F] text-[16px] font-bold"
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
                              <Edit size={12} color="#3F3F3F" />
                            </div>
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              if (rooms.length > 0) {
                                removeRoom(rooms[0].id);
                                setRoomData(null);
                              }
                            }}
                            className="flex items-center gap-1 text-[#3F3F3F] text-[16px] font-bold"
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
                              <Trash2 size={12} color="#3F3F3F" />
                            </div>
                            Remove
                          </button>
                          <button className="flex items-center gap-1 text-[#3F3F3F] text-[16px] font-bold">
                            <div className="w-5 h-5  flex items-center justify-center">
                              <Tag size={12} color="#3F3F3F" />
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
                            <h3 className="text-[20px] font-semibold text-[#423B2D] mb-2">
                              {item.name}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-4">
                            <div className="text-[#655D4E] text-[16px]">Taxes and Fees</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[18px] font-semibold text-[#1D2A3A]">${(item.price * (item.quantity || 1)).toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-1 text-[#3F3F3F] text-[16px] font-bold"
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <Trash2 size={12} color="#3F3F3F" />
                            </div>
                            Remove
                          </button>
                          <button className="flex items-center gap-1 text-[#3F3F3F] text-[16px] font-bold">
                            <div className="w-5 h-5  flex items-center justify-center">
                              <Tag size={12} color="#3F3F3F" />
                            </div>
                            Apply Offer
                          </button>
                        </div>
                        
                        <div className="w-full h-px bg-[rgba(0,0,0,0.06)] my-4"></div>
                      </div>
                    ))}

                    {/* Total Section */}
                    <div className="mt-6 pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-[18px] font-semibold text-[#000000]">Total</h3>
                          <p className="text-[10px] text-[#655D4E]">including general taxes and fees</p>
                        </div>
                        <div className="text-right">
                          <div className="text-[18px] font-semibold text-[#1D2A3A]">
                            ${calculateTotal().toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-[#AFAFAF] my-6" style={{borderStyle: 'dashed'}}></div>

                  <button
                    onClick={() => router.push('/checkout')}
                    className="w-full bg-[#1D69F9] text-white py-3 px-6 font-semibold hover:bg-[#1D69F9]/80 transition-colors text-[20px]"
                  >
                    Checkout
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
