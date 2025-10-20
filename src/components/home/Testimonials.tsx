"use client";
import Image from "next/image";
import { FaQuoteLeft, FaStar } from "react-icons/fa";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi";

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
  const testimonial = {
    name: "Kamini pal",
    country: "india",
    text:
      "The location is on the East coast and and such is affected by tides but even in the low tide one can walk not too far and snorkel and swim. The property offers a kayak with which you can kayak in…",
    countryCode: "in",
  };

  const initial = testimonial.name[0];

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

          <p className="mt-10 text-lg max-w-3xl text-[#202C3B]/90 font-kaisei leading-8">
            {testimonial.text}
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EBDDCC] text-[#BE8C53] font-kaisei text-lg">
              {initial}
            </div>
            <div className="text-left">
              <p className="font-kaisei font-bold text-[#202C3B] ">{testimonial.name}</p>
              <div className="mt-1 flex items-center gap-2">
                {/* load flag from flagcdn to avoid bundling local flags */}
                <p className="font-kaisei text-[#655D4E] text-sm">{testimonial.country}</p>
                <Image
                  src={`https://flagcdn.com/w20/${testimonial.countryCode}.png`}
                  width={20}
                  height={14}
                  alt={testimonial.country}
                  style={{ display: "block" }}
                />
              </div>
            </div>

            <div className="ml-8 flex items-center gap-10">
              <button className="grid h-12 w-12 place-items-center rounded-full bg-[#EBDDCC]  text-[#BE8C53]">
                <HiOutlineArrowLeft className="text-2xl" />
              </button>
              <button className="grid h-12 w-12 place-items-center rounded-full bg-[#EBDDCC]  text-[#BE8C53]">
                <HiOutlineArrowRight className="text-2xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings bar */}
      <div className="bg-[#242424] py-2 md:py-4">
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-y-8">
          {RATINGS.map((r) => {
            const percent = Math.max(0, Math.min(100, (r.score / 10) * 100));
            return (
              <div key={r.label} className="flex flex-col items-center text-white">
               
                  <div
                    className="relative h-16 w-16 rounded-full"
                    style={{
                      background: `conic-gradient(#A79677 ${percent}%, rgba(230,230,230,1) ${percent}% 100%)`,
                    }}
                  >
                 
                    <div className="absolute inset-1 rounded-full bg-[#242424]" />
                 
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="flex flex-col items-center">
                        <FaStar className="text-[#A79677] text-base" />
                        <span className="mt-1 text-sm font-semibold text-white">{r.score}</span>
                      </div>
                    </div>
                  </div>
                <p className="mt-3 font-kaisei text-sm text-white/90 text-center">{r.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


