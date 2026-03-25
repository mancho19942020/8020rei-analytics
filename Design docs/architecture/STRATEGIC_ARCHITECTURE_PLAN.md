# 8020 Lens - Strategic Architecture Plan

## Executive Summary

This document outlines the strategic plan to evolve 8020 Lens from its current state (single BigQuery GA4 data source) into a comprehensive Product Operations Dashboard capable of handling 6+ data sources, multiple stakeholder layers, and real-time operational data.

---

## Part 1: Current State Assessment

### What We Have Now

```
Current Architecture:
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                    │
├─────────────────────────────────────────────────────────────┤
│  Navigation: 8020REI GA4 | Roofing | Operational | SkipTrace │
│  (only GA4 is active, others are disabled placeholders)      │
├─────────────────────────────────────────────────────────────┤
│  Tabs: Overview | Users | Features | Clients | Traffic |...  │
├─────────────────────────────────────────────────────────────┤
│  API Routes (/api/metrics/*)  →  BigQuery (GA4 events)       │
│  In-memory cache (5-min TTL)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Strengths of Current Architecture
- Modular API endpoints (easy to add new sources)
- Widget-based dashboard system (source-agnostic)
- Strong TypeScript types
- Reusable chart components
- Caching layer already in place
- Clean separation between UI and data

### Gaps for Future Requirements
1. **No dedicated backend** - All logic in Next.js API routes
2. **Single data source** - Only BigQuery GA4
3. **No data normalization layer** - Each source will have different schemas
4. **No authentication for external APIs** - Only Firebase for users
5. **No job scheduling** - For data aggregation/ETL
6. **No real-time capabilities** - No WebSocket/SSE support

---

## Part 2: Proposed Navigation Structure

Based on the product plan document, here's the recommended reorganization:

### Current Navigation (5 tabs)
```
8020REI GA4 | 8020ROOFING GA4 | Operational | Zillow | Skiptrace
```

### Proposed Navigation (8 main sections)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: Main Sections (Horizontal)                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📊 Analytics  │  🔄 Salesforce  │  📦 Data  │  🔧 Tools  │              │
│  ⚙️ Pipelines  │  ✅ QA         │  🤖 ML    │  📋 Projects │             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Detailed Navigation Structure

```
1. 📊 ANALYTICS (Google Analytics)
   ├── 8020REI GA4 ✅ (current, keep as-is)
   │   └── Overview | Users | Features | Clients | Traffic | Tech | Geo | Events | Insights
   └── 8020Roofing GA4 (new)
       └── Same sub-tabs

2. 🔄 SALESFORCE & CRM
   ├── Integrations (active integrations per client)
   ├── Leads Funnel (leads → appointments → deals)
   ├── Delivery Audit (API delivery status)
   ├── Match Quality (deals in/out of market)
   └── Feedback Loop (reception → action tracking)

3. 📦 DATA SILOS (External Tools)
   ├── SILO (Scraping)
   │   └── Capacity | Usage | Cost vs Budget
   └── Zillow
       └── Listings | Market Data | Integration Status

4. 🔧 TOOLS (Internal Products)
   ├── Skip Trace
   │   └── Batch Elites | Direct Skip | Usage | Cost | Contracts
   ├── Rapid Response (Direct Mail individual)
   │   └── Letters Sent | Response Rate | Cost per Letter
   └── Smart Drop (Direct Mail bulk)
       └── Campaigns | Volume | ROI

5. ⚙️ PIPELINES (ETL & Data Processing)
   ├── Overview (health semaphore)
   ├── Bronze → Silver → Gold
   ├── Buyers List Processing
   └── Job Logs

6. ✅ QA (Quality Assurance)
   ├── Axiom Validation
   ├── BuyBox Columns
   ├── Smoke & Sanity Tests
   └── Error Trends

7. 🤖 ML MODELS (Machine Learning)
   ├── Deal Scoring
   ├── Model Performance
   ├── Drift Detection
   └── A/B Results

8. 📋 PROJECTS (optional, for tracking)
   └── Active Projects | Team Workload
```

### Navigation Component Changes

The current `DATA_SOURCE_TABS` in `src/app/page.tsx` should become:

```typescript
const MAIN_SECTIONS: AxisNavigationTabItem[] = [
  { id: 'analytics', name: 'Analytics', icon: <ChartIcon /> },
  { id: 'salesforce', name: 'Salesforce', icon: <SalesforceIcon /> },
  { id: 'data-silos', name: 'Data Silos', icon: <DatabaseIcon /> },
  { id: 'tools', name: 'Tools', icon: <ToolsIcon /> },
  { id: 'pipelines', name: 'Pipelines', icon: <PipelineIcon />, disabled: true },
  { id: 'qa', name: 'QA', icon: <CheckIcon />, disabled: true },
  { id: 'ml-models', name: 'ML Models', icon: <BrainIcon />, disabled: true },
];
```

Each section would then have its own sub-navigation (second level) based on what data sources are available.

---

## Part 3: Do You Need a Separate Backend?

### Short Answer: **Yes, but strategically**

### Justification

| Requirement | Next.js API Routes Only | Dedicated Backend |
|------------|-------------------------|-------------------|
| Simple BigQuery queries | ✅ Sufficient | Overkill |
| Multiple API authentications | ⚠️ Messy secrets management | ✅ Centralized auth |
| Scheduled jobs (ETL aggregation) | ❌ Not possible | ✅ Cron/workers |
| Real-time data streams | ⚠️ Limited (polling) | ✅ WebSockets/SSE |
| Rate limiting across sources | ⚠️ Complex | ✅ Built-in |
| Data normalization | ⚠️ In API routes | ✅ Service layer |
| Caching (Redis, etc.) | ⚠️ In-memory only | ✅ Distributed cache |
| Heavy aggregation | ⚠️ Slow cold starts | ✅ Persistent workers |

### Recommended Approach: **Hybrid Architecture**

Don't build a full backend from scratch. Instead:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                            │
│  - UI Components                                                     │
│  - Client-side state                                                 │
│  - Simple API routes (proxy to backend)                              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (New - Node.js/Fastify)               │
│  /api/v1/                                                            │
│  ├── /analytics/*     → BigQuery GA4 queries                         │
│  ├── /salesforce/*    → Salesforce API integration                   │
│  ├── /pipelines/*     → AWS Aurora/Athena queries                    │
│  ├── /skiptrace/*     → Batch Elites + Direct Skip APIs              │
│  ├── /qa/*            → Back Office + aggregated alerts              │
│  └── /ml/*            → Data Science endpoints                       │
├─────────────────────────────────────────────────────────────────────┤
│  Services:                                                           │
│  - AuthService (OAuth for Salesforce, API keys for vendors)          │
│  - CacheService (Redis with per-source TTLs)                         │
│  - QueueService (for async jobs)                                     │
│  - NormalizerService (converts any source → standard widget format)  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   BigQuery   │    │  Salesforce  │    │   AWS        │
│   (GA4)      │    │  (CRM)       │    │(Aurora/Athena)│
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Skip Trace   │    │   Slack      │    │ Back Office  │
│ (vendors)    │    │  (alerts)    │    │  (QA)        │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Part 4: Recommended Folder Structure

### Current Structure
```
8020rei-analytics/
├── src/
│   ├── app/           # Next.js pages + API routes
│   ├── components/    # UI components
│   ├── lib/           # Utilities + BigQuery
│   ├── types/         # TypeScript types
│   └── hooks/         # React hooks
├── public/
└── package.json
```

### Proposed Monorepo Structure
```
8020metrics-hub/
├── apps/
│   ├── dashboard/                    # Current Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                  # Pages only (no heavy API logic)
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   └── package.json
│   │
│   └── api/                          # NEW: Backend API
│       ├── src/
│       │   ├── routes/               # API endpoints
│       │   │   ├── analytics/
│       │   │   ├── salesforce/
│       │   │   ├── pipelines/
│       │   │   ├── skiptrace/
│       │   │   ├── qa/
│       │   │   └── ml/
│       │   ├── services/             # Business logic
│       │   │   ├── bigquery.service.ts
│       │   │   ├── salesforce.service.ts
│       │   │   ├── aws.service.ts
│       │   │   ├── skiptrace.service.ts
│       │   │   └── cache.service.ts
│       │   ├── adapters/             # Data normalization
│       │   │   ├── ga4.adapter.ts
│       │   │   ├── salesforce.adapter.ts
│       │   │   └── common.types.ts
│       │   ├── auth/                 # OAuth + API key management
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── shared-types/                 # Shared TypeScript types
│   │   ├── widget.ts
│   │   ├── metrics.ts
│   │   └── index.ts
│   └── shared-utils/                 # Shared utilities
│       ├── formatters.ts
│       └── index.ts
│
├── package.json                      # Monorepo root (npm workspaces or turborepo)
└── turbo.json                        # Optional: Turborepo config
```

---

## Part 5: Implementation Roadmap

### Phase 0: Foundation (Current Sprint)
**Goal:** Prepare architecture without breaking existing functionality

- [ ] Create monorepo structure (apps/dashboard, apps/api, packages/shared)
- [ ] Move current code to apps/dashboard
- [ ] Set up backend skeleton (Fastify or Express)
- [ ] Create shared types package
- [ ] Document data source contracts

### Phase 1: Salesforce & Feedback Loop (Highest Business Impact)
**Data Sources:** BigQuery (SF export)
**Contacts:** Job, Ignacio, Johan

- [ ] Create salesforce service in backend
- [ ] Build integrations dashboard
- [ ] Build leads funnel visualization
- [ ] Add delivery audit tracking
- [ ] Implement feedback loop metrics

### Phase 2: Google Analytics Expansion
**Data Sources:** BigQuery (GA export for both platforms)

- [ ] Add 8020Roofing GA4 as second analytics source
- [ ] Parameterize existing queries for multi-property support
- [ ] Create source switcher in analytics section

### Phase 3: QA & Data Quality
**Data Sources:** Back Office API, Slack webhooks
**Contacts:** Johan, Nicolas Hernandez

- [ ] Create QA service in backend
- [ ] Build axiom validation dashboard
- [ ] Integrate Slack alerts aggregation
- [ ] Add smoke/sanity test results

### Phase 4: Skip Trace Integration
**Data Sources:** Batch Elites API, Direct Skip API
**Contact:** Johan

- [ ] Create skiptrace service with multi-vendor support
- [ ] Build usage tracking by provider
- [ ] Add cost vs. contract visualization
- [ ] Create user activity reports

### Phase 5: Data Pipelines (AWS)
**Data Sources:** AWS Aurora, DynamoDB, Athena
**Contact:** Diego

- [ ] Create AWS service for pipeline queries
- [ ] Build pipeline health dashboard
- [ ] Add Bronze/Silver/Gold stage visualization
- [ ] Create job logs viewer

### Phase 6: ML Models
**Data Sources:** Data Science APIs/exports
**Contact:** Eduardo

- [ ] Create ML service for model metrics
- [ ] Build deal scoring dashboard
- [ ] Add drift detection alerts
- [ ] Create A/B test results view

### Phase 7: Direct Mail Tools
**Data Sources:** Internal systems (not yet integrated)
**Contact:** Job

- [ ] Design integration approach
- [ ] Build Rapid Response dashboard
- [ ] Build Smart Drop dashboard
- [ ] Add ROI tracking

---

## Part 6: Technical Decisions

### Backend Technology Choice

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Node.js + Fastify** | Fast, TypeScript native, familiar | New service to maintain | ✅ Recommended |
| **Python + FastAPI** | Great for data, ML integration | Different language, team context switch | Good for ML-heavy work |
| **Keep Next.js API Routes** | No new service | Messy, cold starts, no workers | ❌ Not for this scale |

**Recommendation:** Node.js with Fastify
- Shares TypeScript with frontend
- Excellent performance
- Built-in validation (zod/ajv)
- Easy to deploy to Cloud Run

### Caching Strategy

```typescript
// Per-source cache TTL configuration
const CACHE_CONFIG = {
  'bigquery-ga4': { ttl: 300 },      // 5 min (data is 24-48h delayed anyway)
  'salesforce': { ttl: 60 },          // 1 min (real-time API)
  'skiptrace': { ttl: 300 },          // 5 min
  'aws-pipelines': { ttl: 60 },       // 1 min (for real-time job status)
  'qa-axioms': { ttl: 120 },          // 2 min
  'ml-models': { ttl: 300 },          // 5 min
};
```

### Data Normalization Pattern

All data sources should normalize to widget-compatible formats:

```typescript
// packages/shared-types/widget-data.ts

interface MetricValue {
  label: string;
  value: number;
  change?: number;        // % change from previous period
  trend?: 'up' | 'down' | 'flat';
}

interface TimeSeriesData {
  labels: string[];       // x-axis (dates, hours, etc.)
  datasets: {
    name: string;
    values: number[];
    color?: string;
  }[];
}

interface TableData {
  columns: { key: string; label: string; type: 'text' | 'number' | 'date' }[];
  rows: Record<string, unknown>[];
  total?: number;
}

// Each adapter converts source-specific data to these formats
```

---

## Part 7: Stakeholder Layers Implementation

From the product plan, there are 3 layers:

| Layer | Audience | What They See |
|-------|----------|---------------|
| L1 - Executive | CEO, Leadership | KPIs, health, critical alerts |
| L2 - Head of Product | Camilo, Product Leads | Domain metrics, trends, bottlenecks |
| L3 - Operative | Engineering, Data, QA | Granular detail, logs, validations |

### Implementation Approach

Add a "view mode" selector to the dashboard:

```typescript
type ViewMode = 'executive' | 'product' | 'operative';

// Each widget can define what it shows at each level
interface WidgetConfig {
  type: WidgetType;
  title: string;
  visibleIn: ViewMode[];           // ['executive', 'product', 'operative']
  dataGranularity: {
    executive: 'aggregated';       // Weekly totals, top-level KPIs
    product: 'trend';              // Daily/weekly trends, breakdowns
    operative: 'detailed';         // Individual records, logs
  };
}
```

---

## Part 8: Immediate Next Steps

1. **Review this plan** - Does the navigation structure match your FigJam mockup?
2. **Prioritize phases** - Which data source should come first after GA4?
3. **Backend decision** - Confirm you want to proceed with Node.js/Fastify
4. **Team coordination** - Who will work on which phase?

### Questions to Clarify

1. Is the navigation grouping (Analytics, Salesforce, Tools, etc.) correct, or do you want a flatter structure?
2. Should the stakeholder layers (L1/L2/L3) be view modes or separate dashboards?
3. Do you have access to all the external APIs mentioned (Batch Elites, Direct Skip, SILO)?
4. Is there an existing backend service at 8020REI we should integrate with instead of building new?

---

## Appendix: Data Source Contacts

| Category | Data Source | Contact | Current Status |
|----------|-------------|---------|----------------|
| Analytics | BigQuery GA4 | - | ✅ Integrated |
| Salesforce | BigQuery SF export | Job/Ignacio/Johan | ✅ In BigQuery |
| Pipelines | AWS (Aurora/Athena) | Diego | ✅ Available |
| ML | Data Science | Eduardo | ✅ Available |
| QA | Back Office | Johan/Nicolas | ⚠️ Partial (Slack) |
| SILO | External provider | - | ⚠️ Need API access |
| Skip Trace | Batch Elites, Direct Skip | Johan | ⚠️ In domains, not centralized |
| Direct Mail | Internal | Job | ❌ Not integrated |

---

---

## Part 9: What Was Implemented (Phase 0)

### Completed in This Session

#### 1. Navigation Restructured (3 Levels)

The navigation was reorganized from a flat 5-tab structure to a hierarchical 3-level system:

```
Level 1 (Main Sections):
├── Analytics (active)
├── Salesforce (disabled)
├── Data Silos (disabled)
├── Tools (disabled)
├── Pipelines (disabled)
├── QA (disabled)
└── ML Models (disabled)

Level 2 (Sub-sections) - for Analytics:
├── 8020REI GA4 (active)
└── 8020Roofing GA4 (disabled)

Level 3 (Detail Tabs) - for GA4:
├── Overview, Users, Features, Clients
├── Traffic, Technology, Geography
├── Events, Insights
```

**Files changed:** `src/app/page.tsx`

#### 2. Backend Infrastructure Created

A complete backend API skeleton was created with Fastify:

```
backend/
├── src/
│   ├── index.ts              # Server entry point
│   ├── routes/
│   │   ├── health.ts         # Health check endpoints
│   │   └── analytics.ts      # GA4 analytics endpoints
│   ├── services/
│   │   ├── bigquery.service.ts
│   │   ├── cache.service.ts
│   │   └── index.ts
│   └── config/
│       └── index.ts          # Environment config
├── package.json
├── tsconfig.json
└── .env.example
```

**Features:**
- Fastify with CORS and Helmet
- BigQuery service (skeleton)
- Cache service (Redis + in-memory fallback)
- Health check endpoints
- Analytics endpoints (mirroring frontend API routes)

#### 3. Shared Types Package Created

A shared types package for type consistency between frontend and backend:

```
shared-types/
├── src/
│   ├── index.ts              # Export all types
│   ├── metrics.ts            # Data structure types
│   ├── widget.ts             # Widget system types
│   ├── api.ts                # API request/response types
│   └── navigation.ts         # Navigation types
├── package.json
└── tsconfig.json
```

#### 4. "Coming Soon" Placeholders

Each disabled section now shows a helpful placeholder with:
- The section name
- What data sources will be integrated
- What features are planned

---

## Part 10: What's Next (Action Items)

### Immediate Next Steps (Before Adding Data Sources)

1. **Install Backend Dependencies**
   ```bash
   cd backend && npm install
   ```

2. **Test Backend Locally**
   ```bash
   cd backend && npm run dev
   ```
   Access: http://localhost:4001/api/health

3. **Optional: Connect Frontend to Backend**
   - Update frontend API calls to use backend when available
   - Keep Next.js API routes as fallback

### When Adding New Data Sources

For each new data source, follow this pattern:

1. **Create Service in Backend**
   ```
   backend/src/services/{source}.service.ts
   ```

2. **Create Routes in Backend**
   ```
   backend/src/routes/{source}.ts
   ```

3. **Add Types to Shared Package**
   ```
   shared-types/src/{source}.ts
   ```

4. **Enable Navigation Tab**
   - Update `MAIN_SECTION_TABS` in `page.tsx`
   - Remove `disabled: true` from the section

5. **Create Frontend Components**
   - Tab component in `src/components/dashboard/`
   - Widget components in `src/components/workspace/widgets/`

### Phase-by-Phase Implementation Guide

| Phase | Data Source | Backend Service | Contact | Priority |
|-------|-------------|-----------------|---------|----------|
| 1 | Salesforce | `salesforce.service.ts` | Job/Ignacio | High |
| 2 | 8020Roofing GA4 | Update `bigquery.service.ts` | - | Medium |
| 3 | QA (Back Office) | `qa.service.ts` | Johan/Nicolas | Medium |
| 4 | Skip Trace | `skiptrace.service.ts` | Johan | Medium |
| 5 | Pipelines (AWS) | `aws.service.ts` | Diego | Medium |
| 6 | ML Models | `ml.service.ts` | Eduardo | Lower |
| 7 | Direct Mail | `directmail.service.ts` | Job | Lower |

---

## Part 11: File Reference

### Current Project Structure

```
8020rei-analytics/
├── src/                      # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx          # ✅ Updated with 3-level navigation
│   │   ├── api/              # Current API routes (keep for now)
│   │   └── ...
│   ├── components/
│   │   ├── axis/             # Design system
│   │   ├── dashboard/        # Tab components
│   │   ├── workspace/        # Widget system
│   │   └── charts/           # Chart components
│   ├── lib/
│   │   ├── bigquery.ts       # BigQuery client
│   │   ├── queries.ts        # SQL queries (to migrate)
│   │   └── ...
│   └── types/
│
├── backend/                  # ✅ NEW: Backend API
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── services/
│   │   └── config/
│   └── package.json
│
├── shared-types/             # ✅ NEW: Shared types
│   ├── src/
│   │   ├── metrics.ts
│   │   ├── widget.ts
│   │   ├── api.ts
│   │   └── navigation.ts
│   └── package.json
│
└── Design docs/
    └── Product plan/
        ├── product-ops-dashboard.md    # Original requirements
        └── STRATEGIC_ARCHITECTURE_PLAN.md  # This document
```

---

*Document created: February 11, 2026*
*Last updated: February 11, 2026*
