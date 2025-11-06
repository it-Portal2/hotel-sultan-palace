"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getOffers } from "@/lib/firestoreService";

const initialOffers = [
  { 
    id: 1, 
    imageUrl: "/offer-image.jpg" 
  },
  { 
    id: 2, 
    imageUrl: "/offer-image.jpg" 
  },
  { 
    id: 3, 
    imageUrl: "/offer-image.jpg"
  },
  {
    id: 4,
    imageUrl: "/offer-image.jpg"
  }
];

export default function OffersCarousel() {
  const [offers, setOffers] = useState<{id:number|string,imageUrl:string}[]>(initialOffers);
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  

  useEffect(() => {
    (async () => {
      const data = await getOffers();
      if (data.length > 0) {
        setOffers(data.map((o)=>({ id: o.id, imageUrl: o.imageUrl })));
      }
    })();
  }, []);

  useEffect(() => {
    if (offers.length === 0) return;

    intervalRef.current = window.setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % offers.length);
    }, 4000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [offers.length]);

  if (offers.length === 0) {
    return <section className="w-full bg-[#FFFCF6] py-12 text-center">Loading Offers...</section>;
  }

  return (
    <section className="w-full overflow-hidden" style={{ padding: 0, margin: 0 }}>
      <div className="w-full max-w-full mx-auto" style={{ padding: 0 }}>
        
        <div className="text-center mb-3 md:mb-6 lg:mb-8 xl:mb-12 2xl:mb-16 px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <h2 className="text-[26px] md:text-[30px] lg:text-[36px] xl:text-[40px] font-normal text-[#323232] font-['Oooh_Baby'] leading-[1.225] tracking-[8%] mb-2 md:mb-3 lg:mb-4 xl:mb-6">
            Best Offers for you
          </h2>
          <div className="flex justify-center">
            <div className="w-full max-w-[250px] md:max-w-[350px] lg:max-w-[450px] xl:max-w-[550px] 2xl:max-w-[678px] h-[2px] bg-gradient-to-r from-transparent via-[#CBBB9D] to-transparent" />
          </div>
        </div>

        {/* Full Width Carousel - No gaps, extends to edges */}
        <div className="relative w-full" style={{ padding: 0, margin: 0 }}>
          <div className="relative w-full overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {offers.map((offer, i) => (
                <Link 
                  key={offer.id} 
                  href="/rooms"
                  className="flex-shrink-0 w-full block"
                  style={{ padding: 0, margin: 0 }}
                >
                  <div className="relative w-full h-[280px] md:h-[380px] lg:h-[480px] xl:h-[580px] 2xl:h-[680px] cursor-pointer" style={{ position: 'relative', isolation: 'isolate', padding: 0, margin: 0 }}>
                    <Image
                      src={offer.imageUrl}
                      alt={`Offer ${i + 1}`}
                      fill
                      className="object-contain w-full h-full transition-opacity duration-300 hover:opacity-90" 
                      priority={i === 0}
                      sizes="100vw"
                      style={{ position: 'absolute', zIndex: 1, top: 0, left: 0, width: '100%', height: '100%' }}
                      onError={(e) => {
                        console.log('Carousel image load error:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3  flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-20">
          {offers.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                index === i ? "bg-[#A38D75] w-8" : "bg-[#CFC7BC]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}