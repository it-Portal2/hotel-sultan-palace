"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function CuratedExcursions() {
  const [showMap, setShowMap] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Location coordinates for multiple markers
  // Sultan Palace Hotel location from the provided Google Maps link
  const locations = {
    sultanPalace: {
      name: "The Sultan Palace Hotel Zanzibar",
      lat: -6.2220,
      lng: 39.2242,
      address: "The Sultan Palace Hotel Zanzibar, Zanzibar, Tanzania"
    },
    dongwe: {
      name: "Dongwe, East Coast, Zanzibar",
      lat: -6.1659,
      lng: 39.1990,
      address: "Dongwe, East Coast, Zanzibar, Tanzania"
    },
    dongweClub: {
      name: "Dongwe Club",
      lat: -6.1600,
      lng: 39.2000,
      address: "Dongwe Club, Zanzibar"
    },
    sandsBeach: {
      name: "The Sands Beach Resort",
      lat: -6.1580,
      lng: 39.1980,
      address: "The Sands Beach Resort, Zanzibar"
    },
    xanadu: {
      name: "Xanadu Luxury Villas & Retreat Zanzibar",
      lat: -6.1620,
      lng: 39.2010,
      address: "Xanadu Luxury Villas & Retreat Zanzibar"
    }
  };
  
  // Create Google Maps embed URL with multiple markers
  const getMapUrl = () => {
    // Center the map on Sultan Palace Hotel (main location)
    const center = `${locations.sultanPalace.lat},${locations.sultanPalace.lng}`;
    
    // Create markers string for all locations
    const allMarkers = [
      `${locations.sultanPalace.lat},${locations.sultanPalace.lng}`,
      `${locations.dongwe.lat},${locations.dongwe.lng}`,
      `${locations.dongweClub.lat},${locations.dongweClub.lng}`,
      `${locations.sandsBeach.lat},${locations.sandsBeach.lng}`,
      `${locations.xanadu.lat},${locations.xanadu.lng}`
    ];
    
    // Use Google Maps with multiple markers
    // Format: markers=lat1,lng1|lat2,lng2|...
    const markersParam = allMarkers.join('|');
    
    return `https://www.google.com/maps?q=${encodeURIComponent(locations.sultanPalace.address)}&output=embed&zoom=13&center=${center}&markers=${markersParam}`;
  };
  
  // Google Maps directions URL to Sultan Palace Hotel
  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locations.sultanPalace.address)}`;
  };

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
      <div className="mx-auto w-full max-w-[1512px] px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-[30px] py-8 md:py-10 lg:py-20">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 md:gap-8 lg:gap-8 xl:gap-12 2xl:gap-[241px] mb-8 md:mb-12 lg:mb-[113px]">
          <div className="flex flex-col flex-shrink-0">
            <p className={`text-[#BE8C53] font-quicksand font-medium text-[20px] md:text-[24px] leading-[1.25] mb-4 md:mb-[26px] curated-label ${isVisible ? 'curated-label-visible' : ''}`}>
              Curated Excursions
            </p>
            <h2 className={`text-[#202C3B] font-quicksand font-semibold text-[28px] md:text-[36px] lg:text-[40px] xl:text-[44px] leading-[1.25] max-w-full lg:max-w-[450px] xl:max-w-[499px] curated-heading ${isVisible ? 'curated-heading-visible' : ''}`}>
              Explore Zanzibar, The Island of Wonders
            </h2>
          </div>
          <div className="flex items-start flex-1 min-w-0">
            <p className={`text-[#5E5E5E] font-quicksand font-medium text-[16px] md:text-[18px] leading-[1.25] max-w-full lg:max-w-[550px] xl:max-w-[631px] curated-text ${isVisible ? 'curated-text-visible' : ''}`}>
              Let us take you beyond the hotel. From Stone Town&apos;s historic alleys to spice farm adventures and sunset dhow cruises, our curated excursions reveal Zanzibar&apos;s soul. Every journey is arranged with care—just for you.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-4 lg:gap-0">
          
          <div className={`w-full lg:w-[45%] xl:w-[500px] 2xl:w-[650px] overflow-hidden flex-shrink-0 curated-image-left ${isVisible ? 'curated-image-left-visible' : ''}`}>
            <div className="relative w-full h-[300px] md:h-[400px] lg:h-[595px] 2xl:h-[700px]">
              <Image
                src="/figma/curated-excursions-left.png"
                alt="Beautiful villa in Zanzibar"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover transition-transform duration-500 ease-in-out hover:scale-140 active:scale-140"
                priority
              />
            </div>
          </div>

          <div className={`w-full lg:flex-1 bg-[#202C3B] text-white p-6 md:p-8 lg:p-8 xl:p-12 2xl:p-[81px] flex flex-col justify-start items-start relative min-h-[400px] lg:h-[595px] 2xl:h-[700px] curated-dark-panel ${isVisible ? 'curated-dark-panel-visible' : ''}`}>
            
            <div className="flex flex-col items-start w-full mb-6 md:mb-[40px]">
              <div className="flex items-center gap-[8px] justify-center mb-6 md:mb-[49px]">
                <Image src="/figma/icon-location-mini.svg" alt="Location" width={19} height={19} />
                <span className="font-quicksand font-semibold text-[18px] md:text-[20px] leading-[1.25]">Location</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-quicksand font-semibold text-[24px] md:text-[32px] leading-[1.25]">
                  The Sultan Palace Hotel Zanzibar
                </span>
                <span className="font-quicksand text-[16px] md:text-[18px] text-white/80 leading-[1.25]">
                  Dongwe, East Coast, Zanzibar
                </span>
              </div>
            </div>

            <div className="w-full max-w-full lg:max-w-[400px] xl:max-w-[467px] mb-4 md:mb-[20px] flex-shrink-0">
              <div className="relative w-full h-[200px] md:h-[282px] overflow-hidden rounded-lg">
                {!showMap ? (
                  <Image
                    src="/figma/curated-excursions-rect.png"
                    alt="Map preview of Zanzibar locations"
                    fill
                    sizes="(max-width: 1024px) 90vw, 467px"
                    className="w-full h-full object-cover"
                    priority
                  />
                ) : (
                  <iframe
                    title="Map of Zanzibar locations including Sultan Palace Hotel"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full border-0"
                    src={getMapUrl()}
                    allowFullScreen
                  />
                )}
              </div>
            </div>
            
            {/* Location markers info when map is shown */}
            {showMap && (
              <div className="w-full mb-4 space-y-2">
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <div className="w-3 h-3 rounded-full bg-[#FF6A00] border-2 border-white"></div>
                  <span className="font-quicksand">{locations.sultanPalace.name}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-400 border border-white"></div>
                  <span className="font-quicksand">Other locations in Dongwe area</span>
                </div>
              </div>
            )}

            {!showMap ? (
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
            ) : (
              <div className="mt-auto w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 md:gap-[11px] bg-[#FF6A00] hover:bg-orange-600 transition-colors text-white px-4 md:px-[10px] py-3 md:py-[10px] rounded-[161px] font-quicksand font-semibold text-[16px] md:text-[20px] leading-[1.25]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 md:w-6 md:h-6"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Get Directions to Sultan Palace
                </a>
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className="inline-flex items-center justify-center gap-2 md:gap-[11px] bg-white/20 hover:bg-white/30 transition-colors text-white px-4 md:px-[10px] py-3 md:py-[10px] rounded-[161px] font-quicksand font-semibold text-[16px] md:text-[20px] leading-[1.25]"
                >
                  Close Map
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