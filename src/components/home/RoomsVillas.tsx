"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import BookNowButton from "../ui/BookNowButton";
import BookingModal from "@/components/booking/BookingModal";
import { getRooms, Room } from "@/lib/firestoreService";

export default function RoomsVillas() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [open, setOpen] = useState(false);
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
      <div className="mx-auto w-full max-w-[1512px] px-4 md:px-[20px]">
        {/* Header row */}
        <div className="flex items-end justify-between mb-8 md:mb-[87px]">
          <div className="flex flex-col gap-2 md:gap-[13px]">
            <span className={`text-[#BE8C53] font-quicksand font-medium text-[16px] md:text-[20px] leading-[1.25] rooms-label ${isVisible ? 'rooms-label-visible' : ''}`}>EXPLORE</span>
            <h2 className={`text-[#202C3B] font-quicksand font-semibold text-[32px] md:text-[40px] lg:text-[48px] leading-[1.25] rooms-heading ${isVisible ? 'rooms-heading-visible' : ''}`}>Rooms & Villas</h2>
          </div>
          <Link href="/rooms?view=explore" className={`hidden md:flex items-center gap-[124px] text-[#202C3B] hover:opacity-80 rooms-explore ${isVisible ? 'rooms-explore-visible' : ''}`}>
            <span className="font-quicksand font-semibold text-[20px] md:text-[24px] leading-[1.25]">Explore</span>
            <Image width={59} height={37} src="/figma/explore-icon.svg" alt="Explore icon" className="w-[59px] h-[37px]" />
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-[36px]">
          {rooms.map((room, index) => (
            <div key={room.id} className={`rounded-[8px] bg-white shadow-[0px_4px_20.7px_rgba(0,0,0,0.08)] overflow-hidden rooms-card ${isVisible ? 'rooms-card-visible' : ''}`} style={{ transitionDelay: `${index * 0.2}s` }}>
              <div className="relative w-full h-[280px] md:h-[375px] overflow-hidden group">
                <Image src={room.image || '/figma/rooms-garden-suite.png'} alt={room.name} fill className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-130" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className="p-4 md:p-[22px]">
                <div className="flex items-start justify-between mb-4 md:mb-[18px]">
                  <div className="flex flex-col gap-4 md:gap-[22px]">
                    <div className="flex flex-col gap-1 md:gap-[5px]">
                      <h3 className="text-black font-quicksand font-medium text-[22px] md:text-[26px] leading-[1.25]">{room.name}</h3>
                      <span className="text-[#4D4D4D] font-quicksand text-[18px] md:text-[20px] leading-[1.25]">{room.beds}</span>
                    </div>
                    <span className="text-[#202C3B] font-quicksand font-semibold text-[20px] md:text-[22px] leading-[1.25]">${room.price} / Night</span>
                  </div>
                </div>
                <div className="mt-6 md:mt-[48px]">
                  <BookNowButton size="sm" className="w-[175px] px-6 md:px-[34px] py-3 md:py-[14px] rounded-[9px] text-[14px] md:text-[16px] h-[45px] md:h-[49px]" onClick={() => setOpen(true)} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <BookingModal open={open} onClose={() => setOpen(false)} />
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
