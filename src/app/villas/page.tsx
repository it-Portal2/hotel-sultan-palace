"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect, useRef, useState } from "react";
import { useBookingEnquiry } from "@/context/BookingEnquiryContext";

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
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans w-full max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative w-full h-[680px] md:h-[800px] lg:h-[951px] overflow-hidden">
          <Image
            src="/villas/hero-bg.png"
            alt="Villas Hero Background"
            fill
            priority
            className="object-cover"
          />
          
          <div ref={heroRef} className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div className="text-center max-w-[627px]">
              <h1 className={`text-[#FFFFFF] text-3xl md:text-4xl lg:text-[48px] font-semibold leading-[0.520833] mb-10 drop-shadow-[0px_4px_26.1px_rgba(0,0,0,1)] font-quicksand hero-title ${isVisible ? 'hero-title-visible' : ''}`}>
                <span className="inline-block hero-word" style={{ animationDelay: '0.1s' }}>Our</span>{' '}
                <span className="inline-block hero-word" style={{ animationDelay: '0.3s' }}>Signature</span>{' '}
                <span className="inline-block hero-word" style={{ animationDelay: '0.5s' }}>Villas</span>
              </h1>
              <p className={`text-[#FFFFFF] text-[18px] font-semibold leading-[1.388888] drop-shadow-[0px_4px_18.8px_rgba(0,0,0,0.25)] font-quicksand hero-description ${isVisible ? 'hero-description-visible' : ''}`}>
                Discover refined elegance and tropical comfort in our luxurious villas, where timeless design meets oceanfront tranquility.
              </p>
            </div>
          </div>
        </section>
 
        {/* Villas Section */}
        <section className="py-16 md:py-24 bg-[#FFFCF6]">
          <div className="w-full max-w-[1596px] mx-auto px-0 md:px-1 lg:px-2 xl:px-4 2xl:px-2">
            <div className="flex flex-col gap-[68px]">
              
              {/* Garden View Villas */}
              <div ref={(el) => { sectionRefs.current[0] = el; }} className="flex flex-col gap-[24px] md:gap-[44px] w-full villa-section">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
                  <h2 
                    ref={(el) => { headingRefs.current[0] = el; }}
                    className="text-[#423B2D] text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-semibold leading-[0.9] md:leading-[0.625] font-quicksand villa-heading"
                  >
                    Garden View Villas
                  </h2>
                  <button onClick={openModal} className="bg-[#FF6A00] text-white px-4 py-2 rounded-[6px] text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full md:w-[208px] h-[42px] flex items-center justify-center font-quicksand villa-button group/btn relative overflow-hidden">
                    <span className="relative z-10">Booking Enquiry</span>
                    <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-[12px] md:gap-4 lg:gap-[20px] w-full h-auto md:h-[659px]">
                  <div ref={(el) => { imageRefs.current[0] = el; }} className="relative w-full md:w-[45%] lg:w-[500px] xl:w-[614px] h-[520px] md:h-[659px] flex-shrink-0 villa-main-image">
                    <div className="relative w-full h-[300px] md:h-[384px] overflow-hidden">
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
                      className="md:absolute md:bottom-0 md:left-[62px] w-full md:w-[489px] h-auto text-center villa-text px-4 md:px-0 pt-4"
                    >
                      <p className="text-[#242424] text-[18px] md:text-[22px] font-semibold leading-[1.5] md:leading-[1.363636] font-quicksand mb-4 group-hover/image-main:text-[#FF6A00] transition-colors duration-500">
                         Serenity and greenery just steps from your private villa.
                       </p>
                      <p className="text-[#655D4E] text-[16px] md:text-[18px] font-medium leading-[1.8] md:leading-[1.944444] font-quicksand mb-4">
                         Relax in beautifully designed two-bedroom villas overlooking lush tropical gardens. Perfect for families or friends seeking tranquility.
                       </p>
                      <Link href="/rooms" className="bg-[#FF6A00] text-white px-4 py-2 rounded-[6px] text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full md:w-[208px] h-[40px] flex items-center justify-center font-quicksand mx-auto villa-book-btn group/book">
                         <span className="relative z-10">Book Now</span>
                         <span className="absolute inset-0 bg-white/30 scale-x-0 group-hover/book:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                       </Link>
                     </div>
                  </div>
                  <div ref={(el) => { imageRefs.current[1] = el; }} className="relative w-full md:w-[27%] lg:w-[300px] xl:w-[365px] h-[260px] md:h-[659px] flex-shrink-0 hidden md:block villa-side-image">
                    <Image
                      src="/villas/garden-villa-1.png"
                      alt="Garden Villa Interior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image-side:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-side:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div ref={(el) => { imageRefs.current[2] = el; }} className="relative w-full md:w-[27%] lg:w-[300px] xl:w-[365px] h-[260px] md:h-[659px] flex-shrink-0 hidden md:block villa-side-image">
                    <Image
                      src="/villas/garden-villa-2.png"
                      alt="Garden Villa Exterior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image-side:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-side:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              </div>

              {/* Ocean Front Villas */}
              <div ref={(el) => { sectionRefs.current[1] = el; }} className="relative w-full h-[761px] overflow-hidden villa-full-section">
                <Image
                  src="/villas/ocean-front-bg.png"
                  alt="Ocean Front Villas Background"
                  fill
                  className="object-cover villa-bg-image"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-[568px] flex flex-col items-center gap-[25px] villa-full-content">
                     <h2 
                       ref={(el) => { headingRefs.current[1] = el; }}
                       className="text-[#FFFFFF] text-[40px] font-semibold leading-[0.625] font-quicksand villa-full-heading"
                     >
                       Ocean Front Villas
                     </h2>
                    <p className="text-[#E0D2B5] text-[20px] font-semibold leading-[1.5] font-quicksand villa-full-text">
                      Greet the sunrise over the sparkling Indian Ocean.
                    </p>
                    <p className="text-[#FFFFFF] text-[18px] font-normal leading-[1.5] font-quicksand villa-full-text">
                      Wake up to stunning sea views from your private terrace. Ideal for couples looking for a romantic escape.
                    </p>
                    <div className="flex gap-[18px] justify-center">
                      <button onClick={openModal} className="bg-[#655D4E] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium leading-[1.944444] w-[180px] h-[42px] flex items-center justify-center font-quicksand villa-full-button group/btn-full relative overflow-hidden">
                        <span className="relative z-10">Booking Enquiry</span>
                        <span className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn-full:translate-x-0 transition-transform duration-500"></span>
                      </button>
                      <Link href="/rooms" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium leading-[1.944444] w-[180px] h-[40px] flex items-center justify-center font-quicksand villa-full-button group/btn-full relative overflow-hidden">
                        <span className="relative z-10">Book Now</span>
                        <span className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn-full:translate-x-0 transition-transform duration-500"></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sultan Place Hotel Villa */}
              <div ref={(el) => { sectionRefs.current[2] = el; }} className="flex flex-col gap-[24px] md:gap-[44px] w-full villa-section">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
                  <h2 
                    ref={(el) => { headingRefs.current[2] = el; }}
                    className="text-[#423B2D] text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-semibold leading-[0.9] md:leading-[0.625] font-quicksand villa-heading"
                  >
                    Sultan Place Hotel Villa
                  </h2>
                  <button onClick={openModal} className="bg-[#FF6A00] text-white px-4 py-2 rounded-[6px] text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full md:w-[208px] h-[42px] flex items-center justify-center font-quicksand villa-button group/btn relative overflow-hidden">
                    <span className="relative z-10">Booking Enquiry</span>
                    <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-[12px] md:gap-4 lg:gap-[20px] w-full h-auto md:h-[659px]">
                  <div ref={(el) => { imageRefs.current[3] = el; }} className="relative w-full md:w-[27%] lg:w-[300px] xl:w-[365px] h-[260px] md:h-[659px] flex-shrink-0 villa-side-image">
                    <Image
                      src="/villas/sultan-villa-1.png"
                      alt="Sultan Villa Interior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image-side:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-side:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div ref={(el) => { imageRefs.current[4] = el; }} className="relative w-full md:w-[45%] lg:w-[500px] xl:w-[614px] h-[520px] md:h-[659px] flex-shrink-0 villa-main-image">
                    <div className="relative w-full h-[300px] md:h-[384px] overflow-hidden">
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
                      className="md:absolute md:bottom-0 md:left-[62px] w-full md:w-[489px] h-auto text-center villa-text px-4 md:px-0 pt-4"
                    >
                      <p className="text-[#242424] text-[18px] md:text-[22px] font-semibold leading-[1.5] md:leading-[1.363636] font-quicksand mb-6 group-hover/image-main:text-[#FF6A00] transition-colors duration-500">
                         Indulge in luxury with exclusive beachside elegance
                       </p>
                      <p className="text-[#655D4E] text-[16px] md:text-[18px] font-medium leading-[1.8] md:leading-[1.944444] font-quicksand mb-4">
                         Experience ultimate luxury in our two-bedroom Beach Villa, featuring exclusive amenities and direct beach access.
                       </p>
                        <Link href="/rooms" className="bg-[#FF6A00] text-white px-4 py-2 rounded-[6px] text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full md:w-[208px] h-[40px] flex items-center justify-center font-quicksand mx-auto villa-book-btn group/book relative overflow-hidden">
                         <span className="relative z-10">Book Now</span>
                         <span className="absolute inset-0 bg-white/30 scale-x-0 group-hover/book:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                       </Link>
                     </div>
                  </div>
                  <div ref={(el) => { imageRefs.current[5] = el; }} className="relative w-full md:w-[27%] lg:w-[300px] xl:w-[365px] h-[260px] md:h-[659px] flex-shrink-0 hidden md:block villa-side-image">
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
              <div ref={(el) => { sectionRefs.current[3] = el; }} className="relative w-full h-[761px] overflow-hidden villa-full-section">
                <Image
                  src="/villas/sultans-villa-bg.png"
                  alt="Sultan's Villas Background"
                  fill
                  className="object-cover villa-bg-image"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-[568px] flex flex-col items-center gap-[25px] villa-full-content">
                     <h2 
                       ref={(el) => { headingRefs.current[3] = el; }}
                       className="text-[#FFFFFF] text-[40px] font-semibold leading-[0.625] font-quicksand villa-full-heading"
                      >
                       Sultan&apos;s Villas
                     </h2>
                    <p className="text-[#E0D2B5] text-[20px] font-semibold leading-[1.5] font-quicksand villa-full-text">
                      Regal comfort and exquisite design for a majestic stay.
                    </p>
                    <p className="text-[#FFFFFF] text-[18px] font-normal leading-[1.5] font-quicksand villa-full-text">
                      Spacious two-bedroom villas with elegant Swahili-inspired interiors, private plunge pools, and personalized services for a regal stay.
                    </p>
                    <div className="flex gap-[18px] justify-center">
                      <button onClick={openModal} className="bg-[#655D4E] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium leading-[1.944444] w-[180px] h-[42px] flex items-center justify-center font-quicksand villa-full-button group/btn-full relative overflow-hidden">
                        <span className="relative z-10">Booking Enquiry</span>
                        <span className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn-full:translate-x-0 transition-transform duration-500"></span>
                      </button>
                      <Link href="/rooms" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium leading-[1.944444] w-[180px] h-[40px] flex items-center justify-center font-quicksand villa-full-button group/btn-full relative overflow-hidden">
                        <span className="relative z-10">Book Now</span>
                        <span className="absolute inset-0 bg-white/20 translate-x-full group-hover/btn-full:translate-x-0 transition-transform duration-500"></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* One-Bedroom Retreats */}
              <div ref={(el) => { sectionRefs.current[4] = el; }} className="flex flex-col gap-[24px] md:gap-[44px] w-full villa-section">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
                  <h2 
                    ref={(el) => { headingRefs.current[4] = el; }}
                    className="text-[#423B2D] text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-semibold leading-[0.9] md:leading-[0.625] font-quicksand villa-heading"
                  >
                    One-Bedroom Retreats
                  </h2>
                  <button onClick={openModal} className="bg-[#FF6A00] text-white px-4 py-2 rounded-[6px] text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full md:w-[208px] h-[42px] flex items-center justify-center font-quicksand villa-button group/btn relative overflow-hidden">
                    <span className="relative z-10">Booking Enquiry</span>
                    <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                  </button>
                </div>
                
                  <div className="relative flex flex-col md:flex-row items-stretch md:items-center gap-[12px] md:gap-4 lg:gap-[20px] w-full h-auto md:h-[659px]">
                  <div ref={(el) => { imageRefs.current[6] = el; }} className="relative w-full md:w-[45%] lg:w-[500px] xl:w-[614px] h-[520px] md:h-[659px] flex-shrink-0 villa-main-image">
                    <div className="relative w-full h-[300px] md:h-[384px] overflow-hidden">
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
                      className="md:absolute md:bottom-0 md:left-[62px] w-full md:w-[489px] h-auto text-center villa-text px-4 md:px-0 pt-4"
                    >
                      <p className="text-[#242424] text-[18px] md:text-[22px] font-semibold leading-[1.5] md:leading-[1.363636] font-quicksand mb-6 group-hover/image-main:text-[#FF6A00] transition-colors duration-500">
                        Intimate spaces crafted for privacy and relaxation.
                      </p>
                      <p className="text-[#655D4E] text-[16px] md:text-[18px] font-medium leading-[1.8] md:leading-[1.944444] font-quicksand mb-4">
                        Charming one-bedroom villas designed for intimate stays, blending modern comfort with traditional Zanzibar architecture.
                      </p>
                        <Link href="#" className="bg-[#FF6A00] text-white px-4 py-2 rounded-[6px] text-[16px] md:text-[18px] font-medium leading-[1.944444] w-full md:w-[208px] h-[40px] flex items-center justify-center font-quicksand mx-auto villa-book-btn group/book relative overflow-hidden">
                        <span className="relative z-10">Book Now</span>
                        <span className="absolute inset-0 bg-white/30 scale-x-0 group-hover/book:scale-x-100 transition-transform duration-500 origin-left rounded-[6px]"></span>
                      </Link>
                    </div>
                  </div>
                  <div ref={(el) => { imageRefs.current[7] = el; }} className="relative w-full md:w-[27%] lg:w-[300px] xl:w-[365px] h-[260px] md:h-[659px] flex-shrink-0 hidden md:block villa-side-image">
                    <Image
                      src="/villas/one-bedroom-1.png"
                      alt="One-Bedroom Interior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image-side:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image-side:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div ref={(el) => { imageRefs.current[8] = el; }} className="relative w-full md:w-[27%] lg:w-[300px] xl:w-[365px] h-[260px] md:h-[659px] flex-shrink-0 hidden md:block villa-side-image">
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
      <Footer />

      <style jsx global>{`
        /* Hero Section Animations */
        .hero-title {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out;
        }
        .hero-title-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(30px) rotateX(90deg);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hero-title-visible .hero-word {
          opacity: 1;
          transform: translateY(0) rotateX(0deg);
        }
        .hero-description {
          opacity: 0;
          transform: translateY(40px) scale(0.9);
          transition: all 1s ease-out 0.6s;
        }
        .hero-description-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* Villa Section Animations */
        .villa-section {
          opacity: 0;
          transform: translateY(60px);
          transition: all 1s ease-out;
        }
        .section-visible .villa-section,
        .villa-section.section-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .villa-heading {
          opacity: 0;
          transform: translateX(-50px) rotate(-5deg);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s;
        }
        .section-visible .villa-heading,
        .villa-heading.section-visible {
          opacity: 1;
          transform: translateX(0) rotate(0deg);
        }
        .villa-button {
          opacity: 0;
          transform: translateX(50px) scale(0.9);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s;
        }
        .section-visible .villa-button,
        .villa-button.section-visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .villa-button:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 40px rgba(255, 106, 0, 0.4);
        }

        /* Image Animations */
        .villa-main-image {
          opacity: 0;
          transform: translateX(-100px) scale(0.85);
          transition: all 1s ease-out 0.4s;
        }
        .section-visible .villa-main-image,
        .villa-main-image.section-visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .villa-side-image {
          opacity: 0;
          transform: translateY(80px) scale(0.8);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        /* Ensure all side images are visible when parent section is visible */
        .villa-section.section-visible .villa-side-image,
        .section-visible .villa-section .villa-side-image,
        .villa-side-image.section-visible {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }
        /* Garden View Villas - side images */
        .villa-section:nth-of-type(1).section-visible .villa-side-image:nth-child(2),
        .villa-section:nth-of-type(1).section-visible .villa-side-image:nth-child(3) {
          transition-delay: 0.6s;
        }
        /* Sultan Place Hotel Villa - left and right images */
        .villa-section:nth-of-type(3).section-visible .villa-side-image:nth-child(1) {
          transition-delay: 0.4s;
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }
        .villa-section:nth-of-type(3).section-visible .villa-side-image:nth-child(3) {
          transition-delay: 0.8s;
        }
        /* One-Bedroom Retreats - side images */
        .villa-section:nth-of-type(5).section-visible .villa-side-image:nth-child(2),
        .villa-section:nth-of-type(5).section-visible .villa-side-image:nth-child(3) {
          transition-delay: 0.6s;
        }

        /* Text Animations */
        .villa-text {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out 0.6s;
        }
        .section-visible .villa-text,
        .villa-text.section-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .villa-book-btn {
          opacity: 0;
          transform: translateY(30px) scale(0.9);
          transition: all 0.8s ease-out 0.8s;
        }
        .section-visible .villa-book-btn,
        .villa-book-btn.section-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .villa-book-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 30px rgba(255, 106, 0, 0.5);
        }

        /* Shimmer Effect */
        .villa-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: villaShimmer 3s ease-in-out infinite;
        }
        @keyframes villaShimmer {
          0%, 100% {
            background-position: -200% 0;
          }
          50% {
            background-position: 200% 0;
          }
        }

        /* Full-Width Section Animations */
        .villa-full-section {
          opacity: 0;
          transform: scale(1.05);
          transition: all 1.2s ease-out;
        }
        .section-visible .villa-full-section,
        .villa-full-section.section-visible {
          opacity: 1;
          transform: scale(1);
        }
        .villa-bg-image {
          transition: transform 20s ease-out;
        }
        .section-visible .villa-bg-image,
        .villa-bg-image.section-visible {
          transform: scale(1.1);
        }
        .villa-full-content {
          opacity: 0;
          transform: translateY(80px) scale(0.9);
          transition: all 1s ease-out 0.3s;
        }
        .section-visible .villa-full-content,
        .villa-full-content.section-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .villa-full-heading {
          opacity: 0;
          transform: translateY(50px) rotateX(15deg);
          transition: all 1s ease-out 0.5s;
        }
        .section-visible .villa-full-heading,
        .villa-full-heading.section-visible {
          opacity: 1;
          transform: translateY(0) rotateX(0deg);
        }
        .villa-full-text {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s ease-out;
        }
        .section-visible .villa-full-text:nth-child(2),
        .villa-full-text.section-visible:nth-child(2) {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.7s;
        }
        .section-visible .villa-full-text:nth-child(3),
        .villa-full-text.section-visible:nth-child(3) {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.9s;
        }
        .villa-full-button {
          opacity: 0;
          transform: translateY(30px) scale(0.9);
          transition: all 0.8s ease-out;
        }
        .section-visible .villa-full-button:nth-child(1),
        .villa-full-button.section-visible:nth-child(1) {
          opacity: 1;
          transform: translateY(0) scale(1);
          transition-delay: 1.1s;
        }
        .section-visible .villa-full-button:nth-child(2),
        .villa-full-button.section-visible:nth-child(2) {
          opacity: 1;
          transform: translateY(0) scale(1);
          transition-delay: 1.3s;
        }
        .villa-full-button:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 40px rgba(255, 106, 0, 0.5);
        }
      `}</style>
    </>
  );
}
