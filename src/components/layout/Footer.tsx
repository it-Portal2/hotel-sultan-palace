"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp, FaFacebookF, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true); // Start as visible to prevent layout shift

  useEffect(() => {
    if (footerRef.current) {
      // Mark footer as visible immediately
      footerRef.current.classList.add('footer-visible');
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('footer-visible');
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px' }
      );
      observer.observe(footerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <footer ref={footerRef} className="w-full footer-section" style={{ position: 'relative', zIndex: 1 }}>
      <div className="relative" style={{backgroundImage: 'url(/footer.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', minHeight: 'auto'}}>
        {/* contrast overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
      
        {/* Footer content */}
        <div className="relative z-10 px-4 py-16">
          <div className="container-xl mx-auto">
            {/* Unified grid: mobile stacks, desktop shows original 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* Branding and Social Media */}
              <div className={`space-y-6 footer-brand ${isVisible ? 'footer-brand-visible' : ''}`}>
                {/* Logo */}
                <div className={`text-white footer-logo ${isVisible ? 'footer-logo-visible' : ''}`}>
                  <Image src="/sultan-logo.png" alt="Sultan Palace" width={48} height={48} className="h-12 w-auto" />
                </div>
                
                {/* Description */}
                <p className={`text-white/90 text-sm leading-relaxed max-w-md footer-description ${isVisible ? 'footer-description-visible' : ''}`}>
                  Corem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et
                </p>
                
                {/* Social Media Icons */}
                <div className={`flex space-x-4 footer-social ${isVisible ? 'footer-social-visible' : ''}`}>
                  <a 
                    href="https://wa.me/255684888111" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer footer-social-icon ${isVisible ? 'footer-social-icon-visible' : ''}`} 
                    style={{background:'#BE8C53', transitionDelay: '0.1s'}}
                    aria-label="Chat on WhatsApp - +255 684 888 111"
                    title="WhatsApp: +255 684 888 111"
                  >
                    <FaWhatsapp className="text-[#C0B194] text-base" />
                  </a>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer footer-social-icon ${isVisible ? 'footer-social-icon-visible' : ''}`} style={{background:'#BE8C53', transitionDelay: '0.2s'}}>
                    <FaFacebookF className="text-[#C0B194] text-base" />
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer footer-social-icon ${isVisible ? 'footer-social-icon-visible' : ''}`} style={{background:'#BE8C53', transitionDelay: '0.3s'}}>
                    <FaLinkedinIn className="text-[#C0B194] text-base" />
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer footer-social-icon ${isVisible ? 'footer-social-icon-visible' : ''}`} style={{background:'#BE8C53', transitionDelay: '0.4s'}}>
                    <FaTwitter className="text-[#C0B194] text-base" />
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className={`space-y-6 footer-links ${isVisible ? 'footer-links-visible' : ''}`}>
                <h3 className={`text-white text-lg font-semibold uppercase tracking-wide footer-links-title ${isVisible ? 'footer-links-title-visible' : ''}`}>Quick Links</h3>
                <ul className="grid grid-cols-2 lg:grid-cols-1 gap-y-2">
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.1s' }}><Link href="/" className="text-white hover:text-gray-300 transition-colors text-sm">Home</Link></li>
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.15s' }}><a href="/villas" className="text-white hover:text-gray-300 transition-colors text-sm">Villas</a></li>
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.2s' }}><a href="/gallery" className="text-white hover:text-gray-300 transition-colors text-sm">Gallery</a></li>
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.25s' }}><a href="/offers" className="text-white hover:text-gray-300 transition-colors text-sm">Offers</a></li>
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.3s' }}><a href="/our-stories" className="text-white hover:text-gray-300 transition-colors text-sm">Our Stories</a></li>
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.35s' }}><a href="/about-us" className="text-white hover:text-gray-300 transition-colors text-sm">About Us</a></li>
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.4s' }}><a href="/contact-us" className="text-white hover:text-gray-300 transition-colors text-sm">Contact Us</a></li>
                </ul>
              </div>
              {/* Legal */}
              <div className={`space-y-6 footer-legal ${isVisible ? 'footer-legal-visible' : ''}`}>
                <h3 className={`text-white text-lg font-semibold uppercase tracking-wide footer-legal-title ${isVisible ? 'footer-legal-title-visible' : ''}`}>Legal</h3>
                <ul className="grid grid-cols-2 lg:grid-cols-1 gap-y-2">
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.1s' }}><a href="/support" className="text-white hover:text-gray-300 transition-colors text-sm">Support</a></li>
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.15s' }}><Link href="/#about-zanzibar" className="text-white hover:text-gray-300 transition-colors text-sm">Faq&apos;s</Link></li>
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.2s' }}><a href="/privacy-policy" className="text-white hover:text-gray-300 transition-colors text-sm">Privacy Policy</a></li>
                  <li className={`footer-link-item ${isVisible ? 'footer-link-item-visible' : ''}`} style={{ transitionDelay: '0.25s' }}><a href="/terms-and-conditions" className="text-white hover:text-gray-300 transition-colors text-sm">Terms And Conditions</a></li>
                </ul>
              </div>

              {/* Contact Us */}
              <div className={`space-y-6 footer-contact ${isVisible ? 'footer-contact-visible' : ''}`}>
                <h3 className={`text-white text-lg font-semibold uppercase tracking-wide footer-contact-title ${isVisible ? 'footer-contact-title-visible' : ''}`}>Contact Us</h3>
                <div className="space-y-4">
                  {/* Email */}
                  <div className={`flex items-start space-x-3 footer-contact-item ${isVisible ? 'footer-contact-item-visible' : ''}`} style={{ transitionDelay: '0.1s' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#BE8C53'}}>
                      <MdEmail className="text-white text-sm" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <a href="mailto:portalholdingsznz@gmail.com" className="text-white/90 text-sm hover:text-white transition-colors">portalholdingsznz@gmail.com</a>
                      <a href="mailto:reservations@sultanpalacehotelznz.com" className="text-white/90 text-sm hover:text-white transition-colors">reservations@sultanpalacehotelznz.com</a>
                    </div>
                  </div>
                  
                  {/* Phone */}
                  <div className={`flex items-start space-x-3 footer-contact-item ${isVisible ? 'footer-contact-item-visible' : ''}`} style={{ transitionDelay: '0.2s' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#BE8C53'}}>
                      <MdPhone className="text-white text-sm" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <a href="tel:+255684888111" className="text-white/90 text-sm hover:text-white transition-colors">+255 684 888 111</a>
                      <a href="tel:+255777085630" className="text-white/90 text-sm hover:text-white transition-colors">+255 777 085 630</a>
                      <a href="tel:+255657269674" className="text-white/90 text-sm hover:text-white transition-colors">+255 657 269 674</a>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className={`flex items-start space-x-3 footer-contact-item ${isVisible ? 'footer-contact-item-visible' : ''}`} style={{ transitionDelay: '0.3s' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#BE8C53'}}>
                      <MdLocationOn className="text-white text-sm" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white/90 text-sm">Dongwe, East Coast, Zanzibar</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom copyright bar - solid black */}
      <div className={`h-[53px] flex items-center justify-center bg-black footer-copyright ${isVisible ? 'footer-copyright-visible' : ''}`}>
        <p className="text-white text-[16px]">© {new Date().getFullYear()} UX/UI Team. All rights reserved</p>
      </div>

      <style jsx global>{`
        .footer-section {
          opacity: 1;
          transform: translateY(0);
          will-change: auto;
        }
        .footer-section.footer-visible,
        .footer-visible .footer-section {
          opacity: 1;
          transform: translateY(0);
        }
        .footer-logo {
          opacity: 0;
          transform: scale(0.5) rotate(-180deg);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s;
        }
        .footer-logo-visible {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }
        .footer-description {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out 0.4s;
        }
        .footer-description-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .footer-social {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out 0.6s;
        }
        .footer-social-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .footer-social-icon {
          opacity: 0;
          transform: scale(0) rotate(-180deg);
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .footer-social-icon-visible {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }
        .footer-links {
          opacity: 0;
          transform: translateX(-50px);
          transition: all 1s ease-out 0.3s;
        }
        .footer-links-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .footer-links-title {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 0.8s ease-out 0.5s;
        }
        .footer-links-title-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .footer-link-item {
          opacity: 0;
          transform: translateX(-30px);
          transition: all 0.6s ease-out;
        }
        .footer-link-item-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .footer-legal {
          opacity: 0;
          transform: translateX(-50px);
          transition: all 1s ease-out 0.4s;
        }
        .footer-legal-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .footer-legal-title {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 0.8s ease-out 0.6s;
        }
        .footer-legal-title-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .footer-contact {
          opacity: 0;
          transform: translateX(50px);
          transition: all 1s ease-out 0.5s;
        }
        .footer-contact-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .footer-contact-title {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 0.8s ease-out 0.7s;
        }
        .footer-contact-title-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .footer-contact-item {
          opacity: 0;
          transform: translateX(30px);
          transition: all 0.6s ease-out;
        }
        .footer-contact-item-visible {
          opacity: 1;
          transform: translateX(0);
        }
        .footer-copyright {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out 0.8s;
        }
        .footer-copyright-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </footer>
  );
}