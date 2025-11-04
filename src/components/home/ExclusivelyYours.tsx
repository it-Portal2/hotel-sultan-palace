"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    imgSrc: "/figma/img1.png",
    title: "Dining & Comfort",
    description: "Savor Breakfast, Lunch, Dinner, and Evening Tea, with high-speed Internet for your convenience.",
  },
  {
    imgSrc: "/figma/img2.png",
    title: "Extra Services",
    description: "Add Airport Transfers, Tours, Laundry, Room Service, or Spa Massages for added ease.",
  },
  {
    imgSrc: "/figma/img3.png",
    title: "Your Stay, Your Way",
    description: "Tailor your experience with flexible options for a truly personalized getaway.",
  },
  {
    imgSrc: "/figma/img4.png",
    title: "Fun & Adventure",
    description: "Enjoy Water Sports, Scuba Diving, and unique shopping for memorable experiences.",
  },
];

export default function ExclusivelyYours() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('exclusive-visible');
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
    <section ref={sectionRef} className="w-full exclusive-section" style={{ background: "linear-gradient(2deg, #EFDEC7 11%, #FFFFFF 100%)" }}>
      <div className="mx-auto w-full max-w-8xl px-4 md:px-8 py-14 lg:py-20">
        
        <h2 className={`font-kaisei font-medium text-3xl md:text-4xl text-[#1D2A3A] text-center exclusive-heading ${isVisible ? 'exclusive-heading-visible' : ''}`}>
          EXCLUSIVELY YOURS TO EXPLORE
        </h2>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {features.map((feature, index) => (
            <div key={index} className={`group flex flex-col items-center text-center sm:items-start sm:text-left exclusive-card ${isVisible ? 'exclusive-card-visible' : ''}`} style={{ transitionDelay: `${index * 0.15}s` }}>
              
              {/* Image Container with hover effect */}
              <div className="relative h-[400px] md:h-[420px] w-[350px] md:w-[380px] rounded-3xl shadow-lg overflow-hidden transition-transform duration-300 ease-in-out group-hover:-translate-y-4 active:-translate-y-4">
                <Image
                  src={feature.imgSrc}
                  alt={feature.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              
              {/* Text Content below the image */}
              <div className="mt-6 px-2">
                <h3 className="font-kaisei font-medium text-2xl text-black">
                  {feature.title}
                </h3>
                <p className="mt-3 font-kaisei text-base leading-relaxed text-[#363636]">
                  {feature.description}
                </p>
              </div>

            </div>
          ))}
        </div>
        
      </div>

      <style jsx global>{`
        .exclusive-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out;
        }
        .exclusive-section.exclusive-visible,
        .exclusive-visible .exclusive-section {
          opacity: 1;
          transform: translateY(0);
        }
        .exclusive-heading {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 0.8s ease-out 0.2s;
        }
        .exclusive-heading-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .exclusive-card {
          opacity: 0;
          transform: translateY(60px) scale(0.9);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .exclusive-card-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>
    </section>
  );
}