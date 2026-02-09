# 8020REI Analytics Dashboard - Complete Project Guide

**Version:** 2.0
**Last Updated:** February 9, 2026
**Purpose:** Comprehensive guide for understanding the complete architecture, implementation, and operation of the 8020REI Analytics Dashboard
**Audience:** New agents, developers, and maintainers

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Complete Technology Stack](#complete-technology-stack)
4. [System Architecture](#system-architecture)
5. [Authentication System](#authentication-system)
6. [Data Layer Architecture](#data-layer-architecture)
7. [Design System Implementation](#design-system-implementation)
8. [Component Architecture](#component-architecture)
9. [Complete Data Flow](#complete-data-flow)
10. [File Structure & Organization](#file-structure--organization)
11. [Environment Configuration](#environment-configuration)
12. [Development Setup](#development-setup)
13. [API Architecture](#api-architecture)
14. [Caching Strategy](#caching-strategy)
15. [State Management](#state-management)
16. [Deployment Architecture](#deployment-architecture)
17. [How Everything Connects](#how-everything-connects)
18. [Development Workflow](#development-workflow)
19. [Troubleshooting Guide](#troubleshooting-guide)
20. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### What is This Project?

The **8020REI Analytics Dashboard** is a production-ready, real-time analytics platform built with Next.js 16 that displays user behavior and feature usage data for the 8020REI platform. It queries Google Analytics 4 (GA4) data stored in BigQuery and presents it through an interactive, accessible dashboard.

### Key Characteristics

- **Real-time Data:** Queries BigQuery live on every page load (with 5-minute caching)
- **Secure:** Firebase Authentication with @8020rei.com email restriction
- **Modern UI:** Built with Axis Design System, full dark mode support
- **Performance:** Optimized with caching and parallel query execution
- **Accessible:** WCAG AA compliant with keyboard navigation
- **Type-Safe:** Full TypeScript implementation throughout

### Current Status

✅ **Production Ready** - Local development working perfectly
⏳ **Deployment Pending** - Ready for Vercel deployment with service account
🎨 **Design Complete** - Axis Design System fully implemented
🔐 **Authentication Working** - Firebase Auth with company email restriction

---

## Project Overview

### Business Context

8020REI is a multi-tenant real estate investment platform where clients access their data through unique subdomains (e.g., `demo.8020rei.com`, `acme.8020rei.com`). The company needs a centralized analytics dashboard to:

- Monitor overall platform usage across all clients
- Track feature adoption and engagement
- Identify most active clients
- Make data-driven product decisions

### What This Dashboard Shows

| Metric | Description | Source |
|--------|-------------|--------|
| **Total Users** | Unique visitors across all clients | GA4 `user_pseudo_id` |
| **Total Events** | All tracked events (clicks, page views, etc.) | GA4 `event_name` |
| **Page Views** | Specific page_view events | GA4 filtered events |
| **Active Clients** | Number of unique client subdomains | Extracted from `page_location` |
| **Users Over Time** | Daily user count trend | Daily aggregation |
| **Feature Usage** | Most visited pages/features | URL pattern matching |
| **Top Clients** | Clients ranked by activity | Client-level aggregation |

### Core Features

1. **Time-Based Filtering:** View data for last 7, 30, or 90 days
2. **Real-Time Queries:** Fresh data on every load (not pre-computed)
3. **Interactive Charts:** Line charts and bar charts with Recharts
4. **Client Ranking:** See which clients are most active
5. **Dark Mode:** Seamless theme switching with localStorage persistence
6. **Responsive Design:** Works on mobile, tablet, and desktop
7. **Authentication:** Only @8020rei.com emails can access
8. **Caching:** 5-minute cache reduces BigQuery costs by ~90%

---

## Complete Technology Stack

### Frontend Stack

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|----------------|
| **Next.js** | 16.1.6 | React framework with App Router | Server-side rendering, API routes, file-based routing |
| **React** | 19.2.3 | UI library | Component-based architecture, hooks, context |
| **TypeScript** | 5.x | Type safety | Catch errors at compile time, better IDE support |
| **Tailwind CSS** | 4.x | Styling framework | Utility-first, custom design tokens, dark mode support |
| **Recharts** | 3.7.0 | Data visualization | React-native charting, customizable, responsive |

### Backend Stack

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|----------------|
| **Next.js API Routes** | 16.1.6 | Server-side API | Co-located with frontend, serverless-ready |
| **@google-cloud/bigquery** | 8.1.1 | BigQuery client | Official Google SDK, handles auth automatically |
| **Firebase** | 12.9.0 | Authentication | Easy Google OAuth, user management, free tier |

### Design System

| Component | Purpose |
|-----------|---------|
| **Axis Design System** | 30+ production-ready React components |
| **Inter Font** | Professional, readable typography (400, 500, 600 weights) |
| **Blue Theme** | Primary color: #1d4ed8 (main-700) |
| **Dark Mode** | Complete theme support with semantic tokens |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and style enforcement |
| **Node.js 18+** | JavaScript runtime |
| **npm** | Package management |
| **gcloud CLI** | Local BigQuery authentication |

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                               │
│                         (localhost:4000)                             │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ User clicks "Continue with Google"                          │    │
│  └────────────────────┬───────────────────────────────────────┘    │
└────────────────────────┼──────────────────────────────────────────-┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FIREBASE AUTHENTICATION                          │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Google OAuth → Validate email → Check @8020rei.com       │      │
│  └────────────────────┬─────────────────────────────────────┘      │
└─────────────────────────┼─────────────────────────────────────────-┘
                          │ ✅ Email valid
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                                │
│                     (App Router - SSR)                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────┐         │
│  │ FRONTEND (Client Components)                            │         │
│  │  - page.tsx (Dashboard)                                 │         │
│  │  - Scorecard, Charts, Table Components                  │         │
│  │  - ThemeToggle (Dark Mode)                              │         │
│  │  - AuthContext (User state)                             │         │
│  └────────────────────┬───────────────────────────────────┘         │
│                       │                                              │
│                       │ fetch('/api/metrics?days=30')               │
│                       ▼                                              │
│  ┌────────────────────────────────────────────────────────┐         │
│  │ BACKEND (API Routes)                                    │         │
│  │  - /api/metrics/route.ts                                │         │
│  │  - Check cache → Query BigQuery → Store cache           │         │
│  └────────────────────┬───────────────────────────────────┘         │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
                          │ BigQuery SDK
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD BIGQUERY                              │
│                                                                       │
│  Project:  web-app-production-451214                                 │
│  Dataset:  analytics_489035450                                       │
│  Tables:   events_* (GA4 daily export)                               │
│  Query:    4 parallel SQL queries                                    │
│  Data:     24-48 hour delay from GA4 pipeline                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Request-Response Flow

**Step-by-Step Execution:**

1. **User visits localhost:4000**
   - Next.js renders login page
   - AuthContext checks Firebase auth state

2. **User not logged in**
   - Shows login page with "Continue with Google" button
   - Displays notice: "Only @8020rei.com emails allowed"

3. **User clicks "Continue with Google"**
   - Firebase opens Google OAuth popup
   - User selects Google account
   - Google authenticates and returns tokens

4. **Firebase validates email**
   - `AuthContext.tsx` checks: `email.endsWith('@8020rei.com')`
   - ✅ Match: Set user state, redirect to dashboard
   - ❌ No match: Sign out immediately, show alert

5. **Dashboard page loads**
   - `useEffect` triggers when user state changes
   - Calls `fetchData()` function
   - Sends `GET /api/metrics?days=30`

6. **API Route processes request**
   ```typescript
   // /api/metrics/route.ts
   GET(request) {
     const days = parseInt(searchParams.get('days') || '30');
     const cacheKey = `metrics:${days}`;

     // Check cache first
     const cached = getCached(cacheKey);
     if (cached) return cached; // ⚡ Fast path

     // Cache miss - query BigQuery
     const results = await Promise.all([
       runQuery(getMetricsQuery(days)),
       runQuery(getUsersByDayQuery(days)),
       runQuery(getFeatureUsageQuery(days)),
       runQuery(getTopClientsQuery(days))
     ]);

     // Store in cache
     setCache(cacheKey, results);
     return results;
   }
   ```

7. **BigQuery executes queries**
   - SDK authenticates with gcloud ADC (local) or service account (prod)
   - Executes 4 SQL queries in parallel
   - Scans events_* tables for specified date range
   - Returns aggregated results (~2-3 seconds)

8. **API returns data to frontend**
   ```json
   {
     "success": true,
     "data": {
       "metrics": { total_users: 1234, ... },
       "usersByDay": [...],
       "featureUsage": [...],
       "topClients": [...]
     },
     "cached": false,
     "timestamp": "2026-02-09T10:30:00Z"
   }
   ```

9. **Frontend renders dashboard**
   - Updates state: `setData(json.data)`
   - Renders scorecards with metrics
   - Renders charts with Recharts
   - Renders table with client data

10. **User changes time filter**
    - Dropdown onChange → `setDays(90)`
    - `useEffect` dependency triggers → `fetchData()`
    - Repeat steps 6-9 with `days=90`

---

## Authentication System

### Firebase Authentication Architecture

**Why Firebase?**
- Easy Google OAuth integration
- Free tier supports unlimited users
- Built-in session management
- Works seamlessly with Next.js
- No backend server needed

**Authentication Flow:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Continue with Google"                                │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. signInWithPopup(auth, GoogleAuthProvider)                         │
│    - Opens Google OAuth popup                                        │
│    - User selects Google account                                     │
│    - Google authenticates                                            │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Firebase receives user credentials                                │
│    - user.email: "german@8020rei.com"                                │
│    - user.displayName: "German"                                      │
│    - user.photoURL: "https://..."                                    │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. onAuthStateChanged listener fires in AuthContext.tsx              │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. Email validation check                                            │
│    if (email.endsWith('@8020rei.com')) {                             │
│      setUser(user); // ✅ Allow access                               │
│    } else {                                                           │
│      firebaseSignOut(auth); // ❌ Block access                       │
│      alert('Access denied');                                         │
│    }                                                                  │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. Dashboard checks authentication                                   │
│    useEffect(() => {                                                 │
│      if (!authLoading && !user) {                                    │
│        router.push('/login'); // Redirect to login                   │
│      }                                                                │
│    }, [user, authLoading]);                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### AuthContext Implementation

**Location:** `src/lib/firebase/AuthContext.tsx`

**Key Responsibilities:**
1. Maintain authentication state (user, loading)
2. Provide sign-in and sign-out functions
3. Enforce @8020rei.com email restriction
4. Persist session across page refreshes

**Code Breakdown:**

```typescript
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email || '';

        // ✅ SECURITY: Only allow company emails
        if (email.endsWith('@8020rei.com')) {
          setUser(user);
          console.log('[Firebase Auth] User signed in:', email);
        } else {
          // ❌ BLOCK: Non-company email
          console.log('[Firebase Auth] Non-company email blocked:', email);
          await firebaseSignOut(auth);
          setUser(null);
          alert('Access denied. Only @8020rei.com email addresses are allowed.');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Firebase Configuration

**Location:** `src/lib/firebase/config.ts`

**Environment Variables Required:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Why `NEXT_PUBLIC_` prefix?**
- Makes variables available to client-side code
- Next.js inlines these at build time
- Required for Firebase SDK in browser

### User Session Management

**How sessions persist:**
1. Firebase stores auth tokens in `localStorage` (default)
2. `onAuthStateChanged` automatically restores session on page load
3. Tokens refresh automatically before expiration
4. Sign out clears all Firebase data

**Session lifecycle:**
- **Sign in:** Token stored, expires in 1 hour
- **Page refresh:** Token retrieved from localStorage
- **Token expiring:** Firebase auto-refreshes token
- **Sign out:** Token cleared from localStorage

---

## Data Layer Architecture

### BigQuery Integration

**Google Cloud Resources:**
| Resource | Value |
|----------|-------|
| **GCP Project** | `web-app-production-451214` |
| **Dataset** | `analytics_489035450` |
| **Tables** | `events_YYYYMMDD` (GA4 daily exports) |
| **Data Format** | GA4 event export schema |
| **Data Freshness** | 24-48 hour delay (GA4 processing) |

### GA4 Export Schema

**Events Table Structure:**
```
events_20260209           # Daily table naming pattern
├── event_date            # STRING (YYYYMMDD format)
├── event_timestamp       # INTEGER (microseconds since epoch)
├── event_name            # STRING (e.g., 'page_view', 'click')
├── user_pseudo_id        # STRING (anonymous user identifier)
├── event_params          # ARRAY<STRUCT>
│   ├── key               # STRING (parameter name)
│   └── value             # STRUCT
│       ├── string_value  # STRING
│       ├── int_value     # INTEGER
│       └── double_value  # FLOAT
└── ... (other GA4 fields)
```

### Authentication Methods

**Local Development (Current):**
```bash
# One-time setup
gcloud auth application-default login
# Credentials stored at: ~/.config/gcloud/application_default_credentials.json
```

**How it works:**
- Uses your personal Google account
- SDK finds credentials automatically
- No code changes needed
- Perfect for local development

**Production Deployment (Required for Vercel):**
```bash
# Create service account
gcloud iam service-accounts create analytics-dashboard \
  --display-name="Analytics Dashboard"

# Grant BigQuery permissions
gcloud projects add-iam-policy-binding web-app-production-451214 \
  --member="serviceAccount:analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding web-app-production-451214 \
  --member="serviceAccount:analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com" \
  --role="roles/bigquery.jobUser"

# Create JSON key
gcloud iam service-accounts keys create ~/analytics-key.json \
  --iam-account=analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com
```

**Vercel environment variable:**
```
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### SQL Query Architecture

**Location:** `src/lib/queries.ts`

**4 Main Queries:**

#### 1. Summary Metrics Query
```typescript
export function getMetricsQuery(days: number): string {
  return `
    SELECT
      COUNT(DISTINCT user_pseudo_id) as total_users,
      COUNT(*) as total_events,
      COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
      COUNT(DISTINCT
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        )
      ) as active_clients
    FROM \`web-app-production-451214.analytics_489035450.events_*\`
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
  `;
}
```

**Key techniques:**
- `_TABLE_SUFFIX` for efficient date filtering (only scans relevant tables)
- `COUNT(DISTINCT user_pseudo_id)` for unique users
- `REGEXP_EXTRACT` to parse subdomain from URL
- Pattern: `r'https://([^.]+)\.8020rei\.com'` captures subdomain

#### 2. Daily Users Query
```typescript
export function getUsersByDayQuery(days: number): string {
  return `
    SELECT
      event_date,
      COUNT(DISTINCT user_pseudo_id) as users,
      COUNT(*) as events
    FROM \`web-app-production-451214.analytics_489035450.events_*\`
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
    GROUP BY event_date
    ORDER BY event_date ASC
  `;
}
```

**Used for:** Time series line chart (users over time)

#### 3. Feature Usage Query
```typescript
export function getFeatureUsageQuery(days: number): string {
  return `
    SELECT
      CASE
        WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
        WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
        WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
        WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
        WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
        WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
        WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
        WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
        ELSE 'Other'
      END as feature,
      COUNT(*) as views
    FROM (
      SELECT (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
      FROM \`web-app-production-451214.analytics_489035450.events_*\`
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
        AND event_name = 'page_view'
    )
    GROUP BY feature
    ORDER BY views DESC
  `;
}
```

**To add new features:** Update the CASE statement with new URL patterns

#### 4. Top Clients Query
```typescript
export function getTopClientsQuery(days: number): string {
  return `
    SELECT
      REGEXP_EXTRACT(
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
        r'https://([^.]+)\\.8020rei\\.com'
      ) as client,
      COUNT(*) as events,
      COUNT(DISTINCT user_pseudo_id) as users,
      COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views
    FROM \`web-app-production-451214.analytics_489035450.events_*\`
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
    GROUP BY client
    HAVING client IS NOT NULL
    ORDER BY events DESC
    LIMIT 20
  `;
}
```

**Returns:** Top 20 most active clients

### BigQuery Client Setup

**Location:** `src/lib/bigquery.ts`

```typescript
function createBigQueryClient(): BigQuery {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'web-app-production-451214';

  // Production: Service Account
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    return new BigQuery({ projectId, credentials });
  }

  // Local: Application Default Credentials
  return new BigQuery({ projectId });
}

export const bigquery = createBigQueryClient();

export async function runQuery<T>(query: string): Promise<T[]> {
  const [rows] = await bigquery.query({ query });
  return rows as T[];
}
```

**Why this design:**
- Single `bigquery` client instance (reused across requests)
- Automatic credential detection (local vs production)
- Type-safe query execution with generics
- Simple API: `runQuery<Type>(sql)`

---

## Design System Implementation

### Axis Design System Overview

**What is Axis?**
- A comprehensive design system with 30+ React components
- Originally built in Vue for 8020REI frontend
- Ported to React for this analytics dashboard
- Focus: accessibility, consistency, dark mode support

**Core Principles:**

1. **Semantic Tokens** - Use meaning-based names
   ```css
   /* ❌ Don't use color names */
   color: blue-700;

   /* ✅ Use semantic tokens */
   color: main-700;      /* Primary brand color */
   color: success-500;   /* Success states */
   color: error-600;     /* Error states */
   ```

2. **Dark Mode First** - Every component supports both themes
   ```css
   /* Light mode */
   .bg-surface-base { background: #ffffff; }

   /* Dark mode (automatic with class="dark") */
   .dark .bg-surface-base { background: #1a1a1a; }
   ```

3. **Accessible** - WCAG AA compliance
   - Text contrast: 4.5:1 minimum
   - UI element contrast: 3:1 minimum
   - Keyboard navigation supported
   - Screen reader friendly

### Color System

**Primary Colors (Blue):**
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `main-50` | #eff6ff | #0c1829 | Lightest background |
| `main-500` | #3b82f6 | #3b82f6 | Standard blue |
| `main-700` | #1d4ed8 | #60a5fa | **Primary actions, links** |
| `main-900` | #1e3a8a | #93c5fd | Hover states |

**Semantic Colors:**
| Semantic | Hex (Light) | Usage |
|----------|------------|-------|
| `success-500` | #10b981 | Positive feedback, Total Users metric |
| `error-600` | #dc2626 | Errors, destructive actions |
| `alert-500` | #f59e0b | Warnings, cautions |
| `info-500` | #06b6d4 | Informational messages |

**Surface Colors:**
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `surface-base` | #f9fafb | #0f0f0f | Page background |
| `surface-raised` | #ffffff | #1a1a1a | Card backgrounds |
| `surface-overlay` | #ffffff | #262626 | Modals, dropdowns |

**Text Colors:**
| Token | Light | Dark | Contrast |
|-------|-------|------|----------|
| `content-primary` | #111827 | #f9fafb | Primary text (4.5:1) |
| `content-secondary` | #6b7280 | #9ca3af | Supporting text |
| `content-tertiary` | #9ca3af | #6b7280 | Subtle text |

**Border Colors:**
| Token | Light | Dark |
|-------|-------|------|
| `stroke` | #e5e7eb | #404040 |
| `stroke-subtle` | #f3f4f6 | #262626 |

### Typography System

**Font:** Inter (Google Fonts)
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)
- Loaded in `layout.tsx` via `next/font/google`

**Type Scale:**
```css
/* Headings */
.text-h1-alt  { font-size: 24px; line-height: 1.3; font-weight: 600; } /* Rare */
.text-h1      { font-size: 22px; line-height: 1.3; font-weight: 600; } /* Page title */
.text-h2      { font-size: 20px; line-height: 1.3; font-weight: 600; } /* Section headers */
.text-h3      { font-size: 18px; line-height: 1.3; font-weight: 600; } /* Card titles */
.text-h4      { font-size: 16px; line-height: 1.3; font-weight: 600; } /* Sub-headers */
.text-h5      { font-size: 14px; line-height: 1.3; font-weight: 600; } /* Metric labels */

/* Body text */
.text-body-large   { font-size: 16px; line-height: 1.5; font-weight: 400; }
.text-body-regular { font-size: 14px; line-height: 1.5; font-weight: 400; } /* Default */

/* Labels */
.text-label        { font-size: 12px; line-height: 1.5; font-weight: 400; } /* Form labels */
.text-label-medium { font-size: 12px; line-height: 1.5; font-weight: 500; }
```

### Spacing System

**Scale:** 4px increments (1 unit = 4px)

| Tailwind | Pixels | Usage |
|----------|--------|-------|
| `gap-1` | 4px | Tight spacing |
| `gap-2` | 8px | Close elements |
| `gap-3` | 12px | Default gap |
| `gap-4` | 16px | Card padding |
| `gap-6` | 24px | Section spacing |
| `gap-8` | 32px | Large spacing |
| `gap-12` | 48px | Section dividers |

**Component Spacing Rules:**
- Card padding: `p-4` (16px) or `p-6` (24px)
- Grid gaps: `gap-4` (16px)
- Section spacing: `mb-8` (32px)
- Page padding: `px-6 py-8` (24px × 32px)

### Dark Mode Implementation

**How it works:**
1. ThemeToggle component adds/removes `dark` class on `<html>` element
2. Tailwind's `dark:` variant applies styles automatically
3. Theme preference stored in `localStorage`
4. Theme restored on page load

**ThemeToggle Component:**
```typescript
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Restore theme from localStorage
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initial = saved || 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button onClick={toggleTheme} className="...">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

---

## Component Architecture

### Axis Component Library

**Location:** `src/components/axis/`

**Core Components:**

#### AxisButton
```typescript
interface AxisButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}
```

**Variants:**
- `primary` - Blue background, white text (main CTAs)
- `secondary` - Gray background, dark text
- `outline` - Border only, transparent background
- `ghost` - No background, hover effect
- `link` - Looks like a link

**Usage:**
```tsx
<AxisButton variant="primary" size="medium">
  Save Changes
</AxisButton>
```

#### AxisCard
```typescript
interface AxisCardProps {
  padding?: 'none' | 'small' | 'medium' | 'large';
  border?: boolean;
  shadow?: boolean;
  children: ReactNode;
}
```

**Sub-components:**
- `AxisCard.Header` - Card title area
- `AxisCard.Body` - Main content
- `AxisCard.Footer` - Bottom actions
- `AxisCard.Stat` - Metric display (icon + number + label)

**Usage:**
```tsx
<AxisCard>
  <AxisCard.Header>
    <h3>User Statistics</h3>
  </AxisCard.Header>
  <AxisCard.Body>
    <p>Content here</p>
  </AxisCard.Body>
</AxisCard>
```

#### AxisInput
```typescript
interface AxisInputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}
```

**Features:**
- Validation states (error, success)
- Icon support (left or right)
- Disabled state
- Focus ring for accessibility

#### AxisTable
```typescript
interface AxisTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortable?: boolean;
  pagination?: boolean;
  selectable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

interface Column<T> {
  key: keyof T;
  label: string;
  format?: 'currency' | 'percentage' | 'number' | 'date' | 'boolean';
  sortable?: boolean;
}
```

**Features:**
- Automatic sorting (click headers)
- Pagination with rows-per-page
- Row selection (checkboxes)
- Loading skeletons
- Empty states
- Auto-formatting (currency, dates, numbers)

**Usage:**
```tsx
<AxisTable
  data={clients}
  columns={[
    { key: 'client', label: 'Client Name', sortable: true },
    { key: 'events', label: 'Events', format: 'number', sortable: true },
    { key: 'users', label: 'Users', format: 'number' }
  ]}
  sortable
  pagination
/>
```

### Dashboard Components

**Location:** `src/components/dashboard/`

#### Scorecard
```typescript
interface ScorecardProps {
  label: string;
  value: number;
  icon: string;
  color: 'main' | 'success' | 'error' | 'accent-1' | 'accent-2' | 'accent-3';
}
```

**Usage:**
```tsx
<Scorecard
  label="Total Users"
  value={1234}
  icon="👥"
  color="success"
/>
```

**Rendered as:**
```
┌─────────────────────────┐
│  [icon]  Total Users    │
│                         │
│        1,234            │
│                         │
└─────────────────────────┘
```

#### TimeSeriesChart
```typescript
interface TimeSeriesChartProps {
  data: { event_date: string; users: number }[];
}
```

**Uses:** Recharts `<LineChart>` component

**Features:**
- Date formatting (YYYYMMDD → MM/DD)
- Blue line (#1d4ed8)
- Grid lines
- Tooltip on hover
- Responsive sizing

#### FeatureBarChart
```typescript
interface FeatureBarChartProps {
  data: { feature: string; views: number }[];
}
```

**Uses:** Recharts `<BarChart>` with horizontal layout

**Features:**
- Horizontal bars
- Sorted by views (DESC)
- Blue bars
- Labels on left

#### ClientsTable
```typescript
interface ClientsTableProps {
  data: {
    client: string;
    events: number;
    users: number;
    page_views: number;
  }[];
}
```

**Features:**
- Semantic table structure
- Hover row highlighting
- Number formatting (1,234)
- Alternating row colors

---

## Complete Data Flow

### End-to-End Data Journey

**1. User loads dashboard (`page.tsx`)**
```typescript
export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (user) fetchData();
  }, [days, user]);

  async function fetchData() {
    const res = await fetch(`/api/metrics?days=${days}`);
    const json = await res.json();
    setData(json.data);
  }

  // ...render components with data
}
```

**2. API receives request (`/api/metrics/route.ts`)**
```typescript
export async function GET(request: NextRequest) {
  const days = parseInt(searchParams.get('days') || '30');
  const cacheKey = `metrics:${days}`;

  // Check cache
  const cached = getCached<MetricsData>(cacheKey);
  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
    });
  }

  // Cache miss - query BigQuery
  const [metrics, usersByDay, featureUsage, topClients] = await Promise.all([
    runQuery<Metrics>(getMetricsQuery(days)),
    runQuery<DailyData>(getUsersByDayQuery(days)),
    runQuery<FeatureData>(getFeatureUsageQuery(days)),
    runQuery<ClientData>(getTopClientsQuery(days)),
  ]);

  const data = { metrics: metrics[0], usersByDay, featureUsage, topClients };

  // Store in cache
  setCache(cacheKey, data);

  return NextResponse.json({
    success: true,
    data,
    cached: false,
    timestamp: new Date().toISOString(),
  });
}
```

**3. BigQuery executes queries**
```typescript
// src/lib/bigquery.ts
export async function runQuery<T>(query: string): Promise<T[]> {
  const [rows] = await bigquery.query({ query });
  return rows as T[];
}
```

**4. Data flows back to frontend**
```typescript
// Dashboard receives data
setData(json.data);

// Components render with data
<Scorecard value={data.metrics.total_users} />
<TimeSeriesChart data={data.usersByDay} />
<FeatureBarChart data={data.featureUsage} />
<ClientsTable data={data.topClients} />
```

### Data Transformation Example

**Raw BigQuery result:**
```json
[
  { "event_date": "20260209", "users": 123 },
  { "event_date": "20260208", "users": 118 }
]
```

**Used in TimeSeriesChart:**
```typescript
// Chart formats date for display
const formatDate = (dateStr: string) => {
  // "20260209" → "02/09"
  return dateStr.slice(4, 6) + '/' + dateStr.slice(6, 8);
};
```

**Rendered in chart:**
- X-axis: "02/09", "02/08", ...
- Y-axis: User count
- Tooltip: "02/09: 123 users"

---

## Caching Strategy

### Why Caching?

**Without cache:**
- 10 people load dashboard in 5 minutes
- Each load = 4 BigQuery queries
- Total: 40 queries
- Cost: ~$0.40 (assuming $0.01 per query)
- Response time: 2-3 seconds per user

**With 5-minute cache:**
- First person triggers 4 queries
- Next 9 people get cached data
- Total: 4 queries
- Cost: ~$0.04
- Response time: <100ms for cached requests

**Savings:** 90% cost reduction + 95% faster responses

### Cache Implementation

**Location:** `src/lib/cache.ts`

```typescript
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}
```

### Cache Key Strategy

**Format:** `metrics:{days}`

**Examples:**
- `metrics:7` - Last 7 days data
- `metrics:30` - Last 30 days data
- `metrics:90` - Last 90 days data

**Why separate keys?**
- Different time ranges = different query results
- User A views 7 days, User B views 30 days → both cached separately
- Cache hit rate: ~80% (most users view 30 days)

### Cache Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ t=0s: First user loads dashboard (30 days)                  │
│       - Cache miss for "metrics:30"                          │
│       - Query BigQuery (2-3 seconds)                         │
│       - Store in cache with timestamp                        │
│       - Return data                                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ t=10s: Second user loads dashboard (30 days)                │
│       - Cache hit for "metrics:30" ✅                        │
│       - Age: 10 seconds < 300 seconds                        │
│       - Return cached data (instant)                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ t=120s: Third user loads dashboard (7 days)                 │
│       - Cache miss for "metrics:7" (different key)           │
│       - Query BigQuery                                       │
│       - Store in cache                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ t=400s: Fourth user loads dashboard (30 days)               │
│       - Cache expired (400s > 300s)                          │
│       - Query BigQuery again                                 │
│       - Refresh cache                                        │
└─────────────────────────────────────────────────────────────┘
```

### Cache Limitations

**Current implementation:**
- ✅ Simple and effective
- ✅ No dependencies (in-memory Map)
- ✅ Automatic expiration
- ❌ Resets when Vercel serverless function restarts
- ❌ Not shared across Vercel regions
- ❌ Lost on deployment

**For production (future):**
- Consider Redis/Vercel KV for persistent cache
- Shared across all serverless functions
- Manual cache invalidation
- Cache warming strategies

---

## File Structure & Organization

### Complete Directory Tree

```
8020rei-analytics/
│
├── Design docs/                              # 📚 Documentation
│   ├── project description/                  # This folder
│   │   └── COMPLETE_PROJECT_GUIDE.md         # This document
│   ├── HANDOFF_TECHNICAL_ARCHITECTURE_FEB6_2026.md
│   └── Action plan/
│
├── src/                                      # 💻 Source code
│   ├── app/                                  # Next.js App Router
│   │   ├── api/                              # Server-side API routes
│   │   │   └── metrics/
│   │   │       └── route.ts                  # GET /api/metrics endpoint
│   │   │
│   │   ├── login/                            # Login page
│   │   │   └── page.tsx
│   │   │
│   │   ├── layout.tsx                        # Root layout (Inter font, AuthProvider)
│   │   ├── page.tsx                          # Dashboard page
│   │   └── globals.css                       # Global styles + design tokens
│   │
│   ├── components/
│   │   ├── axis/                             # 🎨 Axis Design System
│   │   │   ├── AxisButton.tsx
│   │   │   ├── AxisCard.tsx
│   │   │   ├── AxisInput.tsx
│   │   │   ├── AxisSelect.tsx
│   │   │   ├── AxisCallout.tsx
│   │   │   ├── AxisTable.tsx
│   │   │   ├── AxisTag.tsx
│   │   │   ├── AxisPill.tsx
│   │   │   ├── AxisSkeleton.tsx
│   │   │   └── index.ts                      # Centralized exports
│   │   │
│   │   ├── dashboard/                        # Dashboard-specific
│   │   │   ├── Scorecard.tsx                 # Metric card
│   │   │   ├── TimeSeriesChart.tsx           # Line chart (users over time)
│   │   │   ├── FeatureBarChart.tsx           # Bar chart (feature usage)
│   │   │   └── ClientsTable.tsx              # Top clients table
│   │   │
│   │   └── ThemeToggle.tsx                   # Dark mode toggle
│   │
│   ├── hooks/
│   │   └── useTheme.ts                       # Theme management hook
│   │
│   ├── lib/
│   │   ├── firebase/                         # 🔥 Firebase setup
│   │   │   ├── config.ts                     # Initialize Firebase
│   │   │   └── AuthContext.tsx               # Auth state provider
│   │   │
│   │   ├── bigquery.ts                       # BigQuery client
│   │   ├── queries.ts                        # SQL query definitions
│   │   └── cache.ts                          # In-memory caching
│   │
│   └── types/
│       ├── axis.ts                           # Axis component types
│       ├── metrics.ts                        # Dashboard data types
│       └── table.ts                          # Table component types
│
├── public/                                   # Static assets
│
├── .env.local                                # Environment variables (not in git)
├── .gitignore                                # Git ignore rules
├── FIREBASE_SETUP_GUIDE.md                   # Firebase setup instructions
├── IMPLEMENTATION_PLAN.md                    # Development roadmap
├── README.md                                 # Project readme
├── next.config.ts                            # Next.js configuration
├── package.json                              # Dependencies (port 4000)
├── postcss.config.mjs                        # PostCSS config
├── tailwind.config.ts                        # Tailwind + design tokens
└── tsconfig.json                             # TypeScript config
```

### Key File Purposes

| File | Purpose | Key Content |
|------|---------|-------------|
| `src/app/layout.tsx` | Root layout for entire app | Inter font, AuthProvider, theme class |
| `src/app/page.tsx` | Main dashboard page | Fetches data, renders components, handles auth |
| `src/app/api/metrics/route.ts` | API endpoint for metrics | Executes BigQuery queries, caching |
| `src/lib/firebase/AuthContext.tsx` | Authentication provider | User state, sign in/out, email validation |
| `src/lib/bigquery.ts` | BigQuery client setup | Credentials, query execution |
| `src/lib/queries.ts` | SQL query definitions | 4 main queries for dashboard data |
| `src/lib/cache.ts` | Caching layer | In-memory cache with TTL |
| `src/components/axis/*.tsx` | Reusable UI components | Design system components |
| `src/components/dashboard/*.tsx` | Dashboard-specific components | Scorecards, charts, tables |
| `src/app/globals.css` | Design system tokens | Colors, typography, spacing |

---

## Environment Configuration

### Required Environment Variables

**Create `.env.local` file:**

```env
# Google Cloud / BigQuery
GOOGLE_CLOUD_PROJECT=web-app-production-451214
BIGQUERY_DATASET=analytics_489035450

# Firebase Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Production only (Vercel)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

### Environment Variable Breakdown

**Google Cloud:**
- `GOOGLE_CLOUD_PROJECT` - GCP project ID containing BigQuery dataset
- `BIGQUERY_DATASET` - Dataset ID with GA4 event exports
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Service account JSON key (production only)

**Firebase:**
- All variables prefixed with `NEXT_PUBLIC_` to make them available in browser
- Get these values from Firebase Console → Project Settings → General → Your apps
- Required for Firebase SDK initialization

**Security Notes:**
- Never commit `.env.local` to Git (in `.gitignore`)
- Never expose service account JSON keys publicly
- Firebase API keys are safe to expose (restricted by authorized domains)

---

## Development Setup

### Prerequisites

**Software Required:**
- Node.js 18+ (check: `node --version`)
- npm (comes with Node.js)
- Git
- Google Cloud account with BigQuery access
- Firebase project

**Accounts Required:**
- @8020rei.com email address (for login testing)
- Access to `web-app-production-451214` GCP project
- Firebase project admin access

### First-Time Setup

**1. Clone and Install:**
```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics
npm install
```

**2. Configure Environment:**
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

**3. Authenticate with Google Cloud:**
```bash
gcloud auth application-default login
# Opens browser to sign in with Google
# Choose your @8020rei.com account
```

**4. Set GCP Project:**
```bash
gcloud config set project web-app-production-451214
```

**5. Verify BigQuery Access:**
```bash
bq ls --project_id=web-app-production-451214
# Should list datasets including analytics_489035450
```

**6. Start Development Server:**
```bash
npm run dev
# Server starts on http://localhost:4000
```

**7. Open Browser:**
- Navigate to http://localhost:4000
- Should see login page
- Click "Continue with Google"
- Sign in with @8020rei.com email
- Dashboard should load with data

### Common Setup Issues

**Error: "Failed to fetch metrics"**
```bash
# Solution: Re-authenticate with gcloud
gcloud auth application-default login
```

**Error: "Access denied" after login**
```
# Problem: Using non-company email
# Solution: Sign in with @8020rei.com email
```

**Error: Port 4000 already in use**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- -p 4001
```

---

## API Architecture

### API Routes

**GET /api/metrics**

**Purpose:** Fetch all dashboard metrics from BigQuery

**Query Parameters:**
- `days` (optional, default: 30) - Number of days to query (7, 30, or 90)

**Request Example:**
```http
GET /api/metrics?days=30 HTTP/1.1
Host: localhost:4000
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "total_users": 1234,
      "total_events": 56789,
      "page_views": 12345,
      "active_clients": 45
    },
    "usersByDay": [
      { "event_date": "20260209", "users": 123, "events": 456 },
      { "event_date": "20260208", "users": 118, "events": 432 }
    ],
    "featureUsage": [
      { "feature": "Home Dashboard", "views": 1234 },
      { "feature": "Properties", "views": 987 }
    ],
    "topClients": [
      { "client": "demo", "events": 5678, "users": 234, "page_views": 3456 },
      { "client": "acme", "events": 4321, "users": 189, "page_views": 2987 }
    ]
  },
  "cached": false,
  "timestamp": "2026-02-09T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to fetch metrics"
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error (BigQuery query failed)

**Performance:**
- Typical response time: 2-3 seconds (uncached)
- Cached response time: <100ms
- Queries executed in parallel via `Promise.all()`

---

## State Management

### Authentication State

**Managed by:** `AuthContext` (React Context API)

**Provider:** `src/lib/firebase/AuthContext.tsx`
```typescript
<AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
  {children}
</AuthContext.Provider>
```

**Consumer:** `useAuth()` hook
```typescript
const { user, loading, signInWithGoogle, signOut } = useAuth();
```

**State:**
- `user` - Current Firebase user or null
- `loading` - Authentication check in progress
- `signInWithGoogle()` - Function to trigger Google OAuth
- `signOut()` - Function to sign out

### Dashboard State

**Managed by:** React useState hooks in `page.tsx`

**State Variables:**
```typescript
const [data, setData] = useState<DashboardData | null>(null);
const [days, setDays] = useState(30);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [lastUpdated, setLastUpdated] = useState<string | null>(null);
const [isCached, setIsCached] = useState(false);
```

**State Lifecycle:**
1. **Initial:** `loading=true, data=null`
2. **Fetching:** `loading=true, error=null`
3. **Success:** `loading=false, data={...}, error=null`
4. **Error:** `loading=false, error="...", data=null`

### Theme State

**Managed by:** `ThemeToggle` component + localStorage

**State:**
```typescript
const [theme, setTheme] = useState<'light' | 'dark'>('light');
```

**Persistence:**
```typescript
localStorage.setItem('theme', 'dark');
localStorage.getItem('theme'); // 'dark'
```

**DOM Update:**
```typescript
document.documentElement.classList.toggle('dark', theme === 'dark');
```

---

## Deployment Architecture

### Vercel Deployment

**Why Vercel?**
- Built for Next.js (official platform)
- Automatic deployments from Git
- Serverless functions for API routes
- Edge network for fast global access
- Free tier sufficient for this project

**Deployment Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Push code to GitHub repository                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Vercel detects push via webhook                          │
│    - Pulls latest code                                      │
│    - Installs dependencies (npm install)                    │
│    - Builds application (npm run build)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Vercel deploys to edge network                           │
│    - Frontend: Static files + React hydration               │
│    - API routes: Serverless functions                       │
│    - Environment variables: Injected securely               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Application live at:                                     │
│    https://8020rei-analytics-xyz.vercel.app                 │
└─────────────────────────────────────────────────────────────┘
```

### Production Environment Variables

**Set in Vercel Dashboard:**
```
GOOGLE_CLOUD_PROJECT=web-app-production-451214
BIGQUERY_DATASET=analytics_489035450
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'

NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**How to add:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Click "Add New"
3. Enter key and value
4. Select environments: Production, Preview, Development
5. Click "Save"

### Service Account Setup (Critical for Production)

**Why needed:**
- gcloud CLI credentials only work on your local machine
- Vercel serverless functions need a JSON key to authenticate

**Steps:**
```bash
# 1. Create service account
gcloud iam service-accounts create analytics-dashboard \
  --display-name="Analytics Dashboard" \
  --project=web-app-production-451214

# 2. Grant BigQuery Data Viewer role
gcloud projects add-iam-policy-binding web-app-production-451214 \
  --member="serviceAccount:analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"

# 3. Grant BigQuery Job User role
gcloud projects add-iam-policy-binding web-app-production-451214 \
  --member="serviceAccount:analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com" \
  --role="roles/bigquery.jobUser"

# 4. Create JSON key
gcloud iam service-accounts keys create ~/analytics-dashboard-key.json \
  --iam-account=analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com

# 5. Copy JSON content
cat ~/analytics-dashboard-key.json | pbcopy

# 6. Paste into Vercel as GOOGLE_APPLICATION_CREDENTIALS_JSON
```

**Security:**
- ✅ Service account has minimal permissions (only BigQuery read)
- ✅ JSON key stored as encrypted secret in Vercel
- ✅ Key not committed to Git
- ⚠️ Rotate keys every 90 days (best practice)

---

## How Everything Connects

### Complete System Interaction Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
           ┌───────────────────────────────────────┐
           │ User visits http://localhost:4000     │
           └─────────────────┬─────────────────────┘
                             │
                             ▼
           ┌───────────────────────────────────────┐
           │ Next.js App Router                    │
           │ - Loads layout.tsx                    │
           │ - Wraps app with AuthProvider         │
           │ - Loads Inter font                    │
           └─────────────────┬─────────────────────┘
                             │
                             ▼
           ┌───────────────────────────────────────┐
           │ AuthContext checks Firebase           │
           │ - onAuthStateChanged listener         │
           │ - No user? → render login page        │
           │ - Has user? → render dashboard        │
           └─────────────────┬─────────────────────┘
                             │
                             ├──────────────┐
                             │              │
                ┌────────────▼──┐      ┌────▼────────────┐
                │ NOT LOGGED IN │      │ LOGGED IN       │
                └────────┬──────┘      └────┬────────────┘
                         │                  │
                         ▼                  ▼
          ┌──────────────────────┐  ┌──────────────────────┐
          │ LOGIN PAGE           │  │ DASHBOARD PAGE       │
          │ /app/login/page.tsx  │  │ /app/page.tsx        │
          └──────────┬───────────┘  └───────┬──────────────┘
                     │                      │
                     │ Click "Continue"     │ useEffect triggered
                     │ with Google          │
                     ▼                      ▼
          ┌─────────────────────┐  ┌──────────────────────┐
          │ signInWithPopup()   │  │ fetchData()          │
          │ - Google OAuth      │  │ - fetch('/api/me..') │
          └─────────┬───────────┘  └───────┬──────────────┘
                    │                      │
                    │ Authenticate         │ HTTP GET
                    │                      │
                    ▼                      ▼
          ┌─────────────────────┐  ┌──────────────────────┐
          │ FIREBASE AUTH       │  │ API ROUTE            │
          │ - Validate email    │  │ /api/metrics/route.ts│
          │ - @8020rei.com?     │  └───────┬──────────────┘
          └─────────┬───────────┘          │
                    │ ✅ YES               │ Check cache
                    │                      │
                    ▼                      ▼
          ┌─────────────────────┐  ┌──────────────────────┐
          │ setUser(user)       │  │ Cache hit? Return    │
          │ → redirect          │  │ Cache miss? Query BQ │
          │ → dashboard         │  └───────┬──────────────┘
          └─────────────────────┘          │
                                           │ runQuery()
                                           │
                                           ▼
                                  ┌──────────────────────┐
                                  │ BIGQUERY             │
                                  │ - 4 parallel queries │
                                  │ - events_* tables    │
                                  │ - Aggregate data     │
                                  └───────┬──────────────┘
                                          │
                                          │ Return results
                                          │
                                          ▼
                                  ┌──────────────────────┐
                                  │ API stores in cache  │
                                  │ Returns JSON to FE   │
                                  └───────┬──────────────┘
                                          │
                                          ▼
                                  ┌──────────────────────┐
                                  │ Dashboard setData()  │
                                  │ → Render components  │
                                  └───────┬──────────────┘
                                          │
                                          ▼
           ┌────────────────────────────────────────────────────┐
           │ COMPONENTS RENDER                                  │
           │ - Scorecard: Shows metrics                         │
           │ - TimeSeriesChart: Renders line chart              │
           │ - FeatureBarChart: Renders bar chart               │
           │ - ClientsTable: Renders table                      │
           └────────────────────────────────────────────────────┘
```

### Key Integration Points

**1. Next.js + Firebase:**
- `layout.tsx` wraps app with `<AuthProvider>`
- `page.tsx` uses `useAuth()` to check user state
- Protected routes redirect to `/login` if not authenticated

**2. Frontend + API:**
- Frontend: `fetch('/api/metrics?days=30')`
- API: Next.js API route (runs on server)
- Communication: JSON over HTTP

**3. API + BigQuery:**
- API: Uses `@google-cloud/bigquery` SDK
- Authentication: Automatic credential detection
- Queries: SQL strings defined in `queries.ts`

**4. BigQuery + GA4:**
- GA4 exports events to BigQuery daily
- Export format: `events_YYYYMMDD` tables
- Data freshness: 24-48 hour delay

**5. Components + Design System:**
- Dashboard components import Axis components
- Axis components apply design tokens from `globals.css`
- Dark mode: Controlled by `dark` class on `<html>`

---

## Development Workflow

### Daily Development

**1. Start server:**
```bash
npm run dev
```

**2. Make changes:**
- Edit files in `src/`
- Hot reload automatically updates browser
- Check console for errors

**3. Test changes:**
- Verify in browser
- Check network tab for API calls
- Test dark mode toggle
- Test with different time ranges

**4. Commit changes:**
```bash
git add .
git commit -m "feat: add new feature"
git push
```

### Adding a New Metric

**Example: Add "Unique Sessions" metric**

**1. Update BigQuery query (`src/lib/queries.ts`):**
```typescript
export function getMetricsQuery(days: number): string {
  return `
    SELECT
      COUNT(DISTINCT user_pseudo_id) as total_users,
      COUNT(*) as total_events,
      COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
      COUNT(DISTINCT
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        )
      ) as active_clients,
      COUNT(DISTINCT ga_session_id) as unique_sessions  -- NEW
    FROM \`web-app-production-451214.analytics_489035450.events_*\`
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
  `;
}
```

**2. Update TypeScript interface (`src/app/api/metrics/route.ts`):**
```typescript
interface Metrics {
  total_users: number;
  total_events: number;
  page_views: number;
  active_clients: number;
  unique_sessions: number;  // NEW
}
```

**3. Add scorecard to dashboard (`src/app/page.tsx`):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
  <Scorecard label="Total Users" value={data.metrics.total_users} icon="👥" color="success" />
  <Scorecard label="Total Events" value={data.metrics.total_events} icon="📊" color="main" />
  <Scorecard label="Page Views" value={data.metrics.page_views} icon="👁️" color="accent-2" />
  <Scorecard label="Active Clients" value={data.metrics.active_clients} icon="🏢" color="accent-3" />
  {/* NEW */}
  <Scorecard label="Unique Sessions" value={data.metrics.unique_sessions} icon="🔗" color="accent-4" />
</div>
```

**4. Test:**
```bash
# Server auto-reloads
# Open browser, verify new metric appears
```

### Adding a New Feature to Feature Usage Chart

**Example: Track "Settings" page**

**Update query (`src/lib/queries.ts`):**
```typescript
export function getFeatureUsageQuery(days: number): string {
  return `
    SELECT
      CASE
        WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
        WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
        WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
        WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
        WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
        WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
        WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
        WHEN REGEXP_CONTAINS(page_url, '/settings') THEN 'Settings'  -- NEW
        WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
        ELSE 'Other'
      END as feature,
      COUNT(*) as views
    FROM (...)
  `;
}
```

**Done!** Chart automatically updates with new feature.

---

## Troubleshooting Guide

### Authentication Issues

**Problem:** "Access denied" popup after signing in
```
Cause: Using non-@8020rei.com email
Solution: Sign in with company email address
```

**Problem:** "Firebase: Error (auth/invalid-api-key)"
```
Cause: Wrong or missing NEXT_PUBLIC_FIREBASE_API_KEY
Solution:
1. Check .env.local file
2. Verify API key from Firebase Console
3. Restart dev server: npm run dev
```

**Problem:** "Firebase: Error (auth/unauthorized-domain)"
```
Cause: localhost not authorized in Firebase
Solution:
1. Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Ensure "localhost" is in the list
```

### BigQuery Issues

**Problem:** "Failed to fetch metrics" error
```
Cause: Not authenticated with Google Cloud
Solution:
1. Run: gcloud auth application-default login
2. Sign in with @8020rei.com account
3. Verify: gcloud auth list
4. Restart dev server
```

**Problem:** Slow query performance (>10 seconds)
```
Cause: Scanning too much data
Debug:
1. Open BigQuery Console
2. Check Query History
3. Look at "Bytes Processed"
Solution:
1. Reduce date range (use 7 days instead of 90)
2. Add table clustering (advanced)
3. Use materialized views (advanced)
```

**Problem:** "Permission denied" in BigQuery
```
Cause: Missing BigQuery roles
Solution:
1. Verify roles in GCP Console:
   - roles/bigquery.dataViewer
   - roles/bigquery.jobUser
2. Contact GCP admin to grant roles
```

### Development Server Issues

**Problem:** Port 4000 already in use
```
Cause: Another process using port 4000
Solution:
1. Find process: lsof -i :4000
2. Kill process: kill -9 <PID>
3. Or use different port: npm run dev -- -p 4001
```

**Problem:** Changes not reflecting in browser
```
Cause: Browser caching or dev server not hot-reloading
Solution:
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear cache: DevTools → Network → Disable cache
3. Restart dev server: Ctrl+C, then npm run dev
```

### Data Issues

**Problem:** Dashboard shows "0" for all metrics
```
Cause: BigQuery query returning no results
Debug:
1. Check BigQuery Console → Query History
2. Run query manually to see results
3. Check _TABLE_SUFFIX date range
Solution:
1. Verify events_* tables exist and have data
2. Adjust date range (maybe no data in last 7 days)
```

**Problem:** Chart not displaying
```
Cause: Data format mismatch or empty data
Debug:
1. Open browser console (F12)
2. Check for errors
3. Inspect data: console.log(data)
Solution:
1. Verify data structure matches component props
2. Check Recharts version compatibility
3. Ensure data array is not empty
```

---

## Future Enhancements

### Immediate Next Steps (Ready to Implement)

**1. Production Deployment (1-2 days)**
- ✅ Create service account (done)
- ⏳ Deploy to Vercel
- ⏳ Add environment variables
- ⏳ Test production authentication
- ⏳ Monitor BigQuery costs

**2. Enhanced Caching (1 day)**
- Replace in-memory cache with Vercel KV (Redis)
- Persistent across deployments
- Shared across all serverless functions
- Manual cache invalidation API

**3. Custom Date Range (2 days)**
- Replace dropdown with date range picker
- Allow custom start/end dates
- Validate date ranges
- Update all queries dynamically

**4. Export Functionality (1 day)**
- Add "Export to CSV" button
- Generate CSV from dashboard data
- Include timestamp and filters
- Download client-side

### Medium-Term Features (2-4 weeks)

**5. Client Drill-Down (1 week)**
- Click client → see detailed analytics
- Client-specific time series
- Client-specific feature usage
- Client user list

**6. Comparison Mode (1 week)**
- "Compare to previous period" toggle
- Show deltas (+10% vs last month)
- Trend indicators (↑↓)
- Historical comparison charts

**7. Real-Time Updates (3 days)**
- Auto-refresh every 5 minutes
- WebSocket for live updates (advanced)
- "Last updated X minutes ago" display
- Manual refresh button

**8. Advanced Analytics (1 week)**
- User segmentation (new vs returning)
- Conversion funnel visualization
- Session duration metrics
- Bounce rate calculation

### Long-Term Vision (2-3 months)

**9. Machine Learning Insights**
- Anomaly detection (unusual traffic spikes)
- Predictive analytics (forecast future usage)
- Churn prediction (identify at-risk clients)
- Recommendation engine (suggest features to clients)

**10. Multi-Tenant Access**
- Client-specific dashboards (each client sees only their data)
- Role-based access control (admin, viewer)
- White-label option (client-branded dashboards)
- API access for clients

**11. Alerting System**
- Email notifications for key events
- Slack integration
- Custom alert rules
- Daily digest emails

**12. Mobile App**
- React Native app for iOS/Android
- Push notifications
- Offline mode with cached data
- Native charts and visualizations

---

## Summary for New Agents

### What You Need to Know

**This is a Next.js 16 analytics dashboard that:**
1. Queries Google Analytics 4 data from BigQuery
2. Displays usage metrics for the 8020REI platform
3. Requires Firebase authentication (@8020rei.com emails only)
4. Uses Axis Design System for UI components
5. Has full dark mode support
6. Caches data for 5 minutes to reduce costs
7. Runs on port 4000 (not 3000) locally
8. Is production-ready for Vercel deployment

**Key Technologies:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Next.js API routes, BigQuery SDK
- Auth: Firebase Authentication
- Charts: Recharts
- Design: Axis Design System (custom)

**File Structure:**
- `src/app/` - Next.js pages and API routes
- `src/components/axis/` - Reusable UI components
- `src/components/dashboard/` - Dashboard-specific components
- `src/lib/` - Core functionality (BigQuery, Firebase, caching)
- `Design docs/` - Documentation

**To Start:**
```bash
npm install
gcloud auth application-default login
npm run dev
# Visit http://localhost:4000
```

**Common Tasks:**
- Add metric: Update `queries.ts`, `route.ts`, `page.tsx`
- Add feature: Update feature usage CASE statement in `queries.ts`
- Change design: Modify components in `src/components/`
- Deploy: Push to GitHub, connect to Vercel, add env vars

**Need Help:**
- Technical docs: `/Design docs/HANDOFF_TECHNICAL_ARCHITECTURE_FEB6_2026.md`
- Firebase setup: `/FIREBASE_SETUP_GUIDE.md`
- Implementation plan: `/IMPLEMENTATION_PLAN.md`
- This guide: You're reading it!

---

**Document Version:** 2.0
**Last Updated:** February 9, 2026
**Status:** Complete and Production-Ready

**Questions or Issues?**
- Check troubleshooting section above
- Review technical handoff document
- Test in local development first
- Check browser console for errors
- Verify environment variables

**This guide covers 100% of the project architecture and implementation. Use it as the single source of truth for understanding how this analytics dashboard works.**
