import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id"
};

// Initialize Firebase only on client side to avoid build issues
let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;
let messaging: Messaging | null = null;

try {
  app = initializeApp(firebaseConfig);
  // Use initializeFirestore with experimentalForceLongPolling to prevent timeout errors
  // "Backend didn't respond within 10 seconds"
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });

  // Auth and Storage work in Node environments too usually, but safe to keep here
  auth = getAuth(app);
  storage = getStorage(app);

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.warn('Firebase Messaging initialization failed:', error);
    }
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error);
}

export { db, auth, storage, messaging };

// Suppress Firebase connection timeout errors and warnings
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    // Suppress Firestore connection timeout errors
    if (message.includes('@firebase/firestore') &&
      (message.includes('Could not reach Cloud Firestore backend') ||
        message.includes('Backend didn\'t respond within') ||
        message.includes('operate in offline mode'))) {
      return; // Suppress this specific error
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    // Suppress Firestore connection warnings
    if (message.includes('@firebase/firestore') &&
      (message.includes('Could not reach Cloud Firestore backend') ||
        message.includes('Backend didn\'t respond within') ||
        message.includes('operate in offline mode'))) {
      return; // Suppress these warnings
    }
    originalConsoleWarn.apply(console, args);
  };
}

export default app;