"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getOffers } from "@/lib/firestoreService";
import BookingModal from "@/components/booking/BookingModal";

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
  const [bookingOpen, setBookingOpen] = useState(false);

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

  const translateValue = `calc(10% - ${index * 80}%)`;

  return (
    <section className="w-full bg-[#FFFCF6] overflow-hidden py-12">
      <div className="container mx-auto px-4 md:px-10">
        
        <div className="text-center mb-[100px] px-4">
          <h2 className="text-[40px] font-normal text-[#323232] font-['Oooh_Baby'] leading-[1.225] tracking-[8%] mb-[30px]">
            Best Offers for you
          </h2>
          <div className="flex justify-center">
            <div className="w-[678px] h-[2px] bg-gradient-to-r from-transparent via-[#CBBB9D] to-transparent" />
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
                    onError={(e) => {
                      console.log('Carousel image load error:', e);
                      // Fallback to a placeholder or hide the image
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* Book Now overlay */}
                  <div className="absolute inset-0 flex items-end justify-center p-4">
                    <span
                      onClick={() => setBookingOpen(true)}
                      className="cursor-pointer text-[#FF6A00] font-semibold underline decoration-[#FF6A00]/70 underline-offset-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] hover:opacity-90"
                    >
                      Book now
                    </span>
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
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </section>
  );
}