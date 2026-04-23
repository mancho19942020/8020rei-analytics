# Layer 2 — Historical data principle

**Date:** April 7, 2026  
**Author:** German Alvarez  
**Status:** Design principle — to be implemented

---

## The principle

The Metrics Hub must maintain a complete historical record of every client's campaign performance. Data that arrives in the platform must never be lost, regardless of whether the source (monolith) stops sending it.

**If a client had a campaign that generated 7 leads and then went inactive, those 7 leads must still be visible in the client performance table indefinitely.**

---

## The problem today

The monolith writes to 3 Aurora tables via a daily cron:

| Table | Behavior | Historical? |
|---|---|---|
| `dm_client_funnel` | One row per domain + campaign_type + date | Only writes rows for domains with **active campaigns** that day |
| `dm_template_performance` | One row per domain + template (UPSERT) | Retains all templates ever used, even from inactive campaigns |
| `dm_property_conversions` | One row per property + campaign (UPSERT) | Empty — pending fix |

The issue: `dm_client_funnel` stops writing rows for a domain once its campaigns become inactive. That domain disappears from the "latest date" query. Example: Reno Area Home Buyers had 7 leads but no active campaigns, so it was invisible in client performance until we merged data from `dm_template_performance`.

## Current workaround (April 7, 2026)

The `getClientPerformance()` API route in the Metrics Hub now merges data from both `dm_client_funnel` and `dm_template_performance`. Domains that exist in templates but not in the client funnel still appear with `activeCampaigns: 0` (Inactive status).

This works for now but has limitations:
- `dm_template_performance` doesn't have funnel breakdown (appointments, contracts)
- If a template is somehow removed from `dm_template_performance`, we lose that domain entirely
- We're relying on the monolith to maintain historical data across two different tables with different retention behaviors

## The right solution

The Metrics Hub should store its own historical snapshots. Every time the daily sync runs and new data arrives from Aurora, the Metrics Hub backend should:

1. **Snapshot the client performance data** — store each day's view so we have a time series of every client's performance over time
2. **Never delete historical records** — even if a domain stops appearing in Aurora, the Metrics Hub retains all prior data
3. **Mark domains as active/inactive** based on whether they appear in the latest sync, but preserve their historical metrics

This could be implemented as:
- A new table in the Metrics Hub backend (Fastify + its own database or a separate Aurora schema)
- Or a materialized view pattern where we write to a `dm_client_history` table in Aurora that the Metrics Hub backend manages (not the monolith)

## Impact on the board

With historical data preserved:
- Client performance table shows ALL clients ever, sorted by performance, with Active/Inactive status
- Trend charts can show a client's performance over their entire campaign lifetime, not just active periods
- Geographic breakdown (once `dm_property_conversions` works) retains data from past campaigns
- Campaign ROI can be calculated over the full lifecycle, not just the current snapshot

## Decision needed

- Where to store the historical snapshots (Metrics Hub backend DB vs Aurora)
- How frequently to snapshot (daily is likely sufficient, matching the cron)
- Whether the Metrics Hub backend should own this table or if the monolith's `syncClientFunnel()` should be fixed to always include historical domains

---

*This principle applies to all future data sources in the Metrics Hub, not just DM Campaign. Any data that arrives should be persisted historically.*
