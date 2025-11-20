"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function FeaturedCalm() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('featured-visible');
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
    <section ref={sectionRef} className="w-full max-w-full relative overflow-hidden featured-section">
      <div className="w-full relative overflow-hidden min-h-[1079px]">
        <div className="grid grid-cols-12 gap-0">
          {/* Left side - Brown background */}
          <div className="col-span-5 xl:col-span-4 2xl:col-span-5 bg-[#C29A66] relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[-200px] lg:top-[-360px]">
              <div className="h-[400px] w-[400px] lg:h-[760px] lg:w-[760px] rounded-full border-[10px] lg:border-[20px] border-[rgba(190,140,83,0.46)] bg-transparent" />
            </div>
            <div className="pointer-events-none absolute left-[-150px] lg:left-[-200px] xl:left-[-345px] top-[150px] lg:top-[306px] overflow-hidden">
              <div className="h-[400px] w-[400px] lg:h-[700px] lg:w-[700px] xl:h-[970px] xl:w-[970px] rounded-full border-[6px] border-[rgba(255,255,255,0.1)] bg-transparent" />
            </div>
            
            {/* Main heading */}
            <div className="relative z-10 px-6 lg:px-8 xl:px-12 2xl:px-[155px] pt-16 lg:pt-24 xl:pt-[140px] pb-8">
              <h2 className="font-[Kaisei_Decol] text-[32px] sm:text-[40px] lg:text-[56px] xl:text-[64px] font-bold leading-[1.448] text-white max-w-full lg:max-w-[618px]">
                Where every moment finds its calm
              </h2>
            </div>

            {/* Bottom left image */}
            <div className={`relative w-full h-[400px] lg:h-[500px] xl:h-[555px] overflow-hidden featured-image-2 ${isVisible ? 'featured-image-2-visible' : ''}`}>
              <Image 
                src="/figma/featured-bottom.png" 
                alt="Resort garden with ocean view" 
                fill 
                sizes="(max-width: 1280px) 100vw, 40vw" 
                className="object-cover transition-transform duration-300 ease-in-out hover:scale-110 active:scale-110"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="col-span-7 xl:col-span-8 2xl:col-span-7 flex flex-col">
            {/* Top right image */}
            <div className={`relative w-full h-[400px] lg:h-[500px] xl:h-[524px] overflow-hidden featured-image-1 ${isVisible ? 'featured-image-1-visible' : ''}`}>
              <Image 
                src="/figma/featured-top.png" 
                alt="Beachfront resort balcony" 
                fill
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-110 active:scale-110"
                sizes="(max-width: 1280px) 100vw, 60vw"
              />
            </div>

            {/* Bottom right beige section */}
            <div className="bg-[#E8E4D9] flex-1 flex items-center justify-center px-6 lg:px-8 xl:px-12 2xl:px-20 py-12 lg:py-16 xl:py-20">
              {/* Bottom Right Text */}
              <div className="w-full max-w-[423px] text-center">
                <p className="font-[Kaisei_Decol] text-[14px] lg:text-[16px] font-medium leading-[1.448] text-[#666666] mb-8 lg:mb-12 xl:mb-[95px]">
                  No two travelers are alike — and neither are their stories.
                </p>
                <p className="font-[Kaisei_Decol] text-[32px] lg:text-[36px] xl:text-[40px] font-medium leading-[1.448] text-[#4C3916]">
                  Every stay reflects you — personalized, heartfelt, and intuitively crafted for perfection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}