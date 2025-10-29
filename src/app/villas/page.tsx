"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect, useRef } from "react";

export default function VillasPage() {
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const headingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-in-bottom');
          entry.target.classList.remove('opacity-0');
          entry.target.classList.remove('translate-y-10');
        }
      });
    }, observerOptions);

    const textObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-in-left');
        }
      });
    }, observerOptions);

    // Observe headings
    headingRefs.current.forEach((ref) => {
      if (ref) headingObserver.observe(ref);
    });

    // Observe text elements
    textRefs.current.forEach((ref) => {
      if (ref) textObserver.observe(ref);
    });

    return () => {
      headingObserver.disconnect();
      textObserver.disconnect();
    };
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans">
        {/* Hero Section */}
        <section className="relative w-full h-[680px] md:h-[800px] lg:h-[951px] overflow-hidden">
          <Image
            src="/villas/hero-bg.png"
            alt="Villas Hero Background"
            fill
            priority
            className="object-cover"
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 mt-90">
            <div className="text-center max-w-[680px]">
              <h1 className="text-[#FFFFFF] text-3xl md:text-4xl lg:text-[48px] font-semibold leading-[0.56] tracking-[0.05em] mb-10 drop-shadow-[0px_4px_26.4px_rgba(0,0,0,0.69)] font-quicksand">
                Our Signature Villas
              </h1>
              <p className="text-[#FFFFFF] text-lg md:text-[22px] font-semibold leading-[1.35] tracking-[0.05em] drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)] font-quicksand">
                Discover refined elegance and tropical comfort in our luxurious villas, where timeless design meets oceanfront tranquility.
              </p>
            </div>
          </div>
        </section>
 
        {/* Villas Section */}
        <section className="py-16 md:py-24 bg-[#FFFCF6]">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col gap-[68px]">
              
              {/* Garden View Villas */}
              <div className="flex flex-col items-center gap-[44px]">
                <div className="flex justify-between items-center w-full max-w-[1393px]">
                  <h2 
                    ref={(el) => { headingRefs.current[0] = el; }}
                    className="text-[#423B2D] text-[40px] font-semibold leading-[0.625] font-quicksand opacity-0 translate-y-10 will-change-transform"
                  >
                    Garden View Villas
                  </h2>
                  <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[208px] h-[42px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity">
                    Booking Enquiry
                  </Link>
                </div>
                
                <div className="flex items-center gap-[20px] w-full max-w-[1384px] h-[659px]">
                  <div className="relative w-[614px] h-[659px]">
                    <div className="relative w-[614px] h-[384px] overflow-hidden">
                      <Image
                        src="/villas/garden-villa-main.png"
                        alt="Garden View Villa"
                        fill
                        className="object-cover"
                      />
                    </div>
                     <div 
                       ref={(el) => { textRefs.current[0] = el; }}
                       className="absolute bottom-0 left-[62px] w-[489px] h-[211px] text-center"
                     >
                       <p className="text-[#242424] text-[22px] font-semibold leading-[1.36] font-quicksand mb-4">
                         Serenity and greenery just steps from your private villa.
                       </p>
                       <p className="text-[#655D4E] text-[18px] font-medium leading-[1.94] font-quicksand mb-4">
                         Relax in beautifully designed two-bedroom villas overlooking lush tropical gardens. Perfect for families or friends seeking tranquility.
                       </p>
                       <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[208px] h-[40px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity mx-auto">
                         Book Now
                       </Link>
                     </div>
                  </div>
                  <div className="relative w-[365px] h-[659px] overflow-hidden">
                    <Image
                      src="/villas/garden-villa-1.png"
                      alt="Garden Villa Interior"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative w-[365px] h-[659px] overflow-hidden">
                    <Image
                      src="/villas/garden-villa-2.png"
                      alt="Garden Villa Exterior"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Ocean Front Villas */}
              <div className="relative w-full h-[761px] overflow-hidden">
                <Image
                  src="/villas/ocean-front-bg.png"
                  alt="Ocean Front Villas Background"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-[568px] mt-90">
                     <h2 
                       ref={(el) => { headingRefs.current[1] = el; }}
                       className="text-[#FFFFFF] text-[40px] font-semibold leading-[0.625] mb-[25px] font-quicksand opacity-0 translate-y-10 will-change-transform"
                     >
                       Ocean Front Villas
                     </h2>
                    <p className="text-[#E0D2B5] text-[20px] font-semibold leading-[1.5] mb-[25px] font-quicksand">
                      Greet the sunrise over the sparkling Indian Ocean.
                    </p>
                    <p className="text-[#FFFFFF] text-[18px] font-normal leading-[1.5] mb-[25px] font-quicksand">
                      Wake up to stunning sea views from your private terrace. Ideal for couples looking for a romantic escape.
                    </p>
                    <div className="flex gap-[18px] justify-center">
                      <Link href="/contact-us" className="bg-[#655D4E] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[180px] h-[42px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity">
                        Booking Enquiry
                      </Link>
                      <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[180px] h-[40px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity">
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sultan Place Hotel Villa */}
              <div className="flex flex-col items-center gap-[44px]">
                <div className="flex justify-between items-center w-full max-w-[1385px]">
                  <h2 
                    ref={(el) => { headingRefs.current[2] = el; }}
                    className="text-[#423B2D] text-[40px] font-semibold leading-[0.625] font-quicksand opacity-0 translate-y-10 will-change-transform"
                  >
                    Sultan Place Hotel Villa
                  </h2>
                  <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[208px] h-[42px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity">
                    Booking Enquiry
                  </Link>
                </div>
                
                <div className="flex items-center gap-[20px] w-full max-w-[1384px] h-[659px]">
                  <div className="relative w-[365px] h-[659px] overflow-hidden">
                    <Image
                      src="/villas/sultan-villa-1.png"
                      alt="Sultan Villa Interior"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative w-[614px] h-[659px]">
                    <div className="relative w-[614px] h-[384px] overflow-hidden">
                      <Image
                        src="/villas/sultan-villa-main.png"
                        alt="Sultan Villa Main"
                        fill
                        className="object-cover"
                      />
                    </div>
                     <div 
                       ref={(el) => { textRefs.current[1] = el; }}
                       className="absolute bottom-0 left-[62px] w-[489px] h-[211px] text-center"
                     >
                       <p className="text-[#242424] text-[22px] font-semibold leading-[1.36] font-quicksand mb-6">
                         Indulge in luxury with exclusive beachside elegance
                       </p>
                       <p className="text-[#655D4E] text-[18px] font-medium leading-[1.94] font-quicksand mb-4">
                         Experience ultimate luxury in our two-bedroom Beach Villa, featuring exclusive amenities and direct beach access.
                       </p>
                       <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[208px] h-[40px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity mx-auto">
                         Book Now
                       </Link>
                     </div>
                  </div>
                  <div className="relative w-[365px] h-[659px] overflow-hidden">
                    <Image
                      src="/villas/sultan-villa-2.png"
                      alt="Sultan Villa Exterior"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Sultan's Villas */}
              <div className="relative w-full h-[761px] overflow-hidden">
                <Image
                  src="/villas/sultans-villa-bg.png"
                  alt="Sultan's Villas Background"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-[568px] mt-90">
                     <h2 
                       ref={(el) => { headingRefs.current[3] = el; }}
                       className="text-[#FFFFFF] text-[40px] font-semibold leading-[0.625] mb-[25px] font-quicksand opacity-0 translate-y-10 will-change-transform"
                      >
                       Sultan&apos;s Villas
                     </h2>
                    <p className="text-[#E0D2B5] text-[20px] font-semibold leading-[1.5] mb-[25px] font-quicksand">
                      Regal comfort and exquisite design for a majestic stay.
                    </p>
                    <p className="text-[#FFFFFF] text-[18px] font-normal leading-[1.5] mb-[25px] font-quicksand">
                      Spacious two-bedroom villas with elegant Swahili-inspired interiors, private plunge pools, and personalized services for a regal stay.
                    </p>
                    <div className="flex gap-[18px] justify-center">
                      <Link href="/contact-us" className="bg-[#655D4E] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[180px] h-[42px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity">
                        Booking Enquiry
                      </Link>
                      <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[180px] h-[40px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity">
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* One-Bedroom Retreats */}
              <div className="flex flex-col items-center gap-[44px] relative">
                {/* Background Image for this section only */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/villas/bg.png"
                    alt="Background"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Linear Color Overlay for this section only */}
                <div 
                  className="absolute inset-0 z-10"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.49) 24%, rgba(255, 255, 255, 0) 42%, rgba(255, 255, 255, 0) 60%, rgba(255, 255, 255, 0) 70%, rgba(255, 255, 255, 1) 100%)'
                  }}
                ></div>
                <div className="relative z-20 flex justify-between items-center w-full max-w-[1385px]">
                  <h2 
                    ref={(el) => { headingRefs.current[4] = el; }}
                    className="text-[#423B2D] text-[40px] font-semibold leading-[0.625] font-quicksand opacity-0 translate-y-10 will-change-transform"
                  >
                    One-Bedroom Retreats
                  </h2>
                  <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[208px] h-[42px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity">
                    Booking Enquiry
                  </Link>
                </div>
                
                <div className="relative z-20 flex items-center gap-[20px] w-full max-w-[1384px] h-[659px]">
                  <div className="relative w-[614px] h-[659px]">
                    <div className="relative w-[614px] h-[384px] overflow-hidden">
                      <Image
                        src="/villas/one-bedroom-main.png"
                        alt="One-Bedroom Retreat"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div 
                      ref={(el) => { textRefs.current[2] = el; }}
                      className="absolute bottom-0 left-[62px] w-[489px] h-[211px] text-center"
                    >
                      <p className="text-[#242424] text-[22px] font-semibold leading-[1.36] font-quicksand mb-6">
                        Intimate spaces crafted for privacy and relaxation.
                      </p>
                      <p className="text-[#655D4E] text-[18px] font-medium leading-[1.94] font-quicksand mb-4">
                        Charming one-bedroom villas designed for intimate stays, blending modern comfort with traditional Zanzibar architecture.
                      </p>
                      <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium w-[208px] h-[40px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity mx-auto">
                        Book Now
                      </Link>
                    </div>
                  </div>
                  <div className="relative w-[365px] h-[659px] overflow-hidden">
                    <Image
                      src="/villas/one-bedroom-1.png"
                      alt="One-Bedroom Interior"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative w-[365px] h-[659px] overflow-hidden">
                    <Image
                      src="/villas/one-bedroom-2.png"
                      alt="One-Bedroom Exterior"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
