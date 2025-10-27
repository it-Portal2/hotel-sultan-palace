import React from 'react';
import Image from 'next/image';
import { FaWhatsapp, FaFacebookF, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';
export default function Footer() {
  return (
    <footer className="w-full">
      <div className="relative" style={{backgroundImage: 'url(/footer.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}>
      
        {/* Footer content */}
        <div className="relative z-10 px-4 py-16 px-30">
          <div className="container-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Column 1: Branding and Social Media */}
              <div className="space-y-6">
                {/* Logo */}
                <div className="text-white">
                  <Image src="/sultan-logo.png" alt="Sultan Palace" width={48} height={48} className="h-12 w-auto" />
                </div>
                
                {/* Description */}
                <p className="text-white text-sm leading-relaxed">
                  Corem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et
                </p>
                
                {/* Social Media Icons */}
                <div className="flex space-x-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer" style={{background:'#BE8C53'}}>
                    <FaWhatsapp className="text-[#C0B194] text-sm" />
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer" style={{background:'#BE8C53'}}>
                    <FaFacebookF className="text-[#C0B194] text-sm" />
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer" style={{background:'#BE8C53'}}>
                    <FaLinkedinIn className="text-[#C0B194] text-sm" />
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer" style={{background:'#BE8C53'}}>
                    <FaTwitter className="text-[#C0B194] text-sm" />
                  </div>
                </div>
              </div>
              
              {/* Column 2: Quick Links */}
              <div className="space-y-6">
                <h3 className="text-white text-lg font-semibold uppercase tracking-wide">Quick Links</h3>
                <ul className="space-y-3">
                  {['Home', 'Services', 'Villas', 'Gallery', 'Offers', 'About Us', 'Contact Us'].map((link) => (
                    <li key={link}>
                      <a 
                        href={link === 'Contact Us' ? '/contact-us' : link === 'About Us' ? '/about-us' : '#'} 
                        className="text-white hover:text-gray-300 transition-colors text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Column 3: Legal */}
              <div className="space-y-6">
                <h3 className="text-white text-lg font-semibold uppercase tracking-wide">Legal</h3>
                <ul className="space-y-3">
                  {['Support', 'Faq\'s', 'Privacy Policy', 'Terms And Conditions'].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-white hover:text-gray-300 transition-colors text-sm">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Column 4: Contact Us */}
              <div className="space-y-6">
                <h3 className="text-white text-lg font-semibold uppercase tracking-wide">Contact Us</h3>
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#BE8C53'}}>
                      <MdEmail className="text-white text-sm" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <a href="mailto:portalholdingsznz@gmail.com" className="text-white text-sm hover:underline transition-colors">portalholdingsznz@gmail.com</a>
                      <a href="mailto:reservations@sultanpalacehotelznz.com" className="text-white text-sm hover:underline transition-colors">reservations@sultanpalacehotelznz.com</a>
                    </div>
                  </div>
                  
                  {/* Phone */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#BE8C53'}}>
                      <MdPhone className="text-white text-sm" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <a href="tel:+255684888111" className="text-white text-sm hover:underline transition-colors">+255 684 888 111</a>
                      <a href="tel:+255777085630" className="text-white text-sm hover:underline transition-colors">+255 777 085 630</a>
                      <a href="tel:+255657269674" className="text-white text-sm hover:underline transition-colors">+255 657 269 674</a>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#BE8C53'}}>
                      <MdLocationOn className="text-white text-sm" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-sm">Dongwe, East Coast, Zanzibar</span>
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