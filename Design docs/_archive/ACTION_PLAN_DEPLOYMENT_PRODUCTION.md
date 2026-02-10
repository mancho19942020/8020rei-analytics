# 8020REI Analytics Hub — Production Deployment Action Plan

**Project:** 8020REI Metrics Hub
**Date:** February 9, 2026
**Status:** Steps 0-5 completed ✅ | Steps 6-9 pending ⏳
**Executor:** Claude (code agent)
**Project Directory:** `/Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics`
**Local Port:** `localhost:4000`

---

## Current State — What's Already Done

| Step | Description | Status |
|------|-------------|--------|
| 0 | Understand the architecture | ✅ Completed |
| 1 | Understand what a Service Account is | ✅ Completed |
| 2 | Create Service Account in Google Cloud | ✅ Completed (`analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com`) |
| 3 | Assign permissions: BigQuery Data Viewer + Job User | ✅ Completed |
| 4 | Generate JSON key | ✅ Completed (stored at `/Users/work/analytics-dashboard-key.json`) |
| 5 | Verify the key works | ✅ Completed (test query successful) |

---

## Key Technical Information

```
GCP Project ID:          web-app-production-451214
BigQuery Dataset:        analytics_489035450
GA4 Property ID:         489035450
Table Pattern:           events_* (GA4 daily exports)
Service Account Email:   analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com
Service Account Key:     /Users/work/analytics-dashboard-key.json
Project Directory:       /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics
Framework:               Next.js 16.1.6 + TypeScript + Tailwind CSS 4.x + Recharts 3.7.0
Port:                    4000
```

---

## PHASE 1: Prepare Code for Production (Step 6)

> **Goal:** Modify existing code so it works both locally (with gcloud CLI) and on Vercel (with Service Account JSON).

### Task 1.1 — Modify `src/lib/bigquery.ts`

**Why:** The current file creates the BigQuery client without explicit credentials, relying on gcloud CLI. We need it to also accept credentials from an environment variable (for Vercel).

**File:** `src/lib/bigquery.ts`

**New content:**

```typescript
import { BigQuery } from '@google-cloud/bigquery';

/**
 * Creates the BigQuery client with the correct authentication strategy:
 * - On Vercel/production: uses GOOGLE_APPLICATION_CREDENTIALS_JSON (Service Account JSON)
 * - On local: uses gcloud CLI credentials (Application Default Credentials)
 */
function createBigQueryClient(): BigQuery {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;

  // Production: Service Account credentials from environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    );
    return new BigQuery({ projectId, credentials });
  }

  // Local: uses Application Default Credentials (gcloud CLI)
  return new BigQuery({ projectId });
}

export const bigquery = createBigQueryClient();
```

**Verification:** After saving, run `npm run dev` and confirm `localhost:4000` still loads data correctly (nothing should break locally).

---

### Task 1.2 — Add caching layer

**Why:** Each dashboard load executes 4 BigQuery queries. Without cache, 10 people loading the dashboard in 5 minutes = 40 queries. With a 5-minute cache = only 4 queries. This reduces costs and improves speed.

**Create new file:** `src/lib/cache.ts`

```typescript
/**
 * In-memory cache with TTL (Time To Live).
 * Stores query results for 5 minutes to reduce
 * BigQuery queries and associated costs.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

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

export function clearCache(): void {
  cache.clear();
}
```

---

### Task 1.3 — Update API Route with cache and timestamp

**Why:** Integrate the caching layer and return a "last updated" timestamp so the frontend can show when the data was fetched.

**File:** `src/app/api/metrics/route.ts`

**Changes to apply:** Add cache imports and wrap existing logic with cache check.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { bigquery } from '@/lib/bigquery';
import { getCached, setCache } from '@/lib/cache';
import {
  getMetricsQuery,
  getUsersByDayQuery,
  getFeatureUsageQuery,
  getTopClientsQuery,
} from '@/lib/queries';

// Helper to execute queries
async function runQuery<T>(query: string): Promise<T[]> {
  const [rows] = await bigquery.query({ query });
  return rows as T[];
}

// Interfaces (keep existing ones or add if missing)
interface Metrics {
  total_users: number;
  total_events: number;
  page_views: number;
  active_clients: number;
}

interface DailyData {
  event_date: string;
  users: number;
  events: number;
}

interface FeatureData {
  feature: string;
  views: number;
}

interface ClientData {
  client: string;
  events: number;
  users: number;
  page_views: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');

  // Check cache first
  const cacheKey = `metrics:${days}`;
  const cached = getCached<{
    metrics: Metrics;
    usersByDay: DailyData[];
    featureUsage: FeatureData[];
    topClients: ClientData[];
  }>(cacheKey);

  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Execute 4 queries in parallel
    const [metrics, usersByDay, featureUsage, topClients] = await Promise.all([
      runQuery<Metrics>(getMetricsQuery(days)),
      runQuery<DailyData>(getUsersByDayQuery(days)),
      runQuery<FeatureData>(getFeatureUsageQuery(days)),
      runQuery<ClientData>(getTopClientsQuery(days)),
    ]);

    const data = {
      metrics: metrics[0],
      usersByDay,
      featureUsage,
      topClients,
    };

    // Store in cache
    setCache(cacheKey, data);

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('BigQuery error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
```

> **Note for Claude:** This file may already have part of this logic. Read the existing file first (`cat src/app/api/metrics/route.ts`) and do an intelligent merge — don't blindly overwrite.

---

### Task 1.4 — Add "last updated" timestamp to the frontend

**Why:** So dashboard users know when the data was fetched and whether it's coming from cache.

**File:** `src/app/page.tsx`

**Changes to apply:**

1. Add `lastUpdated` and `isCached` state variables
2. Update `fetchData()` to extract timestamp and cached from the response
3. Display the timestamp in the dashboard header

**Add these states:**

```typescript
const [lastUpdated, setLastUpdated] = useState<string | null>(null);
const [isCached, setIsCached] = useState(false);
```

**In the fetchData function, update to capture the new fields:**

```typescript
if (json.success) {
  setData(json.data);
  setLastUpdated(json.timestamp || new Date().toISOString());
  setIsCached(json.cached || false);
}
```

**In the header JSX, add below the title:**

```tsx
{lastUpdated && (
  <span className="text-xs text-gray-400 ml-2">
    Updated: {new Date(lastUpdated).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    })}
    {isCached && ' (cached)'}
  </span>
)}
```

> **Note for Claude:** Read `page.tsx` first to understand the current structure and make minimal necessary changes — don't rewrite the entire file.

---

### Task 1.5 — Ensure .gitignore is secure

**Why:** Prevent keys, credentials, or sensitive files from being pushed to GitHub.

**File:** `.gitignore`

**Ensure it contains these lines (add any that are missing):**

```
# Environment variables
.env.local
.env.production
.env

# Service account keys - NEVER push
*-key.json
*credentials*.json

# Dependencies
node_modules/

# Build output
.next/

# macOS
.DS_Store

# Turbopack
.turbo/
```

---

### Task 1.6 — Verify everything works locally

**Verification commands:**

```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics

# Install dependencies just in case
npm install

# Start dev server
npm run dev
```

**Verification checklist at `localhost:4000`:**

- [ ] Dashboard loads without errors
- [ ] 4 metrics display numbers
- [ ] Users over time chart works
- [ ] Feature usage chart works
- [ ] Top clients table works
- [ ] Time filter works (7/30/90 days)
- [ ] No errors in browser console

---

## PHASE 2: Push to GitHub (Step 7)

> **Goal:** Create a private GitHub repository and push the code.

### Task 2.1 — Initialize Git and make first commit

```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics

# If git is not initialized
git init

# Add all files (respecting .gitignore)
git add .

# Verify NO sensitive files are included
git status

# Create first commit
git commit -m "8020REI Analytics Dashboard - production ready

- Next.js 16 + TypeScript + Tailwind + Recharts
- BigQuery integration with Service Account support
- 4 metrics: Total Users, Events, Page Views, Active Clients
- Time series chart, feature usage chart, top clients table
- Time filter (7/30/90 days)
- In-memory caching (5 min TTL)
- Last updated timestamp
- 8020 Design System (blue theme)
- Responsive design"
```

### Task 2.2 — Create GitHub repository and push

**Option A — With GitHub CLI:**

```bash
gh repo create 8020rei-analytics --private --source=. --remote=origin
git push -u origin main
```

**Option B — Manual (if gh CLI not available):**

1. Create repo at https://github.com/new → name: `8020rei-analytics` → Private
2. Run:

```bash
git remote add origin https://github.com/USERNAME/8020rei-analytics.git
git branch -M main
git push -u origin main
```

### Task 2.3 — Verify

```bash
# Confirm push was successful
git log --oneline -1
git remote -v
```

---

## PHASE 3: Deploy to Vercel (Step 8)

> **Goal:** Connect Vercel to GitHub, configure environment variables, and deploy.

### Task 3.1 — Connect Vercel (manual, requires UI)

**Instructions for the user:**

1. Go to https://vercel.com → Sign in with GitHub
2. Click "Add New..." → "Project"
3. Import repository `8020rei-analytics`
4. Vercel auto-detects Next.js

### Task 3.2 — Configure environment variables in Vercel

**Three required variables:**

| Variable | Value |
|----------|-------|
| `GOOGLE_CLOUD_PROJECT` | `web-app-production-451214` |
| `BIGQUERY_DATASET` | `analytics_489035450` |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | *entire content of `/Users/work/analytics-dashboard-key.json`* |

**To copy the JSON key to clipboard:**

```bash
cat /Users/work/analytics-dashboard-key.json | pbcopy
```

Then paste as the value of `GOOGLE_APPLICATION_CREDENTIALS_JSON` in Vercel.

### Task 3.3 — Deploy

1. Click "Deploy" in Vercel
2. Wait 2-3 minutes
3. Vercel will provide a URL: `https://8020rei-analytics-XXXX.vercel.app`

---

## PHASE 4: Post-Deploy Verification (Step 9)

> **Goal:** Confirm everything works in production.

### Verification Checklist

- [ ] Dashboard loads without errors on the Vercel URL
- [ ] 4 metrics display real numbers (not zeros)
- [ ] "Users Over Time" chart shows data
- [ ] "Feature Usage" chart shows bars
- [ ] "Top Clients" table shows real clients
- [ ] Time filter works (7, 30, 90 days)
- [ ] Looks good on mobile
- [ ] No errors in browser console (F12 → Console)
- [ ] "Last updated" timestamp appears

### If errors occur — Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to fetch metrics" | `GOOGLE_APPLICATION_CREDENTIALS_JSON` misconfigured | Verify the full JSON is pasted as the value. Redeploy. |
| "PERMISSION_DENIED" | Service Account missing correct roles | Verify BigQuery Data Viewer + Job User in IAM |
| Metrics show 0 | `GOOGLE_CLOUD_PROJECT` or `BIGQUERY_DATASET` incorrect | Verify: `web-app-production-451214` and `analytics_489035450` |
| Build fails | TypeScript errors | Check Vercel logs → Deployments → Build Logs |

---

## PHASE 5: Post-Deploy Improvements (Future)

> **Priority ordered. Execute only after Phases 1-4 are 100% working.**

### 5.1 — Authentication (HIGH Priority)

**Why:** Currently anyone with the URL can view the dashboard.

**Technology:** NextAuth.js with Google OAuth

**Steps:**
1. `npm install next-auth`
2. Create `src/app/api/auth/[...nextauth]/route.ts` with Google Provider
3. Restrict to `@8020rei.com` emails in `signIn` callback
4. Protect `/api/metrics` with `getServerSession()`
5. Add variables in Vercel: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### 5.2 — Custom Domain (MEDIUM Priority)

**Action:** In Vercel → Settings → Domains → add `analytics.8020rei.com`

### 5.3 — BigQuery Cost Alerts (MEDIUM Priority)

**Action:** In GCP Console → BigQuery → Settings → set daily query limit

### 5.4 — Custom GA4 Events (LOW Priority — requires dev team)

**Recommended events:**

| Feature | Event | When it fires |
|---------|-------|---------------|
| Buybox | `deal_created` | User creates a deal |
| Buybox | `deal_edited` | User edits a deal |
| Properties | `property_imported` | Import completed |
| Properties | `property_exported` | Export completed |
| Rapid Response | `rapid_response_created` | User creates rapid response |
| Skip Trace | `skip_trace_completed` | Skip trace finished |
| Integrations | `api_token_created` | API token created |
| Integrations | `salesforce_connected` | Salesforce integrated |
| Buyers List | `buyer_added` | Buyer added to list |

**Implementation (in the 8020REI frontend, NOT in the dashboard):**

```javascript
gtag('event', 'deal_created', {
  'deal_id': '12345',
  'deal_value': 150000,
  'feature': 'buybox'
});
```

---

## Files to Create/Modify — Summary

| File | Action | Phase |
|------|--------|-------|
| `src/lib/bigquery.ts` | **Modify** — add support for env variable credentials | Phase 1 |
| `src/lib/cache.ts` | **Create** — in-memory cache layer with 5 min TTL | Phase 1 |
| `src/app/api/metrics/route.ts` | **Modify** — integrate cache + return timestamp | Phase 1 |
| `src/app/page.tsx` | **Modify** — display last updated timestamp | Phase 1 |
| `.gitignore` | **Verify/Modify** — ensure sensitive files are excluded | Phase 1 |

---

## Instructions for Claude

**Before executing any changes:**

1. Read the existing file completely before modifying it
2. Understand the current code structure
3. Make minimal, precise changes (don't rewrite entire files unless necessary)
4. After each change, verify that `npm run dev` still works
5. Don't touch files that are not listed here

**Execution order:**

```
Phase 1 → Task 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 (verify)
Phase 2 → Task 2.1 → 2.2 → 2.3
Phase 3 → Task 3.1 → 3.2 → 3.3 (requires manual user action in Vercel UI)
Phase 4 → Verification checklist
```

**Service Account Key path (for reference):**

```
/Users/work/analytics-dashboard-key.json
```

**To switch back to personal account after Service Account tests:**

```bash
gcloud config set account YOUR_EMAIL@gmail.com
```
