"use client";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactUsButton from "@/components/ui/ContactUsButton";
import { useState, useEffect, useRef } from "react";
import "@/styles/animations/deepBlueDive.css";

export default function DeepBlueDivePage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const observers = [
      { ref: titleRef, threshold: 0.3 },
      { ref: galleryRef, threshold: 0.2 },
      { ref: videoRef, threshold: 0.3 },
      { ref: contentRef, threshold: 0.3 },
    ];

    const observerInstances: IntersectionObserver[] = [];

    observers.forEach(({ ref, threshold }) => {
      if (ref.current) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
              }
            });
          },
          { threshold, rootMargin: '0px' }
        );
        observer.observe(ref.current);
        observerInstances.push(observer);
      }
    });

    return () => {
      observerInstances.forEach(observer => observer.disconnect());
    };
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans w-full max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative w-full h-[560px] md:h-[700px] lg:h-[977px] overflow-hidden">
          <Image
            src="/deep-dive/hero-bg.png"
            alt="Deep Blue Dive Hero"
            fill
            priority
            loading="eager"
            fetchPriority="high"
            quality={90}
            sizes="100vw"
            className="object-cover"
            style={{ opacity: 1 }}
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
         
          <div ref={heroRef} className="absolute left-1/2 -translate-x-1/2 top-[180px] md:top-[220px] lg:top-[687px] z-30 pointer-events-none">
            <div className="relative flex flex-col items-center h-[189px] hero-decoration">
            
              <div 
                className={`w-[2px] h-[127px] hero-line ${isVisible ? 'hero-line-visible' : ''}`}
                style={{
                  background: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 35%, rgba(255, 255, 255, 0) 100%)"
                }}
              />
            
              <div className={`relative w-[80px] h-[80px] hero-icon ${isVisible ? 'hero-icon-visible' : ''}`}>
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

      
        <section ref={titleRef} className="pt-12 pb-8 md:pt-16 md:pb-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-[#423B2D] text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-[1.25] text-center font-quicksand mb-6 md:mb-8 title-animate">
              <span className="inline-block wave-text">
                The Spirit of the Deep
              </span>
            </h2>
            <p className="text-[#313131] text-[18px] font-medium leading-[1.67] text-center font-quicksand max-w-[738px] mx-auto paragraph-animate">
              Unveil a world of color and calm beneath the Indian Ocean. Our Deep Blue Dive experience invites you to explore pristine reefs, vibrant marine life, and crystal-clear depths — where every dive feels like a new discovery.
            </p>
          </div>
        </section>

      
        <section className="relative pt-8 pb-12 md:pb-16 lg:pb-20">
          <div 
            className="absolute inset-0 top-[30%] pointer-events-none hidden md:block"
            style={{
              background: "linear-gradient(180deg, rgba(255, 252, 246, 1) 3%, rgba(255, 252, 246, 0.89) 8%, rgba(255, 252, 246, 0.38) 20%, rgba(255, 252, 246, 0) 47%, rgba(255, 252, 246, 0) 59%, rgba(255, 252, 246, 0) 63%, rgba(255, 252, 246, 0.22) 73%, rgba(255, 252, 246, 1) 86%)"
            }}
          />
          <div className="absolute inset-0 top-[30%] pointer-events-none opacity-10 hidden md:block">
            <Image
              src="/deep-dive/bg-texture.png"
              alt="Background Texture"
              fill
              className="object-cover"
            />
          </div>
          <div ref={galleryRef} className="relative z-10 max-w-8xl mx-auto px-2 md:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {[
                { src: "deep-1.png", label: "100 Feet of Diving" },
                { src: "deep-2.png", label: "400 Fish Species" },
                { src: "deep-3.png", label: "65,000 Meters of Reef" },
              ].map((item, index) => (
                <div 
                  key={`gallery-${index}`} 
                  className="flex flex-col items-center gallery-card"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden rounded-lg group cursor-pointer">
                    <Image 
                      src={`/deep-dive/${item.src}`}
                      alt={item.label}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    {/* Bubble overlay animation */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bubble-effect"></div>
                    </div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <p className="mt-6 md:mt-8 text-center text-[#424242] text-[16px] md:text-[18px] font-semibold leading-[1.5] font-quicksand w-full group-hover:text-[#F96406] transition-colors duration-300">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

       
        <section ref={videoRef} className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[945px] overflow-hidden bg-transparent">
          {/* Embedded Video - Only video, no background */}
          <video
            src="/deep-dive/deep.mp4"
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        </section>

        <section ref={contentRef} className="relative">
          <div className="flex flex-col md:flex-row h-full">
          
            <div className="relative w-full md:w-1/2 h-[400px] md:h-[600px] lg:h-[900px] group/image overflow-hidden">
              <Image
                src="/deep-dive/main-diver.png"
                alt="Scuba Diver Underwater"
                fill
                className="object-cover transition-transform duration-1000 ease-out group-hover/image:scale-110"
              />
              <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                style={{
                  background: "linear-gradient(-1deg, rgba(3, 69, 86, 0) 64%, rgba(3, 69, 86, 1) 100%)"
                }}
              />
              {/* Depth shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover/image:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 depth-shimmer"></div>
              </div>
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
                <div className="flex flex-col gap-14 md:gap-16 w-full max-w-[535px] content-group">
                  <div className="flex flex-col gap-8">
                    <h2 className="text-white text-[32px] md:text-[40px] font-semibold leading-[1.25] font-quicksand content-title transition-all duration-500 group-hover/content-group:translate-x-2 group-hover/content-group:text-[#F96406]">
                      Book your spot, gear up, and explore the Deep Blue with us.
                    </h2>
                    <p className="text-white text-[18px] font-medium leading-[1.25] font-quicksand content-text transition-all duration-500 group-hover/content-group:translate-x-1">
                      Your next great story begins beneath the waves — contact us and let&apos;s make it happen.
                    </p>
                  </div>
                  <ContactUsButton />
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Video Modal */}
        {isVideoOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 cursor-pointer" onClick={() => setIsVideoOpen(false)}>
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
