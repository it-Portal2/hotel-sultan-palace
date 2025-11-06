"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { getExcursions, Excursion } from "@/lib/firestoreService";
import { HiArrowRight } from "react-icons/hi";

const CARDS = [
  { title: "Jozani Forest", img: "/excursions/excursions_jozani.png" },
  { title: "Kizimkazi Dolphin", img: "/excursions/excursions_dolphin.png" },
  { title: "Sunset – Michamvi", img: "/excursions/excursions_sunset.png" },
  { title: "Horse Riding", img: "/excursions/excursions_horse.png" },
  { title: "Safari Blue", img: "/excursions/excursions_safari.png" },
];

export default function Excursions() {
  const [extra, setExtra] = useState<Excursion[]>([]);
  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('excursions-visible');
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!showAll) return;
    (async () => {
      const items = await getExcursions();
      setExtra(items);
    })();
  }, [showAll]);

  return (
    <section
      ref={sectionRef}
      id="excursions"
      className="w-full bg-[#FFFCF6] py-12 md:py-20 font-sans excursions-section"
    >
      <div className="container mx-auto max-w-[1512px] px-4 md:px-[20px] py-6 md:py-10">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className={`font-quicksand text-[32px] md:text-[40px] lg:text-[45px] font-semibold leading-[1.25] text-[#202C3B] mb-4 md:mb-[20px] excursions-heading ${isVisible ? 'excursions-heading-visible' : ''}`}>
              Zanzibar Excursions
            </h2>
            <p className={`text-[16px] md:text-[18px] font-normal leading-[1.25] text-[#808080] font-quicksand excursions-subtitle ${isVisible ? 'excursions-subtitle-visible' : ''}`}>
              Discover the Island&apos;s Most Memorable Adventures
            </p>
          </div>
          <button
            onClick={() => setShowAll((v) => !v)}
            className={`shrink-0 items-center gap-2 md:gap-3 text-[20px] md:text-[24px] font-normal font-jomolhari text-[#FF6A00] transition-all hover:scale-130 inline-flex excursions-view-btn ${isVisible ? 'excursions-view-btn-visible' : ''}`}
          >
            {showAll ? 'Hide' : 'View All'}
            <HiArrowRight 
              className={`h-5 w-5 md:h-6 md:w-6 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        {/* First 5 Cards - Large Size in One Row */}
        <div className="mt-6 md:mt-[90px] grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-[22px]">
          {CARDS.map((card, index) => (
            <div
              key={card.title}
              className={`group relative w-full overflow-hidden rounded-[7px] shadow-lg excursions-card ${isVisible ? 'excursions-card-visible' : ''}`}
              style={{ transitionDelay: `${index * 0.15}s` }}
            >
              <div className="relative w-full aspect-[300/280]">
                <Image
                  fill
                  src={card.img}
                  alt={card.title}
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-130 active:scale-130"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 pb-4 md:pb-[19px] text-center z-10">
                  <h3 className="text-[18px] md:text-[22px] font-normal font-jomolhari leading-[1.602] text-white drop-shadow-lg">
                    {card.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Cards - Grid Layout Below */}
        {showAll && extra.length > 0 && (
          <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-[22px] animate-fade-in">
            {extra.map((item, index) => (
              <div 
                key={item.id} 
                className="group relative w-full overflow-hidden rounded-[7px] shadow-lg"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className="relative w-full aspect-[300/280]">
                  <Image 
                    fill 
                    src={item.image} 
                    alt={item.title} 
                    className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-130 active:scale-130" 
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 pb-4 md:pb-[19px] text-center z-10">
                    <h3 className="text-[18px] md:text-[22px] font-normal font-jomolhari leading-[1.602] text-white drop-shadow-lg">{item.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .excursions-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out;
        }
        .excursions-section.excursions-visible,
        .excursions-visible .excursions-section {
          opacity: 1;
          transform: translateY(0);
        }
        .excursions-heading {
          opacity: 0;
          transform: translateX(-50px);
          transition: all 1s ease-out 0.2s;
        }
        .excursions-heading-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .excursions-subtitle {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s ease-out 0.4s;
        }
        .excursions-subtitle-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .excursions-view-btn {
          opacity: 0;
          transform: translateX(50px) scale(0.9);
          transition: all 0.8s ease-out 0.4s;
        }
        .excursions-view-btn-visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .excursions-card {
          opacity: 0;
          transform: translateY(80px) scale(0.85) rotateX(15deg);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .excursions-card-visible {
          opacity: 1;
          transform: translateY(0) scale(1) rotateX(0deg);
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
