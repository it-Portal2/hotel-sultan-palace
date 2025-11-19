"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function InRoomFacilities() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('inroom-visible');
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <section ref={sectionRef} className="w-full bg-[#F4F4F5] relative overflow-visible inroom-section" style={{ minHeight: '880px' }}>
      {/* Mobile Layout */}
      <div className="lg:hidden p-4 md:p-8">
        <div className="flex flex-col gap-6 md:gap-8">
          <div>
            <h2 className="font-[Kaisei_Decol] font-bold text-[40px] md:text-[50px] leading-[1.448] text-[#202C3B] mb-4">
              In-Room Facilities
            </h2>
            <p className="font-[Kaisei_Decol] font-normal text-[24px] md:text-[28px] leading-[1.448] text-[#242424]">
              Experience Comfort and Elegance in Your Room
            </p>
          </div>

          <div className="relative w-full h-[400px] md:h-[500px]">
            <Image 
              src="/figma/inroom.png" 
              alt="Luxury hotel room bathroom" 
              fill 
              className="object-cover"
              sizes="100vw"
            />
          </div>

          <div className="flex flex-col gap-4">
            {/* Refreshments & Snacks Card */}
            <div className="bg-white rounded-[1px] p-4 md:p-6 border border-gray-200 transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:-translate-x-2 cursor-pointer">
              <h3 className="font-[Kaisei_Decol] font-bold text-[18px] md:text-[20px] leading-[1.448] text-black mb-3 md:mb-4">
                Refreshments & Snacks
              </h3>
              <p className="font-[Kaisei_Decol] font-bold text-[14px] md:text-[16px] leading-[1.448] text-black whitespace-pre-line">
                Tea/Coffee Maker{'\n'}Mini Bar
              </p>
            </div>

            {/* Entertainment & Safety Card */}
            <div className="bg-[#655D4E] rounded-[1px] p-4 md:p-6 transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
              <h3 className="font-[Kaisei_Decol] font-bold text-[18px] md:text-[20px] leading-[1.448] text-white mb-3 md:mb-4">
                Entertainment & Safety
              </h3>
              <p className="font-[Kaisei_Decol] font-bold text-[14px] md:text-[16px] leading-[1.448] text-white whitespace-pre-line">
                LCD TV{'\n'}Safety Locker
              </p>
            </div>

            {/* Comfort & Relaxation Card */}
            <div className="bg-[#242424] rounded-[1px] p-4 md:p-6 transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:translate-y-2 cursor-pointer">
              <h3 className="font-[Kaisei_Decol] font-bold text-[18px] md:text-[20px] leading-[1.448] text-white mb-3 md:mb-4">
                Comfort & Relaxation
              </h3>
              <p className="font-[Kaisei_Decol] font-bold text-[14px] md:text-[16px] leading-[1.448] text-white whitespace-pre-line">
                Bathrobes{'\n'}Slippers{'\n'}Separate Sea View Balcony with Swing and Cots (available in Ocean and Imperial Rooms)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Exact Figma Design */}
      <div className="hidden lg:block w-full relative">
        {/* Left Image - Starts from left screen edge, optimized for 16-inch */}
        <div className="absolute" style={{ 
              left: 0,
              top: 'clamp(80px, 21.3%, 187px)',
              width: 'clamp(550px, 63%, 1100px)',
              height: 'clamp(380px, 78.5%, 691px)',
              zIndex: 1
            }}>
          <div className="relative w-full h-full">
            <Image 
              src="/figma/inroom.png" 
              alt="Luxury hotel room bathroom" 
              fill 
              className="object-cover"
              sizes="(max-width: 1280px) 550px, 1100px"
            />
          </div>
        </div>
        
        <div className="mx-auto w-full max-w-[1512px] px-0 py-0">
          <div className="relative w-full" style={{ minHeight: '880px', position: 'relative', width: '100%' }}>

            {/* Main Title - In-Room Facilities - Same line for 16-inch, shifted left */}
            <h2 className={`absolute font-[Kaisei_Decol] font-bold text-[42px] lg:text-[52px] xl:text-[60px] 2xl:text-[64px] leading-[1.448] text-[#202C3B] inroom-heading whitespace-nowrap ${isVisible ? 'inroom-heading-visible' : ''}`} style={{ 
              left: 'clamp(450px, 60%, 800px)',
              top: 'clamp(60px, 10%, 76px)',
              zIndex: 20
            }}>
              In-Room Facilities
            </h2>

            {/* Subtitle - Better spacing, no overlap */}
            <p className={`absolute font-[Kaisei_Decol] font-normal text-[22px] lg:text-[26px] xl:text-[30px] 2xl:text-[32px] leading-[1.448] text-[#242424] inroom-subheading ${isVisible ? 'inroom-subheading-visible' : ''}`} style={{ 
              left: 'clamp(450px, 60%, 800px)',
              top: 'clamp(160px, 27%, 206px)',
              width: 'clamp(290px, 36%, 619px)',
              zIndex: 20
            }}>
              Experience Comfort and Elegance in Your Room
            </p>

            {/* Refreshments & Snacks Card - Card 1: Shifted left on image for 16-inch */}
            <div className={`absolute bg-white rounded-[1px] p-6 lg:p-[21px] inroom-card cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:-translate-x-6 hover:z-30 ${isVisible ? 'inroom-card-visible' : ''}`} style={{ 
              left: 'clamp(450px, 60%, 800px)',
              top: 'clamp(280px, 48%, 395px)',
              width: 'clamp(200px, 18%, 600px)',
              height: 'clamp(115px, 16.1%, 142px)',
              zIndex: 20,
              transitionDelay: '0.5s'
            }}>
              <h3 className="font-[Kaisei_Decol] font-bold text-[18px] lg:text-[20px] leading-[1.448] text-black mb-3 lg:mb-4">
                Refreshments & Snacks
              </h3>
              <p className="font-[Kaisei_Decol] font-bold text-[14px] lg:text-[16px] leading-[1.448] text-black whitespace-pre-line">
                Tea/Coffee Maker{'\n'}Mini Bar
              </p>
            </div>

            {/* Entertainment & Safety Card - Card 2: Increased gap between cards */}
            <div className={`absolute bg-[#655D4E] rounded-[1px] p-6 lg:p-[21px] inroom-card cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:-translate-y-6 hover:z-30 ${isVisible ? 'inroom-card-visible' : ''}`} style={{ 
              left: 'clamp(750px, 77%, 1250px)',
              top: 'clamp(280px, 48%, 398px)',
              width: 'clamp(200px, 18%, 600px)',
              height: 'clamp(115px, 16.1%, 142px)',
              zIndex: 20,
              transitionDelay: '0.4s'
            }}>
              <h3 className="font-[Kaisei_Decol] font-bold text-[18px] lg:text-[20px] leading-[1.448] text-white mb-3 lg:mb-4">
                Entertainment & Safety
              </h3>
              <p className="font-[Kaisei_Decol] font-bold text-[14px] lg:text-[16px] leading-[1.448] text-white whitespace-pre-line">
                LCD TV{'\n'}Safety Locker
              </p>
            </div>

            {/* Comfort & Relaxation Card - Card 3: Moves bottom on hover, optimized for 16-inch */}
            <div className={`absolute bg-[#242424] rounded-[1px] p-6 lg:p-[21px] inroom-card cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:translate-y-6 hover:z-30 ${isVisible ? 'inroom-card-visible' : ''}`} style={{ 
              left: 'clamp(550px, 60%, 900px)',
              top: 'clamp(360px, 68.1%, 599px)',
              width: 'clamp(380px, 40%, 900px)',
              height: 'clamp(150px, 22.6%, 199px)',
              zIndex: 20,
              transitionDelay: '0.6s'
            }}>
              <h3 className="font-[Kaisei_Decol] font-bold text-[18px] lg:text-[20px] leading-[1.448] text-white mb-3 lg:mb-4">
                Comfort & Relaxation
              </h3>
              <p className="font-[Kaisei_Decol] font-bold text-[14px] lg:text-[16px] leading-[1.448] text-white whitespace-pre-line">
                Bathrobes{'\n'}Slippers{'\n'}Separate Sea View Balcony with Swing and Cots (available in Ocean and Imperial Rooms)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
