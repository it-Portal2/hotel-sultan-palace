import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { messaging } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase';

// Register service worker with Firebase config
export const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    
    // Send Firebase config to service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        },
      });
    } else if (registration.installing) {
      registration.installing.addEventListener('statechange', () => {
        if (registration.installing?.state === 'activated' && registration.active) {
          registration.active.postMessage({
            type: 'FIREBASE_CONFIG',
            config: {
              apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
              authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
              storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
              messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
              appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
            },
          });
        }
      });
    }
    
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Messaging not initialized');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) {
      console.warn('No FCM token available');
      return null;
    }

    // Save token to Firestore
    await saveTokenToFirestore(token);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fcmPermissionGranted', 'true');
      } catch (err) {
        console.warn('Unable to persist notification permission flag:', err);
      }
    }

    return token;
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
};

// Save FCM token to Firestore
const saveTokenToFirestore = async (token: string) => {
  if (!db || !auth?.currentUser) {
    // Save as anonymous user if not logged in
    const userId = 'anonymous';
    await saveTokenForUser(userId, token);
    return;
  }

  const userId = auth.currentUser.uid;
  await saveTokenForUser(userId, token);
};

const saveTokenForUser = async (userId: string, token: string) => {
  if (!db) return;

  try {
    // Check if token already exists
    const tokensRef = collection(db, 'fcmTokens');
    const q = query(tokensRef, where('token', '==', token));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Token exists, update it
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        userId,
        updatedAt: new Date(),
      });
    } else {
      // New token, add it
      await addDoc(tokensRef, {
        userId,
        token,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

// Listen for foreground messages (when app is open)
export const setupForegroundMessageListener = (callback: (payload: MessagePayload) => void) => {
  if (!messaging) {
    console.warn('Messaging not initialized');
    return () => {};
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });

  return unsubscribe;
};

// Check if notification permission is granted
export const isNotificationPermissionGranted = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
};

// Check if notification permission is denied
export const isNotificationPermissionDenied = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'denied';
};

