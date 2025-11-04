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
     
      <section ref={heroRef} className="relative w-full font-opensans hero-section mb-0">
        {/* Video Container with Form */}
        <div className="relative w-full h-[600px] md:h-[928px] overflow-visible">
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
          </div>
          
          {/* Booking Form - Mobile: Overlapping video, Desktop: At bottom with padding */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4 transform -translate-y-[50%] md:absolute md:bottom-8 md:left-0 md:right-0 md:z-10 md:translate-y-0 md:transform-none">
            <div className="w-full max-w-4xl mx-auto">
              <div className="hidden md:grid grid-cols-[1fr_1fr] items-center gap-x-6 px-6 mb-2">
                <span className="text-white text-base font-bold">Check-in / Check-out</span>
                <span className="text-white text-base font-bold">Guest</span>
              </div>
              <div id="booking-form" className="w-full">
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
        
        {/* Spacer for form visibility on mobile, padding for desktop */}
        <div className="h-12 md:h-16 lg:h-20"></div>

        {/* Audio */}
        <audio autoPlay loop className="hidden">
          <source src="/gentle-ocean-waves-birdsong-and-gull-7109.mp3" type="audio/mpeg" />
        </audio>
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