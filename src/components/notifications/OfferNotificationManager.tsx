"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getSpecialOffers, SpecialOffer } from "@/lib/firestoreService";
import { isSpecialOfferValid } from "@/lib/offers";
import { XMarkIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon, TagIcon } from "@heroicons/react/24/outline";

interface OfferToastData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  couponCode?: string | null;
  couponMode?: 'none' | 'static' | 'unique_per_user';
}

// Helper to generate a unique code for user
const getUniqueUserCode = (offerId: string, title: string): string => {
  if (typeof window === 'undefined') return '';
  const key = `offer_code_${offerId}`;
  let code = localStorage.getItem(key);

  if (!code) {
    const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'OFF');
    const random = Math.floor(Math.random() * 9000 + 1000);
    code = `${prefix}${random}`;
    localStorage.setItem(key, code);
  }
  return code;
};

// Start: Code block for offer helper functions
const isOfferExpired = (offer: SpecialOffer): boolean => {
  if (!offer.endDate) return false;
  const now = new Date();
  const endDate = new Date(offer.endDate);
  endDate.setHours(23, 59, 59, 999);
  return now > endDate;
};

const hasOfferBeenShown = (offerId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const shownOffers = JSON.parse(localStorage.getItem('shownOffers') || '[]');
    return shownOffers.includes(offerId);
  } catch {
    return false;
  }
};

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

const cleanupExpiredOffers = (activeOfferIds: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const shownOffers = JSON.parse(localStorage.getItem('shownOffers') || '[]');
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    let timer: NodeJS.Timeout | null = null;

    // Reset state when path changes if needed, or keep persistent? 
    // We'll keep it persistent but re-check logic.

    const fetchAndShowOffer = async () => {
      try {
        const offers = await getSpecialOffers();
        const now = new Date();

        const validOffers = offers.filter((o) => {
          if (!o.isActive) return false;
          if (isOfferExpired(o)) return false;
          if (!isSpecialOfferValid(o, { now })) return false;
          return true;
        });

        if (validOffers.length === 0) {
          setVisible(false);
          cleanupExpiredOffers([]);
          return;
        }

        const activeOfferIds = validOffers.map(o => o.id);
        cleanupExpiredOffers(activeOfferIds);

        // Prioritize: Unseen offers -> Then random valid offer (optional, but requirement implies managing unseen)
        // For now,stick to "First Unseen", if all seen, don't show.
        const offerToShow = validOffers.find((o) => !hasOfferBeenShown(o.id));

        if (!offerToShow) {
          // Optional: if client wants to ALWAYS show an offer on homepage, we could fallback here.
          // But strict "notification" rules usually mean once per session/user.
          return;
        }

        let displayCode = offerToShow.couponCode;
        if (offerToShow.couponMode === 'unique_per_user') {
          displayCode = getUniqueUserCode(offerToShow.id, offerToShow.title);
        }

        setOffer({
          id: offerToShow.id,
          title: offerToShow.title || "Special Offer",
          description: offerToShow.description || "",
          imageUrl: offerToShow.imageUrl || undefined,
          couponCode: displayCode,
          couponMode: offerToShow.couponMode,
        });

        timer = setTimeout(() => {
          setVisible(true);
          markOfferAsShown(offerToShow.id);
        }, 5000); // 5 seconds delay is better than 10
      } catch (error) {
        console.error("Unable to fetch offers:", error);
      }
    };

    fetchAndShowOffer();
    return () => { if (timer) clearTimeout(timer); };
  }, [pathname]);

  const handleClose = () => setVisible(false);

  const handleCopy = () => {
    if (offer?.couponCode) {
      navigator.clipboard.writeText(offer.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBookNow = () => {
    setVisible(false);
    router.push("/hotel#rooms-section");
  };

  if (!offer || !visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 w-full max-w-[420px] animate-slide-up-fade">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">

        {/* Header Image */}
        {offer.imageUrl && (
          <div className="relative h-32 w-full">
            <Image
              src={offer.imageUrl}
              alt={offer.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-5">
          {/* Content without image handled gracefully? If no image, we need close button here */}
          {!offer.imageUrl && (
            <button onClick={handleClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
          )}

          <div className="flex gap-4 items-start">
            {!offer.imageUrl && (
              <div className="p-3 bg-orange-100 rounded-xl text-orange-600 shrink-0">
                <TagIcon className="h-6 w-6" />
              </div>
            )}
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{offer.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{offer.description}</p>
            </div>
          </div>

          {/* Coupon Section */}
          {(offer.couponCode && offer.couponMode !== 'none') && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Coupon Code</span>
                <span className="font-mono text-lg font-bold text-gray-900">{offer.couponCode}</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-gray-600 hover:text-orange-600 hover:border-orange-200 transition-all active:scale-95"
              >
                {copied ? <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-600" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => { setVisible(false); router.push('/offers'); }} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
              View Details
            </button>
            <button onClick={handleBookNow} className="px-4 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-sm hover:bg-orange-700 shadow-md shadow-orange-500/20 transition-all hover:translate-y-[-1px]">
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

