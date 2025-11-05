"use client";
import Image from "next/image";
import { FaGooglePlay, FaApple } from "react-icons/fa";

export default function AppDownloadPromo() {
  return (
    <section className="relative w-full -mt-20 z-10 bg-[linear-gradient(180deg,#FFFCF6_0%,#CBBB9D_100%)] px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-20 overflow-hidden py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-32">
      <div className="mx-auto w-full max-w-[1512px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <p className="font-kaisei text-sm md:text-base lg:text-lg text-[#CE5600]/90 mb-4 md:mb-5 lg:mb-6">
              Book, relax, and explore—right at your fingertips.
            </p>
            <h3 className="font-kaisei font-bold text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-[56px] text-[#202C3B] leading-tight mb-4 md:mb-5 lg:mb-6">
              Experience Royal Comfort,<br />
              Download Our App
            </h3>
            <p className="mt-4 md:mt-5 lg:mt-6 max-w-xl font-kaisei text-sm md:text-base lg:text-lg leading-relaxed text-[#3D3D3D] mb-6 md:mb-8 lg:mb-10">
              Book your stay, check in online, and explore The Sultan Palace world with ease. Discover restaurant menus, spa schedules, beach activities, and personalized services—all at your fingertips.
            </p>

            <div className="mt-6 md:mt-8 lg:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
              <button className="relative inline-flex items-center gap-3 rounded-lg bg-[#655D4E] px-5 md:px-6 lg:px-8 py-3 md:py-3.5 lg:py-4 text-white font-kaisei text-sm md:text-base tracking-wide overflow-hidden transition-colors duration-300 ease-in-out before:absolute before:inset-0 before:bg-[#ED6200] before:w-0 hover:before:w-full before:transition-all before:duration-300">
                <span className="relative z-10">Explore Our App</span>
                <svg className="relative z-10 w-4 h-4 md:w-5 md:h-5" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="flex items-center gap-4 md:gap-5 lg:gap-6">
                <a href="#" aria-label="Get it on Google Play" className="group">
                  <div className="flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-[#ED6200] transition-transform duration-300 group-hover:scale-110 hover:bg-[#242424]">
                    <FaGooglePlay className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white ml-1" />
                  </div>
                </a>
                <a href="#" aria-label="Download on the App Store" className="group">
                  <div className="flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-[#ED6200] transition-transform duration-300 group-hover:scale-110 hover:bg-[#242424]">
                    <FaApple className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 text-white" />
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="relative order-1 lg:order-2 lg:col-span-7 h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] 2xl:h-[700px]">
            <Image
              src="/story/phone.png"
              alt="Mobile app preview"
              fill
              className="object-contain transform rotate-6 scale-125 md:scale-110 lg:scale-105 xl:scale-100"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}