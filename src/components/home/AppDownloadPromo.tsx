"use client";
import Image from "next/image";
import { FaGooglePlay, FaApple } from "react-icons/fa";

export default function AppDownloadPromo() {
  return (
   
    <section className="relative w-full -mt-20 z-10 bg-[linear-gradient(180deg,#FFFCF6_0%,#CBBB9D_100%)] px-20 md:px-25 lg:px-30 overflow-hidden">
      <div className="mx-auto w-full">
       
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 items-center">
          
         
          <div className="order-2 lg:order-1 lg:col-span-5">
            <p className="font-kaisei text-sm md:text-base text-[#CE5600]/90 mb-4">
              Book, relax, and explore—right at your fingertips.
            </p>
            <h3 className="font-kaisei font-bold text-xl md:text-2xl lg:text-3xl text-[#202C3B]">
              Experience Royal Comfort,<br />
              Download Our App
            </h3>
            <p className="mt-4 max-w-xl font-kaisei text-sm md:text-base leading-relaxed text-[#3D3D3D]">
              Book your stay, check in online, and explore The Sultan Palace world with ease. Discover restaurant menus, spa schedules, beach activities, and personalized services—all at your fingertips.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <button className=" relative inline-flex items-center gap-3 rounded-lg bg-[#655D4E]  px-5 py-3 text-white font-kaisei text-sm tracking-wide  overflow-hidden transition-colors duration-300 ease-in-out before:absolute before:inset-0 before:bg-[#ED6200]  before:w-0 hover:before:w-full before:transition-all before:duration-300">
                <span className="relative z-10 ">Explore Our App</span>
                <svg className="relative z-10" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="flex items-center gap-4">
                  <a href="#" aria-label="Get it on Google Play" className="group">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ED6200] transition-transform duration-300 group-hover:scale-110 hover:bg-[#242424]">
                      <FaGooglePlay className="h-5 w-5 text-white ml-1" />
                    </div>
                  </a>
                  <a href="#" aria-label="Download on the App Store" className="group">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ED6200] transition-transform duration-300 group-hover:scale-110 hover:bg-[#242424]">
                      <FaApple className="h-7 w-7 text-white" />
                    </div>
                  </a>
              </div>
            </div>
          </div>

         
          <div className="relative order-1 lg:order-2 lg:col-span-7 h-[480px] lg:h-[620px]">
              <Image
                src="/story/phone.png"
                alt="Mobile app preview"
                fill
                className="object-contain transform rotate-6 scale-125"
                sizes="60vw"
                priority
              />
          </div>
        </div>
      </div>
    </section>
  );
}