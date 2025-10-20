"use client";
import Image from "next/image";
import { useState } from "react";

export default function CuratedExcursions() {
  const [showMap, setShowMap] = useState(false);

  return (
    <section className="w-full bg-[linear-gradient(-2deg,_#F4F4F5_70%,_#FFFCF6_100%)]">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-14 lg:px-18 py-10 lg:py-20">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="flex flex-col">
            <p className="text-[#BE8C53] font-quicksand font-normal text-lg md:text-xl tracking-wide">
              Curated Excursions
            </p>
            <h2 className="text-text-primary font-quicksand font-medium text-3xl md:text-4xl leading-tight mt-4">
              Explore Zanzibar, The<br /> Island of Wonders
            </h2>
          </div>
          <div className="flex items-center">
            <p className="text-[#5E5E5E] font-quicksand font-normal text-[16px] leading-relaxed">
              Let us take you beyond the hotel. From Stone Town’s historic alleys to spice farm adventures and sunset dhow cruises, our curated excursions reveal Zanzibar’s soul. Every journey is arranged with care—just for you.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row w-full shadow-lg">
          
          <div className="w-full lg:w-1/2 overflow-hidden">
            <div className="relative w-full h-full min-h-[260px] lg:min-h-[300px]">
              <Image
                src="/figma/curated-excursions-left.png"
                alt="Beautiful villa in Zanzibar"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 ease-in-out hover:scale-140"
                priority
              />
            </div>
          </div>

          <div className="w-full lg:w-1/2 bg-[#202C3B] text-white p-8 sm:p-12 md:p-16 flex flex-col justify-center items-center text-center">
            
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3 justify-center">
                <Image src="/figma/icon-location-mini.svg" alt="Location" width={20} height={20} />
                <span className="font-quicksand font-normal text-[16px]">Location</span>
              </div>
              <span className="mt-3 font-quicksand font-semibold text-[20px] md:text-[24px] leading-tight">
                Dongwe, East Coast, Zanzibar
              </span>
            </div>

            <div className="mt-8 w-full max-w-[560px] mx-auto">
              <div className="relative w-full h-[200px] sm:h-[230px] md:h-[260px] lg:h-[280px] overflow-hidden">
                {!showMap ? (
                  <Image
                    src="/figma/curated-excursions-rect.png"
                    alt="Map preview of Dongwe"
                    fill
                    sizes="(max-width: 1024px) 90vw, 40vw"
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
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="mt-8 mx-auto inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-orange-600 transition-colors text-white px-4 py-2 rounded-full font-quicksand font-bold text-[16px] "
              >
                <Image src="/figma/icon-location.svg" alt="Location Icon" width={24} height={24} />
                Find in map
              </button>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}