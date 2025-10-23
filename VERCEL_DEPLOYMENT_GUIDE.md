# Environment Variables Setup for Vercel Deployment

## Step 1: Get Firebase Configuration
Go to Firebase Console → Project Settings → General → Your apps → Web app

## Step 2: Add Environment Variables in Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

### Required Environment Variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBvQzKjKjKjKjKjKjKjKjKjKjKjKjKjKjK
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hotel-management-da626.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hotel-management-da626
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hotel-management-da626.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456789
```

## Step 3: Redeploy
After adding environment variables, redeploy your project.

## Note:
Replace the example values above with your actual Firebase configuration values.
