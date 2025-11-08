
"use client";
import { FaWhatsapp } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';

const WhatsAppButton = () => {
  // Both WhatsApp numbers - format: country code + number without + or spaces
  const numbers = [
    { num: '255684888111', label: '+255 684 888 111', full: '+255684888111' },
    { num: '255777085630', label: '+255 777 085 630', full: '+255777085630' }
  ];
  
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Verify numbers on mount
  useEffect(() => {
    console.log('WhatsApp Numbers:', numbers.map(n => n.label));
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50" ref={menuRef}>
        {/* Animated Dropdown Menu */}
        <div 
          className={`absolute bottom-20 right-0 mb-3 transition-all duration-300 ease-out ${
            showMenu 
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
              : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-4 min-w-[240px] border border-gray-100 backdrop-blur-sm">
            {/* Arrow pointing to button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45 border-r border-b border-gray-100"></div>
            
            <div className="text-xs text-gray-600 mb-3 font-semibold uppercase tracking-wide">
              Choose WhatsApp Number:
            </div>
            <div className="space-y-2">
              {numbers.map((number, index) => (
                <a
                  key={index}
                  href={`https://wa.me/${number.num}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-medium transition-all duration-300 text-center overflow-hidden transform hover:scale-105 hover:shadow-lg"
                  onClick={() => setShowMenu(false)}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <FaWhatsapp className="inline-block mr-2 relative z-10 animate-pulse group-hover:animate-none" size={16} />
                  <span className="relative z-10">{number.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main WhatsApp Button with pulse animation */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`relative bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full p-4 shadow-2xl transition-all duration-300 ease-out transform ${
            showMenu ? 'scale-90 rotate-90' : 'scale-100 hover:scale-110 hover:rotate-12'
          } hover:shadow-green-500/50`}
          aria-label="Open WhatsApp menu"
          title="Chat on WhatsApp"
        >
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
          <div className="absolute inset-0 rounded-full bg-green-400 animate-pulse opacity-30"></div>
          
          {/* Icon */}
          <FaWhatsapp 
            size={28} 
            className="relative z-10 transition-transform duration-300"
          />
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default WhatsAppButton;