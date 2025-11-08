'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { GrLinkNext } from "react-icons/gr";
import { GrLinkPrevious } from "react-icons/gr";
import { getStoryImages, StoryImage } from '@/lib/firestoreService';
import AboutZanzibar from '@/components/home/about_zanzibar';

export default function OurStoriesPage() {
  const [stories, setStories] = useState<StoryImage[]>([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const testimonialCardRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [sectionVisible, setSectionVisible] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setIsVisible(true);
    (async () => {
      const data = await getStoryImages();
      setStories(data);
    })();

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

  // Enhanced Intersection Observer for sections
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const observedElements = new Set<HTMLElement>();

    const setupObservers = () => {
      const sectionKeys = ['testimonials-section', 'media-section'];
      
      sectionKeys.forEach((key) => {
        const element = sectionRefs.current[key];
        if (element && !observedElements.has(element)) {
          observedElements.add(element);
          
          const rect = element.getBoundingClientRect();
          const isVisibleNow = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (isVisibleNow) {
            setTimeout(() => {
              setSectionVisible((prev) => ({ ...prev, [key]: true }));
              element.classList.add(`stories-${key}-visible`);
            }, 100);
          } else {
            const observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    setSectionVisible((prev) => ({ ...prev, [key]: true }));
                    entry.target.classList.add(`stories-${key}-visible`);
                    observer.unobserve(entry.target);
                  }
                });
              },
              { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
            );
            observer.observe(element);
            observers.push(observer);
          }
        }
      });
    };

    setupObservers();
    const timeoutId = setTimeout(setupObservers, 200);
    const timeoutId2 = setTimeout(setupObservers, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  // Inject styles via useEffect
  useEffect(() => {
    const styleId = 'our-stories-page-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
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


      /* Testimonials Section Animations */
      .stories-testimonials-section {
        opacity: 0 !important;
        transform: translateY(80px) !important;
        transition: all 1.2s ease-out 0.2s !important;
      }
      .stories-testimonials-section.stories-testimonials-section-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .stories-testimonial-card {
        opacity: 0 !important;
        transform: translateY(60px) scale(0.95) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s !important;
      }
      .stories-testimonials-section-visible .stories-testimonial-card {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }

      .stories-testimonial-content {
        opacity: 0 !important;
        transform: translateX(-80px) !important;
        transition: all 0.8s ease-out 0.6s !important;
      }
      .stories-testimonials-section-visible .stories-testimonial-content {
        opacity: 1 !important;
        transform: translateX(0) !important;
      }

      .stories-testimonial-title {
        opacity: 0 !important;
        transform: translateY(-30px) scale(0.9) !important;
        transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s !important;
      }
      .stories-testimonials-section-visible .stories-testimonial-title {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }

      .stories-testimonial-text {
        opacity: 0 !important;
        transform: translateY(30px) !important;
        transition: all 0.8s ease-out 1s !important;
      }
      .stories-testimonials-section-visible .stories-testimonial-text {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .stories-testimonial-author {
        opacity: 0 !important;
        transform: translateX(-30px) !important;
        transition: all 0.6s ease-out 1.2s !important;
      }
      .stories-testimonials-section-visible .stories-testimonial-author {
        opacity: 1 !important;
        transform: translateX(0) !important;
      }

      .stories-testimonial-pagination {
        opacity: 0 !important;
        transform: translateY(30px) scale(0.9) !important;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1.4s !important;
      }
      .stories-testimonials-section-visible .stories-testimonial-pagination {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }

      .stories-testimonial-image {
        opacity: 0 !important;
        transform: translateX(100px) scale(0.9) rotateY(-10deg) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s !important;
      }
      .stories-testimonials-section-visible .stories-testimonial-image {
        opacity: 1 !important;
        transform: translateX(0) scale(1) rotateY(0deg) !important;
      }

      /* Media Section Animations */
      .stories-media-section {
        opacity: 0 !important;
        transform: translateY(80px) !important;
        transition: all 1.2s ease-out 0.2s !important;
      }
      .stories-media-section.stories-media-section-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .stories-media-left {
        opacity: 0 !important;
        transform: translateX(-150px) rotateY(-15deg) scale(0.9) !important;
        transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s !important;
      }
      .stories-media-section-visible .stories-media-left {
        opacity: 1 !important;
        transform: translateX(0) rotateY(0deg) scale(1) !important;
      }

      .stories-media-right {
        opacity: 0 !important;
        transform: translateX(150px) !important;
        transition: all 0.8s ease-out 0.5s !important;
      }
      .stories-media-section-visible .stories-media-right {
        opacity: 1 !important;
        transform: translateX(0) !important;
      }

      .stories-media-item-1 {
        opacity: 0 !important;
        transform: translateX(100px) scale(0.9) !important;
        transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s !important;
      }
      .stories-media-section-visible .stories-media-item-1 {
        opacity: 1 !important;
        transform: translateX(0) scale(1) !important;
      }

      .stories-media-item-2 {
        opacity: 0 !important;
        transform: translateX(100px) scale(0.9) !important;
        transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s !important;
      }
      .stories-media-section-visible .stories-media-item-2 {
        opacity: 1 !important;
        transform: translateX(0) scale(1) !important;
      }


      /* Legacy Card Animations */
      .card-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      /* Legacy Media Animations */
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

        .stories-media-left,
        .stories-media-item-1,
        .stories-media-item-2 {
          transform: translateY(50px) scale(0.9) !important;
        }
        .stories-media-section-visible .stories-media-left,
        .stories-media-section-visible .stories-media-item-1,
        .stories-media-section-visible .stories-media-item-2 {
          transform: translateY(0) scale(1) !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const totalPages = Math.max(stories.length, 1);
  // Build effective list: ensure at least 3 items by padding with defaults
  const defaultText = `From the moment I arrived at Sultan Palace Hotel, I felt the world slow down. The ocean breeze, gentle smiles, and golden light made everything feel calm and effortless. My villa opened to the turquoise sea — every morning began with the sound of waves and the scent of salt in the air.

Days flowed beautifully — snorkeling in clear waters, relaxing at the spa, and dining under starlit skies. Every detail felt personal, every moment peaceful. Sultan Palace wasn't just a hotel; it was where I found my calm again — a place I'll always carry in my heart.`;

  const fallbackImages: StoryImage[] = [
    { id: 'f1', imageUrl: '/story/story1.png', alt: 'Story image', title: 'Where I Found My Calm Again', text: defaultText, author: '', location: '', createdAt: new Date(), updatedAt: new Date() },
    { id: 'f2', imageUrl: '/story/story2.png', alt: 'Story image', title: 'Where I Found My Calm Again', text: defaultText, author: '', location: '', createdAt: new Date(), updatedAt: new Date() },
    { id: 'f3', imageUrl: '/story/story3.png', alt: 'Story image', title: 'Where I Found My Calm Again', text: defaultText, author: '', location: '', createdAt: new Date(), updatedAt: new Date() },
  ];

  let effectiveStories: StoryImage[] = stories;
  if (effectiveStories.length === 0) {
    effectiveStories = fallbackImages;
  } else if (effectiveStories.length < 3) {
    const pad = fallbackImages.filter(f => !effectiveStories.some(s => s.imageUrl === f.imageUrl));
    effectiveStories = [...effectiveStories, ...pad].slice(0, Math.max(3, effectiveStories.length));
  }

  const testimonialIndex = currentTestimonial % effectiveStories.length;
  
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


  return (
    <div className="w-full bg-[#FFFCF6] overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-[600px] md:h-[928px] w-full overflow-hidden">
        <Image
          src="/our-story/hero.png"
          alt="Hero Background"
          fill
          priority
          loading="eager"
          fetchPriority="high"
          quality={90}
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 1 }}
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
       
        {/* Content - Positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center justify-end px-4 sm:px-6 md:px-8 w-full pb-8 sm:pb-12 md:pb-16 lg:pb-20">
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
      <div ref={(el) => { if (el) sectionRefs.current['testimonials-section'] = el; }} className={`bg-[#FFFCF6] py-12 md:py-16 lg:py-20 w-full overflow-x-hidden stories-testimonials-section ${sectionVisible['testimonials-section'] ? 'stories-testimonials-section-visible' : ''}`}>
        <div className="mx-auto px-4 md:px-4 lg:px-6 w-full max-w-full" style={{ maxWidth: '1500px' }}>
          {/* Card Container */}
          <div 
            ref={testimonialCardRef}
            className="bg-white rounded-lg w-full p-8 md:p-12 lg:p-16 stories-testimonial-card"
            style={{
              boxShadow: '0px 4px 42.5px rgba(121, 201, 233, 0.21)'
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              
              {/* Left Column - Testimonials Content */}
              <div className="flex flex-col justify-center order-2 lg:order-1 group stories-testimonial-content">
                <div className="space-y-[64px] mb-[52px]">
                  <h3 className="text-[#000000] text-[28px] md:text-[30px] lg:text-[32px] font-moon-dance leading-[0.84375] tracking-[0.1em] transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#FF6A00] stories-testimonial-title">
                  {effectiveStories[testimonialIndex]?.title || 'Where I Found My Calm Again'}
                </h3>
                
                  <div className="space-y-[32px] stories-testimonial-text">
                    <p className="text-[#000000] text-[18px] md:text-[19px] lg:text-[20px] leading-[1.35] font-moon-dance tracking-[0.05em] whitespace-pre-line transition-all duration-300 group-hover:translate-x-1">
                      {effectiveStories[testimonialIndex]?.text || defaultText}
                    </p>
                  </div>
                </div>
                
                <p className="text-[#000000] text-[18px] md:text-[19px] lg:text-[20px] font-moon-dance leading-[1.35] tracking-[0.1em] mb-8 lg:mb-0 transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#BE8C53] stories-testimonial-author">
                  {[effectiveStories[testimonialIndex]?.author, effectiveStories[testimonialIndex]?.location].filter(Boolean).join(', ')}
                </p>
         
                {/* Pagination Controls */}
                <div className="flex items-center gap-4 md:gap-[97px] justify-start mt-8 w-full overflow-x-auto pb-2 stories-testimonial-pagination">
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
              <div className="relative h-[400px] md:h-[550px] lg:h-[698px] w-full order-1 lg:order-2 group/image overflow-hidden rounded stories-testimonial-image">
              <Image
                src={effectiveStories[testimonialIndex]?.imageUrl || '/our-story/story1.png'} 
                alt={effectiveStories[testimonialIndex]?.alt || 'Hotel guest and staff'}
                fill
                quality={85}
                sizes="(max-width: 1024px) 100vw, 50vw"
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
      <div ref={(el) => { if (el) sectionRefs.current['media-section'] = el; }} className={`relative w-full overflow-x-hidden stories-media-section ${sectionVisible['media-section'] ? 'stories-media-section-visible' : ''}`}>
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
                className="media-item relative h-[400px] md:h-[965px] w-full md:w-[687px] flex-shrink-0 group cursor-pointer overflow-hidden rounded stories-media-left"
              >
                <Image
                  src="/our-story/video1.png"
                  alt="Pool relaxation"
                  fill
                  quality={85}
                  sizes="(max-width: 768px) 100vw, 687px"
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
              <div className="flex flex-col gap-4 w-full md:w-[659px] flex-shrink-0 stories-media-right">
                {/* First Right Image - 659×295px */}
                <div 
                  className="media-item relative h-[250px] md:h-[295px] w-full group cursor-pointer overflow-hidden rounded stories-media-item-1"
                >
                  <Image
                    src="/our-story/video2.png"
                    alt="Infinity pool"
                    fill
                    quality={85}
                    sizes="(max-width: 768px) 100vw, 659px"
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
                  className="media-item relative h-[350px] md:h-[421px] w-full group cursor-pointer overflow-hidden rounded stories-media-item-2"
                >
                  <Image
                    src="/our-story/video3.png"
                    alt="Dining area"
                    fill
                    quality={85}
                    sizes="(max-width: 768px) 100vw, 659px"
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

        {/* About Zanzibar Component */}
        <div className="relative z-10 bg-[#FFFCF6] w-full">
          <AboutZanzibar />
        </div>
      </div>
    </div>
  );
}