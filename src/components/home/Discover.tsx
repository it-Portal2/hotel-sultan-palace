"use client";
import Image from "next/image";
import BookNowButton from "../ui/BookNowButton";
import { useEffect, useRef, useState } from "react";

export default function Discover() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('discover-visible');
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
    <section ref={sectionRef} className="w-full bg-[#F5D9A5] font-inter discover-section">
      <div className="flex flex-col lg:grid lg:grid-cols-12">
        
      
        <div className={`group w-full relative overflow-hidden flex-shrink-0 h-[400px] md:h-[709px] lg:col-span-5 discover-image ${isVisible ? 'discover-image-visible' : ''}`}>
          <Image
            layout="fill"
            src="/image1.png"
            alt="A few things to note at Sultan Palace"
            className="w-full h-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-110 active:scale-110"
          />
        </div>

       
        <div className="w-full lg:col-span-7 flex items-center px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-[82px] py-8 md:py-12 lg:py-[148px]">
          <div className="flex flex-col gap-4 md:gap-[20px] max-w-full lg:max-w-[600px] xl:max-w-[682px]">
            <p className={`font-[Shadows_Into_Light_Two] text-[28px] md:text-[34px] leading-[1.451] text-[#783A0C] discover-label ${isVisible ? 'discover-label-visible' : ''}`}>
              Discover Our Paradise
            </p>

            <h2 className={`text-[28px] md:text-[36px] lg:text-[38px] xl:text-[40px] font-medium font-quicksand leading-[1.25] text-[#242F3C] max-w-full lg:max-w-[580px] xl:max-w-[661px] discover-title ${isVisible ? 'discover-title-visible' : ''}`}>
              Endless Discoveries, Unforgettable Memories
            </h2>

            <p className={`text-[16px] md:text-[18px] font-medium font-quicksand leading-[1.556] text-[#5E5E5E] max-w-full lg:max-w-[580px] xl:max-w-[663px] discover-text ${isVisible ? 'discover-text-visible' : ''}`}>
              Wake up to ocean whispers, walk barefoot on white sands, and let
              the rhythm of Zanzibar slow your world down. Sultan Palace Hotel
              isn&apos;t just a destination — it&apos;s a feeling.
            </p>

            <div className={`mt-6 md:mt-[40px] discover-button ${isVisible ? 'discover-button-visible' : ''}`}>
              <BookNowButton
                size="sm"
                className="px-6 md:px-[53px] py-3 md:py-[14px] rounded-[9px] text-[14px] md:text-[16px] h-auto md:h-[49px] w-fit"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}