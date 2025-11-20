"use client";

import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/context/CartContext";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

interface MobileCartIndicatorProps {
  targetId?: string;
  className?: string;
  variant?: "header" | "floating";
}

export default function MobileCartIndicator({
  targetId,
  className = "",
  variant = "floating",
}: MobileCartIndicatorProps) {
  const { rooms, addOns } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = rooms.length + addOns.length;

  const resolvedTarget = useMemo(() => {
    if (targetId) return targetId;
    if (!pathname) return "cart-summary";
    if (pathname.startsWith("/add-ons")) return "addons-cart-summary";
    if (pathname.startsWith("/checkout")) return "checkout-cart-summary";
    return "cart-summary";
  }, [targetId, pathname]);

  if (itemCount === 0) return null;

  const handleClick = () => {
    const target = document.getElementById(resolvedTarget);
    
    // If cart summary exists on current page, scroll to it
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    
    // If cart summary doesn't exist on current page, redirect to checkout
    // This handles cases where user navigated to a different page after adding items
    if (itemCount > 0) {
      router.push("/checkout");
    }
  };

  if (variant === "header") {
    return (
      <button
        onClick={handleClick}
        aria-label="View cart items"
        className={`md:hidden relative flex items-center justify-center text-white ${className}`}
      >
        <span className="relative">
          <ShoppingCartIcon className="w-6 h-6" />
          <span className="absolute -top-1 -right-2 bg-[#FF6A00] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
            {itemCount}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className={`md:hidden fixed top-[230px] right-4 z-40 ${className}`}>
      <button
        onClick={handleClick}
        aria-label="View cart items"
        className="relative flex items-center gap-2 bg-[#1D69F9] text-white px-3 py-2 rounded-full shadow-lg"
      >
        <ShoppingCartIcon className="w-5 h-5" />
        <span className="text-sm font-semibold">{itemCount}</span>
      </button>
    </div>
  );
}

