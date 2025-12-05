"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getSpecialOffers, SpecialOffer } from "@/lib/firestoreService";
import { isSpecialOfferValid } from "@/lib/offers";

interface OfferToastData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  couponCode?: string | null;
}

// Helper function to check if offer is expired
const isOfferExpired = (offer: SpecialOffer): boolean => {
  if (!offer.endDate) return false; // No end date means it doesn't expire
  
  const now = new Date();
  const endDate = new Date(offer.endDate);
  endDate.setHours(23, 59, 59, 999); // End of the day
  
  return now > endDate;
};

// Helper function to check if offer has been shown to user
const hasOfferBeenShown = (offerId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const shownOffers = JSON.parse(localStorage.getItem('shownOffers') || '[]');
    return shownOffers.includes(offerId);
  } catch {
    return false;
  }
};

// Mark offer as shown
const markOfferAsShown = (offerId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const shownOffers = JSON.parse(localStorage.getItem('shownOffers') || '[]');
    if (!shownOffers.includes(offerId)) {
      shownOffers.push(offerId);
      localStorage.setItem('shownOffers', JSON.stringify(shownOffers));
    }
  } catch (error) {
    console.error('Error marking offer as shown:', error);
  }
};

// Clean up expired offers from localStorage (keep only active offer IDs)
const cleanupExpiredOffers = (activeOfferIds: string[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const shownOffers = JSON.parse(localStorage.getItem('shownOffers') || '[]');
    // Keep only offers that are still active
    const cleanedOffers = shownOffers.filter((id: string) => activeOfferIds.includes(id));
    localStorage.setItem('shownOffers', JSON.stringify(cleanedOffers));
  } catch (error) {
    console.error('Error cleaning up expired offers:', error);
  }
};

export default function OfferNotificationManager() {
  const pathname = usePathname();
  const router = useRouter();
  const [offer, setOffer] = useState<OfferToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    let timer: NodeJS.Timeout | null = null;

    const fetchAndShowOffer = async () => {
      try {
        const offers = await getSpecialOffers();
        
        // Filter offers: must be active, not expired, and valid
        const now = new Date();
        const validOffers = offers.filter((o) => {
          if (!o.isActive) return false;
          if (isOfferExpired(o)) return false;
          if (!isSpecialOfferValid(o, { now })) return false;
          return true;
        });

        if (validOffers.length === 0) {
          setOffer(null);
          setVisible(false);
          // Clean up expired offers from localStorage
          cleanupExpiredOffers([]);
          return;
        }

        // Clean up expired offers from localStorage (keep only active offer IDs)
        const activeOfferIds = validOffers.map(o => o.id);
        cleanupExpiredOffers(activeOfferIds);

        // Find the first offer that hasn't been shown yet
        const offerToShow = validOffers.find((o) => !hasOfferBeenShown(o.id));

        // If all offers have been shown, don't show anything
        if (!offerToShow) {
          setOffer(null);
          setVisible(false);
          return;
        }

        setOffer({
          id: offerToShow.id,
          title: offerToShow.title || "Special Offer",
          description: offerToShow.description || "",
          imageUrl: offerToShow.imageUrl || undefined,
          couponCode: offerToShow.couponCode,
        });

        // Show popup after 10 seconds delay
        timer = setTimeout(() => {
          setVisible(true);
          markOfferAsShown(offerToShow.id);
        }, 10000); // 10 seconds
      } catch (error) {
        console.error("[OfferNotificationManager] Unable to fetch offers:", error);
      }
    };

    fetchAndShowOffer();

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [pathname]);

  const handleClose = () => {
    setVisible(false);
    // Mark as shown when user closes it
    if (offer) {
      markOfferAsShown(offer.id);
    }
  };

  const handleBookNow = () => {
    setVisible(false);
    router.push("/hotel#rooms-section");
  };

  const handleViewOffer = () => {
    setVisible(false);
    router.push("/offers");
  };

  if (!offer || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-md w-full animate-slide-in-left">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex gap-3">
        {offer.imageUrl && (
          <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-100">
            <Image
              src={offer.imageUrl}
              alt="Offer"
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{offer.title}</p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-4">{offer.description}</p>
              {offer.couponCode && (
                <p className="text-xs font-semibold text-orange-600 mt-1">
                  Coupon Code: {offer.couponCode}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-sm"
              aria-label="Close offer notification"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleBookNow}
              className="px-3 py-2 rounded-md bg-orange-600 text-white text-xs font-medium hover:bg-orange-700"
            >
              Book Now
            </button>
            <button
              onClick={handleViewOffer}
              className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50"
            >
              View Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

