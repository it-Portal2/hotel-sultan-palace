"use client";

import React from "react";
import Image from "next/image";

interface BookingConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  checkIn: string;
  checkOut: string;
  email: string;
}

export default function BookingConfirmationPopup({
  isOpen,
  onClose,
  bookingId,
  checkIn,
  checkOut,
  email
}: BookingConfirmationPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-[9px] w-[400px] h-[450px] relative shadow-lg">
        {/* Checkmark Image */}
        <div className="absolute top-[20px] left-1/2 transform -translate-x-1/2">
          <Image
            src="/checkmark-success.png"
            alt="Success"
            width={120}
            height={120}
            className="w-[120px] h-[120px]"
          />
        </div>

        {/* Content */}
        <div className="absolute top-[160px] left-[50px] w-[300px] flex flex-col items-center gap-[20px]">
          {/* Title */}
          <h2 className="text-[20px] font-semibold text-[#272B2B] font-['Poppins'] text-center leading-[1.5] tracking-[-0.03em]">
            Booking Confirmed!
          </h2>

          {/* Details */}
          <div className="w-full flex flex-col items-center gap-[15px]">
            <p className="text-[14px] text-[#242424] font-['Poppins'] text-center leading-[1.5] tracking-[-0.03em]">
              A confirmation email has been sent to your registered address.
            </p>
            
            <div className="w-[250px] text-left">
              <p className="text-[14px] text-[#484848] font-['Poppins'] leading-[1.5] tracking-[-0.03em]">
                Booking ID: {bookingId}
              </p>
              <p className="text-[14px] text-[#484848] font-['Poppins'] leading-[1.5] tracking-[-0.03em]">
                Check-in: {new Date(checkIn).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
              <p className="text-[14px] text-[#484848] font-['Poppins'] leading-[1.5] tracking-[-0.03em]">
                Check-out: {new Date(checkOut).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <div className="absolute bottom-[30px] left-1/2 transform -translate-x-1/2">
          <button
            onClick={onClose}
            className="w-[160px] h-[36px] bg-[#FF6A00] rounded-[34px] flex items-center justify-center text-white text-[14px] font-semibold font-['Poppins'] leading-[1.5] tracking-[-0.03em] hover:bg-[#E55A00] transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
