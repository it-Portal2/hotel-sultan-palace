"use client";
import Image from "next/image";

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
  return (
    <section className="w-full" style={{ background: "linear-gradient(2deg, #EFDEC7 11%, #FFFFFF 100%)" }}>
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 py-14 lg:py-20">
        
        <h2 className="font-kaisei font-medium text-3xl md:text-4xl text-[#1D2A3A] text-center">
          EXCLUSIVELY YOURS TO EXPLORE
        </h2>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {features.map((feature, index) => (
            <div key={index} className="group flex flex-col items-center text-center sm:items-start sm:text-left">
              
              {/* Image Container with hover effect */}
              <div className="relative h-75 w-full rounded-3xl shadow-lg overflow-hidden transition-transform duration-300 ease-in-out group-hover:-translate-y-4">
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
    </section>
  );
}