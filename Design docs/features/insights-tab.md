# 8020REI Analytics — Chapter 9: Insights & Alerts

**Purpose:** Automated anomaly detection and actionable signals across all 8 dashboard chapters.  
**Date:** February 2026  
**GA4 Property:** 489035450  
**BigQuery Project:** `web-app-production-451214`  
**BigQuery Dataset:** `analytics_489035450`  
**Tables:** `events_*` (daily export)  
**Total Alerts Defined:** 20  
**External Dependencies Required:** None — all alerts use standard GA4 BigQuery data  

---

## Table of Contents

1. [Philosophy & Purpose](#1-philosophy--purpose)
2. [Severity Levels](#2-severity-levels)
3. [Detection Methods](#3-detection-methods)
4. [Platform Health Alerts (5)](#4-platform-health-alerts)
5. [Client Behavior Alerts (5)](#5-client-behavior-alerts)
6. [Feature Adoption Alerts (4)](#6-feature-adoption-alerts)
7. [Engagement Quality Alerts (3)](#7-engagement-quality-alerts)
8. [Growth & Traffic Alerts (3)](#8-growth--traffic-alerts)
9. [Dashboard UI Design](#9-dashboard-ui-design)
10. [Insights Engine Architecture](#10-insights-engine-architecture)
11. [Baseline SQL Patterns](#11-baseline-sql-patterns)
12. [Implementation Plan](#12-implementation-plan)
13. [Complete Alert Index](#13-complete-alert-index)

---

## 1. Philosophy & Purpose

The first 8 chapters answer "what is happening." This chapter answers **"what should I pay attention to right now?"**

### The Three Pillars

1. **Detect** — Automatically identify when any metric moves beyond its normal range (spikes, drops, absences, trend shifts).
2. **Contextualize** — Each alert specifies which client, which feature, which time window is involved. Immediately actionable.
3. **Guide Action** — Each alert includes a recommended next step: review a client, investigate a feature, check a traffic source, or celebrate growth.

### Key Principle

Dashboards require humans to scan every chart for changes. Insights flip this — the system surfaces what's important. The team's time goes to *acting* on signals, not *searching* for them.

Every insight is derived from **data already available in GA4 BigQuery**. No external data sources, no custom events, and no CRM integration required. The system compares current values against calculated baselines and flags deviations.

---

## 2. Severity Levels

Every alert has a severity level that determines how prominently it appears and how urgently it should be reviewed.

| Severity | Icon | Trigger Threshold | Review Window | Example |
|----------|------|-------------------|---------------|---------|
| **Critical** | 🔴 | >3σ deviation or 100% change | Same day | Top client goes dormant for 7+ days |
| **Warning** | 🟡 | >2σ deviation or 50%+ change | 24-48 hours | DAU drops 50% week-over-week |
| **Info** | 🔵 | >1.5σ or notable pattern | Weekly review | New client detected using platform |

---

## 3. Detection Methods

Four mathematical methods power the anomaly detection engine. Each alert uses one or more of these methods.

### Z-Score (Statistical Deviation)

Compares current value against a rolling average ± N standard deviations. Best for metrics with consistent patterns. A Z-score above 2 means the value is unusually high; below -2, unusually low.

**Used by:** P1, P2, P3, C3, F4, G1

### WoW / MoM (Period-over-Period)

Compares this period (week, day) against the equivalent previous period. Simple percentage change. Best for spotting sudden shifts without needing a long historical baseline.

**Used by:** P4, P5, F1, F2, E1, E2, E3, C5

### Threshold (Absolute Limits)

Fires when a value crosses a defined absolute threshold — zero events from a client, first visit from a new subdomain, or specific ratio boundaries.

**Used by:** C2, C4, F3, G2, G3

### Absence (Expected Activity Missing)

Detects when something that should happen doesn't. A client that normally has 100+ events per week suddenly has zero.

**Used by:** C1

> **✅ All detection is done via BigQuery SQL.** No ML models, no external services. Just SQL queries that compute baselines and compare current values. Simple, auditable, and cheap.

---

## 4. Platform Health Alerts

Monitors the overall vital signs of the platform. These alerts fire when platform-wide metrics deviate from normal.

### P1 — DAU Spike

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Warning |
| **Method** | Z-Score |
| **Check Frequency** | Daily |
| **What it detects** | Daily active users exceeded 2 standard deviations above the 14-day rolling average. Could indicate a successful campaign, viral moment, or data anomaly (bot traffic). |
| **Recommended Action** | Check if spike is from real users or bots (examine device/geo data). If real, identify the source (new client? marketing campaign?). Cross-reference with Traffic chapter. |

**SQL:**
```sql
-- P1: DAU Spike Detection
WITH daily_users AS (
  SELECT event_date,
    COUNT(DISTINCT user_pseudo_id) AS dau
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
  GROUP BY event_date
),
stats AS (
  SELECT *,
    AVG(dau) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS rolling_avg,
    STDDEV(dau) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS rolling_std
  FROM daily_users
)
SELECT event_date, dau, rolling_avg, rolling_std,
  (dau - rolling_avg) / NULLIF(rolling_std, 0) AS z_score
FROM stats
WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
  AND (dau - rolling_avg) / NULLIF(rolling_std, 0) > 2
```

---

### P2 — DAU Drop

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Method** | Z-Score |
| **Check Frequency** | Daily |
| **What it detects** | Daily active users fell more than 2 standard deviations below the 14-day rolling average. Could indicate platform issues, downtime, deployment bugs, or a holiday/weekend effect. |
| **Recommended Action** | Check platform uptime and error logs. Verify GA4 is still collecting data. Rule out weekends/holidays. If persistent, check if specific clients stopped using the platform. |

**SQL:**
```sql
-- P2: Same CTE as P1, filter reversed
-- ... (same daily_users and stats CTEs) ...
WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
  AND (dau - rolling_avg) / NULLIF(rolling_std, 0) < -2
```

---

### P3 — Event Volume Anomaly

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Warning |
| **Method** | Z-Score |
| **Check Frequency** | Daily |
| **What it detects** | Total daily events (all types combined) deviated >2σ from the 14-day average. A spike could mean bot activity or a new high-activity client. A drop could mean GA4 tracking issues. |
| **Recommended Action** | If spike: check Events chapter for which event type spiked. If drop: verify gtag is still firing on the platform. Check if a deployment broke analytics tracking. |

**SQL:**
```sql
-- P3: Event Volume Anomaly
WITH daily_events AS (
  SELECT event_date, COUNT(*) AS total_events
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
  GROUP BY event_date
),
stats AS (
  SELECT *,
    AVG(total_events) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS avg_events,
    STDDEV(total_events) OVER (ORDER BY event_date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS std_events
  FROM daily_events
)
SELECT event_date, total_events, avg_events,
  (total_events - avg_events) / NULLIF(std_events, 0) AS z_score
FROM stats
WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
  AND ABS((total_events - avg_events) / NULLIF(std_events, 0)) > 2
```

---

### P4 — Engagement Time Crash

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Method** | WoW |
| **Check Frequency** | Weekly |
| **What it detects** | Average engagement time per session dropped >40% compared to the previous week. This signals users are bouncing faster — possibly a UX regression, broken feature, or performance issue. |
| **Recommended Action** | Check if a deployment happened this week. Review which pages lost engagement. Test the platform manually for broken features or slow load times. |

**SQL:**
```sql
-- P4: Engagement Time Week-over-Week
WITH weekly_engagement AS (
  SELECT
    CASE
      WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
        THEN 'this_week'
      ELSE 'last_week'
    END AS period,
    AVG(
      (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec')
    ) AS avg_engagement_ms
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
    AND event_name = 'user_engagement'
  GROUP BY period
)
SELECT
  this.avg_engagement_ms AS this_week,
  last.avg_engagement_ms AS last_week,
  ROUND((this.avg_engagement_ms - last.avg_engagement_ms) / NULLIF(last.avg_engagement_ms, 0) * 100, 1) AS pct_change
FROM (SELECT avg_engagement_ms FROM weekly_engagement WHERE period = 'this_week') this,
     (SELECT avg_engagement_ms FROM weekly_engagement WHERE period = 'last_week') last
WHERE (this.avg_engagement_ms - last.avg_engagement_ms) / NULLIF(last.avg_engagement_ms, 0) < -0.4
```

---

### P5 — Active Clients Count Drop

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Method** | WoW |
| **Check Frequency** | Weekly |
| **What it detects** | The number of unique active client subdomains this week is >20% lower than last week. Means multiple clients stopped using the platform simultaneously — possible churn signal. |
| **Recommended Action** | Run the Client Behavior Alerts to identify which specific clients went dormant. Cross-reference with CRM for churn risk. Reach out to inactive clients proactively. |

**SQL:**
```sql
-- P5: Active Clients WoW Comparison
WITH weekly_clients AS (
  SELECT
    CASE
      WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
        THEN 'this_week'
      ELSE 'last_week'
    END AS period,
    COUNT(DISTINCT REGEXP_EXTRACT(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
      r'https://([^.]+)\.8020rei\.com'
    )) AS active_clients
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
  GROUP BY period
)
SELECT
  this.active_clients AS this_week,
  last.active_clients AS last_week,
  ROUND((this.active_clients - last.active_clients) * 100.0 / NULLIF(last.active_clients, 0), 1) AS pct_change
FROM (SELECT active_clients FROM weekly_clients WHERE period = 'this_week') this,
     (SELECT active_clients FROM weekly_clients WHERE period = 'last_week') last
WHERE (this.active_clients - last.active_clients) * 100.0 / NULLIF(last.active_clients, 0) < -20
```

---

## 5. Client Behavior Alerts

The most valuable category. These track individual client behavior changes — the signals that directly impact retention and revenue.

### C1 — Client Going Dormant

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Method** | Absence |
| **Check Frequency** | Daily |
| **What it detects** | A client that averaged >50 events per week over the last 4 weeks now has <5 events in the last 7 days. This is the **#1 churn predictor** — a previously active client going silent. |
| **Recommended Action** | Immediate outreach. Check CRM for recent tickets or complaints. Review their last session data to see what they did before going silent. Prioritize top-revenue clients. |

**SQL:**
```sql
-- C1: Client Going Dormant
WITH client_history AS (
  SELECT
    REGEXP_EXTRACT(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
      r'https://([^.]+)\.8020rei\.com'
    ) AS client,
    COUNTIF(_TABLE_SUFFIX BETWEEN
      FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 35 DAY))
      AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
    ) AS events_prev_4w,
    COUNTIF(_TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)))
      AS events_last_7d
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 35 DAY))
  GROUP BY client
  HAVING client IS NOT NULL
)
SELECT client,
  events_prev_4w, ROUND(events_prev_4w / 4.0, 0) AS avg_weekly,
  events_last_7d
FROM client_history
WHERE events_prev_4w / 4.0 > 50   -- was active (>50 events/week avg)
  AND events_last_7d < 5            -- now dormant (<5 events this week)
ORDER BY events_prev_4w DESC
```

---

### C2 — Client Reactivation

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Info |
| **Method** | Threshold |
| **Check Frequency** | Daily |
| **What it detects** | A client that had <5 events per week for the past 2+ weeks now has >30 events in the last 7 days. A dormant client came back to life. |
| **Recommended Action** | Positive signal! Check which features they're now using (Features chapter). Did they receive an email? A new feature release? Consider reaching out to reinforce engagement. |

**SQL:**
```sql
-- C2: Client Reactivation (same CTE as C1, reversed logic)
WHERE events_prev_4w / 4.0 < 5     -- was dormant (<5 events/week avg)
  AND events_last_7d > 30           -- now active (>30 events this week)
```

---

### C3 — Client Usage Surge

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Warning |
| **Method** | Z-Score |
| **Check Frequency** | Daily |
| **What it detects** | A client's weekly events are >3× their 4-week average. Could be a power user deep-diving, onboarding new team members, or preparing for a large data operation. |
| **Recommended Action** | Check which features they're using heavily. If they added users, this is growth. If one user is doing everything, they may need onboarding help. |

**SQL:**
```sql
-- C3: Client Usage Surge (same CTE as C1)
WHERE events_prev_4w / 4.0 > 10                    -- had a baseline (>10 events/week avg)
  AND events_last_7d > (events_prev_4w / 4.0) * 3  -- 3× their average
```

---

### C4 — New Client Detected

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Info |
| **Method** | Threshold |
| **Check Frequency** | Daily |
| **What it detects** | A subdomain appeared in the last 7 days that has never been seen in the previous 30 days. A new client started using the platform. |
| **Recommended Action** | Verify it's a legitimate new client (not a test subdomain). Track their onboarding journey — which features did they explore first? Set up a welcome outreach. |

**SQL:**
```sql
-- C4: New Client Detected
WITH recent_clients AS (
  SELECT DISTINCT REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'https://([^.]+)\.8020rei\.com'
  ) AS client
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
),
historical_clients AS (
  SELECT DISTINCT REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'https://([^.]+)\.8020rei\.com'
  ) AS client
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 37 DAY))
    AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
)
SELECT r.client
FROM recent_clients r
LEFT JOIN historical_clients h ON r.client = h.client
WHERE h.client IS NULL
  AND r.client IS NOT NULL
```

---

### C5 — Top Client Ranking Shift

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Info |
| **Method** | WoW |
| **Check Frequency** | Weekly |
| **What it detects** | A client that was in the Top 5 by activity last week is no longer in the Top 5, or a client outside the Top 10 jumped into the Top 5. Significant shifts in who your power users are. |
| **Recommended Action** | If a top client dropped: check C1 (dormant) alerts. If a new client surged: check C3 and understand what's driving their usage. Update account priority list. |

**SQL:**
```sql
-- C5: Top Client Ranking Shift (compare two weeks)
WITH this_week AS (
  SELECT REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'https://([^.]+)\.8020rei\.com') AS client,
    COUNT(*) AS events,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank_tw
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
  GROUP BY client HAVING client IS NOT NULL
),
last_week AS (
  SELECT REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'https://([^.]+)\.8020rei\.com') AS client,
    COUNT(*) AS events,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank_lw
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
    AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
  GROUP BY client HAVING client IS NOT NULL
)
SELECT COALESCE(tw.client, lw.client) AS client,
  tw.rank_tw, lw.rank_lw,
  (IFNULL(lw.rank_lw, 99) - IFNULL(tw.rank_tw, 99)) AS rank_change
FROM this_week tw
FULL OUTER JOIN last_week lw ON tw.client = lw.client
WHERE (tw.rank_tw <= 5 OR lw.rank_lw <= 5)
  AND ABS(IFNULL(lw.rank_lw, 99) - IFNULL(tw.rank_tw, 99)) >= 3
ORDER BY tw.rank_tw
```

---

## 6. Feature Adoption Alerts

Tracks changes in how features are adopted and used across the platform.

### F1 — Feature Usage Spike

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Info |
| **Method** | WoW |
| **Check Frequency** | Weekly |
| **What it detects** | A specific feature's page views increased >100% week-over-week. Something is driving increased interest. |
| **Recommended Action** | Investigate what drove the spike. Was there a product update? Check which clients drove the increase. Consider creating content to sustain momentum. |

**SQL:**
```sql
-- F1: Feature Usage Spike (WoW per feature)
WITH feature_weekly AS (
  SELECT
    CASE
      WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
      WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox Deals'
      WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
      WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
      WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
      WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
      ELSE 'Other'
    END AS feature,
    CASE
      WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
        THEN 'this_week'
      ELSE 'last_week'
    END AS period,
    COUNT(*) AS views
  FROM (
    SELECT (SELECT value.string_value FROM UNNEST(event_params)
      WHERE key = 'page_location') AS page_url, _TABLE_SUFFIX
    FROM `web-app-production-451214.analytics_489035450.events_*`
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
      AND event_name = 'page_view'
  )
  GROUP BY feature, period
)
SELECT tw.feature, tw.views AS this_week, lw.views AS last_week,
  ROUND((tw.views - lw.views) * 100.0 / NULLIF(lw.views, 0), 1) AS pct_change
FROM (SELECT * FROM feature_weekly WHERE period = 'this_week') tw
JOIN (SELECT * FROM feature_weekly WHERE period = 'last_week') lw ON tw.feature = lw.feature
WHERE tw.feature != 'Other'
  AND (tw.views - lw.views) * 100.0 / NULLIF(lw.views, 0) > 100
ORDER BY pct_change DESC
```

---

### F2 — Feature Abandonment

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Warning |
| **Method** | WoW |
| **Check Frequency** | Weekly |
| **What it detects** | A feature's page views dropped >50% week-over-week (minimum 20 views last week to avoid noise). Users are abandoning this feature. |
| **Recommended Action** | Test the feature manually. Check if a deployment broke it. Review if the URL pattern changed. If intentional, consider whether the feature should be sunset. |

**SQL:** Same structure as F1, filter: `pct_change < -50 AND lw.views > 20`

---

### F3 — Client Discovers New Feature

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Info |
| **Method** | Threshold |
| **Check Frequency** | Daily |
| **What it detects** | A client visited a feature page this week that they have never visited in the previous 30 days. They discovered a part of the platform they weren't using before. |
| **Recommended Action** | Track if they continue using the feature next week (stickiness). Consider sending helpful resources. Analyze if driven by an in-app prompt or organic discovery. |

**SQL:**
```sql
-- F3: Client Discovers New Feature
WITH recent_usage AS (
  SELECT DISTINCT
    REGEXP_EXTRACT(page_url, r'https://([^.]+)\.8020rei\.com') AS client,
    CASE
      WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
      WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
      WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
      WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
    END AS feature
  FROM (
    SELECT (SELECT value.string_value FROM UNNEST(event_params)
      WHERE key = 'page_location') AS page_url
    FROM `web-app-production-451214.analytics_489035450.events_*`
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
      AND event_name = 'page_view'
  )
  WHERE feature IS NOT NULL
),
historical_usage AS (
  -- Same structure for days 8-37
  SELECT DISTINCT client, feature FROM ... -- previous 30 days
)
SELECT r.client, r.feature AS new_feature_discovered
FROM recent_usage r
LEFT JOIN historical_usage h ON r.client = h.client AND r.feature = h.feature
WHERE h.client IS NULL
```

---

### F4 — Login Page Anomaly

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Warning |
| **Method** | Z-Score |
| **Check Frequency** | Daily |
| **What it detects** | Login page (`/session/login`) views spiked >2σ relative to normal, without a corresponding increase in other feature usage. Could mean authentication issues — users stuck in a login loop. |
| **Recommended Action** | Check if the login system is functioning. Look for error patterns. Verify SSO integrations are working. High login views + low feature views = users can't get in. |

**SQL:** Z-Score pattern (Pattern A) with `METRIC_EXPR = COUNT(CASE WHEN page_url CONTAINS '/session/login' THEN 1 END)`

---

## 7. Engagement Quality Alerts

Measures the depth and quality of user interactions, not just volume.

### E1 — Form Conversion Drop

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Warning |
| **Method** | WoW |
| **Check Frequency** | Weekly |
| **What it detects** | The ratio of `form_submit` to `form_start` dropped >50% week-over-week. Users are starting forms but not finishing them — friction in the UX. |
| **Recommended Action** | Identify which forms are affected. Check for broken validation, confusing fields, or new required fields. Test the form flow manually. |

**SQL:**
```sql
-- E1: Form Conversion WoW
WITH weekly_forms AS (
  SELECT
    CASE
      WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
        THEN 'this_week'
      ELSE 'last_week'
    END AS period,
    SAFE_DIVIDE(
      COUNT(CASE WHEN event_name = 'form_submit' THEN 1 END),
      COUNT(CASE WHEN event_name = 'form_start' THEN 1 END)
    ) AS conversion_rate
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
    AND event_name IN ('form_start', 'form_submit')
  GROUP BY period
)
SELECT
  this.conversion_rate AS this_week_rate,
  last.conversion_rate AS last_week_rate,
  ROUND((this.conversion_rate - last.conversion_rate) / NULLIF(last.conversion_rate, 0) * 100, 1) AS pct_change
FROM (SELECT conversion_rate FROM weekly_forms WHERE period = 'this_week') this,
     (SELECT conversion_rate FROM weekly_forms WHERE period = 'last_week') last
WHERE (this.conversion_rate - last.conversion_rate) / NULLIF(last.conversion_rate, 0) < -0.5
```

---

### E2 — Scroll Depth Decline

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Info |
| **Method** | WoW |
| **Check Frequency** | Weekly |
| **What it detects** | The ratio of `scroll` events (90% depth) to `page_view` events dropped >30% WoW. Users are viewing pages but not scrolling down. |
| **Recommended Action** | Check which pages lost scroll depth. May indicate important content pushed too far down, layout changes, or users finding what they need above the fold (could be positive). |

**SQL:** WoW pattern comparing `COUNT(scroll) / COUNT(page_view)` between this week and last week.

---

### E3 — Single-Page Sessions Spike

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Warning |
| **Method** | WoW |
| **Check Frequency** | Weekly |
| **What it detects** | The percentage of sessions with only 1 `page_view` event increased >25% WoW. Users are landing and leaving without navigating — a bounce behavior signal. |
| **Recommended Action** | Check which landing pages are affected. Is navigation clear? Cross-reference with Traffic chapter to see if a new traffic source is sending low-quality visitors. |

**SQL:** Calculate sessions (via `ga_session_id` + `user_pseudo_id`) with `COUNT(page_view) = 1`, compare ratio WoW.

---

## 8. Growth & Traffic Alerts

Detects changes in user acquisition and traffic patterns.

### G1 — First Visits Spike

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Info |
| **Method** | Z-Score |
| **Check Frequency** | Daily |
| **What it detects** | `first_visit` events exceeded >2σ above the 14-day average. More new users than usual are arriving. |
| **Recommended Action** | Cross-reference with Traffic chapter to identify the source. If organic: document what happened. If from a campaign: measure conversion to active users. Check Geography for new markets. |

**SQL:** Z-Score pattern with `METRIC_EXPR = COUNT(CASE WHEN event_name = 'first_visit' THEN 1 END)`

---

### G2 — New Traffic Source Detected

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Info |
| **Method** | Threshold |
| **Check Frequency** | Weekly |
| **What it detects** | A `traffic_source.source` or `page_referrer` value appeared this week that was never seen in the previous 30 days with >5 users. Someone new is linking to 8020REI. |
| **Recommended Action** | Visit the referrer URL to understand context. Is it a blog review, a partner link, a social media mention? Consider engaging with the source. |

**SQL:** Compare `DISTINCT traffic_source.source` between this week and previous 30 days, filter for new sources with >5 users.

---

### G3 — Geographic Anomaly

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Warning |
| **Method** | Threshold |
| **Check Frequency** | Weekly |
| **What it detects** | Significant traffic (>10 users) from a country that historically has <2 users. For a US-focused real estate platform, unexpected international traffic could signal bot activity or an expansion opportunity. |
| **Recommended Action** | Check if traffic looks legitimate (device, engagement patterns). If bots: consider geo-blocking. If legitimate: could be virtual assistants or international investors. |

**SQL:**
```sql
-- G3: Geographic Anomaly
WITH recent_geo AS (
  SELECT geo.country, COUNT(DISTINCT user_pseudo_id) AS users_tw
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
  GROUP BY geo.country
),
historical_geo AS (
  SELECT geo.country, COUNT(DISTINCT user_pseudo_id) / 4.0 AS avg_weekly_users
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 35 DAY))
    AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
  GROUP BY geo.country
)
SELECT r.country, r.users_tw, IFNULL(h.avg_weekly_users, 0) AS historical_avg
FROM recent_geo r
LEFT JOIN historical_geo h ON r.country = h.country
WHERE r.users_tw > 10
  AND IFNULL(h.avg_weekly_users, 0) < 2
ORDER BY r.users_tw DESC
```

---

## 9. Dashboard UI Design

The alerts are presented as a prioritized feed — most critical at the top, with ability to drill into each.

### UI Layout for the Insights Tab

```
┌──────────────────────────────────────────────────────┐
│  HEADER: "Insights" + Last Checked Timestamp         │
│  ┌──────────┬──────────┬──────────┐                  │
│  │ 🔴 1     │ 🟡 3     │ 🔵 5     │  ← Summary bar  │
│  │ Critical │ Warning  │ Info     │                  │
│  └──────────┴──────────┴──────────┘                  │
├──────────────────────────────────────────────────────┤
│  FILTERS: [All] [Critical] [Warning] [Info]          │
│           [Platform] [Client] [Feature] [Engagement] │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │ 🔴 C1 · Client Going Dormant — dmforce        │  │
│  │    Avg 320 events/week → 2 this week           │  │
│  │    [→ View Client]                             │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │ 🟡 F2 · Feature Abandonment — Importer         │  │
│  │    Views dropped 62% WoW                       │  │
│  │    [→ View Feature Trend]                      │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │ 🔵 C4 · New Client — keystoneinvestors         │  │
│  │    First seen Feb 8, visited 3 features        │  │
│  └────────────────────────────────────────────────┘  │
│  ... more alerts ...                                 │
├──────────────────────────────────────────────────────┤
│  HISTORY: "Resolved alerts from past 30 days"        │
│  [Collapsible section with past alerts]              │
└──────────────────────────────────────────────────────┘
```

### UI Components Needed

| Component | Purpose | Data Source |
|-----------|---------|-------------|
| **SeveritySummary** | 3 scorecards showing count per severity level | Aggregated from all alerts |
| **AlertFilterBar** | Filter by severity and category | Client-side filter |
| **AlertCard** | Individual alert with severity icon, title, description, metadata, and action link | Each alert object |
| **AlertHistory** | Collapsible section for resolved/past alerts | Previous query results (stored) |

### Alert Card Data Structure

Each AlertCard receives:
- `id` — Alert ID (P1, C1, F2, etc.)
- `name` — Alert name
- `severity` — critical / warning / info
- `category` — platform / client / feature / engagement / growth
- `description` — Human-readable explanation with specific data
- `entity` — Which client, feature, or metric is involved (optional)
- `metrics` — `{ baseline, current, change_pct }`
- `detected_at` — Timestamp
- `action` — Recommended next step
- `link` — Deep link to relevant dashboard chapter/filter

---

## 10. Insights Engine Architecture

### Data Flow

```
BigQuery (events_*) → /api/insights → Detection Engine (baselines + z-scores) → Alert Feed (sorted by severity) → Insights Tab (UI)
```

### API Endpoint

**`GET /api/insights`**

Response:
```json
{
  "success": true,
  "alerts": [
    {
      "id": "C1",
      "name": "Client Going Dormant",
      "severity": "critical",
      "category": "client",
      "description": "dmforce averaged 320 events/week, now has 2 in the last 7 days",
      "entity": "dmforce",
      "metrics": {
        "baseline": 320,
        "current": 2,
        "change_pct": -99.4
      },
      "detected_at": "2026-02-10T06:00:00Z",
      "action": "Review client in Clients chapter",
      "link": "/clients?filter=dmforce"
    }
  ],
  "summary": { "critical": 1, "warning": 2, "info": 3 },
  "last_checked": "2026-02-10T06:00:00Z"
}
```

### Performance Strategy

| Concern | Solution |
|---------|----------|
| **20 queries per load** | Group queries into 5 combined queries using UNION ALL or multi-statement SQL. Run in parallel with `Promise.all()`. |
| **Query cost** | Cache insights for 30-60 minutes. Alerts don't need real-time refresh — they are based on daily/weekly data. |
| **Response time** | Target <5 seconds. Combined queries reduce round-trips. Cache brings subsequent loads to <200ms. |
| **Historical alerts** | Store alert results in a simple JSON file or database to show resolved alerts over time. |

---

## 11. Baseline SQL Patterns

Reusable SQL patterns that power the detection engine.

### Pattern A — Z-Score Detection

**Used by:** P1, P2, P3, C3, F4, G1

```sql
-- Generic Z-Score Pattern
-- Replace [METRIC_EXPR] for each alert
WITH daily_metric AS (
  SELECT event_date, [METRIC_EXPR] AS metric_value
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY))
  GROUP BY event_date
),
with_stats AS (
  SELECT *,
    AVG(metric_value) OVER (
      ORDER BY event_date
      ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING
    ) AS rolling_avg,
    STDDEV(metric_value) OVER (
      ORDER BY event_date
      ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING
    ) AS rolling_std
  FROM daily_metric
)
SELECT event_date, metric_value, rolling_avg, rolling_std,
  ROUND((metric_value - rolling_avg) / NULLIF(rolling_std, 0), 2) AS z_score,
  CASE
    WHEN ABS((metric_value - rolling_avg) / NULLIF(rolling_std, 0)) > 3 THEN 'critical'
    WHEN ABS((metric_value - rolling_avg) / NULLIF(rolling_std, 0)) > 2 THEN 'warning'
    WHEN ABS((metric_value - rolling_avg) / NULLIF(rolling_std, 0)) > 1.5 THEN 'info'
    ELSE 'normal'
  END AS severity
FROM with_stats
WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
```

### Pattern B — Week-over-Week Comparison

**Used by:** P4, P5, F1, F2, E1, E2, E3

```sql
-- Generic WoW Comparison Pattern
WITH weekly_data AS (
  SELECT
    CASE
      WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
        THEN 'this_week'
      ELSE 'last_week'
    END AS period,
    [METRIC_EXPR] AS metric_value
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
  GROUP BY period
)
SELECT
  tw.metric_value AS this_week,
  lw.metric_value AS last_week,
  ROUND((tw.metric_value - lw.metric_value) * 100.0
    / NULLIF(lw.metric_value, 0), 1) AS pct_change,
  CASE
    WHEN ABS(...) > 75 THEN 'critical'
    WHEN ABS(...) > 50 THEN 'warning'
    WHEN ABS(...) > 30 THEN 'info'
    ELSE 'normal'
  END AS severity
FROM (...) tw, (...) lw
```

### Pattern C — Absence / Threshold Detection

**Used by:** C1, C2, C4, F3, G2, G3

```sql
-- Generic Absence Detection Pattern
WITH baseline_period AS (
  SELECT [ENTITY], [METRIC_EXPR] AS baseline_value
  FROM ... WHERE -- previous 4 weeks
  GROUP BY [ENTITY]
),
current_period AS (
  SELECT [ENTITY], [METRIC_EXPR] AS current_value
  FROM ... WHERE -- last 7 days
  GROUP BY [ENTITY]
)
SELECT b.[ENTITY], b.baseline_value, IFNULL(c.current_value, 0) AS current_value
FROM baseline_period b
LEFT JOIN current_period c ON b.[ENTITY] = c.[ENTITY]
WHERE b.baseline_value > [ACTIVE_THRESHOLD]
  AND IFNULL(c.current_value, 0) < [DORMANT_THRESHOLD]
```

---

## 12. Implementation Plan

### Phase A — Core Detection Queries (2-3 days)

Write and test all 20 alert queries in BigQuery console. Validate thresholds against real data. Some alerts may need threshold tuning based on actual data distribution.

### Phase B — API Route (2-3 days)

Create `/api/insights` route. Group queries into 5 combined queries for efficiency. Add 30-minute cache layer. Define TypeScript interfaces for alert objects.

### Phase C — UI Components (2-3 days)

Build SeveritySummary, AlertFilterBar, and AlertCard components. Match existing 8020 design system (blue theme, Inter font, card patterns). Wire to /api/insights data.

### Phase D — Threshold Tuning (1-2 weeks monitoring)

Run the system for 1-2 weeks and review alert quality. Adjust thresholds to reduce false positives and catch real issues. Document final thresholds.

### Phase E — Alert History & Notifications (1 week, optional)

Store alert results for historical review. Add "resolved" status. Optionally, add email/Slack notifications for critical alerts via webhook.

### File Structure Addition

```
src/
├── app/
│   └── api/
│       └── insights/
│           └── route.ts          ← NEW: Insights API endpoint
├── components/
│   ├── AlertCard.tsx             ← NEW: Individual alert card
│   ├── AlertFilterBar.tsx        ← NEW: Severity + category filters
│   ├── SeveritySummary.tsx       ← NEW: Critical/Warning/Info counts
│   └── ... (existing components)
└── lib/
    ├── insights-queries.ts       ← NEW: All 20 alert SQL queries
    ├── insights-engine.ts        ← NEW: Detection logic + thresholds
    └── ... (existing files)
```

> **✅ Everything runs on existing infrastructure.** No new services, databases, or external tools required. The Insights engine is just more BigQuery queries through the same Next.js API route pattern used by the other 8 chapters.

---

## 13. Complete Alert Index

| ID | Alert Name | Category | Severity | Method | Frequency | GA4 |
|----|-----------|----------|----------|--------|-----------|-----|
| **P1** | DAU Spike | Platform | 🟡 Warning | Z-Score | Daily | ✅ |
| **P2** | DAU Drop | Platform | 🔴 Critical | Z-Score | Daily | ✅ |
| **P3** | Event Volume Anomaly | Platform | 🟡 Warning | Z-Score | Daily | ✅ |
| **P4** | Engagement Time Crash | Platform | 🔴 Critical | WoW | Weekly | ✅ |
| **P5** | Active Clients Count Drop | Platform | 🔴 Critical | WoW | Weekly | ✅ |
| **C1** | Client Going Dormant | Client | 🔴 Critical | Absence | Daily | ✅ |
| **C2** | Client Reactivation | Client | 🔵 Info | Threshold | Daily | ✅ |
| **C3** | Client Usage Surge | Client | 🟡 Warning | Z-Score | Daily | ✅ |
| **C4** | New Client Detected | Client | 🔵 Info | Threshold | Daily | ✅ |
| **C5** | Top Client Ranking Shift | Client | 🔵 Info | WoW | Weekly | ✅ |
| **F1** | Feature Usage Spike | Feature | 🔵 Info | WoW | Weekly | ✅ |
| **F2** | Feature Abandonment | Feature | 🟡 Warning | WoW | Weekly | ✅ |
| **F3** | Client Discovers New Feature | Feature | 🔵 Info | Threshold | Daily | ✅ |
| **F4** | Login Page Anomaly | Feature | 🟡 Warning | Z-Score | Daily | ✅ |
| **E1** | Form Conversion Drop | Engagement | 🟡 Warning | WoW | Weekly | ✅ |
| **E2** | Scroll Depth Decline | Engagement | 🔵 Info | WoW | Weekly | ✅ |
| **E3** | Single-Page Sessions Spike | Engagement | 🟡 Warning | WoW | Weekly | ✅ |
| **G1** | First Visits Spike | Growth | 🔵 Info | Z-Score | Daily | ✅ |
| **G2** | New Traffic Source | Growth | 🔵 Info | Threshold | Weekly | ✅ |
| **G3** | Geographic Anomaly | Growth | 🟡 Warning | Threshold | Weekly | ✅ |

### Summary by Severity

- **🔴 Critical (4):** P2, P4, P5, C1
- **🟡 Warning (8):** P1, P3, C3, F2, F4, E1, E3, G3
- **🔵 Info (8):** C2, C4, C5, F1, F3, E2, G1, G2

### Summary by Category

- **Platform Health:** 5 alerts (P1-P5)
- **Client Behavior:** 5 alerts (C1-C5)
- **Feature Adoption:** 4 alerts (F1-F4)
- **Engagement Quality:** 3 alerts (E1-E3)
- **Growth & Traffic:** 3 alerts (G1-G3)

**All 20 alerts use GA4 BigQuery standard data. No custom events, no external APIs, no CRM integration required.**

---

*Document generated: February 2026*  
*Chapter 9 addition to the 8020REI Metrics Dashboard Plan v2*
