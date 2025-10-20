"use client";
import Image from "next/image";

export default function InRoomFacilities() {
  return (
    <section className="w-full bg-[#F4F4F5] py-16 lg:py-24 overflow-hidden">
      <div className="mx-auto w-full max-w-screen-xl ">
        
       
        <h2 className="font-kaisei text-right font-bold text-4xl md:text-5xl lg:text-6xl leading-tight text-[#202C3B] mb-8 lg:mb-0 mr-30">
          In-Room Facilities
        </h2>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mt-4">
          
          {/* Left Image */}
          <div className="relative w-[750px] h-[450px] lg:h-[600px] z-0">
            <Image 
              src="/figma/inroom.png" 
              alt="Luxurious hotel bathroom interior" 
              fill 
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw" 
            />
          </div>

          <div className="absolute inset-0 z-10">
            <div className="relative h-full w-full">
                
                {/* Paragraph overlapping image */}
                <p className="absolute top-0 left-1/2 translate-x-5 font-kaisei text-2xl md:text-3xl leading-relaxed text-[#242424] w-120">
                    Experience Comfort and Elegance in Your Room
                </p>

                {/* Top two cards row */}
                <div className="absolute top-40 left-1/2 translate-x-5 flex items-stretch gap-6">
                  
                    <div className="w-[250px] bg-white rounded-sm p-6 shadow-lg group cursor-pointer transition-transform duration-300 ease-in-out hover:-translate-x-6">
                        <h3 className="font-kaisei font-bold text-lg text-black mb-4">
                            Refreshments & Snacks
                        </h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li className="font-kaisei text-sm text-black">Tea/Coffee Maker</li>
                            <li className="font-kaisei text-sm text-black">Mini Bar</li>
                        </ul>
                    </div>
                   
                    <div className="w-[250px] bg-[#655D4E] rounded-sm p-6 shadow-lg group cursor-pointer transition-transform duration-300 ease-in-out hover:-translate-y-6">
                        <h3 className="font-kaisei font-bold text-lg text-white mb-4">
                            Entertainment & Safety
                        </h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li className="font-kaisei text-sm text-white">LCD TV</li>
                            <li className="font-kaisei text-sm text-white">Safety Locker</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom card */}
                <div className="absolute top-85 left-1/2 translate-x-20 w-[500px] group cursor-pointer transition-transform duration-300 ease-in-out hover:translate-y-6">
                    <div className="bg-[#242424] rounded-sm p-6 shadow-lg">
                        <h3 className="font-kaisei font-bold text-lg text-white mb-4">
                            Comfort & Relaxation
                        </h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li className="font-kaisei text-sm text-white">Bathrobes</li>
                            <li className="font-kaisei text-sm text-white">Slippers</li>
                            <li className="font-kaisei text-sm text-white">Separate Sea View Balcony with Swing and Cots (available in Ocean and Imperial Rooms)</li>
                        </ul>
                    </div>
                </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}