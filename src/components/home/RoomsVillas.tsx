"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import BookNowButton from "../ui/BookNowButton";
import { getRooms, Room } from "@/lib/firestoreService";

export default function RoomsVillas() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('rooms-visible');
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
    (async () => {
      try {
        const data = await getRooms();
        setRooms(data.slice(0, 3));
      } catch (e) {
        console.error("Failed to load rooms", e);
      }
    })();
  }, []);
  return (
    <section ref={sectionRef} className="w-full bg-[linear-gradient(180deg,_#F4F4F5_0%,_#E8E4D9_74%)] py-16 rooms-section">
      <div className="mx-auto w-full max-w-[1512px] px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-[20px]">
        {/* Header row */}
        <div className="flex items-end justify-between mb-8 md:mb-[87px] gap-4">
          <div className="flex flex-col gap-2 md:gap-[13px] flex-1 min-w-0">
            <span className={`text-[#BE8C53] font-quicksand font-medium text-[16px] md:text-[20px] leading-[1.25] rooms-label ${isVisible ? 'rooms-label-visible' : ''}`}>EXPLORE</span>
            <h2 className={`text-[#202C3B] font-quicksand font-semibold text-[32px] md:text-[40px] lg:text-[44px] xl:text-[48px] leading-[1.25] rooms-heading ${isVisible ? 'rooms-heading-visible' : ''}`}>Rooms & Villas</h2>
          </div>
          <Link href="/rooms?view=explore" className={`hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 2xl:gap-[124px] text-[#202C3B] hover:opacity-80 flex-shrink-0 rooms-explore ${isVisible ? 'rooms-explore-visible' : ''}`}>
            <span className="font-quicksand font-semibold text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px] leading-[1.25] whitespace-nowrap">Explore</span>
            <Image width={59} height={37} src="/figma/explore-icon.svg" alt="Explore icon" className="w-[45px] h-[28px] md:w-[52px] md:h-[32px] lg:w-[59px] lg:h-[37px]" />
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-6 lg:gap-8 xl:gap-6 2xl:gap-[36px]">
          {rooms.map((room, index) => (
            <div key={room.id} className={`rounded-[8px] bg-white shadow-[0px_4px_20.7px_rgba(0,0,0,0.08)] overflow-hidden rooms-card ${isVisible ? 'rooms-card-visible' : ''}`} style={{ transitionDelay: `${index * 0.2}s` }}>
              <div className="relative w-full h-[280px] md:h-[375px] overflow-hidden group">
                <Image 
                  src={room.image || '/figma/rooms-garden-suite.png'} 
                  alt={room.name} 
                  fill 
                  className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-130 active:scale-130" 
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading={index < 3 ? "eager" : "lazy"}
                  quality={85}
                />
              </div>
              <div className="p-4 md:p-5 lg:p-6 xl:p-[22px]">
                <div className="flex items-start justify-between mb-4 md:mb-5 lg:mb-[18px]">
                  <div className="flex flex-col gap-3 md:gap-4 lg:gap-5 xl:gap-[22px]">
                    <div className="flex flex-col gap-1 md:gap-[5px]">
                      <h3 className="text-black font-quicksand font-medium text-[22px] md:text-[24px] lg:text-[26px] leading-[1.25]">{room.name === 'Imperial view' ? 'Imperial suite' : room.name}</h3>
                      <span className="text-[#4D4D4D] font-quicksand text-[16px] md:text-[18px] lg:text-[20px] leading-[1.25]">{room.beds}</span>
                    </div>
                    <span className="text-[#202C3B] font-quicksand font-semibold text-[18px] md:text-[20px] lg:text-[22px] leading-[1.25]">${room.price} / Night</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-6 lg:mt-8 xl:mt-[48px]">
                  <BookNowButton size="sm" className="w-full sm:w-[175px] px-4 md:px-6 lg:px-8 xl:px-[34px] py-2.5 md:py-3 lg:py-[14px] rounded-[9px] text-[13px] md:text-[14px] lg:text-[15px] xl:text-[16px] h-[42px] md:h-[45px] lg:h-[49px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .rooms-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out;
        }
        .rooms-section.rooms-visible,
        .rooms-visible .rooms-section {
          opacity: 1;
          transform: translateY(0);
        }
        .rooms-label {
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.8s ease-out 0.2s;
        }
        .rooms-label-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .rooms-heading {
          opacity: 0;
          transform: translateX(-50px);
          transition: all 1s ease-out 0.4s;
        }
        .rooms-heading-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .rooms-explore {
          opacity: 0;
          transform: translateX(50px) scale(0.9);
          transition: all 0.8s ease-out 0.4s;
        }
        .rooms-explore-visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .rooms-card {
          opacity: 0;
          transform: translateY(80px) scale(0.9) rotateY(10deg);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .rooms-card-visible {
          opacity: 1;
          transform: translateY(0) scale(1) rotateY(0deg);
        }
      `}</style>
    </section>
  );
}
