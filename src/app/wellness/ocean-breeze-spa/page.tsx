"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiArrowRight } from "react-icons/fi";

export default function OceanBreezeSpaPage() {
  return (
    <>
      <Header />
      <main className="w-full max-w-full bg-[#FFFCF6] font-open-sans relative overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative w-full h-[520px] md:h-[800px] lg:h-[1018px] overflow-hidden">
          <Image
            src="/spa_hero.png"
            alt="Spa Hero Background"
            fill
            priority
            className="object-cover"
          />
          
          {/* Gradient Overlays */}
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "linear-gradient(180deg, rgba(255, 252, 246, 0) 82%, rgba(255, 252, 246, 1) 100%)"
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "linear-gradient(2deg, rgba(0, 0, 0, 0) 73%, rgba(0, 0, 0, 1) 98%)"
            }}
          />
        </section>

        {/* Title Section */}
        <section className="relative w-full px-4 md:px-0 pt-8 md:pt-12">
          <div className="relative z-10 w-full max-w-[1596px] mx-auto">
            <div className="flex flex-col items-center px-4 md:px-0">
              <h2 className="text-[#554019] text-[20px] md:text-[22px] lg:text-[24px] font-semibold leading-[1.125] font-open-sans text-center mb-[15px] max-w-[558px]">
                Where the Ocean Breeze Meets Total Relaxation
              </h2>
              <p className="text-[#423B2D] text-[14px] md:text-[15px] lg:text-[16px] font-normal leading-[1.6875] font-open-sans text-center max-w-[742px]">
                Indulge in a sanctuary of calm at Sultan Palace Spa, where ancient Swahili wellness traditions blend with modern luxury. Each treatment is designed to restore balance, rejuvenate the body, and elevate the spirit.
              </p>
            </div>
          </div>
        </section>

        {/* Treatment Cards Section */}
        <section className="relative w-full px-4 md:px-0 mt-8 md:mt-12 lg:mt-16">
          <div className="relative z-10 w-full max-w-[1596px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-2 md:px-3 lg:px-4">
              {[
                { 
                  title: "Island Harmony Ritual", 
                  desc: "Mind and body renewal through aromatherapy and gentle rhythmic strokes.", 
                  image: "/spa_treatment_1.png" 
                },
                { 
                  title: "Ocean Breeze Detox", 
                  desc: "Cleanse and rejuvenate your body with sea salt and herbal wraps.", 
                  image: "/spa_treatment_2-7c5567.png" 
                },
                { 
                  title: "Tropical Rainforest Massage", 
                  desc: "Relax with exotic oils inspired by Zanzibar's lush forest aromas.", 
                  image: "/spa_treatment_3.png" 
                },
                { 
                  title: "Golden Sunset Therapy", 
                  desc: "Warm stone massage infused with calming spices to ease tension.", 
                  image: "/spa_treatment_4.png" 
                }
              ].map((treatment, i) => (
                <div 
                  key={i} 
                  className="w-full overflow-hidden group cursor-pointer transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="relative w-full h-[320px] sm:h-[380px] md:h-[500px] overflow-hidden">
                    <Image 
                      src={treatment.image} 
                      alt={treatment.title} 
                      fill 
                      className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
                    />
                    {/* Overlay gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="flex flex-col items-center gap-[13px] pt-[13px] pb-4 transition-all duration-300">
                    <h3 className="text-[#2A2824] text-[18px] md:text-[19px] lg:text-[20px] font-semibold leading-[1.35] text-center font-open-sans px-2 group-hover:text-[#FF6A00] transition-colors duration-300">
                      {treatment.title}
                    </h3>
                    <p className="text-[#655D4E] text-[14px] md:text-[15px] lg:text-[16px] leading-[1.6875] text-center font-open-sans max-w-[332px] px-3 group-hover:text-[#2A2824] transition-colors duration-300">
                      {treatment.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portrait Image and Text Section */}
        <section className="relative w-full px-4 md:px-0 mt-12 md:mt-16 lg:mt-20">
          <div className="relative z-10 w-full max-w-[1596px] mx-auto">
            <div className="relative px-4 md:px-0">
              {/* Mobile/Tablet Layout */}
              <div className="block lg:hidden grid grid-cols-1 gap-8 items-start">
                <div className="relative w-full h-[300px] md:h-[450px] order-2">
                  <Image 
                    src="/spa_portrait-62b712.png" 
                    alt="Spa Portrait" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="flex flex-col gap-[43px] order-1 px-4">
                  <div className="flex flex-col gap-[43px]">
                    <h2 className="text-[#423B2D] text-[28px] md:text-[34px] font-semibold leading-[0.675] font-open-sans">
                      Your Island Escape Awaits
                    </h2>
                    <p className="text-[#000000] text-[16px] md:text-[17px] font-normal leading-[2.277] font-open-sans">
                      exotic aromas, and luxurious treatments restore your body, calm your mind, and leave you feeling completely renewed in Zanzibar&apos;s serene beauty.
                    </p>
                  </div>
                  <Link
                    href="#"
                    className="inline-flex items-center justify-center gap-[10px] bg-[#FF6A00] hover:opacity-95 transition-opacity text-white px-[10px] py-[10px] rounded-[6px] text-[16px] md:text-[17px] font-medium leading-[1.944] font-quicksand w-fit h-[42px] shadow-md"
                    aria-label="Booking Enquiry"
                  >
                    Booking Enquiry
                    <FiArrowRight size={23} className="text-white" strokeWidth={1.3} />
                  </Link>
                </div>
              </div>
              
              {/* Desktop Layout - Exact Figma Positioning */}
              <div className="hidden lg:block relative w-full min-h-[594px]">
                {/* Portrait Image - Position (180, 0) */}
                <div className="absolute left-[100px] top-0 w-[558px] h-[594px]">
                  <Image 
                    src="/spa_portrait-62b712.png" 
                    alt="Spa Portrait" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                
                {/* Text Section - Position (766, 0) */}
                <div className="absolute left-[766px] top-0 w-[536px]">
                  <div className="flex flex-col gap-[43px]">
                    <div className="flex flex-col gap-[43px]">
                      <h2 className="text-[#423B2D] text-[40px] font-semibold leading-[0.675] font-open-sans">
                        Your Island Escape Awaits
                      </h2>
                      <p className="text-[#000000] text-[18px] font-normal leading-[2.277] font-open-sans">
                        exotic aromas, and luxurious treatments restore your body, calm your mind, and leave you feeling completely renewed in Zanzibar&apos;s serene beauty.
                      </p>
                    </div>
                    <Link
                      href="#"
                      className="inline-flex items-center justify-center gap-[10px] bg-[#FF6A00] hover:opacity-95 transition-opacity text-white px-[10px] py-[10px] rounded-[6px] text-[18px] font-medium leading-[1.944] font-quicksand w-fit h-[42px] shadow-md"
                      aria-label="Booking Enquiry"
                    >
                      Booking Enquiry
                      <FiArrowRight size={23} className="text-white" strokeWidth={1.3} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="relative w-full mt-12 md:mt-16 lg:mt-20">
          <div className="relative w-full h-[300px] md:h-[500px] lg:h-[672px]">
            <Image 
              src="/spa_video_bg.png" 
              alt="Video Background" 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-black/20"></div>
            
            {/* Play Button */}
            <button
              aria-label="Play Spa Video"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[52px] h-[52px] md:w-[66px] md:h-[66px] lg:w-[72px] lg:h-[72px] rounded-full bg-white grid place-items-center shadow-lg z-20 hover:scale-110 transition-transform"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="md:w-[24] md:h-[24] lg:w-[24] lg:h-[24]"
              >
                <path 
                  d="M8 5v14l11-7L8 5z" 
                  fill="#242424"
                />
              </svg>
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}