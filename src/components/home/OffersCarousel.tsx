"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  const [offers] = useState(initialOffers);
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

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

  
  const translateValue = `calc(10% - ${index * 80}%)`;

  return (
    <section className="w-full bg-[#FFFCF6] overflow-hidden py-12">
      <div className="container mx-auto">
        
        <div className="text-center mb-8 px-4">
          <h2 className="text-4xl md:text-5xl font-ooh-baby text-[#6B5B4B]">
            Best Offers for you
          </h2>
          <div className="mt-6 flex justify-center">
            <Image 
              src="/offer2.png"
              alt="decorative line" 
              width={500} 
              height={50} 
              className="object-contain"
            />
          </div>
        </div>

        <div className="relative py-4">
          <div
            className="flex items-center transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(${translateValue})` }}
          >
            {offers.map((offer, i) => (
              <div key={offer.id} className="w-4/5 flex-shrink-0 px-4">
                <div className={`relative w-full aspect-[5/1] rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${index === i ? 'scale-100 opacity-100' : 'scale-90 opacity-60'}`}>
                  <Image
                    src={offer.imageUrl}
                    alt={`Offer ${i + 1}`}
                    fill
                    className="object-cover" 
                    priority={i === 0}
                    sizes="80vw"
                  />
                  <div className="absolute left-[40%] md:left-[40%] bottom-2 md:bottom-4">
                      <button
                        type="button"
                        className="bg-[#FF6A00] text-sm hover:bg-orange-600 text-white font-semibold rounded-lg px-4 py-2 shadow-lg transition-transform hover:scale-105"
                        onClick={() => window.alert(`Viewing offer ${offer.id}`)}
                      >
                        View More
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
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