'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { getRooms, Room } from '@/lib/firestoreService';
import { BsFilterSquare } from "react-icons/bs";
import { 
  User, 
  Calendar,
  Edit, 
  Trash2, 
  Tag, 

  DoorOpen, 
  Maximize2, 
  Umbrella, 
  TreePine, 
  Waves, 
  Snowflake, 
  Bath, 
  Wifi, 
  BedDouble,
  Coffee,
  Shield,
  CreditCard
} from 'lucide-react';

function RoomsContent() {
  const router = useRouter();
  const { bookingData, rooms: cartRooms, addRoom, removeRoom, calculateTotal, bookingSetThisSession } = useCart();
  const search = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedRoomId, setAddedRoomId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);



  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsData = await getRooms();
        setRooms(roomsData);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const ignoreBooking = search?.get('view') === 'explore';
  const hasBooking = Boolean(bookingData) && bookingSetThisSession && !ignoreBooking;

  const addToCart = (room: Room) => {
    if (!hasBooking) {
      setShowToast('Select dates first to book');
      setTimeout(() => setShowToast(null), 1800);
      return;
    }
    addRoom(room);
    setAddedRoomId(room.id);
    setShowToast(`${room.type} added to cart`);
    setTimeout(() => setAddedRoomId(null), 1500);
    setTimeout(() => setShowToast(null), 1800);
  };

  const removeFromCart = (roomId: string) => {
    removeRoom(roomId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCancellationDate = () => {
    if (!bookingData) return '';
    const checkIn = new Date(bookingData.checkIn);
    const cancellationDate = new Date(checkIn);
    cancellationDate.setDate(checkIn.getDate() - 2);
    return cancellationDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getPaymentDate = () => {
    if (!bookingData) return '';
    const checkIn = new Date(bookingData.checkIn);
    const paymentDate = new Date(checkIn);
    paymentDate.setDate(checkIn.getDate() - 2);
    return paymentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Always show rooms. If no bookingData, we will hide date context and use neutral labels.

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  const containerPad = hasBooking ? 'pt-20 md:pt-28' : 'pt-32 md:pt-40';
  const cartStickyTop = hasBooking ? 'lg:top-28' : 'lg:top-40';

  return (
    <div className={`min-h-screen bg-[#FFFCF6] overflow-x-hidden ${containerPad}`}>
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

      
      {/* Booking Context Bar - only if user selected data */}
      {bookingData && (
      <div className="w-full px-4 py-6 mt-20">
        <div className="max-w-5xl  mt-15">
          <div className="bg-[#F8F5EF] rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 p-3 md:p-4">
              
              {/* Guest Input */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#655D4E] text-xs font-semibold">
                  <User size={16} />
                  <span>Guest</span>
                </div>
                <div className="bg-[rgba(255,255,255,0.1)] border border-[#655D4E] rounded-md p-2 h-9 md:h-8 flex items-center">
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
                <div className="bg-[rgba(255,255,255,0.1)] border border-[#655D4E] rounded-md p-2 h-9 md:h-8 flex items-center">
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
                <div className="bg-[rgba(255,255,255,0.1)] border border-[#655D4E] rounded-md p-2 h-9 md:h-8 flex items-center">
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
      )}

      <div className="w-full max-w-full mb-16 lg:mb-20">
        <div className="w-full px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Rooms List */}
            <div className="w-full lg:basis-[62%]">
              <div className="space-y-6 lg:space-y-8">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-[#F8F5EF] rounded-[14px] overflow-hidden border border-[rgba(101,93,78,0.12)]">
                    <div className="flex flex-col lg:flex-row">
                      {/* Left Side - Image and Features */}
                      <div className="w-full lg:w-[520px] flex-shrink-0">
                        {/* Room Image */}
                        <div className="w-full h-64 lg:h-[380px] relative mb-0 rounded-b-none overflow-hidden">
                          <Image 
                            src={room.image || '/figma/rooms-garden-suite.png'} 
                            alt={room.name}
                            fill
                            className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 320px"
                          />
                          {/* Bed info overlay */}
                          <div className="absolute left-2 bottom-2 bg-white/90 rounded px-2 py-1 text-xs flex items-center gap-1">
                            <BedDouble size={14} color="#1D2A3A" />
                            <span className="font-semibold text-[#1D2A3A]">{room.beds}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-[#FFFDF8]">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-[#3A3326]">
                              <DoorOpen size={12} color="#3A3326" />
                              <span>Private suite</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#3A3326]">
                              <Maximize2 size={12} color="#3A3326" />
                              <span>150 m²</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#3A3326]">
                              <Umbrella size={12} color="#3A3326" />
                              <span>Balcony</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#3A3326]">
                              <TreePine size={12} color="#3A3326" />
                              <span>Garden view</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#3A3326]">
                              <Waves size={12} color="#3A3326" />
                              <span>Pool view</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#3A3326]">
                              <Snowflake size={12} color="#3A3326" />
                              <span>AC</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#3A3326]">
                              <Bath size={10} color="#3A3326" />
                              <span>Bathroom</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#3A3326]">
                              <Wifi size={12} color="#3A3326" />
                              <span>WiFi</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Room Details */}
                      <div className="w-full flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-4">
                        {/* Room Info */}
                        <div>
                          <h3 className="text-[20px] md:text-[22px] font-semibold text-[#2D2922] mb-2 font-quicksand">{room.type}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#FF6A00] font-bold text-[18px]">${room.price} / Night</span>
                            <span className="text-[#655D4E] text-xs">including general taxes and fees</span>
                          </div>
                        </div>

                        {/* Offer Banner */}
                        <div className="bg-[rgba(21,166,2,0.16)] w-full h-6 flex items-center px-2 rounded">
                          <div className="flex items-center gap-1 text-[#067832] text-xs font-semibold">
                            <Tag size={12} />
                            <span>Book now and unlock 15% total savings!</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[#423B2D] text-sm leading-6 flex-grow">
                          {room.description}
                        </p>

                        {/* Booking Info */}
                        <div className="space-y-2 font-semibold">
                          <div className="flex items-center gap-2 text-[#464035] text-sm">
                            <Coffee size={14} color="#BE8C53" />
                            <span>Very good breakfast included</span>
                          </div>
                          {bookingData && (
                            <>
                              <div className="flex items-center gap-2 text-[#464035] text-sm">
                                <Shield size={14} color="#BE8C53" />
                                <span>Free cancellation before {getCancellationDate()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[#464035] text-sm">
                                <CreditCard size={14} color="#BE8C53" />
                                <span>Pay nothing until {getPaymentDate()}</span>
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => addToCart(room)}
                          disabled={!hasBooking}
                          className={`${!hasBooking ? 'bg-gray-300 cursor-not-allowed text-gray-600' : 'bg-[#FF6A00] hover:bg-[#E55A00] text-white'} font-semibold transition-colors flex items-center justify-center w-full h-10 text-sm rounded-[6px] ${addedRoomId===room.id ? 'opacity-80' : ''}`}
                        >
                          {hasBooking ? (addedRoomId===room.id ? 'Added to cart ✓' : 'Book Now') : 'Select dates to book'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-full lg:basis-[38%] flex-shrink-0 mt-6 lg:mt-0">
              <div className={`rounded-2xl shadow-xl border border-[rgba(101,93,78,0.18)] bg-white/85 backdrop-blur p-5 lg:sticky ${cartStickyTop}`}>
                <h2 className="text-xl md:text-2xl font-bold text-[#4C3916] mb-2">
                  Your Cart (Item - {cartRooms.length})
                </h2>
                <div className="h-1 w-full rounded bg-gradient-to-r from-[#FFEDD5] via-[#FFE8CC] to-[#FFF5EA] mb-5" />
                
                {cartRooms.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No items in cart</p>
                ) : (
                  <div className="space-y-4">
                    {cartRooms.map((room) => (
                      <div key={room.id} className="bg-[#F8F5EF] p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-[#423B2D]">
                            {room.name}
                          </h3>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-[#1D2A3A]">
                              ${room.price}.00
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-[#FF6A00]">
                            {bookingData ? 
                              (() => {
                                const checkIn = new Date(bookingData.checkIn);
                                const checkOut = new Date(bookingData.checkOut);
                                const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                                return `${nights} Night Stay`;
                              })() 
                              : '1 Night Stay'
                            }
                          </span>
                          <div className="text-sm font-semibold text-[#1D2A3A]">
                            $0.00
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-sm text-[#655D4E]">
                            Taxes and Fees
                          </span>
                        </div>
                        
                        <p className="text-xs text-[#423B2D] mb-3">
                          This suite&apos;s standout feature is the pool with a view. Boasting a private entrance, this air...
                        </p>
                        
                        <div className="mb-8">
                          <span className="text-sm font-bold text-black">
                            {bookingData ? 
                              `${new Date(bookingData.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(bookingData.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}` 
                              : 'Thu, Nov 20, 2025 - Fri, Nov 21, 2025'
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-5 flex-wrap">
                          <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                            <Edit size={14} color="#FF6A00" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => removeFromCart(room.id)}
                            className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold"
                          >
                            <Trash2 size={14} color="#FF6A00" />
                            <span>Remove</span>
                          </button>
                          <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                            <Tag size={14} color="#FF6A00" />
                            <span>Offer</span>
                          </button>
                         
                        </div>
                        {/* dotted divider  */}
                        <div className="border-t border-dashed border-[rgba(0,0,0,0.4)] mt-4 mb-3"></div>
                        <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-base font-semibold text-black">
                            Total
                          </h4>
                          <p className="text-xs text-[#655D4E]">
                            including general taxes and fees
                          </p>
                        </div>
                        <span className="text-base font-semibold text-[#1D2A3A]">
                          ${calculateTotal()}.00
                        </span>
                      </div>
                      </div>
                    ))}
                  
                    
                    <button
                      onClick={() => router.push('/add-ons')}
                      className="w-full bg-[#FF6A00] text-white py-2 px-4  font-semibold hover:bg-orange-600 transition-colors text-sm"
                    >
                      Go to Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50">
          <div className="bg-[#1D2A3A] text-white text-sm px-4 py-2 rounded shadow-lg">
            {showToast}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFFCF6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    }>
      <RoomsContent />
    </Suspense>
  );
}