# Data Access & Integration Guide

> For agents and collaborators building new sections, boards, or widgets for 8020 Lens.
> Last updated: 2026-03-30

---

## 1. Platform Overview

8020 Lens is an analytics dashboard built with **Next.js 16 (App Router)** + **Fastify backend**. It pulls data from multiple sources and renders it through a **widget-based drag-and-drop workspace** using `react-grid-layout`.

The navigation has 3 levels:

```
Main Section > Sub-section > Detail Tab
```

Current main sections: Product, Analytics, Feedback Loop, Features, Pipelines, QA, ML Models, Engagement Calls, Grafana.

---

## 2. Data Sources & Access

### 2.1 BigQuery: GA4 Events (User Analytics)

| Field | Value |
|-------|-------|
| **GCP Project** | `web-app-production-451214` |
| **Dataset** | `analytics_489035450` |
| **Tables** | `events_*` (daily sharded, format `events_YYYYMMDD`) |
| **Data goes back to** | August 2025 |
| **Freshness** | 24-48 hours (GA4 export limitation) |
| **Auth (local dev)** | `gcloud auth application-default login` (uses your personal Google account) |
| **Auth (production)** | Service account `analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com` via `GOOGLE_APPLICATION_CREDENTIALS_JSON` env var |
| **Permissions** | `bigquery.dataViewer` + `bigquery.jobUser` (read-only) |

**What's in it:** Page views, events, user sessions, device/browser/geo info, user properties (including `user_affiliation` for internal vs external classification). Client subdomains are extracted from the page URL pattern `https://{subdomain}.8020rei.com/...`.

**Code:** Queries in `src/lib/queries.ts`, client in `src/lib/bigquery.ts` (uses `runQuery<T>()`).

---

### 2.2 BigQuery: Product Data (Client Domains, Jira, and 27 more datasets)

| Field | Value |
|-------|-------|
| **GCP Project** | `bigquery-467404` |
| **Default Dataset** | `domain` |
| **Total Datasets** | 29 |
| **Auth (local dev)** | Same `gcloud` CLI credentials |
| **Auth (production)** | Service account `id-020metricshub@bigquery-467404.iam.gserviceaccount.com` via `GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON` env var |
| **Permissions** | `bigquery.dataViewer` + `bigquery.jobUser` (read-only) |

**Currently used by the app:**

- `domain` (5 tables) — `feedback_clients_unique`, `active_domains`, `client_fips`, `client_counties`, `feedback_clients`
- `jira` (6 tables) — `issues_unique`, `issues_bugs`, and others

**Available but NOT yet integrated (huge opportunity):**

| Dataset | Tables | What it likely contains |
|---------|--------|----------------------|
| `salesmate` | 22 | CRM / sales pipeline data |
| `teamtailor` | 22 | Recruiting / HR data |
| `fulfillment_core` | 22 | Core fulfillment operations |
| `fulfillment_meta` | 19 | Fulfillment metadata |
| `fulfillment_warehouse` | 15 | Warehouse / inventory data |
| `chargeover` | 15 | Billing / subscription data |
| `audits` | 11 | Audit logs |
| `buybox` | 10 | Buybox analysis data |
| `meta_ads` | 10 | Meta (Facebook) ad campaigns |
| `landing` | 7 | Landing page performance |
| `freshdesk` | 6 | Support tickets |
| `ga4` | 6 | Additional GA4 data |
| `ai_analysis` | 5 | AI/ML analysis outputs |
| `affiliates` | 4 | Affiliate program data |
| `identity` | 4 | User identity data |
| `public_apis` | 4 | Public API usage |
| `clarity` | 3 | Microsoft Clarity (heatmaps, sessions) |
| `fulfillment_gold` | 3 | Curated fulfillment data |
| `prospecting` | 3 | Lead prospecting data |
| `reference_data` | 3 | Lookup / reference tables |
| `google_ads` | 2 | Google Ads campaigns |
| `quickbooks` | 2 | Accounting data |
| `meta` | 2 | Meta platform data |
| `fulfillment_raw` | 2 | Raw fulfillment data |
| `admin` | 1 | Admin data |
| `analytics` | 1 | Analytics data |
| `asana` | 6 | Asana project tracking |
| `fathom` | 0 | Empty |

**Code:** Queries in `src/lib/product-queries.ts`, client in `src/lib/bigquery.ts` (uses `runProductQuery<T>()`).

---

### 2.3 AWS Aurora (RDS Data API)

| Field | Value |
|-------|-------|
| **Cluster** | `aurora-services-8020rei` (us-east-1) |
| **Database** | `grafana8020db` |
| **Auth** | IAM access key + Secrets Manager |
| **Status** | Credentials configured in `.env.local` but not actively queried by the app yet |

Env vars: `DB_AURORA_RESOURCE_ARN`, `DB_AURORA_SECRET_ARN`, `DB_AURORA_ACCESS_KEY_ID`, `DB_AURORA_SECRET_ACCESS_KEY`.

---

### 2.4 Firebase

| Field | Value |
|-------|-------|
| **Project** | `rei-analytics-b4b8b` |
| **Used for** | User authentication (login requires `@8020rei.com` email) |
| **Config** | `NEXT_PUBLIC_FIREBASE_*` env vars in `.env.local` |

---

### 2.5 Google Drive

| Field | Value |
|-------|-------|
| **Used for** | Engagement calls file upload/storage |
| **Folder ID** | `1y0QT_u6zUIzZowqvqu_HiR4-MveBeFMH` |
| **Auth** | Service account key at `./credentials/google-drive-key.json` |

---

## 3. How to Discover What's in a New Dataset

Before building anything, you need to explore the dataset. Here's how:

### Step 1: List the tables

```bash
bq ls --project_id=bigquery-467404 <dataset_name>
```

### Step 2: Check a table's schema

```bash
bq show --schema --format=prettyjson bigquery-467404:<dataset_name>.<table_name>
```

### Step 3: Preview rows

```bash
bq query --use_legacy_sql=false --max_rows=5 \
  'SELECT * FROM `bigquery-467404.<dataset_name>.<table_name>` LIMIT 5'
```

### Step 4: Check row count and date range

```bash
bq query --use_legacy_sql=false \
  'SELECT COUNT(*) as total_rows, MIN(date) as earliest, MAX(date) as latest
   FROM `bigquery-467404.<dataset_name>.<table_name>`'
```

**Important:** Always add date filters to avoid full table scans. BigQuery charges by data scanned.

---

## 4. How to Add a New Data Source to the App

Follow this exact pattern. Each step maps to a layer of the architecture.

### Step 1: Write the SQL queries (`src/lib/`)

Create a new file like `src/lib/<your-source>-queries.ts`. Follow the pattern from `product-queries.ts`:

```typescript
import { PRODUCT_PROJECT } from './bigquery';

const DATASET = '<your_dataset>';
const TABLE = `\`${PRODUCT_PROJECT}.${DATASET}.<your_table>\``;

export interface DateRangeParams {
  days?: number;
  startDate?: string;
  endDate?: string;
}

// Always include a date filter helper
function getDateFilter(dateRange: DateRangeParams, col: string = 'date'): string {
  if (dateRange.startDate && dateRange.endDate) {
    return `${col} >= '${dateRange.startDate}' AND ${col} <= '${dateRange.endDate}'`;
  }
  const days = dateRange.days || 30;
  return `${col} >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
}

export function getYourOverviewQuery(dateRange: DateRangeParams): string {
  return `
    SELECT
      -- your columns here
    FROM ${TABLE}
    WHERE ${getDateFilter(dateRange)}
  `;
}
```

**Rules:**
- Always use parameterized date filters (never scan all data)
- Always specify columns (never `SELECT *` in production queries)
- Use `LIMIT` on leaderboards/rankings
- For GA4 data, filter with `_TABLE_SUFFIX` (sharded tables). For product data, filter on `date` or `updated` columns.

---

### Step 2: Define TypeScript types (`src/types/`)

Create or extend a types file:

```typescript
// src/types/your-source.ts
export interface YourOverview {
  metric_a: number;
  metric_b: number;
}

export interface YourDataPayload {
  overview: YourOverview;
  // ... other data shapes
}
```

---

### Step 3: Create an API route (`src/app/api/metrics/<your-source>/route.ts`)

Follow the `product-domains/route.ts` pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { runProductQuery } from '@/lib/bigquery';  // or runQuery for GA4
import { getCached, setCache } from '@/lib/cache';
import { getYourOverviewQuery } from '@/lib/<your-source>-queries';
import type { YourDataPayload, YourOverview } from '@/types/your-source';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const dateRange = startDate && endDate ? { startDate, endDate } : { days };

  // Cache key must be unique per combination of params
  const cacheKey = startDate && endDate
    ? `your-source-v1:${startDate}_${endDate}`
    : `your-source-v1:${days}`;

  const cached = getCached<YourDataPayload>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true });
  }

  try {
    const [overviewResult] = await Promise.all([
      runProductQuery<YourOverview>(getYourOverviewQuery(dateRange)),
    ]);

    const data: YourDataPayload = {
      overview: overviewResult[0] || { metric_a: 0, metric_b: 0 },
    };

    setCache(cacheKey, data);
    return NextResponse.json({ success: true, data, cached: false });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('BigQuery error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
```

**Key patterns:**
- Use `runQuery<T>()` for GA4 project data
- Use `runProductQuery<T>()` for product project data
- Always implement 5-minute in-memory cache with `getCached` / `setCache`
- Use `Promise.all` to run independent queries in parallel
- Always return `{ success: boolean, data, cached: boolean }`

---

### Step 4: Create widgets (`src/components/workspace/widgets/`)

Each widget is a React component that receives data via props. Register it in the widgets `index.ts` and add layout config in `src/lib/workspace/defaultLayouts.ts`.

**Before building widgets**, read the Dashboard Builder skill: `.claude/skills/dashboard-builder/SKILL.md` — it has required patterns for shadows, export support, settings, and common pitfalls.

---

### Step 5: Add navigation (if it's a new section/tab)

Edit `src/lib/navigation.ts` to add your section, sub-section, or detail tabs.

---

## 5. BigQuery Client Reference

There are two BigQuery clients configured in `src/lib/bigquery.ts`:

| Client | Function | Project | Use for |
|--------|----------|---------|---------|
| `bigquery` | `runQuery<T>(sql)` | `web-app-production-451214` | GA4 event data |
| `productBigquery` | `runProductQuery<T>(sql)` | `bigquery-467404` | All product datasets (domain, jira, salesmate, etc.) |

Both use Application Default Credentials locally and service account keys in production.

---

## 6. Cost & Safety Rules

1. **Never `SELECT *`** — always specify the columns you need
2. **Always filter by date** — BigQuery charges per byte scanned
3. **Use `LIMIT`** on exploratory queries and leaderboards
4. **Cache everything** — 5-minute in-memory cache minimum
5. **Test queries in `bq` CLI first** before putting them in code — check the byte estimate
6. **The service accounts are read-only** — you cannot accidentally write, update, or delete data in BigQuery

---

## 7. Deployment

There is NO CI/CD pipeline. After pushing code:

1. `git push origin main`
2. Regenerate env vars YAML from `.env.local`
3. Run: `gcloud run deploy analytics8020 --source . --region us-central1 --allow-unauthenticated --env-vars-file /tmp/env-vars.yaml`

Full protocol: `.claude/skills/deploy-to-cloud-run/SKILL.md`

Production URL: `https://analytics8020-798362859849.us-central1.run.app`

---

## 8. Quick Checklist for Adding a New Board

- [ ] Explore the dataset (`bq ls`, `bq show --schema`, `bq query ... LIMIT 5`)
- [ ] Write SQL queries in `src/lib/<source>-queries.ts` with date filters
- [ ] Define TypeScript types in `src/types/`
- [ ] Create API route in `src/app/api/metrics/<source>/route.ts` with caching
- [ ] Build widgets in `src/components/workspace/widgets/`
- [ ] Register widgets in widget index + `defaultLayouts.ts`
- [ ] Add navigation entries in `src/lib/navigation.ts`
- [ ] Read the Dashboard Builder skill before building UI
- [ ] Test locally with `npm run dev` (port 4000)
- [ ] Deploy to Cloud Run after pushing
