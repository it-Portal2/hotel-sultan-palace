import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

let adminApp: App | null = null;

// Initialize Firebase Admin SDK
export const getAdminApp = (): App => {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Initialize with service account JSON from environment variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set');
  }

  try {
    // Parse the JSON string from environment variable
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    return adminApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
};

// Get Firestore instance
export const getAdminFirestore = () => {
  const app = getAdminApp();
  return getFirestore(app);
};

// Get Messaging instance
export const getAdminMessaging = () => {
  const app = getAdminApp();
  return getMessaging(app);
};

