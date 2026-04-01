# 8020 Lens

A comprehensive analytics and operations dashboard for 8020REI. Built with Next.js 16, TypeScript, and the Axis Design System. Features multi-source data integration (BigQuery, AWS Aurora, Google Drive), Firebase Authentication, and a drag-drop widget-based workspace.

**Live URL:** https://analytics8020-798362859849.us-central1.run.app
**Stack:** Next.js 16 + Fastify Backend | **Auth:** Firebase (Google Sign-In, @8020rei.com only)

---

## Table of Contents

- [What is This?](#what-is-this)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Data Sources](#data-sources)
- [Navigation System](#navigation-system)
- [Design System (Axis)](#design-system-axis)
- [Building New Sections](#building-new-sections)
- [Widget System](#widget-system)
- [API Routes](#api-routes)
- [Deployment](#deployment)
- [Styling Guide](#styling-guide)
- [Key Files Reference](#key-files-reference)
- [Troubleshooting](#troubleshooting)

---

## What is This?

8020 Lens is the central dashboard for monitoring all 8020REI operations. It pulls data from multiple sources and presents it through a customizable widget-based interface.

**Currently active sections:**

| Section | Description | Data Source |
|---------|-------------|-------------|
| **Customer Success** | Client domains, product projects | BigQuery (Product) |
| **Analytics** | GA4 data — users, events, features, traffic, geography, technology | BigQuery (GA4) |
| **Features** | Feature-specific metrics — Properties API, Skip Trace, etc. | AWS Aurora, BigQuery |
| **Engagement Calls** | Google Drive-based document management for client engagement notes | Google Drive API |
| **Grafana** | Grafana dashboard directory with contributor profiles (Firestore) | Firestore |

**Planned sections** (placeholder UI exists): Feedback Loop, Pipelines, QA, ML Models

---

## Project Structure

```
8020-metrics-hub-build/
├── src/                          # Next.js frontend (App Router)
│   ├── app/
│   │   ├── page.tsx              # Main dashboard (all tabs, navigation, toolbar)
│   │   ├── layout.tsx            # Root layout with AuthProvider
│   │   ├── login/page.tsx        # Firebase Google Auth login page
│   │   ├── globals.css           # Design tokens, CSS variables, light/dark mode
│   │   └── api/                  # Next.js API routes
│   │       ├── metrics/          # GA4 data endpoints (users, events, features, etc.)
│   │       ├── engagement-calls/ # Google Drive CRUD + file upload
│   │       ├── properties-api/   # AWS Aurora data
│   │       └── diagnostics/      # Health checks
│   ├── components/
│   │   ├── axis/                 # Axis Design System (15 components)
│   │   ├── charts/               # Recharts wrappers (Line, Bar, Stacked, Donut)
│   │   ├── dashboard/            # Tab components (UsersTab, FeaturesTab, etc.)
│   │   └── workspace/            # Widget system (GridWorkspace, Widget, WidgetCatalog)
│   │       └── widgets/          # 54 individual widget components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Core utilities
│   │   ├── bigquery.ts           # BigQuery client (GA4 + Product projects)
│   │   ├── queries.ts            # SQL query builders for GA4
│   │   ├── product-queries.ts    # SQL queries for Product BigQuery
│   │   ├── aurora.ts             # AWS Aurora RDS Data API queries
│   │   ├── cache.ts              # In-memory TTL cache (5 min, 500 entries max)
│   │   ├── export.ts             # CSV export utilities
│   │   ├── date-utils.ts         # Date range helpers
│   │   ├── navigation.ts         # 3-level nav hierarchy definition
│   │   ├── google-drive.ts       # Google Drive API integration
│   │   ├── document-parser.ts    # Word doc parsing (mammoth)
│   │   ├── firebase/             # Auth context, config, Firestore ops
│   │   └── workspace/
│   │       └── defaultLayouts.ts # Widget grid configs per tab
│   └── types/                    # TypeScript definitions
├── backend/                      # Fastify API server (port 4001)
│   └── src/
│       ├── index.ts              # Fastify app setup
│       ├── routes/               # analytics, properties-api, health
│       ├── services/             # BigQuery, Aurora, cache services
│       ├── adapters/             # Data adapters
│       ├── auth/                 # Token verification
│       └── config/               # Environment config
├── shared-types/                 # TypeScript types shared between frontend & backend
├── credentials/                  # Service account key files (gitignored)
├── public/                       # Static assets (logos, design-kit.html)
├── Design docs/                  # Architecture plans, feature specs, deployment guides
├── .claude/skills/               # Claude Code automation skills
├── Dockerfile                    # Multi-stage build (Node 20 Alpine) for Cloud Run
├── next.config.ts                # output: 'standalone' for Docker
└── .env.local                    # All credentials (gitignored)
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (React 19)                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Firebase    │  │ 3-Level Nav  │  │ GridWorkspace            │ │
│  │ Auth        │  │ (Section →   │  │ (react-grid-layout)      │ │
│  │ (@8020rei)  │  │  Sub → Tab)  │  │  └─ 54 Widget types    │ │
│  └────────────┘  └──────────────┘  └──────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │ fetch()
┌──────────────────────────▼───────────────────────────────────────┐
│                    Next.js API Routes (src/app/api/)              │
│  /api/metrics/*  │  /api/engagement-calls/*  │  /api/properties-* │
└────────┬─────────┴──────────┬────────────────┴────────┬──────────┘
         │                    │                         │
    ┌────▼────┐         ┌────▼─────┐            ┌──────▼──────┐
    │ BigQuery│         │ Google   │            │ AWS Aurora  │
    │ (GA4 +  │         │ Drive    │            │ (RDS Data   │
    │ Product)│         │ API      │            │  API)       │
    └─────────┘         └──────────┘            └─────────────┘
```

### Data Flow

1. User logs in via Firebase Google Auth (restricted to `@8020rei.com` emails)
2. Frontend fetches data from Next.js API routes with date range + user type filters
3. API routes query data sources (BigQuery, Aurora, Drive) with an in-memory cache (5 min TTL)
4. Data flows into widget components rendered inside a draggable grid layout
5. Widget layouts persist to localStorage per tab

### Caching

All API routes use an in-memory TTL cache (`src/lib/cache.ts`):
- **TTL:** 5 minutes
- **Max entries:** 500
- **Cache key pattern:** `${endpoint}:${dateRange}:${filters}`
- Reduces BigQuery costs by ~80-90%

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **Google Cloud CLI** (`gcloud`) — for local BigQuery auth
- **Firebase project** with Google Auth enabled
- **`@8020rei.com` email** — non-company emails are automatically signed out

### Installation

```bash
# Clone the repo
git clone git@github.com:mancho19942020/8020-metrics-hub-build.git
cd 8020-metrics-hub-build

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Authenticate with Google Cloud (for local BigQuery access)
gcloud auth application-default login
```

### Set Up Environment

```bash
# Create .env.local and fill in credentials (see Environment Variables section below)
touch .env.local
```

See [Environment Variables](#environment-variables) for what each variable does.

### Run Locally

```bash
# Terminal 1: Start frontend (port 4000)
npm run dev

# Terminal 2: Start backend (port 4001) — optional, only needed for backend routes
cd backend && npm run dev
```

Open http://localhost:4000 and sign in with your `@8020rei.com` Google account.

### Available Commands

```bash
# Frontend
npm run dev              # Dev server on port 4000
npm run build            # Production build
npm run lint             # ESLint

# Backend
cd backend
npm run dev              # Fastify dev server on port 4001
npm run build            # Build for production
```

---

## Environment Variables

All variables go in `.env.local` at the project root.

### BigQuery (GA4 Analytics)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLOUD_PROJECT` | GCP project ID (`web-app-production-451214`) |
| `BIGQUERY_DATASET` | GA4 dataset (`analytics_489035450`) |

Local dev uses `gcloud auth application-default login`. In production (Cloud Run), the default service account has BigQuery access.

### BigQuery (Product Data)

| Variable | Description |
|----------|-------------|
| `BIGQUERY_PRODUCT_PROJECT` | Product GCP project (`bigquery-467404`) |
| `BIGQUERY_PRODUCT_DATASET` | Product dataset (`domain`) |
| `GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON` | Full service account JSON key (embedded as a string) |

### Firebase (Authentication)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain (`rei-analytics-b4b8b.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID (`rei-analytics-b4b8b`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

### Google Drive (Engagement Calls)

| Variable | Description |
|----------|-------------|
| `GOOGLE_DRIVE_CREDENTIALS_PATH` | Path to service account key file (local dev: `./credentials/google-drive-key.json`) |
| `GOOGLE_DRIVE_CREDENTIALS_JSON` | Full JSON key as string (production only — set in Cloud Run env vars) |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive folder ID for engagement call docs |

### AWS Aurora (Properties API)

| Variable | Description |
|----------|-------------|
| `DB_AURORA_RESOURCE_ARN` | Aurora cluster ARN |
| `DB_AURORA_SECRET_ARN` | Secrets Manager ARN for DB credentials |
| `DB_AURORA_ACCESS_KEY_ID` | AWS access key |
| `DB_AURORA_SECRET_ACCESS_KEY` | AWS secret key |
| `DB_AURORA_DEFAULT_REGION` | AWS region (`us-east-1`) |
| `AWS_AURORA_GRAFANA_DB` | Database name (`grafana8020db`) |

---

## Data Sources

### 1. GA4 via BigQuery

- **Project:** `web-app-production-451214`
- **Dataset:** `analytics_489035450`
- **Tables:** `events_*` (daily partitioned using `_TABLE_SUFFIX`)
- **Data freshness:** 24-48 hours (GA4 limitation)
- **Auth:** Default service account (Cloud Run) or `gcloud` CLI (local)
- **Used by:** Analytics section (Users, Events, Features, Clients, Traffic, Technology, Geography tabs)

### 2. Product Data via BigQuery

- **Project:** `bigquery-467404` (opsHub)
- **Dataset:** `domain`
- **Auth:** Separate service account key (`GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON`)
- **Used by:** Customer Success section (Client Domains, Product Projects)

### 3. AWS Aurora PostgreSQL

- **Cluster:** `aurora-services-8020rei`
- **Connection:** RDS Data API (no direct DB connection needed)
- **Region:** `us-east-1`
- **Used by:** Features > Properties API tab

### 4. Google Drive

- **Folder ID:** `1y0QT_u6zUIzZowqvqu_HiR4-MveBeFMH`
- **Auth:** Service account key file
- **Used by:** Engagement Calls section (lists docs, parses Word files, extracts client names)

### 5. Firebase / Firestore

- **Project:** `rei-analytics-b4b8b`
- **Auth:** Google Sign-In with `@8020rei.com` domain restriction
- **Firestore:** Stores Grafana contributor profiles

---

## Navigation System

The dashboard uses a **3-level navigation hierarchy** defined in `src/lib/navigation.ts`:

### Level 1 — Main Sections

Customer Success | Analytics | Feedback Loop | Features | Pipelines | QA | ML Models | Engagement Calls | Grafana

### Level 2 — Sub-sections (per main section)

| Section | Sub-sections |
|---------|-------------|
| Customer Success | *(no subsections — renders directly)* |
| Analytics | 8020REI GA4, 8020Roofing GA4 (disabled) |
| Feedback Loop | Import, Salesforce, Integrations, Leads Funnel, Delivery Audit |
| Features | 8020REI, 8020Roofing |
| Pipelines | 8020REI, 8020Roofing |
| QA | Axiom Validation, BuyBox Columns, Smoke & Sanity, Marketing Counter Reliability |
| ML Models | Deal Scoring, Model Performance, Drift Detection |

### Level 3 — Detail Tabs (for sections with rich data)

GA4 detail tabs: Overview | Users | Features | Clients | Traffic | Technology | Geography | Events | Insights

### URL Deep Linking

Navigation state is reflected in the URL:
```
/?section=analytics&sub=8020rei-ga4&detail=users
```

This allows bookmarking and sharing specific views.

---

## Design System (Axis)

The project uses the **Axis Design System** — a custom component library ported from Vue to React. Components live in `src/components/axis/`.

### Available Components

| Component | Purpose |
|-----------|---------|
| `AxisButton` | Primary action buttons (filled, outlined, ghost, text variants) |
| `AxisCard` | Content containers |
| `AxisTable` | Data tables with sorting, formatting, pagination |
| `AxisNavigationTab` | Navigation tabs (line and contained variants) |
| `AxisInput` | Text input fields |
| `AxisSelect` | Dropdown selects |
| `AxisCallout` | Alert/notice banners (info, success, alert, error) |
| `AxisSkeleton` | Loading placeholders |
| `AxisTag` | Tags/labels |
| `AxisPill` | Status pills |
| `AxisCheckbox` | Checkbox inputs |
| `AxisToggle` | Toggle switches |
| `AxisDateRangePicker` | Custom date range selector |

### Design Tokens

Defined as CSS variables in `src/app/globals.css`. Only these color shades exist:

- **Semantic colors** (`main`, `success`, `alert`, `error`, `info`): 50, 100, 300, 500, 700, 900, 950
- **Neutral**: 50–950 (full range)
- **Accents** (`accent-1` through `accent-5`): 50, 100, 300, 500, 700, 900, 950

Shades 200, 400, 600, 800 do **not** exist for semantic colors. Do not use them.

### Chart Components

Always use the chart wrappers in `src/components/charts/` — never raw Recharts:

```tsx
import {
  BaseLineChart,          // Time series data
  BaseHorizontalBarChart, // Category comparisons
  BaseStackedBarChart,    // Multiple series
  BaseDonutChart,         // Categorical distribution
} from '@/components/charts';
```

These provide consistent styling, dark mode support, and proper margins.

### Interactive Design Kit

Open `/public/design-kit.html` in a browser for a visual reference of all Axis components, tokens, and usage examples.

---

## Building New Sections

This is the step-by-step process for adding a new section or tab to the dashboard.

### Step 1: Add Navigation Entry

Edit `src/lib/navigation.ts`:

```typescript
// Add to MAIN_SECTION_TABS (Level 1)
{ id: 'my-section', name: 'My Section' },

// Add sub-section tabs
const MY_SECTION_SUBSECTION_TABS: AxisNavigationTabItem[] = [
  { id: 'my-subsection', name: 'My Subsection' },
];

// Register in SUBSECTION_TABS_MAP
'my-section': MY_SECTION_SUBSECTION_TABS,

// If the subsection has detail tabs, add them and update getDetailTabsForSubsection()
```

### Step 2: Create Tab Component

Create a new file in `src/components/dashboard/MyTab.tsx`. Every tab MUST:

1. Use `forwardRef` with `TabHandle` type
2. Implement `useImperativeHandle` exposing `resetLayout` and `openWidgetCatalog`
3. Use `GridWorkspace` for widget layout
4. Support `days`, `userType`, and `editMode` props

Here is the minimal template:

```tsx
'use client';

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout } from '@/components/axis';
import { GridWorkspace, WidgetCatalog } from '@/components/workspace';
import { Widget, TabHandle } from '@/types/widget';
import { DEFAULT_MY_LAYOUT, MY_LAYOUT_STORAGE_KEY } from '@/lib/workspace/defaultLayouts';

interface MyTabProps {
  days: number;
  userType: 'all' | 'internal' | 'external';
  editMode: boolean;
}

export const MyTab = forwardRef<TabHandle, MyTabProps>(function MyTab(
  { days, userType, editMode }, ref
) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWidgetCatalog, setShowWidgetCatalog] = useState(false);
  const [layout, setLayout] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MY_LAYOUT_STORAGE_KEY);
      if (saved) try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_MY_LAYOUT;
  });

  useImperativeHandle(ref, () => ({
    resetLayout: () => {
      setLayout(DEFAULT_MY_LAYOUT);
      localStorage.removeItem(MY_LAYOUT_STORAGE_KEY);
    },
    openWidgetCatalog: () => setShowWidgetCatalog(true),
  }));

  useEffect(() => { fetchData(); }, [days, userType]);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/metrics/my-endpoint?days=${days}&userType=${userType}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }

  const widgets = useMemo(() => {
    if (!data) return {};
    return {
      'widget-1': <div>Widget content here</div>,
    };
  }, [data]);

  if (loading) return <AxisSkeleton variant="chart" height="300px" />;

  return (
    <>
      <GridWorkspace
        layout={layout}
        onLayoutChange={(l) => {
          setLayout(l);
          localStorage.setItem(MY_LAYOUT_STORAGE_KEY, JSON.stringify(l));
        }}
        editMode={editMode}
        widgets={widgets}
      />
      <WidgetCatalog
        isOpen={showWidgetCatalog}
        onClose={() => setShowWidgetCatalog(false)}
        existingWidgets={layout}
      />
    </>
  );
});
```

### Step 3: Define Widget Layout

Add to `src/lib/workspace/defaultLayouts.ts`:

```typescript
export const MY_LAYOUT_STORAGE_KEY = 'axis-my-tab-layout-v1';

export const DEFAULT_MY_LAYOUT: Widget[] = [
  {
    id: 'my-metrics',
    type: 'metrics',
    title: 'Key Metrics',
    x: 0, y: 0, w: 12, h: 3,
    minW: 6, minH: 3, maxW: 12, maxH: 4,
  },
  {
    id: 'my-chart',
    type: 'timeseries',
    title: 'Trend Over Time',
    x: 0, y: 3, w: 12, h: 5,
    minW: 4, minH: 4, maxW: 12, maxH: 8,
  },
];
```

### Step 4: Create API Route

Add `src/app/api/metrics/my-endpoint/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { getBigQueryClient } from '@/lib/bigquery';

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get('days') || '30');
  const userType = req.nextUrl.searchParams.get('userType') || 'all';

  const cacheKey = `my-endpoint:${days}:${userType}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true });
  }

  try {
    const client = getBigQueryClient();
    // Run your query...
    const data = { /* ... */ };
    setCache(cacheKey, data);
    return NextResponse.json({ success: true, data, cached: false });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 });
  }
}
```

### Step 5: Wire Into Main Page

In `src/app/page.tsx`:

1. Import the tab component
2. Create a ref: `const myTabRef = useRef<TabHandle>(null);`
3. Add cases in `handleResetLayout` and `handleOpenWidgetCatalog` switch statements
4. Render the tab conditionally based on navigation state
5. Pass the ref: `<MyTab ref={myTabRef} days={days} userType={userType} editMode={editMode} />`

### Step 6: Verification Checklist

- [ ] Tab uses `forwardRef` with `TabHandle`
- [ ] `useImperativeHandle` exposes `resetLayout` and `openWidgetCatalog`
- [ ] Ref created and wired in `page.tsx`
- [ ] Cases added in unified toolbar handlers
- [ ] No duplicate Reset/Add Widget buttons inside the tab
- [ ] Layout uses sticky header pattern (`h-screen flex flex-col`)
- [ ] Uses `chrome-bg` / `light-gray-bg` CSS classes (not Tailwind color classes)
- [ ] Widget shadows: `shadow-xs` default, `shadow-sm` on hover
- [ ] All tables use `<AxisTable>` (never raw HTML tables)
- [ ] Skeleton loaders are minimalistic
- [ ] Tested in both light and dark mode

---

## Widget System

The dashboard uses `react-grid-layout` for draggable, resizable widgets.

### How It Works

1. Each tab defines a default layout in `defaultLayouts.ts` (grid positions, sizes, constraints)
2. `GridWorkspace` renders widgets in a 12-column grid (60px row height)
3. Users can toggle edit mode to drag/resize widgets
4. Layout changes are persisted to localStorage per tab
5. Each widget supports CSV export and settings via the unified toolbar

### Widget Size Constraints

| Widget Type | Min Size | Max Size |
|-------------|----------|----------|
| Metrics/Scorecards | 6x3 | 12x4 |
| Line/Bar Charts | 4x4 | 12x8 |
| Donut Charts | 4x4 | 8x8 |
| Tables | 6x4 | 12x12 |

### Creating a New Widget

1. Create component in `src/components/workspace/widgets/MyWidget.tsx`
2. Register the widget type in `src/types/widget.ts` (add to `WidgetType` union)
3. Add to the widget component map in the tab that uses it
4. Define default layout in `defaultLayouts.ts`

---

## API Routes

All API routes follow a consistent response pattern:

```typescript
{
  success: boolean;
  data: T;
  cached: boolean;
  timestamp: string;
}
```

### Active Endpoints

| Endpoint | Data Source | Description |
|----------|-------------|-------------|
| `/api/metrics/users` | BigQuery (GA4) | User activity, DAU/WAU/MAU |
| `/api/metrics/events` | BigQuery (GA4) | Event breakdown and volume |
| `/api/metrics/features` | BigQuery (GA4) | Feature usage metrics |
| `/api/metrics/clients` | BigQuery (GA4) | Client/domain data |
| `/api/metrics/traffic` | BigQuery (GA4) | Traffic sources and referrers |
| `/api/metrics/geography` | BigQuery (GA4) | Countries, cities, regions |
| `/api/metrics/technology` | BigQuery (GA4) | Devices, browsers, OS |
| `/api/metrics/insights` | BigQuery (GA4) | Aggregated insights |
| `/api/engagement-calls` | Google Drive | List, create, read engagement docs |
| `/api/engagement-calls/[id]` | Google Drive | Update, delete specific doc |
| `/api/engagement-calls/upload` | Google Drive | File upload |
| `/api/properties-api` | AWS Aurora | Properties API metrics |
| `/api/diagnostics` | — | Health checks |

### Query Parameters

Most metrics endpoints accept:
- `days` — Number of days to look back (7, 30, 90, or custom)
- `userType` — Filter: `all`, `internal`, `external`
- `startDate` / `endDate` — Custom date range (ISO format)

---

## Deployment

### CRITICAL: There is NO CI/CD pipeline

`git push` does **NOT** deploy. After every push, you must manually deploy to Cloud Run.

### Deployment Steps

**1. Push to GitHub:**
```bash
git push origin main
```

**2. Regenerate env vars file** (converts `.env.local` credentials to YAML format for Cloud Run):
```bash
python3 -c "
import json, sys, os
os.chdir('/path/to/8020rei-analytics')

# Read BigQuery Product credentials
bq_creds = None
with open('.env.local') as f:
    for line in f:
        if line.startswith('GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON='):
            bq_creds = line.split('=', 1)[1].strip()
            break

# Read Google Drive credentials
with open('credentials/google-drive-key.json') as f:
    drive_creds = f.read().strip()

# Read Aurora credentials
aurora_vars = {}
aurora_keys = ['DB_AURORA_RESOURCE_ARN', 'DB_AURORA_SECRET_ARN', 'DB_AURORA_ACCESS_KEY_ID',
               'DB_AURORA_SECRET_ACCESS_KEY', 'DB_AURORA_DEFAULT_REGION', 'AWS_AURORA_GRAFANA_DB']
with open('.env.local') as f:
    for line in f:
        for key in aurora_keys:
            if line.startswith(key + '='):
                aurora_vars[key] = line.split('=', 1)[1].strip()

# Build YAML
env_vars = {
    'GOOGLE_CLOUD_PROJECT': 'web-app-production-451214',
    'BIGQUERY_DATASET': 'analytics_489035450',
    'BIGQUERY_PRODUCT_PROJECT': 'bigquery-467404',
    'BIGQUERY_PRODUCT_DATASET': 'domain',
    'GOOGLE_DRIVE_FOLDER_ID': '1y0QT_u6zUIzZowqvqu_HiR4-MveBeFMH',
    'GOOGLE_DRIVE_CREDENTIALS_JSON': drive_creds,
    'GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON': bq_creds,
    **aurora_vars,
}
with open('/tmp/env-vars.yaml', 'w') as f:
    for k, v in env_vars.items():
        escaped = v.replace('\\\\', '\\\\\\\\').replace('\"', '\\\\\"')
        f.write(f'{k}: \"{escaped}\"\n')
print(f'Written {len(env_vars)} env vars to /tmp/env-vars.yaml')
"
```

**3. Deploy to Cloud Run:**
```bash
gcloud run deploy analytics8020 \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file /tmp/env-vars.yaml
```

**4. Verify:** Open https://analytics8020-798362859849.us-central1.run.app

### Cloud Run Service Details

| Property | Value |
|----------|-------|
| Service name | `analytics8020` |
| Region | `us-central1` |
| GCP Project | `web-app-production-451214` |
| Service URL | https://analytics8020-798362859849.us-central1.run.app |
| Auth | Unauthenticated (public) |
| Port | 3000 (Docker) |

### Docker Build

The `Dockerfile` uses a multi-stage build (Node 20 Alpine):
1. **Builder stage:** Installs deps, runs `next build`
2. **Runner stage:** Copies standalone output + static files, runs `node server.js`

Next.js is configured with `output: 'standalone'` in `next.config.ts` for this.

---

## Styling Guide

### Critical Rules

1. **Tailwind color classes do NOT work reliably.** Always use custom CSS classes from `globals.css`.
2. **Sticky header is mandatory.** Outer container: `h-screen flex flex-col`. Never `min-h-screen`.
3. **Default theme is dark mode** for new users.

### CSS Class Reference

| Class | Use For | Light Mode | Dark Mode |
|-------|---------|------------|-----------|
| `chrome-bg` | Header + nav bars | White `#ffffff` | `#0d1321` |
| `light-gray-bg` | Scrollable content area | Gray `#f3f4f6` | `#111827` |
| `selected-tab-line` | Active tab (line style) | Dark blue underline | Near-white underline |
| `selected-tab-contained` | Active tab (pill style) | Filled pill | Filled pill |
| `bg-surface-base` | Widget/card backgrounds | White | `#111827` |
| `bg-surface-raised` | Elevated surfaces | Slightly off-white | Slightly lighter |

### Page Layout Pattern

```tsx
<div className="h-screen flex flex-col bg-surface-base">
  <div className="w-full flex flex-col flex-1 min-h-0">
    <header className="flex-shrink-0 px-6 py-3 border-b border-stroke chrome-bg">...</header>
    <nav className="flex-shrink-0 px-6 border-b border-stroke chrome-bg">...</nav>
    <main className="flex-1 overflow-y-auto px-6 py-4 light-gray-bg">
      {/* Only this area scrolls */}
    </main>
  </div>
</div>
```

### Typography (Sentence Case)

- Page titles: `text-xl font-semibold` — not `text-2xl`
- Only first word capitalized: "Grafana dashboards" not "Grafana Dashboards"
- Buttons: "View dashboards" not "View Dashboards"
- Exception: proper nouns keep their case (e.g., "Firebase", "BigQuery")

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main dashboard — navigation, toolbar, tab rendering |
| `src/app/globals.css` | Design tokens, CSS variables, custom classes |
| `src/lib/navigation.ts` | 3-level navigation hierarchy |
| `src/lib/bigquery.ts` | BigQuery client setup (GA4 + Product) |
| `src/lib/queries.ts` | GA4 SQL query builders |
| `src/lib/cache.ts` | In-memory TTL cache |
| `src/lib/workspace/defaultLayouts.ts` | Widget grid positions per tab |
| `src/components/axis/` | Axis Design System (15 components) |
| `src/components/charts/` | Recharts wrappers |
| `src/components/dashboard/` | Tab components (UsersTab, FeaturesTab, etc.) |
| `src/components/workspace/` | Widget system (GridWorkspace, Widget, WidgetCatalog) |
| `src/components/workspace/widgets/` | 50+ widget components |
| `src/types/widget.ts` | Widget types + `TabHandle` interface |
| `backend/src/index.ts` | Fastify server setup |
| `Dockerfile` | Multi-stage Docker build for Cloud Run |
| `CLAUDE.md` | AI assistant guidance (patterns, rules, gotchas) |
| `.claude/skills/dashboard-builder/SKILL.md` | Complete dashboard building reference |
| `.claude/skills/deploy-to-cloud-run/SKILL.md` | Full deployment protocol |

---

## Troubleshooting

### "Access Denied" on BigQuery
- Run `gcloud auth application-default login` for local dev
- For Product BigQuery: ensure `GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON` is set in `.env.local`
- The GA4 project uses Cloud Run's default service account (no separate key needed)

### Changes not appearing after `git push`
- **This is the most common issue.** `git push` does NOT deploy. You must run `gcloud run deploy` after every push. See [Deployment](#deployment).

### Non-@8020rei.com email can't log in
- This is by design. `AuthContext.tsx` enforces `@8020rei.com` domain. Non-company emails are automatically signed out.

### Engagement Calls not loading
- Local: Check `credentials/google-drive-key.json` exists
- Production: Ensure `GOOGLE_DRIVE_CREDENTIALS_JSON` env var is set in Cloud Run

### Properties API tab shows errors
- Verify all 6 `DB_AURORA_*` env vars are set in `.env.local`
- The Aurora cluster must be accessible via RDS Data API from the configured region

### Widget layout looks wrong after update
- Clear localStorage for the affected tab's layout key (e.g., `axis-users-layout-v1`)
- Or use the "Reset Layout" button in the toolbar (requires edit mode)

### YAML parsing error during deploy
- Never pass JSON credentials via `--set-env-vars` — always use the Python script to generate `/tmp/env-vars.yaml`

---

## Project History

The project was built over ~2 months (Feb–Mar 2026) with these major milestones:

1. **Foundation** (Feb 6–9) — Next.js scaffold, BigQuery integration, Axis Design System port
2. **Core Analytics** (Feb 10–11) — All GA4 tabs, Cloud Run deployment config
3. **Integrations** (Feb 12–17) — Engagement Calls (Google Drive), Product tab (BigQuery)
4. **Quality & Polish** (Feb 24–Mar 4) — Design system audit, Grafana tab, sticky header, URL deep linking
5. **Advanced Features** (Mar 4–5) — Properties API (AWS Aurora), export enhancements
6. **Rebrand** (Mar 25) — Renamed from "8020 Metrics Hub" to "8020 Lens", new logos
7. **Refinement** (Mar 26–30) — Custom date ranges, lazy loading, SQL safety, cache limits

---

**Built by the 8020REI team**
