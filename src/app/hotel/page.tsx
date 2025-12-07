'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { getRooms, Room, getGalleryImages, GalleryImage, SuiteType, getAllGuestReviews, getSpecialOffers, SpecialOffer } from '@/lib/firestoreService';
import { AppliedOfferInfo, buildAppliedOfferInfo, calculateDiscountAmount, isSpecialOfferValid } from '@/lib/offers';
import { getAvailableRoomCount } from '@/lib/bookingService';
import { 
  MdLocationOn as LocationIcon,
  MdDirections as DirectionsIcon,
  MdAdd as AddIcon,
  MdRemove as RemoveIcon,
  MdPool,
  MdSpa,
  MdAirportShuttle,
  MdFreeBreakfast,
  MdLandscape,
  MdSportsTennis,
  MdLocalBar
} from 'react-icons/md';
import { FaRegShareSquare, FaStar } from 'react-icons/fa';

import CalendarWidget from '@/components/calendar/Calendar';
import { createPortal } from 'react-dom';
import RoomCard from '@/components/hotel/RoomCard';
import ComfortCard from '@/components/hotel/ComfortCard';
import BookingForm from '@/components/booking/BookingForm';
import FacilitiesDrawer from '@/components/hotel/FacilitiesDrawer';
import TransportSection from '@/components/hotel/TransportSection';
import PoliciesSection from '@/components/hotel/PoliciesSection';
import FoodAndDrinkSection from '@/components/hotel/FoodAndDrinkSection'; 
import { popularFacilities } from '@/components/hotel/facilitiesData';
import ActivitiesSection from '@/components/hotel/ActivitiesSection'
import BedAndChildInfoSection from '@/components/hotel/BedAndChildInfoSection'
import LegalInfoSection from '@/components/hotel/LegalInfoSection'
import GuestReviewsSection from '@/components/hotel/GuestReviewsSection'
import FAQSection from '@/components/hotel/FAQSection'
function HotelContent() {
  const router = useRouter();
  const { bookingData, addRoom, updateBookingData } = useCart();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [activeOffersByRoom, setActiveOffersByRoom] = useState<Record<string, AppliedOfferInfo | null>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'checkin' | 'checkout' | 'both'>('both');
  
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
    checkInDate.setDate(checkInDate.getDate() + 3);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
    return { checkIn: checkInDate, checkOut: checkOutDate };
  };
  
  const initialDates = getInitialDates();
  const [tempCheckIn, setTempCheckIn] = useState<Date | null>(initialDates.checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<Date | null>(initialDates.checkOut);
  const [tempGuests, setTempGuests] = useState(bookingData ? bookingData.guests : { adults: 2, children: 0, rooms: 1 });
  const [datePopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const [guestPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const roomsRef = useRef<HTMLDivElement>(null);
  const [showFacilities, setShowFacilities] = useState(false);
  const isInitialMount = useRef(true);
  const prevBookingDataRef = useRef<string | null>(null);
  const prevTempValuesRef = useRef<string | null>(null);
  const [availableRoomCounts, setAvailableRoomCounts] = useState<Record<string, number>>({});
  const [overallRating, setOverallRating] = useState<number>(8.7);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsData, galleryData, offers, reviews] = await Promise.all([
          getRooms(),
          getGalleryImages(),
          getSpecialOffers(),
          getAllGuestReviews(true) // Get only approved reviews
        ]);
        setRooms(roomsData);
        setGalleryImages(galleryData);
        setSpecialOffers(offers);
        
        // Calculate overall rating from reviews
        if (reviews.length > 0) {
          const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
          // Convert 5-star rating to 10-point scale (e.g., 4.5 stars = 9.0)
          setOverallRating((avgRating / 5) * 10);
          setTotalReviews(reviews.length);
        } else {
          setOverallRating(8.7); // Default rating
          setTotalReviews(0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch available room counts when dates change
  useEffect(() => {
    const fetchAvailableCounts = async () => {
      if (!tempCheckIn || !tempCheckOut || rooms.length === 0) return;
      
      const checkInStr = tempCheckIn.toISOString().split('T')[0];
      const checkOutStr = tempCheckOut.toISOString().split('T')[0];
      
      const counts: Record<string, number> = {};
      
      for (const room of rooms) {
        // Determine suite type from room name
        let suiteType: SuiteType | undefined;
        const roomNameLower = room.name.toLowerCase();
        if (roomNameLower.includes('garden')) {
          suiteType = 'Garden Suite';
        } else if (roomNameLower.includes('imperial')) {
          suiteType = 'Imperial Suite';
        } else if (roomNameLower.includes('ocean')) {
          suiteType = 'Ocean Suite';
        }
        
        if (suiteType) {
          try {
            const count = await getAvailableRoomCount(suiteType, checkInStr, checkOutStr);
            counts[room.id] = count;
          } catch (error) {
            console.error(`Error fetching available count for ${room.name}:`, error);
            counts[room.id] = 0;
          }
        }
      }
      
      setAvailableRoomCounts(counts);
    };
    
    fetchAvailableCounts();
  }, [tempCheckIn, tempCheckOut, rooms]);


  useEffect(() => {
    if (!bookingData) {
      if (isInitialMount.current) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDate = new Date(today);
        checkInDate.setDate(checkInDate.getDate() + 3);
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + 1);
        setTempCheckIn(checkInDate);
        setTempCheckOut(checkOutDate);
        isInitialMount.current = false;
      }
      return;
    }

    // Create a string representation of bookingData to compare
    const bookingDataString = JSON.stringify({
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests
    });

    // Only update if bookingData actually changed
    if (prevBookingDataRef.current === bookingDataString) {
      return;
    }

    prevBookingDataRef.current = bookingDataString;
    setTempCheckIn(new Date(bookingData.checkIn));
    setTempCheckOut(new Date(bookingData.checkOut));
    setTempGuests(bookingData.guests);
    
    // Reset temp values ref when bookingData changes externally
    // This allows the sync effect to run if needed
    prevTempValuesRef.current = JSON.stringify({
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests
    });
    
    isInitialMount.current = false;
  }, [bookingData]);

  // Sync temp values to booking data when they change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) return;
    if (!tempCheckIn || !tempCheckOut) return;

    // Create a string representation of current temp values to compare
    const tempValuesString = JSON.stringify({
      checkIn: tempCheckIn.toISOString(),
      checkOut: tempCheckOut.toISOString(),
      guests: tempGuests
    });

    // Only update if temp values actually changed
    if (prevTempValuesRef.current === tempValuesString) {
      return;
    }

    prevTempValuesRef.current = tempValuesString;

    // Use setTimeout to defer the update to avoid updating during render
    const timeoutId = setTimeout(() => {
      updateBookingData({ 
        checkIn: tempCheckIn.toISOString(), 
        checkOut: tempCheckOut.toISOString(), 
        guests: tempGuests 
      });
    }, 0);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempCheckIn, tempCheckOut, tempGuests]);

  const getStayNights = useCallback(() => {
    if (!tempCheckIn || !tempCheckOut) return 1;
    const diff = Math.ceil((tempCheckOut.getTime() - tempCheckIn.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [tempCheckIn, tempCheckOut]);

  const heroGalleryImages = galleryImages.slice(0, 5);
  useEffect(() => {
    if (!rooms.length) return;
    const guestCount = tempGuests.adults + tempGuests.children;
    const nightsCount = getStayNights();
    const now = new Date();

    const map: Record<string, AppliedOfferInfo | null> = {};

    rooms.forEach((room) => {
      const baseAmount = room.price * nightsCount;
      let bestOffer: SpecialOffer | null = null;
      let bestAmount = 0;

      specialOffers.forEach((offer) => {
        if (!isSpecialOfferValid(offer, { roomName: room.name, guestCount, now })) return;
        const amount = calculateDiscountAmount(baseAmount, offer);
        if (amount <= 0) return;
        if (!bestOffer || amount > bestAmount) {
          bestOffer = offer;
          bestAmount = amount;
        }
      });

      if (bestOffer) {
        map[room.id] = buildAppliedOfferInfo(bestOffer);
      } else {
        map[room.id] = null;
      }
    });

    setActiveOffersByRoom(map);
  }, [rooms, specialOffers, tempGuests, tempCheckIn, tempCheckOut, getStayNights]);

  const remainingImagesCount = Math.max(0, galleryImages.length - 5);

  const formatDateObj = (d: Date | null) => {
    if (!d) return '';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
      return next;
    });
  };

  const addToCart = async (room: Room, roomCount: number = 1) => {
    if (!tempCheckIn || !tempCheckOut) {
      
      return;
    }

    try {
      
      const { checkRoomAvailability } = await import('@/lib/bookingService');
      
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
        const checkIn = bookingData ? bookingData.checkIn : tempCheckIn.toISOString();
        const checkOut = bookingData ? bookingData.checkOut : tempCheckOut.toISOString();
        const baseGuests = bookingData ? bookingData.guests : tempGuests;
        // Use the roomCount from the specific room card
        const guests = { ...baseGuests, rooms: roomCount };
        
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
          alert(availability.message || 'No rooms available for the selected dates. Please choose different dates.');
          console.error(availability.message); 
          return;
        }
      }

      // Add the room to cart with the specified quantity (base price)
      addRoom(room, roomCount);
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const containerPad = '';

  

  const comforts = [
    { icon: MdFreeBreakfast, category: 'Breakfast', title: 'Delightful Breakfast' },
    { icon: MdLandscape, category: 'View', title: 'Breathtaking Horizons' },
    { icon: MdAirportShuttle, category: 'Airport Shuttle', title: 'Taste the Luxury' },
    { icon: MdSpa, category: 'Spa', title: 'Relax & Rejuvenate' },
    // { icon: MdFitnessCenter, category: 'Gym', title: 'Stay Fit Daily' },
    { icon: MdSportsTennis, category: 'Activities', title: 'Fun Every Day' },
    { icon: MdPool, category: 'Pool', title: 'Dive & Unwind' },
    // { icon: MdRestaurant, category: 'Dining', title: 'Taste the Luxury' },
    // { icon: MdKingBed, category: 'Stay', title: 'Comfort Redefined' },
    { icon: MdLocalBar, category: 'Bar / Lounge', title: 'Sip & Chill' },
    // { icon: MdFamilyRestroom, category: 'Family Zone', title: 'Joy Together' },
  ];


  return (
    <div className={`min-h-screen bg-[#F7F7F7] overflow-x-hidden ${containerPad}`}>
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

      <section className="w-full relative pt-[80px] md:pt-[191px]" style={{ zIndex: 10000, pointerEvents: 'none' }}>
        <div className="max-w-[1512px] mx-auto px-4 md:px-[168px]">
          <div className="w-full max-w-[1177px] mx-auto">
            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr] items-center gap-x-4 mb-2 relative -mt-[30px]" style={{ zIndex: 10001, pointerEvents: 'none' }}>
              <span className="text-[rgba(255,255,255,0.69)] text-[16px] font-normal text-center">Check in</span>
              <span className="text-[rgba(255,255,255,0.69)] text-[16px] font-normal text-center">Check out</span>
              <span className="text-[rgba(255,255,255,0.69)] text-[16px] font-normal text-left pl-2">Guests</span>
            </div>
            <div className="rounded-[9px] border-[2.3px] border-[#BE8C53] overflow-hidden bg-white relative" style={{ zIndex: 10001, pointerEvents: 'auto' }}>
              <BookingForm 
              navigateOnSubmit={false}
              borderColorClass="border-[#BE8C53]"
              onComplete={() => roomsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-[24px] md:px-[32px] py-[46px] pt-[30px] md:pt-[109px] bg-[#F7F7F7]">
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-white rounded-[2px] p-[20px]">
            <div className="grid grid-cols-1 lg:grid-cols-[674px_minmax(0,1fr)] gap-[40px] lg:gap-[72px] xl:gap-[90px] items-start">
              <div className="w-full">
                {/* Mobile Gallery - Simple Grid */}
                <div className="lg:hidden grid grid-cols-2 gap-2">
                  {heroGalleryImages.slice(0, 5).map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`relative ${
                        idx === 0 ? 'col-span-2 aspect-[2/1]' : 
                        idx === 1 || idx === 2 ? 'aspect-square' : 
                        'aspect-square'
                      }`}
                    >
                      <Image 
                        src={img?.imageUrl || '/figma/placeholder.jpg'} 
                        alt={`Gallery ${idx + 1}`}
                        fill
                        className="object-cover rounded-[8px]"
                        sizes="(max-width: 768px) 50vw, 100vw"
                      />
                      {idx === 4 && remainingImagesCount > 0 && (
                        <button 
                          className="absolute inset-0 bg-black/35 rounded-[8px] flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors z-10"
                          onClick={() => router.push('/gallery')}
                          aria-label="Open gallery"
                        >
                          <span className="text-white text-sm font-semibold">+{remainingImagesCount}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Desktop Gallery - Original Layout */}
                <div className="hidden lg:block relative" style={{ width: '674px', maxWidth: '100%', height: '520px' }}>
                  <div className="absolute -top-2 -left-[6px] w-[403px] h-[316px]">
                    <Image 
                      src={heroGalleryImages[0]?.imageUrl || '/figma/placeholder.jpg'} 
                      alt="Gallery 1"
                      fill
                      className="object-cover rounded-[10px]"
                    />
                  </div>
                  <div className="absolute -top-2 left-[401px] w-[288px] h-[316px]">
                    <Image 
                      src={heroGalleryImages[1]?.imageUrl || '/figma/placeholder.jpg'} 
                      alt="Gallery 2"
                      fill
                      className="object-cover rounded-[10px]"
                    />
                  </div>
                  <div className="absolute top-[312px] -left-[6px] w-[231px] h-[218px]">
                    <Image 
                      src={heroGalleryImages[2]?.imageUrl || '/figma/placeholder.jpg'} 
                      alt="Gallery 3"
                      fill
                      className="object-cover rounded-[10px]"
                    />
                  </div>
                  <div className="absolute top-[312px] left-[229px] w-[230px] h-[218px]">
                    <Image 
                      src={heroGalleryImages[3]?.imageUrl || '/figma/placeholder.jpg'} 
                      alt="Gallery 4"
                      fill
                      className="object-cover rounded-[10px]"
                    />
                  </div>
                  <div className="absolute top-[312px] left-[463px] w-[231px] h-[218px]">
                    <Image 
                      src={heroGalleryImages[4]?.imageUrl || '/figma/placeholder.jpg'} 
                      alt="Gallery 5"
                      fill
                      className="object-cover rounded-[10px]"
                    />
                    {remainingImagesCount > 0 && (
                      <button 
                        className="absolute inset-0 bg-black/35 rounded-[10px] flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors"
                        onClick={() => router.push('/gallery')}
                        aria-label="Open gallery"
                      >
                        <span className="text-white text-[20px] font-semibold">+{remainingImagesCount}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[24px]">
                <div className="inline-flex items-center gap-[8px] bg-[#FFE7D7] rounded-[104px] px-[20px] py-[10px] w-fit">
                  <span className="text-[#FF6A00] text-[18px]">🏖️</span>
                  <span className="text-[12px] font-semibold text-[#FF6A00]">Beachfront · Private beach</span>
                </div>

                <div className="flex items-center gap-10 flex-wrap">
                  <h1 className="text-[36px] font-semibold text-[#1A1A1A]">Sultan Palace Zanzibar</h1>
                  <button
                    onClick={async () => {
                      const shareData = {
                        title: 'Sultan Palace Zanzibar',
                        text: 'Check this hotel',
                        url: typeof window !== 'undefined' ? window.location.href : ''
                      };
                      try {
                        if (navigator.share) {
                          await navigator.share(shareData);
                        } else {
                          const el = document.createElement('textarea');
                          el.value = shareData.url;
                          document.body.appendChild(el);
                          el.select();
                          document.execCommand('copy');
                          document.body.removeChild(el);
                          console.log('Link copied to clipboard');
                        }
                      } catch (e) {
                        console.error("Share failed", e);
                        try {
                          const el = document.createElement('textarea');
                          el.value = shareData.url;
                          document.body.appendChild(el);
                          el.select();
                          document.execCommand('copy');
                          document.body.removeChild(el);
                          console.log('Link copied to clipboard');
                        } catch {}
                      }
                    }}
                    className="flex items-center justify-center w-[46px] h-[46px] border border-[#1D69F9] rounded-full bg-white text-[#1D69F9] hover:bg-[#1D69F9] hover:text-white transition-colors"
                    aria-label="Share page"
                  >
                    <FaRegShareSquare className="text-[22px]" />
                  </button>
                </div>

                <div className="flex items-center gap-[14px] flex-wrap">
                  <div className="flex items-center gap-[5px]">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className="text-[#FEB902] text-[23px]" />
                    ))}
                  </div>
                  <span className="text-[16px] font-medium text-[#1A1A1A] ml-[3px]">({overallRating.toFixed(1)})</span>
                  {totalReviews > 0 && (
                    <span className="text-[16px] font-medium text-[#1A1A1A]">
                      {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                    </span>
                  )}
                  <span 
                    onClick={() => router.push('/reviews/submit')}
                    className="text-[16px] font-medium text-[#0088FF] ml-0 cursor-pointer hover:underline"
                  >
                    Write a review
                  </span>
                </div>

                <div className="flex items-end gap-[14px]">
                  <div className="flex items-end gap-[6px]">
                    <LocationIcon className="text-[#1D69F9] text-[20px]" />
                    <span className="text-[16px] text-[#3B3B3B]">Dongwe, East Coast, Zanzibar</span>
                  </div>
                  <button 
                    onClick={() => {
                      window.open('https://maps.app.goo.gl/pWzSDEjy1P4wRZqKA?g_st=aw', '_blank', 'noopener,noreferrer');
                    }}
                    className="flex items-center gap-[6px] text-[#007FEE] font-medium hover:underline"
                  >
                    <DirectionsIcon className="text-[#1D69F9] text-[24px]" />
                    <span className="text-[15px]">GET DIRECTION</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-[18px] font-medium text-[#3A3A3A] mb-[12px]">Facilities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-[24px] gap-y-[18px] text-[#323232]">
                    {popularFacilities.map(({ icon: Icon, label, special }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2 ${special === 'link' ? 'text-[#108a00] underline' : ''}`}
                      >
                        <Icon className={`text-[18px] ${special === 'link' ? 'text-[#108a00]' : ''}`} />
                        <span className="text-[14px]">{label}</span>
                      </div>
                    ))}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowFacilities(true);
                      }} 
                      className="text-[#007FEE] text-[16px] font-medium hover:underline text-left"
                      type="button"
                    >
                      View all
                    </button>
                  </div>
                </div>

                <FacilitiesDrawer open={showFacilities} onClose={() => setShowFacilities(false)} />

                <div className="w-full flex justify-start pt-[8px]">
                  <button 
                    onClick={() => roomsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="w-full sm:w-[360px] h-[64px] bg-[#1D69F9] text-white rounded-[7px] text-[20px] font-medium hover:bg-[#1a5ae0] transition-colors"
                  >
                    Select Room
                  </button>
                </div>
              </div>
            </div>
          </div>

          
          <div className="bg-white rounded-[2px] mt-0">
            <div className="overflow-x-auto scrollbar-hide -mx-4 md:mx-0">
              <div className="flex flex-nowrap gap-[20px] md:gap-[60px] px-4 md:px-[122px] py-[20px] md:py-[35px] border-b border-[rgba(0,0,0,0.23)] min-w-max md:min-w-0">
                {[
                  { id: 'overview', label: 'Over view' },
                  { id: 'transport', label: 'Transport' },
                  { id: 'facilities', label: 'Facilities' },
                  { id: 'policies', label: 'Policies' },
                  { id: 'food', label: 'Food & Drink' }, 
                  { id: 'activities', label: 'Activities' },
                  { id: 'bed', label: 'Bed & Child info' },
                  { id: 'legal', label: 'Legal info' },
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (tab.id === 'facilities') {
                        setShowFacilities(true);
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`pb-2 font-medium text-[14px] md:text-[16px] relative whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id 
                        ? 'text-[#1D69F9] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#1D69F9]' 
                        : 'text-[#242424]'
                    }`}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="px-4 md:px-[114px] py-6 md:py-[117px]">
                <div className="space-y-[32px]">
                  <div>
                    <h3 className="text-[24px] font-semibold text-[#3F3F3F] mb-[24px]">About Sultan Palace</h3>
                    <div className="space-y-[10px]">
                      <div>
                        <h4 className="text-[18px] font-semibold text-[#3F3F3F] mb-[10px]">Prime Beachfront Location</h4>
                        <p className="text-[16px] text-[#3F3F3F] leading-[1.125]">
                          Sultan Palace in Michamvi offers direct access to a private beach area and beachfront. Guests enjoy stunning sea views and a serene garden setting.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-[18px] font-semibold text-[#3F3F3F] mb-[10px]">Exceptional Facilities</h4>
                        <p className="text-[16px] text-[#3F3F3F] leading-[1.125]">
                          The hotel features an infinity swimming pool, spa facilities, and free WiFi. Additional amenities include a fitness centre, tennis court, and free bicycles.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-[18px] font-semibold text-[#3F3F3F] mb-[10px]">Comfortable Accommodations</h4>
                        <p className="text-[16px] text-[#3F3F3F] leading-[1.125]">
                          Rooms are equipped with air-conditioning, balconies, and private bathrooms. Guests can relax in the lounge or enjoy meals at the family-friendly restaurant.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-[18px] font-semibold text-[#3F3F3F] mb-[10px]">Nearby Attractions</h4>
                        <p className="text-[16px] text-[#3F3F3F] leading-[1.125]">
                          Michamvi Pingwe Beach is just a few steps away, while Jozani Forest lies 21 km from the property.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[24px] font-semibold text-[#3F3F3F] mb-[24px]">Comforts You&apos;ll Enjoy</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-6 gap-[12px]">
                      {comforts.map((comfort) => (
                        <ComfortCard
                          key={comfort.category}
                          icon={comfort.icon}
                          category={comfort.category}
                          title={comfort.title}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'transport' && <TransportSection />}
            {activeTab === 'policies' && <PoliciesSection />}
            {activeTab === 'food' && <FoodAndDrinkSection />}
            {activeTab === 'activities' && <ActivitiesSection />}
            {activeTab === 'bed' && <BedAndChildInfoSection />}
            {activeTab === 'legal' && <LegalInfoSection />}
          </div>
          <div ref={roomsRef} id="rooms-section" className="mt-[25px]">
            <h2 className="text-[28px] font-semibold text-[#282828] mb-[25px]">    All available rooms</h2>
            <div className="flex flex-col gap-[25px]">
              {rooms.slice(0, 3).map((room) => (
                <div key={room.id} className="bg-white rounded-[4px] overflow-hidden lg:h-[430px]">
                  <RoomCard
                    room={room}
                    checkIn={tempCheckIn}
                    checkOut={tempCheckOut}
                    guests={tempGuests}
                    onGuestChange={changeGuest}
                    onReserve={addToCart}
                    formatDate={formatDateObj}
                    availableRoomCount={availableRoomCounts[room.id]}
                    activeOffer={activeOffersByRoom[room.id] || undefined}
                    nights={getStayNights()}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
                        <RemoveIcon className="text-[16px]" />
                      </button>
                      <span className="w-8 text-center font-semibold text-base text-gray-800">{(tempGuests as Record<string, number>)[k]}</span>
                      <button onClick={() => changeGuest(k, 1)} className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-[#FF6A00] hover:border-[#FF6A00] hover:text-white transition-all duration-200 active:scale-95">
                        <AddIcon className="text-[16px]" />
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

        <GuestReviewsSection />
        <FAQSection />
      <Footer />
    </div>
  );
}

export default function HotelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HotelContent />
    </Suspense>
  );
}