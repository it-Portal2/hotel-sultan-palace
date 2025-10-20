"use client";
import { useState } from "react";
import Image from "next/image";

const faqItems = [
  "Overview of Zanzibar",
  "Convenience and Value for Money", 
  "Peace of Mind and Stress-Free Experience",
  "Wide Range of Facilities and Activities",
  "Discovering Zanzibar's Beaches",
  "Exploring Zanzibar's Islands",
  "Exciting Activities and Experiences in Zanzibar"
];

export default function AboutZanzibar() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="w-full relative py-16 lg:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Pattern.png"
          alt="Background pattern"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 md:px-8">
        
        
        <h2 className="text-center font-kaisei text-3xl md:text-4xl text-[#655D4E] mb-12">
          About Zanzibar as a Destination
        </h2>
        
      
        <div className="w-[700px] mx-auto">
          {faqItems.map((item, index) => (
            <div key={index} className="border-b border-[#CBBB9D]">
              <button
                onClick={() => toggleItem(index)}
                className="w-full py-4 flex items-center justify-between text-left"
              >
                <span className="font-kaisei text-[#655D4E] text-lg">
                  {item}
                </span>
             
                <div className="text-[#BE8C53] text-3xl font-light transition-transform duration-300 ease-in-out"
                  style={{ transform: openItems.includes(index) ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  +
                </div>
              </button>
              
             
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${openItems.includes(index) ? 'max-h-40' : 'max-h-0'}`}
              >
                <div className="pt-2 pb-6 pr-8">
                  <p className="font-kaisei text-[#3D3D3D] leading-relaxed">
                    Discover more about {item.toLowerCase()} and how it enhances your stay at The Sultan Palace.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}