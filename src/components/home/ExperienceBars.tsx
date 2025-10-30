"use client";
import Image from "next/image";

export default function ExperienceBars() {
  return (
    <section className="w-full bg-[#242424] py-5 lg:py-8 overflow-hidden">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-16 gap-y-20 items-start">
          
          {/* Left Column (takes 2 of 5 columns) */}
          <div className=" pt-10 flex flex-col gap-10 lg:col-span-2">
            <h2 className="pt-10 font-ooh-baby font-bold text-5xl md:text-6xl lg:text-7xl leading-tight text-white">
              Savor Every Moment, Feel Alive
            </h2>
            <div className="relative w-full h-[320px]">
              <Image 
                src="/figma/experience-left.png" 
                alt="Beach bar with stools" 
                fill 
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw" 
              />
            </div>
          </div>

         
          <div className="flex flex-col gap-8 h-full lg:col-span-3">
            
            <div className="max-w-md">
              <h4 className=" pt-10 font-kaisei font-medium text-3xl text-[#BE8C53]">
                Oceanfront Bars & Bliss
              </h4>
              <p className="mt-4 font-kaisei text-base leading-relaxed text-white">
                Enjoy handcrafted cocktails at our beach and in-house bars, where every sip comes with breathtaking ocean views.
              </p>
              
              <button className="group mt-6 flex items-center gap-2 border border-white text-white px-6 py-2 font-kaisei font-bold text-sm tracking-wider transition-all duration-300 ease-in-out">
                <span>Book Now</span>
                <span className="w-0 opacity-0 group-hover:w-5 group-hover:opacity-100 transition-all duration-300 ease-in-out text-lg">→</span>
              </button>
            </div>
            
            <div className="relative w-full md:w-[550px] mt-8 h-[360px] md:h-[500px]">
              <Image 
                src="/figma/experience-right.png" 
                alt="Indoor bar with bright lights" 
                fill 
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              
              
              <div className="absolute h-[300px] md:h-[320px] w-[90%] max-w-[320px] md:w-[280px] bg-white p-6 md:p-8 shadow-lg top-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:top-[-120px] md:right-[-40px] md:left-auto lg:-right-20 transition-all duration-300 ease-in-out origin-top-left md:hover:scale-110 md:hover:shadow-[0_15px_40px_rgba(190,140,83,0.4),0_0_0_1px_rgba(190,140,83,0.15),-15px_15px_30px_rgba(190,140,83,0.3),15px_15px_30px_rgba(190,140,83,0.3)]">
                <h3 className="pt-8 font-kaisei font-bold text-3xl text-black">
                  Refresh, Relax, Repeat
                </h3>
                <p className="mt-8 font-kaisei font-medium text-base text-[#3D3D3D]">
                  Unwind in style with our curated drinks and vibrant atmosphere, perfect for both sunset relaxation and lively evenings.
                </p>
              </div>

              <div className="absolute bottom-0 left-0">
                <button className="w-auto border border-white flex items-center justify-between gap-6 px-6 py-5 text-white bg-black bg-opacity-50 hover:bg-[#ff6a00]  transition-colors duration-300">
                  <span className="font-kaisei font-bold text-lg uppercase">Start your journey</span>
                  <span className="text-2xl">→</span> 
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}