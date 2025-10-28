'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GrLinkNext } from "react-icons/gr";

import { GrLinkPrevious } from "react-icons/gr";

export default function OurStoriesPage() {
  const totalPages = 15;
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const testimonials = [
    {
      title: "Where I Found My Calm Again",
      text: `From the moment I arrived at Sultan Palace Hotel, I felt the world slow down. The ocean breeze, gentle smiles, and golden light made everything feel calm and effortless. My villa opened to the turquoise sea — every morning began with the sound of waves and the scent of salt in the air.

Days flowed beautifully — snorkeling in clear waters, relaxing at the spa, and dining under starlit skies. Every detail felt personal, every moment peaceful. Sultan Palace wasn't just a hotel; it was where I found my calm again — a place I'll always carry in my heart.`,
      author: "— Anasinsia Ivanova",
      location: "Moscow"
    },
    
  ];

  const testimonialIndex = currentTestimonial % testimonials.length;
  
  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % totalPages);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const renderPagination = () => {
  
    const visiblePages = [0, 1, 2, 3, 4];
    
    return (
        <div className="flex items-center space-x-2 text-lg font-semibold h-full">
            {visiblePages.map((index) => (
                <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`${
                        currentTestimonial === index ? 'text-[#202C3B] font-extrabold' : 'text-[#888888] font-normal'
                    }`}
                >
                    {index + 1}
                </button>
            ))}
            
            <span className="text-[#888888]">..</span> 
            
            <button
                onClick={() => setCurrentTestimonial(totalPages - 1)}
                className={`${
                    currentTestimonial === totalPages - 1 ? 'text-[#202C3B] font-extrabold' : 'text-[#888888] font-normal'
                }`}
            >
                {totalPages}
            </button>
        </div>
    );
  };

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };


  return (
    <div className="w-full bg-white">
   
      <div className="relative h-[670px] w-full">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/our-story/hero.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
       
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <h1 className="text-[#FFFFFF] mt-130 mr-90 text-[70px] font-['Kaisei HarunoUmi'] italic leading-[1.2] tracking-wide" style={{ fontFamily: 'var(--font-kaisei, serif)' }}>
            Voices from Our Guests
          </h1>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-[#FFFCF6]  px-8 lg:px-15">
        <div className="bg-white container mx-auto max-w-[1400px] px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            
            {/* Left Column - Testimonials */}
            <div className="flex flex-col pl-4 lg:pl-8 justify-center order-2 lg:order-1">
              <div className="mt-15">
                <h3 className="text-[#242424] text-[32px] lg:text-[40px] font-moon-dance italic  mb-10">
                  {testimonials[testimonialIndex].title}
                </h3>
                
                <p className="text-[#353026] text-[18px] lg:text-[20px] leading-[1.3] mb-10 lg:mb-12 font-moon-dance italic whitespace-pre-line">
                  {testimonials[testimonialIndex].text}
                </p>
                
                <p className="text-[#242424] text-[25px] font-moon-dance italic mb-8">
                  {testimonials[testimonialIndex].author}, {testimonials[testimonialIndex].location}
                </p>
              </div>

         
              <div className="flex items-center gap-4 justify-start">
            
                <button 
                  onClick={prevTestimonial}
                  className="w-10 h-10 rounded-full bg-[#FF6A00] text-white hover:opacity-80 transition-opacity flex items-center justify-center shadow-md"
                  aria-label="Previous testimonial"
                >
                  <GrLinkPrevious className="w-4 h-4" />
                </button>
                
                {/* Numbered Buttons (Bordered Bar) */}
                <div className="flex items-center space-x-3  h-10 px-4">
                    {renderPagination()}
                </div>
                
                {/* Right Arrow Button (Orange Circle) */}
                <button 
                  onClick={nextTestimonial}
                  className="w-10 h-10 rounded-full bg-[#FF6A00] text-white hover:opacity-80 transition-opacity flex items-center justify-center shadow-md"
                  aria-label="Next testimonial"
                >
                  <GrLinkNext className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative h-[400px] lg:h-[600px] w-[470px] order-1 lg:order-2">
              <Image
                src="/our-story/story1.png" 
                alt="Hotel guest and staff"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

    
      <div className="relative">
     
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/our-story/marissa.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Video Section */}
        <div className="relative z-10 py-16">
          <div className="container mx-auto max-w-[1400px] px-4">
            <div className="grid grid-cols-2 h-[730px] gap-4">
              
              {/* Left - Full Height Image */}
              <div className="relative h-full w-full group cursor-pointer">
                <Image
                  src="/our-story/video1.png"
                  alt="Pool relaxation"
                  fill
                  className="object-cover "
                />
                
              </div>

           
              <div className="flex flex-col gap-4 h-full mt-40">
              
                <div className="relative h-[290px] w-full group cursor-pointer">
                  <Image
                    src="/our-story/video2.png"
                    alt="Infinity pool"
                    fill
                    className="object-cover "
                  />
                 
                </div>

              
                <div className="relative h-[310px] w-full group cursor-pointer">
                  <Image
                    src="/our-story/video3.png"
                    alt="Dining area"
                    fill
                    className="object-cover"
                  />
                
                </div>
              </div>
            </div>
          </div>
        </div>

       
        <div className="relative z-10 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 md:px-8">
            <h2 className="text-center font-kaisei text-3xl md:text-4xl text-[#655D4E] mb-12">
              About Zanzibar as a Destination
            </h2>
            
            <div className="w-[700px] mx-auto">
              {[
                "Overview of Zanzibar",
                "Convenience and Value for Money", 
                "Peace of Mind and Stress-Free Experience",
                "Wide Range of Facilities and Activities",
                "Discovering Zanzibar's Beaches",
                "Exploring Zanzibar's Islands",
                "Exciting Activities and Experiences in Zanzibar"
              ].map((item, index) => (
                <div key={index} className="border-b border-[#CBBB9D]">
                  <button
                    onClick={() => {
                      setExpandedSection(expandedSection === index ? null : index);
                    }}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-kaisei text-[#655D4E] text-lg">
                      {item}
                    </span>
                 
                    <div className="text-[#BE8C53] text-3xl font-light transition-transform duration-300 ease-in-out"
                      style={{ transform: expandedSection === index ? 'rotate(45deg)' : 'rotate(0deg)' }}
                    >
                      +
                    </div>
                  </button>
                  
                 
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedSection === index ? 'max-h-40' : 'max-h-0'}`}
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
        </div>
      </div>
      
    </div>
  );
}