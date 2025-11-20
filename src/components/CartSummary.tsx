"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { PencilIcon, TrashIcon, TagIcon } from "@heroicons/react/24/outline";

interface CartSummaryProps {
  className?: string;
  showCheckoutButton?: boolean;
  onCheckout?: () => void;
  variant?: "warm" | "checkout";
}

export default function CartSummary({
  className = "",
  showCheckoutButton = true,
  onCheckout,
  variant = "warm",
}: CartSummaryProps) {
  const router = useRouter();
  const {
    rooms,
    addOns,
    calculateTotal,
    bookingData,
    removeRoom,
    removeAddOn,
    getNumberOfNights,
  } = useCart();

  const totalItems = rooms.length + addOns.length;
  const nights = getNumberOfNights();

  const groupedRooms = useMemo(() => {
    const map = new Map<
      string,
      { room: (typeof rooms)[number]; quantity: number; cartIds: string[] }
    >();
    rooms.forEach((room) => {
      const existing = map.get(room.id);
      if (existing) {
        existing.quantity += 1;
        existing.cartIds.push(room.cartItemId);
      } else {
        map.set(room.id, { room, quantity: 1, cartIds: [room.cartItemId] });
      }
    });
    return Array.from(map.values());
  }, [rooms]);

  const handleEditRoom = () => {
    router.push("/hotel#rooms-section");
    setTimeout(() => {
      const el = document.getElementById("rooms-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      router.push("/checkout");
    }
  };

  const dateRangeText = bookingData
    ? `${new Date(bookingData.checkIn).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })} - ${new Date(bookingData.checkOut).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`
    : "Thu, Nov 20, 2025 - Fri, Nov 21, 2025";

  const defaultDescription =
    "This suite's standout feature is the pool with a view. Boasting a private entrance, this air...";

  const nightsLabel = `${nights} Night${nights > 1 ? "s" : ""} Stay`;

  const handleApplyOffer = () => {
    router.push("/offers");
  };

  if (variant === "checkout") {
    return (
      <div
        className={`bg-white border border-[#ECE2D0] ${className}`}
      >
        <div className="p-5 md:p-6">
          <h2 className="text-[22px] font-bold text-[#3A3326] mb-2">
            Your Cart (Item - {totalItems})
          </h2>
          <div className="h-[1px] w-full rounded bg-[rgba(66,59,45,0.13)] mb-5" />

          <div className="bg-white p-5 border border-[#F0E6D9] shadow-sm">
            {groupedRooms.map(({ room, quantity, cartIds }, index) => (
              <div key={cartIds[0]} className="mb-6 last:mb-0">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <h3 className="text-[22px] font-semibold text-[#423B2D] mb-2">
                      {room.name}{" "}
                      {quantity > 1 && (
                        <span className="text-[18px] font-normal text-[#655D4E]">
                          ×{quantity}
                        </span>
                      )}
                    </h3>
                    <p className="text-[14px] text-[#423B2D] leading-[1.714] mb-2">
                      {room.description || defaultDescription}
                    </p>
                    <p className="text-[15px] text-[#1D69F9] font-bold mb-2">
                      {dateRangeText}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-semibold text-[#1D2A3A]">
                      ${(room.price * nights * quantity).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-[#1D69F9] px-3 py-1 rounded bg-[#E9F0FF] text-[15px] font-bold">
                      {nightsLabel}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-[#655D4E] text-[16px]">Taxes and Fees</div>
                    <div className="text-[#1D2A3A] text-[16px] font-semibold">$0.00</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[#3F3F3F] text-[16px] font-bold">
                  <button onClick={handleEditRoom} className="flex items-center gap-1">
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      cartIds.length > 0 &&
                      removeRoom(cartIds[cartIds.length - 1])
                    }
                    className="flex items-center gap-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Remove
                  </button>
                  <button
                    onClick={handleApplyOffer}
                    className="flex items-center gap-1"
                  >
                    <TagIcon className="w-4 h-4" />
                    Apply Offer
                  </button>
                </div>

                {index < groupedRooms.length - 1 && (
                  <div className="w-full h-px bg-[rgba(0,0,0,0.06)] my-4" />
                )}
              </div>
            ))}

            {addOns.map((addOn, index) => (
              <div key={addOn.id} className="mb-6 last:mb-0">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <h3 className="text-[20px] font-semibold text-[#423B2D] mb-2">
                      {addOn.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-semibold text-[#1D2A3A]">
                      ${(addOn.price * (addOn.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="text-[#655D4E] text-[16px]">Taxes and Fees</div>
                  <div className="text-[#1D2A3A] text-[16px] font-semibold">$0.00</div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[#3F3F3F] text-[16px] font-bold">
                  <button
                    onClick={() => router.push("/add-ons")}
                    className="flex items-center gap-1"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => removeAddOn(addOn.id)}
                    className="flex items-center gap-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Remove
                  </button>
                  <button
                    onClick={handleApplyOffer}
                    className="flex items-center gap-1"
                  >
                    <TagIcon className="w-4 h-4" />
                    Apply Offer
                  </button>
                </div>

                {index < addOns.length - 1 && (
                  <div className="w-full h-px bg-[rgba(0,0,0,0.06)] my-4" />
                )}
              </div>
            ))}
          </div>

          <div className="w-full border-t border-dashed border-[#AFAFAF] my-6" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-semibold text-[#000000]">
                Total
              </h3>
              <p className="text-[10px] text-[#655D4E]">
                including general taxes and fees
              </p>
            </div>
            <div className="text-[22px] font-semibold text-[#1D2A3A]">
              ${calculateTotal().toFixed(2)}
            </div>
          </div>

          {showCheckoutButton && (
            <button
              onClick={handleCheckout}
              className="w-full mt-6 bg-[#1D69F9] text-white py-3 px-6 font-semibold text-[20px] hover:bg-[#1352c8] transition-colors"
            >
              Checkout
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-[#F8F8F8] p-5 lg:p-[26px] border border-[#F0E6D9] ${className}`}
    >
      <h2 className="text-[22px] font-bold text-[#3A3326] mb-2">
        Your Cart (Item - {totalItems})
      </h2>
      <div className="h-[1px] w-full rounded bg-[rgba(66,59,45,0.13)] mb-5" />

      <div className="bg-white p-5 border border-[#F0E6D9] shadow-sm">
        {groupedRooms.map(({ room, quantity, cartIds }, index) => (
          <div key={cartIds[0]} className="mb-6 last:mb-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <h3 className="text-[22px] font-semibold text-[#423B2D] mb-2">
                  {room.name}{" "}
                  {quantity > 1 && (
                    <span className="text-[18px] font-normal text-[#655D4E]">
                      ×{quantity}
                    </span>
                  )}
                </h3>
                <p className="text-[14px] text-[#423B2D] leading-[1.714] mb-2">
                  {room.description || defaultDescription}
                </p>
                <p className="text-[15px] text-[#1D69F9] font-bold mb-2">
                  {dateRangeText}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[18px] font-semibold text-[#1D2A3A]">
                  ${(room.price * nights * quantity).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-[#1D69F9] px-3 py-1 rounded bg-[#E9F0FF] text-[15px] font-bold">
                  {nightsLabel}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[#655D4E] text-[16px]">Taxes and Fees</div>
                <div className="text-[#1D2A3A] text-[16px] font-semibold">$0.00</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[#3F3F3F] text-[16px] font-bold">
              <button onClick={handleEditRoom} className="flex items-center gap-1">
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() =>
                  cartIds.length > 0 &&
                  removeRoom(cartIds[cartIds.length - 1])
                }
                className="flex items-center gap-1"
              >
                <TrashIcon className="w-4 h-4" />
                Remove
              </button>
              <button onClick={handleApplyOffer} className="flex items-center gap-1">
                <TagIcon className="w-4 h-4" />
                Apply Offer
              </button>
            </div>

            {index < groupedRooms.length - 1 && (
              <div className="w-full h-px bg-[rgba(0,0,0,0.06)] my-4" />
            )}
          </div>
        ))}

        {addOns.map((addOn, index) => (
          <div key={addOn.id} className="mb-6 last:mb-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h3 className="text-[20px] font-semibold text-[#423B2D] mb-2">
                  {addOn.name}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-[18px] font-semibold text-[#1D2A3A]">
                  ${(addOn.price * (addOn.quantity || 1)).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="text-[#655D4E] text-[16px]">Taxes and Fees</div>
              <div className="text-[#1D2A3A] text-[16px] font-semibold">$0.00</div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[#3F3F3F] text-[16px] font-bold">
              <button onClick={() => router.push("/add-ons")} className="flex items-center gap-1">
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => removeAddOn(addOn.id)}
                className="flex items-center gap-1"
              >
                <TrashIcon className="w-4 h-4" />
                Remove
              </button>
              <button onClick={handleApplyOffer} className="flex items-center gap-1">
                <TagIcon className="w-4 h-4" />
                Apply Offer
              </button>
            </div>

            {index < addOns.length - 1 && (
              <div className="w-full h-px bg-[rgba(0,0,0,0.06)] my-4" />
            )}
          </div>
        ))}

        <div className="mt-6 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[18px] font-semibold text-[#000000]">Total</h3>
              <p className="text-[10px] text-[#655D4E]">
                including general taxes and fees
              </p>
            </div>
            <div className="text-[22px] font-semibold text-[#1D2A3A]">
              ${calculateTotal().toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-dashed border-[#AFAFAF] my-6" />

      {showCheckoutButton && (
        <button
          onClick={handleCheckout}
          className="w-full bg-[#1D69F9] text-white py-3 px-6 font-semibold text-[20px] hover:bg-[#1352c8] transition-colors"
        >
          Checkout
        </button>
      )}
    </div>
  );
}

