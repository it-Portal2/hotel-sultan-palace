"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { MdEmail, MdPhone, MdLocationOn, MdAccessTime } from 'react-icons/md';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { createContactForm } from '@/lib/firestoreService';
import ContactUsButton from "@/components/ui/ContactUsButton";
import ContactForm from './ContactForm';

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; message?: string }>({});
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [sectionVisible, setSectionVisible] = useState<{ [key: string]: boolean }>({});

  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [typewriterComplete, setTypewriterComplete] = useState(false);

  const fullText = "We're Here to Welcome You to the Paradise";
  const subtitleText = "CONTACT US";

  useEffect(() => {
    // Start animation with a small delay
    const timer = setTimeout(() => {
      setIsVisible(true);

      // Typewriter effect for main text - runs only once
      let index = 0;
      const typewriterInterval = setInterval(() => {
        if (index < fullText.length) {
          setTypewriterText(fullText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typewriterInterval);
          setTypewriterComplete(true);
          // Show subtitle after main text is complete
          setTimeout(() => setShowSubtitle(true), 500);
        }
      }, 100);

      // Store interval for cleanup
      return () => {
        clearInterval(typewriterInterval);
      };
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - runs only once on mount

  // Intersection Observer for section animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const observedElements = new Set<HTMLElement>();

    const setupObservers = () => {
      const sectionKeys = ['form-section', 'contact-info-section', 'cta-section'];

      sectionKeys.forEach((key) => {
        const element = sectionRefs.current[key];
        if (element && !observedElements.has(element)) {
          observedElements.add(element);

          const rect = element.getBoundingClientRect();
          const isVisibleNow = rect.top < window.innerHeight && rect.bottom > 0;

          if (isVisibleNow) {
            setTimeout(() => {
              setSectionVisible((prev) => ({ ...prev, [key]: true }));
              element.classList.add(`contact-${key}-visible`);
            }, 100);
          } else {
            const observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    setSectionVisible((prev) => ({ ...prev, [key]: true }));
                    entry.target.classList.add(`contact-${key}-visible`);
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

  // Form logic moved to ContactForm.tsx

  const handleFindInMap = () => {
    // Open Google Maps with the hotel location
    const address = encodeURIComponent('Dongwe, East Coast, Zanzibar');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  return (
    <>
      <div className="w-full">
        {/* Hero Section */}
        <div className="relative h-[600px] md:h-[928px] w-full">
          {/* Background Image */}
          <Image
            src="/hero-section-bg.png"
            alt="Contact Us Hero Background"
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
          <div className="absolute inset-0 bg-black/20" />

          {/* Content - Positioned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-start justify-end px-4 sm:px-6 md:px-8 lg:px-12 xl:px-15 pb-8 sm:pb-12 md:pb-16 lg:pb-20">
            <div className="text-left max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-xl xl:max-w-3xl">
              {/* Animated Subtitle */}
              <div className={`mb-4 sm:mb-6 transition-all duration-1000 ${showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h1 className="text-[#FFEAD3] text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[25px] font-bold uppercase tracking-[2px] sm:tracking-[2.5px] lg:tracking-[3.25px] mb-2 sm:mb-4">
                  {subtitleText}
                </h1>
              </div>

              {/* Animated Main Text with Typewriter Effect */}
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="text-white text-[24px] sm:text-[28px] md:text-[32px] lg:text-[40px] xl:text-[48px] font-bold uppercase leading-[1.2] sm:leading-[1.4] md:leading-[1.5] lg:leading-[1.6] xl:leading-[1.71] tracking-[0.5px] sm:tracking-[0.7px] md:tracking-[0.8px] lg:tracking-[0.9px] xl:tracking-[0.96px] mb-4 sm:mb-6 lg:mb-8 relative">
                  <span className="inline-block">
                    {typewriterText}
                    {!typewriterComplete && <span className="typewriter-cursor text-[#F96406] ml-1">|</span>}
                  </span>
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div ref={(el) => { if (el) sectionRefs.current['form-section'] = el; }} className={`grid grid-cols-1 lg:grid-cols-2 w-full contact-form-section ${sectionVisible['form-section'] ? 'contact-form-section-visible' : ''}`}>
          {/* Left Side - Contact Form Background */}
          <div
            className="bg-cover bg-center bg-no-repeat order-2 lg:order-1 min-h-[360px] sm:min-h-[420px] md:min-h-[500px] lg:min-h-[645px] xl:min-h-[700px] contact-form-image"
            style={{
              backgroundImage: 'url(/contact-form-bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          {/* Right Side - Contact Form */}
          <div className="bg-[#242424] flex items-center order-1 lg:order-2 min-h-[360px] sm:min-h-[420px] md:min-h-[500px] lg:min-h-[645px] xl:min-h-[700px] contact-form-content">
            <div className="px-4 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-12 lg:py-16 w-full">
              <h3 className="text-white text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] xl:text-[36px] font-medium uppercase leading-[1.2] sm:leading-[1.3] md:leading-[1.4] lg:leading-[1.44] tracking-[8%] sm:tracking-[9%] md:tracking-[10%] lg:tracking-[11.11%] mb-6 sm:mb-8 font-['Kaisei_Decol']">
                Reach Out — Your Island Escape Awaits
              </h3>

              <ContactForm />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div ref={(el) => { if (el) sectionRefs.current['contact-info-section'] = el; }} className={`w-full contact-info-section ${sectionVisible['contact-info-section'] ? 'contact-info-section-visible' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_4fr] w-full">
            {/* Left Side Image */}
            <div
              className="bg-cover bg-center bg-no-repeat relative min-h-[260px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[527px] contact-info-image"
              style={{
                backgroundImage: 'url(/contact-info-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Map Button Overlay */}
              <div className="absolute inset-0 flex items-end justify-center pb-4 sm:pb-6 z-10 contact-info-button">
                <button
                  onClick={handleFindInMap}
                  className="bg-black/90 text-white px-4 py-2 rounded-full flex items-center gap-2 sm:gap-3 hover:bg-black transition-colors cursor-pointer shadow-md"
                >
                  <FaMapMarkerAlt className="text-white text-sm" />
                  <span className="text-sm sm:text-base md:text-[18px] font-regular font-['Quicksand']">Find in map</span>
                </button>
              </div>
            </div>

            {/* Right Side - Contact Info Background */}
            <div className="bg-[#E8E4D9] flex items-center w-full contact-info-content">
              <div className="px-8 lg:px-16 py-12 sm:py-16 w-full space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4 lg:gap-[61px] contact-info-item" style={{ transitionDelay: '0.1s' }}>
                  <div className="w-[34px] h-[36px] bg-black rounded-sm flex items-center justify-center flex-shrink-0">
                    <MdLocationOn className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-black text-[18px] lg:text-[20px] font-medium leading-[1.45] font-['Kaisei_Decol']">
                      Address:<br />
                      Dongwe, East Coast, Zanzibar
                    </p>
                  </div>
                </div>

                <hr className="border-[rgba(118,76,49,0.21)]" />

                {/* Email */}
                <div className="flex items-start gap-4 lg:gap-[61px] contact-info-item" style={{ transitionDelay: '0.2s' }}>
                  <div className="w-[34px] h-[36px] bg-black rounded-sm flex items-center justify-center flex-shrink-0">
                    <MdEmail className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-black text-[18px] lg:text-[20px] font-medium leading-[1.45] font-['Kaisei_Decol']">
                      Email-Us<br />
                      <a href="mailto:portalholdingsznz@gmail.com" className="hover:underline transition-colors">portalholdingsznz@gmail.com</a><br />
                      <a href="mailto:reservations@sultanpalacehotelznz.com" className="hover:underline transition-colors">reservations@sultanpalacehotelznz.com</a>
                    </p>
                  </div>
                </div>

                <hr className="border-[rgba(118,76,49,0.21)]" />

                {/* Phone */}
                <div className="flex items-start gap-4 lg:gap-[67px] contact-info-item" style={{ transitionDelay: '0.3s' }}>
                  <div className="w-[34px] h-[36px] bg-black rounded-sm flex items-center justify-center flex-shrink-0">
                    <MdPhone className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-black text-[18px] lg:text-[20px] font-medium leading-[1.45] font-['Kaisei_Decol']">
                      Phone:<br />
                      <a href="tel:+255684888111" className="hover:underline transition-colors">+255 684 888 111</a> / {' '}
                      <a href="tel:+255777085630" className="hover:underline transition-colors">+255 777 085 630</a> / {' '}
                      <a href="tel:+255657269674" className="hover:underline transition-colors">+255 657 269 674</a>
                    </p>
                  </div>
                </div>

                <hr className="border-[rgba(118,76,49,0.21)]" />

                {/* Working Hours */}
                <div className="flex items-start gap-4 lg:gap-[61px] contact-info-item" style={{ transitionDelay: '0.4s' }}>
                  <div className="w-[34px] h-[36px] bg-black rounded-sm flex items-center justify-center flex-shrink-0">
                    <MdAccessTime className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-black text-[18px] lg:text-[20px] font-medium leading-[1.45] font-['Kaisei_Decol']">
                      WORKING HOURS :<br />
                      Monday - Saturday     08:00a.m - 6:00p.m
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resort Aerial View Section with Call to Action */}
        <div ref={(el) => { if (el) sectionRefs.current['cta-section'] = el; }} className={`relative h-[360px] sm:h-[480px] md:h-[540px] lg:h-[590px] w-full contact-cta-section ${sectionVisible['cta-section'] ? 'contact-cta-section-visible' : ''}`}>
          {/* Background Image - Tropical Resort Aerial View */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/hero-section-bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />


          <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 md:px-8">
            <div className="text-center">
              <h3 className="text-white text-[22px] sm:text-[26px] md:text-[32px] lg:text-[40px] xl:text-[48px] font-bold leading-[1.15] sm:leading-[1.18] md:leading-[1.2] lg:leading-[1.22] mb-4 sm:mb-6 md:mb-8 font-['Kaisei_Decol'] contact-cta-title">
                Let&apos;s Begin Your Zanzibar Journey
              </h3>
              <div className="flex justify-center contact-cta-button">
                <ContactUsButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
