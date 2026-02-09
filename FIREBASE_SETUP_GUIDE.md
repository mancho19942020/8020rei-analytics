# 🔥 Firebase Authentication Setup Guide

This guide will walk you through setting up Firebase Authentication for the 8020REI Analytics Dashboard.

**What you'll learn:**
- How to create a Firebase project
- How to enable Google Authentication
- How to get your Firebase configuration
- How to manage users in Firebase Console

**Time needed:** 15 minutes

---

## 📋 Prerequisites

- Google account (german@8020rei.com or any admin account)
- Access to Google Cloud project: `web-app-production-451214` (optional - you can create a new Firebase project)

---

## Step 1: Create Firebase Project

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Sign in with your Google account

2. **Create a new project:**
   - Click "Add project" or "Create a project"
   - **Project name:** `8020REI Analytics` (or any name you prefer)
   - Click "Continue"

3. **Google Analytics (optional):**
   - Toggle OFF if you don't need analytics for this project
   - Or leave ON and select your Google Analytics account
   - Click "Create project"

4. **Wait for project creation** (~30 seconds)
   - Click "Continue" when ready

---

## Step 2: Enable Google Authentication

1. **In Firebase Console, go to Authentication:**
   - In the left sidebar, click "Authentication"
   - Click "Get started"

2. **Enable Google Sign-In:**
   - Click on the "Sign-in method" tab (top of page)
   - Find "Google" in the list of providers
   - Click on "Google"
   - Toggle the **Enable** switch to ON

3. **Configure Google Provider:**
   - **Project support email:** Select your email (german@8020rei.com)
   - Click "Save"

✅ **Google Authentication is now enabled!**

---

## Step 3: Register Your Web App

1. **Go to Project Settings:**
   - Click the ⚙️ gear icon (top left, next to "Project Overview")
   - Select "Project settings"

2. **Scroll down to "Your apps"**
   - Click the **Web** icon (`</>`)

3. **Register app:**
   - **App nickname:** `8020REI Analytics Dashboard`
   - ❌ DO NOT check "Also set up Firebase Hosting"
   - Click "Register app"

4. **Copy Firebase configuration:**
   - You'll see a code snippet with `firebaseConfig`
   - **Keep this page open!** You'll need these values

---

## Step 4: Copy Configuration to .env.local

1. **From the Firebase Console**, find these values in the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

2. **Open your `.env.local` file** (in the project root)

3. **Replace the placeholder values** with your actual Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza....
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

4. **Save the file** (Cmd+S or Ctrl+S)

---

## Step 5: Configure Authorized Domains

1. **In Firebase Console → Authentication:**
   - Click on the "Settings" tab
   - Scroll down to "Authorized domains"

2. **Add localhost (already there by default):**
   - `localhost` should already be in the list
   - If not, click "Add domain" and add `localhost`

3. **For production (later):**
   - When you deploy to Vercel, add your Vercel domain here
   - Example: `8020rei-analytics-xyz.vercel.app`

---

## Step 6: Restart Your Dev Server

1. **Stop the server** (if running):
   - In your terminal, press `Ctrl+C`

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Wait for "Ready in XXXms"**

---

## Step 7: Test Authentication

1. **Open your browser:**
   - Go to: http://localhost:4000

2. **You should see:**
   - Login page with "Continue with Google" button
   - Notice that says "Only @8020rei.com email addresses are allowed"

3. **Click "Continue with Google"**

4. **Sign in with your company email:**
   - Choose: german@8020rei.com (or any @8020rei.com email)

5. **Grant permissions** when asked

6. **You should be redirected to the dashboard!** ✅
   - You'll see your name and email in the top right
   - All analytics data should load

---

## 🎉 Success! What You Have Now

✅ Firebase Authentication enabled
✅ Google sign-in working
✅ Only @8020rei.com emails allowed
✅ Dashboard protected with authentication
✅ User info displayed in header
✅ Sign-out functionality

---

## 👥 Managing Users in Firebase Console

### View Signed-In Users:

1. **Go to Firebase Console:**
   - https://console.firebase.google.com
   - Select your project

2. **Go to Authentication → Users:**
   - You'll see a list of all users who have signed in
   - Shows: Email, UID, Creation date, Last sign-in

### Block a User:

1. **Find the user in the list**
2. **Click the ⋮ (three dots) menu**
3. **Select "Disable user"**
4. **Confirm**

✅ That user can no longer sign in!

### Re-enable a User:

1. **Find the disabled user**
2. **Click ⋮ → "Enable user"**

---

## 🔒 How Email Restriction Works

The app automatically blocks non-company emails in the code:

```typescript
// In AuthContext.tsx
if (email.endsWith('@8020rei.com')) {
  // Allow access
} else {
  // Block and sign out
  alert('Access denied. Only @8020rei.com email addresses are allowed.');
}
```

**What happens if someone tries:**
1. They sign in with `personal@gmail.com`
2. Google authenticates them
3. Firebase receives the user
4. Our code checks: Does email end with `@8020rei.com`? NO
5. Immediately sign them out
6. Show alert: "Access denied"

---

## 🚀 For Production Deployment (Vercel)

### When you deploy to Vercel, you need to:

1. **Add environment variables in Vercel:**
   - Go to your Vercel project settings
   - Add all 6 Firebase variables:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`

2. **Add your Vercel domain to Firebase:**
   - Firebase Console → Authentication → Settings
   - Under "Authorized domains", add your Vercel URL
   - Example: `8020rei-analytics-xyz.vercel.app`

3. **Redeploy** and it should work!

---

## 🐛 Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"
**Problem:** `NEXT_PUBLIC_FIREBASE_API_KEY` is wrong or missing
**Solution:**
- Check `.env.local` - make sure you copied the API key correctly
- Restart the dev server

### Error: "Firebase: Error (auth/unauthorized-domain)"
**Problem:** Your domain isn't authorized in Firebase
**Solution:**
- Firebase Console → Authentication → Settings → Authorized domains
- Make sure `localhost` is in the list

### Error: "Access denied" popup when signing in
**Problem:** You're using a non-company email
**Solution:**
- Sign in with a `@8020rei.com` email address
- Or temporarily disable the restriction (not recommended for production)

### Sign-in popup doesn't appear
**Problem:** Popup blocker or browser settings
**Solution:**
- Check if your browser blocked the popup
- Allow popups for localhost:4000
- Try a different browser

### Firebase Console shows no users
**Problem:** No one has signed in yet, or wrong project selected
**Solution:**
- Make sure you're in the correct Firebase project
- Try signing in again
- Wait a few seconds and refresh the page

---

## 📊 Firebase Dashboard Features

### What You Can See:

1. **Users tab:**
   - All signed-in users
   - Last sign-in times
   - User IDs (UIDs)

2. **Sign-in methods:**
   - Which authentication providers are enabled
   - Can add more (Email/Password, GitHub, etc.)

3. **Settings:**
   - Authorized domains
   - Email templates
   - Password policy (if using email/password)

4. **Usage:**
   - How many users signed in today/this month
   - Authentication requests

---

## 🎓 Learning Firebase

You now have a working Firebase Authentication setup! This is the foundation for:
- User management
- Access control
- Session handling

**Next steps to learn more:**
- Explore Firebase Console - click around!
- Try disabling/enabling users
- Check out the Firebase documentation: https://firebase.google.com/docs/auth

---

## ✅ Checklist

Before moving to production, make sure:

- [ ] Firebase project created
- [ ] Google Authentication enabled
- [ ] Web app registered in Firebase
- [ ] Configuration copied to `.env.local`
- [ ] Dev server restarted
- [ ] Successfully signed in with @8020rei.com email
- [ ] Dashboard loads correctly
- [ ] Sign-out button works
- [ ] Tested that non-company emails are blocked
- [ ] Know how to view users in Firebase Console
- [ ] Know how to block/unblock users

---

**Need help?**
- Check the Firebase documentation: https://firebase.google.com/docs
- Look at the browser console (F12 → Console) for error messages
- Check your terminal for server errors

---

**Congratulations! 🎉** You've successfully set up Firebase Authentication with company email restrictions!
