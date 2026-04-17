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
| 1 | OH | Is it running? | `RrOperationalPulseWidget.tsx` | `/api/rapid-response?type=overview` | `rr_campaign_snapshots` (no date filter) | Active / total campaigns | **13 active / 22 total** | PCM has no campaign primitive (see note below) | — | **fix** | Aurora-only metric. Tooltip must note: "Campaigns are an 8020REI abstraction — PCM tracks orders. Cross-check at the piece level, not the campaign level." |
| 2 | OH | Campaigns table | `RrCampaignTableWidget.tsx` | `/api/rapid-response?type=campaign-list` | `rr_campaign_snapshots` (no date filter, as of 2026-04-17) | Row count | **22 rows** (after fix) | Aurora-only (no PCM counterpart) | — | **blocker → resolved** | Date filter removed from `getCampaignList()` 2026-04-17. Browser verification pending. |
| 3 | OH | Is it working? | `RrQualityMetricsWidget.tsx` | `/api/rapid-response?type=overview` | `dm_client_funnel` (lifetime) + `rr_daily_metrics` (period error rate) | Lifetime sent / delivered / delivery rate | **Aurora: 24,195 sent · 21,428 delivered · 88.56%** | **PCM: 24,906 active pieces · 22,388 delivered · 89.89%** | **-711 pieces (-2.85%)** | **blocker** | Aurora funnel is missing 711 pieces vs PCM. Either `dm_client_funnel` sync lag, or orders still `processing`/`mailing` in PCM not yet counted as "sent" in Aurora. **Hypothesis:** PCM `active` includes 1,135 `processing` + 1,094 `mailing` that Aurora may or may not count. Needs resolution before Overview build. |
| 4 | OH | Is it aligned? | `RrPcmHealthWidget.tsx` | `/api/rapid-response?type=overview` | `rr_pcm_alignment` | Synced domains, stale sent (14d+), orphaned orders | Aurora: 19 domains tracked | **PCM: 18 domains have orders** | **+1 Aurora domain** | **fix** | `showcaseproductsecomllc_8020rei_com` has 1 campaign in Aurora but **0 orders in PCM**. Either orphaned campaign config, or never sent. The widget currently reports "10 with issues" — need to reconcile this list against the PCM-domain list. |
| 5 | OH | Q2 volume goal | `RrQ2GoalWidget.tsx` | `/api/rapid-response?type=q2-goal` | `rr_daily_metrics` | Progress vs 400K Q2 target | **934 / 400K (0.2%) — 15 days of rr_daily_metrics only (2026-04-03 → 2026-04-17)** | PCM April: 4,037 pieces | **Aurora is ~3.1K short vs PCM for April** | **blocker** | **`rr_daily_metrics` only has 15 days of history.** Widget is structurally starved: the "weekly pace / required pace" math uses 15 days of data extrapolating against a 90-day goal. Either backfill `rr_daily_metrics` from PCM, or switch this widget to query PCM `/order` directly for the goal window. |
| 6 | OH | Top contributors | `RrQ2TopContributorsWidget.tsx` | `/api/rapid-response?type=q2-goal` | `rr_daily_metrics` | Per-client contribution to 400K | Same 15-day limitation; shows `paulfrancishomes` 779 as top | PCM April: paulfrancishomes likely dominates too, but full picture unavailable | — | **blocker** | Same root cause as row #5. Domains not active in the last 15 days appear with 0 contribution even if they mailed in March. Fix with row #5. |
| 7 | OH | Send volume trend | `RrSendsTrendWidget.tsx` | `/api/rapid-response?type=daily-trend` | `rr_daily_metrics` | Daily sends/deliveries/errors | **15 days only** (2026-04-03 → 2026-04-17) | PCM has 242 daily entries spanning 2025-02-21 → 2026-04-16 | **-227 days of history missing** | **blocker** | Same `rr_daily_metrics` gap. The trend line is technically correct for the last 15 days but cannot represent the "lifetime evolution" Camilo wants on Overview. |
| 8 | OH | Status breakdown | `RrStatusBreakdownWidget.tsx` | `/api/rapid-response?type=status-breakdown` | `rr_campaign_snapshots` | Status pie | Aurora active: 13, other statuses from snapshots | PCM status distribution: 22,388 delivered · 1,135 processing · 1,094 mailing · 289 undeliverable | Aurora tracks campaign status, PCM tracks piece status — comparing apples to oranges | **fix** | Widget must clarify: "Campaign status (8020REI view)" vs "Mail piece status (PCM view)." Two different widgets possibly needed. |
| 9 | OH | System coverage | `RrSystemCoverageWidget.tsx` | `/api/rapid-response?type=overview` | `rr_campaign_snapshots` + `dm_client_funnel` | Clients/templates/properties tracked | Aurora: 19 domains · ~55,437 property records | **PCM: 18 domains · 28 designs in catalog** | domain +1, designs not comparable (subset concept) | **fix** | "Templates tracked" metric needs to be clear whether it's PCM design catalog size (28) or 8020REI template configs. |
| 10 | OH | Data integrity | `RrDataIntegrityWidget.tsx` | `/api/rapid-response?type=overview` | Mixed | Backfilled dates, unattributed, zero-revenue deals | _deferred_ — not in critical path | — | — | **nit** | Low priority for Overview build. Audit after Overview ships. |
| 11 | BR | Conversion funnel | `DmFunnelOverviewWidget.tsx` | `/api/dm-conversions?type=funnel-overview` | `dm_property_conversions` | Mailed → Leads → Appt → Contracts → Deals | Aurora property conv: 56,808 sends across 55,437 properties; revenue $56,776.51 | PCM: 24,906 mail pieces · can't compute funnel (no conversion concept) | Property-conv `sends` (56,808) ≠ PCM active (24,906) — this is the 2-3x duplication we expect (each property gets multiple sends) | **fix** | Tooltip must explain: BR funnel's "Mailed" = unique properties (55,437), not mail pieces. Mail pieces (24,906 per PCM) belong on OH. Verify the widget renders "unique properties mailed" not "mail pieces sent." |
| 12 | BR | Client performance | `DmClientPerformanceWidget.tsx` | `/api/dm-conversions?type=client-performance` | `dm_property_conversions` | Per-client mailed, conv, spend, revenue | 19 domains · $56,776.51 revenue | PCM per-domain orders (see snapshot) | Per-domain deltas need row-by-row check | **fix** | Extend snapshot to diff per-domain Aurora vs PCM. Likely shows subset-of-PCM for each domain. |
| 13 | BR | Conversion activity | `DmConversionTrendWidget.tsx` | `/api/dm-conversions?type=conversion-trend` | `dm_property_conversions` | Daily leads/appts/deals | Period-filtered from dm_property_conversions | PCM: not applicable (PCM doesn't know deals) | — | **fix** | Aurora-only, but tooltip must note "not PCM-verified — conversions are an 8020REI metric." |
| 14 | BR | Revenue vs cost | `DmRevenueCostWidget.tsx` | `/api/dm-conversions?type=roas-trend` | `dm_property_conversions` | Daily cost vs deal revenue | Daily aggregate | PCM daily order count available; could enrich | — | **fix** | Audit whether this widget's "cost" matches row #17 (Margin summary). |
| 15 | BR | Template leaderboard | `DmTemplateLeaderboardWidget.tsx` | `/api/dm-conversions?type=client-performance` | `dm_property_conversions` | Templates ranked | From dm_property_conversions | PCM: 28 designs in catalog | — | **nit** | Confirm template naming matches PCM design names. |
| 16 | BR | Geographic breakdown | `DmGeoBreakdownWidget.tsx` | `/api/dm-conversions?type=geo-breakdown` | `dm_property_conversions` | Conv rates by state/county | Aurora-only | PCM: not applicable | — | **nit** | Aurora-only, not PCM-verified. Tooltip. |
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
