"use client";

import { useEffect, useState } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { requestNotificationPermission, isNotificationPermissionGranted, isNotificationPermissionDenied, registerServiceWorker } from '@/lib/notificationService';

export default function NotificationPermission() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      console.log('[NotificationPermission] Server side, skipping');
      return;
    }

    // Check URL parameter for testing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test-notification') === 'true') {
      console.log('[NotificationPermission] Test mode enabled via URL parameter');
      setShowPrompt(true);
      return;
    }

    console.log('[NotificationPermission] Component mounted, checking permissions...');

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('[NotificationPermission] Browser does not support notifications');
      return;
    }

    // Check current permission status
    const currentPermission = Notification.permission;
    console.log('[NotificationPermission] Current permission:', currentPermission);

    // Check if notification permission is already granted or denied
    if (isNotificationPermissionGranted()) {
      console.log('[NotificationPermission] Permission already granted, skipping popup');
      return;
    }

    if (isNotificationPermissionDenied()) {
      console.log('[NotificationPermission] Permission already denied, skipping popup');
      return;
    }

    // Check if VAPID key is set
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[NotificationPermission] VAPID key not set, popup will still show but token generation may fail');
    } else {
      console.log('[NotificationPermission] VAPID key is set');
    }

    console.log('[NotificationPermission] Setting timer to show popup in 3 seconds...');

    // Show prompt after 3 seconds
    const timer = setTimeout(() => {
      console.log('[NotificationPermission] Timer fired, showing popup');
      setShowPrompt(true);
    }, 3000);

    return () => {
      console.log('[NotificationPermission] Cleanup: clearing timer');
      clearTimeout(timer);
    };
  }, []);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        alert('Your browser does not support notifications');
        setShowPrompt(false);
        return;
      }

      // Register service worker first
      const registration = await registerServiceWorker();
      if (!registration) {
        console.warn('Service worker registration failed');
      }

      // Small delay to ensure service worker is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Then request permission
      const token = await requestNotificationPermission();
      if (token) {
        setShowPrompt(false);
        // Show success message
        alert('Notifications enabled successfully! You will receive updates about our special offers.');
        console.log('Notifications enabled successfully, token:', token.substring(0, 20) + '...');
      } else {
        // Permission denied
        setShowPrompt(false);
        alert('Notification permission was denied. You can enable it later from browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <BellIcon className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Get Notified About Offers
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Stay updated with our latest offers and discounts. We&apos;ll send you notifications when new offers are available.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={isRequesting}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? 'Enabling...' : 'Enable Notifications'}
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Not Now
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

