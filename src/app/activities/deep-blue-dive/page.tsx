"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState } from "react";

export default function DeepBlueDivePage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans">
        {/* Hero Section */}
        <section className="relative w-full h-[560px] md:h-[700px] lg:h-[977px] overflow-hidden">
          <Image
            src="/deep-dive/hero-bg.png"
            alt="Deep Blue Dive Hero"
            fill
            priority
            className="object-cover"
          />
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "linear-gradient(0deg, rgba(0, 0, 0, 0) 67%, rgba(0, 0, 0, 1) 97%)"
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background: "linear-gradient(180deg, rgba(255, 252, 246, 0) 79%, rgba(255, 252, 246, 0.9) 96%, rgba(255, 252, 246, 1) 99%)"
            }}
          />
         
          <div className="absolute left-1/2 -translate-x-1/2 top-[180px] md:top-[220px] lg:top-[687px] z-30 pointer-events-none">
            <div className="relative flex flex-col items-center h-[189px]">
            
              <div 
                className="w-[2px] h-[127px]"
                style={{
                  background: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 35%, rgba(255, 255, 255, 0) 100%)"
                }}
              />
            
              <div className="relative w-[80px] h-[80px]">
                <Image
                  src="/deep-dive/hero-decoration.png"
                  alt="Diver Decoration"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

      
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-[#423B2D] text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-[1.25] text-center font-quicksand mb-6 md:mb-8">
              The Spirit of the Deep
            </h2>
            <p className="text-[#313131] text-[18px] font-medium leading-[1.67] text-center font-quicksand max-w-[738px] mx-auto">
              Unveil a world of color and calm beneath the Indian Ocean. Our Deep Blue Dive experience invites you to explore pristine reefs, vibrant marine life, and crystal-clear depths — where every dive feels like a new discovery.
            </p>
          </div>
        </section>

      
        <section className="relative py-8">
          <div 
            className="absolute inset-0 top-[30%] pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255, 252, 246, 1) 3%, rgba(255, 252, 246, 0.89) 8%, rgba(255, 252, 246, 0.38) 20%, rgba(255, 252, 246, 0) 47%, rgba(255, 252, 246, 0) 59%, rgba(255, 252, 246, 0) 63%, rgba(255, 252, 246, 0.22) 73%, rgba(255, 252, 246, 1) 86%)"
            }}
          />
          <div className="absolute inset-0 top-[30%] pointer-events-none opacity-10">
            <Image
              src="/deep-dive/bg-texture.png"
              alt="Background Texture"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-4 gap-3 md:gap-4">
              {[
                { src: "deep-1.png", label: "100 Feet of Diving" },
                { src: "deep-2.png", label: "400 Fish Species" },
                { src: "deep-3.png", label: "65,000 Meters of Reef" },
                { src: "deep-4.png", label: "Luxury Villas" },
              ].map((item, index) => (
                <div key={`gallery-${index}`} className="flex flex-col items-center">
                  <div className="relative w-full h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden">
                    <Image 
                      src={`/deep-dive/${item.src}`}
                      alt={item.label}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-4 text-center text-[#424242] text-[16px] md:text-[18px] font-semibold leading-[1.5] font-quicksand w-full">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

       
        <section className="relative w-full h-[600px] md:h-[800px] lg:h-[945px] overflow-hidden">
        
          <div className="absolute inset-0 z-0">
            <Image
              src="/deep-dive/bg-texture.png"
              alt="Background Texture"
              fill
              className="object-cover"
            />
          </div>
         
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(255, 252, 246, 1) 3%, rgba(255, 252, 246, 0.89) 8%, rgba(255, 252, 246, 0.38) 20%, rgba(255, 252, 246, 0) 47%, rgba(255, 252, 246, 0) 59%, rgba(255, 252, 246, 0) 63%, rgba(255, 252, 246, 0.22) 73%, rgba(255, 252, 246, 1) 86%)",
            }}
          />

        
          <button
            type="button"
            aria-label="Play video"
            onClick={() => setIsVideoOpen(true)}
            className="absolute inset-0 z-20 flex items-center justify-center"
          >
            <span className="flex items-center justify-center w-[72px] h-[72px] rounded-full border-2 border-white shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7-11-7z" />
              </svg>
            </span>
          </button>
        </section>

      
        <section className="-mt-8 md:-mt-12 lg:-mt-20 relative">
          <div className="flex flex-col md:flex-row h-full">
          
            <div className="relative w-full md:w-1/2 h-[400px] md:h-[600px] lg:h-[900px]">
              <Image
                src="/deep-dive/main-diver.png"
                alt="Scuba Diver Underwater"
                fill
                className="object-cover"
              />
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(-1deg, rgba(3, 69, 86, 0) 64%, rgba(3, 69, 86, 1) 100%)"
                }}
              />
            </div>
            
       
            <div className="relative w-full md:w-1/2 h-[400px] md:h-[600px] lg:h-[900px]">
              <Image
                src="/deep-dive/right-bg.png"
                alt="Underwater Right Background"
                fill
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "rgba(0, 0, 0, 0.67)" }}
              />
              
              {/* Content on Right Side */}
              <div className="absolute inset-0 z-10 flex flex-col justify-center items-center md:items-start px-6 md:px-12 lg:px-16">
                <div className="flex flex-col gap-14 md:gap-16 w-full max-w-[535px]">
                  <div className="flex flex-col gap-8">
                    <h2 className="text-white text-[32px] md:text-[40px] font-semibold leading-[1.25] font-quicksand">
                      Book your spot, gear up, and explore the Deep Blue with us.
                    </h2>
                    <p className="text-white text-[18px] font-medium leading-[1.25] font-quicksand">
                      Your next great story begins beneath the waves — contact us and let&apos;s make it happen.
                    </p>
                  </div>
                  <Link 
                    href="/contact-us" 
                    className="bg-[#F96406] text-white px-5 py-2 rounded-[52px] text-[20px] font-medium h-[54px] flex items-center justify-center font-quicksand hover:opacity-90 transition-opacity w-[160px]"
                  >
                    Connect Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Video Modal */}
        {isVideoOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setIsVideoOpen(false)}>
            <div className="relative w-full max-w-4xl aspect-video bg-black" onClick={(e) => e.stopPropagation()}>
              <button
                aria-label="Close video"
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-10 right-0 text-white/90 hover:text-white"
              >
                Close
              </button>
              <video src="/deep-dive/video.mp4" controls autoPlay className="w-full h-full" />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
