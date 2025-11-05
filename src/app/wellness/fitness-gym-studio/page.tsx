"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiArrowRight } from "react-icons/fi";

export default function FitnessGymStudioPage() {
  return (
    <>
      <Header />
      <main className="w-full max-w-full bg-[#FFFCF6] font-open-sans relative overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative w-full h-[520px] md:h-[800px] lg:h-[1018px] overflow-hidden">
          <Image 
            src="/gym_hero_overlay.png" 
            alt="Gym Hero Background" 
            fill 
            priority
            className="object-cover" 
          />
          
          {/* Gradient Overlays */}
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0) 77%, rgba(255, 255, 255, 0.83) 90%, rgba(255, 255, 255, 1) 100%)"
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "linear-gradient(0deg, rgba(0, 0, 0, 0) 85%, rgba(0, 0, 0, 1) 93%)"
            }}
          />
        </section>

        {/* Title Section */}
        <section className="relative w-full px-4 md:px-0 pt-8 md:pt-12">
          <div className="relative z-10 w-full max-w-[1596px] mx-auto">
            <div className="flex flex-col items-center px-4 md:px-0">
              <h2 className="text-[#554019] text-[20px] md:text-[22px] lg:text-[24px] font-semibold leading-[1.125] font-open-sans text-center mb-[15px] max-w-[509px]">
                Elevate Your Energy in a World-Class Setting
              </h2>
              <p className="text-[#423B2D] text-[14px] md:text-[15px] lg:text-[16px] font-normal leading-[1.6875] font-open-sans text-center max-w-[742px]">
                Stay active during your stay at Sultan Palace Hotel, where our fully equipped fitness center blends cutting-edge technology with stunning ocean or garden views. Designed for both beginners and seasoned athletes, the gym inspires wellness, energy, and vitality.
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
                  title: "Cardio Zone", 
                  desc: "Treadmills, ellipticals, stationary bikes, and rowing machines for a full cardiovascular workout.", 
                  image: "/gym_cardio.png",
                  descWidth: "290px"
                },
                { 
                  title: "Strength & Conditioning", 
                  desc: "Free weights, resistance machines, and functional training equipment to tone and sculpt every muscle group.", 
                  image: "/gym_strength.png",
                  descWidth: "290px"
                },
                { 
                  title: "Personal Training", 
                  desc: "Certified trainers available for customized workouts, guidance, and wellness advice.", 
                  image: "/gym_personal-56fd99.png",
                  descWidth: "290px"
                },
                { 
                  title: "Yoga & Stretching Area", 
                  desc: "A quiet corner for mindful movement, stretching, or guided yoga sessions.", 
                  image: "/gym_yoga.png",
                  descWidth: "244px"
                }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="w-full overflow-hidden group cursor-pointer transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="relative w-full h-[300px] sm:h-[360px] md:h-[400px] lg:h-[500px] overflow-hidden">
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      fill 
                      className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
                    />
                    {/* Overlay gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="flex flex-col items-center gap-[13px] pt-[13px] pb-4 px-[19px] transition-all duration-300">
                    <h3 className="text-[#2A2824] text-[18px] md:text-[19px] lg:text-[20px] font-semibold leading-[1.35] text-center font-open-sans group-hover:text-[#FF6A00] transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p 
                      className="text-[#655D4E] text-[14px] md:text-[15px] lg:text-[16px] leading-[1.6875] text-center font-open-sans max-w-[290px] group-hover:text-[#2A2824] transition-colors duration-300"
                      style={{ maxWidth: item.descWidth }}
                    >
                      {item.desc}
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
                <div className="relative w-full h-[360px] md:h-[500px] order-2">
                  <Image 
                    src="/gym_portrait.png" 
                    alt="Gym Portrait" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="flex flex-col gap-[43px] order-1 px-4">
                  <div className="flex flex-col gap-[43px]">
                    <h2 className="text-[#423B2D] text-[28px] md:text-[34px] font-semibold leading-[0.675] font-open-sans">
                      Strength Meets Luxury
                    </h2>
                    <div className="space-y-4 text-[#000000] text-[16px] md:text-[17px] font-normal leading-[2.277] font-open-sans">
                      <p>
                        Combine your fitness routine with refreshing views, natural light, and motivational music. Whether you&apos;re maintaining your workout schedule or exploring new fitness practices, the gym supports your health journey in style.
                      </p>
                      <p>Stay active, stay inspired, and embrace wellness on every level.</p>
                    </div>
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
              <div className="hidden lg:block relative w-full min-h-[718px]">
                {/* Portrait Image - Position (-36, 0) - adjusted to left edge */}
                <div className="absolute left-0 top-0 w-[713px] h-[718px]">
                  <Image 
                    src="/gym_portrait.png" 
                    alt="Gym Portrait" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                
                {/* Text Section - Position (766, 0) */}
                <div className="absolute left-[766px] top-0 w-[536px]">
                  <div className="flex flex-col gap-[43px]">
                    <div className="flex flex-col gap-[43px]">
                      <h2 className="text-[#423B2D] text-[40px] font-semibold leading-[0.675] font-open-sans">
                        Strength Meets Luxury
                      </h2>
                      <div className="space-y-4 text-[#000000] text-[18px] font-normal leading-[2.277] font-open-sans">
                        <p>
                          Combine your fitness routine with refreshing views, natural light, and motivational music. Whether you&apos;re maintaining your workout schedule or exploring new fitness practices, the gym supports your health journey in style.
                        </p>
                        <p>Stay active, stay inspired, and embrace wellness on every level.</p>
                      </div>
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
              src="/gym_video_bg.png" 
              alt="Video Background" 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-black/62"></div>
            
            {/* Play Button */}
            <button
              aria-label="Play Gym Video"
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