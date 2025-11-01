'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { GrLinkNext } from "react-icons/gr";
import { GrLinkPrevious } from "react-icons/gr";

export default function OurStoriesPage() {
  const totalPages = 15;
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [openFaqItems, setOpenFaqItems] = useState<number[]>([]);
  const [showAllFaq, setShowAllFaq] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);
  const faqSectionRef = useRef<HTMLDivElement | null>(null);
  const testimonialCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsVisible(true);

    // Intersection Observer for testimonial card
    const testimonialObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('card-visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    // Intersection Observer for video/images
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('media-visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    if (testimonialCardRef.current) {
      testimonialObserver.observe(testimonialCardRef.current);
    }

    const videoElements = document.querySelectorAll('.media-item');
    videoElements.forEach((el) => videoObserver.observe(el));

    return () => {
      if (testimonialCardRef.current) {
        testimonialObserver.unobserve(testimonialCardRef.current);
      }
      videoElements.forEach((el) => videoObserver.unobserve(el));
    };
  }, []);

  const testimonials = [
    {
      title: "Where I Found My Calm Again",
      text: `From the moment I arrived at Sultan Palace Hotel, I felt the world slow down. The ocean breeze, gentle smiles, and golden light made everything feel calm and effortless. My villa opened to the turquoise sea — every morning began with the sound of waves and the scent of salt in the air.

Days flowed beautifully — snorkeling in clear waters, relaxing at the spa, and dining under starlit skies. Every detail felt personal, every moment peaceful. Sultan Palace wasn't just a hotel; it was where I found my calm again — a place I'll always carry in my heart.`,
      author: "— Anastasia Ivanova",
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
      <div className="flex items-center space-x-1 md:space-x-2 text-[16px] md:text-[20px] font-normal leading-[1.35] tracking-[0.05em] md:tracking-[0.1em] h-full font-playpen-sans flex-shrink-0">
            {visiblePages.map((index) => (
                <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
            className={`px-1 ${
              currentTestimonial === index ? 'text-[#000000] font-bold' : 'text-[#000000] font-normal'
                    }`}
                >
                    {index + 1}
                </button>
            ))}
            
        <span className="text-[#000000] px-1">...</span> 
            
            <button
                onClick={() => setCurrentTestimonial(totalPages - 1)}
          className={`px-1 ${
            currentTestimonial === totalPages - 1 ? 'text-[#000000] font-bold' : 'text-[#000000] font-normal'
                }`}
            >
                {totalPages}
            </button>
        </div>
    );
  };

  type FaqItem = { question: string; answer: string };
  const faqItems: FaqItem[] = [
    { question: 'Overview of Zanzibar', answer: 'Zanzibar is a semi-autonomous archipelago off the coast of Tanzania, known for its pristine beaches, rich history, and vibrant culture.' },
    { question: 'Convenience and Value for Money', answer: 'Zanzibar offers excellent value with beautiful accommodations, delicious cuisine, and unforgettable experiences at competitive prices.' },
    { question: 'Peace of Mind and Stress-Free Experience', answer: 'Our team ensures a seamless experience from booking to departure, handling all arrangements so you can relax and enjoy.' },
    { question: 'Wide Range of Facilities and Activities', answer: 'From water sports to cultural tours, our resort offers diverse activities to suit every interest and age group.' },
    { question: 'Discovering Zanzibar\'s Beaches', answer: 'Explore pristine white sand beaches, coral reefs, and turquoise waters that make Zanzibar a tropical paradise.' },
    { question: 'Exploring Zanzibar\'s Islands', answer: 'Visit nearby islands like Mnemba, Chumbe, and Prison Island for unique wildlife encounters and stunning natural beauty.' },
    { question: 'Exciting Activities and Experiences in Zanzibar', answer: 'From spice tours to sunset dhow cruises, Zanzibar offers countless adventures for every type of traveler.' },
  ];

  const toggleFaqItem = (index: number) => {
    setOpenFaqItems(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  return (
    <div className="w-full bg-[#FFFCF6] overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-[520px] md:h-[700px] lg:h-[860px] w-full overflow-hidden">
        <Image
          src="/our-story/hero.png"
          alt="Hero Background"
          fill
          priority
          className="object-cover"
        />
        
        {/* Gradient Overlays */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0) 71%, rgba(255, 255, 255, 0.67) 85%, rgba(255, 255, 255, 1) 98%)"
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: "linear-gradient(0deg, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 1) 100%)"
          }}
        />
       
        {/* Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full  px-4 sm:px-6 md:px-8 w-full">
          <h1 
            className="relative z-10 text-[#FFFFFF] text-[32px] sm:text-[42px] md:text-[56px] lg:text-[72px] xl:text-[96px] font-moon-dance leading-[1.2] tracking-[0.05em] text-center w-full max-w-full px-2"
            style={{
              textShadow: '0px 2px 12px rgba(0, 0, 0, 0.9), 0px 4px 24px rgba(0, 0, 0, 0.7), 0px 8px 40px rgba(0, 0, 0, 0.5), 0px 0px 60px rgba(0, 0, 0, 0.3)',
              WebkitTextStroke: '2px rgba(0, 0, 0, 0.5)',
              filter: 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.8))'
            }}
          >
            <span className="flex flex-wrap justify-center gap-x-1 sm:gap-x-2 gap-y-1 w-full">
              {"Voices from Our Guests".split(" ").map((word, index) => (
                <span
                  key={index}
                  className={`inline-block hero-word ${
                    isVisible ? "hero-word-visible" : ""
                  }`}
                  style={{
                    animationDelay: `${index * 0.15}s`,
                  }}
                >
                  <span className="relative inline-block px-1 text-animate">
                    {word.split("").map((char, charIndex) => (
                      <span
                        key={charIndex}
                        className="inline-block char-animate"
                        style={{
                          animationDelay: `${index * 0.15 + charIndex * 0.05}s`,
                        }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
            </span>
          </h1>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-[#FFFCF6] py-12 md:py-16 lg:py-20 w-full overflow-x-hidden">
        <div className="mx-auto px-4 md:px-4 lg:px-6 w-full max-w-full" style={{ maxWidth: '1500px' }}>
          {/* Card Container */}
          <div 
            ref={testimonialCardRef}
            className="bg-white rounded-lg w-full p-8 md:p-12 lg:p-16 opacity-0 translate-y-12 transition-all duration-1000 ease-out"
            style={{
              boxShadow: '0px 4px 42.5px rgba(121, 201, 233, 0.21)'
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              
              {/* Left Column - Testimonials Content */}
              <div className="flex flex-col justify-center order-2 lg:order-1 group">
                <div className="space-y-[64px] mb-[52px]">
                  <h3 className="text-[#000000] text-[28px] md:text-[30px] lg:text-[32px] font-moon-dance leading-[0.84375] tracking-[0.1em] transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#FF6A00]">
                  {testimonials[testimonialIndex].title}
                </h3>
                
                  <div className="space-y-[32px]">
                    <p className="text-[#000000] text-[18px] md:text-[19px] lg:text-[20px] leading-[1.35] font-moon-dance tracking-[0.05em] whitespace-pre-line transition-all duration-300 group-hover:translate-x-1">
                      From the moment I arrived at Sultan Palace Hotel, I felt the world slow down. The ocean breeze, gentle smiles, and golden light made everything feel calm and effortless. My villa opened to the turquoise sea — every morning began with the sound of waves and the scent of salt in the air.
                    </p>
                    
                    <p className="text-[#000000] text-[18px] md:text-[19px] lg:text-[20px] leading-[1.35] font-moon-dance tracking-[0.05em] whitespace-pre-line transition-all duration-300 group-hover:translate-x-1">
                      Days flowed beautifully — snorkeling in clear waters, relaxing at the spa, and dining under starlit skies. Every detail felt personal, every moment peaceful. Sultan Palace wasn't just a hotel; it was where I found my calm again — a place I'll always carry in my heart.
                    </p>
                  </div>
                </div>
                
                <p className="text-[#000000] text-[18px] md:text-[19px] lg:text-[20px] font-moon-dance leading-[1.35] tracking-[0.1em] mb-8 lg:mb-0 transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#BE8C53]">
                  {testimonials[testimonialIndex].author}, {testimonials[testimonialIndex].location}
                </p>
         
                {/* Pagination Controls */}
                <div className="flex items-center gap-4 md:gap-[97px] justify-start mt-8 w-full overflow-x-auto pb-2">
                <button 
                  onClick={prevTestimonial}
                    className="w-[38px] h-[37px] rounded-[43px] bg-[#FF6A00] text-white hover:opacity-90 hover:scale-110 transition-all duration-300 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg"
                  aria-label="Previous testimonial"
                >
                    <GrLinkPrevious className="w-4 h-4 transition-transform duration-300 hover:-translate-x-1" />
                </button>
                
                  {/* Numbered Pagination */}
                  <div className="flex items-center h-[37px] flex-shrink-0">
                    {renderPagination()}
                </div>
                
                <button 
                  onClick={nextTestimonial}
                    className="w-[38px] h-[37px] rounded-[43px] bg-[#FF6A00] text-white hover:opacity-90 hover:scale-110 transition-all duration-300 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg"
                  aria-label="Next testimonial"
                >
                    <GrLinkNext className="w-4 h-4 transition-transform duration-300 hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Right Column - Image */}
              <div className="relative h-[400px] md:h-[550px] lg:h-[698px] w-full order-1 lg:order-2 group/image overflow-hidden rounded">
              <Image
                src="/our-story/story1.png" 
                alt="Hotel guest and staff"
                fill
                  className="object-cover rounded transition-transform duration-700 ease-out group-hover/image:scale-110"
              />
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video/Images Section */}
      <div className="relative w-full overflow-x-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/our-story/marissa.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Video Section */}
        <div className="relative z-10 py-16 md:py-20 w-full">
          <div className="mx-auto px-4 md:px-4 lg:px-6 w-full max-w-full" style={{ maxWidth: '1500px' }}>
            <div className="flex flex-col md:flex-row gap-4 md:gap-4 items-start justify-center w-full">
              
              {/* Left Image - 687×965px */}
              <div 
                className="media-item relative h-[400px] md:h-[965px] w-full md:w-[687px] flex-shrink-0 group cursor-pointer opacity-0 md:translate-x-[-50px] transition-all duration-1000 ease-out overflow-hidden rounded"
                style={{ animationDelay: '0.1s' }}
              >
                <Image
                  src="/our-story/video1.png"
                  alt="Pool relaxation"
                  fill
                  className="object-cover rounded transition-transform duration-700 ease-out group-hover:scale-110"
                />
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
                {/* Play Button - centered */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-[70px] h-[70px] rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
                      <path d="M8 5v14l11-7L8 5z" fill="#242424"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right Column - Two Images - 659px width */}
              <div className="flex flex-col gap-4 w-full md:w-[659px] flex-shrink-0">
                {/* First Right Image - 659×295px */}
                <div 
                  className="media-item relative h-[250px] md:h-[295px] w-full group cursor-pointer opacity-0 md:translate-x-[50px] transition-all duration-1000 ease-out overflow-hidden rounded"
                  style={{ animationDelay: '0.2s' }}
                >
                  <Image
                    src="/our-story/video2.png"
                    alt="Infinity pool"
                    fill
                    className="object-cover rounded transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-[70px] h-[70px] rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
                        <path d="M8 5v14l11-7L8 5z" fill="#242424"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Second Right Image - 659×421px */}
                <div 
                  className="media-item relative h-[350px] md:h-[421px] w-full group cursor-pointer opacity-0 md:translate-x-[50px] transition-all duration-1000 ease-out overflow-hidden rounded"
                  style={{ animationDelay: '0.3s' }}
                >
                  <Image
                    src="/our-story/video3.png"
                    alt="Dining area"
                    fill
                    className="object-cover rounded transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-[70px] h-[70px] rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
                        <path d="M8 5v14l11-7L8 5z" fill="#242424"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="relative z-10 py-16 md:py-24 bg-[#FFFCF6] w-full overflow-x-hidden">
          <div ref={faqSectionRef} className="mx-auto max-w-[845px] px-4 md:px-8 w-full">
            <h2 className="text-[#2C271C] text-[32px] md:text-[36px] lg:text-[40px] font-kaisei-decol font-bold leading-[1.448] mb-12 md:mb-16 text-center lg:text-left">
              About Zanzibar as a Destination
            </h2>
            <div className="w-full">
              {(showAllFaq ? faqItems : faqItems.slice(0, 5)).map((item, index) => (
                <div key={index}>
                  <button
                    onClick={() => toggleFaqItem(index)}
                    className="w-full py-4 flex items-center justify-between text-left gap-[212px] hover:bg-[#FFFCF6]/50 transition-colors duration-300 rounded px-2 -mx-2 group/faq"
                  >
                    <span className="text-[#1D1C19] text-[18px] md:text-[20px] font-kaisei-decol leading-[1.448] flex-1 transition-colors duration-300 group-hover/faq:text-[#BE8C53]">
                      {item.question}
                    </span>
                    <div
                      className="text-[#000000] text-2xl md:text-3xl font-light transition-all duration-300 ease-in-out flex-shrink-0 group-hover/faq:text-[#FF6A00] group-hover/faq:scale-110"
                      style={{ transform: openFaqItems.includes(index) ? 'rotate(45deg)' : 'rotate(0deg)' }}
                    >
                      +
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openFaqItems.includes(index) ? 'max-h-[500px]' : 'max-h-0'
                    }`}
                  >
                    <div className="pt-2 pb-6 pr-8">
                      <p className="text-[#1D1C19] text-[16px] md:text-[18px] font-kaisei-decol leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                  {index < faqItems.length - 1 && (
                    <div className="h-px bg-black/24"></div>
                  )}
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
                    className="px-6 py-2 border border-[#BE8C53] text-[#BE8C53] hover:bg-[#BE8C53] hover:text-white transition-all duration-300 rounded hover:scale-105 hover:shadow-md"
                  >
                    {showAllFaq ? 'View less' : 'View more'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        /* Hero Heading Animations - Text Animation */
        .hero-word {
          opacity: 0;
        }

        .hero-word-visible {
          opacity: 1;
        }

        /* Character-by-character animation */
        .char-animate {
          display: inline-block;
          opacity: 0;
          transform: translateY(30px) scale(0.5) rotateX(90deg);
          animation: charReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes charReveal {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.5) rotateX(90deg);
            filter: blur(8px);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-5px) scale(1.1) rotateX(0deg);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0deg);
            filter: blur(0px);
          }
        }

        /* Continuous text animation effects */
        .text-animate {
          animation: textGlow 3s ease-in-out infinite;
        }

        @keyframes textGlow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.2));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.4));
          }
        }

        /* Word container animation */
        .hero-word-visible .text-animate {
          animation: wordFloat 4s ease-in-out infinite;
        }

        @keyframes wordFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }


        /* Card Animations */
        .card-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        /* Media Animations */
        .media-visible {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }

        @media (max-width: 768px) {
          .media-visible {
            transform: translateY(0) !important;
          }
          
          .media-item {
            transform: translateY(30px) !important;
          }
        }

        /* FAQ Animations */
        .faq-item {
          transition: all 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}