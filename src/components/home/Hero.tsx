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
     
      <section ref={heroRef} className="relative w-full h-[600px] md:h-[928px] overflow-hidden font-opensans mb-6 md:-mb-12 hero-section">
        
      
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
         
          {/* <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-black/20 to-white" />  */}
        </div>

       
        <audio autoPlay loop className="hidden">
          <source src="/gentle-ocean-waves-birdsong-and-gull-7109.mp3" type="audio/mpeg" />
        </audio>

    
        <div className="relative z-10 h-full flex flex-col justify-end items-center pb-3 md:pb-8 px-4">
          <div className="w-full max-w-4xl">
            
   
            <div className="hidden md:grid grid-cols-[1fr_1fr] items-center gap-x-6 px-6 mb-2">
              <span className="text-white text-base font-bold">Check-in / Check-out</span>
              <span className="text-white text-base font-bold">Guest</span>
            </div>

            {/* Booking Form */}
            <div id="booking-form" className="-mt-20 sm:-mt-20 md:mt-0">
              <BookingForm />
            </div>
          </div>
        </div>
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