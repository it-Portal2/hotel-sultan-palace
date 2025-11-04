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
    <section ref={sectionRef} className="w-full bg-[#F4F4F5] relative overflow-hidden inroom-section" style={{ minHeight: '880px' }}>
      {/* Mobile Layout */}
      <div className="lg:hidden p-4 md:p-8">
        <div className="flex flex-col gap-8">
          <h2 className="font-[Kaisei_Decol] font-bold text-[40px] md:text-[50px] leading-[1.448] text-[#202C3B]">
            In-Room Facilities
          </h2>
          <p className="font-[Kaisei_Decol] font-normal text-[24px] md:text-[28px] leading-[1.448] text-[#242424]">
            Experience Comfort and Elegance in Your Room
          </p>

          <div className="relative w-full h-[400px] md:h-[500px]">
            <Image 
              src="/figma/inroom.png" 
              alt="Luxury hotel room" 
              fill 
              className="object-cover"
              sizes="100vw"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#655D4E] rounded-[1px] p-4 md:p-6">
              <h3 className="font-[Kaisei_Decol] font-bold text-[20px] leading-[1.448] text-white mb-4">
                Entertainment & Safety
              </h3>
              <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-white whitespace-pre-line">
                LCD TV{'\n'}Safety Locker
              </p>
            </div>

            <div className="bg-white rounded-[1px] p-4 md:p-6">
              <h3 className="font-[Kaisei_Decol] font-bold text-[20px] leading-[1.448] text-black mb-4">
                Refreshments & Snacks
              </h3>
              <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-black whitespace-pre-line">
                Tea/Coffee Maker{'\n'}Mini Bar
              </p>
            </div>
          </div>

          <div className="bg-[#242424] rounded-[1px] p-4 md:p-6">
            <h3 className="font-[Kaisei_Decol] font-bold text-[20px] leading-[1.448] text-white mb-4">
              Comfort & Relaxation
            </h3>
            <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-white whitespace-pre-line">
              Bathrobes{'\n'}Slippers{'\n'}Separate Sea View Balcony with Swing and Cots (available in Ocean and Imperial Rooms)
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block w-full relative" style={{ height: '880px' }}>
        {/* Left Image */}
        <div className="absolute left-0 top-[187px] w-[1000px] h-[691px]">
          <Image 
            src="/figma/inroom.png" 
            alt="Luxury hotel room" 
            fill 
            className="object-cover"
            sizes="1000px"
          />
        </div>

        {/* Heading */}
        <h2 className={`absolute left-[779px] top-[76px] w-[576px] font-[Kaisei_Decol] font-bold text-[64px] leading-[1.448] text-[#202C3B] inroom-heading ${isVisible ? 'inroom-heading-visible' : ''}`}>
          In-Room Facilities
        </h2>

        {/* Subheading */}
        <p className={`absolute left-[779px] top-[206px] w-[619px] font-[Kaisei_Decol] font-normal text-[32px] leading-[1.448] text-[#242424] inroom-subheading ${isVisible ? 'inroom-subheading-visible' : ''}`}>
          Experience Comfort and Elegance in Your Room
        </p>

        {/* Entertainment & Safety Card */}
        <div className={`absolute left-[1090px] top-[398px] w-[281px] h-[142px] bg-[#655D4E] rounded-[1px] p-[21px] shadow-lg group cursor-pointer transition-transform duration-300 ease-in-out hover:-translate-y-6 inroom-card ${isVisible ? 'inroom-card-visible' : ''}`} style={{ transitionDelay: '0.4s' }}>
          <h3 className="font-[Kaisei_Decol] font-bold text-[20px] leading-[1.448] text-white mb-[25px]">
            Entertainment & Safety
          </h3>
          <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-white whitespace-pre-line">
            LCD TV{'\n'}Safety Locker
          </p>
        </div>

        {/* Refreshments & Snacks Card */}
        <div className={`absolute left-[779px] top-[395px] w-[281px] h-[142px] bg-white rounded-[1px] p-[21px] shadow-lg group cursor-pointer transition-transform duration-300 ease-in-out hover:-translate-x-6 inroom-card ${isVisible ? 'inroom-card-visible' : ''}`} style={{ transitionDelay: '0.5s' }}>
          <h3 className="font-[Kaisei_Decol] font-bold text-[20px] leading-[1.448] text-black mb-[25px]">
            Refreshments & Snacks
          </h3>
          <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-black whitespace-pre-line">
            Tea/Coffee Maker{'\n'}Mini Bar
          </p>
        </div>

        {/* Comfort & Relaxation Card */}
        <div className={`absolute left-[860px] top-[599px] w-[640px] h-[199px] bg-[#242424] rounded-[1px] p-[21px] shadow-lg group cursor-pointer transition-transform duration-300 ease-in-out hover:translate-y-6 inroom-card ${isVisible ? 'inroom-card-visible' : ''}`} style={{ transitionDelay: '0.6s' }}>
          <h3 className="font-[Kaisei_Decol] font-bold text-[20px] leading-[1.448] text-white mb-[19px]">
            Comfort & Relaxation
          </h3>
          <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-white whitespace-pre-line">
            Bathrobes{'\n'}Slippers{'\n'}Separate Sea View Balcony with Swing and Cots (available in Ocean and Imperial Rooms)
          </p>
        </div>
      </div>

      <style jsx global>{`
        .inroom-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out;
        }
        .inroom-section.inroom-visible,
        .inroom-visible .inroom-section {
          opacity: 1;
          transform: translateY(0);
        }
        .inroom-heading {
          opacity: 0;
          transform: translateX(50px);
          transition: all 1s ease-out 0.2s;
        }
        .inroom-heading-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .inroom-subheading {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out 0.4s;
        }
        .inroom-subheading-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .inroom-card {
          opacity: 0;
          transform: translateY(80px) scale(0.9);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .inroom-card-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>
    </section>
  );
}
