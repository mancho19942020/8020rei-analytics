# Product Tab Implementation Plan - Tracking Document

**Created:** 2026-02-17
**Last Updated:** 2026-02-17
**Status:** ALL PHASES COMPLETE

---

## Overview

Adding a "Product" subsection under Analytics (Level 2) with two detail tabs (Level 3):
1. **Client Domains** - tracks domain uploads, leads, appointments, deals, revenue
2. **Product Projects** - tracks Jira project status, bugs, team workload, delivery timelines

**Data Source:** BigQuery project `bigquery-467404`, dataset `domain`
**Separate credentials required** (different from GA4 project `web-app-production-451214`)

---

## Phase Status

| Phase | Description | Status | Date | Notes |
|-------|-------------|--------|------|-------|
| 0 | Schema Discovery & Credentials | DONE | 2026-02-17 | Credentials added, Jira schema discovered (jira dataset, not domain), stubs replaced |
| 1 | BigQuery Dual-Project Client | DONE | 2026-02-17 | Added `productBigquery` client and `runProductQuery<T>()` to `src/lib/bigquery.ts` |
| 2 | Type Definitions | DONE | 2026-02-17 | Extended `WidgetType` union (10 new types), created `src/types/product.ts` |
| 3 | SQL Queries | DONE | 2026-02-17 | `src/lib/product-queries.ts` - Client Domains queries live, Product Projects stubs |
| 4 | API Routes | DONE | 2026-02-17 | `product-domains/route.ts` and `product-projects/route.ts` created |
| 5 | Widget Components (10 total) | DONE | 2026-02-17 | All 10 widgets created and exported via index.ts |
| 6 | Layout Configuration | DONE | 2026-02-17 | Layouts + catalogs added to `defaultLayouts.ts` |
| 7 | Tab Components | DONE | 2026-02-17 | `ClientDomainsTab.tsx` and `ProductProjectsTab.tsx` created |
| 8 | Navigation Integration | DONE | 2026-02-17 | Product subsection + detail tabs wired into `page.tsx` |
| 9 | Export Utilities | DONE | 2026-02-17 | 10 export formatters added to `export.ts`, wired into both tabs |

---

## Phase 0: Schema Discovery Queries

Run these in BigQuery console (project `bigquery-467404`):

```sql
-- List all tables + sizes
SELECT table_name, row_count, size_bytes
FROM `bigquery-467404.domain.INFORMATION_SCHEMA.TABLE_STORAGE`;

-- Jira table schemas
SELECT column_name, data_type FROM `bigquery-467404.domain.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name IN ('issues', 'issues_bugs', 'issues_unique') ORDER BY table_name, ordinal_position;

-- Validate record_type values
SELECT DISTINCT record_type, COUNT(*) as cnt
FROM `bigquery-467404.domain.feedback_clients_unique`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY record_type;
```

**Discovered Schemas:**

**Jira tables are in `bigquery-467404.jira` (NOT `domain`)**

- `issues_unique` (13,476 rows) - deduplicated issues with: key, summary, issue_type, status, status_category, priority, assignee_name, due_date, story_points, epic_key, sprint_name, module, origin, resolution_date, updated, created
- `issues_bugs` (1,388 rows) - bug view with: key, summary, origin, priority, status_category, assignee_name, module, created, resolution_date, story_points, business_hours_to_resolve, is_recurrent
- `issues` (47,869 rows) - raw history (not used - use issues_unique instead)

**Status categories:** Done (12,518), To Do (897), In Progress (61)
**Issue types:** New Feature interna (4,282), Subtarea (3,307), Bug (1,388), New Feature externa (1,311), Deuda tecnica (1,164), Ticket Freshdesk (897), Diseño (514), QA Obs (463), Epic (150)
**Bug origins:** null/Unknown (685), Internal User (346), Product - QA (125), Product - Devs (117), Automated Report (114), Clients (1)
**Bug priorities:** Medium (747), Highest (367), High (211), Low (38), Lowest (25)
**record_type values (feedback_clients_unique):** lead (11,294), appointment (69), deal (53)

---

## Files Created / Modified

### New Files
- [x] `src/types/product.ts` - Type definitions
- [x] `src/lib/product-queries.ts` - SQL queries
- [x] `src/app/api/metrics/product-domains/route.ts` - Client Domains API
- [x] `src/app/api/metrics/product-projects/route.ts` - Product Projects API
- [x] `src/components/dashboard/ClientDomainsTab.tsx` - Client Domains tab
- [x] `src/components/dashboard/ProductProjectsTab.tsx` - Product Projects tab
- [x] `src/components/workspace/widgets/DomainActivityOverviewWidget.tsx`
- [x] `src/components/workspace/widgets/DomainLeaderboardWidget.tsx`
- [x] `src/components/workspace/widgets/DomainActivityTrendWidget.tsx`
- [x] `src/components/workspace/widgets/RevenueByDomainWidget.tsx`
- [x] `src/components/workspace/widgets/FlaggedDomainsWidget.tsx`
- [x] `src/components/workspace/widgets/ProjectStatusOverviewWidget.tsx`
- [x] `src/components/workspace/widgets/ProjectsTableWidget.tsx`
- [x] `src/components/workspace/widgets/BugTrackingWidget.tsx`
- [x] `src/components/workspace/widgets/TeamWorkloadWidget.tsx`
- [x] `src/components/workspace/widgets/DeliveryTimelineWidget.tsx`

### Modified Files
- [x] `src/lib/bigquery.ts` - Add second BigQuery client
- [x] `src/types/widget.ts` - Extend WidgetType union
- [x] `src/lib/workspace/defaultLayouts.ts` - Add layouts + catalogs
- [x] `src/app/page.tsx` - Navigation + rendering
- [x] `src/lib/export.ts` - Add export formatters (10 product formatters)
- [x] `src/components/workspace/widgets/index.ts` - Add exports
- [x] `.env.local` - Add product BigQuery credentials
- [x] `.claude/skills/gcp-guardian/SKILL.md` - Add second project rules + fulfillment table restrictions

---

## Cost Management Rules

1. All queries use `WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL N DAY)` (N = 7, 30, or 90)
2. No `SELECT *` - always specify columns
3. `LIMIT` clauses on table/leaderboard queries
4. 5-minute in-memory cache (same as GA4)
5. **NEVER query fulfillment tables** without explicit approval
6. `record_type` filtering on `feedback_clients_unique` to avoid full table scans

---

## Handoff Notes for Next Agent

- Dev server runs on port 4000 - do NOT restart
- Follow Axis Design System: use custom CSS classes, NOT Tailwind color classes
- Follow existing patterns in `ClientsTab.tsx` and `ClientsOverviewWidget.tsx`
- Product data has NO `userType` filter - hide that dropdown when Product subsection is active
- Time filters: 7, 30, 90 days (reuse existing filter component)
- Product Projects tab has placeholder stubs until Jira schema is discovered (Phase 0b)
- TypeScript compiles clean (`npx tsc --noEmit` passes)
- AxisTable widgets use `data as unknown as Record<string, unknown>[]` cast for type compatibility

---

## Completion Summary

All phases are complete. The Product tab is fully wired with:
- Real BigQuery credentials for `bigquery-467404`
- Live SQL queries for both Client Domains (`domain.feedback_clients_unique`) and Product Projects (`jira.issues_unique`, `jira.issues_bugs`)
- 10 widget components with CSV export
- GCP Guardian updated with fulfillment table restrictions

### Verification Checklist
- [ ] Navigate to Analytics > Product > Client Domains - verify data loads
- [ ] Navigate to Analytics > Product > Product Projects - verify data loads
- [ ] Switch time filters (7/30/90 days) - verify data updates
- [ ] Test edit mode (drag/resize widgets)
- [ ] Test CSV export on table widgets
- [ ] Verify no BigQuery errors in browser console
- [ ] Confirm cache works (second load should be instant)
