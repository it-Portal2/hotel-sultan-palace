# Deployment Guide - Hotel Sultan Palace

## Quick Deploy to Vercel

### Step 1: Login to Vercel
```bash
vercel login
```
This will open a browser window for authentication.

### Step 2: Deploy
```bash
vercel --yes
```

For production deployment:
```bash
vercel --prod --yes
```

## Alternative: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Import the repository: `it-Portal2/hotel-sultan-palace`
5. Configure the project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

### Step 3: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Get these values from:
- Firebase Console → Project Settings → General → Your apps → Web app

### Step 4: Deploy

After setting environment variables, Vercel will automatically redeploy.

## Build Status

✅ Build test passed successfully
✅ All dependencies installed
✅ TypeScript compilation successful
✅ Static page generation completed

## Important Notes

1. **Environment Variables**: Make sure all Firebase environment variables are set in Vercel before deployment
2. **Git Integration**: Vercel will automatically deploy on every push to `main` branch
3. **Custom Domain**: You can add a custom domain in Vercel Dashboard → Settings → Domains

## Troubleshooting

If deployment fails:
1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set correctly
3. Ensure Firebase project is properly configured
4. Check that all dependencies are in `package.json`

