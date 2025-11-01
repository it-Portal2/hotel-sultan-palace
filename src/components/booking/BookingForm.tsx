"use client";

import React, { useState, useRef, useEffect } from 'react';
import Calendar from '@/components/calendar/Calendar';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

interface BookingFormProps {
  onComplete?: () => void;
  navigateOnSubmit?: boolean; // default true
}

export default function BookingForm({ onComplete, navigateOnSubmit = true }: BookingFormProps) {
  const router = useRouter();
  const { updateBookingData } = useCart();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const dateButtonRef = useRef<HTMLDivElement>(null);
  const guestButtonRef = useRef<HTMLDivElement>(null);
  const [datePopupPosition, setDatePopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const [guestPopupPosition, setGuestPopupPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const updateDatePosition = () => {
      if (dateButtonRef.current) {
        const rect = dateButtonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // If there's not enough space below, position above the field
        let topPosition = rect.bottom + 8;
        if (spaceBelow < 400 && spaceAbove > spaceBelow) {
          topPosition = rect.top - 400; // Approximate calendar height
        }
        
        setDatePopupPosition({
          top: topPosition,
          left: rect.left,
          width: rect.width
        });
      }
    };

    const updateGuestPosition = () => {
      if (guestButtonRef.current) {
        const rect = guestButtonRef.current.getBoundingClientRect();
        setGuestPopupPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        });
      }
    };

    if (isCalendarOpen) {
      setTimeout(updateDatePosition, 0);
      window.addEventListener('scroll', updateDatePosition, true);
      window.addEventListener('resize', updateDatePosition);
    }

    if (isGuestOpen) {
      setTimeout(updateGuestPosition, 0);
      window.addEventListener('scroll', updateGuestPosition, true);
      window.addEventListener('resize', updateGuestPosition);
    }

    return () => {
      window.removeEventListener('scroll', updateDatePosition, true);
      window.removeEventListener('resize', updateDatePosition);
      window.removeEventListener('scroll', updateGuestPosition, true);
      window.removeEventListener('resize', updateGuestPosition);
    };
  }, [isCalendarOpen, isGuestOpen]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateSelect = (checkIn: Date | null, checkOut: Date | null) => {
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
    setIsCalendarOpen(false);
  };

  const handleGuestChange = (type: 'adults' | 'children' | 'rooms', value: number) => {
    setGuests(prev => ({ ...prev, [type]: Math.max(0, value) }));
  };

  const handleCheckAvailability = () => {
    if (!checkInDate || !checkOutDate) return;
    updateBookingData({ checkIn: checkInDate.toISOString(), checkOut: checkOutDate.toISOString(), guests });
    if (navigateOnSubmit) router.push('/rooms');
    if (onComplete) onComplete();
  };

  return (
    <>
    <div className="bg-white rounded-[12px] shadow-lg overflow-visible w-full max-w-[1083px] mx-auto relative">
      <div className="bg-white rounded-[14px] p-2 md:p-[7px]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] items-center gap-0 font-opensans">
          <div ref={dateButtonRef} className="relative px-4 md:px-[29px] py-4 md:py-[29px] border-b md:border-b-0 md:border-r border-black/31">
            <button onClick={() => setIsCalendarOpen(true)} className="text-[#3F3F3F] text-[16px] md:text-[18px] font-normal text-left w-full hover:opacity-80 transition-opacity">
              {checkInDate && checkOutDate ? `${formatDate(checkInDate)} - ${formatDate(checkOutDate)}` : 'Add Dates'}
            </button>
          </div>
          <div ref={guestButtonRef} className="relative px-4 md:px-[29px] py-4 md:py-[29px] border-b md:border-b-0 md:border-r border-black/31">
            <button onClick={() => setIsGuestOpen(true)} className="text-[#3F3F3F] text-[16px] md:text-[18px] font-normal text-left w-full hover:opacity-80 transition-colors">
              {guests.adults} Adults . {guests.children} {guests.children === 1 ? 'Child' : 'Children'}
            </button>
          </div>
          <div className="p-4 md:p-[22px]">
            <button onClick={handleCheckAvailability} className="w-full bg-[#FF6A00] text-white px-4 md:px-[26px] py-3 md:py-[22px] rounded-[14px] flex items-center justify-center gap-2 md:gap-[15px] hover:opacity-90 transition-opacity">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-open-sans font-bold text-[16px] md:text-[18px]">Check Availability</span>
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Calendar Popup Backdrop */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[100] bg-transparent" onClick={() => setIsCalendarOpen(false)} />
      )}
      
      {/* Guest Popup Backdrop */}
      {isGuestOpen && (
        <div className="fixed inset-0 z-[100] bg-transparent" onClick={() => setIsGuestOpen(false)} />
      )}

      {/* Calendar Popup */}
      {isCalendarOpen && datePopupPosition.top > 0 && (
        <div 
          className="fixed z-[101] transition-all duration-200 ease-out opacity-100"
          onClick={(e) => e.stopPropagation()}
          style={{
            top: `${datePopupPosition.top}px`,
            left: `${datePopupPosition.left}px`,
            minWidth: '350px',
            maxWidth: datePopupPosition.width > 0 ? `${datePopupPosition.width}px` : 'auto'
          }}
        >
          <div className="relative">
            {/* Triangle pointer */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-white drop-shadow-lg z-10" />
            <div className="bg-white rounded-xl shadow-2xl ring-1 ring-black/5 overflow-visible mt-2">
              <Calendar isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} onDateSelect={handleDateSelect} selectedCheckIn={checkInDate} selectedCheckOut={checkOutDate} />
            </div>
          </div>
        </div>
      )}

      {/* Guest Popup */}
      {isGuestOpen && guestPopupPosition.top > 0 && (
        <div
          className="fixed z-[101] transition-all duration-200 ease-out opacity-100"
          onClick={(e) => e.stopPropagation()}
          style={{
            top: `${guestPopupPosition.top}px`,
            left: `${guestPopupPosition.left}px`,
            width: guestPopupPosition.width > 0 ? `${guestPopupPosition.width}px` : 'auto',
            minWidth: '280px'
          }}
        >
          <div className="relative">
            {/* Triangle pointer */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-white drop-shadow-lg" />
            <div className="bg-white rounded-xl shadow-2xl ring-1 ring-black/5 p-6 mt-2">
              <div className="space-y-5">
                {(['adults','children','rooms'] as const).map((k) => (
                  <div key={k} className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-base">{k.charAt(0).toUpperCase()+k.slice(1)}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleGuestChange(k, (guests as Record<string, number>)[k]-1)} 
                        disabled={(guests as Record<string, number>)[k] <= (k==='children'?0:1)} 
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-[#FF6A00] hover:border-[#FF6A00] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center font-semibold text-base text-gray-800">{(guests as Record<string, number>)[k]}</span>
                      <button 
                        onClick={() => handleGuestChange(k, (guests as Record<string, number>)[k]+1)} 
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-[#FF6A00] hover:border-[#FF6A00] hover:text-white transition-all duration-200 active:scale-95"
                      >
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
        </div>
      )}
    </>
  );
}


