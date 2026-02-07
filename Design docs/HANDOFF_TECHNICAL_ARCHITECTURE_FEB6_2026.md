# 8020REI Analytics Dashboard - Technical Architecture & Handoff

**Project:** 8020REI Metrics Hub
**Purpose:** Real-time analytics dashboard for monitoring user behavior and feature usage across 8020REI platform
**Last Updated:** February 6, 2026
**Port:** localhost:4000

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Stack](#technical-stack)
3. [Architecture Overview](#architecture-overview)
4. [BigQuery Integration](#bigquery-integration)
5. [Data Flow](#data-flow)
6. [Project Structure](#project-structure)
7. [Component Architecture](#component-architecture)
8. [Design System Implementation](#design-system-implementation)
9. [Authentication & Credentials](#authentication--credentials)
10. [Environment Configuration](#environment-configuration)
11. [API Routes](#api-routes)
12. [Development Workflow](#development-workflow)
13. [Future Development Guidelines](#future-development-guidelines)

---

## Project Overview

### Purpose

This analytics dashboard provides real-time insights into the 8020REI platform usage by querying Google Analytics 4 (GA4) data stored in BigQuery. It displays:

- **Total Users** - Unique users across all clients
- **Total Events** - All tracked events (page views, clicks, etc.)
- **Page Views** - Specific page_view events
- **Active Clients** - Number of unique 8020REI client subdomains
- **Users Over Time** - Daily user trends
- **Feature Usage** - Most visited features/pages
- **Top Clients** - Clients ranked by activity

### Key Features

- Real-time data from BigQuery
- Time-based filtering (7, 30, 90 days)
- Interactive charts (line charts, bar charts)
- Client activity ranking
- 8020 Design System compliant UI
- Blue theme for Metrics Hub brand

---

## Technical Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Styling framework |
| **Recharts** | 3.7.0 | Data visualization (charts) |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16.1.6 | Server-side API endpoints |
| **@google-cloud/bigquery** | 8.1.1 | BigQuery client library |

### Design System

- **Font:** Inter (400, 500, 600 weights)
- **Primary Color:** Blue (#1d4ed8 - main-700)
- **Design Philosophy:** 8020 Brand Guidelines (see HANDOFF_DESIGN_SYSTEM_JAN22_2026.md)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│                   (localhost:4000)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Next.js Application (App Router)               │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend (React Client Components)                │    │
│  │  - page.tsx (Dashboard)                            │    │
│  │  - Scorecard, Charts, Table Components             │    │
│  └─────────────────────┬──────────────────────────────┘    │
│                        │                                     │
│                        │ fetch('/api/metrics?days=30')      │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Backend (API Routes)                              │    │
│  │  - /api/metrics/route.ts                           │    │
│  │  - Server-side query execution                     │    │
│  └─────────────────────┬──────────────────────────────┘    │
└────────────────────────┼──────────────────────────────────┘
                         │
                         │ BigQuery SDK
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Cloud BigQuery                           │
│                                                               │
│  Project: web-app-production-451214                          │
│  Dataset: analytics_489035450                                │
│  Tables:  events_* (GA4 daily export)                        │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User loads page** → Browser fetches `/` from Next.js
2. **Client component mounts** → `useEffect` triggers data fetch
3. **API request** → `GET /api/metrics?days=30`
4. **Server processes** → API route executes 4 parallel BigQuery queries
5. **BigQuery responds** → Returns aggregated data
6. **API responds** → JSON data sent to client
7. **UI updates** → React re-renders with data

---

## BigQuery Integration

### Connection Method

The application uses **Google Cloud Application Default Credentials (ADC)** for authentication:

```typescript
// src/lib/bigquery.ts
import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});
```

No JSON key file is needed for local development - authentication is handled via:
```bash
gcloud auth application-default login
```

### BigQuery Resources

| Resource | Value |
|----------|-------|
| **GCP Project** | `web-app-production-451214` |
| **Dataset** | `analytics_489035450` |
| **Table Pattern** | `events_*` (wildcard for daily tables) |
| **Table Format** | GA4 export format (events_20260206, events_20260205, etc.) |

### Data Schema

The `events_*` tables follow the standard GA4 export schema:

```
events_YYYYMMDD
├── event_date: STRING (YYYYMMDD format)
├── event_timestamp: INTEGER (microseconds)
├── event_name: STRING (e.g., 'page_view', 'click')
├── user_pseudo_id: STRING (anonymous user ID)
├── event_params: ARRAY<STRUCT>
│   ├── key: STRING (parameter name)
│   └── value: STRUCT
│       ├── string_value: STRING
│       ├── int_value: INTEGER
│       └── ... (other value types)
└── ... (other GA4 fields)
```

### Query Strategy

All queries use the wildcard table pattern with date filtering:

```sql
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
```

This efficiently queries only the last N days of data without scanning all historical tables.

---

## Data Flow

### Frontend Data Flow

```typescript
// src/app/page.tsx
useEffect(() => {
  fetchData(); // Runs on mount and when 'days' changes
}, [days]);

async function fetchData() {
  const res = await fetch(`/api/metrics?days=${days}`);
  const json = await res.json();
  setData(json.data);
}
```

### Backend Query Execution

```typescript
// src/app/api/metrics/route.ts
export async function GET(request: NextRequest) {
  const days = parseInt(searchParams.get('days') || '30');

  // Execute 4 queries in parallel for performance
  const [metrics, usersByDay, featureUsage, topClients] = await Promise.all([
    runQuery<Metrics>(getMetricsQuery(days)),
    runQuery<DailyData>(getUsersByDayQuery(days)),
    runQuery<FeatureData>(getFeatureUsageQuery(days)),
    runQuery<ClientData>(getTopClientsQuery(days)),
  ]);

  return NextResponse.json({ success: true, data: { ... } });
}
```

### Query Definitions

All SQL queries are defined in `src/lib/queries.ts`:

#### 1. getMetricsQuery(days) - Summary Metrics

Aggregates total users, events, page views, and active clients:

```sql
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
```

**Key Logic:**
- Extracts subdomain from `page_location` parameter
- Pattern: `https://[client].8020rei.com`
- Counts unique subdomains for active_clients

#### 2. getUsersByDayQuery(days) - Time Series Data

Daily aggregation for line chart:

```sql
SELECT
  event_date,
  COUNT(DISTINCT user_pseudo_id) as users,
  COUNT(*) as events
FROM events_*
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL N DAY))
GROUP BY event_date
ORDER BY event_date
```

#### 3. getFeatureUsageQuery(days) - Feature/Page Breakdown

URL pattern matching to categorize pages:

```sql
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
```

**To Add New Features:** Update this CASE statement with new URL patterns.

#### 4. getTopClientsQuery(days) - Client Activity Ranking

Ranks clients by activity:

```sql
SELECT
  REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'https://([^.]+)\\.8020rei\\.com'
  ) as client,
  COUNT(*) as events,
  COUNT(DISTINCT user_pseudo_id) as users,
  COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views
GROUP BY client
ORDER BY events DESC
LIMIT 20
```

---

## Project Structure

```
8020rei-analytics/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── metrics/
│   │   │       └── route.ts          # API endpoint for metrics
│   │   ├── page.tsx                  # Main dashboard page
│   │   ├── layout.tsx                # Root layout (Inter font)
│   │   └── globals.css               # Design system tokens
│   │
│   ├── components/
│   │   ├── Scorecard.tsx             # Metric cards
│   │   ├── TimeSeriesChart.tsx       # Line chart (users over time)
│   │   ├── FeatureBarChart.tsx       # Horizontal bar chart
│   │   └── ClientsTable.tsx          # Top clients table
│   │
│   └── lib/
│       ├── bigquery.ts               # BigQuery client setup
│       └── queries.ts                # SQL query definitions
│
├── Design docs/
│   ├── HANDOFF_DESIGN_SYSTEM_JAN22_2026.md
│   └── HANDOFF_TECHNICAL_ARCHITECTURE_FEB6_2026.md (this file)
│
├── .env.local                        # Environment variables
├── package.json                      # Port 4000 configured
├── tsconfig.json
└── tailwind.config.ts                # (if exists - may be inline config)
```

---

## Component Architecture

### Page Component (src/app/page.tsx)

**Purpose:** Main dashboard orchestrator

**State Management:**
- `data` - Fetched metrics data
- `days` - Time filter (7, 30, 90)
- `loading` - Loading state
- `error` - Error messages

**UI States:**
1. **Loading:** Spinner with "Cargando datos de BigQuery..."
2. **Error:** Warning icon with retry button
3. **Success:** Dashboard with scorecards, charts, and table

### Scorecard Component

**Props:**
```typescript
interface ScorecardProps {
  label: string;      // "Total Users"
  value: number;      // 1234
  icon: string;       // "👥"
  color?: string;     // "bg-main-500"
}
```

**Design:**
- Card with `bg-surface-raised`, `rounded-lg`, `border-stroke`
- Icon in colored square badge
- Large number display
- Hover shadow effect

### TimeSeriesChart Component

**Props:**
```typescript
interface TimeSeriesChartProps {
  data: { event_date: string; users: number }[];
}
```

**Library:** Recharts `<LineChart>`

**Features:**
- Date formatting (YYYYMMDD → MM/DD)
- Blue line (#1d4ed8 - main-700)
- Grid lines, axis labels, tooltip
- Responsive container

### FeatureBarChart Component

**Props:**
```typescript
interface FeatureBarChartProps {
  data: { feature: string; views: number }[];
}
```

**Library:** Recharts `<BarChart>` with `layout="vertical"`

**Features:**
- Horizontal bars
- Blue fill (#1d4ed8)
- Sorted by views DESC (handled in query)

### ClientsTable Component

**Props:**
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
- Number formatting with `toLocaleString()`
- Borders using design system tokens

---

## Design System Implementation

### Color System

The dashboard uses the **8020 Design System** with **BLUE as the main brand color**:

| Token | Hex | Usage |
|-------|-----|-------|
| `main-700` | `#1d4ed8` | Primary buttons, links, chart lines |
| `main-500` | `#3b82f6` | Icons, secondary elements |
| `main-900` | `#1e3a8a` | Hover states |

**Semantic Tokens:**
- `bg-surface-base` - Page background
- `bg-surface-raised` - Card backgrounds
- `text-content-primary` - Main text
- `text-content-secondary` - Supporting text
- `border-stroke` - Default borders

### Typography

**Font:** Inter (loaded via next/font/google)

**Weights:** 400 (Regular), 500 (Medium), 600 (SemiBold)

**Scale:**
- `text-h1` - 22px, 600 weight - Page title
- `text-h4` - 16px, 600 weight - Section titles
- `text-body-regular` - 14px, 400 weight - Body text
- `text-label` - 12px, 400/500 weight - Labels

### Spacing & Layout

**Section Padding:** `px-6 py-8` (24px × 32px)

**Card Padding:** `p-4` (16px)

**Grid Gaps:** `gap-4` (16px)

**Responsive Grid:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Shadows

- **Cards at rest:** `shadow-sm`
- **Cards on hover:** `shadow-md`
- **Loading spinner:** Blue border (`border-main-700`)

---

## Authentication & Credentials

### Local Development Setup

**Method:** Google Cloud Application Default Credentials (ADC)

**Setup Steps:**

1. **Authenticate:**
   ```bash
   gcloud auth application-default login
   ```
   This opens a browser to sign in with Google and stores credentials at:
   `/Users/work/.config/gcloud/application_default_credentials.json`

2. **Set Project:**
   ```bash
   gcloud config set project web-app-production-451214
   ```

3. **Verify:**
   ```bash
   gcloud auth application-default print-access-token
   ```

**How It Works:**
- The `@google-cloud/bigquery` SDK automatically detects ADC credentials
- No code changes needed - just environment variables
- Credentials are tied to your Google account
- Permissions managed in GCP IAM

### Required Permissions

Your Google account needs these roles on the `web-app-production-451214` project:

- **BigQuery Data Viewer** - To read data from tables
- **BigQuery Job User** - To execute queries

### Production Deployment (Future)

For production, you'll need:
1. A dedicated service account
2. JSON key file
3. Environment variable: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`

---

## Environment Configuration

### .env.local

```env
GOOGLE_CLOUD_PROJECT=web-app-production-451214
BIGQUERY_DATASET=analytics_489035450
```

**Note:** No `GOOGLE_APPLICATION_CREDENTIALS` needed for local dev with gcloud ADC.

### Port Configuration

The app runs on **port 4000** (not 3000) to avoid conflicts with other projects:

**package.json:**
```json
{
  "scripts": {
    "dev": "next dev -p 4000",
    "start": "next start -p 4000"
  }
}
```

**Access:** http://localhost:4000

---

## API Routes

### GET /api/metrics

**Endpoint:** `/api/metrics?days=30`

**Query Parameters:**
- `days` (optional) - Number of days to query (default: 30)
  - Accepted values: 7, 30, 90

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
      { "event_date": "20260206", "users": 123, "events": 456 },
      { "event_date": "20260205", "users": 118, "events": 432 }
    ],
    "featureUsage": [
      { "feature": "Home Dashboard", "views": 1234 },
      { "feature": "Properties", "views": 987 }
    ],
    "topClients": [
      { "client": "demo", "events": 5678, "users": 234, "page_views": 3456 },
      { "client": "acme", "events": 4321, "users": 189, "page_views": 2987 }
    ]
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Failed to fetch metrics"
}
```

**HTTP Status Codes:**
- `200` - Success
- `500` - Server error (BigQuery query failed)

**Performance:**
- Typical response time: 2-3 seconds
- 4 queries executed in parallel via `Promise.all()`

---

## Development Workflow

### Starting the Development Server

```bash
# Navigate to project
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics

# Install dependencies (first time only)
npm install

# Start dev server on port 4000
npm run dev
```

**Access:** http://localhost:4000

### Making Changes

#### Adding a New Metric to Scorecards

1. **Update Query** (`src/lib/queries.ts`):
   ```sql
   SELECT
     COUNT(DISTINCT user_pseudo_id) as total_users,
     -- Add new metric:
     COUNT(CASE WHEN event_name = 'sign_up' THEN 1 END) as new_signups
   ```

2. **Update TypeScript Interface** (`src/app/api/metrics/route.ts`):
   ```typescript
   interface Metrics {
     total_users: number;
     new_signups: number; // Add this
   }
   ```

3. **Update Dashboard** (`src/app/page.tsx`):
   ```tsx
   <Scorecard
     label="New Signups"
     value={data.metrics.new_signups}
     icon="🎉"
     color="bg-success-500"
   />
   ```

#### Adding a New Feature to Feature Usage Chart

Update the CASE statement in `getFeatureUsageQuery()`:

```typescript
CASE
  WHEN REGEXP_CONTAINS(page_url, '/new-feature') THEN 'New Feature'
  WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
  // ... rest of cases
END as feature
```

#### Changing the Time Range Options

Update the `<select>` in `src/app/page.tsx`:

```tsx
<select value={days} onChange={(e) => setDays(Number(e.target.value))}>
  <option value={7}>Last 7 days</option>
  <option value={30}>Last 30 days</option>
  <option value={90}>Last 90 days</option>
  <option value={180}>Last 6 months</option> {/* Add this */}
</select>
```

### Testing

Currently no automated tests. Manual testing:

1. Start dev server
2. Check loading state
3. Verify data loads
4. Test time filter dropdown
5. Check responsive design (mobile, tablet, desktop)
6. Test error state (stop BigQuery access temporarily)

### Building for Production

```bash
npm run build
```

**Output:** `.next/` directory with optimized production build

**To run production build locally:**
```bash
npm run start
# Runs on port 4000
```

---

## Future Development Guidelines

### Roadmap Ideas

#### Phase 1: Enhanced Analytics
- [ ] Add date range picker (custom start/end dates)
- [ ] Add user engagement metrics (session duration, bounce rate)
- [ ] Add conversion funnel visualization
- [ ] Add client-specific drill-down (click client → see their detailed analytics)
- [ ] Add export functionality (CSV, PDF reports)

#### Phase 2: Real-Time Features
- [ ] Add auto-refresh (every 5 minutes)
- [ ] Add real-time event stream (last 100 events)
- [ ] Add WebSocket support for live updates
- [ ] Add notification system for anomalies

#### Phase 3: Advanced Features
- [ ] Add cohort analysis
- [ ] Add user segmentation
- [ ] Add A/B test tracking
- [ ] Add predictive analytics (ML models)
- [ ] Add custom dashboard builder

#### Phase 4: Multi-Tenant
- [ ] Add authentication/authorization
- [ ] Add client-specific views (each client sees only their data)
- [ ] Add role-based access control (admin, viewer)
- [ ] Add usage quotas and rate limiting

### Performance Optimization

**Current Performance:**
- Initial page load: ~2-3 seconds
- Query execution: 2-3 seconds
- 4 queries in parallel

**Future Optimizations:**
1. **Caching:** Add Redis cache for frequently-requested data
   ```typescript
   const cachedData = await redis.get(`metrics:${days}`);
   if (cachedData) return JSON.parse(cachedData);
   ```

2. **Incremental Static Regeneration (ISR):**
   ```typescript
   export const revalidate = 300; // Revalidate every 5 minutes
   ```

3. **BigQuery Materialized Views:**
   - Pre-aggregate common queries
   - Reduce query cost and latency

4. **Query Optimization:**
   - Add table partitioning hints
   - Use clustering for frequently-filtered columns
   - Reduce `SELECT *` usage

### Security Considerations

**Current:** No authentication (localhost only)

**Before Production:**

1. **Add Authentication:**
   - NextAuth.js with Google OAuth
   - Or custom JWT authentication

2. **Add Authorization:**
   - Verify user has access to requested data
   - Implement row-level security

3. **Environment Variables:**
   - Never commit `.env.local` to Git
   - Use Vercel Environment Variables for deployment
   - Rotate service account keys regularly

4. **Rate Limiting:**
   - Implement per-user query limits
   - Prevent BigQuery quota exhaustion

5. **Input Validation:**
   - Validate `days` parameter (prevent SQL injection)
   - Sanitize all user inputs

### Deployment

**Recommended Platform:** Vercel

**Steps:**
1. Push to GitHub
2. Connect Vercel to repository
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_CLOUD_PROJECT`
   - `BIGQUERY_DATASET`
   - `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON as secret)
4. Deploy

**Alternative:** Google Cloud Run, AWS Amplify, Netlify

### Monitoring & Observability

**Add in Production:**

1. **Error Tracking:** Sentry
   ```typescript
   Sentry.init({ dsn: process.env.SENTRY_DSN });
   ```

2. **Analytics:** PostHog, Mixpanel
   - Track dashboard usage
   - Monitor which metrics users view most

3. **Logging:** Datadog, LogRocket
   - Log BigQuery query times
   - Track API response times
   - Monitor error rates

4. **BigQuery Costs:**
   - Monitor bytes processed per query
   - Set up BigQuery quota alerts
   - Optimize expensive queries

### Code Quality

**Recommended Additions:**

1. **ESLint Configuration:**
   ```bash
   npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
   ```

2. **Prettier:**
   ```bash
   npm install --save-dev prettier eslint-config-prettier
   ```

3. **Husky + Lint-Staged:**
   - Run linting on git commit
   - Prevent committing errors

4. **Unit Tests:**
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom jest
   ```

5. **E2E Tests:**
   - Playwright or Cypress for integration testing

---

## Troubleshooting

### Common Issues

#### Issue: "Failed to fetch metrics" Error

**Symptoms:** Red error message in UI, 403 Forbidden in logs

**Causes:**
1. Not authenticated with gcloud
2. Google account lacks BigQuery permissions
3. Project ID incorrect

**Solutions:**
```bash
# Re-authenticate
gcloud auth application-default login

# Verify project
gcloud config get-value project

# Check credentials
gcloud auth application-default print-access-token
```

#### Issue: Slow Query Performance

**Symptoms:** API takes >10 seconds

**Debug:**
1. Check BigQuery Console → Query History
2. Look for "Bytes Processed" and "Slot Time"
3. Check if queries are scanning full tables

**Solutions:**
- Reduce date range
- Add table clustering
- Use materialized views

#### Issue: Port 4000 Already in Use

**Symptoms:** `Error: listen EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 4001
```

#### Issue: Stale Data

**Symptoms:** Data doesn't update when changing time filter

**Debug:** Check browser DevTools → Network tab for API calls

**Solutions:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear cache
- Check if `useEffect` dependency array includes `days`

---

## Contact & Support

**Project Location:**
```
/Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics
```

**Related Documentation:**
- [8020 Design System](./HANDOFF_DESIGN_SYSTEM_JAN22_2026.md)
- [Global Development Rules](/Users/work/Documents/Vibecoding/CLAUDE.md)

**BigQuery Resources:**
- [GCP Console - BigQuery](https://console.cloud.google.com/bigquery?project=web-app-production-451214)
- [GA4 Export Schema](https://support.google.com/analytics/answer/7029846)

---

## Appendix: Quick Reference Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Authenticate with Google Cloud
gcloud auth application-default login

# Set GCP project
gcloud config set project web-app-production-451214

# Check authentication
gcloud auth list

# View BigQuery datasets
bq ls --project_id=web-app-production-451214

# Run a test query
bq query --use_legacy_sql=false \
  "SELECT COUNT(*) FROM \`web-app-production-451214.analytics_489035450.events_*\`
   WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', CURRENT_DATE())"
```

---

**Document Version:** 1.0
**Last Updated:** February 6, 2026
**Next Review:** March 2026

*This document should be updated whenever significant architectural changes are made to the analytics dashboard.*
