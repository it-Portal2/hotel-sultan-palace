'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface BookingData {
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
}

// Room interface is now imported from firestoreService

export default function RoomsPage() {
  const router = useRouter();
  const { bookingData, rooms: cartRooms, addRoom, removeRoom, calculateTotal } = useCart();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingData) {
      router.push('/');
    }
  }, [bookingData, router]);

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

  const addToCart = (room: Room) => {
    addRoom(room);
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

  if (!bookingData) {
    return <div>Loading...</div>;
  }

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
      
      {/* Booking Form Section */}
      <div className="w-full  px-4 py-6 mt-20">
        <div className="max-w-3xl mt-15">
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
            {/* Rooms List */}
            <div className="flex-1 lg:max-w-3xl">
              <div className="space-y-6 lg:space-y-8">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-[rgba(152,152,152,0.07)] rounded-lg overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                      {/* Left Side - Image and Features */}
                      <div className="w-full lg:w-80 flex-shrink-0">
                        {/* Room Image */}
                        <div className="w-full h-56 lg:h-64 relative mb-3">
                          <Image 
                            src={room.image || '/figma/rooms-garden-suite.png'} 
                            alt={room.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 320px"
                          />
                          {/* Bed info overlay */}
                          <div className="absolute  px-2 mt-70 text-sm flex items-center gap-1">
                            <BedDouble size={14} color="#1D2A3A" />
                            <span className="font-semibold text-[#1D2A3A]">{room.beds}</span>
                          </div>
                        </div>

                      
                        <div className="p-3 mt-10 bg-[#F8F5EF]">
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
                      <div className="w-full lg:w-90 p-8 flex flex-col gap-4">
                        {/* Room Info */}
                        <div>
                          <h3 className="text-xl font-semibold text-[#423B2D] mb-2">{room.type}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#FF6A00] font-bold text-lg">${room.price} / Night</span>
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
                        <p className="text-[#423B2D] text-sm leading-5 flex-grow">
                          {room.description}
                        </p>

                        {/* Booking Info */}
                        <div className="space-y-2 font-semibold">
                          <div className="flex items-center gap-2 text-[#464035] text-sm">
                            <Coffee size={14} color="#BE8C53" />
                            <span>Very good breakfast included</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#464035] text-sm">
                            <Shield size={14} color="#BE8C53" />
                            <span>Free cancellation before 15 November 2025</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#464035] text-sm">
                            <CreditCard size={14} color="#BE8C53" />
                            <span>Pay nothing until 10 November 2025</span>
                          </div>
                        </div>

                        <button
                          onClick={() => addToCart(room)}
                          className="bg-[#FF6A00] text-white font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center w-full h-10 text-sm"
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
            <div className="w-[410px] flex-shrink-0 -mt-28">
              <div className="bg-[#FFFCF6] rounded-lg shadow-lg border border-[rgba(101,93,78,0.15)] p-4 lg:sticky lg:top-8">
                <h2 className="text-lg font-semibold text-[#4C3916] mb-4">
                  Your Cart (Item - {cartRooms.length})
                </h2>
                
                <hr className="border-[rgba(66,59,45,0.13)] mb-6" />
                
                {cartRooms.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No items in cart</p>
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

      <Footer />
    </div>
  );
}