"use client";
import Image from "next/image";

export default function FeaturedCalm() {
  return (
    <section className="w-full ">
    
      <div className="mx-auto max-w-screen-2xl">
        
        <div className="relative">

          
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 hidden w-1/2 bg-[#C29A66] lg:block" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2">
            
            <div className="relative flex min-h-[350px] items-center overflow-hidden bg-[#C29A66] p-8 md:p-12 lg:bg-transparent lg:p-16">
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="h-[350px] w-[350px] rounded-full border border-white/15" />
              </div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="h-[550px] w-[550px] rounded-full border border-white/15" />
              </div>
              <h2 className="relative z-10 max-w-md font-kaisei text-[40px] font-medium leading-tight text-white sm:text-5xl md:text-[56px] lg:ml-auto lg:mr-0">
                Where every moment finds its calm
              </h2>
            </div>

            <div className="group relative min-h-[350px] overflow-hidden">
              <Image 
                src="/figma/featured-top.png" 
                alt="Beachfront resort balcony" 
                fill 
                sizes="(max-width: 1023px) 100vw, 50vw" 
                className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
              />
            </div>

            <div className="group relative min-h-[350px] overflow-hidden lg:transform lg:translate-x-[50px] order-4 lg:order-3">
              <Image 
                src="/figma/featured-bottom.png" 
                alt="Resort garden with ocean view" 
                fill 
                sizes="(max-width: 1023px) 100vw, 50vw" 
                className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
              />
            </div>

            {/* Bottom Right Text - Added z-index to ensure it stays on top */}
            <div className="relative flex min-h-[350px] items-center justify-center overflow-hidden p-8 md:p-12 lg:p-16 lg:z-10 order-3 lg:order-4">
              <div className="pointer-events-none absolute bottom-[-20rem] left-[-15rem] h-[50rem] w-[50rem] rounded-full border border-white/60 " />
              <div className="relative z-10 max-w-lg text-center lg:text-center pl-10">
                <p className="font-kaisei text-base leading-snug text-[#666666]">
                  No two travelers are alike — and neither are their stories.
                </p>
                <p className="mt-6 font-kaisei text-3xl leading-snug text-[#4C3916] md:text-4xl">
                  Every stay reflects you — personalized, heartfelt, and intuitively crafted for perfection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}