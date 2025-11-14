"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { 
  PencilIcon,
  TrashIcon,
  TagIcon
} from "@heroicons/react/24/outline";

interface CartSummaryProps {
  className?: string;
}

export default function CartSummary({ className = "" }: CartSummaryProps) {
  const router = useRouter();
  const { rooms, addOns, calculateTotal, bookingData, removeRoom, removeAddOn } = useCart();

  const totalItems = rooms.length + addOns.length;

  return (
    <div className={`${className}`}>
      <div className="p-4 md:p-6">
        <h2 className="text-[22px] font-bold text-[#3A3326] mb-4">
          Your Cart (Item - {totalItems})
        </h2>
        
        <div className="w-full h-px bg-[rgba(66,59,45,0.13)] mb-5"></div>
      
        <div className="bg-white p-4 md:p-6 rounded-lg">
          {rooms.map((room, index) => (
            <div key={room.id} className="mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[22px] font-semibold text-[#423B2D]">
                      {room.name}
                    </h3>
                    <div className="text-[18px] font-semibold text-[#1D2A3A]">
                      ${room.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-[18px] font-semibold text-[#1D2A3A]">$0.00</div>
                    <div className="text-[15px] font-bold text-[#1D69F9] px-2 py-1 bg-[#E9F1FF] rounded">
                      {bookingData ? 
                        (() => {
                          const checkIn = new Date(bookingData.checkIn);
                          const checkOut = new Date(bookingData.checkOut);
                          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                          return `${nights} Night Stay`;
                        })() 
                        : '1 Night Stay'
                      }
                    </div>
                  </div>
                  <div className="text-[16px] text-[#655D4E] mb-2">Taxes and Fees</div>
                  <p className="text-[14px] text-[#423B2D] leading-[1.71] mb-2">
                    {room.description || "This suite's standout feature is the pool with a view. Boasting a private entrance, this air..."}
                  </p>
                  <p className="text-[15px] font-bold text-[#1D69F9] mb-2">
                    {bookingData ? 
                      `${new Date(bookingData.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(bookingData.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}` 
                      : 'Thu, Nov 20, 2025 - Fri, Nov 21, 2025'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-[17px] mb-4">
                <button 
                  onClick={() => {
                    router.push('/hotel#rooms-section');
                    setTimeout(() => {
                      const roomsSection = document.getElementById('rooms-section');
                      if (roomsSection) {
                        roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 300);
                  }}
                  className="flex items-center gap-[3px] text-[#3F3F3F] text-[16px] font-bold"
                >
                  <PencilIcon className="w-6 h-6" />
                  Edit
                </button>
                <button 
                  onClick={() => removeRoom(room.id)}
                  className="flex items-center gap-[3px] text-[#3F3F3F] text-[16px] font-bold"
                >
                  <TrashIcon className="w-6 h-6" />
                  Remove
                </button>
                <button className="flex items-center gap-[3px] text-[#3F3F3F] text-[16px] font-bold">
                  <TagIcon className="w-6 h-6" />
                  Apply Offer
                </button>
              </div>
              
              <div className="w-full h-px bg-[rgba(0,0,0,0.02)] my-4"></div>
            </div>
          ))}

          {addOns.map((addOn, index) => (
            <div key={`${addOn.id}-${index}`} className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 pr-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[20px] font-semibold text-[#423B2D]">
                      {addOn.name}
                    </h3>
                    <div className="text-[18px] font-semibold text-[#1D2A3A]">
                      ${(addOn.price * (addOn.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-[18px] font-semibold text-[#1D2A3A]">$0.00</div>
                  </div>
                  <div className="text-[16px] text-[#655D4E] mb-2">Taxes and Fees</div>
                </div>
              </div>
              
              <div className="flex items-center gap-[17px] mb-4">
                <button 
                  onClick={() => router.push('/add-ons')}
                  className="flex items-center gap-[3px] text-[#3F3F3F] text-[16px] font-bold"
                >
                  <PencilIcon className="w-6 h-6" />
                  Edit
                </button>
                <button 
                  onClick={() => removeAddOn(addOn.id)}
                  className="flex items-center gap-[3px] text-[#3F3F3F] text-[16px] font-bold"
                >
                  <TrashIcon className="w-6 h-6" />
                  Remove
                </button>
                <button className="flex items-center gap-[3px] text-[#3F3F3F] text-[16px] font-bold">
                  <TagIcon className="w-6 h-6" />
                  Apply Offer
                </button>
              </div>
              
              <div className="w-full h-px bg-[rgba(0,0,0,0.06)] my-4"></div>
            </div>
          ))}

          <div className="mt-6 pt-4">
            <div className="bg-white p-4 md:p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-[18px] font-semibold text-black">Total</h3>
                  <p className="text-[10px] text-[#655D4E]">including general taxes and fees</p>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-semibold text-[#1D2A3A]">
                    ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[#AFAFAF] my-6" style={{borderStyle: 'dashed', borderWidth: '1px'}}></div>
      </div>
    </div>
  );
}