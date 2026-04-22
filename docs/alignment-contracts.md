# Metrics Hub ↔ PCM Alignment Contracts

**Purpose.** This document is the authoritative spec for how every existing widget on the DM Campaign tabs (Overview, Operational Health, Business Results, PCM & Profitability) is reconciled against the PostcardMania (PCM) API. It defines — per widget — the hub-side value source, the PCM ground truth, the reconciliation rule, the drift thresholds, and the autocorrect action when drift is detected.

All downstream infrastructure (the reconciler endpoint, the alignment table schema, the widget freshness chrome, the Slack alerts) implements against this document. If a widget is not listed here, it is not being reconciled — and that is a bug to file.

**This is not new UI.** No widget listed here gets a new tile, new column, or new metric. The in-place "Reconciled: X min ago" footer and the existing `InconsistencyIcon` pattern are the only visual affordances.

---

## Principles (from the metrics-auditor skill, non-negotiable)

1. **Surface problems, do not suppress them.** When PCM and Aurora disagree, both numbers are kept; the skill does not pick a winner.
2. **PCM is read-only.** Self-correction writes only to hub-owned caches (`dm_overview_cache`, `rr_pcm_alignment`). Never to PCM. Never to monolith-owned tables.
3. **Every divergence pattern should become an automated alert.** Crossing a `red` threshold fires an entry into the existing `AlertsFeedWidget` and the Slack digest.
4. **Cross-tab invariants hold to the cent.** If the same metric appears on more than one tab, the two numbers must be identical — not merely close.

---

## Severity tiers

| Tier | Drift | Badge | Auto-action |
|------|-------|-------|-------------|
| **green** | < 1% | none (footer shows "Reconciled: N min ago") | record in `rr_pcm_alignment` history |
| **yellow** | 1% – 5% | `InconsistencyIcon` (existing component) with tooltip | record + daily Slack digest line |
| **red** | > 5% or sign flip on a margin metric | `InconsistencyIcon` + tooltip + Alerts feed entry | record + immediate Slack alert + self-heal if `autocorrect=refresh-cache` |

Thresholds can be overridden per widget in the table below when the default is wrong for the metric (e.g. a margin % tolerates less drift than a volume count).

## Autocorrect actions

| Action | What happens when `red` is detected |
|--------|-------------------------------------|
| `none` | Drift is recorded and alerted. No write. Use for rolled-up totals where the fix must happen upstream. |
| `refresh-cache` | `dm_overview_cache` row for that widget is recomputed from the freshly-paginated PCM orders and upserted. Idempotent; safe on every run. |
| `flag-monolith` | A row is appended to `rr_pcm_alignment` with `severity='red'` and `needs_owner='monolith'`. A Slack alert is routed to Johan/Johansy. The hub does not touch the upstream table. |

---

## Data ownership (who writes what)

**Rule (2026-04-22, confirmed by Germán):** The hub does **not** write to any Aurora table from the reconciler. All new hub-produced data lives in the hub's own Firestore (GCP). Aurora stays monolith-owned.

| Store | Writer | Used for | Auto-healable by hub? |
|-------|--------|----------|-----------------------|
| Firestore `pcm_alignment_runs` (GCP) | hub reconciler | this plan's audit log | ✅ yes (it's entirely hub-owned) |
| Aurora `dm_overview_cache` | hub (pre-existing, from 2025) | pre-computed overview payloads | ✅ yes (`refresh-cache`) — pre-existing, not changed by this plan |
| Aurora `rr_pcm_alignment` | monolith (seeded + updates) | "Is it aligned?" widget today | ❌ never written by the reconciler; stays as today |
| Aurora `dm_client_funnel` | monolith ETL | revenue / sends / delivered | ❌ `flag-monolith` only |
| Aurora `dm_volume_summary` | monolith ETL | daily cost + volume | ❌ `flag-monolith` only |
| Aurora `dm_property_conversions` | monolith ETL | conversions | ❌ `flag-monolith` only |
| Aurora `rr_daily_metrics` | monolith ETL | daily campaign metrics | ❌ `flag-monolith` only |
| Aurora `rr_campaign_snapshots` | monolith ETL | campaign status snapshots | ❌ `flag-monolith` only |
| PCM (any endpoint) | external, read-only | ground truth | ❌ never written |

**Why Firestore (decided 2026-04-22):**
- Single-writer contract per Aurora table stays intact (hub only reads monolith-owned tables).
- `firebase-admin` already installed in the hub repo; new helper [admin-firestore.ts](../src/lib/firebase/admin-firestore.ts) to be added in Phase 2 as a thin wrapper around the Admin SDK.
- Rollback is trivial: drop the Firestore collection; nothing else is affected.
- Aligns with the `dm_customer_pricing`-precedent pattern the team has used before: when the hub needs to own new data, it creates new storage rather than overloading a shared table.

The exact Firestore collection schema is specified in [`personal-documents/8020-metrics-hub/2026-04-22/phase-2-schema.md`](../../../personal-documents/8020-metrics-hub/2026-04-22/phase-2-schema.md).

---

## Canonical test-domain exclusion

All reconciliation must exclude the canonical list in [src/lib/domain-filter.ts](../src/lib/domain-filter.ts). The list is:

```
8020rei_demo, 8020rei_migracion_test, _test_debug, _test_debug3,
supertest_8020rei_com, sandbox_8020rei_com, qapre_8020rei_com,
testing5_8020rei_com, showcaseproductsecomllc_8020rei_com
```

> **Known inconsistency (flagged during contract writing, 2026-04-22):** the `metrics-auditor` skill reference in [.claude/skills/metrics-auditor/SKILL.md](../.claude/skills/metrics-auditor/SKILL.md) lists only 6 test domains; `domain-filter.ts` lists 9. The canonical source is `domain-filter.ts` — the skill text is stale. Resolving this is **out of scope** for the alignment-contracts work; it is recorded here so the reconciler uses the canonical list and does not inherit the skill's stale list.

---

## Widget-by-widget contracts

### DM Overview tab ([DmOverviewTab.tsx](../src/components/dashboard/DmOverviewTab.tsx))

All four widgets read from `dm_overview_cache` keyed rows, populated by `/api/dm-overview/refresh` (cron every 30 min). Hub-owned cache → all `red` findings on this tab are `autocorrect: refresh-cache`.

| widget_key | Displayed metric | Hub source | PCM ground truth | Rule | Threshold override | Autocorrect |
|------------|------------------|------------|-------------------|------|--------------------|-------------|
| `dm-overview-headline.active-clients` | "12 / 140" | `rr_campaign_snapshots` distinct active domains; denominator `140` hardcoded from verbal with Camilo (2026-04-17) | none (Aurora-only metric) | numerator: Aurora count only. Denominator: flag if `140` diverges from CRM portfolio size. | — | `flag-monolith` (denominator) |
| `dm-overview-headline.lifetime-pieces` | "26.5K" + "Aurora: 25.7K · Δ -768 (-2.9%)" | PCM `/order` paginated (minus test + canceled); Aurora `dm_client_funnel.total_sends` | PCM `/order?page=1&perPage=1` → `pagination.totalResults` minus canceled + test | hub PCM number must equal PCM paginated total; Aurora number is surfaced as sub-line, not reconciled upward | — | `refresh-cache` |
| `dm-overview-headline.company-margin` | "$2.8K · 10.9%" | `dm_client_funnel.total_cost` (revenue) − `computePcmInvoiceCost(orders)` (PCM cost) − test cost | PCM `/order` amounts (era-priced) | **invariant**: must equal Profitability → Margin summary → Net company margin to the cent. | red > 2% (margin is sensitive) | `refresh-cache` |
| `dm-overview-headline.active-campaigns` | "13 / 21" | `rr_campaign_snapshots` active / total | none | Aurora-only. Flag only if snapshot is > 48h stale. | — | `flag-monolith` (staleness) |
| `dm-overview-send-trend` | Stacked bar chart, MTD same-day-cutoff: one bar per month, each month capped at today's day-of-month; split First class / Standard. X-axis shows "MMM YYYY" (e.g. "Apr 2026"); tooltip spells out the full range (e.g. "April 1–22, 2026"). | `computeSendTrend.lifetimeTotal` (lifetime client-order count, unfiltered by day — intentionally distinct from the rendered MTD sum) | `headline.lifetimePieces.pcm` (PCM `/order` paginated total, clients only) | the hub's `lifetimeTotal` must equal `headline.lifetimePieces.pcm` within 1% — both derive from the same PCM pagination, so any drift means a grouping/filter regression in the hub. Per-month MTD totals are exposed in `notes.mtd_sum` for audit but not reconciled directly. | red > 1% | `refresh-cache` |
| `dm-overview-test-cost-cards.<domain>` | Per-test-domain cost + pieces (supertest $83 / 90, testing5 $47 / 50, qapre $45.51 / 65) | `fetchPcmOrdersSlim` filtered to `TEST_DOMAINS` × era rates | PCM `/order` filtered to test domains | total cost + total pieces must match PCM paginated sum for the test-domain subset | — | `refresh-cache` |
| `dm-overview-test-cost-cards.total` | "Total $175.51 / 205 pieces" | sum of per-domain cards | sum of per-domain PCM | must equal the sum of the sub-cards | — | `refresh-cache` |
| `dm-overview-balance-flow.daily-pieces` | Daily pieces + cost, last 60 days | PCM `/order` daily aggregation × era rates | PCM `/order` (same) | daily totals must match PCM | per-day green < 2% | `refresh-cache` |
| `dm-overview-balance-flow.account-balance` | Current PCM account balance | PCM `/integration/balance` `moneyOnAccount` | PCM `/integration/balance` (same call) | exact match; flag if balance ≤ 0 regardless of drift | — | none (display-only) |

### Operational Health tab ([RapidResponseTab.tsx](../src/components/dashboard/RapidResponseTab.tsx), `DEFAULT_RAPID_RESPONSE_LAYOUT`)

Mixed ownership: some widgets read from hub-owned cache (reconciliation health), some from monolith-owned Aurora tables (`rr_daily_metrics`, `rr_campaign_snapshots`, `dm_client_funnel`).

| widget_key | Displayed metric | Hub source | PCM ground truth | Rule | Autocorrect |
|------------|------------------|------------|-------------------|------|-------------|
| `rr-operational-pulse` | "Is it working?" — lifetime sent, lifetime delivered, delivery rate | `dm_client_funnel.total_sends`, `.total_delivered` | PCM `/order` paginated total + status-filter `Delivered` | sends: must be within 5% of PCM total; delivery rate gap > 2% → `red` | `flag-monolith` |
| `rr-quality-metrics` | Undeliverable %, return rate | `rr_daily_metrics` + `dm_client_funnel.total_delivered` | PCM `/recipient/undeliverable` count | undeliverable rate must be within 1% of PCM | `flag-monolith` |
| `rr-pcm-health` | "Is it aligned?" — sync gap, stale sent, orphaned orders | `rr_pcm_alignment` | PCM `/order` − Aurora `dm_client_funnel.total_sends` | **this widget IS the reconciler's own output surface**. Numbers should always match the latest reconcile run. | `refresh-cache` (the alignment table row itself) |
| `rr-postal-performance` | First-class vs Standard delivery timing | `rr_daily_metrics` grouped by mail class | PCM `/order.mailClass` + `/recipients.deliveryDate` | class-level delivery-day averages within 1 day of PCM | `flag-monolith` |
| `rr-q2-goal` | Q2 sends goal % | `rr_daily_metrics` sum, fixed Q2 window | PCM `/order` same window | sum drift < 5% | `flag-monolith` |
| `rr-q2-top-contributors` | Top-N domains by Q2 sends | `rr_daily_metrics` group by domain, Q2 window | PCM `/order` grouped by domain, Q2 window | top-5 composition must match (set equality) | `flag-monolith` |
| `rr-campaign-table` | Per-campaign status + counts | `rr_campaign_snapshots` | PCM `/order` joined per-campaign (by external ref) | campaign sends within 2% of PCM per-campaign count | `flag-monolith` |
| `rr-sends-trend` | Daily send line chart | `rr_daily_metrics` | PCM `/order` daily count | daily drift < 3% | `flag-monolith` |
| `rr-system-coverage` | % of domains with recent sends | `rr_campaign_snapshots` freshness | PCM last-activity per domain | within 24h | `flag-monolith` |
| `rr-data-integrity` | Flagged domains / stale snapshots | `rr_pcm_alignment` | PCM `/order` ages | data integrity thresholds defined in existing evaluator (~50/10/5) | `refresh-cache` |

### Business Results tab ([RapidResponseTab.tsx](../src/components/dashboard/RapidResponseTab.tsx), `DEFAULT_DM_BUSINESS_RESULTS_LAYOUT`)

All widgets source from `dm_property_conversions` (conversions) and `dm_client_funnel` (volume). PCM has **no conversion data** — reconciliation is limited to volume denominators.

| widget_key | Displayed metric | Hub source | PCM ground truth | Rule | Autocorrect |
|------------|------------------|------------|-------------------|------|-------------|
| `dm-funnel-overview` | Mailed → Leads → Appts → Contracts → Deals → Revenue | `dm_property_conversions` (stages) + `dm_client_funnel.total_properties_mailed` (top stage) | PCM `/order.recipientCount` grouped per domain → compared against `total_properties_mailed` | only the top ("Mailed") stage is PCM-reconciled: `dm_client_funnel.total_properties_mailed` must be within 5% of `PCM order recipientCount` total | `flag-monolith` |
| `dm-client-performance` | Per-client funnel (sends, leads, revenue) | `dm_client_funnel` + `dm_property_conversions` join | PCM `/order` grouped by domain | send count per domain must match PCM per-domain within 5% | `flag-monolith` |
| `dm-template-leaderboard` | Top templates by lead/deal yield | `dm_template_performance` proportionally scaled to match `dm_client_funnel.total_sends` | PCM `/design` catalog (template metadata only — PCM cannot validate yield) | template metadata (name, type, size) exact match against PCM `/design`; yield numbers are hub-only | `flag-monolith` (metadata mismatch) |
| `dm-geo-breakdown` | Leads / deals by geography | `dm_property_conversions` grouped by state/county | none (PCM has no geo) | no reconciliation (documented as hub-only) | `none` |

### PCM & Profitability tab ([RapidResponseTab.tsx](../src/components/dashboard/RapidResponseTab.tsx), `DEFAULT_PCM_VALIDATION_LAYOUT`)

All widgets source from `dm_volume_summary` (daily cost accumulation) + live PCM queries. This tab is the P&L; margin invariants are the strictest.

| widget_key | Displayed metric | Hub source | PCM ground truth | Rule | Threshold override | Autocorrect |
|------------|------------------|------------|-------------------|------|--------------------|-------------|
| `pcm-margin-summary.total-revenue` | "$25.6K" | `dm_client_funnel.total_cost` (what hub charged clients), test domains excluded | none (revenue is internal) | consistency-only: must equal Overview Headline revenue input | — | `refresh-cache` |
| `pcm-margin-summary.pcm-cost-clients` | "$22.7K" | `computePcmInvoiceCost(orders)` — PCM orders × era rates, clients only | PCM `/order.amount` sum over same order set — **if** PCM declares amount; else skip | **if PCM amount field is available**, the era-computed cost must match PCM-declared amount within 1%. If they drift, flag because the era table is wrong. | red > 3% | `refresh-cache` + escalate era-table review |
| `pcm-margin-summary.gross-margin` | "$3.0K" | Total revenue − PCM cost | derived | invariant: must equal the two fields above minus each other | — | `refresh-cache` |
| `pcm-margin-summary.internal-test-cost` | "$175.51" | test-domain subset of same PCM-cost calc | PCM `/order` filtered to test domains, era-priced | must equal Overview test-cost-cards total | — | `refresh-cache` |
| `pcm-margin-summary.net-company-margin` | "$2.8K" | Gross margin − test cost | derived | **cross-tab invariant**: must equal Overview Headline Company Margin **to the cent**. This is the P&L reconciliation gate. | red on any delta | `refresh-cache` |
| `pcm-margin-period` | Last-30-day revenue / PCM cost / margin / margin % | `dm_volume_summary` cumulative columns, last 30 days | PCM `/order` same window, era-priced | period totals must match within 2% | red > 2% | `flag-monolith` (dm_volume_summary is monolith-owned) |
| `pcm-margin-trend` / "Pricing history" | Monthly per-piece rates (us / PCM / margin) chart | `dm_volume_summary` daily aggregates / era table | era table + PCM `/order` sampled rates | era rate line must match invoice-verified era history | — | `none` (manual era-table review if drift) |
| `pcm-pricing-overview` | Current rates card | era table | PCM `/order` latest N orders | current rate must match latest era row | — | `none` |
| `pcm-data-match` | Per-domain alignment table | `rr_pcm_alignment` + `dm_client_funnel` | PCM `/order` per domain | sync gap per row must equal current PCM−Aurora delta | — | `refresh-cache` |
| `pcm-domain-table` | Per-domain lifetime sends, delivered, cost-per-piece | `dm_client_funnel` + `dm_volume_summary` | PCM `/order` grouped by domain | sends per domain within 5%; cost-per-piece within 3% | — | `flag-monolith` |
| `pcm-template-table` | PCM design catalog | `dm_template_performance` metadata | PCM `/design` | catalog match: every row in hub must exist in PCM; extras flagged | — | `refresh-cache` |

### Reports & Data Sources tabs

- **Reports tab** — report registry; each report entry gets a freshness footer only. No numeric reconciliation, but the registry's `publishedAt` timestamp must be shown alongside the data-snapshot date the report was computed from.
- **Data Sources tab** — reads `rr_pcm_alignment` directly; becomes the system-wide alignment dashboard by virtue of the reconciler's writes. No new widget; the existing table gains live `severity` colouring per source.

---

## Cross-tab invariants (must hold to the cent)

These are the non-negotiables that the cross-tab consistency diagnostic ([scripts/diagnose-cross-tab-consistency.ts](../scripts/diagnose-cross-tab-consistency.ts)) already validates. The reconciler extends that guarantee to live runtime.

| Metric | Appears on | Source |
|--------|------------|--------|
| **Company margin ($)** | Overview headline, Profitability margin summary | same `dm_overview_cache.headline.netCompanyMargin` row |
| **Lifetime sent (pieces)** | OH "Is it working?", Profitability pcm-domain-table aggregate, Overview headline | `dm_client_funnel.total_sends` sum |
| **Delivery rate (%)** | OH "Is it working?" | `dm_client_funnel.total_delivered / total_sends` (never `rr_daily_metrics` — date-boundary trap) |
| **Active campaigns** | OH "Is it running?" pill, Overview headline | `rr_campaign_snapshots` count |
| **Internal test cost ($)** | Overview test-cost-cards total, Profitability margin summary | same `fetchPcmOrdersSlim(TEST_DOMAINS)` subset |
| **PCM cost (clients) ($)** | Overview headline company margin input, Profitability margin summary | same `computePcmInvoiceCost(clientOrders)` |

Any reconciler run that breaks an invariant writes `severity='red'` and triggers an immediate Slack alert — no 5% tolerance. These are the lines we said we'd defend.

---

## Open questions that will be resolved by the first live reconciler run

These are questions the 2026-04-22 screenshot raised. The live reconciler will answer them automatically and append the answer to `rr_pcm_alignment`:

1. **Why does PCM UI show All-Time Amount Spent $20,623.44 while the hub shows PCM cost $22.7K?** Candidate causes: (a) PCM UI includes canceled orders that hub excludes; (b) PCM UI includes credits/refunds hub does not; (c) era rates overstate pre-Era-3 period. Reconciler will split the delta by era and by canceled-status to attribute.
2. **What is the true denominator for "Active clients X / 140"?** Hardcoded; reconciler compares to `rr_campaign_snapshots` total domain count and the CRM portfolio size if accessible.
3. **Is `rr_pcm_alignment.back_office_sync_gap` fresh?** Table was seeded once (2026 early) with no known refresh cron. Once the reconciler runs, this is moot — it writes on every cycle.

---

## Alert recommendations (from metrics-auditor skill pattern)

When the reconciler ships (Phase 3), the following patterns must be added to the alert evaluator in [src/app/api/rapid-response/route.ts](../src/app/api/rapid-response/route.ts):

1. **PCM/Aurora gap > 5% for 3+ consecutive cycles** → `critical`
2. **Any cross-tab invariant broken** → `critical`, immediate Slack
3. **Era-rate vs PCM-declared-amount drift > 3%** → `critical` (the era table is wrong; invoice re-verification needed)
4. **`rr_pcm_alignment` row age > 60 min for any widget_key** → `warning` (reconciler missed a cycle)
5. **Zero PCM orders ingested for 72+ h while campaigns active** → `critical` (PCM API may be down)
6. **Account balance ≤ 0** → `critical` (on-hold will accumulate)

---

## SmartDrop readiness addendum (2026-04-22)

SmartDrop is a new direct-mail campaign type launching soon. It shares PCM's dispatch pipeline and all Aurora tables with existing Rapid Response — distinguished only by a `campaign_type` enum column (`'rr' | 'smartdrop'`).

**Upstream state (verified 2026-04-22):**
- Monolith: `rapid_responses.campaign_type` ENUM in [migration 2025_08_20_164049](../../8020REI/monolith%208020REI/database/migrations/2025_08_20_164049_add_campaign_type_and_metrics_to_rapid_responses_table.php). `SmartDropService` extends `RapidResponseService`. No feature flag.
- Nuxt frontend: `/dm-campaign` umbrella route already live; `/dm-campaign/smart-drop/form/[[id]]` page; list view filters by `campaign_type`. No feature flag.
- Aurora tables affected: `dm_client_funnel`, `dm_volume_summary`, `dm_property_conversions`, `rr_daily_metrics`, `rr_campaign_snapshots` — all write `campaign_type` per row. `rr_pcm_alignment` is domain-wide (no split).

**Reconciliation-affecting risks the contract now must cover:**

| Risk | Impact | Contract rule |
|------|--------|---------------|
| **Authorization lag** — SmartDrop campaigns explicitly `POST /authorize` before hitting PCM. In-between, the monolith may mark them 'pending_authorization' / 'authorized' but PCM has no record. | Hub may count as sent → inflates vs PCM. | Hub aggregates must exclude orders whose monolith status is not one of {`Ordered`, `Mailing`, `Processing`, `Delivered`, `Undeliverable`}. `pending_authorization` and `authorized` pre-dispatch counts are forecast, not actual. |
| **`estimated_by_campaign`** is a forecast field surfaced by the frontend for cost preview (e.g. "6,000 properties × $0.11 = $660"). | If any widget reads this as "sends", it diverges from PCM by design. | No widget may read `estimated_by_campaign`. Flag any query that joins on this field. |
| **PCM order tagging** — PCM API orders carry no `campaign_type` field; only `extRefNbr` distinguishes. | Hub cannot split PCM-side totals by RR vs SmartDrop without a join. | Split-by-type widgets must join PCM `extRefNbr` → `rapid_response_history.ext_ref_nbr` → `rapid_responses.campaign_type`. Reconciler records this join path and flags drift per type. |
| **Scale event** — launch will multiply volume. Thresholds (green <1% / yellow 5% / red >5%) calibrated against ~26K lifetime pieces may be noisy at new volumes. | False-positive alerts on yellow/red. | After SmartDrop go-live, tune per-widget thresholds based on first 30-day steady-state. Record threshold changes in this doc's change log. |
| **`rr_pcm_alignment` has no campaign_type** and stays unsplit by design | Cannot track per-type drift in the existing alignment table. | Reconciler writes to Firestore `pcm_alignment_runs` (not Aurora). Each run emits three docs per volume/cost widget with `campaign_type ∈ {rr, smartdrop, total}`. Aurora's `rr_pcm_alignment` remains untouched. |

**Contract-level additions to every widget that has volume or cost in the table above:**
- Each volume or cost widget_key gains three reconciliation rows per cycle: `.rr`, `.smartdrop`, `.total`. The `.total` row is the one the UI already displays; `.rr` and `.smartdrop` are for drill-down and per-type alerts.
- Threshold inheritance: `.total` uses the threshold above; `.rr` and `.smartdrop` relax to 2×parent threshold during the first 30 days post-SmartDrop-launch (configurable in [pcm-pricing-eras.ts](../src/lib/pcm-pricing-eras.ts)-style constants file).

**Tabs not affected:** Reports, Data Sources. Business Results funnel stages are campaign-type-agnostic by Germán's prior direction (unified funnel).

## Change log

- **2026-04-22** — Initial contract drafted from [DmOverviewTab.tsx](../src/components/dashboard/DmOverviewTab.tsx), [RapidResponseTab.tsx](../src/components/dashboard/RapidResponseTab.tsx), [defaultLayouts.ts](../src/lib/workspace/defaultLayouts.ts), and the [metrics-auditor skill](../.claude/skills/metrics-auditor/SKILL.md). Widget universe: 25 active widgets across 4 tabs (`rr-status-breakdown` and three PCM client-filter tables mothballed per [MOTHBALLED_WIDGETS](../src/lib/workspace/defaultLayouts.ts) — excluded from reconciliation.)
- **2026-04-22** — SmartDrop readiness addendum added after confirming monolith + Nuxt frontend are fully wired (no feature flag). Rules added for authorization lag, `estimated_by_campaign` exclusion, PCM-type join path, scale-event threshold relaxation, and per-type row splitting (now in Firestore, not `rr_pcm_alignment`).
- **2026-04-22** — Data ownership tightened per Germán's direction: the hub does **not** write to any Aurora table from the reconciler. Audit log moves to a hub-owned Firestore collection `pcm_alignment_runs`. Schema spec in [personal-documents/8020-metrics-hub/2026-04-22/phase-2-schema.md](../../../personal-documents/8020-metrics-hub/2026-04-22/phase-2-schema.md).
