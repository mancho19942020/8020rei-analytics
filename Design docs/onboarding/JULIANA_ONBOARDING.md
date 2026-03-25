# 8020 Lens — Developer Onboarding Guide
## For: Juliana (juliana@8020rei.com)

> **Note for AI assistant:** This document is designed to be pasted into Claude or any AI assistant. Follow the steps in order. Each step includes the exact commands to run. Ask the user to confirm after each major section before moving on.

---

## What This Project Is

**8020 Lens** is an internal analytics dashboard for 8020REI. It shows Google Analytics 4 data, product usage metrics, user behavior, and engagement data.

- **Frontend:** Next.js 14 (App Router) — runs on port 4000 locally
- **Backend:** Fastify API — runs on port 4001 locally
- **Auth:** Firebase (requires `@8020rei.com` Google account)
- **Data:** BigQuery (two GCP projects — see below)
- **Live app:** https://analytics8020-798362859849.us-central1.run.app

---

## Step 0 — Pull the Latest Code First

**IMPORTANT:** Before doing anything, make sure you have the latest code. A lot of changes were pushed recently.

```bash
cd /path/to/8020rei-analytics
git pull origin main
```

Confirm you are on the `main` branch and up to date:
```bash
git status
git log --oneline -5
```

---

## Step 1 — Prerequisites

Make sure you have installed:

- **Node.js 20+** — check with `node --version`
- **npm** — check with `npm --version`
- **Google Cloud CLI (gcloud)** — install from https://cloud.google.com/sdk/docs/install

---

## Step 2 — Authenticate with Google Cloud

Your GCP account (`juliana@8020rei.com`) has already been granted the following permissions:
- `roles/bigquery.jobUser` on projects `web-app-production-451214` and `bigquery-467404`
- `roles/bigquery.dataViewer` on both projects (covers GA4 and Product datasets)

Run this to authenticate locally:

```bash
gcloud auth login
# A browser window will open — sign in with juliana@8020rei.com

gcloud auth application-default login
# Do this too — it's what the app uses to query BigQuery
# Sign in with juliana@8020rei.com again
```

Set the default project:
```bash
gcloud config set project web-app-production-451214
```

Verify it works:
```bash
gcloud auth list
# Should show juliana@8020rei.com as active account
```

---

## Step 3 — Get the `.env.local` File

The `.env.local` file is **not in the repository** (it contains secrets). You need to get it from the team lead (German).

It must contain the following variables:

```
GOOGLE_CLOUD_PROJECT=web-app-production-451214
BIGQUERY_DATASET=analytics_489035450
BIGQUERY_PRODUCT_PROJECT=bigquery-467404
BIGQUERY_PRODUCT_DATASET=domain
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
GOOGLE_DRIVE_CREDENTIALS_PATH=...
GOOGLE_DRIVE_FOLDER_ID=...
GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON=...
```

Place the file at the root of the repository:
```
8020rei-analytics/.env.local
```

> **Note for AI assistant:** Do NOT try to generate or guess these values. Ask Juliana to get the `.env.local` file from German (the team lead) via a secure channel (e.g., direct message, 1Password, or similar).

---

## Step 4 — Install Dependencies

```bash
# Frontend dependencies
cd 8020rei-analytics
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

---

## Step 5 — Run the App Locally

Open **two terminal windows**:

**Terminal 1 — Frontend (port 4000):**
```bash
cd 8020rei-analytics
npm run dev
```

**Terminal 2 — Backend (port 4001):**
```bash
cd 8020rei-analytics/backend
npm run dev
```

Then open: http://localhost:4000

Log in with your `@8020rei.com` Google account via Firebase Auth.

---

## Step 6 — Verify BigQuery Access

Once the app is running and you're logged in, navigate to any data tab (e.g., Users, Clients). If data loads, your BigQuery access is working.

If you see errors, run this to verify your credentials manually:

```bash
gcloud auth application-default print-access-token
# Should return a token, not an error
```

---

## Architecture Overview (for AI context)

```
src/
  app/
    api/metrics/       ← Next.js API routes (server-side BigQuery calls)
    (dashboard)/       ← Main dashboard pages
  components/
    axis/              ← Design system primitives
    charts/            ← Recharts wrappers
    dashboard/         ← Tab views (Users, Clients, Features, etc.)
    workspace/         ← Drag-drop widget grid system
  lib/
    bigquery.ts        ← BigQuery client
    queries.ts         ← SQL queries for GA4
    firebase/          ← Firebase Auth context

backend/
  src/
    routes/            ← Fastify routes
    services/          ← BigQuery + caching services
```

**Data sources:**
- **GA4 BigQuery:** project `web-app-production-451214`, dataset `analytics_489035450`
- **Product BigQuery:** project `bigquery-467404`, dataset `domain`
- **Auth:** Firebase, restricted to `@8020rei.com` domain

---

## Key Rules to Know

1. **Do NOT use Tailwind color classes** like `bg-neutral-100` — they don't work reliably. Use custom CSS classes from `globals.css` instead (e.g., `light-gray-bg`, `bg-surface-base`).
2. **Design system tokens:** Only use defined semantic shades: 50, 100, 300, 500, 700, 900, 950.
3. **Before building any new dashboard widget or tab**, read `.claude/skills/dashboard-builder/SKILL.md`.
4. **There is no CI/CD.** Pushing to GitHub does NOT deploy to Cloud Run. Deployment is always manual via `gcloud run deploy`.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Application Default Credentials not found` | Run `gcloud auth application-default login` |
| BigQuery permission denied | Confirm you're signed in as `juliana@8020rei.com` and ran `gcloud auth application-default login` |
| Firebase login fails | Make sure you're using your `@8020rei.com` Google account |
| App won't start | Make sure `.env.local` exists at the repo root |
| Port already in use | Frontend uses 4000, backend uses 4001 — kill any processes on those ports |

---

*Last updated: February 2026 — Contact German for access issues*
