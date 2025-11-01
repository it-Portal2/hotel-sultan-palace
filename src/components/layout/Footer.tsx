import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp, FaFacebookF, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';
export default function Footer() {
  return (
    <footer className="w-full">
      <div className="relative" style={{backgroundImage: 'url(/footer.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}>
        {/* contrast overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
      
        {/* Footer content */}
        <div className="relative z-10 px-4 py-16">
          <div className="container-xl mx-auto">
            {/* Unified grid: mobile stacks, desktop shows original 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* Branding and Social Media */}
              <div className="space-y-6">
                {/* Logo */}
                <div className="text-white">
                  <Image src="/sultan-logo.png" alt="Sultan Palace" width={48} height={48} className="h-12 w-auto" />
                </div>
                
                {/* Description */}
                <p className="text-white/90 text-sm leading-relaxed max-w-md">
                  Corem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et
                </p>
                
                {/* Social Media Icons */}
                <div className="flex space-x-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer" style={{background:'#BE8C53'}}>
                    <FaWhatsapp className="text-[#C0B194] text-base" />
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer" style={{background:'#BE8C53'}}>
                    <FaFacebookF className="text-[#C0B194] text-base" />
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer" style={{background:'#BE8C53'}}>
                    <FaLinkedinIn className="text-[#C0B194] text-base" />
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer" style={{background:'#BE8C53'}}>
                    <FaTwitter className="text-[#C0B194] text-base" />
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-6">
                <h3 className="text-white text-lg font-semibold uppercase tracking-wide">Quick Links</h3>
                <ul className="grid grid-cols-2 lg:grid-cols-1 gap-y-2">
                  <li><Link href="/" className="text-white hover:text-gray-300 transition-colors text-sm">Home</Link></li>
                  <li><a href="/villas" className="text-white hover:text-gray-300 transition-colors text-sm">Villas</a></li>
                  <li><a href="/gallery" className="text-white hover:text-gray-300 transition-colors text-sm">Gallery</a></li>
                  <li><a href="/offers" className="text-white hover:text-gray-300 transition-colors text-sm">Offers</a></li>
                  <li><a href="/our-stories" className="text-white hover:text-gray-300 transition-colors text-sm">Our Stories</a></li>
                  <li><a href="/about-us" className="text-white hover:text-gray-300 transition-colors text-sm">About Us</a></li>
                  <li><a href="/contact-us" className="text-white hover:text-gray-300 transition-colors text-sm">Contact Us</a></li>
                </ul>
              </div>
              {/* Legal */}
              <div className="space-y-6">
                <h3 className="text-white text-lg font-semibold uppercase tracking-wide">Legal</h3>
                <ul className="grid grid-cols-2 lg:grid-cols-1 gap-y-2">
                  <li><a href="/support" className="text-white hover:text-gray-300 transition-colors text-sm">Support</a></li>
                  <li><Link href="/#about-zanzibar" className="text-white hover:text-gray-300 transition-colors text-sm">Faq&apos;s</Link></li>
                  <li><a href="/privacy-policy" className="text-white hover:text-gray-300 transition-colors text-sm">Privacy Policy</a></li>
                  <li><a href="/terms-and-conditions" className="text-white hover:text-gray-300 transition-colors text-sm">Terms And Conditions</a></li>
                </ul>
              </div>

              {/* Contact Us */}
              <div className="space-y-6">
                <h3 className="text-white text-lg font-semibold uppercase tracking-wide">Contact Us</h3>
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#BE8C53'}}>
                      <MdEmail className="text-white text-sm" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <a href="mailto:portalholdingsznz@gmail.com" className="text-white/90 text-sm hover:text-white transition-colors">portalholdingsznz@gmail.com</a>
                      <a href="mailto:reservations@sultanpalacehotelznz.com" className="text-white/90 text-sm hover:text-white transition-colors">reservations@sultanpalacehotelznz.com</a>
                    </div>
                  </div>
                  
                  {/* Phone */}
                  <div className="flex items-start space-x-3">
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
                  <div className="flex items-start space-x-3">
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
      <div className="h-[53px] flex items-center justify-center bg-black">
        <p className="text-white text-[16px]">© {new Date().getFullYear()} UX/UI Team. All rights reserved</p>
      </div>
    </footer>
  );
}