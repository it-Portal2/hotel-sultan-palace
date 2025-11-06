"use client";
import Image from "next/image";
import { FaQuoteLeft, FaStar } from "react-icons/fa";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi";
import { useEffect, useState, useRef } from "react";
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
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('testimonials-visible');
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    }
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
    <section ref={sectionRef} className="w-full overflow-hidden testimonials-section">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className={`relative h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] 2xl:h-[700px] testimonials-image ${isVisible ? 'testimonials-image-visible' : ''}`}>
          <Image
            src="/testimonial.png"
            alt="Sultan Palace wall"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Right panel */}
        <div className="bg-[#FFFCF6] px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-20 py-8 md:py-12 lg:py-16 xl:py-20 2xl:py-24 flex flex-col items-center text-center">
          <FaQuoteLeft className={`text-[#22170B]/90 text-2xl md:text-3xl lg:text-4xl testimonials-icon ${isVisible ? 'testimonials-icon-visible' : ''}`} />
          <p className={`mt-4 md:mt-5 lg:mt-6 text-[#BE8C53] font-kaisei text-sm md:text-base lg:text-lg testimonials-label ${isVisible ? 'testimonials-label-visible' : ''}`}>
            voice from our guests
          </p>
          <h2 className={`mt-4 md:mt-5 lg:mt-6 font-kaisei font-bold tracking-wide text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-[56px] text-[#202C3B] testimonials-title ${isVisible ? 'testimonials-title-visible' : ''}`}>
            TESTIMONIALS
          </h2>

          {loading ? (
            <div className="mt-8 md:mt-10 lg:mt-12 flex justify-center">
              <div className="h-8 w-8 border-b-2 border-[#BE8C53] rounded-full animate-spin" />
            </div>
          ) : testimonial ? (
            <>
              <p className={`mt-8 md:mt-10 lg:mt-12 text-base md:text-lg lg:text-xl xl:text-2xl max-w-3xl text-[#202C3B]/90 font-kaisei leading-relaxed md:leading-8 lg:leading-9 testimonials-text ${isVisible ? 'testimonials-text-visible' : ''}`}>
                {testimonial.text}
              </p>

              <div className={`mt-6 md:mt-8 lg:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 testimonials-actions ${isVisible ? 'testimonials-actions-visible' : ''}`}>
                <div className="flex items-center gap-4 md:gap-5 lg:gap-6">
                  <div className="grid h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 place-items-center rounded-full bg-[#EBDDCC] text-[#BE8C53] font-kaisei text-lg md:text-xl lg:text-2xl">
                    {testimonial.name[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-kaisei font-bold text-[#202C3B] text-base md:text-lg lg:text-xl">
                      {testimonial.name}
                    </p>
                    <div className="mt-1 md:mt-2 flex items-center gap-2">
                      <p className="font-kaisei text-[#655D4E] text-xs md:text-sm lg:text-base capitalize">
                        {testimonial.country}
                      </p>
                      <Image
                        src={`https://flagcdn.com/w20/${testimonial.countryCode}.png`}
                        width={20}
                        height={14}
                        alt={testimonial.country}
                        className="w-4 h-3 md:w-5 md:h-4 lg:w-6 lg:h-4"
                        style={{ display: "block" }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {canNavigate && (
                  <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
                    <button
                      onClick={handlePrevious}
                      className="grid h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 place-items-center rounded-full bg-[#EBDDCC] text-[#BE8C53] hover:bg-[#BE8C53] hover:text-white transition-colors duration-200"
                      aria-label="Previous testimonial"
                    >
                      <HiOutlineArrowLeft className="text-xl md:text-2xl lg:text-3xl" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="grid h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 place-items-center rounded-full bg-[#EBDDCC] text-[#BE8C53] hover:bg-[#BE8C53] hover:text-white transition-colors duration-200"
                      aria-label="Next testimonial"
                    >
                      <HiOutlineArrowRight className="text-xl md:text-2xl lg:text-3xl" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-8 md:mt-10 lg:mt-12 text-center">
              <p className="text-base md:text-lg lg:text-xl text-[#202C3B]/60 font-kaisei">
                No testimonials available yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ratings bar */}
      <div className={`bg-[#242424] py-4 md:py-6 lg:py-8 xl:py-10 testimonials-ratings ${isVisible ? 'testimonials-ratings-visible' : ''}`}>
        <div className="mx-auto w-full max-w-[1512px] px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-20 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 md:gap-8 lg:gap-10">
          {RATINGS.map((r, index) => {
            const percent = Math.max(0, Math.min(100, (r.score / 10) * 100));
            return (
              <div key={r.label} className={`flex flex-col items-center text-white testimonials-rating-item ${isVisible ? 'testimonials-rating-item-visible' : ''}`} style={{ transitionDelay: `${index * 0.1}s` }}>
                <div
                  className="relative h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 xl:h-20 xl:w-20 rounded-full"
                  style={{
                    background: `conic-gradient(#A79677 ${percent}%, rgba(230,230,230,1) ${percent}% 100%)`,
                  }}
                >
                  <div className="absolute inset-1 rounded-full bg-[#242424]" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="flex flex-col items-center">
                      <FaStar className="text-[#A79677] text-xs md:text-sm lg:text-base xl:text-lg" />
                      <span className="mt-1 text-xs md:text-sm lg:text-base xl:text-lg font-semibold text-white">{r.score}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 md:mt-3 font-kaisei text-xs md:text-sm lg:text-base text-white/90 text-center">{r.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .testimonials-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out;
        }
        .testimonials-section.testimonials-visible,
        .testimonials-visible .testimonials-section {
          opacity: 1;
          transform: translateY(0);
        }
        .testimonials-image {
          opacity: 0;
          transform: translateX(-100px) scale(0.9);
          transition: all 1s ease-out 0.3s;
        }
        .testimonials-image-visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .testimonials-icon {
          opacity: 0;
          transform: scale(0) rotate(-180deg);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s;
        }
        .testimonials-icon-visible {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }
        .testimonials-label {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 0.8s ease-out 0.7s;
        }
        .testimonials-label-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .testimonials-title {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 1s ease-out 0.9s;
        }
        .testimonials-title-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .testimonials-text {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out 1.1s;
        }
        .testimonials-text-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .testimonials-actions {
          opacity: 0;
          transform: translateY(30px) scale(0.9);
          transition: all 0.8s ease-out 1.3s;
        }
        .testimonials-actions-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .testimonials-ratings {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out 0.5s;
        }
        .testimonials-ratings-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .testimonials-rating-item {
          opacity: 0;
          transform: translateY(30px) scale(0.8);
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .testimonials-rating-item-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>
    </section>
  );
}


