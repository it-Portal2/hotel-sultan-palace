"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
    <section ref={sectionRef} className="w-full bg-[#242424] relative overflow-hidden experience-section" style={{ minHeight: '1018px' }}>
      {/* Mobile Layout */}
      <div className="lg:hidden p-4 md:p-8">
        <div className="flex flex-col gap-8">
          <h2 className="font-[Kaisei_Decol] font-bold text-[40px] md:text-[50px] leading-[1.448] text-white">
            Savor Every Moment, Feel Alive
          </h2>
          
          <div className="relative w-full h-[358px]">
            <Image 
              src="/figma/experience-left.png" 
              alt="Beach bar with stools" 
              fill 
              className="object-cover"
              sizes="100vw"
            />
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <h4 className="font-[Kaisei_Decol] font-bold text-[32px] leading-[1.448] text-[#BE8C53] mb-[32px]">
                Oceanfront Bars & Bliss
              </h4>
              <p className="font-[Kaisei_Decol] font-medium text-[16px] leading-[1.448] text-white mb-6">
                Enjoy handcrafted cocktails at our beach and in-house bars, where every sip comes with breathtaking ocean views.
              </p>
              
              <button className="group flex items-center gap-2 border border-white text-white px-4 py-2 font-[Kaisei_Decol] font-bold text-sm tracking-wider transition-all duration-300 ease-in-out hover:bg-white hover:text-black active:bg-white active:text-black w-fit">
                <span>Book Now</span>
                <span className="w-0 opacity-0 group-hover:w-5 group-hover:opacity-100 group-active:w-5 group-active:opacity-100 transition-all duration-300 ease-in-out text-lg">→</span>
              </button>
            </div>

            <div className="relative w-full h-[400px] md:h-[595px]">
              <Image 
                src="/figma/experience-right.png" 
                alt="Indoor bar with bright lights" 
                fill 
                className="object-cover"
                sizes="100vw"
              />
              
              <div className="absolute top-4 right-4 bg-white p-6 md:p-8 w-[280px] md:w-[340px] transition-all duration-300 ease-in-out origin-top-left hover:scale-110 active:scale-110 hover:shadow-[0_15px_40px_rgba(190,140,83,0.4),0_0_0_1px_rgba(190,140,83,0.15),-15px_15px_30px_rgba(190,140,83,0.3),15px_15px_30px_rgba(190,140,83,0.3)] active:shadow-[0_15px_40px_rgba(190,140,83,0.4),0_0_0_1px_rgba(190,140,83,0.15),-15px_15px_30px_rgba(190,140,83,0.3),15px_15px_30px_rgba(190,140,83,0.3)]">
                <h3 className="font-[Kaisei_Decol] font-bold text-[32px] leading-[1.448] text-black mb-8">
                  Refresh, Relax, Repeat
                </h3>
                <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-[#3D3D3D]">
                  Unwind in style with our curated drinks and vibrant atmosphere, perfect for both sunset relaxation and lively evenings.
                </p>
              </div>

              <div className="absolute bottom-0 left-0">
                <button className="group flex items-center justify-between gap-6 border border-white px-6 py-5 text-white bg-black bg-opacity-50 hover:bg-[#ff6a00] active:bg-[#ff6a00] transition-colors duration-300">
                  <span className="font-[Kaisei_Decol] font-bold text-lg uppercase">Start your journey</span>
                  <span className="text-2xl transition-transform duration-300 ease-in-out group-hover:translate-x-2">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block w-full relative" style={{ height: '1018px' }}>
        {/* Main heading */}
        <h2 className={`absolute left-[118px] top-[167px] w-[502px] font-[Kaisei_Decol] font-bold text-[70px] leading-[1.448] text-white experience-heading ${isVisible ? 'experience-heading-visible' : ''}`} style={{ WebkitTextStroke: '1px white' }}>
          Savor Every Moment, Feel Alive
        </h2>

        {/* Left image */}
        <div className="absolute left-[100px] top-[566px] w-[482px] h-[358px]">
          <Image 
            src="/figma/experience-left.png" 
            alt="Beach bar with stools" 
            fill 
            className="object-cover"
            sizes="482px"
          />
        </div>

        {/* Right image */}
        <div className="absolute left-[682px] top-[386px] w-[622px] h-[595px]">
          <Image 
            src="/figma/experience-right.png" 
            alt="Indoor bar with bright lights" 
            fill 
            className="object-cover"
            sizes="622px"
          />
        </div>

        {/* Oceanfront Bars & Bliss section */}
        <div className={`absolute left-[682px] top-[104px] w-[368px] flex flex-col gap-[32px] experience-text-block ${isVisible ? 'experience-text-block-visible' : ''}`}>
          <h4 className="font-[Kaisei_Decol] font-bold text-[32px] leading-[1.448] text-[#BE8C53]">
            Oceanfront Bars & Bliss
          </h4>
          <p className="font-[Kaisei_Decol] font-medium text-[16px] leading-[1.448] text-white">
            Enjoy handcrafted cocktails at our beach and in-house bars, where every sip comes with breathtaking ocean views.
          </p>
          
          <button className="group flex items-center gap-2 border border-white text-white px-4 py-2 font-[Kaisei_Decol] font-bold text-sm tracking-wider transition-all duration-300 ease-in-out hover:bg-white hover:text-black active:bg-white active:text-black w-[175px]">
            <span>Book Now</span>
            <span className="w-0 opacity-0 group-hover:w-5 group-hover:opacity-100 group-active:w-5 group-active:opacity-100 transition-all duration-300 ease-in-out text-lg">→</span>
          </button>
        </div>

        {/* Refresh, Relax, Repeat white card */}
        <div className={`absolute left-[1097px] top-[216px] w-[340px] h-[365px] bg-white p-[31px] transition-all duration-300 ease-in-out origin-top-left hover:scale-110 active:scale-110 hover:shadow-[0_15px_40px_rgba(190,140,83,0.4),0_0_0_1px_rgba(190,140,83,0.15),-15px_15px_30px_rgba(190,140,83,0.3),15px_15px_30px_rgba(190,140,83,0.3)] active:shadow-[0_15px_40px_rgba(190,140,83,0.4),0_0_0_1px_rgba(190,140,83,0.15),-15px_15px_30px_rgba(190,140,83,0.3),15px_15px_30px_rgba(190,140,83,0.3)] experience-card ${isVisible ? 'experience-card-visible' : ''}`}>
          <h3 className="font-[Kaisei_Decol] font-bold text-[32px] leading-[1.448] text-black mb-[28px]">
            Refresh, Relax, Repeat
          </h3>
          <p className="font-[Kaisei_Decol] font-bold text-[16px] leading-[1.448] text-[#3D3D3D]">
            Unwind in style with our curated drinks and vibrant atmosphere, perfect for both sunset relaxation and lively evenings.
          </p>
        </div>

        {/* Start your journey button */}
        <div className={`absolute left-[682px] top-[924px] experience-button ${isVisible ? 'experience-button-visible' : ''}`}>
          <button className="group flex items-center justify-between gap-6 border border-white px-6 py-5 text-white bg-black bg-opacity-50 hover:bg-[#ff6a00] active:bg-[#ff6a00] transition-colors duration-300">
            <span className="font-[Kaisei_Decol] font-bold text-lg uppercase">Start your journey</span>
            <span className="text-2xl transition-transform duration-300 ease-in-out group-hover:translate-x-2 group-active:translate-x-2">→</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .experience-section {
          opacity: 0;
          transform: translateY(60px);
          transition: all 1.2s ease-out;
        }
        .experience-section.experience-visible,
        .experience-visible .experience-section {
          opacity: 1;
          transform: translateY(0);
        }
        .experience-heading {
          opacity: 0;
          transform: translateY(50px) scale(0.95);
          transition: all 1s ease-out 0.3s;
        }
        .experience-heading-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .experience-text-block {
          opacity: 0;
          transform: translateX(50px);
          transition: all 1s ease-out 0.5s;
        }
        .experience-text-block-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .experience-card {
          opacity: 0;
          transform: translateX(100px) scale(0.9) rotateY(15deg);
          transition: all 1s ease-out 0.7s;
        }
        .experience-card-visible {
          opacity: 1;
          transform: translateX(0) scale(1) rotateY(0deg);
        }
        .experience-button {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.8s ease-out 0.9s;
        }
        .experience-button-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}