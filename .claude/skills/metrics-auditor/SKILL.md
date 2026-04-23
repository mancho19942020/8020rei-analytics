# Metrics Auditor Skill

**MUST run after creating or modifying any widget, API endpoint, query, or data display within the DM Campaign section (Operational Health, Business Results, PCM & Profitability).** This skill detects and warns about data issues — it does NOT force numbers to match or hide problems.

## Philosophy

This skill exists to **surface problems, not suppress them.** It is not here to please anyone. Its job is to:

1. **Detect divergence** between our internal data (Aurora) and the external system of record (PostcardMania API)
2. **Warn** when the platform is not communicating properly with PCM — orders not being placed, letters not being sent, delivery confirmations not coming back
3. **Flag** when numbers across the three DM Campaign tabs contradict each other
4. **Inform alert rules** — any data divergence pattern this skill catches should eventually become an automated alert in the Operational Health alerts system

If PCM says one thing and Aurora says another, this skill does NOT pick a winner and hide the discrepancy. It **reports both numbers** and flags the gap so the team can investigate.

## When to Use

- Creating new widgets in any DM Campaign sub-tab
- Modifying existing widget data sources or calculations
- Adding new API endpoints that query Aurora tables or the PCM API
- Changing SQL queries in rapid-response, dm-conversions, dm-templates, or pcm-validation routes
- Adding new metrics, columns, or pills to existing widgets
- Modifying the SEED_DOMAINS exclusion list
- Any time data trust is questioned

## The Golden Rule

**ALL data across all 3 DM Campaign tabs MUST be consistent with each other AND explainably close to what the PCM API reports.** If the same metric appears on multiple tabs, the numbers MUST match exactly. If different metrics are shown, their relationship MUST be explainable and documented in tooltips.

**Every audit MUST cross-verify against the PostcardMania (PCM) API** — the external system of record. Aurora is our internal database; PCM is the printer that physically sends the mail. If Aurora and PCM disagree, this skill does NOT hide the disagreement — it reports it loudly.

## What This Skill Monitors (System Health Perspective)

Beyond data consistency, this skill monitors whether the DM pipeline is **functioning correctly end-to-end**:

### Is the platform communicating with PCM?
- Are orders being placed successfully? (Aurora sends should grow daily when campaigns are active)
- Is PCM acknowledging our orders? (PCM total orders should track close to Aurora total sends)
- Are delivery confirmations flowing back? (Stale sent count should not grow unbounded)

### Is PCM communicating back to us?
- Are delivery statuses updating? (Delivery lag should be reasonable, < 10 days median)
- Are orphaned orders appearing? (Orders we sent that PCM never acknowledged)
- Is the sync gap growing? (Divergence between PCM and Aurora counts)

### Are users seeing accurate data?
- Does the delivery rate shown match the PCM-verifiable rate?
- Do volume numbers match across all three tabs?
- Are on-hold items being tracked and alerted?

### Alert integration
When this skill detects a pattern that should become an automated alert, it MUST recommend adding it to the alert evaluator in `src/app/api/rapid-response/route.ts`. Examples:
- PCM/Aurora gap exceeds 5% → CRITICAL alert
- Stale sent count grows by 50+ in a week → WARNING alert
- Delivery lag exceeds 10 days → WARNING alert
- Zero sends for 48+ hours while campaigns are active → CRITICAL alert
- PCM order count hasn't changed in 72+ hours → WARNING alert (PCM may be down)

---

## Source of Truth Hierarchy

### External source of truth: PostcardMania API
**The PCM API is the ultimate external validation layer.** Every audit must query it.

- **Base URL**: `https://v3.pcmintegrations.com`
- **Client**: `src/lib/pcm-client.ts` (READ-ONLY — never write, per CEO directive)
- **Auth**: `POST /auth/login` with `PCM_API_KEY` + `PCM_API_SECRET` → JWT token (cached 55 min)

**Available PCM API endpoints for validation:**

| Endpoint | What it provides | Use for |
|----------|-----------------|---------|
| `GET /order?page=1&perPage=1` | `pagination.totalResults` = total order count | Cross-check against Aurora `dm_client_funnel.total_sends` |
| `GET /order` (paginated) | Per-order: `status`, `amount`, `quantity`, `recipientCount`, `undeliverableCount` | Delivery status distribution, cost validation |
| `GET /order/{orderId}/recipients` | Per-recipient: `status`, `deliveryDate`, `isUndeliverable`, `carrierConfirmed` | Delivery rate verification at recipient level |
| `GET /integration/balance` | `moneyOnAccount` | Account health check |
| `GET /batch` (paginated) | Per-batch: `status` (Pending/Printing/Delivered/Failed Payment), `recipients`, `orders` | Batch-level delivery verification |
| `GET /recipient/undeliverable` | `failureReason`, `date` per undeliverable | Cross-check undeliverable rates |
| `GET /design` | Design templates catalog | Template reference |

**PCM order statuses**: `Ordered`, `Canceled`, `Mailing`, `Processing`, `Undeliverable`, `Delivered`

**Audit procedure — MUST verify these against PCM API:**
1. **Total order count**: `pcmGet('/order', { page: 1, perPage: 1 })` → `pagination.totalResults` should be within 5% of `dm_client_funnel.total_sends`
2. **Account balance**: `pcmGet('/integration/balance')` → `moneyOnAccount` should be non-zero
3. **Order status distribution**: If `getAllOrders()` is available, aggregate by `status` to verify delivery rates match Aurora

**When PCM and Aurora disagree:**
- PCM total orders > Aurora total sends → Aurora is missing records (sync gap)
- Aurora total sends > PCM total orders → Aurora has phantom records (inflation)
- The gap should be < 5%. If > 5%, flag as CRITICAL violation
- Document the delta in the audit report with both numbers

### Internal source: Aurora tables

### For volume metrics (sends, delivered, cost):
**`dm_client_funnel`** is THE corrected internal source of truth.
- Query pattern: latest snapshot per domain (`MAX(date)` per domain), then SUM across domains
- Excludes 6 test domains (see below)
- Post-PR #1882 fix: only counts mail pieces with `vendor_id IS NOT NULL`
- **MUST cross-verify**: `dm_client_funnel.total_sends` vs PCM API total order count

### For conversion metrics (leads, appointments, contracts, deals, revenue):
**`dm_property_conversions`** is THE only source.
- NEVER read conversions from `dm_client_funnel` convenience columns
- NEVER read conversions from `dm_template_performance` convenience columns
- All conversions MUST filter `became_X_at > first_sent_date` to exclude pre-send false positives
- Conversions are internal to 8020REI — PCM has no conversion data

### For operational status (active campaigns, on-hold, sends today):
**`rr_campaign_snapshots`** for campaign status, **`rr_daily_metrics`** for daily counts.

### For PCM alignment (stale, orphaned, sync gap):
**`rr_pcm_alignment`** — latest check per domain.
- **MUST cross-verify**: `rr_pcm_alignment.back_office_sync_gap` summed across domains should be consistent with the PCM vs Aurora volume delta

### For profitability (margins, PCM costs):
**`dm_volume_summary`** — daily accumulation with mail class breakdown.
- **MUST cross-verify**: `dm_volume_summary` cumulative costs vs PCM order `amount` totals

---

## Audit Checklist

Run these checks against any new or modified code in the DM Campaign section:

### Check 1: Delivery rate source
- [ ] Delivery rate MUST come from `dm_client_funnel` (lifetime: `total_delivered / total_sends`)
- [ ] NEVER calculate delivery rate from `rr_daily_metrics` period data (causes >100% rates due to date boundary mismatch)
- [ ] NEVER calculate delivery rate from `rr_campaign_snapshots` (different grain, different numbers)
- [ ] Cross-verify: the rate shown in Operational Health MUST equal `Aurora delivered / Aurora sends` in PCM & profitability

### Check 2: Test domain exclusions
- [ ] ALL queries MUST exclude the same 6 test domains:
  ```
  '8020rei_demo', '8020rei_migracion_test', '_test_debug', '_test_debug3', 'supertest_8020rei_com', 'sandbox_8020rei_com'
  ```
- [ ] Check: `SEED_DOMAINS` constant in the modified route matches this list exactly
- [ ] Violation: any route excluding fewer or different domains

### Check 3: Terminology consistency
| Term | Counts | Must use label |
|------|--------|---------------|
| Individual mail pieces | `total_sends` from dm_client_funnel | "mail pieces" or "sent" |
| Unique property addresses | `total_properties_mailed` or `COUNT(DISTINCT property_id)` | "mailed" or "unique properties" |
| Confirmed deliveries (pieces) | `total_delivered` from dm_client_funnel | "delivered" |

- [ ] A widget labeled "Mailed" MUST NOT display `total_sends` (that's pieces, not properties)
- [ ] A widget labeled "Sent" MUST NOT display `total_properties_mailed` (that's properties, not pieces)
- [ ] Every volume metric MUST have a tooltip explaining what it counts

### Check 4: Conversion source integrity
- [ ] Leads, appointments, contracts, deals, revenue MUST come from `dm_property_conversions`
- [ ] All conversion counts MUST filter `became_X_at > first_sent_date`
- [ ] ROAS display MUST include `roasConfidence` indicator (confident/low_sample/revenue_no_deal/none)
- [ ] Conversion confidence flags MUST be applied (clean/flagged/pre_send/short_window)

### Check 5: Cross-tab number matching
These numbers MUST be identical across tabs:

| Number | Operational Health | Business Results | PCM & Profitability |
|--------|-------------------|-----------------|---------------------|
| Active campaigns | "Is it running?" pill | — | Volume widget pill |
| Lifetime sent (mail pieces) | "Is it working?" pill | — | Aurora card big number |
| Lifetime delivered | "Is it working?" pill | — | Aurora card sub-text |
| Delivery rate | "Is it working?" headline | — | Implied by Aurora delivered/sent |
| Unique properties mailed | — | Funnel "Mailed" stage | — |

### Check 6: timeBehavior tags
- [ ] All-time widgets MUST have `timeBehavior: 'all-time'` in their layout config
- [ ] All-time widget tooltips MUST state "This widget is NOT affected by the date filter"
- [ ] Period-based metrics within all-time widgets MUST be labeled "(period)" to distinguish them

### Check 7: No rr_* and dm_* table joins
- [ ] NEVER join `rr_campaign_snapshots`, `rr_daily_metrics`, or `rr_pcm_alignment` with `dm_*` tables in a single SQL query
- [ ] Fetch from different table families in parallel (`Promise.all`), merge in application code

### Check 8: Widget tooltip completeness
Every metric pill/number MUST have a tooltip that includes:
1. What it measures (plain language)
2. Source table name
3. Cross-reference to another tab where the same or related number appears

### Check 9: PCM API cross-verification (MANDATORY)
Every audit MUST query the PCM API and compare results against Aurora data. This is not optional.

**Step 1 — Verify total order count:**
- [ ] Call `pcmGet('/order', { page: 1, perPage: 1 })` → read `pagination.totalResults`
- [ ] Compare against `dm_client_funnel` SUM of `total_sends` (latest snapshot per domain)
- [ ] Gap MUST be < 5%. If > 5%, flag as CRITICAL
- [ ] Report: "PCM says X orders, Aurora says Y sends, delta = Z (N%)"

**Step 2 — Verify account balance:**
- [ ] Call `pcmGet('/integration/balance')` → read `moneyOnAccount`
- [ ] If balance is $0 or negative, flag as WARNING (may cause on-hold accumulation)

**Step 3 — Verify delivery rate against PCM (when order access is available):**
- [ ] If PCM `/order` returns actual orders (not 0), aggregate by `status`
- [ ] Count orders with `status = 'Delivered'` / total non-canceled orders = PCM delivery rate
- [ ] Compare against `dm_client_funnel` delivery rate (`total_delivered / total_sends`)
- [ ] Report: "PCM delivery rate: X%, Aurora delivery rate: Y%, delta: Z%"

**Step 4 — Verify cost alignment:**
- [ ] If orders are accessible, sum `order.amount` across all orders = PCM total cost
- [ ] Compare against `dm_client_funnel` SUM of `total_cost`
- [ ] Compare against `dm_volume_summary` cumulative costs
- [ ] Report any cost discrepancy > 2%

**Step 5 — Verify the numbers shown in the UI match the API responses:**
- [ ] The "8020REI (Aurora)" big number in the PCM volume widget MUST equal `dm_client_funnel` SUM of `total_sends`
- [ ] The "PostcardMania" big number MUST equal PCM API `pagination.totalResults`
- [ ] The "Delivery rate (lifetime)" in "Is it working?" MUST equal `dm_client_funnel.total_delivered / dm_client_funnel.total_sends * 100`
- [ ] The "Lifetime sent" pill in "Is it working?" MUST equal the Aurora big number in the PCM volume widget

**PCM API client location:** `src/lib/pcm-client.ts`
**PCM validation route:** `src/app/api/pcm-validation/route.ts`
**Backend reconciliation service:** `backend/src/services/pcm-reconciliation.ts`

---

## Known Data Traps (from production incidents)

### Trap 1: rr_daily_metrics date boundary mismatch
`sends_total` is keyed by dispatch date, `delivered_count` by delivery confirmation date. A piece sent March 15 that delivers April 10: March gets +1 sent/+0 delivered, April gets +0 sent/+1 delivered. Comparing sent/delivered in the same period window produces meaningless rates (can exceed 100%).

**Fix**: Use `dm_client_funnel` lifetime totals for delivery rate. Use `rr_daily_metrics` only for trend charts and daily volume counts.

### Trap 2: dm_property_conversions volume inflation (pre-PR #1882)
Before April 11, 2026, `dm_property_conversions` counted properties with `vendor_id IS NULL` (on-hold, protected, errored) as "sent." These never reached PCM.

**Fix**: The `verifiedDomainsFilter` in `dm-conversions/route.ts` excludes domains until re-synced. Template leaderboard proportionally scales `dm_property_conversions` volumes to match corrected `dm_client_funnel` totals.

### Trap 3: dm_template_performance convenience columns
The `leads_generated`, `deals_generated`, `total_revenue` columns in `dm_template_performance` are pre-aggregated WITHOUT the `> first_sent_date` filter. They include pre-send false positives.

**Fix**: NEVER use these columns. Compute template conversions from `dm_property_conversions` grouped by `template_id` with the `> first_sent_date` filter.

### Trap 4: dm_client_funnel convenience columns
The `leads`, `appointments`, `contracts`, `deals`, `total_revenue` columns do NOT apply integrity filters (conversionConfidence, pre_send exclusions, backfill flags).

**Fix**: Use `dm_client_funnel` ONLY for operational fields: `total_properties_mailed`, `total_sends`, `total_delivered`, `total_cost`. Get conversions from `dm_property_conversions`.

### Trap 5: On-hold accumulation
Mailings on-hold (insufficient balance) accumulate indefinitely. As of April 2026, 14,042+ on-hold items. Team is deploying a 7-day auto-delivered timer to address this.

**Impact**: The on-hold count can dominate the "Is it running?" widget and create alarm. Understand that this is a known business issue being addressed at the monolith level.

### Trap 6: PCM API order access scoping
The PCM API key connects to a child app that may not have access to all orders from the monolith's child app. `pcmOrderCount` may return 0 or a subset until API access is resolved with PostcardMania.

---

## Aurora Table Reference

| Table | Grain | Used By | Purpose |
|-------|-------|---------|---------|
| `rr_campaign_snapshots` | 1 row per campaign per snapshot | Operational Health | Campaign status, on-hold counts |
| `rr_daily_metrics` | 1 row per domain per day | Operational Health | Daily send/delivery/error counts, trends |
| `rr_pcm_alignment` | 1 row per domain per check | Operational Health | Stale/orphaned/sync gap detection |
| `dm_client_funnel` | 1 row per domain+campaign_type+date | All 3 tabs | Corrected lifetime volumes (sends, delivered, cost, mailed) |
| `dm_property_conversions` | 1 row per property+campaign+domain | Business Results | Conversions (leads, deals, revenue), property-level detail |
| `dm_template_performance` | 1 row per template+domain | Business Results | Template metadata ONLY (avg_days_to_lead, campaigns_using) |
| `dm_volume_summary` | 1 row per domain+date+mail_class | PCM & Profitability | Profitability, margins, mail class breakdown |

## Critical Files

| File | What to audit |
|------|--------------|
| `src/app/api/rapid-response/route.ts` | Operational Health queries and calculations |
| `src/app/api/dm-conversions/route.ts` | Business Results queries, `getMergedClientData()` pattern |
| `src/app/api/dm-templates/route.ts` | Template leaderboard proportional scaling |
| `src/app/api/pcm-validation/route.ts` | PCM & Profitability queries, PCM API calls |
| `src/app/api/dm-conversions/get-alerts-data.ts` | Business alerts data |
| `src/app/api/rapid-response/slack-alerts/route.ts` | Slack alert queries |
| `src/lib/pcm-client.ts` | PCM API client (READ-ONLY, never write) |
| `src/types/rapid-response.ts` | Operational Health type definitions |
| `src/types/dm-conversions.ts` | Business Results type definitions |

## Reporting Format

After running the audit, report findings as:

```
## Metrics Auditor Report

### PCM API Cross-Verification
- PCM total orders: X | Aurora total sends: Y | Delta: Z (N%)
- PCM balance: $X
- PCM order status distribution (if available): Delivered: X, Processing: Y, Canceled: Z
- Assessment: [HEALTHY / WARNING / CRITICAL]

### Pipeline Health
- Last send: Xh ago | Sends today: Y | Active campaigns: Z
- Stale sent trend: growing / stable / shrinking
- Orphaned orders: X (new since last check: Y)
- Sync gap direction: widening / stable / closing
- Assessment: [HEALTHY / WARNING / CRITICAL]

### Cross-Tab Consistency
- Delivery rate: X% across all tabs (dm_client_funnel) — [MATCH / MISMATCH]
- Active campaigns: Y across Operational Health and PCM tab — [MATCH / MISMATCH]
- Lifetime sent: Z across all references — [MATCH / MISMATCH]

### Data Issues Detected
- [CRITICAL] Description — file:line — what's wrong, not how to hide it
- [WARNING] Description — file:line — investigate, do not suppress

### Recommended Alerts
If any pattern warrants an automated alert, list it here:
- "PCM/Aurora gap > 5% for 3+ consecutive days" → add to rapid-response alert evaluator
- "Zero sends for 48h while campaigns active" → add as CRITICAL operational alert

### No Issues Found
All N checks passed. PCM and Aurora are aligned.
```

## Important Reminders

- This skill is NOT here to make the data look good. It is here to surface problems.
- If PCM and Aurora disagree, report BOTH numbers. Do not pick the "better" one.
- Every warning this skill produces should eventually become an automated alert.
- The goal is a system that catches issues BEFORE a human notices them on the dashboard.
