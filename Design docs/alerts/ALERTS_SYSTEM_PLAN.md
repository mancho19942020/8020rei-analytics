# Alerts System Plan — Complete Inventory & Blueprint

**Date:** April 7, 2026 (updated April 9, 2026)  
**Status:** Systems A and B live and automated. System C pending.  
**Related docs:**
- [RAPID_RESPONSE_METRICS_PLAN.md](RAPID_RESPONSE_METRICS_PLAN.md) — Layer 1 (operational health)
- [DM_CAMPAIGN_METRICS_PLAN_V2.md](DM_CAMPAIGN_METRICS_PLAN_V2.md) — Layer 2 (business results)
- `Design docs/features/insights-tab.md` — GA4 analytics alerts (20 defined)

---

## 1. Complete Alert Inventory

The platform has **3 independent alert systems**, each monitoring a different layer of the business.  
**Systems A and B are fully operational** — automated daily digests fire Mon–Fri at 9:00 AM EST with zero manual intervention.

### System A: DM Campaign — Operational Health (Layer 1) — LIVE

**Purpose:** "Is the DM Campaign infrastructure running correctly?"  
**Data source:** Aurora tables (`rr_campaign_snapshots`, `rr_daily_metrics`, `rr_pcm_alignment`)  
**Scope today:** Rapid Response campaigns only. Smart Drop will use the same tables (`campaign_type` column).  
**Slack channel:** `#dm-campaign-alerts`  
**Slack delivery:** Automated daily digest Mon–Fri at 9:00 AM EST (threaded format)

| ID | Alert Name | Severity | Trigger | Threshold | Recommended Action |
|----|-----------|----------|---------|-----------|-------------------|
| `rr-no-sends` | No sends detected | **Critical** | Active campaigns exist but 0 sends today | 0 sends | Check dispatch job logs, verify cron is running |
| `rr-pcm-stale` | PCM pipeline stale | **Critical** | Mailings stuck in "sent" for 14+ days | Any > 0 | Investigate back-office PCM bridge |
| `rr-orphaned-orders` | Orphaned orders | **Critical** | Mailings sent without PCM order ID | Any > 0 | Check PCM API responses for timeouts |
| `rr-on-hold` | Campaigns with mailings on hold | **Critical/Warning** | Campaigns with 50+ mailings on hold | Warning: 50+, Critical: 500+ per campaign | Contact clients to recharge accounts |
| `rr-delivery-rate` | Delivery rate below threshold | **Warning** | 30-day delivery rate < 70% | < 70% | Review undeliverable addresses |
| `rr-pcm-rate` | PCM submission rate low | **Warning** | PCM submission rate < 95% | < 95% | Review PCM API error logs |

---

### System B: DM Campaign — Business Results (Layer 2) — LIVE

**Purpose:** "Is the DM Campaign generating results for our clients?"  
**Data source:** Aurora tables (`dm_property_conversions`, `dm_template_performance`, `dm_client_funnel`)  
**Slack channel:** `#dm-alerts-cs` (channel ID: `C0ARQTT6ZRA`)  
**Slack delivery:** Automated daily digest Mon–Fri at 9:00 AM EST (threaded format, same as System A)  
**Audience:** Customer Success team  
**Live since:** April 9, 2026

| ID | Alert Name | Severity | Trigger | Recommended Action |
|----|-----------|----------|---------|-------------------|
| `br-underperforming` | Underperforming campaign | **Critical** | Client has 500+ mailed properties but 0 leads | Review template and targeting criteria with client |
| `br-template-underperform` | Template underperforming vs peers | **Warning** | Template has 100+ sends, 0 leads while sibling template has leads | Suggest client switch to performing template |
| `br-low-delivery` | Low delivery rate | **Warning** | Template delivery rate < 50% | Review property data quality, enable address verification |
| `br-leads-no-deals` | Leads coming in but no deals closing | **Warning** | Client has 5+ leads but 0 deals | Check client's follow-up process and CRM |
| `br-stagnant` | Stagnant campaign | **Info** | 500+ mailed, 1-2 leads, 0 deals | Suggest expanding targeting criteria |
| `br-pipeline-leak` | Pipeline leakage | **Warning** | 3+ entries at a stage with 0 at next stage | Check for bottleneck in client's process |
| `br-negative-roas` | Negative ROAS | **Warning** | Client has deals but cost > revenue | Review deal values and campaign costs |

---

### System C: GA4 Analytics — Platform Usage (Insights Tab) — NOT BUILT

**Purpose:** "How are users interacting with the 8020REI platform itself?"  
**Data source:** BigQuery GA4 events  
**Slack channel:** `#analytics-alerts` (does not exist yet)  
**20 alerts defined** across 5 categories (Platform Health, Client Behavior, Feature Adoption, Engagement Quality, Growth & Traffic). See section at end of doc.

---

## 2. Alert Hierarchy — How Severity Works

| Severity | Emoji | What it means | Review window |
|----------|-------|---------------|---------------|
| **Critical** | :red_circle: | Something is broken or a major metric collapsed | Same day |
| **Warning** | :large_yellow_circle: | Something is degrading or needs monitoring | 24-48 hours |
| **Info** | :large_blue_circle: | Notable pattern or positive signal | Weekly review |

---

## 3. How the Alert System Works — Architecture Blueprint

This section is the **blueprint for building alerts for any new feature**. System A (DM Operational) is the reference implementation.

### 3.1 Components

Every alert system has 4 components:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Data Source     │────>│  Alert Evaluator  │────>│  Slack Delivery  │────>│  Scheduler   │
│  (Aurora/BQ)     │     │  (API Route)      │     │  (Web API)       │     │  (GH Actions) │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘
```

**1. Data Source** — where the raw data lives (Aurora PostgreSQL or BigQuery)

**2. Alert Evaluator** — a Next.js API route that:
- Queries the data source
- Checks each metric against its threshold
- Returns an array of `Alert` objects
- Lives at: `src/app/api/{feature}/slack-alerts/route.ts`

**3. Slack Delivery** — the shared Slack client (`src/lib/slack.ts`) that:
- Posts a summary message to the channel (returns `ts`)
- Posts each alert as a thread reply using `thread_ts`
- Falls back to a flat webhook message if bot token is not available

**4. Scheduler** — a GitHub Actions cron workflow that:
- Runs Mon–Fri at 9:00 AM EST
- Sends yesterday's alert state in the POST body
- Caches today's state for tomorrow's comparison
- Lives at: `.github/workflows/daily-alerts.yml`

### 3.2 Slack Delivery — Threaded Messages

**Method:** Slack Web API (`chat.postMessage`) with bot token.

**Why threads:** Jhon Berrio requested it — a clean summary as the main message, full detail in the thread. This keeps the channel scannable.

**How it works:**
1. Post summary message → get back `ts` (message timestamp = ID)
2. Post `:new: New alerts` header as thread reply using `thread_ts`
3. Post each new alert as a thread reply (full detail: description, metrics, action)
4. Post `:repeat: Persistent alerts` header as thread reply
5. Post persistent alerts as brief references (one-line with metric delta)

**Message structure in Slack:**

```
Main message (channel):
  DM Campaign daily digest — Tuesday, Apr 8, 2026
  🔴 3 critical  ·  🟡 2 warning  ·  5 total active  ·  3 new  ·  2 persistent
  🧵 Details in thread  ·  📊 View in Metrics Hub

  Thread:
    🆕 New alerts
    
    🔴 Campaigns with mailings on hold
    6 campaigns with 12,626 total mailings on hold...
    Action: Contact affected clients...
    Current: 12,626  ·  Threshold: 50
    
    🟡 PCM submission rate low
    PCM submission rate is 6.1%, below the 95% threshold...
    
    🔁 Persistent alerts (still active from previous days)
    
    🔴 PCM pipeline stale — 1,015 (↓ was 1,020, now 1,015)
    🔴 Orphaned orders — 4
```

### 3.3 Environment Variables

| Variable | Purpose | Where set |
|----------|---------|-----------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token (`xoxb-...`) for Web API | GitHub secret + Cloud Run env |
| `SLACK_DM_ALERTS_CHANNEL_ID` | Channel ID for `#dm-campaign-alerts` (System A) | GitHub secret + Cloud Run env |
| `SLACK_BUSINESS_ALERTS_CHANNEL_ID` | Channel ID for `#dm-alerts-cs` (System B) | GitHub secret + Cloud Run env |
| `SLACK_DM_ALERTS_WEBHOOK_URL` | Legacy webhook URL (fallback) | GitHub secret + Cloud Run env |
| `CRON_SECRET` | Shared secret for GitHub Actions → Cloud Run auth | GitHub secret + Cloud Run env |

**To add a new channel** for a new alert system:
1. Create the channel in Slack
2. Invite `@Metrics Hub Alerts` bot to the channel
3. Get the channel ID (right-click channel > View details > bottom)
4. Add as GitHub repo secret: `gh secret set SLACK_{NAME}_CHANNEL_ID --body "CXXXXXX"`
5. Update `deploy.yml` to pass the secret through to Cloud Run env vars
6. Update `slack.ts` with a getter function for the new channel
7. Add a new job in `daily-alerts.yml` calling the new endpoint

### 3.4 The Slack App

**App name:** Metrics Hub Alerts  
**App ID:** A0AR8J9S6HK  
**Created:** April 7, 2026  
**OAuth scope:** `chat:write`  
**Manage at:** [api.slack.com/apps](https://api.slack.com/apps)

The bot must be **invited to each channel** it posts to (`/invite @Metrics Hub Alerts`).

### 3.5 State Persistence — Persistent vs New Alerts

**The problem:** Daily digests need to know which alerts are new (appeared today) vs persistent (were active yesterday too).

**How it works:**
1. GitHub Actions workflow caches alert state using `actions/cache`
2. On each run, it POSTs the previous state in the request body: `{"previousState": [...]}`
3. The API route compares current alerts against the previous state
4. The response includes `currentState` which the workflow caches for tomorrow
5. Persistent alerts show metric deltas (e.g., "was 1,020, now 1,015")

**Fallback:** A `/tmp` file on Cloud Run also stores state (for manual testing). On container restart, all alerts appear as "new" once — safe direction.

**State entry format:**
```json
{
  "id": "rr-pcm-stale",
  "severity": "critical",
  "metricCurrent": 1015,
  "entity": "domain1, domain2"
}
```

### 3.6 Automation — GitHub Actions Cron

**Workflow:** `.github/workflows/daily-alerts.yml`

**Schedule:** `cron: '0 14 * * 1-5'` = Mon–Fri at 9:00 AM EST (14:00 UTC)

**Jobs (run in parallel):**

| Job | Endpoint | Channel | Cache key |
|-----|----------|---------|-----------|
| `send-operational-digest` | `/api/rapid-response/slack-alerts` | `#dm-campaign-alerts` | `dm-alerts-state-*` |
| `send-business-digest` | `/api/dm-conversions/business-alerts` | `#dm-alerts-cs` | `business-alerts-state-*` |

**Flow (each job):**
1. Restore previous alert state from `actions/cache`
2. POST to the endpoint with `{"previousState": [...]}` and `x-cron-secret` header
3. Parse response, extract `currentState`
4. Save `currentState` to cache for tomorrow

**Manual trigger:** Supports `workflow_dispatch` — trigger from GitHub Actions UI anytime. **Note:** this fires both jobs, not just one.

**To add a new alert system to the cron:** Add another job in the workflow that calls the new endpoint with its own cache key.

---

## 4. How to Build Alerts for a New Feature

Follow these steps to replicate the alert system for any new feature (e.g., System B or C):

### Step 1: Define the alerts

Create a table with: ID, Name, Severity, Trigger condition, Threshold, Recommended action.  
Use the severity hierarchy (Critical = broken, Warning = degrading, Info = notable).

### Step 2: Create the alert type

Add to `src/types/{feature}.ts`:
```typescript
export type AlertSeverity = 'critical' | 'warning' | 'info';
export interface Alert {
  id: string;
  name: string;
  severity: AlertSeverity;
  category: string;
  description: string;
  entity?: string;          // affected domains/clients
  metrics?: { current?: number; baseline?: number };
  detected_at: string;
  action: string;
  link?: string;            // dashboard deep link
}
```

### Step 3: Create the slack-alerts API route

Create `src/app/api/{feature}/slack-alerts/route.ts` following the pattern in `src/app/api/rapid-response/slack-alerts/route.ts`:

1. **`fetchCurrentAlerts()`** — query data source, evaluate thresholds, return `Alert[]`
2. **`POST` handler** — fetch alerts, compare against previous state, send threaded digest
3. Use `sendSlackMessage()` and `sendSlackThreadReply()` from `src/lib/slack.ts`

### Step 4: Add to the cron workflow

Add a new step in `.github/workflows/daily-alerts.yml`:
```yaml
- name: Send {Feature} digest to Slack
  run: |
    # Same pattern: load cache, POST with previousState, save currentState
    curl -X POST "$SERVICE_URL/api/{feature}/slack-alerts" ...
```

### Step 5: Set up the Slack channel

1. Create the channel in Slack
2. Invite `@Metrics Hub Alerts`
3. Add channel ID as env var
4. Update `slack.ts` if posting to a different channel than `#dm-campaign-alerts`

---

## 5. Smart Drop Readiness

**Current state:** All Aurora tables already have a `campaign_type` column that distinguishes `'rr'` (Rapid Response) from `'smartdrop'`. The Metrics Hub dashboard widgets and API routes already filter/aggregate by campaign type.

**What might need adjustment:**
- Alert thresholds — Smart Drop volumes will be much higher
- "No sends detected" logic may need different cadences
- Template performance may need separate views

---

## 6. GA4 Analytics Alerts (System C) — Full List

**20 alerts defined across 5 categories:**

### Platform Health (5)
| ID | Alert | Severity | Trigger |
|----|-------|----------|---------|
| P1 | DAU spike | Warning | DAU > 2σ above 14-day avg |
| P2 | DAU drop | Critical | DAU < 2σ below 14-day avg |
| P3 | Event volume anomaly | Warning | Events > 2σ deviation |
| P4 | Engagement time crash | Critical | Engagement dropped >40% WoW |
| P5 | Active clients drop | Critical | Active clients decreased >20% WoW |

### Client Behavior (5)
| ID | Alert | Severity | Trigger |
|----|-------|----------|---------|
| C1 | Client going dormant | Critical | Was >50 events/week, now <5 in 7 days |
| C2 | Client reactivation | Info | Was <5 events/week, now >30 in 7 days |
| C3 | Client usage surge | Warning | Events > 3x their 4-week avg |
| C4 | New client detected | Info | Subdomain first seen in 7 days |
| C5 | Top client ranking shift | Info | Client moved in/out of top 5 |

### Feature Adoption (4)
| ID | Alert | Severity | Trigger |
|----|-------|----------|---------|
| F1 | Feature usage drop | Warning | Usage decreased >50% WoW |
| F2 | Feature adoption spike | Info | Usage increased >100% WoW |
| F3 | Feature abandonment | Critical | 0 usage for 7+ days (was active) |
| F4 | Feature power user shift | Info | Usage concentrated in fewer clients |

### Engagement Quality (3)
| ID | Alert | Severity | Trigger |
|----|-------|----------|---------|
| E1 | Bounce rate spike | Warning | Bounce rate increased >50% WoW |
| E2 | Session duration crash | Warning | Session duration dropped >40% WoW |
| E3 | Pages per session drop | Info | Pages/session decreased >30% WoW |

### Growth & Traffic (3)
| ID | Alert | Severity | Trigger |
|----|-------|----------|---------|
| G1 | Traffic source anomaly | Warning | Traffic > 2σ deviation |
| G2 | Zero organic traffic | Critical | 0 organic visits in 24h (was active) |
| G3 | New referral source | Info | New referral domain first seen |

---

## 7. Action Items

| # | Action | Priority | Status |
|---|--------|----------|--------|
| 1 | ~~Set up scheduler for DM operational alerts~~ | High | **Done** — GitHub Actions cron (Apr 7) |
| 2 | ~~Daily digest format (persistent vs new)~~ | High | **Done** (Apr 7) |
| 3 | ~~"All clear" message when no alerts~~ | Medium | **Done** (Apr 7) |
| 4 | ~~Slack webhook to Cloud Run~~ | High | **Done** (Apr 7) |
| 5 | ~~Threaded messages via Web API~~ | High | **Done** — Metrics Hub Alerts bot (Apr 7) |
| 6 | ~~On-hold alert with 50/500 thresholds~~ | High | **Done** (Apr 7) |
| 7 | ~~Set up DM business alerts (System B)~~ | High | **Done** — 7 alert rules, `#dm-alerts-cs` (Apr 9) |
| 8 | ~~Create `#dm-alerts-cs` channel~~ | High | **Done** — Channel ID: C0ARQTT6ZRA (Apr 8) |
| 9 | ~~Wire System B into cron + Cloud Run deploy~~ | High | **Done** — GitHub secret + deploy.yml + daily-alerts.yml (Apr 9) |
| 10 | Build GA4 Slack alert endpoint (System C) | Medium | TODO |
| 11 | Create `#analytics-alerts` Slack channel | Medium | TODO |
| 12 | Migrate state persistence to Aurora | Low | Needs CREATE TABLE permission |
| 13 | Review thresholds for Smart Drop volumes | Low | When Smart Drop launches |

---

## 8. Key Files Reference

| Component | File |
|-----------|------|
| Slack client (Web API + webhook) | `src/lib/slack.ts` |
| DM Operational alerts route (System A) | `src/app/api/rapid-response/slack-alerts/route.ts` |
| DM Operational main API | `src/app/api/rapid-response/route.ts` |
| DM Business alerts route (System B) | `src/app/api/dm-conversions/business-alerts/route.ts` |
| DM Business alerts data (shared) | `src/app/api/dm-conversions/get-alerts-data.ts` |
| DM Business main API | `src/app/api/dm-conversions/route.ts` |
| Alert types (DM Operational) | `src/types/rapid-response.ts` |
| Alert types (DM Business) | `src/types/dm-conversions.ts` |
| Daily cron workflow | `.github/workflows/daily-alerts.yml` |
| Deploy workflow (env vars) | `.github/workflows/deploy.yml` |
| Auth guard (cron secret + Firebase) | `src/lib/auth-guard.ts` |
| Aurora client | `src/lib/aurora.ts` |

---

## 9. Lessons Learned

Key issues encountered and resolved during System B launch (April 9, 2026):

1. **Environment variables must be in both GitHub secrets AND deploy.yml.** Adding a GitHub secret alone does nothing — `deploy.yml` must explicitly read it and pass it to Cloud Run via the env-vars YAML file.

2. **API routes must not self-fetch on Cloud Run.** Internal `fetch(${baseUrl}/api/...)` calls fail because the container can't reliably reach itself. Extract shared data logic into a module and import it directly.

3. **Firebase client SDK crashes during Docker build.** `NEXT_PUBLIC_*` env vars aren't available at build time. Guard `initializeApp()` with `if (firebaseConfig.apiKey)` to skip initialization during SSR/static generation.

4. **`workflow_dispatch` fires ALL jobs.** Manual re-triggers of the daily alerts workflow send to all channels. To test a single channel, call the Cloud Run endpoint directly with `curl` and the `x-cron-secret` header.

---

*Last updated: April 9, 2026*
