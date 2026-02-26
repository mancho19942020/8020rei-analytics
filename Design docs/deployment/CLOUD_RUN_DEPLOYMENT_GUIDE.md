# Deployment Guide — 8020METRICS HUB

> **Last updated:** February 26, 2026
> **Live URL:** https://analytics8020-798362859849.us-central1.run.app

---

## What Is This Document For?

This guide explains how to deploy new code changes to the live version of the 8020METRICS HUB dashboard. It is written for anyone on the team, regardless of technical background.

**Important thing to understand upfront:**

> Pushing code to GitHub does **NOT** automatically update the live site. GitHub and the live site are two separate things. You have to manually tell the live site to update — that is what "deploying" means.

Think of it like this:
- **GitHub** = the filing cabinet where all versions of the code are stored
- **Cloud Run** = the actual live website that users visit
- **Deploying** = copying the latest code from your computer to Cloud Run and restarting the site

---

## Before You Begin — One-Time Setup

These steps only need to be done once per computer. If you have already deployed from this machine before, skip to [Deploying an Update](#deploying-an-update).

### Check 1: Do you have the `gcloud` CLI installed?

Open your Terminal app and type:

```bash
gcloud --version
```

If you see something like `Google Cloud SDK 500.x.x` — you are ready. Skip to Check 2.

If you see `command not found` — you need to install it:
1. Go to [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2. Download the installer for macOS
3. Follow the installation wizard
4. Restart your Terminal

### Check 2: Are you logged in to Google Cloud?

```bash
gcloud auth list
```

If your `@8020rei.com` email appears with an asterisk (*) next to it — you are logged in. Skip to Check 3.

If you are not logged in:

```bash
gcloud auth login
```

This opens a browser window. Sign in with your `@8020rei.com` Google account.

### Check 3: Is the correct GCP project selected?

```bash
gcloud config get-value project
```

It should show: `web-app-production-451214`

If it shows something different, run:

```bash
gcloud config set project web-app-production-451214
```

---

## Deploying an Update

Every time you want the live site to reflect new code, follow these three steps in order.

---

### Step 1 — Save your code to GitHub

First, push your changes to the GitHub repository. This is the version control step — it keeps a record of everything and lets the team see what changed.

```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics
git push origin main
```

> **Why this is separate from deploying:** GitHub stores your code history. Cloud Run runs the live site. They don't talk to each other automatically — you control when the live site updates.

---

### Step 2 — Generate the environment variables file

The live site needs to know secret values (like database credentials and API keys) to function. These secrets are stored on your computer in a file called `.env.local`. Because this file contains sensitive information, it is never stored in GitHub.

Before each deployment, you must package those secrets into a temporary file that Google Cloud can read. Run this command exactly as written:

```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics

grep "^GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON=" .env.local | cut -d'=' -f2- | python3 -c "
import sys, json

creds = sys.stdin.read().strip()

try:
    j = json.loads(creds)
    print('Credentials valid — type:', j.get('type'), '| project:', j.get('project_id'))
except Exception as e:
    print('ERROR: credentials JSON is invalid:', e)
    sys.exit(1)

env_vars = {
    'GOOGLE_CLOUD_PROJECT': 'web-app-production-451214',
    'BIGQUERY_DATASET': 'analytics_489035450',
    'BIGQUERY_PRODUCT_PROJECT': 'bigquery-467404',
    'BIGQUERY_PRODUCT_DATASET': 'domain',
    'GOOGLE_DRIVE_FOLDER_ID': '1y0QT_u6zUIzZowqvqu_HiR4-MveBeFMH',
    'GOOGLE_DRIVE_CREDENTIALS_PATH': '/app/credentials/google-drive-key.json',
    'GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON': creds
}
with open('/tmp/env-vars.yaml', 'w') as f:
    for k, v in env_vars.items():
        escaped = v.replace('\\\\', '\\\\\\\\').replace('\"', '\\\\\"')
        f.write(f'{k}: \"{escaped}\"\n')
print(f'Written {len(env_vars)} env vars to /tmp/env-vars.yaml')
"
```

**Expected output — both lines must appear:**
```
Credentials valid — type: service_account | project: bigquery-467404
Written 7 env vars to /tmp/env-vars.yaml
```

If you see `ERROR:` or only one line, **stop — do not deploy**. Check that `.env.local` exists and contains a valid `GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON` value.

> **Note:** The file created at `/tmp/env-vars.yaml` is temporary. It gets erased when your computer restarts, which is why you must run this step before every deployment.

---

### Step 3 — Deploy to Cloud Run

This is the step that actually updates the live site. Run:

```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics

gcloud run deploy analytics8020 \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file /tmp/env-vars.yaml
```

**What happens next:**

- Google Cloud reads your local source code and uploads it (you may see an upload progress bar)
- It builds the app into a deployable container — this is the slow part, takes **3–5 minutes**
- It replaces the live version with the new one — no downtime, users never see an outage
- You'll see a success message with the live URL at the end

**Expected success output:**
```
✓ Building and deploying new revision...
✓ Routing traffic...
Done.
Service [analytics8020] revision [...] has been deployed and is serving 100 percent of traffic.
Service URL: https://analytics8020-798362859849.us-central1.run.app
```

**Verify it worked:** Open the URL shown and confirm the app loads correctly.

---

## Quick Reference — The 3 Commands

For experienced users, here are the three commands back-to-back:

```bash
# Step 1: Push to GitHub
git push origin main

# Step 2: Generate env vars (run from project root)
PRODUCT_CREDS=$(grep "^GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON=" .env.local | cut -d'=' -f2-) && python3 -c "
import json, sys
creds = sys.argv[1]
env_vars = {'GOOGLE_CLOUD_PROJECT':'web-app-production-451214','BIGQUERY_DATASET':'analytics_489035450','BIGQUERY_PRODUCT_PROJECT':'bigquery-467404','BIGQUERY_PRODUCT_DATASET':'domain','GOOGLE_DRIVE_FOLDER_ID':'1y0QT_u6zUIzZowqvqu_HiR4-MveBeFMH','GOOGLE_DRIVE_CREDENTIALS_PATH':'/app/credentials/google-drive-key.json','GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON':creds}
open('/tmp/env-vars.yaml','w').write('\n'.join(f'{k}: \"{v.replace(chr(92),chr(92)*2).replace(chr(34),chr(92)+chr(34))}\"' for k,v in env_vars.items()))
print('Done')
" "\$PRODUCT_CREDS"

# Step 3: Deploy
gcloud run deploy analytics8020 --source . --region us-central1 --allow-unauthenticated --env-vars-file /tmp/env-vars.yaml
```

---

## Troubleshooting

### "The site looks the same after deploying"

The deployment may still be in progress. Wait 5 minutes and hard-refresh the browser (`Cmd + Shift + R` on Mac).

Also double-check that Step 3 completed with the success message. If the deploy command showed an error, the old version is still live.

### "Permission denied" error during deploy

Your Google Cloud account may not have the right permissions. Contact the team lead to confirm your account has `Cloud Run Developer` and `Cloud Build Editor` roles in project `web-app-production-451214`.

You can also try re-authenticating:
```bash
gcloud auth login
gcloud config set project web-app-production-451214
```

### "Cannot find .env.local" or Step 2 produces empty output

The `.env.local` file must exist in the project root. This file is not stored in GitHub (intentionally — it contains secrets). If it is missing from your computer, you need to get a copy from someone who has it.

### Firebase Auth error on the live site after deploy

If users see an authentication error after a deploy, the live URL may not be in Firebase's allowed list:

1. Go to [Firebase Console](https://console.firebase.google.com) → project `rei-analytics-b4b8b`
2. Authentication → Settings → Authorized domains
3. Confirm `analytics8020-798362859849.us-central1.run.app` is in the list
4. If it is missing, click **Add domain** and add it

### Deploy fails with YAML parsing error

The credentials JSON contains special characters that can break the YAML format. Always use the Python script in Step 2 — never copy-paste the credentials JSON manually into the `gcloud` command.

---

## Service Details (For Reference)

| Property | Value |
|----------|-------|
| Service name | `analytics8020` |
| Live URL | https://analytics8020-798362859849.us-central1.run.app |
| GCP Project | `web-app-production-451214` |
| Region | `us-central1` |
| GitHub Repository | https://github.com/mancho19942020/8020rei-analytics |
| Firebase Project | `rei-analytics-b4b8b` |

---

## Environment Variables Summary

These are the variables deployed to Cloud Run with every deployment. All values come from `.env.local`.

| Variable | What It Does |
|----------|-------------|
| `GOOGLE_CLOUD_PROJECT` | GCP project for BigQuery (GA4 analytics data) |
| `BIGQUERY_DATASET` | GA4 analytics dataset ID |
| `BIGQUERY_PRODUCT_PROJECT` | Separate GCP project for product/opsHub data |
| `BIGQUERY_PRODUCT_DATASET` | Product dataset ID |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive folder for Engagement Calls files |
| `GOOGLE_DRIVE_CREDENTIALS_PATH` | Path to the Drive service account key inside the container |
| `GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON` | Service account key JSON for the product BigQuery project |

---

*Last updated: February 26, 2026*
