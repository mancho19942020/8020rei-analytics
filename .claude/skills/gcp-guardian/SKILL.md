# GCP Guardian - Cost & Safety Agent

> **Purpose:** Prevent costly mistakes and protect data in Google Cloud Platform deployments.
> **Created:** Based on John Berrio's advice - "descuidos en Key o tamaños de servidores podrían costar miles de dólares"

---

## CRITICAL RULES - ALWAYS ENFORCE

### 1. Cloud Run Deployments

**BEFORE deploying to Cloud Run, ALWAYS verify:**

```
| Setting              | Safe Value        | DANGEROUS Values           |
|----------------------|-------------------|----------------------------|
| Memory               | 512 MiB - 1 GiB   | > 2 GiB (expensive)        |
| CPU                  | 1                 | > 2 (expensive)            |
| Min instances        | 0                 | > 0 (always-on = $$$)      |
| Max instances        | 10                | > 50 (runaway costs)       |
| Concurrency          | 80 (default)      | < 10 (needs more instances)|
| GPU                  | NEVER             | Any GPU = very expensive   |
```

**Safe deployment command template:**
```bash
gcloud run deploy SERVICE_NAME \
  --source . \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --allow-unauthenticated \
  --quiet
```

### 2. BigQuery Safety

**NEVER run these without explicit user confirmation:**
- `DELETE FROM` - Deletes data permanently
- `DROP TABLE` - Deletes entire tables
- `DROP DATASET` - Deletes entire datasets
- `TRUNCATE TABLE` - Empties tables
- `UPDATE` without WHERE clause - Modifies all rows

**SAFE operations (read-only):**
- `SELECT` queries
- `SHOW` commands
- `DESCRIBE` commands
- Creating VIEWs (doesn't modify source data)

### 3. Artifact Registry

**Cost watch:**
- Old images accumulate and cost storage
- Recommend cleanup policy: keep only last 5 versions

**Safe cleanup command:**
```bash
# List images older than 30 days (review before deleting)
gcloud artifacts docker images list REPO --filter="updateTime < -P30D"
```

### 4. API Keys & Secrets

**NEVER commit or expose:**
- Service account JSON keys
- `GOOGLE_APPLICATION_CREDENTIALS` content
- Any non-`NEXT_PUBLIC_` environment variables
- Database passwords

**SAFE to commit (public by design):**
- `NEXT_PUBLIC_*` variables (client-side, intentionally public)
- Firebase public config (API key, project ID)

### 5. IAM & Permissions

**DANGEROUS roles - warn before assigning:**
- `roles/owner` - Full control, can delete everything
- `roles/editor` - Can modify/delete most resources
- `roles/bigquery.admin` - Can delete datasets

**SAFER alternatives:**
- `roles/viewer` - Read-only
- `roles/run.developer` - Deploy services only
- `roles/bigquery.dataViewer` - Read data only

---

## Pre-Deployment Checklist

Before ANY deployment, Claude MUST verify:

- [ ] Memory ≤ 1 GiB (unless explicitly justified)
- [ ] CPU = 1 (unless explicitly justified)
- [ ] Min instances = 0 (unless explicitly justified)
- [ ] Max instances ≤ 10 (unless explicitly justified)
- [ ] No GPU attached
- [ ] No secrets in code or environment variables
- [ ] Region is cost-effective (us-central1 recommended)

---

## Cost Alerts Setup (Recommend to User)

Suggest user sets up billing alerts:

```
Hey! To prevent surprise bills, I recommend setting up a budget alert:

1. Go to: https://console.cloud.google.com/billing/budgets?project=web-app-production-451214
2. Click "Create Budget"
3. Set amount: $50/month (or your comfort level)
4. Set alerts at: 50%, 90%, 100%
5. Enable email notifications

This way you'll get warned before costs get out of control.
```

---

## Emergency Cost Control

If costs are spiking:

```bash
# 1. Scale down all Cloud Run services to 0
gcloud run services update SERVICE_NAME --min-instances=0 --max-instances=1 --region=us-central1

# 2. List all running services
gcloud run services list --region=us-central1

# 3. Delete unused services (CAREFUL - confirm with user first)
gcloud run services delete SERVICE_NAME --region=us-central1 --quiet
```

---

## When to Alert the User

Claude should WARN the user when:

1. **Deploying with > 1 GiB memory** - "This will cost more. Are you sure?"
2. **Setting min-instances > 0** - "This means always-on billing. Confirm?"
3. **Any DELETE/DROP command on BigQuery** - "This is permanent. Type the table name to confirm."
4. **Requesting Owner/Editor IAM role** - "This gives full access. Consider a more limited role."
5. **Deploying to non-us-central1 region** - "Other regions may cost more."

---

## Project-Specific Safe Values

**Project:** `web-app-production-451214`

| Resource | Current Safe Config |
|----------|---------------------|
| Cloud Run service | `analytics8020` |
| Region | `us-central1` |
| Memory | `512 MiB` |
| CPU | `1` |
| Min instances | `0` |
| Max instances | `10` (default) |
| BigQuery dataset | `analytics_489035450` (READ-ONLY) |

---

*Last updated: February 11, 2026*
*Guardian advice from: John Berrio (Frontend Lead)*
