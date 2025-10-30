'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { GrLinkNext } from "react-icons/gr";

import { GrLinkPrevious } from "react-icons/gr";

export default function OurStoriesPage() {
  const totalPages = 15;
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [openFaqItems, setOpenFaqItems] = useState<number[]>([]);
  const [showAllFaq, setShowAllFaq] = useState<boolean>(false);
  const faqSectionRef = useRef<HTMLDivElement | null>(null);

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

  type FaqItem = { question: string; answer: string };
  const faqItems: FaqItem[] = [
    { question: 'Which airlines fly to Zanzibar?', answer: 'Multiple international and regional airlines connect to Zanzibar (ZNZ). Check your preferred carrier or aggregator for current routes and schedules.' },
    { question: 'What is the nearest airport to the hotel?', answer: 'Abeid Amani Karume International Airport, Zanzibar (IATA: ZNZ) is the closest airport to the resort areas on the East Coast.' },
    { question: 'How do I get from the airport to the hotel?', answer: 'If you booked via a travel agent, they can arrange ground services. Otherwise, inform the hotel in advance and they can organize transfers at an additional charge.' },
    { question: 'Is the hotel located directly on the beach?', answer: 'Yes. The properties are set right on the powder-soft white sand beaches of Zanzibar’s East Coast.' },
    { question: 'Are the beaches tidal?', answer: 'Like much of the Swahili Coast, the beaches are tidal and change seasonally. During low tide, you can enjoy a complimentary guided reef walk to discover marine life.' },
    { question: 'Are pool towels provided?', answer: 'Yes, pool towels are available at the poolside at no extra charge.' },
    { question: 'What meal plan is offered?', answer: 'Baraza typically offers an all-inclusive meal plan, meaning all meals and house alcoholic and non-alcoholic beverages are included during your stay.' },
    { question: 'Are drinks included?', answer: 'Yes, house alcoholic and non-alcoholic beverages are included with the all-inclusive plan.' },
    { question: 'Can I book Zanzibar excursions directly at the hotel?', answer: 'Yes. The Guest Relations team can help you arrange a variety of local excursions and activities.' },
    { question: 'What are some popular Zanzibar excursions?', answer: 'Popular options include Stone Town tours, Spice Farm visits, Snorkeling at Mnemba, Jozani Forest (red colobus monkeys), and sunset dhow cruises.' },
    { question: 'Does the hotel offer diving and is there a dive school?', answer: 'Diving can be arranged through trusted local operators, and many resorts partner with nearby dive centers for courses and guided dives.' },
    { question: 'Is complimentary Wi‑Fi available in my room/villa?', answer: 'Yes, complimentary Wi‑Fi is available throughout the property, including rooms and villas.' },
    { question: 'Are children allowed at the hotel?', answer: 'Yes, families with children of all ages are welcome. Some facilities and activities may have age guidelines for safety.' },
  ];

  const toggleFaqItem = (index: number) => {
    setOpenFaqItems(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
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
          <div ref={faqSectionRef} className="mx-auto max-w-4xl px-4 md:px-8">
            <h2 className="text-center font-kaisei text-3xl md:text-4xl text-[#655D4E] mb-12">
              Frequently Asked Questions
            </h2>
            <div className="w-[700px] mx-auto max-w-full">
              {(showAllFaq ? faqItems : faqItems.slice(0, 5)).map((item, index) => (
                <div key={index} className="border-b border-[#CBBB9D]">
                  <button
                    onClick={() => toggleFaqItem(index)}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-kaisei text-[#655D4E] text-lg pr-6">
                      {item.question}
                    </span>
                    <div
                      className="text-[#BE8C53] text-3xl font-light transition-transform duration-300 ease-in-out"
                      style={{ transform: openFaqItems.includes(index) ? 'rotate(45deg)' : 'rotate(0deg)' }}
                    >
                      +
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaqItems.includes(index) ? 'max-h-[500px]' : 'max-h-0'}`}
                  >
                    <div className="pt-2 pb-6 pr-8">
                      <p className="font-kaisei text-[#3D3D3D] leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {faqItems.length > 5 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() =>
                      setShowAllFaq(prev => {
                        const next = !prev;
                        if (prev) {
                          requestAnimationFrame(() => {
                            faqSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          });
                        }
                        return next;
                      })
                    }
                    className="px-6 py-2 border border-[#BE8C53] text-[#BE8C53] hover:bg-[#BE8C53] hover:text-white transition-colors rounded"
                  >
                    {showAllFaq ? 'View less' : 'View more'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}