'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { getRooms, Room } from '@/lib/firestoreService';
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
import CalendarWidget from '@/components/calendar/Calendar';
import { createPortal } from 'react-dom';

function RoomsContent() {
  const router = useRouter();
  const { bookingData, rooms: cartRooms, addRoom, removeRoom, calculateTotal, bookingSetThisSession, updateBookingData } = useCart();
  const search = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedRoomId, setAddedRoomId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Local UI state for inline date/guest editors
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'checkin' | 'checkout' | 'both'>('both');
  
  // Initialize with 3 days from current date for check-in, and 1 day after check-in for check-out
  const getInitialDates = () => {
    if (bookingData) {
      return {
        checkIn: new Date(bookingData.checkIn),
        checkOut: new Date(bookingData.checkOut)
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(today);
    checkInDate.setDate(checkInDate.getDate() + 3); // 3 days from today
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1); // 1 day after check-in
    return { checkIn: checkInDate, checkOut: checkOutDate };
  };
  
  const initialDates = getInitialDates();
  const [tempCheckIn, setTempCheckIn] = useState<Date | null>(initialDates.checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<Date | null>(initialDates.checkOut);
  const [tempGuests, setTempGuests] = useState(bookingData ? bookingData.guests : { adults: 2, children: 0, rooms: 1 });
  const checkInButtonRef = useRef<HTMLDivElement>(null);
  const checkOutButtonRef = useRef<HTMLDivElement>(null);
  const guestButtonRef = useRef<HTMLDivElement>(null);
  const [datePopupPosition, setDatePopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const [guestPopupPosition, setGuestPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);



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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keep temp state in sync when bookingData changes elsewhere
  useEffect(() => {
    if (bookingData) {
      setTempCheckIn(new Date(bookingData.checkIn));
      setTempCheckOut(new Date(bookingData.checkOut));
      setTempGuests(bookingData.guests);
    } else {
      // If no booking data, initialize with 3 days from current date and 1 day after check-in
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(today);
      checkInDate.setDate(checkInDate.getDate() + 3); // 3 days from today
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 1); // 1 day after check-in
      setTempCheckIn(checkInDate);
      setTempCheckOut(checkOutDate);
    }
  }, [bookingData]);

  const ignoreBooking = search?.get('view') === 'explore';
  const hasBooking = Boolean(bookingData) && bookingSetThisSession && !ignoreBooking;

  const addToCart = async (room: Room) => {
    // Use tempCheckIn and tempCheckOut if bookingData is not available
    if (!tempCheckIn || !tempCheckOut) {
      setShowToast('Please select dates first');
      setTimeout(() => setShowToast(null), 1800);
      return;
    }

    // Check room availability before adding to cart
    try {
      const { checkRoomAvailability } = await import('@/lib/bookingService');
      
      // Determine suite type from room type name
      let suiteType: 'Garden Suite' | 'Imperial Suite' | 'Ocean Suite' | undefined;
      const roomTypeLower = room.type.toLowerCase();
      if (roomTypeLower.includes('garden')) {
        suiteType = 'Garden Suite';
      } else if (roomTypeLower.includes('imperial')) {
        suiteType = 'Imperial Suite';
      } else if (roomTypeLower.includes('ocean')) {
        suiteType = 'Ocean Suite';
      }

      if (suiteType) {
        // Use tempCheckIn/tempCheckOut or bookingData
        const checkIn = bookingData ? bookingData.checkIn : tempCheckIn.toISOString();
        const checkOut = bookingData ? bookingData.checkOut : tempCheckOut.toISOString();
        const guests = bookingData ? bookingData.guests : tempGuests;
        
        // Update booking data if not already set
        if (!bookingData) {
          updateBookingData({ 
            checkIn, 
            checkOut, 
            guests 
          });
        }
        
        const bookingDataForCheck = {
          checkIn,
          checkOut,
          rooms: [{
            type: room.type,
            price: room.price,
            suiteType: suiteType
          }],
          guests,
          guestDetails: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            prefix: ''
          },
          address: {
            country: '',
            city: '',
            zipCode: '',
            address1: '',
            address2: ''
          },
          reservationGuests: [],
          addOns: [],
          totalAmount: 0,
          bookingId: '',
          status: 'pending' as const
        };

        const availability = await checkRoomAvailability(bookingDataForCheck);
        
        if (!availability.available) {
          setAvailabilityError(availability.message);
          return;
        }
      }

      // If available, add to cart
      addRoom(room);
      setAddedRoomId(room.id);
      setShowToast(`${room.type} added to cart`);
      setTimeout(() => setAddedRoomId(null), 1500);
      setTimeout(() => setShowToast(null), 1800);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityError('Error checking room availability. Please try again.');
    }
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

  const formatDateObj = (d: Date | null) => {
    if (!d) return '';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openCalendar = (mode: 'checkin' | 'checkout') => {
    const activeRef = mode === 'checkin' ? checkInButtonRef.current : checkOutButtonRef.current;
    if (activeRef) {
      const rect = activeRef.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      let top = rect.bottom + 8;
      if (spaceBelow < 400 && spaceAbove > spaceBelow) top = rect.top - 400;
      setDatePopupPosition({ top, left: rect.left, width: rect.width });
    }
    setCalendarMode(mode);
    setIsCalendarOpen(true);
  };

  const openGuests = () => {
    if (guestButtonRef.current) {
      const rect = guestButtonRef.current.getBoundingClientRect();
      setGuestPopupPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }
    setIsGuestOpen(true);
  };

  const handleDateSelect = (checkIn: Date | null, checkOut: Date | null) => {
    if (checkIn) setTempCheckIn(checkIn);
    if (checkOut) setTempCheckOut(checkOut);
    setIsCalendarOpen(false);
    setCalendarMode('both');
    if (checkIn && checkOut) {
      const guests = bookingData ? bookingData.guests : tempGuests;
      updateBookingData({ checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), guests });
    }
  };

  const changeGuest = (key: 'adults' | 'children' | 'rooms', delta: number) => {
    setTempGuests((prev) => {
      const next = { ...prev, [key]: Math.max( key === 'children' ? 0 : 1, prev[key] + delta) };
      // Persist immediately if we already have dates
      if (tempCheckIn && tempCheckOut) {
        updateBookingData({ checkIn: tempCheckIn.toISOString(), checkOut: tempCheckOut.toISOString(), guests: next });
      }
      return next;
    });
  };

  const getCancellationDate = (room: Room) => {
    // Use tempCheckIn if available, otherwise use bookingData
    const checkIn = tempCheckIn || (bookingData ? new Date(bookingData.checkIn) : null);
    if (!checkIn) {
      // Fallback: use 3 days from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(today);
      checkInDate.setDate(checkInDate.getDate() + 3);
      const cancellationDate = new Date(checkInDate);
      const daysBefore = room.cancellationFreeDays ?? 2;
      cancellationDate.setDate(checkInDate.getDate() - daysBefore);
      return cancellationDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    const cancellationDate = new Date(checkIn);
    // Use room's cancellationFreeDays, default to 2 if not set
    const daysBefore = room.cancellationFreeDays ?? 2;
    cancellationDate.setDate(checkIn.getDate() - daysBefore);
    return cancellationDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getPaymentDate = (room: Room) => {
    // Use tempCheckIn if available, otherwise use bookingData
    const checkIn = tempCheckIn || (bookingData ? new Date(bookingData.checkIn) : null);
    if (!checkIn) {
      // Fallback: use 3 days from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(today);
      checkInDate.setDate(checkInDate.getDate() + 3);
      const paymentDate = new Date(checkInDate);
      const daysBefore = room.cancellationFreeDays ?? 2;
      paymentDate.setDate(checkInDate.getDate() - daysBefore);
      return paymentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    const paymentDate = new Date(checkIn);
    // Use room's cancellationFreeDays for payment date as well, default to 2 if not set
    const daysBefore = room.cancellationFreeDays ?? 2;
    paymentDate.setDate(checkIn.getDate() - daysBefore);
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

     
      <div className="w-full px-4 py-6 mt-20">
        <div className="max-w-[1130px]   mt-15">
          <div className="bg-[#F8F5EF] rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4">
              
              {/* Guest Input */}
              <div className="flex flex-col gap-1" ref={guestButtonRef}>
                <div className="flex items-center gap-2 text-[#655D4E] text-xs font-semibold">
                  <User size={16} />
                  <span>Guest</span>
                </div>
                <button onClick={openGuests} className="bg-[rgba(255,255,255,0.1)] border border-[#655D4E] rounded-md p-2 h-9 md:h-8 flex items-center text-left hover:bg-white/50 transition-colors cursor-pointer">
                  <span className="text-[#423B2D] text-xs font-semibold w-full">
                    {(bookingData ? `${bookingData.guests.adults} guests, ${bookingData.guests.rooms} room` : `${tempGuests.adults} guests, ${tempGuests.rooms} room`)}
                  </span>
                </button>
              </div>
              
              {/* Check-in Date */}
              <div className="flex flex-col gap-1" ref={checkInButtonRef}>
                <div className="flex items-center gap-2 text-[#655D4E] text-xs font-semibold">
                  <Calendar size={14} />
                  <span>Check-in</span>
                </div>
                <button onClick={() => openCalendar('checkin')} className="bg-[rgba(255,255,255,0.1)] border border-[#655D4E] rounded-md p-2 h-9 md:h-8 flex items-center text-left hover:bg-white/50 transition-colors cursor-pointer">
                  <span className="text-[#423B2D] text-xs font-semibold w-full">
                    {bookingData ? formatDate(bookingData.checkIn) : (tempCheckIn ? formatDateObj(tempCheckIn) : 'Add Date')}
                  </span>
                </button>
              </div>

              {/* Check-out Date */}
              <div className="flex flex-col gap-1" ref={checkOutButtonRef}>
                <div className="flex items-center gap-2 text-[#655D4E] text-xs font-semibold">
                  <Calendar size={14} />
                  <span>Check-Out</span>
                </div>
                <button onClick={() => openCalendar('checkout')} className="bg-[rgba(255,255,255,0.1)] border border-[#655D4E] rounded-md p-2 h-9 md:h-8 flex items-center text-left hover:bg-white/50 transition-colors cursor-pointer">
                  <span className="text-[#423B2D] text-xs font-semibold w-full">
                    {bookingData ? formatDate(bookingData.checkOut) : (tempCheckOut ? formatDateObj(tempCheckOut) : 'Add Date')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portals for inline editors */}
      {isMounted && isCalendarOpen && datePopupPosition.top > 0 && createPortal(
        <div>
          <div className="fixed inset-0 bg-transparent cursor-pointer" onClick={() => setIsCalendarOpen(false)} style={{ zIndex: 99998, position: 'fixed' }} />
          <div 
            className="fixed transition-all duration-200 ease-out opacity-100"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 99999, top: `${datePopupPosition.top}px`, left: `${datePopupPosition.left}px`, minWidth: '350px', maxWidth: datePopupPosition.width > 0 ? `${datePopupPosition.width}px` : 'auto', position: 'fixed' }}
          >
            <div className="bg-white rounded-xl shadow-2xl ring-1 ring-black/5 overflow-visible">
              <CalendarWidget 
                isOpen={isCalendarOpen} 
                onClose={() => {
                  setIsCalendarOpen(false);
                  setCalendarMode('both');
                }} 
                onDateSelect={handleDateSelect} 
                selectedCheckIn={tempCheckIn} 
                selectedCheckOut={tempCheckOut}
                selectionMode={calendarMode}
                autoConfirm={true}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {isMounted && isGuestOpen && guestPopupPosition.top > 0 && createPortal(
        <div>
          <div className="fixed inset-0 bg-transparent cursor-pointer" onClick={() => setIsGuestOpen(false)} style={{ zIndex: 99998, position: 'fixed' }} />
          <div
            className="fixed transition-all duration-200 ease-out opacity-100"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 99999, top: `${guestPopupPosition.top}px`, left: `${guestPopupPosition.left}px`, width: guestPopupPosition.width > 0 ? `${guestPopupPosition.width}px` : 'auto', minWidth: '280px', position: 'fixed' }}
          >
            <div className="bg-white rounded-xl shadow-2xl ring-1 ring-black/5 p-6">
              <div className="space-y-5">
                {(['adults','children','rooms'] as const).map((k) => (
                  <div key={k} className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-base">{k.charAt(0).toUpperCase()+k.slice(1)}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => changeGuest(k, -1)} disabled={(tempGuests as Record<string, number>)[k] <= (k==='children'?0:1)} className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-[#FF6A00] hover:border-[#FF6A00] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center font-semibold text-base text-gray-800">{(tempGuests as Record<string, number>)[k]}</span>
                      <button onClick={() => changeGuest(k, 1)} className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-[#FF6A00] hover:border-[#FF6A00] hover:text-white transition-all duration-200 active:scale-95">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
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
                              <span>Very good breakfast included</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#464035] text-sm">
                              <Shield size={14} color="#BE8C53" />
                              <span>Free cancellation before {getCancellationDate(room)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#464035] text-sm">
                              <CreditCard size={14} color="#BE8C53" />
                              <span>Pay nothing until {getPaymentDate(room)}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => addToCart(room)}
                            className={`bg-[#FF6A00] hover:bg-[#E55A00] text-white font-semibold transition-colors flex items-center justify-center w-full h-10 text-sm rounded-[6px] ${addedRoomId===room.id ? 'opacity-80' : ''}`}
                          >
                            {addedRoomId===room.id ? 'Added to cart ✓' : 'Book Now'}
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

      {/* Availability Error Popup */}
      {isMounted && availabilityError && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative transform transition-all">
            {/* Close Button */}
            <button
              onClick={() => setAvailabilityError(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-[#202c3b] text-center mb-3">
              Room Not Available
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              {availabilityError}
            </p>

            {/* Action Button */}
            <button
              onClick={() => setAvailabilityError(null)}
              className="w-full bg-[#FF6A00] hover:bg-[#e55a00] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              OK, I Understand
            </button>
          </div>
        </div>,
        document.body
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