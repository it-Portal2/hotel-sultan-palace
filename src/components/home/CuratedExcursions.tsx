"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function CuratedExcursions() {
  const [showMap, setShowMap] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('curated-visible');
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
    <section ref={sectionRef} className="w-full bg-[linear-gradient(-2deg,_#F4F4F5_70%,_#FFFCF6_100%)] curated-section">
      <div className="mx-auto w-full max-w-[1512px] px-4 md:px-[30px] py-8 md:py-10 lg:py-20">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 md:gap-8 lg:gap-[241px] mb-8 md:mb-12 lg:mb-[113px]">
          <div className="flex flex-col">
            <p className={`text-[#BE8C53] font-quicksand font-medium text-[20px] md:text-[24px] leading-[1.25] mb-4 md:mb-[26px] curated-label ${isVisible ? 'curated-label-visible' : ''}`}>
              Curated Excursions
            </p>
            <h2 className={`text-[#202C3B] font-quicksand font-semibold text-[28px] md:text-[36px] lg:text-[44px] leading-[1.25] max-w-full lg:max-w-[499px] curated-heading ${isVisible ? 'curated-heading-visible' : ''}`}>
              Explore Zanzibar, The Island of Wonders
            </h2>
          </div>
          <div className="flex items-start">
            <p className={`text-[#5E5E5E] font-quicksand font-medium text-[16px] md:text-[18px] leading-[1.25] max-w-full lg:max-w-[631px] curated-text ${isVisible ? 'curated-text-visible' : ''}`}>
              Let us take you beyond the hotel. From Stone Town's historic alleys to spice farm adventures and sunset dhow cruises, our curated excursions reveal Zanzibar's soul. Every journey is arranged with care—just for you.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-4 lg:gap-0">
          
          <div className={`w-full lg:w-[650px] overflow-hidden flex-shrink-0 curated-image-left ${isVisible ? 'curated-image-left-visible' : ''}`}>
            <div className="relative w-full h-[300px] md:h-[400px] lg:h-[595px]">
              <Image
                src="/figma/curated-excursions-left.png"
                alt="Beautiful villa in Zanzibar"
                fill
                sizes="(max-width: 1024px) 100vw, 650px"
                className="object-cover transition-transform duration-500 ease-in-out hover:scale-140"
                priority
              />
            </div>
          </div>

          <div className={`w-full lg:flex-1 bg-[#202C3B] text-white p-6 md:p-8 lg:p-[81px] flex flex-col justify-start items-start relative min-h-[400px] lg:h-[595px] curated-dark-panel ${isVisible ? 'curated-dark-panel-visible' : ''}`}>
            
            <div className="flex flex-col items-start w-full mb-6 md:mb-[40px]">
              <div className="flex items-center gap-[8px] justify-center mb-6 md:mb-[49px]">
                <Image src="/figma/icon-location-mini.svg" alt="Location" width={19} height={19} />
                <span className="font-quicksand font-semibold text-[18px] md:text-[20px] leading-[1.25]">Location</span>
              </div>
              <span className="font-quicksand font-semibold text-[24px] md:text-[32px] leading-[1.25]">
                Dongwe, East Coast, Zanzibar
              </span>
            </div>

            <div className="w-full max-w-full lg:max-w-[467px] mb-4 md:mb-[20px] flex-shrink-0">
              <div className="relative w-full h-[200px] md:h-[282px] overflow-hidden rounded-lg">
                {!showMap ? (
                  <Image
                    src="/figma/curated-excursions-rect.png"
                    alt="Map preview of Dongwe"
                    fill
                    sizes="(max-width: 1024px) 90vw, 467px"
                    className="w-full h-full object-cover"
                    priority
                  />
                ) : (
                  <iframe
                    title="Map of Dongwe, East Coast, Zanzibar"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full border-0"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent("Dongwe, East Coast, Zanzibar")}&output=embed`}
                  />
                )}
              </div>
            </div>

            {!showMap && (
              <div className="mt-auto w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="inline-flex items-center gap-2 md:gap-[11px] bg-[#FF6A00] hover:bg-orange-600 transition-colors text-white px-4 md:px-[10px] py-3 md:py-[10px] rounded-[161px] font-quicksand font-semibold text-[16px] md:text-[20px] leading-[1.25]"
                >
                  <Image src="/figma/icon-location.svg" alt="Location Icon" width={20} height={20} className="md:w-6 md:h-6" />
                  Find in map
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <style jsx global>{`
        .curated-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out;
        }
        .curated-section.curated-visible,
        .curated-visible .curated-section {
          opacity: 1;
          transform: translateY(0);
        }
        .curated-label {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 0.8s ease-out 0.2s;
        }
        .curated-label-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .curated-heading {
          opacity: 0;
          transform: translateX(-50px);
          transition: all 1s ease-out 0.4s;
        }
        .curated-heading-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .curated-text {
          opacity: 0;
          transform: translateX(50px);
          transition: all 1s ease-out 0.6s;
        }
        .curated-text-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .curated-image-left {
          opacity: 0;
          transform: translateX(-100px) scale(0.9);
          transition: all 1s ease-out 0.8s;
        }
        .curated-image-left-visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .curated-dark-panel {
          opacity: 0;
          transform: translateX(100px) scale(0.95);
          transition: all 1s ease-out 0.8s;
        }
        .curated-dark-panel-visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      `}</style>
    </section>
  );
}