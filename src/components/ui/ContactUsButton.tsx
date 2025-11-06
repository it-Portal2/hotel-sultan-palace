"use client";
import Link from "next/link";
import { useBookingEnquiry } from "@/context/BookingEnquiryContext";

interface ContactUsButtonProps {
  href?: string;
  text?: string;
  width?: string;
  bgColor?: string;
  shadowColor?: string;
  rounded?: string;
  textSize?: string;
  height?: string;
  className?: string;
  onClick?: () => void;
  showArrow?: boolean;
}

export default function ContactUsButton({
  href = "/contact-us",
  text = "Connect Us",
  width = "w-[200px]",
  bgColor = "#F96406",
  shadowColor = "#F96406",
  rounded = "rounded-[52px]",
  textSize = "text-[20px]",
  height = "h-[54px]",
  className = "",
  onClick,
  showArrow = true
}: ContactUsButtonProps) {
  const bookingCtx = (() => {
    try { return useBookingEnquiry(); } catch { return null; }
  })();
  const buttonClasses = `text-white px-5 py-2 ${rounded} ${textSize} font-medium ${height} flex items-center justify-center font-quicksand ${width} relative overflow-hidden group/button transition-all duration-300 hover:scale-110 hover:shadow-lg whitespace-nowrap ${className}`;

  const buttonStyle = {
    backgroundColor: bgColor,
  };

  const hoverShadowStyle = `0 10px 40px ${shadowColor}50`;

  const content = (
    <>
      <span className="relative z-10 flex items-center gap-2">
        {text}
        {showArrow && (
          <span className="transition-transform duration-300 group-hover/button:translate-x-2">→</span>
        )}
      </span>
      <span className="absolute inset-0 bg-white/20 -translate-x-full group-hover/button:translate-x-0 transition-transform duration-500"></span>
    </>
  );

  // Force Booking Enquiry to open modal when context available
  const shouldOpenBookingModal = bookingCtx && (text?.toLowerCase().includes('booking enquiry'));

  if (onClick || shouldOpenBookingModal) {
    return (
      <button 
        onClick={onClick || bookingCtx?.openModal} 
        className={buttonClasses} 
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = hoverShadowStyle;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link 
      href={href} 
      className={buttonClasses} 
      style={buttonStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = hoverShadowStyle;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {content}
    </Link>
  );
}

