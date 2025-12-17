'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CartSummary from '@/components/CartSummary';
import { useCart } from '@/context/CartContext';
import { getAddOns, AddOn } from '@/lib/firestoreService';
import { CheckCircle } from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import BookingForm from '@/components/booking/BookingForm';



export default function AddOnsPage() {
  const router = useRouter();
  const { bookingData, addOns: cartAddOns, addAddOn, removeAddOn, updateAddOnQuantity } = useCart();
  const [buttonStates, setButtonStates] = useState<{[key: string]: 'add' | 'cancel' | 'update' | 'success' | 'removed'}>({});
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);

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

  const updateQuantity = (addOnId: string, quantity: number) => {
    const newQuantity = Math.max(1, quantity);
    updateAddOnQuantity(addOnId, newQuantity);
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
            
      <section className="w-full relative pt-[80px] md:pt-[191px]" style={{ zIndex: 10000, pointerEvents: 'none' }}>
        <div className="max-w-[1512px] mx-auto px-4 md:px-[168px]">
          <div className="w-full max-w-[1177px] mx-auto">
            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr] items-center gap-x-4 mb-2 relative -mt-[30px]" style={{ zIndex: 10001, pointerEvents: 'none' }}>
              <span className="text-[rgba(255,255,255,0.69)] text-[16px] font-normal text-center">Check in</span>
              <span className="text-[rgba(255,255,255,0.69)] text-[16px] font-normal text-center">Check out</span>
              <span className="text-[rgba(255,255,255,0.69)] text-[16px] font-normal text-left pl-2">Guests</span>
            </div>
            <div id="booking-form" className="rounded-[9px] border-[2.3px] border-[#BE8C53] overflow-hidden bg-white relative lg:block" style={{ zIndex: 10001, pointerEvents: 'auto' }}>
              <BookingForm 
                navigateOnSubmit={false}
                borderColorClass="border-[#BE8C53]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Section */}
      <div className="w-full px-4 md:px-[230px] pt-[20px] md:pt-[60px]">
        <div className="max-w-[1512px] mx-auto">
          <div className="w-full lg:w-[844px] lg:pl-[63px]">
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

                      {/* Quantity Selector for applicable items - Only show when addon is in cart */}
                      {(() => {
                        const isInCart = cartAddOns.find(item => item.id === addOn.id);
                        return (addOn.type === 'per_day' || addOn.type === 'per_guest') && isInCart && (
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
                        );
                      })()}

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

          
            <div className="w-full lg:w-[534px] flex-shrink-0 mt-6 lg:mt-0 px-4 lg:px-0" id="addons-cart-summary">
              <div className="lg:sticky lg:top-28">
                <CartSummary
                  className="shadow-[0px_20px_60px_rgba(0,0,0,0.06)]"
                  onCheckout={() => router.push('/checkout')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

          </div>
  );
}

