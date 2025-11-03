"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiArrowRight } from "react-icons/fi";

export default function AquaAdventurePage() {
  return (
    <>
      <Header />
      {/* Hero Section - Full Width - Forced */}
      <section 
        className="h-[560px] md:h-[700px] lg:h-[951px] overflow-hidden"
        style={{
          position: 'relative',
          width: '100vw',
          maxWidth: 'none',
          marginLeft: 'calc(50% - 50vw)',
          marginRight: 'calc(50% - 50vw)',
          paddingLeft: 0,
          paddingRight: 0
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            width: '100vw',
            minWidth: '100vw',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw'
          }}
        >
            <Image
            src="/aqua-adventure/hero.png"
            alt="Aqua Adventure Hero Background"
              fill
              priority
              className="object-cover"
            sizes="100vw"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            />
          </div>
        {/* Gradient Overlays */}
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "linear-gradient(0deg, rgba(0, 0, 0, 0) 46%, rgba(0, 0, 0, 0.23) 80%, rgba(0, 0, 0, 1) 98%)"
            }}
          />
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: "linear-gradient(180deg, rgba(255, 252, 246, 0) 78%, rgba(255, 252, 246, 1) 100%)"
          }}
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 z-[25] pointer-events-none">
          <div className="text-center max-w-[680px]">
            <h1 
              className="text-[#FFFFFF] text-3xl md:text-4xl lg:text-[48px] font-semibold leading-[1.56] tracking-[0.05em] drop-shadow-[0px_4px_26.4px_rgba(0,0,0,0.69)] font-quicksand"
              style={{
                animation: 'fadeInUp 1s ease-out forwards, textGlow 3s ease-in-out infinite 1s',
              }}
            >
                <span 
                  className="inline-block"
                  style={{
                  background: 'linear-gradient(90deg, #FFFFFF 0%, #E0F2FE 50%, #FFFFFF 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 3s ease-in-out infinite',
                  display: 'inline-block',
                }}
              >
                Discover the Magic Beneath
                </span>
              <br />
                <span 
                  className="inline-block"
                  style={{
                  background: 'linear-gradient(90deg, #FFFFFF 0%, #E0F2FE 50%, #FFFFFF 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 3s ease-in-out infinite 0.5s',
                  display: 'inline-block',
                }}
              >
                Zanzibar&apos;s Blue Horizon
                </span>
              </h1>
            </div>
          </div>
      
        <style dangerouslySetInnerHTML={{__html: `
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
          
          @keyframes shimmer {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          @keyframes textGlow {
            0%, 100% {
              text-shadow: 0px 4px 26.4px rgba(0,0,0,0.69), 0 0 20px rgba(255,255,255,0.1);
            }
            50% {
              text-shadow: 0px 4px 26.4px rgba(0,0,0,0.69), 0 0 30px rgba(255,255,255,0.3);
            }
          }
        `}} />
      </section>
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans overflow-x-hidden">

        {/* Main Content Section with Background */}
        <div className="relative w-full bg-[#FFFCF6]">
          {/* Background Image - Positioned as per Figma */}
          <div className="absolute left-0 right-0 top-0 w-full" style={{ height: '1622px' }}>
                <Image
                  src="/aqua-adventure/beach-bg.png"
              alt="Beach Background"
                 fill
                 priority
              className="object-cover object-left"
                 sizes="100vw"
                />
              </div>
            
          {/* Content Container - Reduced padding for edge-to-edge */}
          <div className="relative z-10 w-full overflow-x-hidden">
            {/* Title: Where the Sultan's Spirit Meets the Sea */}
            <div className="px-4 md:px-6 lg:px-6 pt-16 md:pt-20 lg:pt-24 pb-12 md:pb-16">
              <h2 className="text-[#242424] text-[28px] md:text-[36px] lg:text-[40px] font-semibold leading-[1.25] font-quicksand" style={{ width: '750px', maxWidth: '100%' }}>
                Where the Sultan&apos;s Spirit Meets the Sea
                </h2>
            </div>

            {/* Activities Section - Mobile: Stack, Desktop: Absolute Positioned */}
            <div className="relative px-4 md:px-6 min-h-[1067px] lg:min-h-[1485px] py-8 md:py-12 lg:py-16">
              {/* Mobile Layout */}
              <div className="block lg:hidden space-y-12 md:space-y-16">
                {/* Coral Reef Exploration - Mobile */}
                <div className="pt-4 pb-4">
                  <div className="relative w-full h-[220px] sm:h-[260px] md:h-[400px] rounded-r-[14px] overflow-hidden mb-6 group/image">
                        <Image
                          src="/aqua-adventure/kite-surfing.png"
                      alt="Coral Reef Exploration"
                      fill
                      className="object-cover rounded-r-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                    />
                  </div>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[22px] md:text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                        Coral Reef Exploration
                      </h3>
                      <p className="text-[#1A1711] text-[18px] md:text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ letterSpacing: '0.01em' }}>
                        Join our guided reef walks and witness the colorful life thriving beneath the surface. Led by marine experts, this gentle ocean safari reveals intricate coral formations, rare shells, and dazzling tropical fish — a serene and educational encounter with Zanzibar&apos;s marine treasure
                      </p>
                    </div>
                    <Link 
                      href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                    >
                      <span className="text-[#FF6A00] text-[14px] md:text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]">
                        Begin Adventure
                      </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                    </Link>
                  </div>
                </div>

                {/* Kite Surfing - Mobile */}
                <div className="pt-4 pb-4">
                  <div className="relative w-full h-[220px] sm:h-[260px] md:h-[400px] rounded-l-[14px] overflow-hidden mb-6 group/image">
                    <Image
                      src="/aqua-adventure/sailing-1.png"
                          alt="Kite Surfing"
                          fill
                      className="object-cover rounded-l-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                        />
                      </div>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[22px] md:text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                        Kite Surfing
                      </h3>
                      <p className="text-[#1A1711] text-[18px] md:text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ letterSpacing: '0.01em' }}>
                        Harness the ocean breeze and ride the sparkling waves across Zanzibar&apos;s turquoise lagoon. Our professional instructors provide lessons for beginners and pros alike, ensuring safety, fun, and pure exhilaration as you glide beneath the African sun.
                      </p>
                    </div>
                    <Link 
                      href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                    >
                      <span className="text-[#FF6A00] text-[14px] md:text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]">
                        Begin Adventure
                      </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                    </Link>
                  </div>
                </div>

                {/* Sailing - Mobile */}
                <div className="pt-4 pb-4">
                  <div className="relative w-full h-[220px] sm:h-[280px] md:h-[420px] rounded-l-[14px] overflow-hidden mb-6 group/image">
                    <Image
                      src="/aqua-adventure/sailing-2.png"
                      alt="Sailing"
                      fill
                      className="object-cover rounded-l-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                    />
                    </div>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[22px] md:text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                        Sailing
                            </h3>
                      <p className="text-[#1A1711] text-[18px] md:text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ letterSpacing: '0.01em' }}>
                        Experience the timeless joy of sailing over calm, azure waters. Whether joining a guided expedition or steering a Hobie Cat yourself, each journey offers freedom, adventure, and breathtaking views of Zanzibar&apos;s endless blue horizon.
                            </p>
                          </div>
                          <Link 
                            href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                          >
                      <span className="text-[#FF6A00] text-[14px] md:text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]">
                              Begin Adventure
                            </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                          </Link>
                        </div>
                      </div>
                    </div>
                   
              {/* Desktop Layout - Absolute Positioned - Edge to Edge */}
              <div className="hidden lg:block relative w-full" style={{ height: '1485px', overflow: 'visible' }}>
                {/* Row 1: Coral Reef Exploration - Image Left, Text Right */}
                {/* First Image - Left edge aligned */}
                <div className="absolute left-0 top-[92px] group/image" style={{ width: '785px', height: '524px' }}>
                  <div className="relative w-full h-full rounded-[14px] overflow-hidden">
                    <Image
                      src="/aqua-adventure/kite-surfing.png"
                      alt="Coral Reef Exploration"
                      fill
                      className="object-cover rounded-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                      priority
                    />
                  </div>
                </div>

                {/* Coral Reef Text - To the right of first image */}
                <div className="absolute left-[820px] top-[92px]" style={{ width: '571px' }}>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                        Coral Reef Exploration
                      </h3>
                      <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ width: '546px', letterSpacing: '0.01em' }}>
                        Join our guided reef walks and witness the colorful life thriving beneath the surface. Led by marine experts, this gentle ocean safari reveals intricate coral formations, rare shells, and dazzling tropical fish — a serene and educational encounter with Zanzibar&apos;s marine treasure
                      </p>
                    </div>
                    <Link 
                      href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                    >
                      <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]" style={{ letterSpacing: '0.01em' }}>
                        Begin Adventure
                      </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                    </Link>
                  </div>
                  </div>

                {/* Row 2: Kite Surfing - Text Left, Image Right */}
                {/* Kite Surfing Text - Left side */}
                <div className="absolute left-[40px] top-[674px]" style={{ width: '571px' }}>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                              Kite Surfing
                            </h3>
                      <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ width: '546px', letterSpacing: '0.01em' }}>
                        Harness the ocean breeze and ride the sparkling waves across Zanzibar&apos;s turquoise lagoon. Our professional instructors provide lessons for beginners and pros alike, ensuring safety, fun, and pure exhilaration as you glide beneath the African sun.
                            </p>
                          </div>
                          <Link 
                            href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                          >
                      <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]" style={{ letterSpacing: '0.01em' }}>
                              Begin Adventure
                            </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                          </Link>
                        </div>
                      </div>

                {/* Second Image - Right edge aligned */}
                <div className="absolute right-0 top-[487px] group/image" style={{ width: '785px', height: '580px' }}>
                  <div className="relative w-full h-full rounded-[14px] overflow-hidden">
                        <Image
                          src="/aqua-adventure/sailing-1.png"
                      alt="Kite Surfing"
                          fill
                      className="object-cover rounded-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                        />
                    </div>
                  </div>

                {/* Row 3: Sailing - Image Left, Text Right */}
                {/* Third Image - Left edge aligned */}
                <div className="absolute left-0 top-[1010px] group/image" style={{ width: '785px', height: '475px' }}>
                  <div className="relative w-full h-full rounded-[14px] overflow-hidden">
                        <Image
                          src="/aqua-adventure/sailing-2.png"
                          alt="Sailing"
                          fill
                      className="object-cover rounded-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                        />
                      </div>
                    </div>

                {/* Sailing Text - Right side */}
                <div className="absolute left-[820px] top-[1167px]" style={{ width: '571px' }}>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                              Sailing
                            </h3>
                      <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ width: '546px', letterSpacing: '0.01em' }}>
                        Experience the timeless joy of sailing over calm, azure waters. Whether joining a guided expedition or steering a Hobie Cat yourself, each journey offers freedom, adventure, and breathtaking views of Zanzibar&apos;s endless blue horizon.
                            </p>
                          </div>
                          <Link 
                            href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                          >
                      <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]" style={{ letterSpacing: '0.01em' }}>
                              Begin Adventure
                            </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          
        {/* Dhow Excursions Full Width Section */}
        <section className="relative w-full h-[500px] md:h-[650px] lg:h-[830px] overflow-hidden my-16 md:my-20 lg:my-24">
          <div className="absolute inset-0 w-full h-full">
            <div 
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: "linear-gradient(181deg, rgba(0, 0, 0, 0) 64%, rgba(0, 0, 0, 1) 82%)"
              }}
            />
                <Image
                  src="/aqua-adventure/dhow-excursions.png"
                  alt="Dhow Excursions"
                  fill
                  className="object-cover"
              sizes="100vw"
                />
              </div>
          <div className="absolute inset-0 z-20 flex flex-col justify-end items-center pb-8 md:pb-12 lg:pb-16 px-4">
            <div className="flex flex-col gap-[7px] max-w-[946px] text-center">
              <div className="flex flex-col gap-[31px]">
                <h3 className="text-white text-[22px] md:text-[24px] lg:text-[26px] font-semibold leading-[1.25] font-quicksand">
                      Dhow Excursions
                    </h3>
                    <p className="text-white text-[14px] md:text-[16px] font-normal leading-[1.8125] font-quicksand">
                      Set sail aboard a handcrafted Swahili dhow for a magical coastal journey. Drift through mangrove lagoons, try traditional hand-line fishing, and witness a golden sunset painting the sea — a moment of pure island serenity and tradition combined.
                    </p>
                  </div>
              <div className="flex items-center justify-center gap-[15px] mt-6 md:mt-8">
                    <Link 
                      href="#"
                  className="flex items-center gap-[15px] w-fit group"
                    >
                  <span className="text-[#FF6A00] text-[14px] md:text-[16px] font-bold leading-[2.3125] font-quicksand">
                        Begin Adventure
                      </span>
                  <FiArrowRight size={23} className="text-[#FF6A00]" strokeWidth={1.4} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

        {/* Second Section: Kayaking & Snorkelling - Exact Figma Structure */}
        <div className="relative w-full -mt-12 md:-mt-20 lg:-mt-25 bg-[#FFFCF6]">
          {/* Background Image */}
          <div className="absolute left-0 right-0 top-0 w-full" style={{ height: '1393px' }}>
                <Image
                  src="/aqua-adventure/dock-bg.png"
              alt="Dock Background"
                  fill
                  priority
              className="object-cover object-left"
                  sizes="100vw"
                />
              </div>
              
          {/* Content Container - Reduced padding for edge-to-edge */}
          <div className="relative z-10 w-full overflow-x-hidden">
            {/* Activities Section - Mobile: Stack, Desktop: Absolute Positioned */}
            <div className="relative px-4 md:px-6 min-h-[975px] lg:min-h-[1393px] py-16 md:py-20 lg:py-24">
              {/* Mobile Layout */}
              <div className="block lg:hidden space-y-12 md:space-y-16">
                {/* Kayaking - Mobile */}
                <div className="pt-4 pb-4">
                  <div className="relative w-full h-[220px] sm:h-[260px] md:h-[400px] rounded-r-[14px] overflow-hidden mb-6 group/image">
                      <Image
                        src="/aqua-adventure/kayaking.png"
                      alt="Kayaking"
                        fill
                      className="object-cover rounded-r-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                      />
                    </div>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[22px] md:text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                        Kayaking
                      </h3>
                      <p className="text-[#1A1711] text-[18px] md:text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ letterSpacing: '0.01em' }}>
                        Glide across calm waters in our sleek sea kayaks and uncover hidden corners of the coastline. Paddle past swaying palms, listen to the rhythm of the waves, and enjoy a tranquil yet invigorating way to explore the island&apos;s coastal charm.
                      </p>
                    </div>
                    <Link 
                      href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                    >
                      <span className="text-[#FF6A00] text-[14px] md:text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]">
                        Begin Adventure
                      </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                    </Link>
                  </div>
                </div>

                {/* Snorkelling - Mobile */}
                <div className="pt-4 pb-4">
                  <div className="relative w-full h-[220px] sm:h-[280px] md:h-[420px] rounded-l-[14px] overflow-hidden mb-6 group/image">
                    <Image
                      src="/aqua-adventure/snorkelling-2.png"
                      alt="Snorkelling"
                      fill
                      className="object-cover rounded-l-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                    />
                  </div>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[22px] md:text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                        Snorkelling
                          </h3>
                      <p className="text-[#1A1711] text-[18px] md:text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ letterSpacing: '0.01em' }}>
                        Dive into crystal-clear waters and discover a vibrant underwater world. Explore colorful coral reefs, swim alongside tropical fish, and witness the breathtaking marine life that thrives beneath Zanzibar&apos;s turquoise surface — an unforgettable aquatic adventure awaits.
                          </p>
                        </div>
                        <Link 
                          href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                        >
                      <span className="text-[#FF6A00] text-[14px] md:text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]">
                            Begin Adventure
                          </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                        </Link>
                      </div>
                    </div>
              </div>

              {/* Desktop Layout - Absolute Positioned - Container: 1596 x 1393 */}
              <div className="hidden lg:block relative w-full" style={{ height: '1393px', overflow: 'visible' }}>
                {/* Row 1: Kayaking - Image Left, Text Right Same Level */}
                {/* Kayaking Image - Position (0, 0) - Exact Figma: 785 x 524 */}
                <div className="absolute left-0 top-0 group/image" style={{ width: '785px', height: '524px' }}>
                  <div className="relative w-full h-full rounded-[14px] overflow-hidden">
                    <Image
                      src="/aqua-adventure/kayaking.png"
                      alt="Kayaking"
                      fill
                      className="object-cover rounded-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                      priority
                    />
                  </div>
                </div>

                {/* Row 1: Beach Walking Text - Right side, same level as 1st image */}
                <div className="absolute left-[820px] top-0" style={{ width: '571px' }}>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                        Beach Walking
                      </h3>
                      <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ width: '546px', letterSpacing: '0.01em' }}>
                        Discover the beauty of Bwejuu Beach on foot. Stroll along powder-soft sands, watch seabirds dance over gentle tides, or join a friendly game by the shore. A simple walk here becomes an unforgettable communion with Zanzibar&apos;s peaceful nature.
                      </p>
                    </div>
                    <Link 
                      href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                    >
                      <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]" style={{ letterSpacing: '0.01em' }}>
                        Begin Adventure
                      </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                    </Link>
                  </div>
                </div>

                {/* Row 2: Kayaking Text - Left side, below image */}
                <div className="absolute left-[40px] top-[582px]" style={{ width: '571px' }}>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                            Kayaking
                          </h3>
                      <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ width: '546px', letterSpacing: '0.01em' }}>
                        Glide across calm waters in our sleek sea kayaks and uncover hidden corners of the coastline. Paddle past swaying palms, listen to the rhythm of the waves, and enjoy a tranquil yet invigorating way to explore the island&apos;s coastal charm.
                          </p>
                        </div>
                        <Link 
                          href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                        >
                      <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]" style={{ letterSpacing: '0.01em' }}>
                            Begin Adventure
                          </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                        </Link>
                      </div>
                    </div>

                {/* Snorkelling Image - Right edge aligned */}
                <div className="absolute right-0 top-[395px] group/image" style={{ width: '785px', height: '580px' }}>
                  <div className="relative w-full h-full rounded-[14px] overflow-hidden">
                      <Image
                        src="/aqua-adventure/snorkelling-1.png"
                      alt="Snorkelling"
                        fill
                      className="object-cover rounded-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                      />
                  </div>
                </div>

                {/* Row 3: Snorkelling Image Left, Text Right */}
                {/* Third Image - Position (0, 918) - Exact Figma: 785 x 475 */}
                <div className="absolute left-0 top-[918px] group/image" style={{ width: '785px', height: '475px' }}>
                  <div className="relative w-full h-full rounded-[14px] overflow-hidden">
                      <Image
                        src="/aqua-adventure/snorkelling-2.png"
                        alt="Snorkelling"
                        fill
                      className="object-cover rounded-[14px] transition-transform duration-500 ease-out group-hover/image:scale-110"
                      />
                    </div>
                  </div>

                {/* Snorkelling Text - Right side, below image */}
                <div className="absolute left-[820px] top-[1075px]" style={{ width: '571px' }}>
                  <div className="flex flex-col gap-[25px]">
                    <div className="flex flex-col gap-[31px]">
                      <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand transition-colors duration-300 hover:text-[#FF6A00]">
                            Snorkelling
                          </h3>
                      <p className="text-[#1A1711] text-[20px] font-medium leading-[1.85] font-quicksand transition-opacity duration-300 hover:opacity-90" style={{ width: '546px', letterSpacing: '0.01em' }}>
                        Experience the timeless joy of sailing over calm, azure waters. Whether joining a guided expedition or steering a Hobie Cat yourself, each journey offers freedom, adventure, and breathtaking views of Zanzibar&apos;s endless blue horizon.
                          </p>
                        </div>
                        <Link 
                          href="#"
                      className="flex items-center gap-[15px] w-fit group/link"
                        >
                      <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand transition-all duration-300 group-hover/link:text-[#E55A00]" style={{ letterSpacing: '0.01em' }}>
                            Begin Adventure
                          </span>
                      <FiArrowRight size={23} className="text-[#FF6A00] transition-transform duration-300 group-hover/link:translate-x-2" strokeWidth={1.4} />
                        </Link>
                      </div>
                    </div>

                </div>
              </div>
            </div>
          </div>

        {/* Spacer before footer */}
        <div className="h-16 md:h-20 lg:h-24"></div>
      </main>
      <Footer />
    </>
  );
}
