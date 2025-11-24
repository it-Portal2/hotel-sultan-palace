"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getSpecialOffers, SpecialOffer } from "@/lib/firestoreService";

interface OfferToastData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  couponCode?: string | null;
}

export default function OfferNotificationManager() {
  const pathname = usePathname();
  const router = useRouter();
  const [offer, setOffer] = useState<OfferToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const fetchOffer = async () => {
      try {
        const offers = await getSpecialOffers();
        const activeOffer = offers.find((o) => o.isActive) ?? offers[0];
        if (!activeOffer) {
          setOffer(null);
          setVisible(false);
          return;
        }

        setOffer({
          id: activeOffer.id,
          title: activeOffer.title || "Special Offer",
          description: activeOffer.description || "",
          imageUrl: activeOffer.imageUrl || undefined,
          couponCode: activeOffer.couponCode,
        });
        setVisible(true);
      } catch (error) {
        console.error("[OfferNotificationManager] Unable to fetch offers:", error);
      }
    };

    fetchOffer();
  }, [pathname]);

  const handleClose = () => setVisible(false);

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

