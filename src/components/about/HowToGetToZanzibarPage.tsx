"use client";
import Image from "next/image";
import { Plane } from "lucide-react";
import { TiLocationArrowOutline } from "react-icons/ti";
import { FaPlane } from "react-icons/fa";
import { IoTimeOutline } from "react-icons/io5";
import { IoLocationOutline } from "react-icons/io5";
import { BiSolidPlaneAlt } from "react-icons/bi";
import { useState, useEffect } from "react";
import TransfersSection from "@/components/shared/TransfersSection";


export default function HowToGetToZanzibarPage() {
  const [displayText, setDisplayText] = useState("");
  const [showHeading, setShowHeading] = useState(false);
  const [showPlane, setShowPlane] = useState(false);
  const [planePosition, setPlanePosition] = useState(-100);
  const [showCursor, setShowCursor] = useState(true);
  
  const fullText = "YOUR JOURNEY TO SULTAN PALACE HOTEL";
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          setShowCursor(false);
          setTimeout(() => {
            setShowHeading(true);
            // Animate plane moving from top to bottom
            const planeAnimation = setInterval(() => {
              setPlanePosition(prev => {
                if (prev >= 0) {
                  clearInterval(planeAnimation);
                  setShowPlane(true);
                  return 0;
                }
                return prev + 2;
              });
            }, 20);
          }, 500);
        }, 1000);
      }
    }, 80);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1a2b]">
      {/* Hero Section */}
      <section className="relative h-[800px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/get-zanzibar/island-sea-with-plane-wing%202.png"
            alt="Zanzibar Island"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[#0a1a2b]/30"></div>
        
        </div>

      
        <div className="relative z-10 text-center text-white px-4 container-xl">
          <div className={`uppercase tracking-[0.25em] text-[14px] md:text-[16px] text-white/80 mt-80 mb-10 font-poppins transition-all duration-1000 ${showHeading ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex items-center justify-center gap-3">
              <span>How to get to Zanzibar</span>
              <Plane 
                size={20} 
                className={`text-white rotate-135 transition-all duration-1000 ${showPlane ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`} 
                style={{ transform: `translateY(${planePosition}px) rotate(135deg)` }}
              />
            </div>
          </div>
          
          <h1 className="font-poppins leading-tight text-[36px] md:text-[64px] lg:text-[45px] mb-12 min-h-[120px] flex flex-col items-center justify-center">
            <span className="typing-text">
              {displayText.includes("SULTAN") ? (
                <>
                  YOUR JOURNEY TO SULTAN
                  <br />
                  {displayText.substring(20)}
                </>
              ) : (
                displayText
              )}
              {showCursor && <span className="animate-pulse">|</span>}
            </span>
          </h1>

          <div className="flex flex-col items-center">
            <div className="w-[2px] h-15 md:h-20 bg-gradient-to-b from-white/60 to-white/0" />
            <Plane size={28} className="text-white rotate-135 opacity-90 -mt-2" />
          </div>
        </div>
      </section>


      <section >
        <div >
        

       
          <div className="h-[720px] relative overflow-hidden">
            <Image
              src="/get-zanzibar/image 48.png"
              alt="Zanzibar International Airport"
              fill
              className="object-cover"
              priority
            />
          
           

          
            <div className="absolute inset-x-0 top-6 md:top-8 text-center px-4">
              <div className="max-w-3xl mx-auto">
                <h2 className="font-poppins font-semibold text-[24px] md:text-[28px] text-[#ff8a00] mb-8 ">
                  Zanzibar International Airport (ZNZ)
                </h2>
                <p className="text-[#252016] font-open-sans text-[13px] md:text-[15px] leading-7">
                  Zanzibar International Airport, officially known as Abeid Amani Karume International Airport, is located about 6 kilometers south of Stone Town, the island&apos;s capital.
                </p>
                <p className="text-[#252016] font-open-sans text-[13px] md:text-[15px] leading-7 mt-1.5">
                  All destinations within The Zanzibar Collection, including Sultan Palace Hotel, are reachable in approximately one hour&apos;s drive on an excellent tarmac road.
                </p>
                <p className="text-[#252016] font-open-sans text-[13px] md:text-[15px] leading-7 mt-1.5">
                  We offer a Meet & Greet Service and private airport transfers to ensure a smooth and welcoming start to your stay.
                </p>
              </div>
            </div>

          
            <div className="absolute inset-x-0 top-[65%] text-center">
              <h3 className="text-white font-poppins font-semibold text-[22px] md:text-[28px] drop-shadow">
                Daily East African Connections
              </h3>
            </div>

            <div className="absolute inset-x-0 bottom-25 flex flex-wrap justify-center gap-4 ">
              {["Dar es Salaam","Nairobi","Mombasa","Kilimanjaro","Arusha"].map((city) => (
                <div key={city} className="flex items-center gap-2 bg-white text-[#1f2a37] w-[170px] rounded-sm  px-5 py-3 shadow">
                  <Plane size={16} className="text-[#1f5ba0]" />
                  <span className="font-open-sans font-semibold text-[14px]">{city}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    
      <section className="bg-[#FFFCF6] py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start">
          
            <div className="w-full  overflow-hidden ">
              <div className="relative w-full h-[620px] md:h-[650px]">
                <Image
                  src="/get-zanzibar/map1.png"
                  alt="Map of Airlines Flying to Zanzibar"
                  fill
                  className="object-contain "
                  priority
                />
              </div>
            </div>

          
            <div className="relative bg-[#FFFCF6]">
            
              <div className="pointer-events-none select-none absolute right-0 -top-4 md:-top-6 w-36 h-36 md:w-48 md:h-48 opacity-15 md:opacity-20">
                <Image
                  src="/get-zanzibar/plane.png"
                  alt="Decorative plane"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 9rem, 12rem"
                  priority
                />
              </div>
            
              <div className="pointer-events-none select-none absolute -bottom-6 right-6 w-40 h-40 md:w-52 md:h-52 opacity-10">
                <Image
                  src="/get-zanzibar/plane.png"
                  alt="Decorative plane"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 10rem, 13rem"
                  priority
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative inline-flex h-9 w-9 items-center justify-center">
                  <Image
                    src="/get-zanzibar/airplane (1) 1.png"
                    alt="Airlines globe icon"
                    fill
                    className="object-contain"
                    sizes="2.25rem"
                    priority
                  />
                </span>
                <h3 className="text-[#1f2a37] font-poppins font-semibold text-[22px] md:text-[26px]">
                  Airlines Flying to Zanzibar
                </h3>
              </div>
              <div className="text-[#ff8a00] font-poppins text-[13px] md:text-[14px] mb-4">
                International Airlines
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 text-[#374151]">
                {[
                  [
                    "KLM",
                    "Qatar Airways",
                    "Turkish Airlines",
                    "Kenya Airways",
                    "Zan Air",
                    "Oman Air",
                    "Air France",
                    "Etihad Airways",
                    "Air Tanzania",
                    "Neos (Italy)",
                    "Coastal Air",
                    "Regional Air",
                  ],
                  [
                    "Lufthansa",
                    "Fly Dubai",
                    "Ethiopian Airlines",
                    "Precision Air",
                    "Condor",
                    "Egypt Air",
                    "Edelweiss Air (Swiss International Airlines)",
                    "Fly Safair (Johannesburg)",
                    "Safarilink (Nairobi)",
                    "Flight Link",
                    "Auric Air",
                  ],
                ].map((col, idx) => (
                  <ul key={idx} className="w-full">
                    {col.map((name) => (
                      <li key={name} className="flex items-center gap-3 py-2 md:py-2.5 border-b border-[#e5e7eb] last:border-0">
                        <FaPlane size={12} className="text-[#6b7280] -rotate-45" />
                        <span className="font-open-sans text-[13px] md:text-[14px]">{name}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>

              <div className="mt-6">
              <button className="mt-8 inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e67a00] text-white font-quicksand text-[18px] px-5 py-2 rounded-sm shadow">
            <TiLocationArrowOutline size={20} className="text-white" />
            View on Map
          </button>
              </div>
            </div>
          </div>
        </div>
      </section>

     
     
  
    <section className="bg-[#FFFCF6] py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
     
          <div className="order-2 md:order-1 mb-20">
          {/* Top icon + heading */}
          <div className="flex items-center gap-3 mb-3">
            <span className="relative inline-flex h-[61px] w-[61px] items-center justify-center rounded-md overflow-hidden">
              <Image src="/get-zanzibar/departure 1.png" alt="Departure icon" fill className="object-cover" />
            </span>
            <h2 className="text-[#2A2824] font-poppins font-semibold text-[28px]">
              Dar es Salaam (DAR)
            </h2>
          </div>
         
          <div className="text-[#FF6A00] font-quicksand font-medium tracking-wide text-[16px] mb-6">
            Connecting Airports
          </div>
         
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 text-[#2A2824]">
            {[
              [
                "Swiss International Airlines",
                "Qatar Airways",
                "South African Airlines",
                "KLM Royal Dutch Airlines",
              ],
              [
                "RwandAir",
                "Oman Air",
                "Turkish Airlines",
                "Fly Dubai",
              ],
            ].map((col, idx) => (
              <ul key={idx} className="w-full">
                {col.map((name) => (
                  <li
                    key={name}
                    className="flex items-center gap-3 py-3 border-b border-[#ece7dc] last:border-0"
                  >
                    <BiSolidPlaneAlt size={14} className="text-[#6b675b]" />
                    <span className="font-open-sans text-[13px] text-[#2A2824]">{name}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
         
          <button className="mt-8 inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e67a00] text-white font-quicksand text-[18px] px-5 py-2 rounded-sm shadow">
            <TiLocationArrowOutline size={20} className="text-white" />
            View on Map
          </button>
        </div>
 
      
        <div className="relative order-1 md:order-2 w-full h-[450px]">
          <Image
            src="/get-zanzibar/map2.png"
            alt="Connecting Airports Map"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>

    <section className="bg-[#FFFCF6] py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      
        <div className="relative w-full h-[583px] order-1">
          <Image
            src="/get-zanzibar/map3.png"
            alt="Connecting Airports Map"
            fill
            className="object-cover"
            priority
          />
        </div>
      
        <div className="order-2">
         
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-[61px] w-[61px] items-center justify-center rounded-md overflow-hidden">
              <Image src="/get-zanzibar/departure 1.png" alt="Departure icon" fill className="object-cover" />
            </span>
            <h3 className="text-[#302819] font-quicksand font-semibold text-[28px]">Nairobi (NBO)</h3>
          </div>

         
          <div className="text-[#FF6A00] font-quicksand font-medium tracking-wide text-[16px] mt-8 mb-6">
            Connecting Airports
          </div>

         
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-14 text-[#302819]">
            {[
              [
                "Emirates",
                "Oman Air",
                "Etihad Airways",
                "Turkish Airlines",
                "Kenya Airways",
                "Swiss International Airlines",
                "South African Airlines",
                "British Airways",
              ],
              [
                "Qatar Airways",
                "Gulf Air",
                "Egypt Air",
                "Air Arabia",
                "KLM Royal Dutch Airlines",
                "Air France",
                "Ethiopian Airlines",
                "Royal Air Maroc",
              ],
            ].map((col, idx) => (
              <div key={idx} className="w-full">
                {col.map((name) => (
                  <div key={name} className="py-3 border-b border-black/10 last:border-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BiSolidPlaneAlt size={14} className="text-[#6b675b] " />
                      <span className="font-open-sans text-[13px] text-[#302819]">{name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

         
          <button className="mt-8 inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e67a00] text-white font-quicksand text-[18px] px-5 py-2 rounded-sm shadow">
            <TiLocationArrowOutline size={20} className="text-white" />
            View on Map
          </button>
        </div>
      </div>
    </section>

    <section className="bg-[#FFFCF6] py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
       
        <div className="order-2 md:order-1 mb-20">
        
          <div className="flex items-center gap-3 mb-3">
            <span className="relative inline-flex h-[50px] w-[50px] items-center justify-center rounded-md overflow-hidden">
              <Image src="/get-zanzibar/cruise-ship.png" alt="Ferry icon" fill className="object-cover" />
            </span>
            <h2 className="text-[#302819] font-quicksand font-semibold text-[28px]">
              Ferry from Dar es Salaam to Zanzibar
            </h2>
          </div>
        
          <div className="text-[#FF6A00] font-quicksand font-medium tracking-wide text-[16px] mb-6">
            Azam Marine / Kilimanjaro Fast Ferries Fast Ferries
          </div>
          
        
          <div className="space-y-6 mb-6">
        
            <div className="flex items-start gap-4">
              <IoTimeOutline size={24} className="text-[#423B2D] mt-1" />
              <div>
                <div className="text-[#423B2D] font-quicksand text-[16px]">
                  Travel Time:
                </div>
                <div className="text-[#423B2D] font-quicksand text-[16px]">
                  2 – 2.5 hours (depending on sea conditions)
                </div>
              </div>
            </div>
            
          
            <div className="flex items-start gap-4">
              <IoLocationOutline size={28} className="text-[#423B2D] mt-1" />
              <div>
                <div className="text-[#423B2D] font-quicksand text-[16px]">
                  Departure Point:
                </div>
                <div className="text-[#423B2D] font-quicksand text-[16px]">
                  Dar es Salaam Ferry Terminal (Kisutu)
                </div>
              </div>
            </div>
            
           
            <div className="flex items-start gap-4">
              <IoLocationOutline size={28} className="text-[#423B2D] mt-1" />
              <div>
                <div className="text-[#423B2D] font-quicksand text-[16px]">
                  Arrival Point:
                </div>
                <div className="text-[#423B2D] font-quicksand text-[16px]">
                  Zanzibar Port, Stone Town
                </div>
              </div>
            </div>
          </div>
          
         
          <button className="mt-8 inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e67a00] text-white font-quicksand text-[18px] px-5 py-2 rounded-sm shadow">
            <TiLocationArrowOutline size={20} className="text-white" />
            View on Map
          </button>
        </div>
       
        <div className="relative order-1 md:order-2 w-full h-[500px]">
          <Image
            src="/get-zanzibar/map4.png"
            alt="Ferry Map"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>

  
    <TransfersSection />

    </div>
  );
}
