"use client";
import Image from "next/image";
import BookNowButton from "../ui/BookNowButton";

const CARDS = [
  {
    title: "Garden suite",
    price: "$250 / Night ",
    meta: "2 Adults . 1 Child",
    img: "/figma/rooms-garden-suite.png",
  },
  {
    title: "Ocean suite",
    price: "$300 / Night",
    meta: "2 Adults . 1 Child",
    img: "/figma/rooms-ocean-suite.png",
  },
  {
    title: "Imperial suite",
    price: "$350 / Night",
    meta: "4 Adults . 1 Child",
    img: "/figma/rooms-imperial-suite.png",
  },
];

export default function RoomsVillas() {
  return (
    <section className="w-full bg-[linear-gradient(180deg,_#F4F4F5_0%,_#E8E4D9_74%)] py-16">
      <div className="mx-auto w-full max-w-[1512px] px-16 md:px-18">
        {/* Header row */}
        <div className="flex items-end justify-between mb-8">
          <div className="flex flex-col gap-3">
            <span className="text-[#BE8C53] font-quicksand font-medium text-[20px] leading-[1.25]">EXPLORE</span>
            <h2 className="text-[#202C3B] font-quicksand font-semibold text-[30px] md:text-[40px] ">Rooms & Villas</h2>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[#202C3B]">
            <span className="font-quicksand font-semibold text-[20px] leading-[1.25]">Explore</span>
            <Image width={100} height={100} src="/figma/explore-icon.svg" alt="Explore icon" className="w-[50px] h-[30px]" />
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-20">
          {CARDS.map((card) => (
            <div key={card.title} className="rounded-lg bg-white shadow-[0px_4px_20.7px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="relative w-full h-[230px] md:h-[330px] overflow-hidden group">
                <Image src={card.img} alt={card.title} fill className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-130" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-black font-quicksand font-normal text-[20px] leading-[1.25]">{card.title}</h3>
                  <span className="text-[#202C3B] font-quicksand font-normal text-[20px] leading-[1.25]">{card.price}</span>
                 
                </div>
                <div className="mt-2 flex items-center gap-15">
                  <span className="text-[#4D4D4D] font-quicksand text-[18px] leading-[1.25]">{card.meta}</span>
                  <span className="text-[#202C3B] font-quicksand font-normal text-[20px] leading-[1.25]">•B&B</span>
 
                </div>
                <div className="mt-6">
                  <BookNowButton size="sm" className="px-12 py-3 rounded-[9px] text-[14px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
