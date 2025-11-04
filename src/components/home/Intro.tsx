"use client";
import { useEffect, useRef, useState } from "react";

export default function Intro() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('intro-visible');
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
    <section ref={sectionRef} className="w-full bg-[#FFFCF6] intro-section -mt-12 md:mt-0">
      <div className="container-xl py-4">
        <div className="mx-auto w-full max-w-[1512px] px-4 md:px-6 lg:px-[82px] pt-4 md:pt-8 lg:pt-[73px] pb-8 md:pb-12 lg:pb-[126px]">
          <div className="flex flex-col gap-4 md:gap-[18px] mb-6 md:mb-[53px]">
            <div className={`inline-flex h-[32px] md:h-[36px] items-center rounded-[49px] bg-[rgba(255,106,0,0.19)] px-2 md:px-[10px] py-2 md:py-[10px] self-start intro-badge ${isVisible ? 'intro-badge-visible' : ''}`}>
              <span className="whitespace-nowrap font-quicksand text-[16px] md:text-[18px] font-semibold leading-[1.25] text-[#ED6200]">
                Timeless Luxury
              </span>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4 md:gap-6 lg:gap-[122px]">
              <h2 className={`font-quicksand text-[28px] md:text-[36px] lg:text-[48px] font-bold leading-[1.25] text-[#242F3C] max-w-full lg:max-w-[807px] intro-title ${isVisible ? 'intro-title-visible' : ''}`}>
                Experience Zanzibar in Timeless Luxury
              </h2>
              <p className={`font-quicksand text-left text-[20px] md:text-[24px] font-medium leading-[1.25] text-black max-w-full lg:max-w-[415px] intro-subtitle ${isVisible ? 'intro-subtitle-visible' : ''}`}>
                Where Tranquility Meets Timeless Elegance
              </p>
            </div>
          </div>

          <div className="flex max-w-[1348px] flex-col gap-4 md:gap-[18px]">
            <p className={`font-quicksand text-[16px] md:text-[18px] font-medium leading-[1.25] text-[#282828] intro-text ${isVisible ? 'intro-text-visible' : ''}`}>
              Sultan Palace Hotel invites you to discover the art of refined relaxation. Nestled along the tranquil shores of Zanzibar&apos;s east coast, our resort blends elegant design, personalized hospitality, and breathtaking ocean vistas.
            </p>
            <p className={`font-quicksand text-[16px] md:text-[18px] font-medium leading-[1.25] text-[#282828] intro-text ${isVisible ? 'intro-text-visible' : ''}`} style={{ transitionDelay: '0.2s' }}>
              Whether you&apos;re celebrating love, exploring with family, or simply recharging, our all-inclusive experience surrounds you with indulgence and warmth.
            </p>
            <p className={`font-quicksand text-[16px] md:text-[18px] font-medium leading-[1.25] text-[#282828] intro-text ${isVisible ? 'intro-text-visible' : ''}`} style={{ transitionDelay: '0.4s' }}>
              From curated dining to ocean adventures — <span className="font-semibold text-[#282828]">every detail is crafted for your perfect getaway.</span>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .intro-section {
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s ease-out;
        }
        .intro-section.intro-visible,
        .intro-visible .intro-section {
          opacity: 1;
          transform: translateY(0);
        }
        .intro-badge {
          opacity: 0;
          transform: translateY(-20px) scale(0.9);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .intro-badge-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .intro-title {
          opacity: 0;
          transform: translateX(-50px);
          transition: all 1s ease-out 0.2s;
        }
        .intro-title-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .intro-subtitle {
          opacity: 0;
          transform: translateX(50px);
          transition: all 1s ease-out 0.4s;
        }
        .intro-subtitle-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .intro-text {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }
        .intro-text-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}