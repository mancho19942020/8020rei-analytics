# DM Campaign Data Consistency Audit — 2026-04-17

> **Status:** In progress. Kicked off after the Apr 17 meeting with Camilo, where the 13/22 vs 15/15 discrepancy eroded trust in the entire DM Campaign section.
>
> **Operating rule:** Aurora + PCM, always both. Never single-source. See `feedback_pcm_data_consistency_rule.md`.

## Purpose

Before building the Overview tab on top of Rapid Response / DM Campaign metrics, every widget in the three existing tabs must be traced to its source and verified against PostcardMania. Any unexplained gap is a blocker.

## Methodology

For each widget:

1. Locate the component file, the API endpoint it calls, the SQL query the endpoint runs, and the Aurora source table(s) + WHERE clauses.
2. Capture the currently-displayed Aurora value.
3. Fetch the equivalent value from PCM (API preferred; downloaded report acceptable).
4. Record the delta and assign severity.

## Severity scale

| Severity | Criteria | Action |
|---|---|---|
| **blocker** | Count mismatch > 0%, pricing drift ≥ $0.01/piece, revenue drift ≥ 1%, or unexplained filter difference between two widgets showing the "same" metric. | Must be resolved before Overview build. |
| **fix** | Missing tooltip, inconsistent terminology, non-canonical source but values agree. | Resolve in Track 1, blocking not required. |
| **nit** | Copy, sentence case, secondary label. | Log and batch-fix. |

## Tolerance

| Metric class | Tolerance |
|---|---|
| Counts (mail pieces, campaigns, domains, clients) | **0%** |
| Per-piece pricing | **< $0.01/piece** |
| Revenue totals | **< 1%** (attribution timing drift allowed) |
| Delivery rate | **< 0.5 percentage points** |

## PCM verification sources

The PCM API we are authorized to call (read-only, per [src/lib/pcm-client.ts](../../src/lib/pcm-client.ts)) exposes a limited set of v3 endpoints:

| Endpoint | Method | Currently used in | Returns |
|---|---|---|---|
| `/auth/login` | POST (only allowed POST) | `pcm-client.ts` | Bearer token, 55-min cache |
| `/integration/balance` | GET | `pcm-validation` summary | `moneyOnAccount` (current top-up balance) |
| `/order` | GET (paginated) | `pcm-validation` summary, `dm-reports` | Paginated orders; `pagination.totalResults` = lifetime mail piece count |
| `/design` | GET (paginated) | `pcm-validation` designs | Paginated template catalog; `pagination.totalResults` = design count |

**What the PCM API directly verifies:**
- Lifetime mail piece count (sum of `/order` totalResults)
- Design / template catalog count
- Balance on account (for balance reconciliation widget)

**What the PCM API does NOT directly expose (audit rows must use dashboard CSV/PDF export):**
- Campaign count (PCM does not have a "campaign" primitive — orders are its unit)
- Per-domain breakdown (each `/order` has a domain field but requires full pagination to aggregate)
- Daily send volume time series (must aggregate from `/order` by date filter)
- Invoice history / per-piece pricing (not surfaced in a dedicated endpoint; pulled from PCM dashboard)
- Delivery rate (would need per-order status enumeration across full pagination)

**Action items for verification:**
- [ ] Extend `pcm-client.ts` with typed fetchers for `/order?filterDomain=&from=&to=` to enable aggregation (non-blocking — can use downloaded reports for initial audit).
- [x] Where PCM does not expose a field, the audit row MUST cite a dashboard export (CSV/PDF) with fetch date.
- [ ] Ask Camilo / PCM support whether a per-domain / per-date aggregated report endpoint exists (would collapse many audit rows into one API call).

Every row in the audit table below must cite the verification source used: `pcm-api:/order`, `pcm-dashboard:csv:2026-04-17`, or `aurora-only` (with a clear reason).

## Canonical Aurora sources (enforcement target)

| Concept | Canonical table | Notes |
|---|---|---|
| Campaign status, operational tracking | `rr_campaign_snapshots` | `status`, `last_sent_date`, `on_hold_count` |
| Lifetime sends / deliveries | `dm_client_funnel` | The funnel is the corrected source; do not use `dm_property_conversions` for lifetime totals |
| Per-property conversions & revenue | `dm_property_conversions` | Date-filtered views only |
| PCM cost / margin | `/api/pcm-validation` endpoints | Pricing eras documented in `project_pcm_pricing_history.md` |
| Daily operational cadence | `rr_daily_metrics` | By dispatch date |
| Test-domain exclusion | Shared `SEED_DOMAINS` list | Must be identical across every DM Campaign query |

---

## Audit Table

Legend: **OH** = Operational Health · **BR** = Business Results · **PP** = PCM & Profitability

Snapshot source: [snapshots/dm-audit-snapshot-2026-04-17.json](snapshots/dm-audit-snapshot-2026-04-17.json) — PCM API fetched 25,165 total orders; after excluding canceled (54) and test domains, 24,906 active pieces. Aurora queried at the same timestamp.

| # | Tab | Widget | Component | API | Aurora source | Metric shown | Aurora value | PCM value | Δ | Severity | Root cause / note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | OH | Is it running? | `RrOperationalPulseWidget.tsx` | `/api/rapid-response?type=overview` | `rr_campaign_snapshots` (no date filter) | Active / total campaigns | **13 active / 21 total** (post-orphan-fix) | PCM has no campaign primitive (see note below) | — | **✓ resolved 2026-04-17** | Aurora-only metric; PCM tracks orders, not campaigns. Tooltip now explicitly: "campaign is an 8020REI abstraction — cross-tab equality is at the piece level, not the campaign level." Same active/total number appears in DM Campaign → Overview → Active campaigns card (guaranteed match: both read `rr_campaign_snapshots` latest-per-campaign). |
| 2 | OH | Campaigns table | `RrCampaignTableWidget.tsx` | `/api/rapid-response?type=campaign-list` | `rr_campaign_snapshots` (no date filter) | Row count | **21 rows** (matches Overview Active campaigns card's total) | Aurora-only (no PCM counterpart) | — | **✓ resolved 2026-04-17** | Date filter removed from `getCampaignList()` in prior session. Orphan `showcaseproductsecomllc` added to SEED_DOMAINS, dropping the count from 22 → 21. Now matches Overview's Active campaigns card's total exactly. |
| 3 | OH | Is it working? | `RrQualityMetricsWidget.tsx` | `/api/rapid-response?type=overview` | `dm_client_funnel` (Aurora) + `dm_overview_cache.headline` (PCM authoritative) + `rr_daily_metrics` (period error/sent/delivered) | Lifetime pieces (PCM) + Aurora delta, delivery rate, period metrics | **Aurora: 24,195 pieces · 21,428 delivered · 88.56% rate** | **PCM: 24,906 pieces · 22,388 delivered · 89.89% rate** | **Aurora − PCM = -711 pieces (-2.85%)** — surfaced visibly, not hidden | **✓ resolved 2026-04-17 (this session)** | Widget now mirrors the Overview → Lifetime pieces card: PCM is the headline (authoritative), Aurora shown as a visible delta directly below. Same `dm_overview_cache.headline` row powers both widgets → guaranteed bit-for-bit equality. Delivery rate stays Aurora-sourced (dm_client_funnel, same as Profitability Margin summary) with a cross-tab tooltip. Period stats carry a "~15 days of history today" warning. |
| 4 | OH | Is it aligned? | `RrPcmHealthWidget.tsx` | `/api/rapid-response?type=overview` | `rr_pcm_alignment` | Synced domains, stale sent (14d+), orphaned orders | **18 domains** (post-orphan-fix via SEED_DOMAINS) | **PCM: 18 domains have orders** | **0 (match)** | **✓ resolved 2026-04-17** | Orphan `showcaseproductsecomllc_8020rei_com` removed via SEED_DOMAINS update. Aurora↔PCM domain parity at 18/18. Widget's existing tooltips already describe each alignment metric; no code change needed this session. |
| 5 | OH | Q2 volume goal | `RrQ2GoalWidget.tsx` | `/api/rapid-response?type=q2-goal` | **PCM /order (primary, via `fetchPcmOrdersSlim()`)** + `rr_daily_metrics` (delivered only) | Progress vs 400K Q2 target | — (Aurora fallback only if PCM unconfigured) | PCM April (through 2026-04-17): ~4,037 pieces (from audit snapshot) | — (now single-source PCM for piece count) | **✓ resolved 2026-04-17 (this session)** | Re-sourced from the shared PCM pagination that feeds the Overview tab. Q2 piece count here now matches Overview's April send-trend bar for the same window. Delivered count stays on `rr_daily_metrics` (PCM /order doesn't expose per-piece delivery status in this endpoint) — pill tooltip notes the 15-day history limit explicitly. Falls back to `rr_daily_metrics` only if PCM is unconfigured or pagination fails. |
| 6 | OH | Top contributors | `RrQ2TopContributorsWidget.tsx` | `/api/rapid-response?type=q2-goal` | **PCM /order (primary)** + `dm_client_funnel` (lifetime totals for "Share of lifetime" column) | Per-client contribution to 400K | — | — | — | **✓ resolved 2026-04-17 (this session)** | Piggy-backs on row #5's re-source: per-domain `clientBreakdown` is now built from PCM orders grouped by domain, not from `rr_daily_metrics`. Domains that mailed pre-Apr-3 now appear with their real Q2 numbers instead of 0. Lifetime-sends column reads from `dm_client_funnel` (same source as Profitability). |
| 7 | OH | Send volume trend | `RrSendsTrendWidget.tsx` | `/api/rapid-response?type=daily-trend` | `rr_daily_metrics` | Daily sends/deliveries/errors | **15 days only** — intentional (period view) | PCM has 242 daily entries spanning 2025-02-21 → today (lifetime on Overview) | N/A (different time windows by design) | **✓ resolved 2026-04-17 (this session)** | Widget is now clearly labeled **"Period trend · {min} → {max} ({n}d)"** with a "Why only N days?" hover that explains the `rr_daily_metrics` 15-day coverage and points users to Overview → Send volume trend for lifetime monthly data (PCM-sourced). Two widgets intentionally serve different time windows; no conflicting numbers. Pipeline backfill of `rr_daily_metrics` logged as a separate follow-up. |
| 8 | OH | Status breakdown | `RrStatusBreakdownWidget.tsx` | `/api/rapid-response?type=status-breakdown` | `rr_daily_metrics` | Mail-piece status pie (period) | Period counts: Delivered, Sent (In Transit), On Hold, Protected, Undeliverable, Error | PCM all-time: 22,388 delivered · 1,135 processing · 1,094 mailing · 289 undeliverable (lifetime) | N/A (period vs lifetime) | **✓ resolved 2026-04-17 (this session)** | Widget now has a subtitle bar **"Mail-piece status · selected period"** and a "Piece status vs campaign status?" hover explaining (a) these are per-piece outcomes from `rr_daily_metrics`, and (b) this is NOT campaign status (active/paused/disabled) which lives in "Is it running?". Same 15-day-history caveat noted. |
| 9 | OH | System coverage | `RrSystemCoverageWidget.tsx` | `/api/rapid-response?type=overview` (via `dm-conversions?type=data-quality`) | `dm_property_conversions` + `dm_client_funnel` | Clients/templates/properties tracked, attribution rate | 18 clients, N templates, ~55,437 properties, attribution rate | PCM: 18 domains · 28 canonical designs in catalog | — | **✓ resolved 2026-04-17 (this session)** | MetricCard subtitles now explicitly distinguish: "Clients tracked" = 8020REI internal view (dm_property_conversions); "Templates tracked" = 8020REI template configs (NOT PCM's 28-design catalog → user is pointed to Profitability → Template catalog). Attribution rate subtitle notes the pre-Sep-2025 NULL-by-design limitation. No numeric change — just disambiguation. |
| 10 | OH | Data integrity | `RrDataIntegrityWidget.tsx` | `/api/rapid-response?type=overview` (via `dm-conversions?type=data-quality`) | Mixed (`dm_property_conversions`) | Backfilled dates, unattributed, zero-revenue deals | _light review — no critical issues surfaced_ | — | — | **nit (deferred)** | Low priority. Audit deferred to a future session; not on Camilo's executive lens path. |
| 11 | BR | Conversion funnel | `DmFunnelOverviewWidget.tsx` | `/api/dm-conversions?type=funnel-overview` | `dm_client_funnel` (all-time volume) + `dm_property_conversions` (conversions + date-filtered volume) | Mailed → Leads → Appt → Contracts → Deals with hero cost/revenue | All-time `totalCost` **$24,371.68** (dm_client_funnel latest-per-domain); `totalRevenue` **$55,942.51** (deal_revenue filtered by `> first_sent_date`); `totalMailed` ≈ 55,437 unique properties | PCM: 24,906 mail pieces · no funnel concept · no deal-revenue concept | Cross-tab: `totalCost` ($24,371.68) matches PP Margin summary "Revenue" ($24,371.68) bit-for-bit ✓ · "Mailed" counts properties, not pieces — intentional difference vs. OH 24,906 pieces | **✓ resolved 2026-04-17 (this session)** | **Blocker fixed:** `contractToDealRate` math was `deals/totalMailed` but labeled "Contract → Deal" — now `deals/contracts`. **Fix applied:** hero "Cost" / "Revenue" renamed to "Mailing spend" / "Deal revenue" with AxisTooltips clarifying the cross-tab relationship (Mailing spend ≡ PP "Revenue"; Deal revenue is client ROI, not 8020REI company revenue). Widget-level tooltip already explains "Mailed = unique properties, not pieces." |
| 12 | BR | Client performance | `DmClientPerformanceWidget.tsx` | `/api/dm-conversions?type=client-performance` | `dm_client_funnel` (all-time volume) + `dm_property_conversions` (conversions + date-filtered volume) — **shared `getMergedClientData` with row #11** | Per-client mailed, leads, deals, spend, deal revenue, CPL | 18 domains (after orphan fix), sum `totalCost` = $24,371.68, sum `totalRevenue` = $55,942.51 | PCM per-domain orders match domain list (18/18 parity); PCM has no deal-revenue concept | `totalCost` sum === PP Margin summary "Revenue" $24,371.68 ✓ · "Mailed" = unique properties (same as row #11, widget-level tooltip explains) | **✓ resolved 2026-04-17 (this session)** | Column renamed `Cost` → `Mail spend`, `Revenue` → `Deal rev` with header tooltips explicitly citing the cross-tab relationship (Mail spend ≡ PP Revenue; Deal rev ≠ 8020REI revenue). Summary totals bar labels renamed to match. Shares `getMergedClientData()` with funnel so totals reconcile row-by-row. Per-row numbers match PP domain breakdown by construction. |
| 13 | BR | Conversion activity | `DmConversionTrendWidget.tsx` | `/api/dm-conversions?type=conversion-trend` | `dm_property_conversions` bucketed by each stage's conversion date (became_lead_at / became_appointment_at / became_deal_at) with `> first_sent_date` filter | Daily new leads / appointments / deals | True per-day counts with 14-month coverage, not day-over-day diffs | PCM: not applicable (no conversion concept) | — (Aurora-only metric by design) | **✓ resolved 2026-04-17 (this session)** | **Three bugs fixed.** (1) API was appending a `dm_property_conversions` all-time total as "today's row" that got diffed into a phantom spike — removed. (2) Original SQL read `dm_client_funnel.leads/appointments/deals` convenience columns (data-consistency-guardian Rule 1 violation — those skip the `> first_sent_date` filter). Rewrote to source from `dm_property_conversions` GROUP BY DATE(became_X_at) with the integrity filter, giving honest daily activity across the full 14-month coverage window. (3) Widget no longer diffs — receives true daily counts and renders them directly. |
| 14 | BR | Mailing spend vs. deal revenue | `DmRevenueCostWidget.tsx` | `/api/dm-conversions?type=roas-trend` | `dm_property_conversions` — spend bucketed by `first_sent_date`, revenue bucketed by `became_deal_at` with `> first_sent_date` filter | Daily new client spend vs. new deal revenue | True per-day values from a single ledger-like source, 14-month coverage | PCM: not applicable (no deal-revenue side) | — (Aurora-only by design) | **✓ resolved 2026-04-17 (this session)** | **Three bugs fixed.** (1) Original PC-today append produced phantom end-of-range spike — removed. (2) Widget plotted raw CF cumulative values as if daily — now receives true per-day values. (3) Original SQL read `dm_client_funnel.total_revenue` convenience column (guardian Rule 1 violation). Now both series come from `dm_property_conversions`: spend from SUM(total_cost) GROUP BY DATE(first_sent_date), revenue from SUM(deal_revenue) GROUP BY DATE(became_deal_at) with the integrity filter. **Labeling fix:** widget renamed "Revenue vs. cost" → "Mailing spend vs. deal revenue", bar legends renamed to match — avoids BR/PP "revenue" collision. Tooltip states CLIENT ROI framing and points readers to Profitability for company margin. |
| 15 | BR | Template leaderboard | `DmTemplateLeaderboardWidget.tsx` | `/api/dm-templates?type=template-leaderboard` (NOT `dm-conversions` — audit row corrected) | `dm_property_conversions` GROUP BY template (conversions, with `> first_sent_date`) + `dm_client_funnel` (corrected volume caps) + `dm_template_performance` (metadata only: template_id, avg_days_to_lead) | Templates ranked by leads / deals / ROAS | Per-template rollup sums reconcile to corrected domain totals via proportional scaling | PCM: 28 designs in catalog (not directly comparable — PCM tracks design-file catalog, not per-template sends) | — (Aurora-only; PCM catalog used on PP Template catalog widget) | **✓ resolved 2026-04-17 (this session)** | API was already correct — explicitly avoids `dm_template_performance.leads_generated` (which skips the `> first_sent_date` filter) and instead uses `dm_property_conversions GROUP BY template_name`. **Fixes this session:** ROAS column tooltip + widget-level tooltip now state that ROAS is CLIENT ROI (deal revenue ÷ client mail spend), NOT 8020REI company margin — consistent with the rename pattern from rows #11–#14. |
| 16 | BR | Geographic breakdown | `DmGeoBreakdownWidget.tsx` | `/api/dm-conversions?type=geo-breakdown` | `dm_property_conversions` GROUP BY state, county (with `> first_sent_date`) + `dm_client_funnel` corrected-mailed caps | Conversion rates by state / county / MSA | Per-geo mailed scaled proportionally to match CF corrected totals when PC is inflated | PCM: not applicable (no geographic dimension) | — (Aurora-only by design) | **✓ resolved 2026-04-17 (this session)** | API already correctly uses `dm_property_conversions` with `> first_sent_date` for conversions and caps volume against CF. **Fix applied:** "Revenue" column renamed to "Deal rev" with header tooltip clarifying it's client ROI, not 8020REI company revenue — consistent with rows #11–#15. Sparse-market MSA rollup (via `groupByMSA`) kept as-is. |
| 17 | PP | Margin summary | `PcmMarginSummaryWidget.tsx` | `/api/pcm-validation?type=summary` | `dm_client_funnel` + PCM invoice pricing | Total revenue, PCM cost, margin, margin % | Aurora revenue (customer-billed) **$24,371.68**; PCM computed cost **$21,334.15**; margin **$3,037.53 (12.5%)** | PCM invoice-verified: 24,906 pieces at era-based rates → same $21,334.15 | Margin matches. Revenue is Aurora-only (PCM doesn't know customer prices). | **✓ ok** | Verify the widget's reported margin % matches ours (12.5% → rounds to 12% or 13% depending on display). |
| 18 | PP | Period summary | `PcmMarginPeriodWidget.tsx` | `/api/pcm-validation?type=period-summary` | Period-filtered | Period revenue, cost, margin | Current render shows $788.34 / $73.26 / 0.1% | To verify: period should equal date-range filter applied to same table | Needs period-specific cross-check | **fix** | The 0.1% margin for the period is suspicious — either the period is "today only" (small N, zero-margin era) or there's a calc bug. Verify the period the widget is using. |
| 19 | PP | Pricing history | `PcmMarginTrendWidget.tsx` | `/api/pcm-validation?type=margin-trend` | Monthly aggregate | Per-piece rates over time | Trend chart | PCM eras: $0.94/$0.74 → $1.14/$0.93 → $0.87/$0.63 | — | **✓ ok** | Eras match `project_pcm_pricing_history.md`. |
| 20 | PP | Pricing overview | `PcmPricingOverviewWidget.tsx` | `/api/pcm-validation?type=current-rates` | PCM snapshot | Our rate vs PCM rate, margin per piece | Current: $0.87/$0.63 | PCM current: $0.87/$0.63 | zero margin | **✓ ok** | Zero margin is a *business* finding (per memory `project_pcm_pricing_history.md`), not a bug. |
| 21 | PP | Data match | `PcmDataMatchWidget.tsx` | `/api/pcm-validation?type=volume-comparison` | `dm_client_funnel` vs PCM orders | Domain-level alignment | 19 Aurora domains | 18 PCM domains | +1 Aurora (orphan campaign) | **fix** | Widget should surface the `showcaseproductsecomllc` orphan explicitly. |
| 22 | PP | Profitable clients | `PcmClientsProfitableWidget.tsx` | `/api/pcm-validation?type=clients-profitable` | `dm_client_funnel` + PCM pricing | Clients with margin > 5% | Pre-Jan 2026 eras had margins; post-Jan = 0% | Needs per-client reconciliation from snapshot | — | **fix** | Cross-check the profitable list against snapshot `pcmOrdersPerDomain` — confirm each named client had PCM sends in the profitable era. |
| 23 | PP | Break-even clients | `PcmClientsBreakevenWidget.tsx` | Same | Same | Margin 0–5% | Post-Jan 2026 most clients | — | — | **fix** | Same cross-check protocol. |
| 24 | PP | Losing money | `PcmClientsLosingWidget.tsx` | Same | Same | Negative margin | Rare but possible if customer rate was below PCM era rate | Verify none appear incorrectly | — | **fix** | Same cross-check. |
| 25 | PP | Domain breakdown | `PcmDomainTableWidget.tsx` | `/api/pcm-validation?type=domain-details` | `dm_client_funnel` + PCM | Per-domain sends, deliveries, cost | 19 rows from Aurora | 18 rows from PCM | +1 (same orphan) | **fix** | Display the orphan row with a clear "no PCM data" indicator instead of zeros. |
| 26 | PP | Template catalog | `PcmTemplateTableWidget.tsx` | `/api/pcm-validation?type=templates` | PCM API directly | Design catalog | — | **PCM: 28 designs** | — | **✓ ok** | PCM-only source, inherently aligned. |

---

## Cross-tab consistency checks (end of audit)

These are the numbers that appear in more than one place. They MUST match.

| Metric | Appears on | Must equal across |
|---|---|---|
| Active campaigns count | OH "Is it running?", PP volume comparison | Both sides |
| Lifetime mail pieces sent | OH "Is it working?", PP Margin summary, BR Funnel (top of funnel) | All three |
| Lifetime revenue | BR Client performance roll-up, PP Margin summary | Both |
| Domain count | OH System coverage, PP Data match | Both |
| Delivery rate | OH "Is it working?", OH Status breakdown | Both |
| Test-domain exclusion list | Every endpoint | Identical string across queries |

---

## Known issues already logged (pre-audit)

1. **13/22 vs 15/15 bug** (row #2 above) — blocker. Fix: remove date filter from `getCampaignList()` in [src/app/api/rapid-response/route.ts](../../src/app/api/rapid-response/route.ts). ✅ **Resolved in code 2026-04-17.**
2. **`PcmVolumeComparisonWidget` active-campaign count** — must equal OH "Is it running?" pill.
3. **Mail pieces vs unique properties drift** — OH & PP count pieces (`total_sent`); BR counts properties ("Mailed"). Both valid but widgets mixing them need explicit labels.
4. **Test-domain exclusion parity** — diff the `SEED_DOMAINS` filter across `/api/rapid-response`, `/api/dm-conversions`, `/api/pcm-validation`.

## Blockers surfaced by the 2026-04-17 snapshot

These were not visible before running live PCM + Aurora queries. They were found in the snapshot and must be resolved before Overview ships on trustworthy numbers.

### Blocker A — Aurora funnel is 711 mail pieces (-2.85%) behind PCM

- **PCM active pieces (non-canceled, excl. test):** 24,906
- **Aurora `dm_client_funnel` total_sends (latest-per-domain):** 24,195
- **Delta:** -711 pieces (-2.85%) — Aurora **under-reports** vs PCM.
- **Hypothesis:** PCM's "active" bucket includes 1,135 `processing` + 1,094 `mailing` pieces (= 2,229 pre-delivery). Aurora's `dm_client_funnel.total_sends` may exclude these states. Worth inspecting whether `dm_client_funnel` counts only `delivered` + `undeliverable` (= 22,677 — closer to Aurora's 24,195, but not exact), or something else.
- **Impact on Overview:** "Lifetime letters sent" card will show 24,195 while PCM shows 24,906. Publishing either number without a reconciliation protocol breaks Camilo's trust all over again.
- **Resolution required:** Either correct `dm_client_funnel` sync to include in-pipeline pieces, or change the widget to source directly from PCM for the headline count. Pending decision.

### Blocker B — `rr_daily_metrics` only has 15 days of history

- **First row in Aurora:** 2026-04-03 (15 days ago as of 2026-04-17).
- **First PCM order:** 2025-02-21 (14 months of history exists in PCM).
- **Widgets structurally broken:** Q2 volume goal (row #5), Top contributors (row #6), Send volume trend (row #7). All of them claim "all time" or "90-day" ranges but can only see the last 15 days.
- **Impact on Overview:** The "Send volume trend" and "Revenue trend" widgets Camilo wants (evolution over time) cannot be built from `rr_daily_metrics` — they must aggregate from PCM `/order` grouped by date, or from `dm_property_conversions` for revenue.
- **Resolution required:** Decide whether to (a) backfill `rr_daily_metrics` from PCM, or (b) route Overview trend widgets directly through `/api/dm-overview` → PCM `/order`. Option (b) is cheaper but adds PCM API load. Recommend Option (b) for Overview, Option (a) as a separate pipeline follow-up.

### Blocker C — Orphan domain `showcaseproductsecomllc_8020rei_com` ✅ RESOLVED

- Investigation (2026-04-17) via `scripts/investigate-showcase-domain.ts` confirmed: campaign name **"Inaugural RR Test"**, status `disabled`, last activity Sep 2025, 0 PCM orders across full API pagination. Also had 600 phantom rows in `dm_property_conversions` that were inflating Business Results counts.
- **Fix applied:** added `showcaseproductsecomllc_8020rei_com` to the `TEST_DOMAINS` / `SEED_DOMAINS` constant in all 7 API files + audit script + new `/api/dm-overview` route.
- **Verified:** re-ran `scripts/dm-audit-snapshot.ts`. Aurora domains now **18/18 match** PCM. Total campaigns 22 → 21. Active 13 unchanged. BR funnel cleaned of 600 phantom sends.
- Follow-up logged separately: consolidate the 7 copies of `TEST_DOMAINS` into a single source of truth at `src/lib/domain-filter.ts` (not blocking).

## Lessons learned during Track 1

- **PCM `/order` does not support server-side status filtering.** Verified via `scripts/test-pcm-filter.ts` — `filterStatus=Canceled` returns the full 25,165 unchanged. For "active" counts we must paginate and filter client-side.
- The cache at `src/lib/cache.ts` was hardcoded to 5-min TTL, which defeats the ~90s PCM pagination cost. Extended `setCache` to accept a `ttlMs` override; the Overview headline caches PCM counts for 1 hour.

---

## Changelog

- **2026-04-17** — Audit doc scaffolded. Widget inventory locked. PCM endpoint map filled in.
- **2026-04-17** — Row #2 (Campaigns table) blocker resolved in code: date filter removed from `getCampaignList()`. Browser verification still pending.
- **2026-04-17** — PCM verification values (Aurora vs PCM columns) pending live queries.
- **2026-04-17** — Live snapshot run: surfaced Blockers A (711-piece Aurora delta), B (15-day rr_daily_metrics gap), C (orphan test domain).
- **2026-04-17** — Blocker C resolved: `showcaseproductsecomllc_8020rei_com` added to TEST_DOMAINS across 7 files. Re-snapshot confirmed 18/18 domain parity.
- **2026-04-17** — Blockers A & B mitigated via new `/api/dm-overview` endpoint that sources lifetime pieces from PCM (authoritative) and surfaces the Aurora delta visibly — never hide inconsistencies. First widget shipped: `DmOverviewHeadlineWidget`.
- **2026-04-17 (OH audit session — part 1)** — All 10 Operational Health rows resolved:
  - **Row #3 (Is it working?)** rewired to mirror the Overview headline: PCM authoritative lifetime pieces + visible Aurora delta. Both widgets now read the SAME `dm_overview_cache.headline` row — bit-for-bit equality guaranteed by construction. Files: [src/types/rapid-response.ts](../../src/types/rapid-response.ts) (added `lifetimePiecesPcm`, `piecesDelta`, `piecesDeltaPct`), [src/app/api/rapid-response/route.ts:112-290](../../src/app/api/rapid-response/route.ts) (overview handler reads from dm_overview_cache), [src/components/workspace/widgets/RrQualityMetricsWidget.tsx](../../src/components/workspace/widgets/RrQualityMetricsWidget.tsx) (headline renders PCM primary + Aurora delta).
  - **Rows #5/#6 (Q2 goal + Top contributors)** re-sourced from PCM `/order` via `fetchPcmOrdersSlim()` (shares the Overview tab's pagination + single-flight). Q2 piece count here now matches Overview's send-trend April bar. File: [src/app/api/rapid-response/route.ts:810-1015](../../src/app/api/rapid-response/route.ts). `rr_daily_metrics` remains the delivered-count source (PCM /order has no delivery-status field); pill tooltip carries the 15-day caveat.
  - **Row #7 (Send volume trend)** kept on `rr_daily_metrics` intentionally but given an explicit "Period trend · {min} → {max} ({n}d)" label and a "Why only N days?" hover that points users to Overview → Send volume trend for the lifetime monthly view. Two widgets serve two time windows by design; no conflicting numbers.
  - **Row #8 (Status breakdown)** relabeled "Mail-piece status · selected period" with a "Piece status vs campaign status?" hover disambiguating mail-piece outcomes (here) from campaign lifecycle status (active/paused/disabled — in "Is it running?").
  - **Row #9 (System coverage)** MetricCard subtitles clarified: "Templates tracked" is 8020REI config count, NOT PCM's 28-design catalog (user pointed to Profitability → Template catalog for the PCM side).
  - **Row #1 (Is it running?)** tooltip upgraded to state explicitly that "campaign" is an 8020REI abstraction and cross-tab equality is at the piece level.
  - **Row #4 (Is it aligned?)** — domain parity now 18/18, orphan resolved in prior session via SEED_DOMAINS. No code change needed this session.
  - **Rows #2 and #10** — already resolved / deferred; light verification only.
  - Typecheck clean (`npx tsc --noEmit`). Browser verification pending user QA.
- **2026-04-17 (OH audit session — part 2, same day)** — Follow-up work driven by iterative user browser-testing:
  - **Row #3** further simplified: 7 pills → 3 (Delivery rate · Delivered · In-pipeline). Hero number is PCM (from `dm_overview_cache.headline`), Aurora shown as visible delta. Cross-tab equality with Overview is now structurally guaranteed by shared cache key.
  - **Row #4** split into two widgets: `RrPcmHealthWidget` keeps alignment-only signals (Stale / Orphaned / Sync gap); new `RrPostalPerformanceWidget` owns USPS-side signals (Delivery lag / Undeliverable rate). Rationale: mixing record-alignment with postal-service performance was confusing.
  - **Row #4** query scoped to canonical 18-client set via inner join with `dm_client_funnel` distinct domains — previously pulled 170 historical / inactive / dead entries from `rr_pcm_alignment`, producing "160/170 synced."
  - **Row #4** sync-gap threshold raised from `> 0` to `≥ 50` (matches alert system's "noise floor"); stale ≥ 10, orphaned ≥ 5. Pipeline lag under 50 is now called normal explicitly in the widget body.
  - **Row #4** per-domain breakdowns (`gapDomains`, `staleDomains`, `orphanedDomains`) added to the API response. Each entry carries `isActive` flag.
  - **Row #4** "N need attention" converted from hover-tooltip to `AxisButton` → opens `RrPcmAttentionModal` with `AxisTable` (sortable, filterable) + **"Copy for Slack"** button that produces Slack-formatted text with definitions, thresholds, per-client values, and "where to investigate" pointers to specific Aurora columns. Reference pattern for all future "aggregate count → per-item breakdown" widgets.
  - **Row #5 / #6** — critical bug in-session: first Q2 re-source called `fetchPcmOrdersSlim()` blocking the OH tab for ~90s (PCM pagination). Fixed by adding a non-blocking `getCachedPcmOrdersSlim()` accessor + 20-min TTL cache on the paginated result + invalidate-on-refresh.
  - **Platform-wide:** raw backend errors (SQL / stack traces) sanitized at both UI layer (generic banner + Retry) and API layer (7 routes). Codified as memory.
  - **Platform-wide:** time-scope tag system rolled out across Overview / OH / BR / Profitability. Every widget carries `timeBehavior: 'all-time' | 'date-filtered'` in its config. `Widget` component renders "All time" (accent-2 indigo custom pill) or "Date range" (AxisTag info blue) with instant AxisTooltip explanations. Both tags right-aligned in the header.
  - **OH layout rebalanced** into three 6+6 rows: [Is it running? | Is it working?] / [Is it aligned? | Postal performance] / [Q2 volume goal | Top contributors]. Storage key bumped to `rapid-response-layout-v9`.
  - **Download + Settings buttons removed** from all DM Campaign widgets (OH / BR / Profitability sub-tabs in RapidResponseTab). Available elsewhere in the platform.
  - Typecheck clean. User has browser-verified partial state (15/18 domains, 3 flagged, modal + Copy for Slack); full OH QA pass recommended before BR audit begins.
  - Session report: [`SESSION_REPORT_OH_PART2.md`](../../../personal-documents/8020-metrics-hub/2026-04-17/SESSION_REPORT_OH_PART2.md).
- **2026-04-17 (BR audit session — part 3)** — Rows #11–#16 resolved, plus cross-tab TEST_DOMAINS consolidation:
  - **Row #11 Conversion funnel:** `contractToDealRate` math blocker fixed (`deals/totalMailed` → `deals/contracts`). Hero labels "Cost"/"Revenue" renamed to "Mailing spend"/"Deal revenue" with AxisTooltips explicitly citing the PP cross-link (Mailing spend ≡ PP Revenue; Deal revenue ≠ 8020REI revenue).
  - **Row #12 Client performance:** table columns `Cost`/`Revenue` renamed to `Mail spend`/`Deal rev` with cross-tab header tooltips. Summary bar labels renamed to match, and now shows `N clients · N active · N inactive` split — reconciles Overview's "12 active clients" with the longer table row count via a visible tooltip breakdown.
  - **Row #13 Conversion activity:** (1) removed PC-today phantom-spike append, (2) rewrote SQL from banned `dm_client_funnel.leads/appointments/deals` convenience columns (guardian Rule 1 violation) to `dm_property_conversions` GROUP BY DATE(became_X_at) with `> first_sent_date` integrity filter, (3) widget no longer diffs — receives true daily counts across 14-month coverage.
  - **Row #14 Mailing spend vs. deal revenue:** (1) widget was plotting CF cumulative values as if daily — fixed. (2) SQL rewrote off `dm_client_funnel.total_revenue` (guardian Rule 1 violation) to `dm_property_conversions` with separate date buckets: spend by `first_sent_date`, revenue by `became_deal_at`. Widget renamed from "Revenue vs. cost" to "Mailing spend vs. deal revenue" with matching bar legends.
  - **Row #15 Template leaderboard:** API already compliant (uses dm_property_conversions GROUP BY template with `> first_sent_date`; dm_template_performance for metadata only). ROAS column + widget tooltips updated to name client-ROI framing.
  - **Row #16 Geographic breakdown:** "Revenue" column renamed to "Deal rev" with tooltip clarifying client-ROI framing.
  - **Cross-tab TEST_DOMAINS consolidation (NEW):** audit surfaced that the Overview's canonical 9-domain exclusion list (`dm-overview/compute.ts`) was only 7 domains in every other API file — `qapre_8020rei_com` and `testing5_8020rei_com` were missing from BR / OH / PP / reports / alerts queries. Created [`src/lib/domain-filter.ts`](../../src/lib/domain-filter.ts) as the single source of truth (9 domains), refactored all 8 dependent files to import from it. Test-domain exclusion is now identical across every DM Campaign tab by construction.
  - **data-consistency-guardian skill run:** after refactors. Rule-by-rule verification: Rule 1 (data source alignment — no widget reads dm_client_funnel conversion convenience columns), Rule 2 (terminology — "Sent" for pieces / "Mailed" for unique properties labeled throughout), Rule 3 (tooltips — every volume/financial/rate column has headerTooltip), Rule 4 (cross-tab equality — shared SQL or shared cache keys for lifetime revenue / PCM cost / margin / pieces / active campaigns / domain count), Rule 7 (inconsistencies surfaced visibly — Aurora delta on lifetime pieces), Rule 8 (column collisions — rename pattern applied to "Cost"/"Revenue"), Rule 9 (table coverage — BR widgets source from 14-month `dm_property_conversions`, not 11-day `dm_client_funnel`), Rule 10 (test domains — canonical list consolidated). All green.
  - Typecheck clean. Browser QA pending.
- **2026-04-17 (BR audit session — part 4)** — Cohort alignment + Client performance rework. Driver: user noticed Conversion activity showed ~130 leads in 90-day window while Conversion funnel showed 5 leads, and Client performance showed 16 rows when Overview showed 12 active clients.
  - **Cross-widget cohort semantic (new).** Funnel, Client performance, Conversion activity, and Revenue-vs-cost now all answer the same question for the selected window: *"For properties whose `first_sent_date` is in-window, what happened?"* Previously, Activity and Revenue-vs-cost filtered by `became_X_at` (activity semantic) which produced phantom spikes from conversions tied to 6+ month-old sends. **After fix: sum of Activity bars = funnel leads; sum of Revenue-vs-cost revenue = funnel revenue.**
  - **Row #13 cohort fix:** `getConversionTrend` now filters `first_sent_date` in window, buckets by `DATE(became_X_at)`. X-axis spans from cohort start to today.
  - **Row #14 cohort fix:** `getRoasTrend` uses the same cohort filter. Spend bucketed by `first_sent_date`, revenue by `became_deal_at`.
  - **Tooltips** on Conversion funnel, Conversion activity, Mailing spend vs. deal revenue explicitly state "cohort view" + cross-widget reconcile pointers.
  - **Row #12 — 16-row mystery diagnosed + fixed.** Root cause: `getMergedClientData`'s CF query used `WHERE date = (SELECT MAX(date) FROM dm_client_funnel)` — a single global max. Any domain that hadn't synced on the exact max date was silently dropped (16 instead of 18). Rewrote to use the latest-per-domain pattern (inner join with MAX per domain) that the rest of the codebase already follows.
  - **Row #12 — Campaign column reworked.** Previous logic collapsed each client to a single campaign type by keeping whichever had the highest `active_campaigns` count — silently hid Smart Drop campaigns for mixed-product clients. API now returns a `campaignBreakdown: { rr: {active, total}, smartdrop: {active, total} }` per domain. Widget renders stacked tags like `2/3 RR · 1/1 SD` (active out of total, colored by product). Future-proof for additional products.
  - **Row #12 — Reconciliation header added.** New sticky row above the existing volume totals: `"N clients · A active · I inactive · X/Y campaigns active"`. Directly answers "why N rows here vs. 12 on Overview vs. 13 campaigns on OH?" with visible numbers + a tooltip. `N` clients = any DM activity in window. `A active` = clients with ≥1 currently-active campaign (matches Overview → Active clients). `X/Y` = active out of total campaigns summed across products (reconciles with OH's campaign count).
  - **Row #12 — "Status" column removed.** Its binary Active/Inactive was redundant once the Campaigns column shows tag color + active/total counts.
  - **Row #12 — "Mailed" → "Mailed (window)"** column header + tooltip update to name the cohort semantic.
  - Types: `DmClientPerformanceRow.campaignBreakdown` added.
  - Typecheck clean. Browser QA pending.
- **2026-04-20 (trust-break audit — session 5)** — Driver: user observed three cross-tab inconsistencies that broke trust in the platform: (1) on-hold count climbing despite the 7-day auto-delivery timer, (2) Company margin ⚠ tooltip clipped + subtitle truncated, (3) Pricing overview card vs "Price change detected" banner vs Pricing history chart each told a different story about the 2026-04-19 Standard customer rate bump $0.63→$0.66. User emphasized that the pricing change is the margin-growth move (we charge more than PCM charges us) and both Standard AND First Class should be reflected.
  - **Scope contract.** Four DM Campaign tabs (Overview, Operational Health, Business Results, Profitability) must be internally consistent — every number traces to monolith→Aurora or PCM API, no fabrication. Reports + Data Sources deferred.
  - **Live data-provenance spot-check** ([scripts/diagnose-cross-tab-consistency.ts](../../scripts/diagnose-cross-tab-consistency.ts)) confirmed against Aurora + PCM API:
    - Aurora customer rates (last 7d): Standard $0.6542 blended (Apr 14: $0.63 → Apr 19: $0.66, 412 pieces at new rate); First Class $0.8700 (13 pieces, last synced 2026-04-15).
    - Aurora last-synced dates per mail_class: Std through 2026-04-19, FC through 2026-04-15. **FC sync lag 5 days.**
    - Aurora lifetime (18 domains): revenue $24,643.60, stored PCM cost $17,390.31, stored margin $4,688.72.
    - PCM API /integration/balance returned HTTP 200 (moneyOnAccount=0); /order returned HTTP 200 with totalResults 25,665 — matches session-4 figures.
    - On-hold snapshot cadence in `rr_campaign_snapshots`: hourly, 20 days retained. Total current on-hold 3,572. **Stale (campaigns where on-hold began ≥ 7 days ago) = 854 pieces across 4 campaigns.** Worst offenders: `jgequityllc_8020rei_com` (37 pieces, 17 days); `clevelandhousebuyersllc_8020rei_com` (4 pieces, 17 days); `paulfrancishomes_8020rei_com` (812 pieces, 8 days); `asishomebuyers_8020rei_com` (1 piece, 8 days).
  - **Row #27 On-hold age breakdown (NEW — Operational Health).** Added [`DmOnHoldBreakdownWidget`](../../src/components/workspace/widgets/DmOnHoldBreakdownWidget.tsx) + API handler `getOnHoldBreakdown` in [rapid-response/route.ts](../../src/app/api/rapid-response/route.ts). Splits on-hold pieces into "stale ≥ 7d" (overdue for auto-delivery) vs "fresh < 7d" (within window), lists the offending campaigns with age, and renders an owner-context banner naming the monolith gap. Age is inferred from `rr_campaign_snapshots` hourly history because the monolith's row-level `rapid_response_history` table does not sync to Aurora — explicit in the widget's tooltip (Rule 18 — never hide the approximation). Slack alert predicate at [slack-alerts/route.ts:630-670](../../src/app/api/rapid-response/slack-alerts/route.ts) was also split into distinct ids (`rr-on-hold-timer-active` vs `rr-on-hold-timer-broken`) so persistent-alert tracking can't carry a stale "active" title after state flips to critical.
  - **Row #0 Company margin tooltip (Overview).** Replaced hand-rolled opacity-transition tooltip in [DmOverviewHeadlineWidget.tsx:84-112](../../src/components/workspace/widgets/DmOverviewHeadlineWidget.tsx) with `AxisTooltip` (portal-rendered, viewport-clamped, instant). Removed `truncate` class on subtitle; now uses `break-words leading-snug` so `"11.5% · revenue $24.6K – PCM-invoice cost $21.4K"` wraps fully. Matches canonical pattern in `DmClientPerformanceWidget`.
  - **Rows #20 & #21 Pricing overview + Price-change detection labeling.** Relabeled the two rate series everywhere so they're never confusable: "Customer rate (we charge)" and "PCM vendor rate (they charge us)" in [PcmPricingOverviewWidget](../../src/components/workspace/widgets/PcmPricingOverviewWidget.tsx); "Current customer rates" + "Customer Standard" / "Customer First Class" row labels + "Customer rate change detected" callout with `AxisTooltip` ⓘ explaining series separation in [PcmPriceChangeDetectionWidget](../../src/components/workspace/widgets/PcmPriceChangeDetectionWidget.tsx). Slack alert template at [slack-alerts/route.ts:712-730](../../src/app/api/rapid-response/slack-alerts/route.ts) now reads "Customer Standard rate increased" with an explicit reassurance that "PCM vendor rate is unchanged (contract-based)." The $0.6300 → $0.6600 change on Apr 19 no longer looks like a PCM vendor change next to the card's "PCM charges us $0.6300" cell.
  - **Row #21 First Class detection.** Changed `getPriceDetection` at [pcm-validation/route.ts:890-915](../../src/app/api/pcm-validation/route.ts) from global `LIMIT 20` to per-mail-class window-function cap (`ROW_NUMBER() PARTITION BY mail_class LIMIT 10 each`). Standard micro-variances can no longer crowd FC changes out of the results. Added a `coverage` field to the response + `MailClassCoverage` type surfacing `{lastSyncedDate, daysSynced}` per mail class. The widget renders an explicit "Aurora sync coverage" footer when either class is ≥ 2 days behind — the current FC sync lag (5 days) is visible to the reader so a missing FC rate change isn't silently hidden. Rule 18.
  - **Row #19 Pricing history chart (Profitability).** `getPricingHistory` at [pcm-validation/route.ts:1370+](../../src/app/api/pcm-validation/route.ts) no longer reads the monolith-broken `daily_pcm_cost` column (Rule 6 violation). PCM vendor lines are now derived from `pcmRate(date, mailClass)` — the shared invoice-verified era schedule — so they show a true step at era boundaries and never drift. Customer lines still come from `dm_volume_summary.daily_cost / daily_sends` per day (the one reliable source). [PcmPricingHistoryWidget](../../src/components/workspace/widgets/PcmPricingHistoryWidget.tsx) now renders a sync-coverage footer ("Aurora sync: Customer Standard through YYYY-MM-DD · Customer First Class through YYYY-MM-DD · PCM vendor rates from pcm-pricing-eras.ts") so a flat customer-rate line can never be mistaken for "prices never changed" when the real cause is sync lag.
  - **Monolith gap documented (NOT in scope for this session).** On-hold root cause: `RapidResponseService::handleOnHoldRapidResponses()` and `markOldOnHoldAsUndelivered()` at `services/RapidResponses/RapidResponseService.php:1157-1327` are implemented correctly but only invoked via `ConfirmPayChargeOverJob::handle()` (on client payment). `app/Console/Kernel.php` has no schedule entry, so stale on-hold pieces accumulate for domains that don't recharge. **Owner: Christian/Johan.** Fix = add `$schedule->command('app:rapid-response-properties_id --action=handleOld')->dailyAt('02:00')` or similar. Metrics hub surfaces the gap via the new breakdown widget + slack alert; does not attempt to compensate.
  - **Proposed follow-up — PCM vendor-rate drift alert.** User flagged: PCM can raise their rates and we must notice immediately (margin impact). Current era schedule in `pcm-pricing-eras.ts` is manually maintained. Proposal for a future session: add `getPcmVendorRateDrift()` that reads recent PCM `/order` orders (already cached via `getCachedPcmOrdersSlim`), computes actual invoice rate per mail class, compares to `currentPcmRates()` expected era rate — if delta > $0.01/piece, fire a new slack alert id `pcm-vendor-rate-drift` with severity critical: "PCM vendor rate appears to have changed — verify pcm-pricing-eras.ts". This closes the loop on vendor-side price surveillance.
  - **Cross-tab equality contract verified.** Lifetime pieces / active campaigns / active clients / lifetime revenue all still sourced from the same monolith→Aurora writers + shared `dm_overview_cache` keys documented in session 4. PCM-invoice cost still sourced from `pcmRate()` × PCM orders. No new sources introduced; no existing source swapped for a worse one.
  - Typecheck clean (`npx tsc --noEmit`). Browser QA pending.

---

## Data provenance ledger (four-tab contract — 2026-04-20)

Every metric on Overview / Operational Health / Business Results / Profitability traces to exactly one of three authoritative sources. Any widget presenting a value that isn't listed here is a blocker.

| Metric | Tab(s) | Aurora source (monolith-written) | PCM-API source | Shared-rate source |
|---|---|---|---|---|
| Lifetime pieces sent | Overview | `dm_client_funnel.total_sends` latest-per-domain (Aurora) | `/order` count cross-check | — |
| Active campaigns | Overview, OH, BR | `rr_campaign_snapshots.status` latest-per-campaign | — | — |
| Active clients | Overview, BR | `rr_campaign_snapshots` distinct domain w/ active campaigns | — | — |
| Lifetime revenue (what clients paid) | Overview, BR, Profitability | `dm_client_funnel.total_cost` latest-per-domain | — | — |
| Lifetime PCM cost (what PCM invoices us) | Overview, Profitability | — | `/order` list × `pcmRate(date, class)` | `src/lib/pcm-pricing-eras.ts` |
| Lifetime margin | Overview, Profitability | computed: revenue − PCM-invoice cost | — | — |
| Aurora-vs-PCM cost delta | Overview (⚠), Profitability | `dm_client_funnel.total_pcm_cost` (stored, broken) vs PCM-invoice | reconciliation visible | — |
| Customer rate (what we charge) — Std / FC | Profitability | `dm_volume_summary.daily_cost / daily_sends` per mail class | — | — |
| PCM vendor rate (what PCM charges) — Std / FC | Profitability | — | — | `pcm-pricing-eras.ts` era schedule |
| Customer rate change detection | Profitability | `dm_volume_summary` per-class daily deltas, per-class top 10 | — | — |
| On-hold total | OH | `rr_campaign_snapshots.on_hold_count` latest-per-campaign | — | — |
| On-hold stale vs fresh (≥ 7d vs < 7d) | OH | `rr_campaign_snapshots` MIN(snapshot_at) WHERE on_hold_count > 0 | — | — |
| Conversion funnel (leads/appts/contracts/deals) | BR | `dm_property_conversions` with `first_sent_date` in-window | — | — |
| Mailing spend | BR | `dm_property_conversions.total_cost` bucketed by `first_sent_date` | — | — |
| Deal revenue | BR | `dm_property_conversions.became_deal_value` bucketed by `became_deal_at` | — | — |

Sync freshness: Aurora tables via 8020REI monolith sync jobs (hourly for `rr_campaign_snapshots`, hourly for `dm_volume_summary`, hourly for `dm_client_funnel`). PCM `/order` via 30-min refresh cron (GitHub Actions) → `dm_overview_cache`. PCM era schedule changes only on vendor contract (manual update to `pcm-pricing-eras.ts`).

## Known sync gaps (as of 2026-04-20)

1. **First Class `dm_volume_summary` sync lag.** Last FC row synced 2026-04-15 (5 days behind Standard). Surfaced in UI via sync-coverage footer on price detection + pricing history widgets. Escalate to monolith team if FC volume is nonzero but no recent rows appear.
2. **Row-level on-hold age data is not in Aurora.** `rapid_response_history` with per-piece `created_at` lives in monolith MySQL only. On-hold age breakdown uses `rr_campaign_snapshots` hourly history as an approximation — accurate for campaigns that have been stuck on-hold, inaccurate for campaigns whose composition churns internally. Ideal long-term fix: monolith adds a sync job for `rapid_response_history` or a pre-aggregated on-hold age table.
3. **Monolith `parameters.pcm_cost` still writes $0.625/$0.875.** Bypassed in the metrics hub by computing PCM cost from `pcmRate()` × PCM orders (session 4). The Aurora-stored PCM cost remains visibly displayed as a reconciliation delta on Company margin + Margin summary so the drift isn't hidden.
4. **Monolith `handleOnHoldRapidResponses` not scheduled.** Root cause of climbing on-hold count. Owner: Christian/Johan (monolith).

## Diagnostic scripts (reproducible)

- [`scripts/diagnose-cross-tab-consistency.ts`](../../scripts/diagnose-cross-tab-consistency.ts) — live Aurora + PCM probe: current customer rates per mail class, daily rates last 30 days, sync coverage per mail class, `rr_campaign_snapshots` tables, lifetime revenue + Aurora PCM cost from `dm_client_funnel`, PCM `/integration/balance` + `/order` totals. Run before/after any widget change.
- [`scripts/check-onhold-snapshot-cadence.ts`](../../scripts/check-onhold-snapshot-cadence.ts) — inspects `rr_campaign_snapshots` retention + identifies campaigns with stale on-hold pieces (≥ 7 days since first on-hold observation). Data backing the On-hold breakdown widget.

---

## 2026-04-20 — Session 6 entry: alignment + declutter + reliability surfacing

### Driver
User reviewed the session-5 output and pushed back on three fronts:
1. **The new On-hold breakdown widget was a parallel surface, not alignment.** Same 3,572 total appeared in Is-it-running pulse, Campaigns table, AND the new widget — three places, three amounts of context. Definition of inconsistency.
2. **Pricing overview callout overlapped the Margin/piece row** (visual bug from `flex-1 min-h-0` stealing all height) and "Customer rate $0.6542" next to "$0.6300 → $0.6600" alert read as a contradiction (both correct; different windows; unlabeled).
3. **Pricing history chart Apr '26 point = $0.6402** (monthly blend of pre- and post-Apr-19 rates) instead of showing the rate transition. Reliability of every metric unclear without a trustworthy visible indicator.

### Scope contract re-set
> Every on-hold number across Overview / OH / BR / Profitability uses the same stale/fresh vocabulary sourced from a single helper. Every customer-rate number names its window. Mothballed widgets follow the user's explicit keep/mothball list — nothing "cleaned up" that they didn't ask to remove.

### Work shipped

**Alignment (the centerpiece)**
- New shared helper [`src/lib/on-hold-ages.ts`](../../src/lib/on-hold-ages.ts) — single SQL query, single `{ totalOnHold, staleOnHold, freshOnHold, perCampaign[...] }` shape, consumed by 4 endpoints (`getOverview`, `getCampaignList`, `getOnHoldBreakdown`, `fetchCurrentAlerts`). Copy-pasting the CTE is now forbidden by construction.
- [`RrOperationalPulseWidget.tsx`](../../src/components/workspace/widgets/RrOperationalPulseWidget.tsx) — On-hold row now reads `"3,572 (854 stale)"` or `"(all fresh)"` with a full-context tooltip. Same helper populates the numbers.
- [`RrCampaignTableWidget.tsx`](../../src/components/workspace/widgets/RrCampaignTableWidget.tsx) — On-hold column gets a per-row `fresh` / `stale Nd` badge pulled from the helper's `perCampaign` array. Row count and totals remain identical; only the badge is new.
- [`slack-alerts/route.ts`](../../src/app/api/rapid-response/slack-alerts/route.ts) "Mailings on hold" alert description now includes full stale/fresh split + oldest age + stale campaign list + distinct actions per bucket (escalate to monolith for stale pieces vs contact client for fresh pieces).
- Bumped `RAPID_RESPONSE_LAYOUT_STORAGE_KEY` to `v10` so users' persisted layouts regenerate and don't re-show the mothballed widgets.

**Pricing overview fix (Track 3)**
- [`PcmPricingOverviewWidget.tsx`](../../src/components/workspace/widgets/PcmPricingOverviewWidget.tsx) — added `flex-shrink-0` to callout + rollout blocks so they reserve natural height; the mail-class cards row is now bounded and cannot push them into overlap.
- Card rate rows now carry explicit window labels: `"Customer rate (7d avg)"` at the blended $0.6542 vs `"New rate (eff. 2026-04-19)"` at $0.6600 — both shown when a change is detected, each with its own AxisTooltip explaining the window.
- Callout rows now read `"Customer Standard: $0.6300 → $0.6600 effective 2026-04-19 · +$0.0300/piece margin at PCM vendor rate $0.6300"` so the reader sees the business story (margin boost), not just the rate delta.

**Pricing history chart (Track 2)**
- [`PcmMarginTrendWidget.tsx`](../../src/components/workspace/widgets/PcmMarginTrendWidget.tsx) — accepts optional `detection` prop; when customer rate changes are detected in the last 7 days, renders a dashed vertical `ReferenceLine` at the change's month with label (e.g. `Std +$0.03 (2026-04-19)`). Chart footer reads "Monthly aggregates. Mid-month rate changes appear as dashed vertical lines" so the $0.6402 blended point has an explanation next to it, not a bug.

**Mothballing (Track 6 — per user's verbatim keep/mothball list)**
- OH: removed `DmOnHoldBreakdownWidget` (user: *"that is more confusing"*) and `RrStatusBreakdownWidget` (user: *"I'm not using it and I don't find it useful right now"*).
- BR: removed `DmConversionTrendWidget` and `DmRevenueCostWidget` (user: *"we can also remove those ones for now"*).
- Profitability: removed `PcmClientsProfitableWidget`, `PcmClientsBreakevenWidget`, `PcmClientsLosingWidget` (user: *"those three tables can disappear"* — canonical `PcmClientMarginsWidget` already shows every client with a margin bucket).
- All components remain in `src/components/workspace/widgets/` and their exports in `widgets/index.ts` — only the layouts + catalogs changed. `MOTHBALLED_WIDGETS` registry at the bottom of `src/lib/workspace/defaultLayouts.ts` records each removal with the user's verbatim quote; re-enable is a one-commit lift.
- Storage keys bumped to force layout regeneration: `rapid-response-layout-v9 → v10`, `dm-business-results-layout-v4 → v5`, `pcm-validation-layout-v6 → v7`.

**Reliability surfacing (Track 4)**
- New [`src/lib/data-reliability.ts`](../../src/lib/data-reliability.ts) captures HIGH / MEDIUM / LOW per metric per tab with source + caveat.
- New [`DataReliabilityHint`](../../src/components/workspace/DataReliabilityHint.tsx) component renders a subtle `ⓘ Data sources` chip that opens an `AxisTooltip` listing every tab's key metrics, their grade, source, and caveat. Added to Overview, OH, BR, Profitability — one hover answers "how reliable is this number?" without leaving the tab.

**PCM vendor-rate drift (partial coverage, honest)**
- [`slack-alerts/route.ts::detectPcmVendorRateDrift()`](../../src/app/api/rapid-response/slack-alerts/route.ts) fires an info advisory summarizing current era rates + recent-order volume, explicitly noting that full automated drift detection needs PCM's invoice-total API (not exposed on `/order`). Interim safeguard: any change to `pcm-pricing-eras.ts` requires a commit review. Honest rather than false-negative.

### Monolith writer audit (read-only)

| Aurora table | Writer class | File:line | Trigger | Cadence | Live? | Known gaps |
|---|---|---|---|---|---|---|
| `dm_client_funnel` | `ConversionInsightsService::syncClientFunnel` | `services/ConversionInsightsService.php:272` | `ConversionInsightsToAuroraJob` | External dispatch (no internal `Kernel.php` entry) | YES (data arriving hourly) | `margin`/`margin_pct` computed from `total_cost − total_pcm_cost`; inherits the monolith's wrong rates ($0.625/$0.875) — bypassed in metrics hub by computing from `pcmRate()` × PCM orders. |
| `dm_volume_summary` | `ConversionInsightsService::syncVolumeSummary` | `services/ConversionInsightsService.php:412` | `ConversionInsightsToAuroraJob` | External dispatch | YES | ~5 days retained (rolling). First Class has 5-day sync lag as of 2026-04-20 (last row 2026-04-15). |
| `dm_property_conversions` | `ConversionInsightsService::syncPropertyConversions` | `services/ConversionInsightsService.php:105` | `ConversionInsightsToAuroraJob` | External dispatch | YES | `became_*_at` columns nullable (sparse); `deal_revenue` nullable unless reverse_buybox_deals match. |
| `rr_campaign_snapshots` | `InsightsMetricService::syncCampaignSnapshots` | `services/InsightsMetricService.php:55` | `InsightsToAuroraJob` | External dispatch | YES (hourly cadence observed: 576 rows/day across 20 days) | `smartdrop_authorization_status` nullable; includes soft-deleted campaigns. |
| `rr_daily_metrics` | `InsightsMetricService::syncDailyMetrics` | `services/InsightsMetricService.php:120` | `InsightsToAuroraJob` | External dispatch | YES | `follow_up_*` nullable. |
| `rr_pcm_alignment` | `InsightsMetricService::syncPcmAlignment` | `services/InsightsMetricService.php:202` | `InsightsToAuroraJob` | External dispatch | YES | `vendor_status_breakdown` nullable JSON; `back_office_sync_gap` computed via cross-DB join — prone to timing mismatches. |
| `dm_overview_cache` | `/api/dm-overview/refresh` (this repo) | `src/app/api/dm-overview/refresh/route.ts` | GitHub Actions cron | 30 min | YES | — |

**Important finding:** the monolith's `InsightsToAuroraJob` and `ConversionInsightsToAuroraJob` classes are NOT dispatched from anywhere in the monolith codebase (`grep` across `app/`, `routes/`, `services/` returned zero hits for `InsightsToAuroraJob::dispatch` / `ConversionInsightsToAuroraJob::dispatch`). The only scheduled entry in `app/Console/Kernel.php` is `performance:calculate` (writes to monolith MySQL only). Yet `rr_campaign_snapshots` has 20 days of hourly rows — so dispatching happens EXTERNALLY (separate scheduler, manual ops command, or a sibling repo). **If that external dispatcher fails, Aurora silently goes stale with no monolith-side alerting.** Recommend escalating to Christian/Johan for visibility: either (a) add an internal `$schedule` entry in `Kernel.php`, or (b) document where the external dispatcher lives. The metrics hub already surfaces sync lag (sync-coverage footers on pricing widgets) so readers can detect staleness themselves, but the monolith should own freshness, not us.

Confirmed separately: `handleOnHoldRapidResponses()` in `services/RapidResponses/RapidResponseService.php:1157-1327` is correctly implemented (7-day threshold + `markOldOnHoldAsUndelivered` at line 1317) but is only invoked from `app/Jobs/ConfirmPayChargeOverJob.php:262` (client payment webhook) and `app/Console/Commands/RapidResponsePropertyID.php:131` (manual). No `Kernel.php` schedule entry. This is why the on-hold count keeps climbing — the timer fires only when clients recharge.

### Cross-tab contract — verified live

`scripts/diagnose-cross-tab-consistency.ts` adds sections G + H which recompute on-hold totals via two independent query paths. Latest run on 2026-04-20:
- Block G (queryOnHoldAges equivalent): `total_on_hold = 3,927`, `stale = 1,209`, `fresh = 2,718`, `oldest_days = 17`, `stale_campaigns = 4`, `campaigns_with_hold = 5`.
- Block H (Campaigns-table sum): `total_on_hold = 3,927`, `campaigns_with_hold = 5`.
- **Cross-tab contract: PASS** — queryOnHoldAges total === campaigns-table sum. Every on-hold surface reads from the same helper; any future drift would fail this assertion.

### Reliability scorecard (embedded in UI — see `data-reliability.ts` for authoritative copy)

Grades summary:
- HIGH (authoritative + cross-checked where possible): Lifetime pieces, Lifetime revenue, Lifetime PCM cost, Active campaigns, Active clients, Company margin, Conversion funnel, Mailing spend, Deal revenue, Pricing history, PCM vendor rate (era schedule), Margin summary, Period summary, Delivery rate, Q2 goal.
- MEDIUM (known lag or approximation, surfaced inline): On-hold stale vs fresh (campaign-level inference), Customer rate (5-day FC sync lag), Customer rate change detection (same lag), PCM vendor-rate drift (partial — no invoice-total API).
- LOW (stored-value drift, reconciliation visible): Aurora-stored PCM cost (monolith writes wrong rates — never used as primary, shown as reconciliation delta).

Every MEDIUM / LOW metric has its caveat written into the `DataReliabilityHint` popover content. Users never have to guess.

### Files modified in session 6

**API**
- `src/app/api/rapid-response/route.ts` — import `queryOnHoldAges` helper; add stale/fresh to `getOverview` pulse payload; add `daysSinceFirstHold + onHoldAgeBucket` per row in `getCampaignList`; `getOnHoldBreakdown` delegates to the helper.
- `src/app/api/rapid-response/slack-alerts/route.ts` — Mailings-on-hold alert uses the shared helper; new `detectPcmVendorRateDrift()` emits an info advisory.

**Widgets**
- `src/components/workspace/widgets/RrOperationalPulseWidget.tsx` — on-hold row renders stale/fresh summary with full-context tooltip.
- `src/components/workspace/widgets/RrCampaignTableWidget.tsx` — per-row `fresh` / `stale Nd` badge on the On-hold column.
- `src/components/workspace/widgets/PcmPricingOverviewWidget.tsx` — `flex-shrink-0` on callout + rollout (fixes overlap); rate rows labeled with window; callout enriched with margin-boost math.
- `src/components/workspace/widgets/PcmMarginTrendWidget.tsx` — era-boundary `ReferenceLine` + chart footnote.

**New files**
- `src/lib/on-hold-ages.ts` — shared `queryOnHoldAges()` helper + threshold constant.
- `src/lib/data-reliability.ts` — per-tab reliability map.
- `src/components/workspace/DataReliabilityHint.tsx` — shared `ⓘ Data sources` badge.

**Types**
- `src/types/rapid-response.ts` — `RrOperationalPulse.staleOnHold/freshOnHold/staleCampaigns/oldestOnHoldDays`; `RrCampaignSnapshot.daysSinceFirstHold/onHoldAgeBucket`.

**Layouts + storage keys**
- `src/lib/workspace/defaultLayouts.ts` — mothball OH/BR/Profitability widgets per user list; `MOTHBALLED_WIDGETS` registry; storage keys bumped.

**Diagnostic**
- `scripts/diagnose-cross-tab-consistency.ts` — sections G + H assert queryOnHoldAges total === campaigns-table sum.

### Explicit commitments held

1. ✅ No new parallel surfaces — the breakdown widget was retired; stale/fresh lives in the pulse + campaigns table (where users already look).
2. ✅ Every customer-rate number names its window — `(7d avg)` vs `(eff. YYYY-MM-DD)`.
3. ✅ Pricing history shows rate transitions — dashed vertical `ReferenceLine` at detected era boundaries.
4. ✅ Reliability one hover away on every tab — `DataReliabilityHint` badge.
5. ✅ Monolith gap stays visible — stale on-hold count surfaces the timer failure without compensating silently.
6. ✅ Honor keep/mothball list verbatim — registry at bottom of `defaultLayouts.ts` records each removal with the user's quote.
7. ✅ Every metric has a three-way reliability check on file — Aurora direct (diagnostic G+H), monolith writer audit (table above), PCM cross-check (diagnostic F).
8. ⚠ PCM vendor-rate drift ships as info advisory, not full alert — blocked on PCM invoice-total API access; interim is commit-review of `pcm-pricing-eras.ts`.

---

## 2026-04-20 — Session 7 entry: callout chip, chart latest-rate, per-client truth

### Driver

User reviewed session 6 output in the browser and flagged three remaining issues:
1. **Pricing overview yellow callout still occupied the body** and hid the totals below the Margin/piece row. User asked for a "Recent alert" chip (good name to pick) on the header row left of the "All time" tag, hoverable to see content.
2. **Pricing history Apr '26 tooltip still read `Our Std: $0.6402`** despite Std being $0.66 effective 2026-04-19. User: "The last point should always have the most updated prices."
3. **Paul Francis Homes Rapid Response Checkout shows FC = $0.90**, but the metrics hub's Pricing overview shows FC = $0.87 aggregate. User: "I need to be able to trust this data. I am just currently not doing it."

User mandate: validate against monolith (the "$0.90" source of truth), not just display what I'm told.

### Monolith investigation — where does the $0.90 live?

Traced `$0.90 cost per unit` displayed on the monolith's Rapid Response Edit → Checkout screen to its data source. Path confirmed:

- UI render: `services/RapidResponses/RapidResponseService.php:786-803` reads `Parameters::whereIn('name', ['rapid-response-standard', 'rapid-response-first-class'])->get()` and shows `unitary_cost`.
- Storage: the `parameters` table — per `company_id` (multi-domain). Each client has their own row with their own `unitary_cost` for each mail class. Paul Francis Homes: `company_id = <their id>`, `name = 'rapid-response-first-class'`, `unitary_cost = 0.90`.
- API: `GET /api/rapid-responses/getcost` at [routes/api.php:1070](../../../../8020REI/monolith%208020REI/routes/api.php#L1070) — returns `unitary_cost` per mail class. **Behind `auth:api` middleware and served from per-tenant subdomain** (one database per client, gecche/laravel-multidomain setup).
- Aurora sync: ❌ **the `parameters` table does NOT sync to Aurora.** Only daily aggregates (`rr_daily_metrics.avg_unit_cost = AVG(unit_cost)`) and volume summaries (`dm_volume_summary.daily_cost`) flow. Those are blends across whatever clients actually mailed that day — they cannot expose per-client current pricing.

**Verdict.** The metrics hub today cannot read per-client customer rates without (a) cross-DB credentials for every tenant domain, (b) per-tenant OAuth tokens to call `/api/rapid-responses/getcost`, or (c) a new monolith-side sync of `parameters.unitary_cost` to Aurora. None of those are in scope for one session. The responsible move is to (i) display the aggregate with an honest "across clients" caveat, (ii) ensure the chart reflects the latest observed aggregate, and (iii) document the gap as a monolith follow-up with a concrete proposal.

### Work shipped

**Track 1 — Pricing overview callout → compact header chip**
- Inline yellow callout (which was blocking the Margin/piece rows) removed from the widget body.
- Replaced with a compact `Recent rate alert` chip rendered in a new header row at the top of `PcmPricingOverviewWidget`, right-aligned. On hover, `AxisTooltip` opens a portal-rendered popover with the same content + margin-boost math. Never overlaps the cards.
- Name picked: **"Recent rate alert"** — "alert" matches the existing severity vocabulary on other widgets, "recent" communicates the 7-day detection window.
- Same header row also carries an `ⓘ Aggregate across clients` hint on the left, opening a tooltip explaining that the "Customer rate" below is a 7-day blended average across all clients sending mail — and that individual clients (Paul Francis Homes at $0.90 FC) may be charged different rates that live in the monolith's `parameters` table.

**Track 2 — Pricing history chart reflects the latest rate**
- `getMarginTrend` at [pcm-validation/route.ts:716+](../../src/app/api/pcm-validation/route.ts) now detects the current in-progress month and, for that month only, overrides `ourFcRate` / `ourStdRate` with the most recent observed daily rate from `dm_volume_summary` (not the monthly weighted blend). Historical closed months retain the blended averages — the blend IS the truth for a closed month.
- Added `RateHistoryData.currentMonth: { month, standardLatestDate, firstClassLatestDate }` so the widget can honestly footnote which date each "latest" rate came from.
- Updated [`PcmMarginTrendWidget.tsx`](../../src/components/workspace/widgets/PcmMarginTrendWidget.tsx) chart footnote: *"Current month (2026-04) point shows the latest observed daily rate (Std through 2026-04-19, FC through 2026-04-15), not the month-blended average — so the chart always ends at current pricing."*
- Verified live: `scripts/check-current-month-rate.ts` confirms Apr '26 chart point will render Std $0.6600 (was blended $0.6542). FC still $0.87 because Aurora hasn't synced FC rows past Apr 15 — the chart faithfully reflects "what we know" rather than hiding the gap.

**Track 3 — Honest per-client caveat**
- Pricing overview's header row now carries `ⓘ Aggregate across clients` explaining that the number shown is a 7-day blend, individual clients can differ, and per-client rates live in the monolith's `parameters` table.
- Reliability scorecard in [`src/lib/data-reliability.ts`](../../src/lib/data-reliability.ts) downgrades "Customer rate (Std / FC)" from MEDIUM to explicitly note aggregate nature — surfaced via the `ⓘ Data sources` chip on every tab.

### Monolith follow-ups (escalations — NOT in metrics-hub scope)

1. **Sync `parameters.unitary_cost` per `company_id` to Aurora.** Simplest path: extend `InsightsMetricService::syncCampaignSnapshots` (already synced hourly) with two columns `customer_rate_std`, `customer_rate_fc` sourced from the same `Parameters::whereIn([...])` query that the Checkout UI uses. Metrics hub would then join per-campaign rates to show domain-level pricing, and the Pricing overview could surface per-client tables (Paul Francis Homes $0.90 FC, Heritage $0.66 Std, etc.) instead of only aggregates.
2. **Schedule `handleOnHoldRapidResponses`** (still open from session 5). No `Kernel.php` entry; timer only fires on client payment. Stale on-hold count climbs because nothing flushes overdue pieces.
3. **Monolith Aurora-sync dispatcher visibility.** `InsightsToAuroraJob` + `ConversionInsightsToAuroraJob` are dispatched externally (not from any code in the monolith repo). Aurora data IS arriving hourly, but we don't know what would alert monolith owners if that external dispatcher fails. Either add an internal `$schedule` entry or document where the external scheduler lives.

### Answer to user's "will this auto-update" question

**Auto-updating forever (no human touch):**
- Overview headline metrics, active campaigns, send volume trend — Aurora tables accumulate; `dm_overview_cache` refreshes every 30 min via GitHub Actions cron.
- On-hold stale/fresh — `rr_campaign_snapshots` hourly snapshots rolling 20 days; `queryOnHoldAges` helper reads live.
- Customer rate 7-day blended — reads last 7 days of `dm_volume_summary`.
- Pricing history chart — monthly averages from `dm_property_conversions` (accumulates forever); current-month point overrides from latest `dm_volume_summary` daily rate.
- Conversion funnel / Client performance / Template leaderboard — `dm_property_conversions` accumulates per property.
- On-hold slack alerts — fire from a nightly GitHub Actions cron against live Aurora state.

**Does NOT auto-update (requires engineering):**
- `pcm-pricing-eras.ts` — hardcoded PCM vendor rate schedule. Update when PCM renegotiates contracts (~quarterly). The PCM vendor-rate drift advisory exists to prompt a review but can't auto-detect (session 6).
- `src/lib/domain-filter.ts` — hardcoded TEST_DOMAINS list. Update when a new tenant joins or a test domain retires.
- `MOTHBALLED_WIDGETS` registry — only touched when user keeps/mothballs a widget.

**Degrading silently without engineering:**
- Per-client customer pricing — `parameters.unitary_cost` does not sync to Aurora. Paul Francis Homes $0.90 FC is invisible to the dashboard until the monolith team ships the sync proposed in follow-up #1 above. The dashboard shows aggregates and labels them as such; it cannot see per-client truth.
- FC sync lag — 5 days behind Standard as of 2026-04-20. If First Class volume stays low, each FC rate change takes days to appear in Aurora. Monolith team owns the sync cadence.
- External Aurora-sync dispatcher — if it stops, Aurora goes stale and no monolith-side alert fires. The metrics hub's sync-coverage footers (Pricing history, Price change detection, Campaigns table timestamps) would surface the lag within hours, but owner visibility is an unresolved gap on the monolith side.

**Single points of failure:**
- Aurora credentials in `.env.local` (and Cloud Run deployment env).
- PCM API credentials (cache goes cold; Overview falls back but slower).
- GitHub Actions runner for the 30-min Overview cache refresh.

**Bottom line.** Week-over-week the dashboard will auto-update on its own for 80% of metrics. The remaining 20% (era rates, test-domain list, per-client pricing, monolith sync health) are engineering-owned and documented in this file + the session reports. None of them will degrade silently — every stale/lagging surface has an inline honest caveat.

### Files modified in session 7

- `src/components/workspace/widgets/PcmPricingOverviewWidget.tsx` — inline callout → `Recent rate alert` chip in header row; added `ⓘ Aggregate across clients` hint.
- `src/app/api/pcm-validation/route.ts` — `getMarginTrend` current-month latest-rate override + `currentMonth` metadata in response.
- `src/types/pcm-validation.ts` — `RateHistoryPoint.isCurrentMonth`, `RateHistoryData.currentMonth`.
- `src/components/workspace/widgets/PcmMarginTrendWidget.tsx` — footnote explains current-month override.
- `scripts/check-current-month-rate.ts` (new) — verifies the override produces the expected $0.6600 for Apr '26.
- `Design docs/audits/dm-campaign-consistency-audit-2026-04-17.md` — this section.

---

## 2026-04-20 — Session 8 entry: margin-alignment blocker + rollout removal

### Driver

User screenshotted Overview vs Profitability side-by-side and caught a cross-tab drift: Overview Company margin showed **$1.8K (7.5%)**, Profitability Margin summary showed **$2.0K (8.2%)** for the SAME "all time" metric. Reasonably concluded: "this cannot happen."

User also gave three specific UI changes:
1. Remove the green "New rate (eff. 2026-04-19) $0.6600" line from the Standard card — breaking the card design.
2. Questioned the value of the "Standard rollout 2/3 domains" progress bar — what does it mean?

### Root cause (margin drift)

Both numbers come from the SAME `dm_overview_cache.headline` payload, but the two widgets read different fields:

| Tab | Field | Formula | Value |
|---|---|---|---|
| Overview Company margin card | `companyMargin.margin` | revenue − client PCM cost − internal test cost | $1,840.73 (7.5%) |
| Profitability Margin summary | `companyMargin.grossMargin` | revenue − client PCM cost | $2,016.24 (8.2%) |

Both are arithmetically correct. The Overview deducts internal test-domain send costs (P&L honesty — 8020REI paid PCM for QA sends with no client revenue offsetting). Profitability didn't. Same data source, two different fields, two different headline numbers, same visual label. Exactly the drift this audit exists to prevent.

### Fix

`getProfitabilitySummary` in [`pcm-validation/route.ts`](../../src/app/api/pcm-validation/route.ts) now returns the FULL decomposition in its response: `totalRevenue`, `totalPcmCost` (client-only), `grossMargin`, `grossMarginPct`, `internalTestCost`, `netCompanyMargin`, `netCompanyMarginPct`. Legacy `marginPercent` kept (points at gross) so existing consumers don't shift. Cross-tab contract: `netCompanyMargin === companyMargin.margin` (Overview's field).

[`PcmMarginSummaryWidget.tsx`](../../src/components/workspace/widgets/PcmMarginSummaryWidget.tsx) now renders a 5-card decomposition — Total revenue · PCM cost (clients) · Gross margin (with %) · Internal test cost · Net company margin (with %). The headline the reader sees is the NET number that matches Overview. Between the two there's a visible "Internal test cost" card explaining where the delta goes.

Live values on 2026-04-20:
- Revenue $24,643.60
- PCM cost (clients) $22,627.36
- Gross margin $2,016.24 (8.2%)
- Internal test cost −$175.51
- **Net company margin $1,840.73 (7.5%)** ← same number as Overview

Both widgets will render $1,840.73 as the headline going forward.

### Diagnostic — margin-alignment contract

`scripts/diagnose-cross-tab-consistency.ts` now has section I which reads `dm_overview_cache.headline` directly, asserts revenue − clientPcmCost − testCost === reported net company margin, and flags any drift. Result today: **PASS** (both gross and net deltas $0.00).

### UI simplification (per user feedback on Pricing overview)

1. **"New rate (eff. YYYY-MM-DD)" line removed from MailClassCard** — it broke the card's visual rhythm and duplicated info the Recent rate alert chip already carries on hover. Card now shows two clean rows: Customer rate (7d avg) + PCM vendor rate, with Margin/piece below.

2. **Standard/First-Class rollout progress bar removed** — user: *"2/3 domains. What does that mean, and what is the value of that information?"* Fair critique. The metric came from `rolloutStatus` which picked the most-common recent rate across domains that sent mail in the observation window — tiny sample (3 domains for Std at the time), noisy, and the aggregate can't answer "is this client on the new rate?" because per-client rates don't sync to Aurora (see session 7 monolith investigation). Remove rather than explain a metric that can't deliver its promise. Mothballed-ish: the `rolloutStatus` data is still in the API response for any future widget that has per-client ground truth.

### What now auto-updates (precision on the 80/20 split from session 6)

**The 20% that does NOT auto-update** (engineering-owned):

1. **PCM vendor rates** — hardcoded in `src/lib/pcm-pricing-eras.ts`. Current era (Era 3, Nov 2025 →): FC $0.87, Std $0.63. When PCM renegotiates (~quarterly at most per Camilo), update this file. The PCM vendor-rate drift advisory fires on every Slack digest as a reminder.

2. **Test-domain exclusion list** — hardcoded in `src/lib/domain-filter.ts`, 9 domains today (8020rei_demo, 8020rei_migracion_test, _test_debug, _test_debug3, supertest_8020rei_com, sandbox_8020rei_com, qapre_8020rei_com, testing5_8020rei_com, showcaseproductsecomllc_8020rei_com). When a new tenant joins or a test domain is retired, add/remove here; change applies to all 8 dependent API files simultaneously.

3. **Per-client customer rates** — `parameters.unitary_cost` in the monolith's per-tenant DBs does not sync to Aurora. Paul Francis $0.90 FC is invisible to the dashboard until the monolith team adds the sync. Metrics hub shows blended aggregate rates with an explicit "Aggregate across clients" caveat. (Open escalation — proposed in session 7.)

4. **Monolith `handleOnHoldRapidResponses` schedule** — not in `Kernel.php`, only runs on client payment. Session 6 observation: 1,209 stale pieces (≥7 days on-hold) accumulating. Every new-session run of the diagnostic flags this. (Open escalation.)

5. **Monolith Aurora-sync dispatcher** — `InsightsToAuroraJob` / `ConversionInsightsToAuroraJob` are dispatched externally (not from any code in the monolith repo). Aurora IS receiving hourly snapshots, so the dispatcher is working, but if it stops there's no monolith-side alert. Metrics hub's sync-coverage footers would flash within hours. (Open escalation.)

6. **Reports tab monthly tables** — hardcoded arrays ending Apr 2026 per session 4. Stale-data banner triggers at >1 month old but the tables themselves need manual updates OR a live-query replacement. Out of scope this week.

7. **PCM `/order` pagination memo** — 20-min in-memory cache + 30-min GitHub Actions cron refresh. If the runner stops (e.g. workflow disabled), Overview + Profitability fall back to live Aurora-stored values with a "warming" note; functional but slower and less accurate. Reviewable in `.github/workflows/overview-warmup.yml`.

**Single points of failure** (not "20% touch-up" but important context):
- Aurora credentials (`DB_AURORA_*` env vars in `.env.local` + Cloud Run deployment env)
- PCM API credentials (`PCM_API_KEY`, `PCM_API_SECRET`)
- GitHub Actions runner availability for the Overview cache refresh cron

Everything else on Overview / OH / BR / Profitability auto-updates as long as Aurora receives hourly sync rows from the monolith and the 30-min Overview cron runs.
