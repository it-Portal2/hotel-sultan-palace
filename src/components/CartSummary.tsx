"use client";

import React from "react";
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
  const { rooms, addOns, calculateTotal, bookingData } = useCart();

  const totalItems = rooms.length + addOns.length;

  return (
    <div className={`${className}`}>
      <div className="p-0">
        <h2 className="text-xl font-bold text-[#3A3326] mb-4">
          Your Cart (Item - {totalItems})
        </h2>
        
        {/* Divider Line */}
        <div className="h-1 w-full rounded bg-gradient-to-r from-[#FFEDD5] via-[#FFE8CC] to-[#FFF5EA] mb-5"></div>
      
        {/* Cart Content */}
        <div className="bg-[#F8F5EF] p-6 rounded-lg">
          {/* Room Items */}
          {rooms.map((room, index) => (
            <div key={room.id} className="mb-6 ">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#423B2D] mb-2">
                    {room.name}
                  </h3>
                  <p className="text-sm text-[#423B2D] leading-relaxed mb-2">
                    {room.description || "This suite's standout feature is the pool with a view. Boasting a private entrance, this air..."}
                  </p>
                  <p className="text-sm text-black font-semibold mb-2">
                    {bookingData ? 
                      `${new Date(bookingData.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(bookingData.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}` 
                      : 'Thu, Nov 20, 2025 - Fri, Nov 21, 2025'
                    }
                  </p>
                </div>
              </div>
              
              {/* Room Price and Details */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[#FF6A00] text-white px-3 py-1 rounded text-sm font-semibold">
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
                  <div className="text-[#655D4E] text-sm">Taxes and Fees</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-[#FF6A00]">${room.price}</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                  <div className="w-5 h-5  flex items-center justify-center">
                    <PencilIcon className="w-3 h-3 text-[#FF6A00]" />
                  </div>
                  Edit
                </button>
                <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                  <div className="w-5 h-5  flex items-center justify-center">
                    <TrashIcon className="w-3 h-3 text-[#FF6A00]" />
                  </div>
                  Remove
                </button>
                <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                  <div className="w-5 h-5  flex items-center justify-center">
                    <TagIcon className="w-3 h-3 text-[#FF6A00]" />
                  </div>
                  Apply Offer
                </button>
              </div>
              
              {/* Divider Line */}
              <div className="w-full h-px bg-[rgba(0,0,0,0.02)] my-4"></div>
            </div>
          ))}

          {/* Add-on Items */}
          {addOns.map((addOn, index) => (
            <div key={`${addOn.id}-${index}`} className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#423B2D] mb-2">
                    {addOn.name}
                  </h3>
                </div>
              </div>
              
              {/* Add-on Price and Details */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-[#655D4E] text-sm">Taxes and Fees</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-[#FF6A00]">${(addOn.price * (addOn.quantity || 1)).toFixed(2)}</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <PencilIcon className="w-3 h-3 text-[#FF6A00]" />
                  </div>
                  Edit
                </button>
                <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                  <div className="w-5 h-5  flex items-center justify-center">
                    <TrashIcon className="w-3 h-3 text-[#FF6A00]" />
                  </div>
                  Remove
                </button>
                <button className="flex items-center gap-1 text-[#FF6A00] text-sm font-semibold">
                  <div className="w-5 h-5  flex items-center justify-center">
                    <TagIcon className="w-3 h-3 text-[#FF6A00]" />
                  </div>
                  Apply Offer
                </button>
              </div>
              
              {/* Divider Line for add-ons */}
              <div className="w-full h-px bg-[rgba(0,0,0,0.06)] my-4"></div>
            </div>
          ))}

          {/* Total Section */}
          <div className="mt-6 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-black">Total</h3>
                <p className="text-xs text-[#655D4E]">including general taxes and fees</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-[#1D2A3A]">
                  ${calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="w-full h-px bg-[rgba(0,0,0,0.61)] my-6" style={{borderStyle: 'dashed'}}></div>
      </div>
    </div>
  );
}