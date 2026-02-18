import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

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
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set",
    );
  }

  try {
    // Parse the JSON string from environment variable
    const serviceAccount = JSON.parse(serviceAccountJson);

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
      storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace(/"/g, "") ||
        `${serviceAccount.project_id}.firebasestorage.app`,
    });

    return adminApp;
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    throw new Error("Failed to initialize Firebase Admin SDK");
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

// Get Auth instance
export const getAdminAuth = () => {
  const app = getAdminApp();
  return getAuth(app);
};

// Get Storage bucket instance (Phase 11A)
export const getAdminStorage = () => {
  const app = getAdminApp();
  const bucketName = (
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""
  ).replace(/"/g, "");
  return bucketName
    ? getStorage(app).bucket(bucketName)
    : getStorage(app).bucket();
};
