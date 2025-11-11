"use client";
import { FaPlay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ContactUsButton from "@/components/ui/ContactUsButton";

export default function AboutUsPage() {
  const [currentImageSet, setCurrentImageSet] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const happyMomentsRef = useRef<HTMLDivElement>(null);
  const commitmentRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const happyMomentsImages = [
    '/Happy-Moment/img1.png',
    '/Happy-Moment/img2.png',
    '/Happy-Moment/img3.png',
    '/Happy-Moment/img4.png',
   
  ];

  const nextImage = () => {
    setCurrentImageSet((prev) => (prev + 1) % happyMomentsImages.length);
  };

  const prevImage = () => {
    setCurrentImageSet((prev) => (prev - 1 + happyMomentsImages.length) % happyMomentsImages.length);
  };

  useEffect(() => {
    setIsVisible(true);

    const observers = [
      { ref: heroRef, threshold: 0.1 },
      { ref: videoRef, threshold: 0.2 },
      { ref: contentRef, threshold: 0.2 },
      { ref: happyMomentsRef, threshold: 0.2 },
      { ref: commitmentRef, threshold: 0.2 },
      { ref: ctaRef, threshold: 0.2 },
    ];

    const observerInstances: IntersectionObserver[] = [];

    observers.forEach(({ ref, threshold }) => {
      if (ref.current) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
              }
            });
          },
          { threshold, rootMargin: '0px' }
        );
        observer.observe(ref.current);
        observerInstances.push(observer);
      }
    });

    return () => {
      observerInstances.forEach(observer => observer.disconnect());
    };
  }, []);

  return (
    <div className="w-full bg-[#FFFCF6]">
      {/* Hero Section */}
      <div ref={heroRef} className="relative h-[520px] sm:h-[800px] md:h-[1000px] lg:h-[1319px] w-full">
        {/* Background Image */}
        <Image
          src="/about-main-bg.png"
          alt="About Us Hero Background"
          fill
          priority
          loading="eager"
          fetchPriority="high"
          quality={90}
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 1 }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <div className="text-center max-w-4xl mt-100 pb-16 md:pb-0">
            <div className={`mb-3 md:mb-6 hero-label ${isVisible ? 'hero-label-visible' : ''}`}>
              <h1 className="text-[#FFEAD3] text-[18px] sm:text-[20px] md:text-[25px] font-bold uppercase tracking-[2px] md:tracking-[3.25px] mb-2 md:mb-4">
                about us
              </h1>
            </div>
            <h2 className={`text-white text-[24px] sm:text-[32px] md:text-[40px] font-bold uppercase leading-[1.3] md:leading-[1.475] tracking-[0.5px] md:tracking-[0.8px] mb-3 md:mb-8 px-2 hero-title ${isVisible ? 'hero-title-visible' : ''}`}>
              About Sultan Palace Hotel
            </h2>
            <p className={`text-white text-[14px] sm:text-[16px] md:text-[18px] font-normal leading-[1.6] tracking-[0.5px] md:tracking-[0.72px] max-w-[879px] px-2 hero-text ${isVisible ? 'hero-text-visible' : ''}`}>
              Welcome to Sultan Palace Hotel, a hidden sanctuary on the breathtaking south-east coast of Zanzibar. 
              Nestled between white sandy beaches and turquoise waters, our resort is a blend of timeless elegance, 
              Swahili charm, and modern luxury — designed for travelers who seek peace, beauty, and personalized comfort.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div 
            className="w-full h-[180px] sm:h-[280px] md:h-[340px] lg:h-[400px]"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 91, 78, 0) 0%, rgba(21, 91, 76, 0.23) 23%, rgba(24, 91, 76, 0.35) 35%, rgba(30, 91, 78, 0.46) 46%, rgba(88, 133, 124, 0.60) 60%, #DAE4E2 82%, #ffffff 100%)'
            }}
          />
        </div>
      </div>

      {/* YouTube video - Visible on all devices */}
      {/* <div ref={videoRef} className="w-full px-4 md:px-6 lg:px-8 mt-4 md:-mt-20 lg:-mt-70 mb-4 md:mb-8 relative z-30 video-container">
        <div className="relative w-full max-w-6xl mx-auto rounded-lg overflow-hidden shadow-2xl">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/YSJ7RyybG48?si=TQhhlDo8GBaMOVOC"
              title="Sultan Palace Hotel Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div> */}

     
      <div ref={contentRef} className="relative bg-[#FFFCF6] pt-4 md:pt-8 pb-10 md:pb-16 lg:pt-16 lg:pb-24 -mt-4 md:-mt-8 relative z-30">
        <div className="w-full overflow-hidden">
          <div className="relative w-full md:h-[982px] grid md:block">
            {/* Container with max-width matching Figma */}
            <div className="relative mx-auto max-w-[1623px] w-full">
            
              {/* Heading - Welcome to Sultan Palace Hotel */}
              <div className="md:absolute left-[50px] top-0 w-full md:w-[630px] h-[50px] flex items-start px-4 md:px-0 z-20 mb-4 md:mb-0 content-heading">
                <h3 className="text-[#242424] text-[22px] sm:text-[28px] md:text-[40px] font-semibold leading-[1.25] font-['Quicksand']">
                  Welcome to Sultan Palace Hotel
                </h3>
              </div>
              
              {/* Left Image - Rectangle 52 */}
              <div 
                className="md:absolute left-0 md:top-[92px] w-[350px] sm:w-[450px]   md:w-[700px] h-[280px] sm:h-[380px] md:h-[568px] rounded-none md:rounded-[14px] overflow-hidden mt-12 md:mt-0 content-image-left group/image-left"
                style={{
                  backgroundImage: 'url(/about-content-left-bg.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              
              {/* Right Text Frame - Frame 820 */}
              <div className="md:absolute left-[838px] md:top-[92px] w-full md:w-[500px] h-auto px-2 md:px-3 lg:px-4 content-text-right">
                <div className="flex flex-col gap-[31px]">
                  <h3 className="text-[#2D2922] text-[22px] sm:text-[24px] md:text-[26px] font-semibold leading-[1.25] font-['Quicksand'] group-hover:text-[#F96406] transition-colors duration-300">
                    Where Timeless Elegance Meets the Ocean Breeze
                  </h3>
                  <div className="space-y-4">
                    <p className="text-[#353026] text-[15px] sm:text-[16px] md:text-[16px] font-normal leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
                      More than a destination, Sultan Palace Hotel is a feeling — a sanctuary where every sunrise brings a sense of renewal and every sunset whispers stories of the sea. Nestled along Zanzibar&apos;s unspoiled coastline, our resort embodies the island&apos;s royal heritage, blending traditional Swahili architecture with modern luxury.
                    </p>
                    <p className="text-[#353026] text-[15px] sm:text-[16px] md:text-[16px] font-normal leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
                      Here, time slows down. You&apos;ll wake to the sound of waves, walk barefoot on soft white sands, and rediscover what it means to truly unwind. Every detail, from handcrafted interiors to personalized service, is designed to offer you freedom, warmth, and connection — with yourself and with the beauty that surrounds you.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right Image - Rectangle 53 */}
              <div 
                className="md:absolute left-[838px] md:top-[501px] w-full md:w-[785px] h-[280px] sm:h-[380px] md:h-[481px] rounded-none md:rounded-[14px] overflow-hidden mt-8 md:mt-20 content-image-right group/image-right"
                style={{
                  backgroundImage: 'url(/about-content-right-bg.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              
              {/* Left Text Frame - Frame 821 */}
              <div className="md:absolute left-[107px] md:top-[702px] w-full md:w-[571px] h-auto px-4 md:px-0 mt-8 md:mt-0 content-text-left">
                <div className="flex flex-col gap-[31px]">
                  <h3 className="text-[#2D2922] text-[22px] sm:text-[24px] md:text-[26px] font-semibold leading-[1.25] font-['Quicksand'] group-hover:text-[#F96406] transition-colors duration-300">
                    Our Philosophy
                  </h3>
                  <div className="space-y-4">
                    <p className="text-[#353026] text-[15px] sm:text-[16px] md:text-[16px] font-normal leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
                      At Sultan Palace Hotel, we believe that true luxury is about experience, not excess. We invite our guests to embrace spontaneity — to follow the rhythm of their own hearts. Whether that means a sunrise yoga session overlooking the ocean, an afternoon of adventure exploring coral reefs, or a moonlit dinner by the shore — the choice is always yours.
                    </p>
                    <p className="text-[#353026] text-[15px] sm:text-[16px] md:text-[16px] font-normal leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
                      Our mission is to create moments that stay with you long after you&apos;ve left our shores — moments of joy, discovery, and belonging.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commitment Section */}
      <div ref={commitmentRef} className="relative min-h-screen commitment-section">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/image%2049.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-white/30" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 ">
          <div className="container mt-0 md:-mt-90 mx-auto max-w-[915px] text-center flex flex-col gap-[30px]">
            <h3 className="text-[#212121] text-[26px] sm:text-[32px] md:text-[40px] font-semibold leading-[1.2] tracking-[0.01em] font-['Quicksand']">
              Our Commitment to Zanzibar
            </h3>
            <div className="text-[#272218] text-[16px] font-medium leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
              <p className="mb-2">
                Proudly rooted in local culture, we are dedicated to uplifting the Zanzibari community through training, employment, and sustainability programs. From sourcing fresh island produce to supporting traditional artisans, we celebrate the spirit of Zanzibar in everything we do.
              </p>
              <p>
                Our team — many of whom have grown with us since the beginning — embodies the heart of Sultan Palace: warm, genuine, and ever welcoming.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Happy Moments Section */}
      <div ref={happyMomentsRef} className="relative py-10 sm:py-14 lg:py-24 bg-[#FFFCF6]">
        <div className="container mx-auto max-w-[1880px] px-4">
          {/* Main Container - Column layout with center alignment and 57px gap */}
          <div className="flex flex-col items-center gap-[57px]">
            
            {/* Header Frame - Happy Moments text and line */}
            <div className="flex flex-col items-center gap-[17px] w-full max-w-[495px]">
              <h3 className="text-[#353535] text-[28px] sm:text-[32px] md:text-[40px] lg:text-[48px] font-semibold leading-[0.694444] text-center font-['Quicksand'] happy-moments-title">
                Happy Moments
              </h3>
              <div 
                className="w-full h-px"
                style={{
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(0, 80, 108, 1) 48%, rgba(255, 255, 255, 1) 100%)'
                }}
              ></div>
            </div>
            
            {/* Image Gallery Frame - Buttons always visible; 1 image on mobile, 3 on md+ */}
            <div className="flex items-center gap-[16px] md:gap-[25px] w-full justify-center flex-wrap">
              {/* Previous Button */}
              <button
                onClick={prevImage}
                className="w-[42px] h-[42px] md:w-[49px] md:h-[49px] bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0 z-10"
                style={{ boxShadow: '0px 4px 11.1px 0px rgba(0, 0, 0, 0.25)' }}
              >
                <FaChevronLeft className="text-[#FF6A00] text-base md:text-lg" />
              </button>

              {/* Image Gallery Container */}
              <div className="flex gap-[16px] md:gap-[25px] justify-center items-center flex-1 min-w-0 w-full">
                {([0,1,2] as const).map((offset, index) => {
                  const image = happyMomentsImages[(currentImageSet + offset) % happyMomentsImages.length];
                  const visibility = index === 0 ? '' : 'hidden md:block';
                  return (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-[90vw] max-w-[356px] h-[368px] rounded-lg overflow-hidden gallery-image-card ${visibility}`}
                      style={{ 
                        boxShadow: '0px 4px 11.1px 0px rgba(0, 0, 0, 0.25)',
                        animationDelay: `${index * 0.15}s`
                      }}
                    >
                      <div className="relative w-full h-full group/card">
                        <img
                          src={image}
                          alt={`Happy Moment ${currentImageSet + index + 1}`}
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700">
                          <div className="absolute inset-0 shimmer-sweep"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={nextImage}
                className="w-[42px] h-[42px] md:w-[49px] md:h-[49px] bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0 z-10"
                style={{ boxShadow: '0px 4px 11.1px 0px rgba(0, 0, 0, 0.25)' }}
              >
                <FaChevronRight className="text-[#FF6A00] text-base md:text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div ref={ctaRef} className="relative  min-h-screen cta-section">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/anything.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Content */}
        <div className="relative z-10 px-4 py-16 lg:py-24">
          <div className="container mx-auto max-w-[915px] text-center mt-50">
            <div className="flex flex-col items-center gap-[33px] w-full">
              <h3 className="text-[#212121] text-[40px] font-semibold leading-[0.675] tracking-[0.01em] w-full cta-title">
                A Place to Belong
              </h3>
              <p className="text-[#423B2D] text-[20px] font-bold leading-[1.35] tracking-[0.01em] max-w-[691px] cta-text">
                Sultan Palace Hotel isn&apos;t just a place to stay — it&apos;s a place to connect. To breathe, to feel, to be.
              </p>
              <p className="text-[#0B0A07] text-[18px] font-medium leading-[1.833] tracking-[0.02em] max-w-[637px] mb-[33px] cta-text">
                To begin your story, or perhaps, continue it — in a setting that inspires you to live more fully, love more deeply, and dream endlessly.
              </p>
              <div className="flex justify-center cta-button-wrapper">
                <ContactUsButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Hero Section Animations */
        .hero-label {
          opacity: 0;
          transform: translateY(-30px) scale(0.9);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hero-label-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .hero-title {
          opacity: 0;
          transform: translateY(40px) scale(0.95);
          transition: all 1s ease-out 0.2s;
        }

        .hero-title-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          animation: titleGlow 3s ease-in-out infinite;
        }

        @keyframes titleGlow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          }
          50% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.4);
          }
        }

        .hero-text {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s ease-out 0.4s;
        }

        .hero-text-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Video Container Animation */
        .video-container {
          opacity: 0;
          transform: translateY(50px) scale(0.95);
          transition: all 1s ease-out;
        }

        .section-visible .video-container,
        .video-container.section-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* Content Section Animations */
        .content-heading {
          opacity: 0;
          transform: translateX(-50px);
          transition: all 1s ease-out;
        }

        .section-visible .content-heading,
        .content-heading.section-visible {
          opacity: 1;
          transform: translateX(0);
        }

        .content-image-left {
          opacity: 0;
          transform: translateX(-100px) scale(0.9);
          transition: all 1s ease-out 0.2s;
        }

        .section-visible .content-image-left,
        .content-image-left.section-visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }

        .content-image-left:hover {
          transform: scale(1.05);
          transition: transform 0.7s ease-out;
        }

        .content-image-right {
          opacity: 0;
          transform: translateX(100px) scale(0.9);
          transition: all 1s ease-out 0.2s;
        }

        .section-visible .content-image-right,
        .content-image-right.section-visible {
          opacity: 1;
          transform: translateX(0) scale(1);
        }

        .content-image-right:hover {
          transform: scale(1.05);
          transition: transform 0.7s ease-out;
        }

        .content-text-right {
          opacity: 0;
          transform: translateX(50px);
          transition: all 1s ease-out 0.4s;
        }

        .section-visible .content-text-right,
        .content-text-right.section-visible {
          opacity: 1;
          transform: translateX(0);
        }

        .content-text-left {
          opacity: 0;
          transform: translateX(-50px);
          transition: all 1s ease-out 0.4s;
        }

        .section-visible .content-text-left,
        .content-text-left.section-visible {
          opacity: 1;
          transform: translateX(0);
        }

        /* Happy Moments Section Animations */
        .happy-moments-title {
          opacity: 0;
          transform: translateY(-30px) scale(0.9);
          transition: all 1s ease-out;
        }

        .section-visible .happy-moments-title,
        .happy-moments-title.section-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          animation: titlePulse 2s ease-in-out infinite;
        }

        @keyframes titlePulse {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.02);
          }
        }

        .gallery-image-card {
          opacity: 0;
          transform: translateY(60px) rotateX(15deg) scale(0.85);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .section-visible .gallery-image-card,
        .gallery-image-card.section-visible {
          opacity: 1;
          transform: translateY(0) rotateX(0deg) scale(1);
        }

        /* Shimmer Sweep Effect */
        .shimmer-sweep {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shimmerMove 2s ease-in-out infinite;
        }

        @keyframes shimmerMove {
          0% {
            transform: translateX(-100%) skewX(-15deg);
          }
          100% {
            transform: translateX(200%) skewX(-15deg);
          }
        }

        /* Navigation Buttons Animation */
        .gallery-image-card + button,
        button + .gallery-image-card {
          transition: transform 0.3s ease-out;
        }

        button:hover {
          transform: scale(1.15) !important;
          box-shadow: 0px 6px 20px rgba(255, 106, 0, 0.4) !important;
        }

        /* Commitment Section Animation */
        .commitment-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1.2s ease-out;
        }

        .section-visible .commitment-section,
        .commitment-section.section-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* CTA Section Animation */
        .cta-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1.2s ease-out;
        }

        .section-visible .cta-section,
        .cta-section.section-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .cta-title {
          opacity: 0;
          transform: translateY(40px) scale(0.95);
          transition: all 1s ease-out;
        }

        .section-visible .cta-title,
        .cta-title.section-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .cta-text {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }

        .section-visible .cta-text:nth-of-type(1),
        .cta-text.section-visible:nth-of-type(1) {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.3s;
        }

        .section-visible .cta-text:nth-of-type(2),
        .cta-text.section-visible:nth-of-type(2) {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.5s;
        }

        .cta-button-wrapper {
          opacity: 0;
          transform: translateY(30px) scale(0.9);
          transition: all 0.8s ease-out;
        }

        .section-visible .cta-button-wrapper,
        .cta-button-wrapper.section-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          transition-delay: 0.7s;
        }
      `}</style>
    </div>
  );
}