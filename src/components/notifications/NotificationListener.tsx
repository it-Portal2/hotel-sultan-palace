"use client";

import { useEffect, useState } from 'react';
import { setupForegroundMessageListener, isNotificationPermissionGranted } from '@/lib/notificationService';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ActiveOfferNotification {
  title: string;
  body: string;
  imageUrl?: string;
  url: string;
  bookUrl: string;
}

export default function NotificationListener() {
  const router = useRouter();
  const [activeNotification, setActiveNotification] = useState<ActiveOfferNotification | null>(null);

  useEffect(() => {
    if (!isNotificationPermissionGranted()) {
      return;
    }

    const unsubscribe = setupForegroundMessageListener((payload) => {
      const data = payload.data || {};
      setActiveNotification({
        title: payload.notification?.title || 'New Offer!',
        body: payload.notification?.body || 'Check out our latest offer.',
        imageUrl: payload.notification?.image || data.imageUrl || undefined,
        url: data.url || '/offers',
        bookUrl: data.bookUrl || '/hotel',
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleClose = () => setActiveNotification(null);

  const handleNavigate = (path: string) => {
    setActiveNotification(null);
    router.push(path);
  };

  if (!activeNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-4 z-50 max-w-md w-full">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex gap-3 animate-slide-in-left">
        {activeNotification.imageUrl && (
          <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-100">
            <Image
              src={activeNotification.imageUrl}
              alt="Offer"
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{activeNotification.title}</p>
              <p className="text-xs text-gray-600 mt-1">{activeNotification.body}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-sm"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => handleNavigate(activeNotification.bookUrl)}
              className="px-3 py-2 rounded-md bg-orange-600 text-white text-xs font-medium hover:bg-orange-700"
            >
              Book Now
            </button>
            <button
              onClick={() => handleNavigate(activeNotification.url)}
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

