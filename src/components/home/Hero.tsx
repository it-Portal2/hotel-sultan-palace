'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import BookingForm from '@/components/booking/BookingForm';

export default function Hero() {
  const router = useRouter();
  const { updateBookingData } = useCart();
  const heroRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (heroRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('hero-visible');
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(heroRef.current);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <>
     
      <section ref={heroRef} className="relative w-full font-opensans hero-section mb-0" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Video Container with Form Overlay - All devices */}
        <div 
          className="relative w-full h-[600px] md:h-[928px]" 
          style={{ 
            position: 'relative',
            overflow: 'visible',
            zIndex: 0
          }}
        >
          {/* Video Background - Behind everything */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              zIndex: 0,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          >
            <source src="/hero.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Booking Form Overlay - Always on top of video, all screen sizes */}
          <div 
            className="absolute bottom-0 left-0 right-0 w-full" 
            style={{ 
              zIndex: 1000,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              pointerEvents: 'none',
              willChange: 'transform'
            }}
          >
            <div className="w-full max-w-full sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1083px] xl:max-w-[1200px] 2xl:max-w-[1300px] mx-auto px-2 sm:px-4 pb-2 sm:pb-3 md:pb-4 lg:pb-6">
              <div className="hidden md:grid grid-cols-[1fr_1fr_1fr] items-center gap-x-4 xl:gap-x-6 px-4 xl:px-6 mb-1 md:mb-1.5">
                <span className="text-white text-sm md:text-base font-bold text-center">Check-in</span>
                <span className="text-white text-sm md:text-base font-bold text-center">Check-out</span>
                <span className="text-white text-sm md:text-base font-bold text-left pl-2 md:pl-4">Guest</span>
              </div>
              <div 
                id="booking-form" 
                className="w-full lg:block" 
                style={{ 
                  pointerEvents: 'auto', 
                  position: 'relative', 
                  zIndex: 1001,
                  willChange: 'transform'
                }}
              >
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
        
        {/* Spacer to ensure next component is visible */}
        <div className="h-16 md:h-20 lg:h-24 xl:h-28"></div>

        {/* Audio */}
        {/* <audio autoPlay loop className="hidden">
          <source src="/gentle-ocean-waves-birdsong-and-gull-7109.mp3" type="audio/mpeg" />
        </audio> */}
      </section>

      <style jsx global>{`
        .hero-section {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s ease-out;
        }
        .hero-section.hero-visible,
        .hero-visible .hero-section {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Popups handled by BookingForm component */}
    </>
  );
}