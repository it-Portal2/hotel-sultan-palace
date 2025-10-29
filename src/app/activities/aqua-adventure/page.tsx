"use client";
/* eslint-disable react/no-unescaped-entities */
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiArrowRight } from "react-icons/fi";

export default function AquaAdventurePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans">
        {/* Hero Section */}
        <section className="relative w-full h-[560px] md:h-[700px] lg:h-[977px] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/aqua-adventure/hero-bg.png"
              alt="Aqua Adventure Hero"
              fill
              priority
              className="object-cover"
            />
          </div>
        
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "linear-gradient(0deg, rgba(0, 0, 0, 0) 46%, rgba(0, 0, 0, 0.23) 80%, rgba(0, 0, 0, 1) 98%)"
            }}
          />
          {/* Hero text overlay */}
          <div className="absolute inset-0 z-20 flex items-end justify-center pb-50 md:pb-60 lg:pb-70">
            <div className="w-full max-w-[800px] px-4 text-center space-y-3 md:space-y-4">
              <h1 className="text-white text-[20px] md:text-[30px] lg:text-[40px] font-bold leading-[1.25] font-quicksand" style={{ textShadow: '0px 4px 19.4px rgba(0, 0, 0, 0.25)' }}>
                <span 
                  className="inline-block"
                  style={{
                    animation: 'slideInRight 1s ease-out 0.2s forwards',
                    opacity: 0,
                    transform: 'translateX(100px)'
                  }}
                >
                  Discover the Magic Beneath Zanzibar's{' '}
                </span>
                <span 
                  className="inline-block"
                  style={{
                    animation: 'slideInLeft 1s ease-out 0.5s forwards',
                    opacity: 0,
                    transform: 'translateX(-100px)'
                  }}
                >
                  Blue Horizon
                </span>
              </h1>
             
            </div>
          </div>
      
        </section>

       
       

      
        
         <div className="relative mb-2 min-h-[1100px] ">
            
         <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <Image
                  src="/aqua-adventure/beach-bg.png"
                  alt="Cards Background"
                 fill
                 priority
                 quality={100}
                 sizes="100vw"
                 className="object-cover object-center"
                />
              </div>
            
           
              
             <div className="relative z-10  py-8 md:py-12 ">
                {/* Main Heading */}
                <h2 className="text-[#242424] text-[32px] md:text-[36px] lg:text-[40px] font-semibold leading-[1.25] font-quicksand ml-10 text-left">
                  Where the Sultan's Spirit Meets the Sea
                </h2>
                
                {/* Card 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-15 mb-8 lg:mb-12 relative">
                  <div className="relative rounded-r-[14px] overflow-hidden lg:mt-[92px]">
                      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[524px]">
                        <Image
                          src="/aqua-adventure/kite-surfing.png"
                          alt="Kite Surfing"
                          fill
                          className="object-cover rounded-r-[14px]"
                        />
                      </div>
                    </div>
                    <div className="relative lg:mt-[92px]">
                      <div className="p-6 md:p-8">
                        <div className="flex flex-col gap-6 md:gap-8">
                          <div className="flex flex-col gap-7 md:gap-8">
                            <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand">
                              Coral Reef Exploration
                            </h3>
                            <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand max-w-[546px]" style={{ letterSpacing: '0.01em' }}>
                              Join our guided reef walks and witness the colorful life thriving beneath the surface. Led by marine experts, this gentle ocean safari reveals intricate coral formations, rare shells, and dazzling tropical fish — a serene and educational encounter with Zanzibar's marine treasure
                            </p>
                          </div>
                          <Link 
                            href="#"
                            className="flex items-center gap-4 w-fit group"
                          >
                            <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">
                              Begin Adventure
                            </span>
                            <FiArrowRight size={22} className="text-[#FF6A00]" />
                          </Link>
                        </div>
                      </div>
                    </div>
                   
                  </div>

                  {/* Card 2*/}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
                    <div className="relative lg:mt-[92px] order-2 lg:order-1">
                      <div className="p-6 md:p-8 mt-[-92px]">
                        <div className="flex flex-col gap-6 md:gap-8">
                          <div className="flex flex-col gap-7 md:gap-8">
                            <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand">
                              Kite Surfing
                            </h3>
                            <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand max-w-[546px]" style={{ letterSpacing: '0.01em' }}>
                              Harness the ocean breeze and ride the sparkling waves across Zanzibar's turquoise lagoon. Our professional instructors provide lessons for beginners and pros alike, ensuring safety, fun, and pure exhilaration as you glide beneath the African sun.
                            </p>
                          </div>
                          <Link 
                            href="#"
                            className="flex items-center gap-4 w-fit group"
                          >
                            <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">
                              Begin Adventure
                            </span>
                            <FiArrowRight size={22} className="text-[#FF6A00]" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="relative rounded-l-[14px] overflow-hidden lg:-mt-[120px] order-1 lg:order-2 z-10">
                      <div className="relative w-full h-[420px] md:h-[540px] lg:h-[600px]">
                        <Image
                          src="/aqua-adventure/sailing-1.png"
                          alt="Sailing"
                          fill
                          className="object-cover rounded-l-[14px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12 relative">
                    <div className="relative rounded-r-[14px] overflow-hidden lg:-mt-[100px] order-1 z-10">
                      <div className="relative w-full h-[420px] md:h-[540px] lg:h-[600px]">
                        <Image
                          src="/aqua-adventure/sailing-2.png"
                          alt="Sailing"
                          fill
                          className="object-cover rounded-r-[14px]"
                        />
                      </div>
                    </div>
                    <div className="relative rounded-l-[14px] lg:mt-[92px] order-2">
                      <div className="p-6 md:p-8 rounded-l-[14px]">
                        <div className="flex flex-col gap-6 md:gap-8">
                          <div className="flex flex-col gap-7 md:gap-8">
                            <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand">
                              Sailing
                            </h3>
                            <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand max-w-[546px]" style={{ letterSpacing: '0.01em' }}>
                              Experience the timeless joy of sailing over calm, azure waters. Whether joining a guided expedition or steering a Hobie Cat yourself, each journey offers freedom, adventure, and breathtaking views of Zanzibar's endless blue horizon.
                            </p>
                          </div>
                          <Link 
                            href="#"
                            className="flex items-center gap-4 w-fit group"
                          >
                            <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">
                              Begin Adventure
                            </span>
                            <FiArrowRight size={22} className="text-[#FF6A00]" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          

        <section className="relative w-full h-[600px] md:h-[750px] lg:h-[830px] mt-[-32px] overflow-hidden">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/aqua-adventure/dhow-excursions.png"
                  alt="Dhow Excursions"
                  fill
                  className="object-cover"
                />
              </div>
              <div 
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  background: "linear-gradient(181deg, rgba(0, 0, 0, 0) 64%, rgba(0, 0, 0, 1) 82%)"
                }}
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-end items-center pb-12 md:pb-16 px-4">
                <div className="flex flex-col gap-2 md:gap-7 max-w-[946px] text-center">
                  <div className="flex flex-col gap-7 md:gap-8">
                    <h3 className="text-white text-[22px] md:text-[26px] font-semibold leading-[1.25] font-quicksand">
                      Dhow Excursions
                    </h3>
                    <p className="text-white text-[14px] md:text-[16px] font-normal leading-[1.8125] font-quicksand">
                      Set sail aboard a handcrafted Swahili dhow for a magical coastal journey. Drift through mangrove lagoons, try traditional hand-line fishing, and witness a golden sunset painting the sea — a moment of pure island serenity and tradition combined.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <Link 
                      href="#"
                      className="flex items-center gap-4 w-fit group"
                    >
                      <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">
                        Begin Adventure
                      </span>
                      <FiArrowRight size={22} className="text-[#FF6A00]" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

    
           

        <div className="relative mb-2">
            <div className="relative max-w-[1400px] ">
              <div className="absolute inset-0 z-0 rounded-r-[14px] overflow-hidden">
                <Image
                  src="/aqua-adventure/dock-bg.png"
                  alt="Cards Background"
                  fill
                  priority
                  quality={100}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              
              <div className="relative z-10  py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12 relative">
                  <div className="relative rounded-r-[14px] overflow-hidden lg:mt-[92px]">
                    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[524px]">
                      <Image
                        src="/aqua-adventure/kayaking.png"
                        alt="Beach Walking"
                        fill
                        className="object-cover rounded-r-[14px]"
                      />
                    </div>
                  </div>
                  <div className="relative lg:mt-[92px]">
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col gap-6 md:gap-8">
                        <div className="flex flex-col gap-7 md:gap-8">
                          <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand">
                            Beach Walking
                          </h3>
                          <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand max-w-[546px]" style={{ letterSpacing: '0.01em' }}>
                            Discover the beauty of Bwejuu Beach on foot. Stroll along powder-soft sands, watch seabirds dance over gentle tides, or join a friendly game by the shore. A simple walk here becomes an unforgettable communion with Zanzibar's peaceful nature.
                          </p>
                        </div>
                        <Link 
                          href="#"
                          className="flex items-center gap-4 w-fit group"
                        >
                          <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">
                            Begin Adventure
                          </span>
                          <FiArrowRight size={22} className="text-[#FF6A00]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
                  <div className="relative lg:mt-[92px] order-2 lg:order-1">
                    <div className="p-6 md:p-8 mt-[-70px]">
                      <div className="flex flex-col gap-6 md:gap-8">
                        <div className="flex flex-col gap-7 md:gap-8">
                          <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand">
                            Kayaking
                          </h3>
                          <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand max-w-[546px]" style={{ letterSpacing: '0.01em' }}>
                            Glide across calm waters in our sleek sea kayaks and uncover hidden corners of the coastline. Paddle past swaying palms, listen to the rhythm of the waves, and enjoy a tranquil yet invigorating way to explore the island's coastal charm.
                          </p>
                        </div>
                        <Link 
                          href="#"
                          className="flex items-center gap-4 w-fit group"
                        >
                          <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">
                            Begin Adventure
                          </span>
                          <FiArrowRight size={22} className="text-[#FF6A00]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="relative rounded-l-[14px] overflow-hidden lg:-mt-[120px] order-1 lg:order-2 z-10">
                    <div className="relative w-full h-[420px] md:h-[540px] lg:h-[600px]">
                      <Image
                        src="/aqua-adventure/snorkelling-1.png"
                        alt="Kayaking"
                        fill
                        className="object-cover rounded-l-[14px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3 - Snorkelling: Image first, then Text */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12 relative">
                  <div className="relative rounded-r-[14px] overflow-hidden lg:-mt-[100px] order-1 z-10">
                    <div className="relative w-full h-[420px] md:h-[540px] lg:h-[600px]">
                      <Image
                        src="/aqua-adventure/snorkelling-2.png"
                        alt="Snorkelling"
                        fill
                        className="object-cover rounded-r-[14px]"
                      />
                    </div>
                  </div>
                  <div className="relative rounded-l-[14px] lg:mt-[92px] order-2">
                    <div className="p-6 md:p-8 rounded-l-[14px]">
                      <div className="flex flex-col gap-6 md:gap-8">
                        <div className="flex flex-col gap-7 md:gap-8">
                          <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand">
                            Snorkelling
                          </h3>
                          <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand max-w-[546px]" style={{ letterSpacing: '0.01em' }}>
                            Experience the timeless joy of sailing over calm, azure waters. Whether joining a guided expedition or steering a Hobie Cat yourself, each journey offers freedom, adventure, and breathtaking views of Zanzibar's endless blue horizon.
                          </p>
                        </div>
                        <Link 
                          href="#"
                          className="flex items-center gap-4 w-fit group"
                        >
                          <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">
                            Begin Adventure
                          </span>
                          <FiArrowRight size={22} className="text-[#FF6A00]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        
      </main>
      <Footer />
    </>
  );
}

