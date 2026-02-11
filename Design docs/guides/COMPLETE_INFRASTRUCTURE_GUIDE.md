# Complete Infrastructure Guide
## Building a Next.js Analytics Dashboard with Google Cloud, BigQuery & Firebase

> **Purpose:** A comprehensive guide to understand and replicate the 8020REI Analytics Dashboard infrastructure
> **Author:** Germán Alvarez & Claude
> **Created:** February 11, 2026
> **Project:** 8020rei-analytics

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Accounts](#2-prerequisites--accounts)
3. [Project Setup (Next.js)](#3-project-setup-nextjs)
4. [Firebase Setup (Authentication)](#4-firebase-setup-authentication)
5. [Google Cloud Setup](#5-google-cloud-setup)
6. [BigQuery Integration](#6-bigquery-integration)
7. [Deployment Configuration](#7-deployment-configuration)
8. [Cloud Run Deployment](#8-cloud-run-deployment)
9. [Continuous Deployment](#9-continuous-deployment)
10. [Troubleshooting](#10-troubleshooting)
11. [Cost Management](#11-cost-management)
12. [Security Best Practices](#12-security-best-practices)

---

## 1. Architecture Overview

### What We Built

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER'S BROWSER                                     │
│                                 │                                            │
│                    ┌────────────▼────────────┐                              │
│                    │   Cloud Run Service     │                              │
│                    │   (Next.js Dashboard)   │                              │
│                    │   analytics8020         │                              │
│                    └────────────┬────────────┘                              │
│                                 │                                            │
│              ┌──────────────────┼──────────────────┐                        │
│              ▼                  ▼                  ▼                        │
│    ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐               │
│    │    Firebase     │ │   BigQuery    │ │  Google Cloud   │               │
│    │ Authentication  │ │   Dataset     │ │    Project      │               │
│    │ (User Login)    │ │  (Analytics   │ │  (Permissions)  │               │
│    │                 │ │   Data)       │ │                 │               │
│    └─────────────────┘ └───────────────┘ └─────────────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 + React | Dashboard UI |
| **Styling** | Tailwind CSS | Responsive design |
| **Charts** | Recharts | Data visualization |
| **Authentication** | Firebase Auth | User login (Google OAuth) |
| **Database** | BigQuery | Analytics data storage |
| **Hosting** | Cloud Run | Serverless container hosting |
| **Build** | Cloud Build | CI/CD pipeline |
| **Registry** | Artifact Registry | Container image storage |
| **Version Control** | GitHub | Source code repository |

### Data Flow

```
1. User visits dashboard URL
         │
         ▼
2. Cloud Run serves Next.js app
         │
         ▼
3. Firebase checks authentication
         │
         ├── Not logged in → Show login page
         │
         └── Logged in → Continue
                  │
                  ▼
4. Dashboard requests data from BigQuery API
         │
         ▼
5. BigQuery returns analytics data
         │
         ▼
6. Charts render the data
```

---

## 2. Prerequisites & Accounts

### Required Accounts

| Account | URL | What For |
|---------|-----|----------|
| **Google Cloud** | console.cloud.google.com | Hosting, BigQuery, Cloud Run |
| **Firebase** | console.firebase.google.com | User authentication |
| **GitHub** | github.com | Code repository |

### Required Permissions (GCP)

To deploy to Cloud Run, your Google account needs these IAM roles:

| Role | What It Allows |
|------|----------------|
| **Cloud Run Admin** | Create/manage Cloud Run services |
| **Cloud Build Editor** | Build container images |
| **Artifact Registry Writer** | Store container images |
| **Service Account User** | Deploy services |
| **BigQuery Data Viewer** | Read analytics data |

### How to Request Permissions

Send this to your GCP admin:

```
I need the following roles on project [PROJECT_ID]:
- roles/run.admin (Cloud Run Admin)
- roles/cloudbuild.builds.editor (Cloud Build Editor)
- roles/artifactregistry.writer (Artifact Registry Writer)
- roles/iam.serviceAccountUser (Service Account User)
- roles/bigquery.dataViewer (BigQuery Data Viewer)
```

### Required APIs (Must Be Enabled)

| API | Purpose |
|-----|---------|
| Cloud Run Admin API | Deploy services |
| Cloud Build API | Build containers |
| Artifact Registry API | Store images |
| BigQuery API | Query data |

---

## 3. Project Setup (Next.js)

### Create New Project

```bash
# Create Next.js project
npx create-next-app@latest my-analytics-dashboard
cd my-analytics-dashboard

# Choose these options:
# ✔ TypeScript? Yes
# ✔ ESLint? Yes
# ✔ Tailwind CSS? Yes
# ✔ `src/` directory? Yes
# ✔ App Router? Yes
# ✔ Import alias? Yes (@/*)
```

### Critical: Configure for Cloud Run

Edit `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',  // ← CRITICAL FOR CLOUD RUN!
};

export default nextConfig;
```

**Why `standalone`?**
- Creates a minimal production build
- Includes only necessary dependencies
- Reduces container size from ~1GB to ~100MB
- Required for Cloud Run deployment

### Project Structure

```
my-analytics-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main dashboard
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── api/               # API routes
│   │       └── bigquery/
│   │           └── route.ts   # BigQuery endpoint
│   ├── components/            # React components
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts      # Firebase configuration
│   │   │   └── AuthContext.tsx # Auth provider
│   │   └── bigquery/
│   │       └── client.ts      # BigQuery client
│   └── types/                 # TypeScript types
├── public/                    # Static files
├── Dockerfile                 # Container build instructions
├── .dockerignore              # Files to exclude from container
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript configuration
```

### Required Dependencies

```bash
# Firebase (authentication)
npm install firebase

# BigQuery (data access)
npm install @google-cloud/bigquery

# Charts (visualization)
npm install recharts

# Date handling
npm install date-fns
```

---

## 4. Firebase Setup (Authentication)

### Step 1: Create Firebase Project

1. Go to: https://console.firebase.google.com
2. Click **"Create a project"**
3. Enter project name (e.g., `my-analytics-dashboard`)
4. Disable Google Analytics (not needed for auth)
5. Click **"Create project"**

### Step 2: Enable Google Sign-In

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google**
3. Toggle **Enable**
4. Set support email
5. Click **Save**

### Step 3: Add Web App

1. In Firebase Console → **Project settings** (gear icon)
2. Scroll to "Your apps" → Click **Web** icon (</> )
3. Enter app nickname (e.g., `dashboard-web`)
4. Click **Register app**
5. Copy the configuration values

### Step 4: Create Firebase Config File

Create `src/lib/firebase/config.ts`:

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
// NEXT_PUBLIC_ vars are safe to expose (client-side)
// Fallback values ensure build works in Cloud Build
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { app, auth };
```

**Important Notes:**
- `NEXT_PUBLIC_` variables are embedded at build time
- They're intentionally public (client-side code)
- Fallback values ensure Cloud Build succeeds
- Never put SECRET keys here (only public config)

---

### CRITICAL: Understanding the Fallback Values Pattern

This is one of the most important lessons when deploying Next.js to Cloud Run.

#### The Problem

When Next.js builds (`npm run build`), it pre-renders pages and needs Firebase to initialize.

**On your local machine:**
```
.env.local file exists
       │
       ▼
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSy..."
       │
       ▼
Firebase initializes successfully
       │
       ▼
Build succeeds ✅
```

**On Cloud Build (no .env.local file):**
```
No .env.local file (it's in .dockerignore)
       │
       ▼
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = undefined
       │
       ▼
Firebase throws: "auth/invalid-api-key"
       │
       ▼
Build fails ❌
```

#### The Solution: Fallback Values

Use the `||` (OR) operator to provide default values:

```typescript
// ❌ BROKEN: Only uses env var (undefined in Cloud Build)
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,

// ✅ FIXED: Falls back to hardcoded value if env var is undefined
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBvPgBxqdKIc1lYj2zESZVSrEb8cPjucX4',
```

#### How the `||` Operator Works

```typescript
const value = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'fallback';

// If env var EXISTS:     value = env var value
// If env var UNDEFINED:  value = 'fallback'
```

#### Why This Is Safe

| Question | Answer |
|----------|--------|
| Are these values secret? | **No.** `NEXT_PUBLIC_` means public by design |
| Can someone steal them? | They're already in browser JavaScript - anyone can see them |
| What protects my Firebase? | Firebase Security Rules, not the API key |
| What's the API key for? | Identifies your project, not authentication |

#### Visual Flow After the Fix

```
                    LOCAL DEVELOPMENT              CLOUD BUILD
                           │                            │
                           │                            │
    .env.local exists? ────┤                            │
           │               │                            │
          YES              │     .env.local exists? ────┤
           │               │            │               │
           ▼               │           NO               │
    Uses env var value     │            │               │
    (from .env.local)      │            ▼               │
           │               │    Uses fallback value     │
           │               │    (hardcoded in code)     │
           │               │            │               │
           ▼               │            ▼               │
    Firebase initializes   │    Firebase initializes    │
           │               │            │               │
           ▼               │            ▼               │
    BUILD SUCCEEDS ✅       │    BUILD SUCCEEDS ✅       │
```

#### Real Example from Our Project

```typescript
// src/lib/firebase/config.ts

const firebaseConfig = {
  // Each line: Try env var first, fall back to hardcoded value
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    || 'AIzaSyBvPgBxqdKIc1lYj2zESZVSrEb8cPjucX4',

  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    || 'rei-analytics-b4b8b.firebaseapp.com',

  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    || 'rei-analytics-b4b8b',

  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    || 'rei-analytics-b4b8b.firebasestorage.app',

  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    || '204019448414',

  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    || '1:204019448414:web:3a7c7516f7284b442d52cf',
};
```

#### Key Takeaway

> **When deploying Next.js to Cloud Run, any `NEXT_PUBLIC_*` variable used during
> build time MUST have a fallback value hardcoded in your source code.**
>
> This is because:
> 1. `.env.local` files are (correctly) excluded from Docker builds
> 2. Cloud Build doesn't have access to your local environment
> 3. Next.js needs these values at BUILD time, not just runtime

---

### Step 5: Create Auth Context

Create `src/lib/firebase/AuthContext.tsx`:

```typescript
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Step 6: Authorize Deployment Domain

After deploying to Cloud Run:

1. Go to: Firebase Console → **Authentication** → **Settings**
2. Under **Authorized domains**
3. Click **Add domain**
4. Add your Cloud Run URL: `your-service-xxxxx.us-central1.run.app`

---

## 5. Google Cloud Setup

### Step 1: Select or Create Project

1. Go to: https://console.cloud.google.com
2. Select existing project or create new one
3. Note the **Project ID** (you'll need this)

### Step 2: Enable Required APIs

Visit each link and click "Enable":

- [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com)
- [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com)
- [Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com)
- [BigQuery API](https://console.cloud.google.com/apis/library/bigquery.googleapis.com)

### Step 3: Set Up Billing

1. Go to: **Billing** in Cloud Console
2. Link a billing account
3. (Optional) Set up budget alerts to avoid surprise charges

### Step 4: Note Your Project Details

Record these values:

| Value | Where to Find | Example |
|-------|---------------|---------|
| Project ID | Console top bar | `web-app-production-451214` |
| Project Number | Project settings | `798362859849` |
| Region | Choose closest | `us-central1` |

---

## 6. BigQuery Integration

### Understanding BigQuery

BigQuery is Google's data warehouse. For analytics:
- Google Analytics 4 can export data to BigQuery
- You can query this data from your dashboard

### Step 1: Identify Your Dataset

1. Go to: https://console.cloud.google.com/bigquery
2. In the left panel, find your analytics dataset
3. Note the **Dataset ID** (e.g., `analytics_489035450`)

### Step 2: Create BigQuery Client

Create `src/lib/bigquery/client.ts`:

```typescript
import { BigQuery } from '@google-cloud/bigquery';

// BigQuery client configuration
// When running on Cloud Run, it automatically uses the service account
// When running locally, it uses your gcloud CLI credentials

let bigqueryClient: BigQuery | null = null;

export function getBigQueryClient(): BigQuery {
  if (!bigqueryClient) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;

    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable not set');
    }

    bigqueryClient = new BigQuery({
      projectId,
    });
  }

  return bigqueryClient;
}

export async function queryBigQuery(sql: string): Promise<any[]> {
  const client = getBigQueryClient();
  const [rows] = await client.query({ query: sql });
  return rows;
}
```

### Step 3: Create API Route

Create `src/app/api/bigquery/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { queryBigQuery } from '@/lib/bigquery/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const results = await queryBigQuery(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('BigQuery error:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}
```

### Step 4: Local Development Setup

For local development, authenticate with gcloud:

```bash
# Login with your Google account
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Set the project
gcloud config set project YOUR_PROJECT_ID
```

---

## 7. Deployment Configuration

### File 1: Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# ============================================
# STAGE 1: Build the application
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Build the Next.js application
RUN npm run build

# ============================================
# STAGE 2: Production image
# ============================================
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set to production mode
ENV NODE_ENV=production

# Copy built assets from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port Next.js runs on
EXPOSE 3000

# Set the PORT environment variable
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
```

**Explanation:**
- **Stage 1 (builder):** Installs dependencies, builds app
- **Stage 2 (runner):** Only includes built files (smaller image)
- `EXPOSE 3000`: Tells Docker the app listens on port 3000
- `CMD`: The command to start the app

### File 2: .dockerignore

Create `.dockerignore` in project root:

```
# Dependencies (will be installed fresh)
node_modules
npm-debug.log*

# Build output (will be built fresh)
.next
out

# Environment files (secrets!)
.env
.env*.local

# Development files
.git
.gitignore
*.md
.vscode
.idea

# Test files
coverage
__tests__

# OS files
.DS_Store
Thumbs.db
```

**Why exclude these?**
- `node_modules`: Installed fresh during build
- `.env`: Contains secrets, shouldn't be in image
- `.git`: Not needed in production
- `*.md`: Documentation not needed at runtime

### File 3: Environment Variables

Create `.env.local` for local development (never commit!):

```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
BIGQUERY_DATASET=analytics_123456

# Firebase (public - safe to have fallbacks in code)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 8. Cloud Run Deployment

### Deployment Options

| Method | Best For | Auto-Deploy? |
|--------|----------|--------------|
| **Console (GUI)** | Learning, manual control | Optional |
| **gcloud CLI** | Scripting, quick deploys | No |
| **Cloud Build + GitHub** | Production, CI/CD | Yes |

### Option A: Deploy via Console (Recommended for Learning)

1. Go to: https://console.cloud.google.com/run
2. Click **"Create Service"**
3. Select **GitHub** → "Continuously deploy from a repository"
4. Select **Cloud Build**
5. Click **"Set up with Cloud Build"**
6. Connect your GitHub repository
7. Configure build:
   - Branch: `main`
   - Build Type: `Dockerfile`
   - Source: `/Dockerfile`

8. Configure service:

| Setting | Value | Notes |
|---------|-------|-------|
| Service name | `my-dashboard` | Lowercase, no spaces |
| Region | `us-central1` | Cheapest option |
| Container port | `3000` | Must match Dockerfile |
| Memory | `512 MiB` | Enough for Next.js |
| CPU | `1` | Sufficient |
| Min instances | `0` | Scale to zero (saves money!) |
| Max instances | `10` | Prevents runaway costs |
| Authentication | Allow unauthenticated | App has Firebase auth |
| Ingress | All | Allow internet traffic |

9. Add environment variables:

| Name | Value |
|------|-------|
| `GOOGLE_CLOUD_PROJECT` | `your-project-id` |
| `BIGQUERY_DATASET` | `analytics_123456` |

10. Click **Create**

### Option B: Deploy via CLI

```bash
gcloud run deploy my-dashboard \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=your-project-id,BIGQUERY_DATASET=analytics_123456"
```

---

## 9. Continuous Deployment

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   You push  │────▶│   GitHub    │────▶│ Cloud Build │────▶│  Cloud Run  │
│  to main    │     │  webhook    │     │ builds app  │     │  deploys    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │    Artifact     │
                                     │    Registry     │
                                     │ (stores image)  │
                                     └─────────────────┘
```

### Setup (Done via Console)

When you select "Continuously deploy from a repository" in Cloud Run:
1. Cloud Build creates a **trigger** on your GitHub repo
2. Every push to `main` branch triggers a build
3. Successful builds automatically deploy to Cloud Run

### View Build History

https://console.cloud.google.com/cloud-build/builds?project=YOUR_PROJECT_ID

### View Deployed Revisions

https://console.cloud.google.com/run/detail/us-central1/YOUR_SERVICE/revisions?project=YOUR_PROJECT_ID

---

## 10. Troubleshooting

### Build Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `auth/invalid-api-key` | Firebase config missing | Add fallback values in config.ts |
| `Cannot find module` | Dependency missing | Check package.json, run npm install |
| `PERMISSION_DENIED` | Missing IAM role | Request permissions from admin |
| `API not enabled` | GCP API disabled | Enable the API in console |

---

### Deep Dive: `auth/invalid-api-key` Error

This is the most common error when deploying Next.js with Firebase to Cloud Run.

#### Error Message in Cloud Build Logs

```
Error [FirebaseError]: Firebase: Error (auth/invalid-api-key).
    at a$ (.next/server/chunks/ssr/src_lib_firebase_AuthContext_tsx...)
    ...
Export encountered an error on /_not-found/page: /_not-found, exiting the build.
```

#### Root Cause

1. Next.js runs `npm run build`
2. Build process pre-renders pages (Static Site Generation)
3. Pages import Firebase → Firebase tries to initialize
4. Firebase config uses `process.env.NEXT_PUBLIC_FIREBASE_API_KEY`
5. In Cloud Build, `.env.local` doesn't exist → env var is `undefined`
6. Firebase receives `undefined` as API key → throws error
7. Build fails

#### Solution

Add fallback values using the `||` operator in `src/lib/firebase/config.ts`:

```typescript
// BEFORE (fails in Cloud Build)
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,

// AFTER (works everywhere)
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'your-actual-api-key',
```

#### Important: Push to GitHub!

If you fix this locally but don't push to GitHub, Cloud Build will still use the old code:

```bash
# 1. Make the fix locally
# 2. Commit the change
git add src/lib/firebase/config.ts
git commit -m "fix: add Firebase config fallback values for Cloud Build"

# 3. Push to GitHub
git push origin main

# 4. Cloud Build will now use the new code
```

#### Verification

After fixing, your Cloud Build logs should show:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Build completed
```

---

### Runtime Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 503 Service Unavailable | App crashing | Check Cloud Run logs |
| Firebase domain error | Domain not authorized | Add to Firebase authorized domains |
| BigQuery permission denied | Service account lacks access | Grant BigQuery Data Viewer role |

### How to Check Logs

1. Go to Cloud Run service
2. Click **Logs** tab
3. Filter by severity (Error, Warning, etc.)

Or via CLI:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=my-dashboard" --limit=50
```

---

## 11. Cost Management

### Cloud Run Pricing (2026)

| Resource | Free Tier | After Free Tier |
|----------|-----------|-----------------|
| Requests | 2 million/month | $0.40 per million |
| CPU | 180,000 vCPU-seconds | $0.000024 per vCPU-second |
| Memory | 360,000 GiB-seconds | $0.0000025 per GiB-second |

### Cost-Saving Settings

| Setting | Cost Impact |
|---------|-------------|
| Min instances = 0 | No cost when idle |
| Request-based billing | Only pay when processing |
| 512 MiB memory | Lower than default |
| us-central1 region | Generally cheapest |

### Set Up Budget Alerts

1. Go to: https://console.cloud.google.com/billing/budgets
2. Click **"Create Budget"**
3. Set amount: $50/month
4. Set alerts at: 50%, 90%, 100%
5. Enable email notifications

### Estimated Costs

| Usage Level | Monthly Cost |
|-------------|--------------|
| Development (low traffic) | $0 - $5 |
| Team testing (moderate) | $5 - $20 |
| Production (high traffic) | $20 - $100+ |

---

## 12. Security Best Practices

### What's Safe to Expose

| Type | Example | Safe? |
|------|---------|-------|
| `NEXT_PUBLIC_*` vars | Firebase API key | ✅ Yes (designed for client) |
| Firebase config | apiKey, projectId | ✅ Yes (public by design) |
| GCP Project ID | web-app-production-123 | ✅ Yes (not a secret) |

### What to NEVER Expose

| Type | Example | Why |
|------|---------|-----|
| Service Account JSON | `{"private_key": "..."}` | Full GCP access |
| Database passwords | `postgres://user:pass@` | Database access |
| API secrets | `sk-xxxx` (OpenAI, etc.) | Service access |
| `.env` files | Any secrets | Could contain anything |

### Security Checklist

```
✅ .env files in .gitignore
✅ .env files in .dockerignore
✅ No secrets in code (use env vars)
✅ Firebase rules configured
✅ BigQuery permissions are read-only
✅ Cloud Run uses minimal permissions
✅ Budget alerts configured
```

---

## Quick Reference Card

### Essential Commands

```bash
# Local development
npm run dev

# Build locally
npm run build

# Deploy to Cloud Run
gcloud run deploy SERVICE_NAME --source . --region us-central1

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit=20

# Check deployed services
gcloud run services list --region us-central1
```

### Essential URLs

| Service | URL Pattern |
|---------|-------------|
| Cloud Run Console | console.cloud.google.com/run |
| Cloud Build Logs | console.cloud.google.com/cloud-build/builds |
| Firebase Console | console.firebase.google.com |
| BigQuery Console | console.cloud.google.com/bigquery |

### Environment Variables Summary

| Variable | Where Set | Purpose |
|----------|-----------|---------|
| `GOOGLE_CLOUD_PROJECT` | Cloud Run | GCP project ID |
| `BIGQUERY_DATASET` | Cloud Run | Analytics dataset |
| `NEXT_PUBLIC_FIREBASE_*` | Code (fallbacks) | Firebase config |
| `PORT` | Automatic | Container port |
| `NODE_ENV` | Dockerfile | Production mode |

---

## Glossary

| Term | Definition |
|------|------------|
| **Cloud Run** | Google's serverless container platform |
| **Cloud Build** | CI/CD service that builds containers |
| **Artifact Registry** | Storage for container images |
| **BigQuery** | Google's data warehouse for analytics |
| **Firebase** | Google's app platform (auth, database, etc.) |
| **Dockerfile** | Instructions to build a container image |
| **Container** | Packaged application with all dependencies |
| **IAM** | Identity and Access Management (permissions) |
| **Service Account** | Non-human identity for services |
| **Cold Start** | Delay when starting a new instance |

---

## Appendix: Complete File List

Files required for Cloud Run deployment:

```
project-root/
├── Dockerfile              # Required - build instructions
├── .dockerignore           # Required - exclude files
├── next.config.ts          # Required - must have output: 'standalone'
├── package.json            # Required - dependencies
├── package-lock.json       # Required - locked versions
├── src/
│   ├── lib/
│   │   └── firebase/
│   │       └── config.ts   # Required - with fallback values!
│   └── ...
└── .env.local              # Local only - never commit!
```

---

*This guide documents the 8020REI Analytics Dashboard infrastructure.*
*Created: February 11, 2026*
