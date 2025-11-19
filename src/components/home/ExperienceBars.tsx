"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function ExperienceBars() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('experience-visible');
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <section ref={sectionRef} className="w-full bg-[#242424] relative overflow-visible experience-section" style={{ minHeight: '1018px', padding: 0, margin: 0 }}>
      {/* Mobile Layout */}
      <div className="lg:hidden p-4 md:p-8 mb-32">
        <div className="flex flex-col gap-8">
          <h2 className={`font-[Kaisei_Decol] font-bold text-[40px] md:text-[70px] leading-[1.448] text-white experience-mobile-heading ${isVisible ? 'experience-mobile-heading-visible' : ''}`}>
            Savor Every Moment, Feel Alive
          </h2>
          
          <div className={`relative w-full h-[400px] experience-mobile-image-left ${isVisible ? 'experience-mobile-image-left-visible' : ''}`}>
            <Image 
              src="/figma/experience-left.png" 
              alt="Beach bar with stools" 
              fill 
              className="object-cover"
              sizes="100vw"
            />
          </div>

          <div className="flex flex-col gap-8">
            <div className={`experience-mobile-text-block ${isVisible ? 'experience-mobile-text-block-visible' : ''}`}>
              <h4 className={`font-[Kaisei_Decol] font-bold text-[32px] leading-[1.448] text-[#BE8C53] mb-[32px] experience-mobile-title ${isVisible ? 'experience-mobile-title-visible' : ''}`}>
                Oceanfront Bars & Bliss
              </h4>
              <p className={`font-[Kaisei_Decol] font-medium text-[16px] leading-[1.448] text-white mb-6 experience-mobile-text ${isVisible ? 'experience-mobile-text-visible' : ''}`}>
                Enjoy handcrafted cocktails at our beach and in-house bars, where every sip comes with breathtaking ocean views.
              </p>
              
              <Link href="/rooms" className={`group flex items-center gap-2 border border-white text-white px-4 py-2 font-[Kaisei_Decol] font-bold text-sm tracking-wider transition-all duration-300 ease-in-out hover:bg-white hover:text-black active:bg-white active:text-black w-fit experience-mobile-button ${isVisible ? 'experience-mobile-button-visible' : ''}`}>
                <span>Book Now</span>
                <span className="w-0 opacity-0 group-hover:w-5 group-hover:opacity-100 group-active:w-5 group-active:opacity-100 transition-all duration-300 ease-in-out text-lg">→</span>
              </Link>
            </div>

            <div className={`relative w-full h-[400px] md:h-[595px] experience-mobile-image-right ${isVisible ? 'experience-mobile-image-right-visible' : ''}`}>
              <Image 
                src="/figma/experience-right.png" 
                alt="Indoor bar with bright lights" 
                fill 
                className="object-cover"
                sizes="100vw"
              />
              
              <div className={`absolute top-4 right-4 bg-white p-6 md:p-8 w-[280px] md:w-[340px] transition-all duration-300 ease-in-out origin-top-left hover:scale-110 active:scale-110 hover:shadow-[0_15px_40px_rgba(190,140,83,0.4),0_0_0_1px_rgba(190,140,83,0.15),-15px_15px_30px_rgba(190,140,83,0.3),15px_15px_30px_rgba(190,140,83,0.3)] active:shadow-[0_15px_40px_rgba(190,140,83,0.4),0_0_0_1px_rgba(190,140,83,0.15),-15px_15px_30px_rgba(190,140,83,0.3),15px_15px_30px_rgba(190,140,83,0.3)] experience-mobile-card ${isVisible ? 'experience-mobile-card-visible' : ''}`}>
                <h3 className="font-[Kaisei_Decol] font-bold text-[32px] leading-[1.448] text-black mb-8">
                  Refresh, Relax, Repeat
                </h3>
                <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-[#3D3D3D]">
                  Unwind in style with our curated drinks and vibrant atmosphere, perfect for both sunset relaxation and lively evenings.
                </p>
              </div>

              <div className={`absolute bottom-0 left-0 experience-mobile-journey-button ${isVisible ? 'experience-mobile-journey-button-visible' : ''}`}>
                <button className="group flex items-center justify-between gap-6 border border-white px-6 py-5 text-white bg-black bg-opacity-50 hover:bg-[#ff6a00] active:bg-[#ff6a00] transition-colors duration-300">
                  <span className="font-[Kaisei_Decol] font-bold text-lg uppercase">Start your journey</span>
                  <span className="text-2xl transition-transform duration-300 ease-in-out group-hover:translate-x-2">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Exact Figma Match */}
      <div className="hidden lg:block w-full relative overflow-visible" style={{ minHeight: '1018px', padding: 0, margin: 0 }}>
        <div className="mx-auto w-full max-w-[1512px] relative overflow-visible" style={{ padding: 0, margin: 0, minHeight: '1018px' }}>
          {/* Main heading - 3 lines like Figma, larger to reach image */}
          <h2 className={`absolute font-[Kaisei_Decol] font-bold leading-[1.448] text-white experience-heading ${isVisible ? 'experience-heading-visible' : ''}`} style={{ 
            left: 'clamp(80px, 7.8%, 118px)',
            top: 'clamp(60px, 16.4%, 167px)',
            width: 'clamp(400px, 33.2%, 502px)',
            fontSize: 'clamp(70px, 10%, 150px)',
            WebkitTextStroke: '1px white',
            textAlign: 'left',
            zIndex: 10,
            lineHeight: '1.2'
          }}>
            Savor Every Moment,<br />Feel<br />Alive
          </h2>

          {/* Oceanfront Bars & Bliss section - Exact Figma position */}
          <div className={`absolute flex flex-col experience-text-block ${isVisible ? 'experience-text-block-visible' : ''}`} style={{ 
            left: 'clamp(500px, 45.1%, 682px)',
            top: 'clamp(60px, 10.2%, 104px)',
            width: 'clamp(300px, 24.3%, 368px)',
            maxWidth: '368px',
            gap: '32px',
            zIndex: 10
          }}>
            <h4 className="font-[Kaisei_Decol] font-bold text-[28px] lg:text-[30px] xl:text-[32px] leading-[1.448] text-[#BE8C53]">
              Oceanfront Bars & Bliss
            </h4>
            <p className="font-[Kaisei_Decol] font-medium text-[14px] lg:text-[15px] xl:text-[16px] leading-[1.448] text-white">
              Enjoy handcrafted cocktails at our beach and in-house bars, where every sip comes with breathtaking ocean views.
            </p>
          </div>

          {/* Book Now button - Proper spacing below text */}
          <div className={`absolute experience-book-button ${isVisible ? 'experience-book-button-visible' : ''}`} style={{ 
            left: 'clamp(500px, 45.1%, 682px)',
            top: 'clamp(220px, 32%, 290px)',
            width: 'clamp(140px, 10.6%, 160px)',
            zIndex: 10
          }}>
            <Link href="/rooms" className="group flex items-center justify-center gap-[10px] border border-white text-white px-[10px] py-[10px] font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] tracking-wider transition-all duration-150 ease-out hover:bg-white hover:text-[#242424] active:bg-white active:text-[#242424] whitespace-nowrap w-full">
              <span className="whitespace-nowrap">Book Now</span>
              <span className="w-0 opacity-0 group-hover:w-5 group-hover:opacity-100 group-active:w-5 group-active:opacity-100 transition-all duration-150 ease-out text-lg">→</span>
            </Link>
          </div>

          {/* White Card - Anchor to right edge on all sizes without cutoff */}
          <div className={`absolute bg-white origin-top-left hover:scale-110 active:scale-110 hover:shadow-[0_15px_40px_rgba(190,140,83,0.4),0_0_0_1px_rgba(190,140,83,0.15),-15px_15px_30px_rgba(190,140,83,0.3),15px_15px_30px_rgba(190,140,83,0.3)] experience-card ${isVisible ? 'experience-card-visible' : ''}`} style={{ 
            right: 'clamp(20px, 1.8%, 30px)',
            top: 'clamp(130px, 21.2%, 216px)',
            width: 'clamp(260px, 22.5%, 340px)',
            maxWidth: 'min(340px, calc(100% - 40px))',
            height: 'clamp(300px, 35.9%, 365px)',
            minHeight: '365px',
            padding: '31px',
            zIndex: 20,
            transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h3 className="font-[Kaisei_Decol] font-bold text-[32px] leading-[1.448] text-black mb-8">
              Refresh, Relax, Repeat
            </h3>
            <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-[#3D3D3D]">
              Unwind in style with our curated drinks and vibrant atmosphere, perfect for both sunset relaxation and lively evenings.
            </p>
          </div>

          {/* Left image - Exact Figma position */}
          <div className={`absolute experience-image-left ${isVisible ? 'experience-image-left-visible' : ''}`} style={{ 
            left: 'clamp(50px, 6.6%, 100px)',
            top: 'clamp(400px, 55.6%, 566px)',
            width: 'clamp(500px, 31.9%, 482px)',
            height: 'clamp(280px, 35.2%, 358px)',
            zIndex: 1
          }}>
            <div className="relative w-full h-full">
              <Image 
                src="/figma/experience-left.png" 
                alt="Beach bar with stools" 
                fill 
                className="object-cover"
                sizes="(max-width: 1280px) 500px, 482px"
              />
            </div>
          </div>

          {/* Right image - Wider on large screens to remove right black space */}
          <div className={`absolute experience-image-right ${isVisible ? 'experience-image-right-visible' : ''}`} style={{ 
            left: 'clamp(500px, 45.1%, 682px)',
            top: 'clamp(250px, 37.9%, 386px)',
            width: 'clamp(620px, 55%, 950px)',
            height: 'clamp(450px, 58.4%, 595px)',
            zIndex: 1
          }}>
            <div className="relative w-full h-full">
              <Image 
                src="/figma/experience-right.png" 
                alt="Indoor bar with bright lights" 
                fill 
                className="object-cover"
                sizes="(max-width: 1280px) 700px, 900px"
              />
            </div>
          </div>

          {/* Start your journey button - Full text visible */}
          <div className={`absolute experience-button ${isVisible ? 'experience-button-visible' : ''}`} style={{ 
            left: 'clamp(500px, 45.1%, 682px)',
            top: 'clamp(750px, 90.8%, 924px)',
            width: 'clamp(280px, 20%, 320px)',
            zIndex: 15
          }}>
            <Link href="/rooms" className="group flex items-center justify-between gap-3 px-4 py-4 text-white bg-[#242424] hover:!bg-[#ff6a00] active:!bg-[#ff6a00] transition-all duration-150 ease-out w-full border-0 overflow-hidden">
              <span className="font-[Kaisei_Decol] font-bold text-[18px] lg:text-[20px] leading-[1.448] uppercase whitespace-nowrap">Start your journey</span>
              <span className="w-0 opacity-0 group-hover:!w-6 group-hover:!opacity-100 group-active:!w-6 group-active:opacity-100 transition-all duration-150 ease-out group-hover:!translate-x-2 group-active:!translate-x-2 flex-shrink-0 inline-block text-[36px]" style={{ lineHeight: 0, stroke: '#FFFFFF', strokeWidth: '2px' }}>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
