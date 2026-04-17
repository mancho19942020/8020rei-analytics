# Data Consistency Guardian

**Enforces data source alignment, terminology consistency, and metric integrity across the DM Campaign section (Operational Health + Business Results + PCM & Profitability).**

This agent ensures that every metric in the platform pulls from the correct source-of-truth table, uses the correct terminology, and is documented with tooltips that explain what it counts. It prevents subtle bugs where a widget silently sources data from the wrong table or confuses "Sent" (mail pieces) with "Mailed" (unique properties).

---

## THE GOLDEN RULE (NON-NEGOTIABLE)

**All data shown in the Metrics Hub MUST be consistent with PostcardMania's data. Always. No exceptions.**

PCM is the vendor that physically mails pieces — their numbers are ground truth. Any discrepancy between our numbers and PCM's destroys trust in the entire platform.

### The dual-source principle (ruling Apr 17, 2026 — from Camilo)

**Aurora + PCM, always both. Never single-source.** Every volume / cost / revenue metric must be computed from Aurora AND verified against PCM. If they disagree beyond tolerance, the widget must **surface the delta visibly** (not hide it in a hover-tooltip). Hiding inconsistencies is the root of the trust problem this skill exists to prevent.

**PCM reference numbers (as of April 17, 2026 — re-snapshot quarterly):**
- Total PCM orders (all statuses): 25,165
- Canceled orders: 54
- Active pieces (non-canceled, excl. test domains): **24,906**
- Active domains with orders: **18**
- PCM computed cost (era-priced): $21,334.15
- Aurora `dm_client_funnel` lifetime sends: 24,195 (trails PCM by 711 pieces = -2.85% — in-pipeline, surfaced as a visible delta on the "Lifetime pieces" card)
- Aurora `dm_client_funnel` lifetime revenue: $24,371.68
- Aurora `dm_client_funnel` lifetime PCM cost: $17,132.81
- Aurora `dm_client_funnel` lifetime gross margin: $4,674.30 (19.2%)
- PCM balance on account: $0
- Design catalog: 28 templates

**Verification checklist (run after ANY data query change):**
1. All-time pieces must show ~24,900+ (PCM authority). If Aurora shows less, that's expected (in-pipeline drift); display the delta.
2. `dm_client_funnel` is canonical for lifetime revenue / PCM cost / gross margin — same source as Profitability → Margin summary. NEVER replace with a source that shows different numbers.
3. `dm_property_conversions` has data-quality noise (lifetime sum = $56K vs funnel's $24K). Use for date-filtered conversions ONLY. NEVER for lifetime totals.
4. `dm_client_funnel` is a ROLLING SNAPSHOT, not a ledger — only ~11 days of date coverage. Its lifetime-cumulative columns are correct, but you CANNOT derive a monthly trend from it (see Rule 9).
5. After changing data sources, manually verify numbers match Profitability tab before pushing.

### Tolerances

| Metric class | Tolerance |
|---|---|
| Counts (pieces, campaigns, domains, clients) | **0%** — any mismatch is a blocker |
| Per-piece pricing | **< $0.01/piece** |
| Revenue / cost totals | **< 1%** (attribution timing drift allowed) |
| Delivery rate | **< 0.5 percentage points** |

Anything outside these tolerances is a **blocker**: must be resolved before the widget ships.

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

### Proactively, BEFORE you write any code (new — Apr 17, 2026):

Run the **Pre-Flight Checklist** (bottom of this doc) the moment you start planning a new widget / metric / API route. Most trust breaks are designed in, not coded in. Catching them at the planning stage is 10× cheaper than fixing them after the widget ships.

### Automatically (MUST run after these changes):
1. **After creating or modifying any widget** in `src/components/workspace/widgets/Dm*.tsx`, `Rr*.tsx`, or `DmOverview*.tsx`
2. **After modifying API routes** in `src/app/api/dm-conversions/`, `src/app/api/rapid-response/`, `src/app/api/pcm-validation/`, or `src/app/api/dm-overview/`
3. **After adding a new metric, column, or KPI card** to any DM Campaign widget
4. **After modifying type definitions** in `src/types/dm-conversions.ts`, `src/types/rapid-response.ts`, or `src/types/dm-overview.ts`
5. **After modifying `TEST_DOMAINS`** in any API route (parity check: all 7 files + `src/app/api/dm-overview/compute.ts`)
6. **After modifying `src/app/api/dm-overview/compute.ts`** (the Overview's computeHeadline is the cross-tab equality anchor — if this changes, every dependent widget must be re-verified)

### On demand:
- `"Run a data consistency audit"`
- `"Check if this new metric is sourced correctly"`
- `"Verify terminology across DM tabs"`
- `"Audit tooltip coverage"`
- `"Verify cross-tab equality"` — for every metric on multiple tabs, check they use the same source
- `"Audit table coverage"` — check MIN/MAX/COUNT(date) for every Aurora table a widget sources from

---

## Rule 1: Data Source Alignment (CRITICAL)

Every metric MUST pull from its designated source-of-truth table. This is the single most important rule in the DM Campaign section.

### Data Source Authority Map

**Priority order (Apr 17 update):** When multiple sources could produce the same metric, use them in this order: (1) PCM API for authoritative volume/cost, (2) `dm_overview_cache` shared cache for cross-tab-equal lifetime totals, (3) `dm_client_funnel` for Aurora-side lifetime revenue/cost/margin, (4) `rr_*` / `dm_*` for section-specific metrics.

| Metric | Authoritative Source | Column / Derivation | API Route | Section |
|--------|-------------------|--------------------|-----------|---------|
| **Lifetime mail pieces (PCM authority)** | PCM `/order` paginated (excl. canceled + test) | count of non-canceled orders | `/api/dm-overview?type=headline` → `lifetimePieces.pcm` | Overview + any widget showing lifetime |
| **Aurora-vs-PCM pieces delta** | `dm_overview_cache.headline` | `lifetimePieces.delta` (Aurora − PCM) | `/api/dm-overview?type=headline` | Overview + any widget surfacing the gap |
| **Lifetime client revenue** | `dm_client_funnel.total_cost` latest-per-domain summed | same SQL as Profitability → Margin summary | `/api/pcm-validation?type=profitability-summary`, `/api/dm-overview?type=headline` | Profitability + Overview |
| **Lifetime PCM cost (canonical)** | `dm_client_funnel.total_pcm_cost` latest-per-domain summed | same SQL as Profitability → Margin summary | same as above | Profitability + Overview |
| **Lifetime gross margin (canonical)** | `dm_client_funnel.margin` latest-per-domain summed | same SQL as Profitability → Margin summary | same as above | Profitability + Overview |
| **Internal test cost** | PCM `/order` filtered to test domains × era rates | `testActivity.cost` | `/api/dm-overview?type=headline` | Overview only (surfaced as drag on margin) |
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
| Cost / Revenue (what users paid) | `dm_client_funnel` | `total_cost` | `/api/dm-conversions` | Business Results |
| Cost (operational) | `rr_daily_metrics` | `cost_total`, `avg_unit_cost` | `/api/rapid-response` | Operational Health |
| PCM Cost (what PCM charges us) | `dm_client_funnel` or `dm_volume_summary` | `total_pcm_cost` or `cumulative_pcm_cost` | `/api/pcm-validation?type=profitability-summary` | PCM & Profitability |
| Margin (revenue - PCM cost) | `dm_client_funnel` or `dm_volume_summary` | `margin` or `cumulative_margin` | `/api/pcm-validation?type=profitability-summary` | PCM & Profitability |
| Margin % | `dm_client_funnel` | `margin_pct` | `/api/pcm-validation?type=profitability-summary` | PCM & Profitability |
| Profitability by mail class | **`dm_volume_summary`** | Filter `mail_class IN ('standard', 'first_class')` — NOT 'all' | `/api/pcm-validation?type=margin-by-mail-class` | PCM & Profitability |
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

## Rule 4: Cross-Tab Equality (STRENGTHENED Apr 17)

When the same concept appears on more than one tab (Overview, Operational Health, Business Results, Profitability), the numbers MUST be **bit-for-bit identical**. Not "close," not "within rounding." Identical. The way to guarantee this is to make both widgets read from **the exact same cache key** or **the exact same SQL query**.

### Mandatory cross-tab equality matrix

Every row below MUST match bit-for-bit across the listed tabs:

| Metric | Tabs it appears on | Guaranteed-equal via |
|---|---|---|
| Active campaigns count | OH "Is it running?", Overview "Active campaigns" card, PP volume comparison | `rr_campaign_snapshots` latest-per-campaign, same SQL |
| Lifetime mail pieces (PCM authority) | OH "Is it working?", Overview "Lifetime pieces", PP volume comparison | `dm_overview_cache.headline.lifetimePieces.pcm` |
| Aurora-vs-PCM pieces delta | Everywhere lifetime pieces appears | same cache key; one pieces value + one delta |
| Lifetime revenue | PP "Margin summary", Overview "Company margin" card | `dm_client_funnel.total_cost` summed (same SQL) |
| Lifetime PCM cost | PP "Margin summary", Overview "Company margin" card | `dm_client_funnel.total_pcm_cost` summed |
| Lifetime gross margin | PP "Margin summary", Overview "Company margin" card | `dm_client_funnel.margin` summed |
| Domain count | OH "Is it aligned?", Overview adoption denominator, PP "Data match" | `dm_client_funnel` distinct domains (excl. TEST_DOMAINS) |
| Delivery rate | OH "Is it working?", OH Status breakdown | Same numerator (`dm_client_funnel.total_delivered`) + denominator (`dm_client_funnel.total_sends`) |

### Hard rules

1. **Use the Overview's Aurora-persisted cache as the source of truth for any metric it publishes.** If you're building a new widget that shows "lifetime pieces," it reads `dm_overview_cache.headline` via `/api/dm-overview?type=headline` — do NOT re-derive from PCM or Aurora with your own query. Re-derivation = drift.
2. **If two widgets display the same metric with different numbers, that's a blocker.** Open the console, click into both widgets, read the SQL, find the divergence, fix to a single source.
3. **If a concept APPEARS on multiple tabs but has legitimately different definitions** (e.g. "Delivered" = pieces on OH vs. "Delivered" = unique properties on BR): rename one side. Same label with different semantics is banned.
4. **Never assume users look at only one tab.** Executives flip between Overview and Profitability specifically to sanity-check numbers. If they disagree, trust dies.

### Legitimate cross-tab differences (tooltip-required, NOT blocker)

| Concept | OH value | BR value | Allowed? |
|---|---|---|---|
| Sent vs. Mailed | `rr_*.total_sent` (pieces) | `dm_property_conversions` (unique properties) | Yes — different concepts. Different labels + explicit tooltips on both sides. |
| Cost window | `rr_daily_metrics.cost_total` (period) | `dm_client_funnel.total_cost` (lifetime) | Yes — different time windows. Labels must say "period" vs "lifetime." |

### Code pattern to FORCE equality

```tsx
// ❌ WRONG — widget runs its own SQL for a metric that lives on Overview
const rows = await runAuroraQuery(`SELECT SUM(total_cost) FROM dm_client_funnel WHERE ...`);

// ✅ CORRECT — widget reads from the cached compute
import { readCache } from '@/app/api/dm-overview/compute';
const cached = await readCache<DmOverviewHeadline>('headline');
const revenue = cached?.data.companyMargin.clientRevenue;
```

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

## Rule 6: Tolerances are non-negotiable (NEW — Apr 17, 2026)

Repeated from the top for emphasis. Any widget that exceeds these is a **blocker**, not a warning.

- Counts (pieces, campaigns, domains, clients): **0%**
- Per-piece pricing: **< $0.01/piece**
- Revenue / cost totals: **< 1%** (attribution timing drift allowed)
- Delivery rate: **< 0.5 percentage points**

If you find a mismatch outside tolerance, do NOT ship the widget. Find the divergence first. "Close enough" is the beginning of every trust-break.

---

## Rule 7: Never hide inconsistencies (NEW — Apr 17, 2026)

Camilo's explicit ruling: **"we shouldn't hide data; we have to show everything"**.

If two sources disagree on a metric and the delta exceeds tolerance, the widget MUST:

1. Display the authoritative number as the hero value (PCM for volume, Aurora pre-computed for margin).
2. Display the secondary source **visibly in the card body** — NOT in a hover-tooltip. A tooltip is hidden; a subtitle is visible.
3. Display the delta explicitly with direction and percentage.
4. Explain the cause in a hover source-note (e.g. "in-pipeline pieces at PCM not yet counted in Aurora funnel").

**Reference implementation:** `src/components/workspace/widgets/DmOverviewHeadlineWidget.tsx` — the "Lifetime pieces" card shows:
- Hero: `24.9K` (PCM authority)
- Visible subtitle: `Aurora: 24.2K · Δ -711 (-2.85%)`
- Source hover: explanation of the drift

Anti-pattern this replaces: showing only PCM (hiding Aurora's disagreement) or only Aurora (hiding PCM's authority) or putting the delta in a tooltip. All three destroy trust when the user cross-references another tab and sees different numbers.

---

## Rule 8: Column-name collision detection (NEW — Apr 17, 2026)

**Never infer semantics from a column name across tables.** The same identifier means different things in different tables. This is the silent-bug factory of the platform.

### Known collisions in DM Campaign tables

| Column name | Table | Actually means | Typical lifetime sum |
|---|---|---|---|
| `total_cost` | `dm_client_funnel` | **Customer-paid amount (revenue to us)** | ~$24.4K |
| `total_cost` | `dm_property_conversions` | Revenue per property, includes data-quality noise | ~$56K (do NOT use for lifetime totals) |
| `total_cost` | `rr_daily_metrics` | Our cost to PCM for the day (PCM-to-us) | daily value |
| `total_pcm_cost` | `dm_client_funnel` | What PCM charged us (lifetime, pre-computed) | ~$17.1K |
| `margin` | `dm_client_funnel` | `total_cost − total_pcm_cost` pre-computed | ~$4.7K |
| `cost` (ambiguous — avoid) | Anywhere | — | **Rename on first sight. If you can't tell from the label whether this is revenue or cost, it's wrong.** |

### Rule

When reading ANY SQL query, confirm what the column means by tracing the source of truth. Never trust a display label on a widget — open the API route and read the query. If the column is `total_cost` in `dm_client_funnel`, it's revenue; if it's `total_cost` in `rr_daily_metrics`, it's cost. Same word, opposite side of the P&L.

---

## Rule 9: Table coverage verification (NEW — Apr 17, 2026)

Before building any TREND / TIME-SERIES widget, check the date coverage of the source table. If it's thin, the chart lies.

### Mandatory pre-build check

```sql
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT date::DATE) AS distinct_dates,
  MIN(date::TEXT) AS first_date,
  MAX(date::TEXT) AS last_date
FROM {source_table}
WHERE domain IS NOT NULL AND domain NOT IN ({TEST_DOMAINS});
```

### Known coverage limits (as of Apr 17, 2026 — re-verify quarterly)

| Table | Coverage | Safe for | Unsafe for |
|---|---|---|---|
| `dm_client_funnel` | **~11 days** (Apr 6 → Apr 16, 2026). Cumulative lifetime columns ARE correct. | Lifetime totals. Latest-per-domain snapshots. | Monthly trends. Per-month deltas. Anything expecting historical per-month rows. |
| `rr_daily_metrics` | **~15 days** (starting Apr 3, 2026) | Last 15 days only | "14-month trend," Q2 goals spanning the full quarter, top-contributors-all-time |
| PCM `/order` | ~14 months (Feb 2025 → today) | Monthly / daily send trends, cost trends | Real-time (cached 30 min) |
| `dm_property_conversions` | ~14 months of `first_sent_date` | Per-month conversion trends | Lifetime totals (has data-quality noise — see Rule 8) |

### Rule

1. If your widget displays a time range wider than the source table's coverage, either:
   - (a) swap to a table with sufficient coverage, or
   - (b) add a **visible label** to the widget saying "last N days only" so users aren't misled.
2. If the widget's data would be zero for historical months due to coverage gaps, **do not ship the widget**. A chart with 13 zero bars and 1 real value looks like a bug, and it is.
3. When in doubt, run the pre-build check SQL above before writing the widget.

### Reference

This rule exists because in the Apr 17 session a "Company margin trend" widget was attempted using `dm_client_funnel`. That table had 11 days of data. The chart showed `$0` for 13 months and `$4,674` for April 2026. It was deleted and replaced with a single lifetime-summary card.

---

## Rule 10: Internal test sends are cost, not revenue (NEW — Apr 17, 2026)

Camilo's ruling (Apr 17 meeting, timestamp 2:00-2:28): **"Cuba" / QA / sandbox environments don't pay us, but they DO cost us real PCM spend.** Any honest company P&L must reflect this.

### Rule

1. **`TEST_DOMAINS`** is the exclusion list for client-facing revenue metrics (adoption, revenue, margin). Every Aurora query that sums revenue or counts paying clients MUST include `WHERE domain NOT IN (${TEST_DOMAINS})`.
2. **Internal test cost** is a real PCM expense with zero client revenue. It must be:
   - Surfaced in a dedicated widget (per-domain breakdown preferred — see `DmOverviewTestCostCardsWidget`)
   - **Deducted from "Company margin"** (gross margin − test cost = company margin)
   - Never silently excluded from cost totals
3. The authoritative `TEST_DOMAINS` list (Apr 17 snapshot — 9 entries): `8020rei_demo`, `8020rei_migracion_test`, `_test_debug`, `_test_debug3`, `supertest_8020rei_com`, `sandbox_8020rei_com`, `qapre_8020rei_com`, `testing5_8020rei_com`, `showcaseproductsecomllc_8020rei_com`. The full list is in `src/app/api/dm-overview/compute.ts`. **Currently duplicated in 7 API files** — pending consolidation into `src/lib/domain-filter.ts`.

### Anti-pattern this catches

A widget that queries `dm_property_conversions` without `domain NOT IN (TEST_DOMAINS)` will include ~600 phantom rows from `showcaseproductsecomllc_8020rei_com` (the "Inaugural RR Test" campaign) and inflate Business Results counts. This was Blocker C of the Apr 17 audit.

---

## Pre-Flight Checklist — BEFORE you write any code (NEW — Apr 17, 2026)

Run this 2-minute check the MOMENT you start planning a new widget, metric, or API route. Catching a trust-break here is 10× cheaper than fixing it after the code is merged.

### 1. Does the metric already exist somewhere on the platform?

- Search the audit doc `Design docs/audits/dm-campaign-consistency-audit-*.md` and the widget files.
- If yes: **reuse the existing source**. Do NOT write a new SQL query. Import from `/api/dm-overview` or call the existing endpoint.
- If the existing metric has a problem (wrong source, drift, etc.), FIX it first, then let your new widget inherit the fix. Don't build on a broken foundation.

### 2. Where should the metric come from?

- Consult the Authority Map (Rule 1). Identify the canonical source.
- If you can't find it in the map, it's not yet a canonical metric. Propose the source + get it added to the map BEFORE shipping.
- If you find yourself about to query `dm_client_funnel.margin` AND recompute it from PCM orders × era rates: **STOP**. Use one source only. Aurora's pre-computed `margin` column is canonical.

### 3. Does the backing table have enough coverage?

- Run the Rule 9 check. If the table has only N days but your widget implies a longer range, stop.
- Pick a different source or change the widget's scope.

### 4. Is the column name ambiguous?

- If the column is named `total_cost`, `cost`, `revenue`, or similar — trace what it actually represents in THIS table before summing it (Rule 8).
- If the widget title contains "Revenue" or "Cost" or "Margin", be explicit: **whose** revenue / cost / margin?

### 5. Will this metric cross tabs?

- If yes: it MUST read from the same source the other tabs use. Prefer `dm_overview_cache` cache keys or shared compute functions. Do NOT write a fresh SQL query — re-derivation = drift.
- Validate bit-for-bit equality on at least one live value before shipping.

### 6. Does the query include TEST_DOMAINS exclusion?

- Any client-facing revenue / volume / client-count query MUST exclude test domains.
- Copy the constant from `src/app/api/dm-overview/compute.ts` → `TEST_DOMAINS` (the one true source today).
- If you're adding a new test domain, update all 7 copies across API files (see Rule 10 list).

### 7. Does the widget have tooltips for every numeric field?

- Volume columns → tooltip must specify pieces vs properties.
- Financial columns → tooltip must specify revenue vs cost vs margin, and whose.
- Rate columns → tooltip must specify numerator and denominator.
- Cross-tab metrics → tooltip must name the matching widget on other tabs.

### 8. Does the widget surface inconsistencies visibly?

- If Aurora and PCM disagree on this metric, does the widget display both + the delta in the card body? (Rule 7)
- If not, redesign before coding.

If all 8 answers are "yes" / "no-issue," you can start writing code. If any one is "unclear" or "no," fix it in the design first.

---

## Session-proven anti-patterns — DO NOT DO THESE

These are failures the Apr 17 session discovered and fixed. If you see yourself writing any of these, stop and re-check the rules.

| Anti-pattern | What it does | Correct approach |
|---|---|---|
| Sum `dm_property_conversions.total_cost` for lifetime revenue | Returns $56K (includes data-quality noise). Real lifetime revenue is $24.4K. | Use `dm_client_funnel.total_cost` latest-per-domain summed. |
| Compute PCM cost by paginating PCM orders × era rates | Produces $21.5K instead of the canonical $17.1K that Profitability uses. Introduces cross-tab drift. | Use `dm_client_funnel.total_pcm_cost` (pre-computed, matches Profitability). |
| `filterStatus=Canceled` on PCM `/order` | No-op. PCM doesn't honor this query param. Returns all 25,165 orders regardless. | Paginate fully, filter client-side. Cache aggressively (1-hour TTL). |
| Apply `last_sent_date >= today - N days` filter to a "lifetime campaigns" query | Hides historical campaigns. The 13/22 vs 15/15 bug that triggered this entire session. | No date filter on lifetime queries. Use `status` column to distinguish active/inactive. |
| Ship a monthly trend widget without first running the coverage check | Chart silently shows zeros for most months (Rule 9 scenario). | Run the coverage SQL first. If <1 month, pick a different source or label the scope. |
| Include test domains in revenue / client counts | Inflates numbers with unpaid QA sends. | Always `WHERE domain NOT IN (${TEST_DOMAINS})`. |
| Put the Aurora-vs-PCM delta in a hover tooltip | Hidden from users — defeats the "surface inconsistencies" rule. | Delta visible in the card body (subtitle), source explanation in hover. |
| Two widgets on different tabs re-derive the same metric with separate SQL | Numbers drift; cross-tab trust breaks. | Both widgets read from `dm_overview_cache` via `/api/dm-overview?type=…`. |

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
| **Aurora trails PCM by ~711 pieces** (Apr 17) | `dm_client_funnel.total_sends` lifetime = 24,195. PCM active pieces = 24,906. Difference = in-pipeline (processing + mailing) not yet counted in Aurora. | By design — PCM ingest has a small sync lag | **Surface the delta visibly** on any widget that shows "lifetime pieces" (Rule 7). Do not try to reconcile; it'll narrow naturally as pieces deliver. |
| **`dm_client_funnel` has only ~11 days of historical rows** (Apr 17) | The table is a rolling snapshot. Lifetime cumulative columns are correct, but no per-month history exists. | Pipeline follow-up: backfill from PCM + `dm_property_conversions` | **BLOCKS any margin / revenue / cost monthly trend widget.** Use it for lifetime totals only. See Rule 9. |
| **`rr_daily_metrics` has ~15 days of history** (Apr 17 re-check) | Only data from Apr 3, 2026 onward in the cluster. | Accumulating over time | Operational Health trend widgets (Q2 goal, top contributors, send trend) are structurally starved. Label the scope or swap source. |
| `dm_property_conversions` volume inflation | `SUM(total_cost)` lifetime = $56K, but Profitability's $24K (from `dm_client_funnel`) is authoritative. The table has data-quality noise — unknown per-piece rates, legacy rows, etc. | Closing — nightly cron narrows the gap | **NEVER use for lifetime totals.** Only use for date-filtered per-month conversions + revenue attribution. See Rule 8. |
| PCM `/order` server-side filters don't work | `filterStatus=Canceled` query param is a no-op. Must paginate fully and filter client-side. | External limitation | Full pagination is ~90s. Cache aggressively (1-hour TTL). Reference: `src/app/api/dm-overview/compute.ts` → `fetchPcmOrdersSlim()`. |
| `TEST_DOMAINS` duplicated in 7 files | `src/app/api/{dm-conversions/route.ts, dm-conversions/get-alerts-data.ts, dm-reports/route.ts, dm-templates/route.ts, pcm-validation/route.ts, rapid-response/route.ts, rapid-response/slack-alerts/route.ts}` all define their own copy of the constant. | Pending consolidation into `src/lib/domain-filter.ts` | When adding a new test domain, update ALL 7 + `src/app/api/dm-overview/compute.ts`. Easy to miss one. |
| `TOTAL_8020REI_CLIENTS = 140` is hardcoded | Overview adoption-rate denominator is verbal from Camilo, not a live query. | Pending monolith integration | If 8020REI gains/loses clients, the adoption % will drift until updated manually. Tooltip must disclose the source. |
| Zero Smart Drop data | `campaign_type = 'smartdrop'` returns 0 rows | Not yet in production | Campaign type breakdown will show 100% Rapid Response until Smart Drop launches. |
| Pre-send exclusions | Properties with conversions before first send are excluded. Cascading filter applies to deals/appointments/contracts. | Intentional — prevents impossible funnels | Conversion counts may be lower than raw DB counts. |
| ROAS `low_sample` flags | ROAS with < 3 deals is marked `low_sample`, not `confident`. | By design — Lauren's meeting requirement | Some clients show ROAS with confidence warnings. |

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
**Last Updated:** 2026-04-17 (v3 — dual-source principle, cross-tab equality strengthened, Rules 6–10 added, Pre-Flight Checklist, session-proven anti-patterns, PCM reference numbers refreshed, `dm_client_funnel` coverage limit flagged, `dm_overview_cache` canonical source added. Driver: Apr 17 session report at `personal-documents/8020-metrics-hub/2026-04-17/SESSION_REPORT.md`.)
