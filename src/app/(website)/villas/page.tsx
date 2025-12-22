"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useBookingEnquiry } from "@/context/BookingEnquiryContext";
import "@/styles/pages/villas.css";

export default function VillasPage() {
  const { openModal } = useBookingEnquiry();
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
        }
      });
    }, observerOptions);

    // Observe all refs
    [...headingRefs.current, ...textRefs.current, ...imageRefs.current, ...sectionRefs.current, heroRef.current].forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans w-full max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative w-full h-[400px] sm:h-[500px] md:h-[800px] lg:h-[951px] overflow-hidden">
          <Image
            src="/villas/hero-bg.png"
            alt="Villas Hero Background"
            fill
            priority
            loading="eager"
            fetchPriority="high"
            quality={90}
            sizes="100vw"
            className="object-cover"
            style={{ opacity: 1 }}
          />

          <div ref={heroRef} className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div className="text-center max-w-[627px]">
              <h1 className={`text-[#FFFFFF] text-2xl sm:text-3xl md:text-4xl lg:text-[48px] font-semibold leading-[1.2] sm:leading-[0.520833] mb-4 sm:mb-6 md:mb-10 drop-shadow-[0px_4px_26.1px_rgba(0,0,0,1)] font-quicksand hero-title ${isVisible ? 'hero-title-visible' : ''}`}>
                <span className="inline-block hero-word" style={{ animationDelay: '0.1s' }}>Our</span>{' '}
                <span className="inline-block hero-word" style={{ animationDelay: '0.3s' }}>Signature</span>{' '}
                <span className="inline-block hero-word" style={{ animationDelay: '0.5s' }}>Villas</span>
              </h1>
              <p className={`text-[#FFFFFF] text-sm sm:text-base md:text-[18px] font-semibold leading-[1.4] sm:leading-[1.388888] drop-shadow-[0px_4px_18.8px_rgba(0,0,0,0.25)] font-quicksand px-2 hero-description ${isVisible ? 'hero-description-visible' : ''}`}>
                Discover refined elegance and tropical comfort in our luxurious villas, where timeless design meets oceanfront tranquility.
              </p>
            </div>
          </div>
        </section>

        {/* Villas Section */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-24 bg-[#FFFCF6]">
          <div className="w-full mx-auto px-0 max-w-[1920px]">
            <div className="flex flex-col gap-8 sm:gap-12 md:gap-16 lg:gap-[68px]">

              {/* Garden View Villas */}
              <div ref={(el) => { sectionRefs.current[0] = el; }} className="flex flex-col gap-4 sm:gap-6 md:gap-[24px] lg:gap-[44px] w-full villa-section mx-2 sm:mx-4 md:mx-6 lg:mx-8 xl:mx-auto xl:max-w-[1620px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-3 sm:gap-4">
                  <h2
                    ref={(el) => { headingRefs.current[0] = el; }}
                    className="text-[#423B2D] text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold leading-[1.2] sm:leading-[0.9] md:leading-[0.625] font-quicksand villa-heading"
                  >
                    Garden View Villas
                  </h2>
                  <button onClick={openModal} className="bg-[#FF6A00] text-white px-4 py-2 rounded-[6px] text-[14px] sm:text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full sm:w-auto md:w-[208px] h-[38px] sm:h-[42px] flex items-center justify-center font-quicksand villa-button group/btn relative overflow-hidden md:mr-10 lg:mr-16">
                    <span className="relative z-10">Booking Enquiry</span>
                    <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                  </button>
                </div>

                <div className="flex flex-row items-start gap-2 sm:gap-3 md:gap-3 lg:gap-4 w-full h-auto md:h-[659px]">
                  <div ref={(el) => { imageRefs.current[0] = el; }} className="relative flex-[1.6] h-auto md:h-[520px] lg:h-[659px] flex-shrink-0 villa-main-image flex flex-col">
                    <div className="relative w-full h-[140px] sm:h-[180px] md:h-[300px] lg:h-[384px] xl:h-[384px] overflow-hidden flex-shrink-0">
                      <Image
                        src="/villas/garden-villa-main.png"
                        alt="Garden View Villa"
                        fill
                        className="object-cover transition-transform duration-700 group-hover/image-main:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image-main:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 villa-shimmer opacity-0 group-hover/image-main:opacity-100"></div>
                    </div>
                    <div
                      ref={(el) => { textRefs.current[0] = el; }}
                      className="relative md:absolute md:bottom-0 md:left-[62px] w-full md:w-[489px] h-auto text-center villa-text bg-transparent px-3 sm:px-4 md:px-0 py-3 sm:py-4 md:pt-4 md:pb-0 flex-shrink-0 flex flex-col items-center justify-center mx-auto"
                    >
                      <p className="text-[#242424] text-[12px] sm:text-[14px] md:text-[18px] lg:text-[22px] font-semibold leading-[1.3] sm:leading-[1.4] md:leading-[1.5] lg:leading-[1.363636] font-quicksand mb-2 sm:mb-3 md:mb-3 lg:mb-4 text-center group-hover/image-main:text-[#FF6A00] transition-colors duration-500">
                        Serenity and greenery just steps from your private villa.
                      </p>
                      <p className="text-[#655D4E] text-[11px] sm:text-[13px] md:text-[16px] lg:text-[18px] font-medium leading-[1.4] sm:leading-[1.6] md:leading-[1.8] lg:leading-[1.944444] font-quicksand mb-2 sm:mb-3 md:mb-3 lg:mb-4 text-center">
                        Relax in beautifully designed two-bedroom villas overlooking lush tropical gardens. Perfect for families or friends seeking tranquility.
                      </p>
                      <Link href="/hotel" className="bg-[#FF6A00] text-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 rounded-[4px] sm:rounded-[6px] text-[11px] sm:text-[13px] md:text-[16px] lg:text-[18px] font-medium leading-[1.944444] w-full sm:w-auto md:w-[208px] h-[32px] sm:h-[36px] md:h-[36px] lg:h-[40px] flex items-center justify-center font-quicksand mx-auto villa-book-btn group/book relative overflow-hidden">
                        <span className="relative z-10">Book Now</span>
                        <span className="absolute inset-0 bg-white/30 scale-x-0 group-hover/book:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                      </Link>
                    </div>
                  </div>
                  <div ref={(el) => { imageRefs.current[1] = el; }} className="relative flex-1 h-[200px] sm:h-[250px] md:h-[260px] lg:h-[659px] flex-shrink-0 villa-side-image">
                    <Image
                      src="/villas/garden-villa-1.png"
                      alt="Garden Villa Interior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image-side:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-side:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              </div>

              {/* Ocean Front Villas */}
              <div ref={(el) => { sectionRefs.current[1] = el; }} className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[761px] overflow-hidden villa-full-section">
                <Image
                  src="/gallery/hero-main-6ecfac.png"

                  alt="Ocean Front Villas Background"
                  fill
                  className="object-cover villa-bg-image"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black"></div>
                <div className="absolute inset-0 flex items-center justify-center px-4">
                  <div className="text-center max-w-[568px] flex flex-col items-center gap-4 sm:gap-6 md:gap-[25px] villa-full-content">
                    <h2
                      ref={(el) => { headingRefs.current[1] = el; }}
                      className="text-[#FFFFFF] text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-semibold leading-[1.2] sm:leading-[0.625] font-quicksand villa-full-heading"
                    >
                      Ocean Front Villas
                    </h2>
                    <p className="text-[#E0D2B5] text-[16px] sm:text-[18px] md:text-[20px] font-semibold leading-[1.4] sm:leading-[1.5] font-quicksand villa-full-text">
                      Greet the sunrise over the sparkling Indian Ocean.
                    </p>
                    <p className="text-[#FFFFFF] text-[14px] sm:text-[16px] md:text-[18px] font-normal leading-[1.4] sm:leading-[1.5] font-quicksand villa-full-text">
                      Wake up to stunning sea views from your private balcony. Ideal for couples looking for a romantic escape.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-[18px] justify-center w-full sm:w-auto">
                      <button onClick={openModal} className="bg-[#655D4E] text-white px-[10px] py-[10px] rounded-[6px] text-[14px] sm:text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full sm:w-[160px] md:w-[180px] h-[38px] sm:h-[42px] flex items-center justify-center font-quicksand villa-full-button group/btn-full relative overflow-hidden">
                        <span className="relative z-10">Booking Enquiry</span>
                        <span className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn-full:translate-x-0 transition-transform duration-500"></span>
                      </button>
                      <Link href="/hotel" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[14px] sm:text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full sm:w-[160px] md:w-[180px] h-[38px] sm:h-[40px] flex items-center justify-center font-quicksand villa-full-button group/btn-full relative overflow-hidden">
                        <span className="relative z-10">Book Now</span>
                        <span className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn-full:translate-x-0 transition-transform duration-500"></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sultan Palace Hotel Villa */}
              <div ref={(el) => { sectionRefs.current[2] = el; }} className="flex flex-col gap-4 sm:gap-6 md:gap-[24px] lg:gap-[44px] w-full villa-section mx-2 sm:mx-4 md:mx-6 lg:mx-8 xl:mx-auto xl:max-w-[1620px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
                  <h2
                    ref={(el) => { headingRefs.current[2] = el; }}
                    className="text-[#423B2D] text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold leading-[1.2] sm:leading-[0.9] md:leading-[0.625] font-quicksand villa-heading"
                  >
                    Sultan Palace Hotel Villa
                  </h2>
                  <button onClick={openModal} className="bg-[#FF6A00] text-white px-4 py-2 rounded-[6px] text-[14px] sm:text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full sm:w-auto md:w-[208px] h-[38px] sm:h-[42px] flex items-center justify-center font-quicksand villa-button group/btn relative overflow-hidden md:mr-10 lg:mr-16">
                    <span className="relative z-10">Booking Enquiry</span>
                    <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                  </button>
                </div>

                <div className="flex flex-row items-start gap-2 sm:gap-3 md:gap-3 lg:gap-4 w-full h-auto md:h-[659px]">
                  <div ref={(el) => { imageRefs.current[3] = el; }} className="relative flex-1 h-[200px] sm:h-[250px] md:h-[260px] lg:h-[659px] flex-shrink-0 villa-side-image">
                    <Image
                      src="/villas/sultan-villa-1.png"
                      alt="Sultan Villa Interior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image-side:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-side:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div ref={(el) => { imageRefs.current[4] = el; }} className="relative flex-[1.6] h-auto md:h-[520px] lg:h-[659px] flex-shrink-0 villa-main-image flex flex-col">
                    <div className="relative w-full h-[140px] sm:h-[180px] md:h-[300px] lg:h-[384px] overflow-hidden flex-shrink-0">
                      <Image
                        src="/villas/sultan-villa-main.png"
                        alt="Sultan Villa Main"
                        fill
                        className="object-cover transition-transform duration-700 group-hover/image-main:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image-main:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 villa-shimmer opacity-0 group-hover/image-main:opacity-100"></div>
                    </div>
                    <div
                      ref={(el) => { textRefs.current[1] = el; }}
                      className="relative md:absolute md:bottom-0 md:left-[62px] w-full md:w-[489px] h-auto text-center villa-text bg-transparent px-3 sm:px-4 md:px-0 py-3 sm:py-4 md:pt-4 md:pb-0 flex-shrink-0 flex flex-col items-center justify-center mx-auto"
                    >
                      <p className="text-[#242424] text-[12px] sm:text-[14px] md:text-[18px] lg:text-[22px] font-semibold leading-[1.3] sm:leading-[1.4] md:leading-[1.5] lg:leading-[1.363636] font-quicksand mb-2 sm:mb-3 md:mb-4 lg:mb-6 text-center group-hover/image-main:text-[#FF6A00] transition-colors duration-500">
                        Indulge in luxury with exclusive beachside elegance
                      </p>
                      <p className="text-[#655D4E] text-[11px] sm:text-[13px] md:text-[16px] lg:text-[18px] font-medium leading-[1.4] sm:leading-[1.6] md:leading-[1.8] lg:leading-[1.944444] font-quicksand mb-2 sm:mb-3 md:mb-3 lg:mb-4 text-center">
                        Experience ultimate luxury in our two-bedroom Beach Villa, featuring exclusive amenities and direct beach access.
                      </p>
                      <Link href="/hotel" className="bg-[#FF6A00] text-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 rounded-[4px] sm:rounded-[6px] text-[11px] sm:text-[13px] md:text-[16px] lg:text-[18px] font-medium leading-[1.944444] w-full sm:w-auto md:w-[208px] h-[32px] sm:h-[36px] md:h-[36px] lg:h-[40px] flex items-center justify-center font-quicksand mx-auto villa-book-btn group/book relative overflow-hidden">
                        <span className="relative z-10">Book Now</span>
                        <span className="absolute inset-0 bg-white/30 scale-x-0 group-hover/book:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                      </Link>
                    </div>
                  </div>
                  <div ref={(el) => { imageRefs.current[5] = el; }} className="relative flex-1 h-[200px] sm:h-[250px] md:h-[260px] lg:h-[659px] flex-shrink-0 villa-side-image">
                    <Image
                      src="/villas/sultan-villa-2.png"
                      alt="Sultan Villa Exterior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image-side:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-side:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              </div>

              {/* Sultan's Villas */}
              <div ref={(el) => { sectionRefs.current[3] = el; }} className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[761px] overflow-hidden villa-full-section">
                <Image
                  src="/villas/sultans-villa-bg.png"
                  alt="Sultan's Villas Background"
                  fill
                  className="object-cover villa-bg-image"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
                <div className="absolute inset-0 flex items-center justify-center px-4">
                  <div className="text-center max-w-[568px] flex flex-col items-center gap-4 sm:gap-6 md:gap-[25px] villa-full-content">
                    <h2
                      ref={(el) => { headingRefs.current[3] = el; }}
                      className="text-[#FFFFFF] text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-semibold leading-[1.2] sm:leading-[0.625] font-quicksand villa-full-heading"
                    >
                      Sultan&apos;s Villas
                    </h2>
                    <p className="text-[#E0D2B5] text-[16px] sm:text-[18px] md:text-[20px] font-semibold leading-[1.4] sm:leading-[1.5] font-quicksand villa-full-text">
                      Regal comfort and exquisite design for a majestic stay.
                    </p>
                    <p className="text-[#FFFFFF] text-[14px] sm:text-[16px] md:text-[18px] font-normal leading-[1.4] sm:leading-[1.5] font-quicksand villa-full-text">
                      Spacious two-bedroom villas with elegant Swahili-inspired interiors, private plunge pools, and personalized services for a regal stay.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-[18px] justify-center w-full sm:w-auto">
                      <button onClick={openModal} className="bg-[#655D4E] text-white px-[10px] py-[10px] rounded-[6px] text-[14px] sm:text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full sm:w-[160px] md:w-[180px] h-[38px] sm:h-[42px] flex items-center justify-center font-quicksand villa-full-button group/btn-full relative overflow-hidden">
                        <span className="relative z-10">Booking Enquiry</span>
                        <span className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn-full:translate-x-0 transition-transform duration-500"></span>
                      </button>
                      <Link href="/hotel" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[14px] sm:text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full sm:w-[160px] md:w-[180px] h-[38px] sm:h-[40px] flex items-center justify-center font-quicksand villa-full-button group/btn-full relative overflow-hidden">
                        <span className="relative z-10">Book Now</span>
                        <span className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn-full:translate-x-0 transition-transform duration-500"></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* One-Bedroom Retreats */}
              <div ref={(el) => { sectionRefs.current[4] = el; }} className="flex flex-col gap-4 sm:gap-6 md:gap-[24px] lg:gap-[44px] w-full villa-section mx-2 sm:mx-4 md:mx-6 lg:mx-8 xl:mx-auto xl:max-w-[1620px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-3 sm:gap-4">
                  <h2
                    ref={(el) => { headingRefs.current[4] = el; }}
                    className="text-[#423B2D] text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold leading-[1.2] sm:leading-[0.9] md:leading-[0.625] font-quicksand villa-heading"
                  >
                    One-Bedroom Retreats
                  </h2>
                  <button onClick={openModal} className="bg-[#FF6A00] text-white px-4 py-2 rounded-[6px] text-[14px] sm:text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full sm:w-auto md:w-[208px] h-[38px] sm:h-[42px] flex items-center justify-center font-quicksand villa-button group/btn relative overflow-hidden md:mr-10 lg:mr-16">
                    <span className="relative z-10">Booking Enquiry</span>
                    <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                  </button>
                </div>

                <div className="relative flex flex-row items-start gap-2 sm:gap-3 md:gap-3 lg:gap-4 w-full h-auto md:h-[659px]">
                  <div ref={(el) => { imageRefs.current[6] = el; }} className="relative flex-[1.6] h-auto md:h-[520px] lg:h-[659px] flex-shrink-0 villa-main-image flex flex-col">
                    <div className="relative w-full h-[140px] sm:h-[180px] md:h-[300px] lg:h-[384px] overflow-hidden flex-shrink-0">
                      <Image
                        src="/villas/one-bedroom-main.png"
                        alt="One-Bedroom Retreat"
                        fill
                        className="object-cover transition-transform duration-700 group-hover/image-main:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image-main:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 villa-shimmer opacity-0 group-hover/image-main:opacity-100"></div>
                    </div>
                    <div
                      ref={(el) => { textRefs.current[2] = el; }}
                      className="relative md:absolute md:bottom-0 md:left-[62px] w-full md:w-[489px] h-auto text-center villa-text bg-transparent px-3 sm:px-4 md:px-0 py-3 sm:py-4 md:pt-4 md:pb-0 flex-shrink-0 flex flex-col items-center justify-center mx-auto"
                    >
                      <p className="text-[#242424] text-[12px] sm:text-[14px] md:text-[18px] lg:text-[22px] font-semibold leading-[1.3] sm:leading-[1.4] md:leading-[1.5] lg:leading-[1.363636] font-quicksand mb-2 sm:mb-3 md:mb-4 lg:mb-6 text-center group-hover/image-main:text-[#FF6A00] transition-colors duration-500">
                        Intimate spaces crafted for privacy and relaxation.
                      </p>
                      <p className="text-[#655D4E] text-[11px] sm:text-[13px] md:text-[16px] lg:text-[18px] font-medium leading-[1.4] sm:leading-[1.6] md:leading-[1.8] lg:leading-[1.944444] font-quicksand mb-2 sm:mb-3 md:mb-3 lg:mb-4 text-center">
                        Charming one-bedroom villas designed for intimate stays, blending modern comfort with traditional Zanzibar architecture.
                      </p>
                      <Link href="/hotel" className="bg-[#FF6A00] text-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 rounded-[4px] sm:rounded-[6px] text-[11px] sm:text-[13px] md:text-[16px] lg:text-[18px] font-medium leading-[1.944444] w-full sm:w-auto md:w-[208px] h-[32px] sm:h-[36px] md:h-[36px] lg:h-[40px] flex items-center justify-center font-quicksand mx-auto villa-book-btn group/book relative overflow-hidden">
                        <span className="relative z-10">Book Now</span>
                        <span className="absolute inset-0 bg-white/30 scale-x-0 group-hover/book:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                      </Link>
                    </div>
                  </div>
                  <div ref={(el) => { imageRefs.current[7] = el; }} className="relative flex-1 h-[200px] sm:h-[250px] md:h-[260px] lg:h-[659px] flex-shrink-0 villa-side-image">
                    <Image
                      src="/villas/one-bedroom-1.png"
                      alt="One-Bedroom Interior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image-side:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-side:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div ref={(el) => { imageRefs.current[8] = el; }} className="relative flex-1 h-[200px] sm:h-[250px] md:h-[260px] lg:h-[659px] flex-shrink-0 villa-side-image">
                    <Image
                      src="/villas/one-bedroom-2.png"
                      alt="One-Bedroom Exterior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image-side:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-side:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

