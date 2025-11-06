"use client";
import Image from "next/image";
import { Plane } from "lucide-react";
import { TiLocationArrowOutline } from "react-icons/ti";
import { FaPlane } from "react-icons/fa";
import { IoTimeOutline } from "react-icons/io5";
import { IoLocationOutline } from "react-icons/io5";
import { BiSolidPlaneAlt } from "react-icons/bi";
import { useState, useEffect, useRef } from "react";
import TransfersSection from "@/components/shared/TransfersSection";
import MapModal from "./MapModal";


export default function HowToGetToZanzibarPage() {
  const [displayText, setDisplayText] = useState("");
  const [showHeading, setShowHeading] = useState(false);
  const [showPlane, setShowPlane] = useState(false);
  const [planePosition, setPlanePosition] = useState(-100);
  const [showCursor, setShowCursor] = useState(true);
  const [mapModal, setMapModal] = useState<{ isOpen: boolean; location: { name: string; address: string; coordinates: string } | null }>({
    isOpen: false,
    location: null,
  });
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [sectionVisible, setSectionVisible] = useState<{ [key: string]: boolean }>({});
  
  const fullText = "YOUR JOURNEY TO SULTAN PALACE HOTEL";

  // Location data for different sections
  const locations = {
    zanzibarAirport: {
      name: "Zanzibar International Airport (ZNZ)",
      address: "Abeid Amani Karume International Airport, Zanzibar, Tanzania",
      coordinates: "-6.2220,39.2242",
    },
    darEsSalaam: {
      name: "Dar es Salaam Airport (DAR)",
      address: "Julius Nyerere International Airport, Dar es Salaam, Tanzania",
      coordinates: "-6.8781,39.2026",
    },
    nairobi: {
      name: "Nairobi Airport (NBO)",
      address: "Jomo Kenyatta International Airport, Nairobi, Kenya",
      coordinates: "-1.3192,36.9278",
    },
    ferry: {
      name: "Zanzibar Ferry Terminal",
      address: "Zanzibar Port, Stone Town, Zanzibar, Tanzania",
      coordinates: "-6.1659,39.1990",
    },
  };

  const openMapModal = (locationKey: keyof typeof locations) => {
    setMapModal({
      isOpen: true,
      location: locations[locationKey],
    });
  };

  const closeMapModal = () => {
    setMapModal({
      isOpen: false,
      location: null,
    });
  };
  
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

  // Intersection Observer for section animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const observedElements = new Set<HTMLElement>();

    const setupObservers = () => {
      const sectionKeys = ['airport-section', 'airlines-section', 'dar-section', 'nairobi-section', 'ferry-section', 'transfers-section'];
      
      sectionKeys.forEach((key) => {
        const element = sectionRefs.current[key];
        if (element && !observedElements.has(element)) {
          observedElements.add(element);
          
          const rect = element.getBoundingClientRect();
          const isVisibleNow = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (isVisibleNow) {
            setTimeout(() => {
              setSectionVisible((prev) => ({ ...prev, [key]: true }));
              element.classList.add(`zanzibar-${key}-visible`);
            }, 100);
          } else {
            const observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    setSectionVisible((prev) => ({ ...prev, [key]: true }));
                    entry.target.classList.add(`zanzibar-${key}-visible`);
                    observer.unobserve(entry.target);
                  }
                });
              },
              { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
            );
            observer.observe(element);
            observers.push(observer);
          }
        }
      });
    };

    setupObservers();
    const timeoutId = setTimeout(setupObservers, 200);
    const timeoutId2 = setTimeout(setupObservers, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  // Inject styles via useEffect
  useEffect(() => {
    const styleId = 'zanzibar-page-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Airport Section Animations */
      .zanzibar-airport-section {
        opacity: 0 !important;
        transform: translateY(60px) !important;
        transition: all 1s ease-out 0.2s !important;
      }
      .zanzibar-airport-section.zanzibar-airport-section-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .zanzibar-airport-image {
        opacity: 0 !important;
        transform: scale(1.1) !important;
        transition: all 1.2s ease-out 0.3s !important;
      }
      .zanzibar-airport-section-visible .zanzibar-airport-image {
        opacity: 1 !important;
        transform: scale(1) !important;
      }

      .zanzibar-airport-content {
        opacity: 0 !important;
        transform: translateY(40px) !important;
        transition: all 0.8s ease-out 0.5s !important;
      }
      .zanzibar-airport-section-visible .zanzibar-airport-content {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .zanzibar-airport-title {
        opacity: 0 !important;
        transform: translateY(-30px) scale(0.9) !important;
        transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s !important;
      }
      .zanzibar-airport-section-visible .zanzibar-airport-title {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }

      .zanzibar-airport-text {
        opacity: 0 !important;
        transform: translateY(20px) !important;
        transition: all 0.6s ease-out 0.9s !important;
      }
      .zanzibar-airport-section-visible .zanzibar-airport-text {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .zanzibar-connections-title {
        opacity: 0 !important;
        transform: translateY(30px) !important;
        transition: all 0.8s ease-out 1.1s !important;
      }
      .zanzibar-airport-section-visible .zanzibar-connections-title {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .zanzibar-cities {
        opacity: 0 !important;
        transform: translateY(50px) !important;
        transition: all 0.8s ease-out 1.3s !important;
      }
      .zanzibar-airport-section-visible .zanzibar-cities {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .zanzibar-city-item {
        opacity: 0 !important;
        transform: translateY(30px) scale(0.9) !important;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      }
      .zanzibar-airport-section-visible .zanzibar-city-item {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }

      /* Airlines Section Animations */
      .zanzibar-airlines-section {
        opacity: 0 !important;
        transform: translateY(80px) !important;
        transition: all 1.2s ease-out 0.2s !important;
      }
      .zanzibar-airlines-section.zanzibar-airlines-section-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .zanzibar-airlines-map {
        opacity: 0 !important;
        transform: translateX(-150px) rotateY(-15deg) scale(0.9) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s !important;
      }
      .zanzibar-airlines-section-visible .zanzibar-airlines-map {
        opacity: 1 !important;
        transform: translateX(0) rotateY(0deg) scale(1) !important;
      }

      .zanzibar-airlines-content {
        opacity: 0 !important;
        transform: translateX(150px) rotateY(15deg) scale(0.9) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s !important;
      }
      .zanzibar-airlines-section-visible .zanzibar-airlines-content {
        opacity: 1 !important;
        transform: translateX(0) rotateY(0deg) scale(1) !important;
      }

      .zanzibar-airline-list {
        opacity: 0 !important;
        transform: translateX(40px) !important;
        transition: all 0.8s ease-out !important;
      }
      .zanzibar-airlines-section-visible .zanzibar-airline-list {
        opacity: 1 !important;
        transform: translateX(0) !important;
      }

      .zanzibar-airline-item {
        opacity: 0 !important;
        transform: translateX(20px) !important;
        transition: all 0.5s ease-out !important;
      }
      .zanzibar-airlines-section-visible .zanzibar-airline-item {
        opacity: 1 !important;
        transform: translateX(0) !important;
      }

      /* Dar Section Animations */
      .zanzibar-dar-section {
        opacity: 0 !important;
        transform: translateY(60px) !important;
        transition: all 1s ease-out 0.2s !important;
      }
      .zanzibar-dar-section.zanzibar-dar-section-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .zanzibar-dar-content {
        opacity: 0 !important;
        transform: translateX(-100px) scale(0.95) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s !important;
      }
      .zanzibar-dar-section-visible .zanzibar-dar-content {
        opacity: 1 !important;
        transform: translateX(0) scale(1) !important;
      }

      .zanzibar-dar-map {
        opacity: 0 !important;
        transform: translateX(100px) scale(0.95) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s !important;
      }
      .zanzibar-dar-section-visible .zanzibar-dar-map {
        opacity: 1 !important;
        transform: translateX(0) scale(1) !important;
      }

      /* Nairobi Section Animations */
      .zanzibar-nairobi-section {
        opacity: 0 !important;
        transform: translateY(60px) !important;
        transition: all 1s ease-out 0.2s !important;
      }
      .zanzibar-nairobi-section.zanzibar-nairobi-section-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .zanzibar-nairobi-map {
        opacity: 0 !important;
        transform: translateX(-100px) rotateY(-10deg) scale(0.95) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s !important;
      }
      .zanzibar-nairobi-section-visible .zanzibar-nairobi-map {
        opacity: 1 !important;
        transform: translateX(0) rotateY(0deg) scale(1) !important;
      }

      .zanzibar-nairobi-content {
        opacity: 0 !important;
        transform: translateX(100px) rotateY(10deg) scale(0.95) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s !important;
      }
      .zanzibar-nairobi-section-visible .zanzibar-nairobi-content {
        opacity: 1 !important;
        transform: translateX(0) rotateY(0deg) scale(1) !important;
      }

      /* Ferry Section Animations */
      .zanzibar-ferry-section {
        opacity: 0 !important;
        transform: translateY(60px) !important;
        transition: all 1s ease-out 0.2s !important;
      }
      .zanzibar-ferry-section.zanzibar-ferry-section-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .zanzibar-ferry-content {
        opacity: 0 !important;
        transform: translateX(-100px) scale(0.95) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s !important;
      }
      .zanzibar-ferry-section-visible .zanzibar-ferry-content {
        opacity: 1 !important;
        transform: translateX(0) scale(1) !important;
      }

      .zanzibar-ferry-map {
        opacity: 0 !important;
        transform: translateX(100px) scale(0.95) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s !important;
      }
      .zanzibar-ferry-section-visible .zanzibar-ferry-map {
        opacity: 1 !important;
        transform: translateX(0) scale(1) !important;
      }

      /* Transfers Section Animations */
      .zanzibar-transfers-section {
        opacity: 0 !important;
        transform: translateY(80px) scale(0.98) !important;
        transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s !important;
      }
      .zanzibar-transfers-section.zanzibar-transfers-section-visible {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1a2b]">
      {/* Hero Section */}
      <section className="relative h-[600px] md:h-[928px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/get-zanzibar/island-sea-with-plane-wing%202.png"
            alt="Zanzibar Island"
            fill
            priority
            loading="eager"
            fetchPriority="high"
            quality={90}
            sizes="100vw"
            className="object-cover"
            style={{ opacity: 1 }}
          />
          <div className="absolute inset-0 bg-[#0a1a2b]/30"></div>
        
        </div>

      
        <div className="absolute bottom-0 left-0 right-0 z-10 text-center text-white px-4 container-xl pb-8 sm:pb-12 md:pb-16 lg:pb-20">
          <div className={`uppercase tracking-[0.25em] text-[14px] md:text-[16px] text-white/80 mb-10 font-poppins transition-all duration-1000 ${showHeading ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
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


      <section ref={(el) => { if (el) sectionRefs.current['airport-section'] = el; }} className={`zanzibar-airport-section ${sectionVisible['airport-section'] ? 'zanzibar-airport-section-visible' : ''}`}>
        <div >
        

       
          <div className="h-[720px] relative overflow-hidden zanzibar-airport-image">
            <Image
              src="/get-zanzibar/image 48.png"
              alt="Zanzibar International Airport"
              fill
              quality={85}
              sizes="100vw"
              className="object-cover"
              priority
            />
          
           

          
            <div className="absolute inset-x-0 top-6 md:top-8 text-center px-4 zanzibar-airport-content">
              <div className="max-w-3xl mx-auto">
                <h2 className="font-poppins font-semibold text-[24px] md:text-[28px] text-[#ff8a00] mb-8 zanzibar-airport-title">
                  Zanzibar International Airport (ZNZ)
                </h2>
                <div className="space-y-1.5 zanzibar-airport-text">
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
            </div>

          
            <div className="absolute inset-x-0 top-[65%] text-center zanzibar-connections-title">
              <h3 className="text-white font-poppins font-semibold text-[22px] md:text-[28px] drop-shadow">
                Daily East African Connections
              </h3>
            </div>

            <div className="absolute inset-x-0 bottom-25 flex flex-wrap justify-center gap-4 zanzibar-cities">
              {["Dar es Salaam","Nairobi","Mombasa","Kilimanjaro","Arusha"].map((city, index) => (
                <div key={city} className="flex items-center gap-2 bg-white text-[#1f2a37] w-[170px] rounded-sm px-5 py-3 shadow zanzibar-city-item" style={{ transitionDelay: `${index * 0.1}s` }}>
                  <Plane size={16} className="text-[#1f5ba0]" />
                  <span className="font-open-sans font-semibold text-[14px]">{city}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    
      <section ref={(el) => { if (el) sectionRefs.current['airlines-section'] = el; }} className={`bg-[#FFFCF6] py-10 zanzibar-airlines-section ${sectionVisible['airlines-section'] ? 'zanzibar-airlines-section-visible' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start">
          
            <div className="w-full overflow-hidden zanzibar-airlines-map">
              <div className="relative w-full h-[620px] md:h-[650px]">
                <Image
                  src="/get-zanzibar/map1.png"
                  alt="Map of Airlines Flying to Zanzibar"
                  fill
                  quality={85}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

          
            <div className="relative bg-[#FFFCF6] zanzibar-airlines-content">
            
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
                  <ul key={idx} className="w-full zanzibar-airline-list" style={{ transitionDelay: `${idx * 0.1}s` }}>
                    {col.map((name, nameIdx) => (
                      <li key={name} className="flex items-center gap-3 py-2 md:py-2.5 border-b border-[#e5e7eb] last:border-0 zanzibar-airline-item" style={{ transitionDelay: `${idx * 0.1 + nameIdx * 0.03}s` }}>
                        <FaPlane size={12} className="text-[#6b7280] -rotate-45" />
                        <span className="font-open-sans text-[13px] md:text-[14px]">{name}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>

              <div className="mt-6">
              <button 
                onClick={() => openMapModal('zanzibarAirport')}
                className="mt-8 inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e67a00] text-white font-quicksand text-[18px] px-5 py-2 rounded-sm shadow transition-colors"
              >
            <TiLocationArrowOutline size={20} className="text-white" />
            View on Map
          </button>
              </div>
            </div>
          </div>
        </div>
      </section>

     
     
  
    <section ref={(el) => { if (el) sectionRefs.current['dar-section'] = el; }} className={`bg-[#FFFCF6] py-12 zanzibar-dar-section ${sectionVisible['dar-section'] ? 'zanzibar-dar-section-visible' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
     
          <div className="order-2 md:order-1 mb-20 zanzibar-dar-content">
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
         
          <button 
            onClick={() => openMapModal('darEsSalaam')}
            className="mt-8 inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e67a00] text-white font-quicksand text-[18px] px-5 py-2 rounded-sm shadow transition-colors"
          >
            <TiLocationArrowOutline size={20} className="text-white" />
            View on Map
          </button>
        </div>
 
      
        <div className="relative order-1 md:order-2 w-full h-[450px] zanzibar-dar-map">
          <Image
            src="/get-zanzibar/map2.png"
            alt="Connecting Airports Map"
            fill
            quality={85}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>

    <section ref={(el) => { if (el) sectionRefs.current['nairobi-section'] = el; }} className={`bg-[#FFFCF6] py-12 zanzibar-nairobi-section ${sectionVisible['nairobi-section'] ? 'zanzibar-nairobi-section-visible' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      
        <div className="relative w-full h-[583px] order-1 zanzibar-nairobi-map">
          <Image
            src="/get-zanzibar/map3.png"
            alt="Connecting Airports Map"
            fill
            quality={85}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      
        <div className="order-2 zanzibar-nairobi-content">
         
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

         
          <button 
            onClick={() => openMapModal('nairobi')}
            className="mt-8 inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e67a00] text-white font-quicksand text-[18px] px-5 py-2 rounded-sm shadow transition-colors"
          >
            <TiLocationArrowOutline size={20} className="text-white" />
            View on Map
          </button>
        </div>
      </div>
    </section>

    <section ref={(el) => { if (el) sectionRefs.current['ferry-section'] = el; }} className={`bg-[#FFFCF6] py-12 zanzibar-ferry-section ${sectionVisible['ferry-section'] ? 'zanzibar-ferry-section-visible' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
       
        <div className="order-2 md:order-1 mb-20 zanzibar-ferry-content">
        
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
          
         
          <button 
            onClick={() => openMapModal('ferry')}
            className="mt-8 inline-flex items-center gap-3 bg-[#FF6A00] hover:bg-[#e67a00] text-white font-quicksand text-[18px] px-5 py-2 rounded-sm shadow transition-colors"
          >
            <TiLocationArrowOutline size={20} className="text-white" />
            View on Map
          </button>
        </div>
       
        <div className="relative order-1 md:order-2 w-full h-[500px] zanzibar-ferry-map">
          <Image
            src="/get-zanzibar/map4.png"
            alt="Ferry Map"
            fill
            quality={85}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>

  
    <div ref={(el) => { if (el) sectionRefs.current['transfers-section'] = el; }} className={`zanzibar-transfers-section ${sectionVisible['transfers-section'] ? 'zanzibar-transfers-section-visible' : ''}`}>
      <TransfersSection />
    </div>

    {/* Map Modal */}
    {mapModal.location && (
      <MapModal
        isOpen={mapModal.isOpen}
        onClose={closeMapModal}
        location={mapModal.location}
      />
    )}

    </div>
  );
}
