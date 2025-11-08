"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [calendarMode, setCalendarMode] = useState<'checkin' | 'checkout' | 'both'>('both');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const checkInButtonRef = useRef<HTMLDivElement>(null);
  const checkOutButtonRef = useRef<HTMLDivElement>(null);
  const guestButtonRef = useRef<HTMLDivElement>(null);
  const [datePopupPosition, setDatePopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const [guestPopupPosition, setGuestPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Auto-fill with 3 days from current date for check-in, and 1 day after check-in for check-out
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(today);
    checkInDate.setDate(checkInDate.getDate() + 3); // 3 days from today
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1); // 1 day after check-in
    
    setCheckInDate(checkInDate);
    setCheckOutDate(checkOutDate);
  }, []);

  useEffect(() => {
    const updateDatePosition = () => {
      const activeRef = calendarMode === 'checkin' ? checkInButtonRef.current : checkOutButtonRef.current;
      if (activeRef) {
        const rect = activeRef.getBoundingClientRect();
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
      window.addEventListener('scroll', updateDatePosition, { passive: true, capture: true });
      window.addEventListener('resize', updateDatePosition, { passive: true });
    }

    if (isGuestOpen) {
      setTimeout(updateGuestPosition, 0);
      window.addEventListener('scroll', updateGuestPosition, { passive: true, capture: true });
      window.addEventListener('resize', updateGuestPosition, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', updateDatePosition, true);
      window.removeEventListener('resize', updateDatePosition);
      window.removeEventListener('scroll', updateGuestPosition, true);
      window.removeEventListener('resize', updateGuestPosition);
    };
  }, [isCalendarOpen, isGuestOpen, calendarMode]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateSelect = (checkIn: Date | null, checkOut: Date | null) => {
    if (checkIn) setCheckInDate(checkIn);
    if (checkOut) setCheckOutDate(checkOut);
    setIsCalendarOpen(false);
    setCalendarMode('both');
  };
  
  const handleCheckInClick = () => {
    setCalendarMode('checkin');
    setIsCalendarOpen(true);
  };
  
  const handleCheckOutClick = () => {
    if (!checkInDate) {
      // If no check-in selected, open calendar in both mode
      setCalendarMode('both');
    } else {
      setCalendarMode('checkout');
    }
    setIsCalendarOpen(true);
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
    <div className="rounded-[10px] overflow-visible w-full max-w-full sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1083px] xl:max-w-[1200px] 2xl:max-w-[1300px] mx-auto relative px-2" style={{ position: 'relative', zIndex: 1001 }}>
      <div className="bg-white p-0.5 md:p-1 m-0">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] items-stretch gap-0 font-opensans">
          <div ref={checkInButtonRef} className="relative px-2 sm:px-3 md:px-4 lg:px-5 xl:px-[20px] py-1 md:py-1.5 lg:py-2 xl:py-[10px] border-b md:border-b-0 md:border-r border-black/20">
            <button onClick={handleCheckInClick} className="text-[#3F3F3F] text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] font-normal text-center w-full hover:opacity-80 transition-opacity cursor-pointer">
              {checkInDate ? formatDate(checkInDate) : 'Check-in'}
            </button>
          </div>
          <div ref={checkOutButtonRef} className="relative px-2 sm:px-3 md:px-4 lg:px-5 xl:px-[20px] py-1 md:py-1.5 lg:py-2 xl:py-[10px] border-b md:border-b-0 md:border-r border-black/20">
            <button onClick={handleCheckOutClick} className="text-[#3F3F3F] text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] font-normal text-center w-full hover:opacity-80 transition-opacity cursor-pointer">
              {checkOutDate ? formatDate(checkOutDate) : 'Check-out'}
            </button>
          </div>
          <div ref={guestButtonRef} className="relative px-2 sm:px-3 md:px-4 lg:px-5 xl:px-[20px] py-1 md:py-1.5 lg:py-2 xl:py-[10px] border-b md:border-b-0 md:border-r border-black/20">
            <button onClick={() => setIsGuestOpen(true)} className="text-[#3F3F3F] text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] font-normal text-center w-full hover:opacity-80 transition-colors cursor-pointer">
              {guests.adults} Adults . {guests.children} {guests.children === 1 ? 'Child' : 'Children'}
            </button>
          </div>
          <div className="p-1 sm:p-1.5 md:p-2 lg:p-3 xl:p-[10px]">
            <button onClick={handleCheckAvailability} className="w-full bg-[#FF6A00] text-white px-3 md:px-4 lg:px-5 xl:px-[18px] py-1 md:py-1.5 lg:py-2 xl:py-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity rounded cursor-pointer">
              <svg className="w-4 h-4 md:w-[18px] md:h-[18px] lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-open-sans font-bold text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] text-center">Check Availability</span>
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Calendar Popup Backdrop - Portal */}
      {isMounted && isCalendarOpen && createPortal(
        <div className="fixed inset-0 bg-transparent cursor-pointer" onClick={() => setIsCalendarOpen(false)} style={{ zIndex: 99998, position: 'fixed' }} />,
        document.body
      )}
      
      {/* Guest Popup Backdrop - Portal */}
      {isMounted && isGuestOpen && createPortal(
        <div className="fixed inset-0 bg-transparent cursor-pointer" onClick={() => setIsGuestOpen(false)} style={{ zIndex: 99998, position: 'fixed' }} />,
        document.body
      )}

      {/* Calendar Popup - Portal */}
      {isMounted && isCalendarOpen && datePopupPosition.top > 0 && createPortal(
        <div 
          className="fixed transition-all duration-200 ease-out opacity-100"
          onClick={(e) => e.stopPropagation()}
          style={{
            zIndex: 99999,
            top: `${datePopupPosition.top}px`,
            left: `${datePopupPosition.left}px`,
            minWidth: '350px',
            maxWidth: datePopupPosition.width > 0 ? `${datePopupPosition.width}px` : 'auto',
            position: 'fixed'
          }}
        >
          <div className="relative">
            {/* Triangle pointer */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-white drop-shadow-lg z-10" />
            <div className="bg-white rounded-xl shadow-2xl ring-1 ring-black/5 overflow-visible mt-2">
              <Calendar 
                isOpen={isCalendarOpen} 
                onClose={() => {
                  setIsCalendarOpen(false);
                  setCalendarMode('both');
                }} 
                onDateSelect={handleDateSelect} 
                selectedCheckIn={checkInDate} 
                selectedCheckOut={checkOutDate}
                selectionMode={calendarMode}
                autoConfirm={true}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Guest Popup - Portal */}
      {isMounted && isGuestOpen && guestPopupPosition.top > 0 && createPortal(
        <div
          className="fixed transition-all duration-200 ease-out opacity-100"
          onClick={(e) => e.stopPropagation()}
          style={{
            zIndex: 99999,
            top: `${guestPopupPosition.top}px`,
            left: `${guestPopupPosition.left}px`,
            width: guestPopupPosition.width > 0 ? `${guestPopupPosition.width}px` : 'auto',
            minWidth: '280px',
            position: 'fixed'
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
        </div>,
        document.body
      )}
    </>
  );
}


