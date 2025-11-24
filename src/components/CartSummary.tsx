"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { PencilIcon, TrashIcon, TagIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/context/ToastContext";

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
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
  } = useCart();
  
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponField, setShowCouponField] = useState(false);

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

  const { showToast } = useToast();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');

    try {
      const result = await applyCoupon(couponCode.toUpperCase().trim());
      if (result.success) {
        setCouponError('');
        setCouponCode('');
        setShowCouponField(false);
        showToast(`Coupon "${couponCode.toUpperCase()}" applied successfully!`, 'success');
      } else {
        const message = result.message || 'Failed to apply coupon';
        setCouponError(message);
        showToast(message, 'error');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Error applying coupon. Please try again.');
      showToast('Error applying coupon', 'error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setShowCouponField(true);
    showToast('Coupon removed', 'info');
  };

  const handleApplyOfferToggle = () => {
    setShowCouponField((prev) => !prev);
    setCouponError('');
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
                    onClick={handleApplyOfferToggle}
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
                    onClick={handleApplyOfferToggle}
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

          {/* Coupon Code Section */}
          <div className="mb-4">
            {appliedCoupon ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Coupon Applied: {appliedCoupon.code}
                    </p>
                    <p className="text-xs text-green-600">
                      {appliedCoupon.discountType === 'percentage' 
                        ? `${appliedCoupon.discountValue}% off`
                        : `$${appliedCoupon.discountValue} off`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-green-600 hover:text-green-800"
                  title="Remove coupon"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have a coupon code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                      setCouponError('');
                    }}
                    placeholder="Enter coupon code"
                    className="flex-1 h-10 px-3 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500 font-mono"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-2 text-xs text-red-600">{couponError}</p>
                )}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-[16px] text-[#655D4E]">
              <span>Subtotal</span>
              <span>${(calculateTotal() + getDiscountAmount()).toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex items-center justify-between text-[16px] text-green-600">
                <span>Discount ({appliedCoupon.code})</span>
                <span>-${getDiscountAmount().toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="w-full border-t border-dashed border-[#AFAFAF] my-4" />

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
              <button onClick={handleApplyOfferToggle} className="flex items-center gap-1">
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
              <button onClick={handleApplyOfferToggle} className="flex items-center gap-1">
                <TagIcon className="w-4 h-4" />
                Apply Offer
              </button>
            </div>

            {index < addOns.length - 1 && (
              <div className="w-full h-px bg-[rgba(0,0,0,0.06)] my-4" />
            )}
          </div>
        ))}

        {/* Coupon Code Section */}
        <div className="mt-6 mb-4">
          {appliedCoupon ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Coupon Applied: {appliedCoupon.code}
                  </p>
                  {appliedCoupon.title && (
                    <p className="text-xs text-green-700">{appliedCoupon.title}</p>
                  )}
                  <p className="text-xs text-green-600">
                    {appliedCoupon.discountType === 'percentage' 
                      ? `${appliedCoupon.discountValue}% off`
                      : `$${appliedCoupon.discountValue} off`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-green-600 hover:text-green-800"
                title="Remove coupon"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ) : showCouponField ? (
            <div className="border border-gray-300 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Have a coupon code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    setCouponError('');
                  }}
                  placeholder="Enter coupon code"
                  className="flex-1 h-10 px-3 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500 font-mono"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {applyingCoupon ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p className="mt-2 text-xs text-red-600">{couponError}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-[16px] text-[#655D4E]">
            <span>Subtotal</span>
            <span>${(calculateTotal() + getDiscountAmount()).toFixed(2)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between text-[16px] text-green-600">
              <span>Discount ({appliedCoupon.code})</span>
              <span>-${getDiscountAmount().toFixed(2)}</span>
            </div>
          )}
        </div>

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

