"use client";
import Image from "next/image";

export default function FeaturedCalm() {
  return (
    <section className="w-full relative overflow-hidden px-0 mx-0">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="relative flex flex-col">
          <div className="relative flex min-h-[400px] items-center overflow-hidden bg-[#C29A66] p-8 md:p-12">
            <h2 className="relative z-10 max-w-md font-[Kaisei_Decol] text-[40px] font-bold leading-[1.448] text-white">
              Where every moment finds its calm
            </h2>
          </div>
          
          <div className="group relative h-[500px] overflow-hidden">
            <Image 
              src="/figma/featured-top.png" 
              alt="Beachfront resort balcony" 
              fill 
              sizes="100vw" 
              className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
            />
          </div>

          <div className="group relative h-[500px] overflow-hidden">
            <Image 
              src="/figma/featured-bottom.png" 
              alt="Resort garden with ocean view" 
              fill 
              sizes="100vw" 
              className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
            />
          </div>

          <div className="relative flex min-h-[385px] items-center justify-center bg-[#E8E4D9] p-8 md:p-12">
            <div className="relative z-10 max-w-[423px] text-center">
              <p className="font-[Kaisei_Decol] text-[16px] font-medium leading-[1.448] text-[#666666] mb-[49px]">
                No two travelers are alike — and neither are their stories.
              </p>
              <p className="font-[Kaisei_Decol] text-[32px] font-medium leading-[1.448] text-[#4C3916]">
                Every stay reflects you — personalized, heartfelt, and intuitively crafted for perfection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block w-full relative overflow-hidden" style={{ height: '1079px' }}>
        {/* Left side - Brown background */}
        <div className="absolute left-0 top-0 w-[762px] h-[1243px] bg-[#C29A66]" />
        
        {/* Decorative Circles */}
        <div className="pointer-events-none absolute left-[436px] top-[-360px]">
          <div className="h-[760px] w-[760px] rounded-full border-[20px] border-[rgba(190,140,83,0.46)] bg-transparent" />
        </div>
        <div className="pointer-events-none absolute left-[-345px] top-[306px]">
          <div className="h-[970px] w-[970px] rounded-full border-[6px] border-[rgba(255,255,255,0.1)] bg-transparent" />
        </div>
        <div className="pointer-events-none absolute left-[756px] top-[791px]">
          <div className="h-[915px] w-[915px] rounded-full border-[6px] border-[rgba(255,255,255,0.38)] bg-transparent" />
        </div>
        
        {/* Main heading */}
        <h2 className="absolute z-10 max-w-[618px] font-[Kaisei_Decol] text-[64px] font-bold leading-[1.448] text-white left-[155px] top-[140px]">
          Where every moment finds its calm
        </h2>

        {/* Top right image - extends to bottom image start (524px), right side extends to edge */}
        <div className="absolute left-[762px] top-0 right-0 h-[524px] overflow-hidden">
          <Image 
            src="/figma/featured-top.png" 
            alt="Beachfront resort balcony" 
            width={750}
            height={524}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-110"
          />
        </div>

        {/* Bottom right beige section - starts right after top image, right side extends to edge */}
        <div className="absolute left-[762px] top-[524px] right-0 h-[555px] bg-[#E8E4D9]" />

        {/* Bottom left image */}
        <div className="absolute left-[57px] top-[524px] w-[813px] h-[555px] overflow-hidden">
          <Image 
            src="/figma/featured-bottom.png" 
            alt="Resort garden with ocean view" 
            fill 
            sizes="813px" 
            className="object-cover transition-transform duration-300 ease-in-out hover:scale-110"
          />
        </div>

        {/* Bottom Right Text */}
        <div className="absolute left-[975px] top-[609px] w-[423px] h-[385px] flex items-center justify-center z-10">
          <div className="w-full text-center">
            <p className="font-[Kaisei_Decol] text-[16px] font-medium leading-[1.448] text-[#666666] mb-[95px] ml-[55px]">
              No two travelers are alike — and neither are their stories.
            </p>
            <p className="font-[Kaisei_Decol] text-[40px] font-medium leading-[1.448] text-[#4C3916]">
              Every stay reflects you — personalized, heartfelt, and intuitively crafted for perfection.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}