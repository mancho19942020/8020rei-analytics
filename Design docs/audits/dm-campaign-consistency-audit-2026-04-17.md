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
