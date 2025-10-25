'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '../calendar/Calendar';
import { useCart } from '../../context/CartContext';

export default function Hero() {
  const router = useRouter();
  const { updateBookingData } = useCart();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState({ adults: 2, children: 1, rooms: 1 });

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleDateSelect = (checkIn: Date | null, checkOut: Date | null) => {
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
    setIsCalendarOpen(false);
  };

  const handleGuestChange = (type: 'adults' | 'children' | 'rooms', value: number) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(0, value)
    }));
  };

  const handleCheckAvailability = () => {
    if (checkInDate && checkOutDate) {
      // Store booking data using CartContext
      const bookingData = {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        guests
      };
      updateBookingData(bookingData);
      router.push('/rooms');
    }
  };

  return (
    <>
     
      <section className="relative w-full h-screen overflow-hidden font-opensans">
        
      
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline 
            className="w-full h-full object-cover"
          >
            <source src="/hero.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
         
          <div className="absolute inset-0 bg-black/40" /> 
        </div>

       
        <audio autoPlay loop className="hidden">
          <source src="/gentle-ocean-waves-birdsong-and-gull-7109.mp3" type="audio/mpeg" />
        </audio>

    
        <div className="relative z-10 h-full flex flex-col justify-end items-center pb-8 px-4">
          <div className="w-full max-w-4xl">
            
   
            <div className="hidden md:grid grid-cols-[1fr_1fr] items-center gap-x-6 px-6 mb-2">
              <span className="text-white text-base font-bold">Check-in / Check-out</span>
              <span className="text-white text-base font-bold">Guest</span>
            </div>

            {/* Booking Form */}
            <div id="booking-form" className="bg-white rounded-xl shadow-lg p-2 md:p-0">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] items-center gap-2 md:gap-0 font-opensans">
                
                {/* Date Input */}
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="text-gray-700 text-lg p-3 md:p-4 text-center md:text-left "
                >
                  {checkInDate && checkOutDate 
                    ? `${formatDate(checkInDate)} - ${formatDate(checkOutDate)}`
                    : 'Add Dates'
                  }
                </button>
                
                {/* Guest Input */}
                <button
                  onClick={() => setIsGuestOpen(true)}
                  className="text-gray-700 text-lg p-3 md:p-4 text-center md:text-left border-b border-gray-200 md:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  {guests.adults} Adults, {guests.children} Children
                </button>
                
                {/* Button */}
                <div className="p-2 md:px-3 md:py-2">
                  <button 
                    onClick={handleCheckAvailability}
                    className="w-full bg-[#FF6A00] text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden md:inline"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span className="font-sans font-bold text-base">Check Availability</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Popup */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-full" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-40 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-white rounded-xl shadow-2xl">
                  <Calendar
                    isOpen={isCalendarOpen}
                    onClose={() => setIsCalendarOpen(false)}
                    onDateSelect={handleDateSelect}
                    selectedCheckIn={checkInDate}
                    selectedCheckOut={checkOutDate}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Selection Popup */}
      {isGuestOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsGuestOpen(false)}>
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-full" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-40 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-white rounded-xl shadow-2xl p-4 w-80">
                  <div className="space-y-4">
                    {/* Adults */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">Adults</h4>
                        <p className="text-xs text-gray-500">Ages 13 or above</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGuestChange('adults', guests.adults - 1)}
                          disabled={guests.adults <= 1}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-6 text-center font-medium text-sm">{guests.adults}</span>
                        <button
                          onClick={() => handleGuestChange('adults', guests.adults + 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">Children</h4>
                        <p className="text-xs text-gray-500">Ages 2-12</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGuestChange('children', guests.children - 1)}
                          disabled={guests.children <= 0}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-6 text-center font-medium text-sm">{guests.children}</span>
                        <button
                          onClick={() => handleGuestChange('children', guests.children + 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Rooms */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">Rooms</h4>
                        <p className="text-xs text-gray-500">Number of rooms</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGuestChange('rooms', guests.rooms - 1)}
                          disabled={guests.rooms <= 1}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-6 text-center font-medium text-sm">{guests.rooms}</span>
                        <button
                          onClick={() => handleGuestChange('rooms', guests.rooms + 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}