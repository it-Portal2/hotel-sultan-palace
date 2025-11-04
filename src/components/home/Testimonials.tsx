"use client";
import Image from "next/image";
import { FaQuoteLeft, FaStar } from "react-icons/fa";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi";
import { useEffect, useState } from "react";
import { getTestimonials, Testimonial } from "@/lib/firestoreService";

const RATINGS = [
  { label: "Staff", score: 9.3 },
  { label: "Facilities", score: 8.8 },
  { label: "Cleanliness", score: 9.3 },
  { label: "Comfort", score: 9.2 },
  { label: "Value for money", score: 8.4 },
  { label: "Location", score: 8.8 },
  { label: "Free WiFi", score: 8.7 },
];

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTestimonials();
        setTestimonials(data);
        if (data.length > 0) setCurrentIndex(0);
      } catch (e) {
        console.error('Error loading testimonials:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePrevious = () => {
    if (testimonials.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (testimonials.length === 0) return;
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const testimonial = testimonials.length > 0 ? testimonials[currentIndex] : null;
  const canNavigate = testimonials.length > 1;

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        
        <div className="relative h-[360px] md:h-[420px] lg:h-[560px]">
          <Image
            src="/testimonial.png"
            alt="Sultan Palace wall"
            fill
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Right panel */}
        <div className="bg-[#FFFCF6] px-6 md:px-10 lg:px-16 py-12 md:py-16 flex flex-col items-center text-center">
          <FaQuoteLeft className="text-[#22170B]/90 text-3xl" />
          <p className="mt-6 text-[#BE8C53] font-kaisei">voice from our guests</p>
          <h2 className="mt-6 font-kaisei font-bold tracking-wide text-3xl md:text-4xl lg:text-5xl text-[#202C3B]">
            TESTIMONIALS
          </h2>

          {loading ? (
            <div className="mt-10 flex justify-center">
              <div className="h-8 w-8 border-b-2 border-[#BE8C53] rounded-full animate-spin" />
            </div>
          ) : testimonial ? (
            <>
              <p className="mt-10 text-lg max-w-3xl text-[#202C3B]/90 font-kaisei leading-8">
                {testimonial.text}
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EBDDCC] text-[#BE8C53] font-kaisei text-lg">
                  {testimonial.name[0].toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-kaisei font-bold text-[#202C3B]">
                    {testimonial.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="font-kaisei text-[#655D4E] text-sm capitalize">
                      {testimonial.country}
                    </p>
                    <Image
                      src={`https://flagcdn.com/w20/${testimonial.countryCode}.png`}
                      width={20}
                      height={14}
                      alt={testimonial.country}
                      style={{ display: "block" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {canNavigate && (
                  <div className="ml-8 flex items-center gap-10">
                    <button
                      onClick={handlePrevious}
                      className="grid h-12 w-12 place-items-center rounded-full bg-[#EBDDCC] text-[#BE8C53] hover:bg-[#BE8C53] hover:text-white transition-colors duration-200"
                      aria-label="Previous testimonial"
                    >
                      <HiOutlineArrowLeft className="text-2xl" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="grid h-12 w-12 place-items-center rounded-full bg-[#EBDDCC] text-[#BE8C53] hover:bg-[#BE8C53] hover:text-white transition-colors duration-200"
                      aria-label="Next testimonial"
                    >
                      <HiOutlineArrowRight className="text-2xl" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-10 text-center">
              <p className="text-lg text-[#202C3B]/60 font-kaisei">
                No testimonials available yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ratings bar */}
      <div className="bg-[#242424] py-2 md:py-4">
        <div className="mx-auto w-full max-w-screen-xl  grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-y-6">
          {RATINGS.map((r) => {
            const percent = Math.max(0, Math.min(100, (r.score / 10) * 100));
            return (
              <div key={r.label} className="flex flex-col items-center text-white">
               
                  <div
                    className="relative h-12 w-12 md:h-16 md:w-16 rounded-full"
                    style={{
                      background: `conic-gradient(#A79677 ${percent}%, rgba(230,230,230,1) ${percent}% 100%)`,
                    }}
                  >
                 
                    <div className="absolute inset-1 rounded-full bg-[#242424]" />
                 
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="flex flex-col items-center">
                        <FaStar className="text-[#A79677] text-[12px] md:text-base" />
                        <span className="mt-1 text-xs md:text-sm font-semibold text-white">{r.score}</span>
                      </div>
                    </div>
                  </div>
                <p className="mt-2 font-kaisei text-xs md:text-sm text-white/90 text-center">{r.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


