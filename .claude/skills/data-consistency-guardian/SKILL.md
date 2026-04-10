# Data Consistency Guardian

**Enforces data source alignment, terminology consistency, and metric integrity across the DM Campaign section (Operational Health + Business Results).**

This agent ensures that every metric in the platform pulls from the correct source-of-truth table, uses the correct terminology, and is documented with tooltips that explain what it counts. It prevents subtle bugs where a widget silently sources data from the wrong table or confuses "Sent" (mail pieces) with "Mailed" (unique properties).

---

## Role Summary

| Skill | Responsibility |
|-------|---------------|
| `data-consistency-guardian` | **Audit, supervise, and enforce data source + terminology compliance** |
| `dashboard-builder` | Build new dashboard features correctly (architecture, layout, components) |
| `design-kit-guardian` | Enforce visual design system compliance (colors, components, dark mode) |

The data consistency guardian validates the **data layer** — what tables a metric reads from and how it's labeled. The design kit guardian validates the **presentation layer** — how it looks. Both run after new features are built.

---

## When to Invoke

### Automatically (MUST run after these changes):
1. **After creating or modifying any widget** in `src/components/workspace/widgets/Dm*.tsx` or `Rr*.tsx`
2. **After modifying API routes** in `src/app/api/dm-conversions/` or `src/app/api/rapid-response/`
3. **After adding a new metric, column, or KPI card** to any DM Campaign widget
4. **After modifying type definitions** in `src/types/dm-conversions.ts` or `src/types/rapid-response.ts`

### On demand:
- `"Run a data consistency audit"`
- `"Check if this new metric is sourced correctly"`
- `"Verify terminology across DM tabs"`
- `"Audit tooltip coverage"`

---

## Rule 1: Data Source Alignment (CRITICAL)

Every metric MUST pull from its designated source-of-truth table. This is the single most important rule in the DM Campaign section.

### Data Source Authority Map

| Metric | Authoritative Table | Column / Derivation | API Route | Section |
|--------|-------------------|--------------------|-----------|---------| 
| Unique properties mailed | `dm_client_funnel` (preferred) or `dm_property_conversions` (fallback) | `total_properties_mailed` or `COUNT(DISTINCT property_id)` | `/api/dm-conversions` | Business Results |
| Total mail pieces sent (campaign-level) | `rr_campaign_snapshots` | `total_sent` | `/api/rapid-response` | Operational Health |
| Total mail pieces sent (volume tracking) | **`dm_volume_summary`** | `SUM(daily_sends)` for period, `cumulative_sends` for lifetime | `/api/rapid-response` | Operational Health |
| Total mail pieces delivered (lifetime) | `rr_campaign_snapshots` or `dm_volume_summary` | `total_delivered` or `cumulative_delivered` | `/api/rapid-response` | Operational Health |
| Leads | `dm_property_conversions` | `became_lead_at IS NOT NULL AND became_lead_at > first_sent_date` | `/api/dm-conversions` | Business Results |
| Appointments | `dm_property_conversions` | `became_appointment_at IS NOT NULL AND became_appointment_at > first_sent_date` | `/api/dm-conversions` | Business Results |
| Contracts | `dm_property_conversions` | `became_contract_at IS NOT NULL AND became_contract_at > first_sent_date` | `/api/dm-conversions` | Business Results |
| Deals | `dm_property_conversions` | `became_deal_at IS NOT NULL AND became_deal_at > first_sent_date` | `/api/dm-conversions` | Business Results |
| Revenue | `dm_property_conversions` | `deal_revenue` (only where `became_deal_at > first_sent_date`) | `/api/dm-conversions` | Business Results |
| ROAS | Computed | `revenue / cost` with confidence flags | `/api/dm-conversions` | Business Results |
| Cost (business) | `dm_client_funnel` | `total_cost` | `/api/dm-conversions` | Business Results |
| Cost (operational) | `rr_daily_metrics` | `cost_total`, `avg_unit_cost` | `/api/rapid-response` | Operational Health |
| Delivery rate | `rr_daily_metrics` | `delivery_rate_30d` | `/api/rapid-response` | Operational Health |
| PCM alignment | `rr_pcm_alignment` | multiple columns | `/api/rapid-response` | Operational Health |
| Template conversions | `dm_property_conversions` | GROUP BY template_id with `> first_sent_date` filter | `/api/dm-templates` | Business Results |
| Template metadata | `dm_template_performance` | `avg_days_to_lead`, `campaigns_using` ONLY (never use conversion counts) | `/api/dm-templates` | Business Results |
| Q2 goal progress | **`dm_volume_summary`** | `SUM(daily_sends) WHERE date >= Q2_START` | `/api/rapid-response?type=q2-goal` | Operational Health |

### The Critical Trap: `rr_daily_metrics` delivered > sent

`rr_daily_metrics` counts `sends_total` by **created_at** (when dispatched) but `delivered_count` by **delivery_date** (when USPS confirmed). A piece sent March 15 that delivers April 5 shows: March = +1 sent / +0 delivered, April = +0 sent / +1 delivered. **NEVER compare sent and delivered from `rr_daily_metrics` in the same time window.** Use it ONLY for daily send volume tracking and status breakdowns. For lifetime sent/delivered comparisons, use `rr_campaign_snapshots`, `dm_client_funnel`, or `dm_volume_summary`.

### The Critical Trap: `dm_template_performance` convenience columns

`dm_template_performance` has `leads_generated`, `deals_generated`, `total_revenue` columns. **NEVER use these for display.** They are pre-aggregated without the `> first_sent_date` filter. Always compute template conversions from `dm_property_conversions` grouped by `template_id` with the `> first_sent_date` filter. Use `dm_template_performance` ONLY for metadata: `avg_days_to_lead`, `campaigns_using`, `template_type`.

### The Critical Trap: `dm_client_funnel` convenience columns

`dm_client_funnel` has `leads`, `appointments`, `contracts`, `deals`, and `total_revenue` columns. **NEVER use these for conversion counts.**

Why: These convenience columns do NOT apply the same integrity filtering as `dm_property_conversions`. They don't exclude `pre_send` false positives (conversions that happened before the first mail was sent), don't exclude backfilled records, and don't apply `conversionConfidence` filtering. The numbers will silently diverge.

```tsx
// ❌ WRONG — Reading conversions from dm_client_funnel
const result = await runAuroraQuery(`
  SELECT domain, leads, deals, total_revenue
  FROM dm_client_funnel
  WHERE date = (SELECT MAX(date) FROM dm_client_funnel)
`);

// ✅ CORRECT — Reading conversions from dm_property_conversions
const result = await runAuroraQuery(`
  SELECT
    domain,
    COUNT(DISTINCT CASE WHEN became_lead_at IS NOT NULL
      AND became_lead_at > first_sent_date THEN property_id END) as leads,
    COUNT(DISTINCT CASE WHEN became_deal_at IS NOT NULL
      AND became_deal_at > first_sent_date THEN property_id END) as deals,
    COALESCE(SUM(CASE WHEN deal_revenue > 0
      AND became_deal_at > first_sent_date THEN deal_revenue ELSE 0 END), 0) as total_revenue
  FROM dm_property_conversions
  WHERE domain NOT IN (${SEED_DOMAINS})
  GROUP BY domain
`);
```

**Reference:** See `src/app/api/dm-conversions/route.ts` lines 184-234 — the `getMergedClientData()` function demonstrates the correct pattern: `dm_client_funnel` for operational fields (mailed, sends, delivered, cost), `dm_property_conversions` for all conversions.

### NEVER mix `rr_*` and `dm_*` tables in a single query

Operational Health and Business Results use different data pipelines with different update frequencies. Joining them in a single query creates timing mismatches.

```tsx
// ❌ WRONG — Mixing rr_ and dm_ tables
SELECT rr.total_sent, dm.leads
FROM rr_campaign_snapshots rr
JOIN dm_property_conversions dm ON rr.domain = dm.domain

// ✅ CORRECT — Fetch separately, merge in application code
const [rrData, dmData] = await Promise.all([
  runAuroraQuery(`SELECT ... FROM rr_campaign_snapshots ...`),
  runAuroraQuery(`SELECT ... FROM dm_property_conversions ...`),
]);
// Merge by domain in TypeScript
```

---

## Rule 2: Terminology Consistency (MANDATORY)

These terms have precise definitions in this platform. Using the wrong term creates user confusion and makes cross-tab comparisons unreliable.

### Term Definitions

| Term | Definition | Counts | Source | Used In |
|------|-----------|--------|--------|---------|
| **Sent** | Total individual mail pieces dispatched (one property mailed 3 times = 3) | Mail pieces | `rr_campaign_snapshots.total_sent` | Operational Health |
| **Mailed** | Unique properties that received at least one mail piece (one property mailed 3 times = 1) | Unique properties | `dm_client_funnel.total_properties_mailed` or `COUNT(DISTINCT property_id)` | Business Results |
| **Delivered** (operational) | Mail pieces confirmed delivered by postal service | Mail pieces | `rr_campaign_snapshots.total_delivered` or `rr_daily_metrics.delivered_count` | Operational Health |
| **Delivered** (business) | Properties with at least one delivered mail piece | Per-property | `dm_property_conversions.total_delivered` | Business Results |
| **Cost** | Total mailing cost across ALL sends, not unique properties | Dollars | `dm_client_funnel.total_cost` or `rr_daily_metrics.cost_total` | Both sections |
| **Leads** | Properties that became Lead status AFTER first send date | Unique properties | `dm_property_conversions` filtered | Business Results |

### Enforcement Rules

```tsx
// ❌ WRONG — Labeling unique properties as "Sent"
{ header: 'Sent', accessorKey: 'totalMailed' }  // Confuses pieces with properties

// ✅ CORRECT — "Mailed" for unique properties
{ header: 'Mailed', accessorKey: 'totalMailed' }

// ❌ WRONG — Labeling mail pieces as "Mailed"
{ header: 'Mailed', accessorKey: 'totalSent' }  // This counts pieces, not properties

// ✅ CORRECT — "Sent" for total mail pieces
{ header: 'Sent', accessorKey: 'totalSent' }
```

**Example from the codebase (correct):**
- Reno sent **714 mail pieces** to **604 unique properties** → Sent = 714, Mailed = 604
- A property mailed 3 times → Mailed = 1, Sent = 3

---

## Rule 3: Tooltip Presence (MANDATORY)

Any volume-related column in a table or metric card MUST have a tooltip explaining what it counts. This is non-negotiable — users need to know exactly what a number means.

### Columns That MUST Have Tooltips

| Column | Required Tooltip Content |
|--------|------------------------|
| Sent | Must state: counts total mail pieces, includes re-sends to same property |
| Mailed | Must state: counts unique properties, a property mailed N times counts as 1 |
| Delivered | Must state: whether it counts mail pieces (operational) or properties (business) |
| Cost | Must state: cost across all sends, not per unique property |
| Revenue | Must state: only from deals that closed after first send date |
| ROAS | Must state: requires 3+ deals for `confident` rating |
| Leads / Appointments / Contracts / Deals | Must state: only counts conversions after first send date |
| Any rate (delivery rate, conversion rate) | Must state: the numerator and denominator |

### Implementation Pattern

```tsx
// ✅ CORRECT — Using headerTooltip on AxisTable columns
{
  header: 'Mailed',
  accessorKey: 'totalMailed',
  headerTooltip: 'Unique properties that received at least one mail piece. A property mailed 3 times counts as 1.',
}

// ✅ CORRECT — Cross-section reference tooltip
{
  header: 'Sent',
  accessorKey: 'totalSent',
  headerTooltip: 'Total mail pieces sent (includes multiple sends to the same property). Not the same as "Mailed" in Business Results, which counts unique properties.',
}
```

### Existing Good Examples (reference implementations)

- `src/components/workspace/widgets/RrCampaignTableWidget.tsx` line 117 — Sent tooltip with cross-section reference
- `src/components/workspace/widgets/DmClientPerformanceWidget.tsx` line 136 — Mailed tooltip

---

## Rule 4: Cross-Section Consistency

When the same concept appears in both Operational Health and Business Results, it MUST be handled carefully.

### Known Cross-Section Overlaps

| Concept | Operational Health Source | Business Results Source | Same numbers? | Action Required |
|---------|------------------------|----------------------|---------------|-----------------|
| Delivered | `rr_campaign_snapshots.total_delivered` (mail pieces) | `dm_property_conversions.total_delivered` (per-property) | **No** — pieces vs properties | Tooltip on BOTH sides explaining the difference |
| Cost | `rr_daily_metrics.cost_total` (daily operational) | `dm_client_funnel.total_cost` (cumulative) | **May differ** — date range + aggregation | Tooltip explaining time range context |
| Campaign count | `rr_campaign_snapshots` (active campaigns by snapshot) | `dm_client_funnel.active_campaigns` | **May differ** — different snapshot timing | Document update frequency |

### Rules

- If numbers will differ between sections for the same concept: **BOTH sections MUST have tooltips explaining why**
- If a metric appears in only one section: no cross-reference needed
- NEVER assume a user will only look at one section. Users compare tabs.

```tsx
// ❌ WRONG — "Delivered" without clarifying which kind
{ header: 'Delivered', accessorKey: 'totalDelivered' }

// ✅ CORRECT — Tooltip specifies what "Delivered" means in this context
{
  header: 'Delivered',
  accessorKey: 'totalDelivered',
  headerTooltip: 'Total mail pieces confirmed delivered. This counts individual pieces, not unique properties. See Business Results for per-property delivery counts.',
}
```

---

## Rule 5: New Metric Conflict Detection

Before adding any new metric, column, or KPI card, run through this checklist:

### Pre-Addition Checklist

- [ ] **Name check:** Does a metric with this name (or a similar name) already exist in either section?
  - Search: `grep -r "header:.*'MetricName'" src/components/workspace/widgets/`
  - Search: `grep -r "label:.*MetricName" src/components/workspace/widgets/`
- [ ] **Source check:** Is the data source table correct per the Authority Map (Rule 1)?
- [ ] **Definition check:** If the metric name already exists, does the new usage match the existing definition exactly?
- [ ] **Counting methodology:** Does the new metric count the same unit (mail pieces, unique properties, dollars) as any similar existing metric?
- [ ] **If introducing a new counting methodology:** Use a distinct name. Do NOT reuse an existing metric name with a different counting method.

### Conflict Resolution

If a naming conflict is found:

```tsx
// ❌ WRONG — Reusing "Delivered" with different semantics
// Operational Health already has "Delivered" = mail pieces
// Adding "Delivered" in Business Results counting unique properties creates confusion

// ✅ CORRECT — Use a distinct name
// "Properties delivered" or "Delivery reach" for the unique-property version
```

---

## Audit Workflow

### Step 1: Scan for Source-of-Truth Violations

Check that no widget or API route reads conversion counts from `dm_client_funnel`:

```
Pattern: dm_client_funnel.*leads|dm_client_funnel.*deals|dm_client_funnel.*appointments|dm_client_funnel.*contracts|dm_client_funnel.*revenue
Files: src/app/api/**/*.ts
Purpose: Find conversion metrics incorrectly sourced from dm_client_funnel instead of dm_property_conversions
```

Exception: The `dm_client_funnel` table creation and population code in the monolith is fine — the violation is in READING these columns for display.

### Step 2: Scan for Terminology Violations

```
Pattern: header.*['"]Sent['"].*totalMailed|header.*['"]Mailed['"].*totalSent
Files: src/components/workspace/widgets/**/*.tsx
Purpose: Find label/data mismatches — "Sent" label with mailed data or vice versa
```

```
Pattern: header.*['"]Sent['"]|header.*['"]Mailed['"]
Files: src/components/workspace/widgets/**/*.tsx
Purpose: List all uses of "Sent" and "Mailed" to verify they match the term definitions
```

### Step 3: Scan for Missing Tooltips

```
Pattern: header:.*(?!.*headerTooltip).*(Sent|Mailed|Delivered|Cost|Revenue|ROAS|Leads|Deals)
Files: src/components/workspace/widgets/**/*.tsx
Purpose: Find volume-related columns without headerTooltip
```

Also check MetricCard components:
```
Pattern: <MetricCard.*label=.*(sent|mailed|delivered|cost|revenue)
Files: src/components/workspace/widgets/**/*.tsx
Purpose: Find metric cards with volume labels — verify tooltip or description prop exists
```

### Step 4: Verify Cross-Section Documentation

For each term that appears in both sections, verify:
1. Both have `headerTooltip` explaining the definition in that context
2. At least one references the other section (e.g., "Not the same as X in Y section")

### Step 5: Check Type Alignment

Verify that TypeScript types match the authority map:

```
Pattern: leads.*number|deals.*number|appointments.*number|contracts.*number|revenue.*number
Files: src/types/dm-conversions.ts, src/types/rapid-response.ts
Purpose: Ensure conversion fields only appear in dm-conversions types, not rapid-response types
```

---

## Audit Report Format

Generate `Design docs/data-integrity/DATA_CONSISTENCY_AUDIT.md`:

```markdown
# Data Consistency Audit

**Date:** [current date]
**Scope:** DM Campaign section (Operational Health + Business Results)

---

## Summary

| Rule | Pass | Violations | Notes |
|------|------|------------|-------|
| 1. Data Source Alignment | pass/fail | N | ... |
| 2. Terminology Consistency | pass/fail | N | ... |
| 3. Tooltip Presence | pass/fail | N | ... |
| 4. Cross-Section Consistency | pass/fail | N | ... |
| 5. New Metric Conflicts | pass/fail | N | ... |

---

## Violations

### [Rule N: Rule Name]

#### [file:line_number]
- **Violation:** Description
- **Rule:** Which rule and why
- **Fix:** Specific correction

---

## Actions Required

1. [ ] Fix violation in [file]
2. [ ] Add tooltip to [column] in [widget]
3. [ ] Change label from [X] to [Y] in [widget]
```

---

## Supervision Checklist (for New Features)

Run this checklist after creating or modifying any DM Campaign metric, widget, or API endpoint:

### Data Source
- [ ] Conversion counts (leads, appointments, contracts, deals) come from `dm_property_conversions` ONLY
- [ ] Conversion queries include `> first_sent_date` filter (excludes pre-send false positives)
- [ ] Operational fields (mailed, sends, delivered, cost) come from the correct table per the Authority Map
- [ ] No `rr_*` and `dm_*` tables joined in a single SQL query

### Terminology
- [ ] "Sent" label is only used for total mail pieces (not unique properties)
- [ ] "Mailed" label is only used for unique properties (not total pieces)
- [ ] "Delivered" has a tooltip specifying whether it counts pieces or properties
- [ ] Column names in code match their label semantics (e.g., `totalMailed` maps to "Mailed")

### Tooltips
- [ ] Every volume column (Sent, Mailed, Delivered) has `headerTooltip`
- [ ] Every financial column (Cost, Revenue, ROAS) has `headerTooltip`
- [ ] Every conversion column (Leads, Appointments, Contracts, Deals) has `headerTooltip`
- [ ] Every rate column has `headerTooltip` explaining numerator and denominator
- [ ] Tooltips explain what unit is being counted (mail pieces vs unique properties vs dollars)

### Cross-Section
- [ ] If metric name exists in the other section, both sides have tooltips explaining the difference
- [ ] No metric silently uses a different definition than its counterpart in the other section

### Conflict Prevention
- [ ] New metric name doesn't collide with an existing metric in either section
- [ ] If same name is reused, the counting methodology is identical

---

## Known Data Gaps (Accepted Limitations)

These are documented, known issues — NOT violations. Do not flag them during audits.

| Gap | Description | Status | Impact |
|-----|------------|--------|--------|
| `dm_property_conversions` undercounting | Sync from monolith captures ~28% of true volume. Hall of Fame (44K sends) is nearly absent. | Pending — PR #1863 fix merged, awaiting deployment + re-sync | Business Results shows lower totals than reality |
| `rr_daily_metrics` limited history | Only has data from March 2026 onward (Layer 1 sync deployed recently) | By design — accumulating over time | Operational Health trend charts have limited historical range |
| Zero Smart Drop data | `campaign_type = 'smartdrop'` returns 0 rows in all tables | Smart Drop not yet used in production | Campaign type breakdown will show 100% Rapid Response until Smart Drop launches |
| Pre-send exclusions | Properties with conversions before first send are excluded from counts | Intentional — these are false positives | Conversion counts may be lower than raw DB counts |
| ROAS `low_sample` flags | ROAS with < 3 deals is marked `low_sample`, not `confident` | By design — Lauren's meeting requirement | Some clients show ROAS with confidence warnings |

When building new features, verify that your widget handles these gaps gracefully (e.g., shows a warning badge, not a broken state).

---

## Key File Locations

| File | Purpose |
|------|---------|
| `src/app/api/dm-conversions/route.ts` | Business Results API — source-of-truth pattern at line 184 |
| `src/app/api/rapid-response/route.ts` | Operational Health API — campaign snapshots and daily metrics |
| `src/app/api/dm-conversions/get-alerts-data.ts` | Business alerts data aggregation |
| `src/types/dm-conversions.ts` | Type definitions for Business Results (DmFunnelOverview, DmClientPerformanceRow, etc.) |
| `src/types/rapid-response.ts` | Type definitions for Operational Health (RrCampaignSnapshot, RrDailyMetric, etc.) |
| `src/components/workspace/widgets/Dm*.tsx` | Business Results widgets (8 files) |
| `src/components/workspace/widgets/Rr*.tsx` | Operational Health widgets (8 files) |
| `src/components/dashboard/RapidResponseTab.tsx` | Tab component managing both sub-tabs |
| `src/lib/navigation.ts` | DM_CAMPAIGN_SUB_TABS definition |
| `Design docs/data-integrity/DATA_CONSISTENCY_AUDIT.md` | Audit report output (generated by this skill) |

---

## Quick Reference: Source of Truth by Section

```
OPERATIONAL HEALTH                    BUSINESS RESULTS
(system status, mail volume)          (conversions, revenue, ROAS)
                                     
rr_campaign_snapshots                 dm_property_conversions ← SOURCE OF TRUTH
  → total_sent (mail pieces)            → leads, appointments, contracts, deals
  → total_delivered (mail pieces)       → deal_revenue
  → status, campaign_type               → conversionConfidence flags
                                        → attribution_status
rr_daily_metrics                     
  → sends_total, delivered_count      dm_client_funnel
  → cost_total, avg_unit_cost           → total_properties_mailed (unique props)
  → delivery_rate_30d                   → total_sends, total_delivered
                                        → total_cost
rr_pcm_alignment                       → ⚠️ leads/deals/revenue columns EXIST
  → stale records, orphaned orders       but NEVER use them (Rule 1)
  → sync gap                          
                                      dm_template_performance
                                        → per-template sends, leads, deals
```

---

## Relationship with Other Skills

```
User builds a new DM metric/widget
         |
         v
  dashboard-builder          <-- How to build it (architecture, layout, grid)
         |
         v
  data-consistency-guardian  <-- Is the data sourced correctly? Right terms? Tooltips?
         |
         v
  design-kit-guardian        <-- Is it using the design system correctly? (colors, components)
         |
         v
  deploy-to-cloud-run       <-- Ship it
```

**Handoff rules:**
- `dashboard-builder` runs first (structure and architecture)
- `data-consistency-guardian` runs second (data integrity)
- `design-kit-guardian` runs third (visual compliance)
- All three MUST pass before presenting work as complete

---

**Created:** 2026-04-10
**Last Updated:** 2026-04-10 (v2 — added dm_volume_summary, delivered>sent trap, dm_template_performance trap)
