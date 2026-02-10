# Multi-Source Metrics Hub — Infrastructure Action Plan

**Project:** 8020REI Analytics Hub Evolution
**Version:** 1.0
**Date:** February 10, 2026
**Status:** Planning Phase
**Current State:** Single-source (BigQuery/Google Analytics)
**Target State:** Multi-source metrics aggregation platform

---

## Executive Summary

### Vision

Transform the 8020REI Analytics Dashboard from a single-source BigQuery dashboard into a **unified metrics hub** that aggregates data from multiple platforms and services:

- **Current:** Google Analytics 4 (via BigQuery)
- **Future:** GA4 + Salesforce + HubSpot + Custom APIs + Database Analytics + Third-party integrations

### Core Principle

Build an **abstraction layer** that allows any data source to plug into the system through standardized adapters, without modifying the dashboard UI or core infrastructure.

### Key Outcomes

1. **Extensibility** - Add new data sources without rewriting existing code
2. **Unified View** - Single dashboard showing metrics from all sources
3. **Flexible Queries** - Each source can have custom query logic while maintaining consistent output
4. **Easy Maintenance** - Clear separation of concerns between UI, orchestration, and data sources
5. **Performance** - Parallel querying across sources with intelligent caching

---

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Proposed Multi-Source Architecture](#proposed-multi-source-architecture)
3. [Data Source Abstraction Design](#data-source-abstraction-design)
4. [Implementation Phases](#implementation-phases)
5. [Technical Specifications](#technical-specifications)
6. [Data Source Examples](#data-source-examples)
7. [Migration Strategy](#migration-strategy)
8. [Testing & Validation](#testing--validation)
9. [Future Enhancements](#future-enhancements)

---

## Current Architecture Analysis

### What Exists Today

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD (Frontend)                      │
│                        page.tsx                              │
└────────────────────────┬────────────────────────────────────┘
                         │ fetch('/api/metrics?days=30')
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API ROUTE                                 │
│                /api/metrics/route.ts                         │
│  - Hardcoded to call BigQuery queries                       │
│  - Executes 4 specific queries                              │
│  - Returns formatted JSON                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               BIGQUERY CLIENT                                │
│                src/lib/bigquery.ts                           │
│  - Creates BigQuery SDK client                              │
│  - Runs SQL queries                                          │
│  - Returns raw results                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              GOOGLE BIGQUERY                                 │
│         analytics_489035450.events_*                         │
└─────────────────────────────────────────────────────────────┘
```

### Current File Structure

```
src/lib/
  ├── bigquery.ts          # BigQuery SDK client
  ├── queries.ts           # 4 hardcoded SQL queries
  └── cache.ts             # In-memory caching

src/app/api/
  └── metrics/route.ts     # API endpoint (tightly coupled to BigQuery)
```

### Limitations

1. **Tight Coupling** - API route directly imports BigQuery client
2. **No Abstraction** - Adding a new source requires rewriting the API route
3. **Single Format** - Only supports BigQuery SQL query pattern
4. **No Orchestration** - Can't combine data from multiple sources
5. **Hardcoded Queries** - Query logic mixed with execution logic

---

## Proposed Multi-Source Architecture

### New Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD (Frontend)                      │
│                     (NO CHANGES)                             │
└────────────────────────┬────────────────────────────────────┘
                         │ fetch('/api/metrics?days=30')
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              UNIFIED API ORCHESTRATOR                        │
│                /api/metrics/route.ts                         │
│  - Calls DataSourceRegistry                                  │
│  - Merges results from multiple sources                      │
│  - Applies unified caching                                   │
│  - Returns standardized response                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           DATA SOURCE REGISTRY                               │
│          src/lib/sources/registry.ts                         │
│  - Manages all registered data sources                       │
│  - Executes queries in parallel                              │
│  - Handles source-specific errors                            │
└────────────────────────┬────────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┬─────────────┐
           │             │             │             │
           ▼             ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ BigQuery │  │Salesforce│  │ HubSpot  │  │ Custom   │
    │ Adapter  │  │ Adapter  │  │ Adapter  │  │ API      │
    └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
         │             │             │             │
         ▼             ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ BigQuery │  │Salesforce│  │ HubSpot  │  │PostgreSQL│
    │   SDK    │  │   API    │  │   API    │  │   DB     │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **DataSource Interface** | Standard contract all sources must implement | `src/lib/sources/types.ts` |
| **DataSourceRegistry** | Manages and executes all data sources | `src/lib/sources/registry.ts` |
| **Source Adapters** | Implement DataSource interface for each platform | `src/lib/sources/adapters/` |
| **Query Orchestrator** | Combines results from multiple sources | `src/lib/sources/orchestrator.ts` |
| **Source Config** | Configuration for each data source | `src/lib/sources/config.ts` |

---

## Data Source Abstraction Design

### DataSource Interface

Every data source must implement this standard interface:

```typescript
// src/lib/sources/types.ts

/**
 * Unified data models - what all sources must return
 */
export interface MetricsSummary {
  total_users: number;
  total_events: number;
  page_views: number;
  active_clients: number;
  // Extensible: sources can add custom fields
  [key: string]: number | string;
}

export interface DailyMetric {
  date: string;          // ISO format: "2026-02-10"
  users: number;
  events: number;
  [key: string]: number | string;
}

export interface FeatureMetric {
  feature: string;
  views: number;
  [key: string]: number | string;
}

export interface ClientMetric {
  client: string;
  events: number;
  users: number;
  page_views: number;
  [key: string]: number | string;
}

/**
 * Query parameters - passed to all data sources
 */
export interface QueryParams {
  days: number;           // Time range (7, 30, 90)
  startDate?: string;     // Optional: specific date range
  endDate?: string;
  filters?: Record<string, any>;  // Source-specific filters
}

/**
 * Standard response structure from each data source
 */
export interface DataSourceResponse {
  summary: MetricsSummary;
  dailyMetrics: DailyMetric[];
  featureMetrics: FeatureMetric[];
  clientMetrics: ClientMetric[];
  metadata: {
    source: string;       // "bigquery", "salesforce", etc.
    timestamp: string;
    cached: boolean;
    recordCount: number;
  };
}

/**
 * DataSource Interface - ALL sources must implement this
 */
export interface DataSource {
  // Unique identifier for this source
  id: string;

  // Human-readable name
  name: string;

  // Is this source currently enabled?
  enabled: boolean;

  // Initialize the data source (setup connections, auth, etc.)
  initialize(): Promise<void>;

  // Execute queries and return standardized data
  fetchMetrics(params: QueryParams): Promise<DataSourceResponse>;

  // Health check - is the source accessible?
  healthCheck(): Promise<boolean>;

  // Clean up resources (close connections, etc.)
  cleanup(): Promise<void>;
}
```

### Example: BigQuery Adapter Implementation

```typescript
// src/lib/sources/adapters/BigQueryAdapter.ts

import { BigQuery } from '@google-cloud/bigquery';
import { DataSource, QueryParams, DataSourceResponse } from '../types';

export class BigQueryAdapter implements DataSource {
  id = 'bigquery-ga4';
  name = 'Google Analytics 4 (BigQuery)';
  enabled = true;

  private client: BigQuery;
  private project: string;
  private dataset: string;

  constructor() {
    this.project = process.env.GOOGLE_CLOUD_PROJECT || 'web-app-production-451214';
    this.dataset = process.env.BIGQUERY_DATASET || 'analytics_489035450';
  }

  async initialize(): Promise<void> {
    // Create BigQuery client (same logic as current bigquery.ts)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      this.client = new BigQuery({ projectId: this.project, credentials });
    } else {
      this.client = new BigQuery({ projectId: this.project });
    }

    console.log(`[${this.id}] Initialized BigQuery adapter`);
  }

  async fetchMetrics(params: QueryParams): Promise<DataSourceResponse> {
    const { days } = params;

    // Execute all 4 queries in parallel (same as current implementation)
    const [summaryRows, dailyRows, featureRows, clientRows] = await Promise.all([
      this.runQuery(this.getSummaryQuery(days)),
      this.runQuery(this.getDailyQuery(days)),
      this.runQuery(this.getFeatureQuery(days)),
      this.runQuery(this.getClientQuery(days)),
    ]);

    // Transform BigQuery results to standard format
    return {
      summary: this.transformSummary(summaryRows[0]),
      dailyMetrics: this.transformDaily(dailyRows),
      featureMetrics: this.transformFeature(featureRows),
      clientMetrics: this.transformClient(clientRows),
      metadata: {
        source: this.id,
        timestamp: new Date().toISOString(),
        cached: false,
        recordCount: dailyRows.length,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple query to verify BigQuery is accessible
      const query = `SELECT 1 as health_check`;
      await this.client.query({ query });
      return true;
    } catch (error) {
      console.error(`[${this.id}] Health check failed:`, error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // BigQuery SDK doesn't require explicit cleanup
    console.log(`[${this.id}] Cleanup complete`);
  }

  // Private helper methods
  private async runQuery<T>(sql: string): Promise<T[]> {
    const [rows] = await this.client.query({ query: sql });
    return rows as T[];
  }

  private getSummaryQuery(days: number): string {
    // Move existing query from queries.ts
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
      FROM \`${this.project}.${this.dataset}.events_*\`
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
    `;
  }

  private getDailyQuery(days: number): string {
    // Move from queries.ts
    return `
      SELECT
        event_date,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(*) as events
      FROM \`${this.project}.${this.dataset}.events_*\`
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
      GROUP BY event_date
      ORDER BY event_date
    `;
  }

  private getFeatureQuery(days: number): string {
    // Move from queries.ts
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
        SELECT
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
        FROM \`${this.project}.${this.dataset}.events_*\`
        WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
          AND event_name = 'page_view'
      )
      WHERE page_url IS NOT NULL
      GROUP BY feature
      HAVING feature != 'Other'
      ORDER BY views DESC
    `;
  }

  private getClientQuery(days: number): string {
    // Move from queries.ts
    return `
      SELECT
        REGEXP_EXTRACT(
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
          r'https://([^.]+)\\.8020rei\\.com'
        ) as client,
        COUNT(*) as events,
        COUNT(DISTINCT user_pseudo_id) as users,
        COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views
      FROM \`${this.project}.${this.dataset}.events_*\`
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
      GROUP BY client
      HAVING client IS NOT NULL
      ORDER BY events DESC
      LIMIT 20
    `;
  }

  private transformSummary(row: any): MetricsSummary {
    return {
      total_users: row.total_users || 0,
      total_events: row.total_events || 0,
      page_views: row.page_views || 0,
      active_clients: row.active_clients || 0,
    };
  }

  private transformDaily(rows: any[]): DailyMetric[] {
    return rows.map(row => ({
      date: this.formatDate(row.event_date),
      users: row.users || 0,
      events: row.events || 0,
    }));
  }

  private transformFeature(rows: any[]): FeatureMetric[] {
    return rows.map(row => ({
      feature: row.feature,
      views: row.views || 0,
    }));
  }

  private transformClient(rows: any[]): ClientMetric[] {
    return rows.map(row => ({
      client: row.client,
      events: row.events || 0,
      users: row.users || 0,
      page_views: row.page_views || 0,
    }));
  }

  private formatDate(dateStr: string): string {
    // Convert YYYYMMDD to YYYY-MM-DD
    if (dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
}
```

### Example: Future Salesforce Adapter (Stub)

```typescript
// src/lib/sources/adapters/SalesforceAdapter.ts

import { DataSource, QueryParams, DataSourceResponse } from '../types';

export class SalesforceAdapter implements DataSource {
  id = 'salesforce-crm';
  name = 'Salesforce CRM';
  enabled = false;  // Not yet implemented

  async initialize(): Promise<void> {
    // TODO: Initialize Salesforce API client
    // const client = new jsforce.Connection({
    //   oauth2: { ... },
    // });
    throw new Error('Salesforce adapter not yet implemented');
  }

  async fetchMetrics(params: QueryParams): Promise<DataSourceResponse> {
    // TODO: Query Salesforce API
    // Example metrics:
    // - total_users → number of contacts
    // - total_events → number of opportunities
    // - active_clients → number of accounts
    throw new Error('Salesforce adapter not yet implemented');
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }

  async cleanup(): Promise<void> {
    // TODO: cleanup
  }
}
```

---

## Data Source Registry

### Registry Implementation

```typescript
// src/lib/sources/registry.ts

import { DataSource, QueryParams, DataSourceResponse } from './types';
import { BigQueryAdapter } from './adapters/BigQueryAdapter';
import { SalesforceAdapter } from './adapters/SalesforceAdapter';

class DataSourceRegistry {
  private sources: Map<string, DataSource> = new Map();
  private initialized = false;

  constructor() {
    // Register all available data sources
    this.register(new BigQueryAdapter());
    this.register(new SalesforceAdapter());

    // Add more sources here as they're built:
    // this.register(new HubSpotAdapter());
    // this.register(new PostgreSQLAdapter());
  }

  register(source: DataSource): void {
    this.sources.set(source.id, source);
    console.log(`[Registry] Registered data source: ${source.name} (${source.id})`);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize all enabled sources
    const enabledSources = Array.from(this.sources.values()).filter(s => s.enabled);

    console.log(`[Registry] Initializing ${enabledSources.length} enabled sources...`);

    await Promise.all(
      enabledSources.map(source =>
        source.initialize().catch(error => {
          console.error(`[Registry] Failed to initialize ${source.id}:`, error);
          // Don't throw - allow other sources to initialize
        })
      )
    );

    this.initialized = true;
    console.log('[Registry] All sources initialized');
  }

  async fetchFromAllSources(params: QueryParams): Promise<DataSourceResponse[]> {
    await this.initialize();

    const enabledSources = Array.from(this.sources.values()).filter(s => s.enabled);

    console.log(`[Registry] Fetching metrics from ${enabledSources.length} sources...`);

    // Execute all source queries in parallel
    const results = await Promise.allSettled(
      enabledSources.map(source =>
        source.fetchMetrics(params).catch(error => {
          console.error(`[Registry] ${source.id} failed:`, error);
          throw error;
        })
      )
    );

    // Filter successful results
    const successfulResults: DataSourceResponse[] = results
      .filter((result): result is PromiseFulfilledResult<DataSourceResponse> =>
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    console.log(`[Registry] ${successfulResults.length}/${enabledSources.length} sources succeeded`);

    return successfulResults;
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const healthStatuses: Record<string, boolean> = {};

    for (const [id, source] of this.sources.entries()) {
      if (source.enabled) {
        healthStatuses[id] = await source.healthCheck();
      } else {
        healthStatuses[id] = false;
      }
    }

    return healthStatuses;
  }

  getSource(id: string): DataSource | undefined {
    return this.sources.get(id);
  }

  getAllSources(): DataSource[] {
    return Array.from(this.sources.values());
  }

  getEnabledSources(): DataSource[] {
    return Array.from(this.sources.values()).filter(s => s.enabled);
  }
}

// Singleton instance
export const dataSourceRegistry = new DataSourceRegistry();
```

---

## Query Orchestrator

### Orchestrator Implementation

```typescript
// src/lib/sources/orchestrator.ts

import { dataSourceRegistry } from './registry';
import { QueryParams, DataSourceResponse, MetricsSummary, DailyMetric } from './types';

/**
 * Orchestrates queries across multiple data sources and merges results
 */
export class QueryOrchestrator {
  /**
   * Fetch and merge metrics from all enabled sources
   */
  async fetchMetrics(params: QueryParams) {
    // Get data from all sources
    const responses = await dataSourceRegistry.fetchFromAllSources(params);

    if (responses.length === 0) {
      throw new Error('No data sources available');
    }

    // For now: use only BigQuery (first source)
    // Future: merge multiple sources intelligently
    const primaryResponse = responses[0];

    return {
      success: true,
      data: {
        summary: primaryResponse.summary,
        dailyMetrics: primaryResponse.dailyMetrics,
        featureMetrics: primaryResponse.featureMetrics,
        clientMetrics: primaryResponse.clientMetrics,
      },
      metadata: {
        sources: responses.map(r => r.metadata.source),
        timestamp: new Date().toISOString(),
        cached: false,
      },
    };
  }

  /**
   * Future: Merge data from multiple sources
   * Example: BigQuery user count + Salesforce contact count
   */
  private mergeSummaries(responses: DataSourceResponse[]): MetricsSummary {
    // Simple merge strategy: sum all numeric values
    const merged: MetricsSummary = {
      total_users: 0,
      total_events: 0,
      page_views: 0,
      active_clients: 0,
    };

    for (const response of responses) {
      merged.total_users += response.summary.total_users;
      merged.total_events += response.summary.total_events;
      merged.page_views += response.summary.page_views;
      merged.active_clients += response.summary.active_clients;
    }

    return merged;
  }

  /**
   * Future: Merge daily metrics from multiple sources
   * Example: Combine GA4 daily users + Salesforce daily opportunities
   */
  private mergeDailyMetrics(responses: DataSourceResponse[]): DailyMetric[] {
    const dailyMap = new Map<string, DailyMetric>();

    for (const response of responses) {
      for (const daily of response.dailyMetrics) {
        const existing = dailyMap.get(daily.date);
        if (existing) {
          existing.users += daily.users;
          existing.events += daily.events;
        } else {
          dailyMap.set(daily.date, { ...daily });
        }
      }
    }

    return Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }
}

export const queryOrchestrator = new QueryOrchestrator();
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Build the abstraction layer without breaking existing functionality

**Tasks:**

1. ✅ Create type definitions (`src/lib/sources/types.ts`)
2. ✅ Create DataSourceRegistry (`src/lib/sources/registry.ts`)
3. ✅ Create QueryOrchestrator (`src/lib/sources/orchestrator.ts`)
4. ✅ Create BigQueryAdapter (migrate existing logic)
5. ✅ Update API route to use orchestrator
6. ✅ Test that everything still works exactly as before
7. ✅ No UI changes required

**Files Created:**
```
src/lib/sources/
  ├── types.ts                    # Interfaces and type definitions
  ├── registry.ts                 # Data source management
  ├── orchestrator.ts             # Query coordination
  └── adapters/
      ├── BigQueryAdapter.ts      # Migrated BigQuery logic
      └── README.md               # How to add new adapters
```

**Files Modified:**
```
src/app/api/metrics/route.ts    # Use orchestrator instead of direct BigQuery
```

**Files Deprecated (but not deleted yet):**
```
src/lib/bigquery.ts             # Logic moved to BigQueryAdapter
src/lib/queries.ts              # Logic moved to BigQueryAdapter
```

**Verification:**
- [ ] Dashboard loads without errors
- [ ] All metrics display correctly
- [ ] Time filters work
- [ ] Performance unchanged

---

### Phase 2: Configuration System (Week 3)

**Goal:** Make data sources configurable via environment variables

**Tasks:**

1. ✅ Create source configuration system
2. ✅ Add environment variables for each source
3. ✅ Add admin page to view source status
4. ✅ Add health check API endpoint

**Files Created:**
```
src/lib/sources/config.ts           # Source configuration
src/app/admin/sources/page.tsx      # Admin UI for viewing sources
src/app/api/health/route.ts         # Health check endpoint
```

**Environment Variables:**
```env
# BigQuery (existing)
GOOGLE_CLOUD_PROJECT=web-app-production-451214
BIGQUERY_DATASET=analytics_489035450
GOOGLE_APPLICATION_CREDENTIALS_JSON=...

# Salesforce (future)
SALESFORCE_ENABLED=false
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_INSTANCE_URL=https://8020rei.my.salesforce.com

# HubSpot (future)
HUBSPOT_ENABLED=false
HUBSPOT_API_KEY=...
```

**Admin UI Features:**
- List all registered data sources
- Show enabled/disabled status
- Display health check results
- Show last successful query timestamp

---

### Phase 3: Second Data Source (Week 4-5)

**Goal:** Prove the architecture works by adding a real second source

**Options (choose one based on business priority):**

**Option A: Salesforce Integration**
- Track CRM metrics (opportunities, contacts, accounts)
- Show lead conversion funnel
- Display sales pipeline data

**Option B: PostgreSQL Internal Database**
- Query 8020REI's own database for metrics
- User registration trends
- Feature adoption by cohort
- Custom business logic

**Option C: HubSpot Marketing**
- Email campaign metrics
- Form submission data
- Marketing qualified leads

**Recommended:** Start with **PostgreSQL** (easiest to implement and test)

**Tasks:**
1. ✅ Create new adapter (e.g., `PostgreSQLAdapter.ts`)
2. ✅ Implement DataSource interface
3. ✅ Add to registry
4. ✅ Test in isolation
5. ✅ Enable alongside BigQuery
6. ✅ Verify data merges correctly

---

### Phase 4: Multi-Source Dashboard (Week 6)

**Goal:** Update UI to show metrics from multiple sources

**Tasks:**

1. ✅ Add source filter dropdown (show metrics by source)
2. ✅ Add "All Sources" combined view
3. ✅ Show source badges on metrics (e.g., "GA4", "CRM")
4. ✅ Add comparison view (BigQuery vs Salesforce)
5. ✅ Update charts to show multi-source data

**UI Enhancements:**

```tsx
// Example: Source filter dropdown
<AxisSelect
  value={selectedSource}
  onChange={setSelectedSource}
  options={[
    { value: 'all', label: 'All Sources' },
    { value: 'bigquery-ga4', label: 'Google Analytics' },
    { value: 'salesforce-crm', label: 'Salesforce CRM' },
    { value: 'postgresql-db', label: 'Internal Database' },
  ]}
/>

// Example: Source badge on metric
<Scorecard
  label="Total Users"
  value={1234}
  source="GA4"  // New prop
  color="success"
/>
```

---

### Phase 5: Advanced Features (Week 7+)

**Goal:** Add advanced multi-source capabilities

**Features:**

1. **Cross-Source Correlations**
   - GA4 users who became Salesforce leads
   - Feature usage → conversion rate

2. **Custom Dashboards**
   - Users can create custom views
   - Choose which sources to display
   - Save dashboard configurations

3. **Scheduled Reports**
   - Email digests combining all sources
   - Weekly/monthly summaries
   - Custom recipient lists

4. **Data Warehousing**
   - Store aggregated data in own database
   - Historical trend analysis
   - Reduce costs by caching source queries

---

## Technical Specifications

### API Route Changes

**Before (current):**

```typescript
// src/app/api/metrics/route.ts
import { bigquery } from '@/lib/bigquery';
import { getMetricsQuery, getUsersByDayQuery } from '@/lib/queries';

export async function GET(request: NextRequest) {
  const days = parseInt(searchParams.get('days') || '30');

  const [metrics, usersByDay] = await Promise.all([
    runQuery(getMetricsQuery(days)),
    runQuery(getUsersByDayQuery(days)),
  ]);

  return NextResponse.json({ success: true, data: { metrics, usersByDay } });
}
```

**After (multi-source):**

```typescript
// src/app/api/metrics/route.ts
import { queryOrchestrator } from '@/lib/sources/orchestrator';

export async function GET(request: NextRequest) {
  const days = parseInt(searchParams.get('days') || '30');
  const sourceFilter = searchParams.get('source'); // Optional: filter by source

  const result = await queryOrchestrator.fetchMetrics({ days });

  return NextResponse.json(result);
}
```

### Caching Strategy

**Multi-Source Cache Keys:**

```typescript
// Current: Single cache key per time range
const cacheKey = `metrics:${days}`;

// New: Cache key per source + time range
const cacheKeys = {
  bigquery: `metrics:bigquery-ga4:${days}`,
  salesforce: `metrics:salesforce-crm:${days}`,
  combined: `metrics:all-sources:${days}`,
};
```

**Cache Invalidation:**
- Each source cached independently (5-10 min TTL)
- Combined view cached separately (1 min TTL)
- Manual invalidation API: `POST /api/cache/clear`

---

## Data Source Examples

### Example 1: PostgreSQL Adapter

```typescript
// src/lib/sources/adapters/PostgreSQLAdapter.ts

import { Pool } from 'pg';
import { DataSource, QueryParams, DataSourceResponse } from '../types';

export class PostgreSQLAdapter implements DataSource {
  id = 'postgresql-db';
  name = 'Internal Database';
  enabled = true;

  private pool: Pool;

  async initialize(): Promise<void> {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async fetchMetrics(params: QueryParams): Promise<DataSourceResponse> {
    const { days } = params;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Example: Query user signups
    const summaryQuery = `
      SELECT
        COUNT(DISTINCT user_id) as total_users,
        COUNT(*) as total_events,
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) as page_views,
        COUNT(DISTINCT client_id) as active_clients
      FROM analytics_events
      WHERE created_at >= $1
    `;

    const summaryResult = await this.pool.query(summaryQuery, [startDate]);

    return {
      summary: {
        total_users: summaryResult.rows[0].total_users,
        total_events: summaryResult.rows[0].total_events,
        page_views: summaryResult.rows[0].page_views,
        active_clients: summaryResult.rows[0].active_clients,
      },
      dailyMetrics: [],  // TODO: implement
      featureMetrics: [],  // TODO: implement
      clientMetrics: [],  // TODO: implement
      metadata: {
        source: this.id,
        timestamp: new Date().toISOString(),
        cached: false,
        recordCount: 0,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }
}
```

---

## Migration Strategy

### Step-by-Step Migration Plan

**Step 1: Create abstractions (no functionality change)**
```bash
# Create new files, don't modify existing ones yet
mkdir -p src/lib/sources/adapters
touch src/lib/sources/{types.ts,registry.ts,orchestrator.ts}
touch src/lib/sources/adapters/BigQueryAdapter.ts
```

**Step 2: Implement BigQueryAdapter**
- Copy logic from `bigquery.ts` and `queries.ts`
- Implement DataSource interface
- Test in isolation

**Step 3: Update API route**
```typescript
// Before
import { bigquery } from '@/lib/bigquery';

// After
import { queryOrchestrator } from '@/lib/sources/orchestrator';
```

**Step 4: Deploy and verify**
- Deploy to Vercel (or test locally)
- Confirm everything works
- Monitor for errors

**Step 5: Deprecate old files**
```bash
# Rename to indicate deprecated
mv src/lib/bigquery.ts src/lib/bigquery.ts.deprecated
mv src/lib/queries.ts src/lib/queries.ts.deprecated
```

**Step 6: Add second source**
- Create new adapter
- Test with source disabled
- Enable and test combined view
- Deploy

---

## Testing & Validation

### Testing Checklist

**Phase 1 Testing (Foundation):**
- [ ] BigQueryAdapter can initialize
- [ ] BigQueryAdapter can fetch metrics
- [ ] Results match old implementation exactly
- [ ] Health check works
- [ ] Registry can manage sources
- [ ] Orchestrator can call registry
- [ ] API route returns same response format

**Phase 2 Testing (Multi-Source):**
- [ ] Second adapter initializes
- [ ] Both sources query in parallel
- [ ] Results merge correctly
- [ ] Health checks show status
- [ ] Errors in one source don't break the other
- [ ] Cache works per source

**Performance Testing:**
- [ ] Response time unchanged (should be same or better due to parallel queries)
- [ ] Memory usage acceptable
- [ ] Cache reduces BigQuery costs
- [ ] No memory leaks in long-running server

---

## Future Enhancements

### Potential Data Sources

1. **Salesforce CRM**
   - Opportunities, leads, accounts
   - Sales pipeline metrics
   - Customer lifecycle stages

2. **HubSpot Marketing**
   - Email campaigns
   - Landing page conversions
   - Marketing qualified leads

3. **Stripe Payments**
   - Revenue metrics
   - Subscription data
   - Churn analysis

4. **Zendesk Support**
   - Support ticket volume
   - Response times
   - Customer satisfaction scores

5. **Intercom Messaging**
   - Message volume
   - User engagement
   - Bot vs human conversations

6. **Custom APIs**
   - Internal microservices
   - Third-party tools
   - Partner integrations

### Advanced Features

1. **AI-Powered Insights**
   - Automatic anomaly detection
   - Trend prediction
   - Correlation discovery across sources

2. **Real-Time Streaming**
   - WebSocket updates
   - Live data refresh without page reload

3. **Custom Calculations**
   - User-defined formulas combining sources
   - Derived metrics (e.g., conversion rate = leads / users)

4. **Export & Reporting**
   - PDF reports
   - Excel exports
   - Scheduled email digests

---

## Getting Started

### For the Next Developer

**To begin Phase 1 implementation:**

1. Read this document completely
2. Review current architecture in:
   - `src/lib/bigquery.ts`
   - `src/lib/queries.ts`
   - `src/app/api/metrics/route.ts`
3. Create branch: `feature/multi-source-architecture`
4. Start with `src/lib/sources/types.ts`
5. Follow Phase 1 tasks in order
6. Test thoroughly before moving to Phase 2

**Key Principles:**
- Don't break existing functionality
- Each phase should be independently testable
- Deploy and validate before next phase
- Document all new data sources

---

## Questions & Answers

**Q: Will this break the current dashboard?**
A: No. Phase 1 is a refactor with zero functionality change. The dashboard continues working exactly as before.

**Q: How long will this take?**
A: Phase 1 (foundation): 1-2 weeks. Adding second source: 1-2 weeks. Full multi-source UI: 4-6 weeks total.

**Q: What if a data source fails?**
A: The orchestrator uses `Promise.allSettled()`, so failures in one source don't crash the others. The dashboard shows data from successful sources.

**Q: Can we add sources without code changes?**
A: Not yet in Phase 1. Future phases will add configuration-based sources (connect via UI, no code needed). For now, each source requires a new adapter class.

**Q: How does caching work with multiple sources?**
A: Each source is cached independently. The orchestrator can optionally cache the combined result separately.

**Q: What about data consistency?**
A: Different sources may have different data freshness (GA4 is 24-48 hours delayed, Salesforce is real-time). The UI should show each source's timestamp.

---

**Document Version:** 1.0
**Created:** February 10, 2026
**Status:** Ready for Review

**Next Steps:**
1. Review this plan with stakeholders
2. Prioritize which data sources to add first
3. Allocate development resources
4. Begin Phase 1 implementation
