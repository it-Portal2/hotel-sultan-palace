"use client";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactUsButton from "@/components/ui/ContactUsButton";
import { useState, useEffect, useRef } from "react";

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

      
        <section ref={titleRef} className="py-12 md:py-16">
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
          <div ref={galleryRef} className="relative z-10 max-w-8xl mx-auto px-2 md:px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 ">
              {[
                { src: "deep-1.png", label: "100 Feet of Diving" },
                { src: "deep-2.png", label: "400 Fish Species" },
                { src: "deep-3.png", label: "65,000 Meters of Reef" },
                { src: "deep-4.png", label: "Luxury Villas" },
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
                  <p className="mt-4 text-center text-[#424242] text-[16px] md:text-[18px] font-semibold leading-[1.5] font-quicksand w-full group-hover:text-[#F96406] transition-colors duration-300">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

       
        <section ref={videoRef} className="relative w-full h-[600px] md:h-[800px] lg:h-[945px] overflow-hidden">
        
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
            className="absolute inset-0 z-20 flex items-center justify-center group/play"
          >
            <span className="flex items-center justify-center w-[72px] h-[72px] rounded-full border-2 border-white shadow-[0_4px_24px_rgba(0,0,0,0.25)] video-play-button transition-all duration-500 group-hover/play:scale-125 group-hover/play:border-[#F96406] group-hover/play:bg-white/10 group-hover/play:shadow-[0_0_40px_rgba(249,100,6,0.5)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 group-hover/play:scale-110 group-hover/play:translate-x-1">
                <path d="M8 5v14l11-7-11-7z" />
              </svg>
              {/* Ripple effect */}
              <span className="absolute inset-0 rounded-full border-2 border-white opacity-0 group-hover/play:opacity-100 group-hover/play:animate-ripple"></span>
            </span>
          </button>
        </section>

      
        <section ref={contentRef} className="-mt-8 md:-mt-12 lg:-mt-20 relative">
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
        
        <style jsx global>{`
          /* Hero Decoration Animations */
          .hero-line {
            opacity: 0;
            transform: scaleY(0);
            transform-origin: top;
            transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .hero-line-visible {
            opacity: 1;
            transform: scaleY(1);
          }

          .hero-icon {
            opacity: 0;
            transform: translateY(30px) scale(0.8) rotate(-15deg);
            filter: blur(10px);
            transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .hero-icon-visible {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
            filter: blur(0px);
            animation: floatDiver 3s ease-in-out infinite;
          }

          @keyframes floatDiver {
            0%, 100% {
              transform: translateY(0) scale(1) rotate(0deg);
            }
            50% {
              transform: translateY(-15px) scale(1.05) rotate(5deg);
            }
          }

          /* Title Wave Animation */
          .title-animate {
            opacity: 0;
            transform: translateY(40px);
            transition: all 1s ease-out;
          }

          .section-visible .title-animate,
          .title-animate.section-visible {
            opacity: 1;
            transform: translateY(0);
          }

          .wave-text {
            display: inline-block;
            background: linear-gradient(90deg, 
              #423B2D 0%, 
              #F96406 25%, 
              #423B2D 50%, 
              #F96406 75%, 
              #423B2D 100%
            );
            background-size: 200% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: waveGradient 3s ease-in-out infinite;
          }

          @keyframes waveGradient {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          /* Paragraph Animation */
          .paragraph-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: all 1s ease-out 0.3s;
          }

          .section-visible .paragraph-animate,
          .paragraph-animate.section-visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* Gallery Cards Animation */
          .gallery-card {
            opacity: 0;
            transform: translateY(60px) scale(0.9);
            transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .section-visible .gallery-card,
          .gallery-card.section-visible {
            opacity: 1;
            transform: translateY(0) scale(1);
          }

          /* Bubble Effect */
          .bubble-effect {
            background-image: 
              radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 2px, transparent 2px),
              radial-gradient(circle at 60% 80%, rgba(255, 255, 255, 0.2) 3px, transparent 3px),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.25) 2px, transparent 2px);
            background-size: 50% 100%, 60% 80%, 40% 60%;
            animation: bubbleFloat 6s ease-in-out infinite;
          }

          @keyframes bubbleFloat {
            0%, 100% {
              background-position: 0% 100%, 50% 80%, 100% 20%;
              opacity: 0.3;
            }
            50% {
              background-position: 0% 0%, 50% 0%, 100% 40%;
              opacity: 0.6;
            }
          }

          /* Video Play Button Animation */
          .video-play-button {
            animation: pulseGlow 2s ease-in-out infinite;
          }

          @keyframes pulseGlow {
            0%, 100% {
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
            }
            50% {
              box-shadow: 0 4px 40px rgba(255, 255, 255, 0.4);
            }
          }

          @keyframes ripple {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }

          .animate-ripple {
            animation: ripple 1s ease-out infinite;
          }

          /* Content Section Animations */
          .content-title {
            opacity: 0;
            transform: translateX(-50px);
            transition: all 1s ease-out;
          }

          .section-visible .content-title,
          .content-title.section-visible {
            opacity: 1;
            transform: translateX(0);
          }

          .content-text {
            opacity: 0;
            transform: translateX(-30px);
            transition: all 1s ease-out 0.2s;
          }

          .section-visible .content-text,
          .content-text.section-visible {
            opacity: 1;
            transform: translateX(0);
          }

          /* Depth Shimmer Effect */
          .depth-shimmer {
            background: linear-gradient(
              135deg,
              transparent 0%,
              rgba(255, 255, 255, 0.1) 25%,
              transparent 50%,
              rgba(255, 255, 255, 0.1) 75%,
              transparent 100%
            );
            background-size: 200% 200%;
            animation: shimmerMove 3s ease-in-out infinite;
          }

          @keyframes shimmerMove {
            0% {
              background-position: -100% -100%;
            }
            100% {
              background-position: 100% 100%;
            }
          }

          /* Link Button Animation */
          .content-group a {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
            transition: all 1s ease-out 0.4s;
          }

          .section-visible .content-group a,
          .content-group a.section-visible {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
