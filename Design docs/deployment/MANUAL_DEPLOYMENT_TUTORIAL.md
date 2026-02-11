# Manual Deployment Tutorial - Google Cloud Console

> **Goal:** Deploy the analytics dashboard to Cloud Run using ONLY the Google Cloud Console (no CLI)
> **Time:** ~15 minutes
> **Prerequisite:** Owner or Editor access to the GCP project

---

## Overview: What We're Doing

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   GitHub    │ ──▶  │ Cloud Build │ ──▶  │  Artifact   │ ──▶  │  Cloud Run  │
│ (your code) │      │ (builds it) │      │  Registry   │      │ (runs it)   │
└─────────────┘      └─────────────┘      │ (stores it) │      └─────────────┘
                                          └─────────────┘
```

**In simple terms:**
1. Your code lives in GitHub
2. Cloud Build reads your Dockerfile and builds a container image
3. The image is stored in Artifact Registry
4. Cloud Run runs that image and gives you a URL

---

## STEP 1: Open Cloud Run Console

1. Go to: **https://console.cloud.google.com/run?project=web-app-production-451214**
2. Make sure you see "Web app production" at the top (correct project)
3. Click the blue **"Create Service"** button

---

## STEP 2: Choose Deployment Source

You'll see 3 options:

| Option | Icon | Description |
|--------|------|-------------|
| **Artifact Registry / Docker Hub** | 📦 | Deploy from an existing image |
| **GitHub** | 🐙 | Build from your repo (what we want!) |
| **Function** | ƒ | For simple functions |

**Select: GitHub** → "Continuously deploy from a repository"

---

## STEP 3: Choose Build Method

Below the source options, you'll see:

- ◉ **Cloud Build** - Can deploy from GitHub repositories
- ○ **Developer Connect** (Preview) - Newer option

**Select: Cloud Build**

Then click the blue button: **"Set up with Cloud Build"**

---

## STEP 4: Connect Your GitHub Repository

A side panel will open. **If it's blank, wait 5-10 seconds** - it's loading.

### 4.1 - Authenticate with GitHub
- Click "Authenticate" or "Connect"
- A popup will ask you to authorize Google Cloud
- Click "Authorize Google Cloud Build"

### 4.2 - Select Repository
- Choose repository: `mancho19942020/8020rei-analytics`
- If you don't see it, click "Add repository" and install the GitHub app

### 4.3 - Configure Build
| Setting | Value |
|---------|-------|
| Branch | `^main$` (or just `main`) |
| Build Type | **Dockerfile** |
| Source location | `/Dockerfile` (leave default) |

Click **"Save"**

---

## STEP 5: Configure Service Settings

Back on the main page, fill in:

### Service Name & Region
| Field | Value | Why |
|-------|-------|-----|
| Service name | `analytics8020` | Your choice, lowercase, no spaces |
| Region | `us-central1 (Iowa)` | Cheapest, closest to BigQuery data |

### CPU & Memory (Click "Container, Networking, Security" to expand)

| Setting | Value | Why |
|---------|-------|-----|
| Memory | `512 MiB` | Enough for Next.js, not expensive |
| CPU | `1` | Default, sufficient |
| Container port | `3000` | Next.js default port |

---

## STEP 6: Add Environment Variables

Still in the expanded section, find **"Variables & Secrets"** tab:

Click **"+ Add Variable"** twice and add:

| Name | Value |
|------|-------|
| `GOOGLE_CLOUD_PROJECT` | `web-app-production-451214` |
| `BIGQUERY_DATASET` | `analytics_489035450` |

---

## STEP 7: Configure Scaling (IMPORTANT FOR COSTS!)

Find the **"Service scaling"** section:

| Setting | Value | Why |
|---------|-------|-----|
| Auto scaling | ✅ Selected | |
| Minimum instances | `0` | **CRITICAL** - Scales to zero = no cost when idle |
| Maximum instances | `10` | Prevents runaway costs |

⚠️ **John's Warning:** If min instances > 0, you pay 24/7 even with no traffic!

---

## STEP 8: Configure Authentication & Ingress

### Authentication
| Option | Description | Select |
|--------|-------------|--------|
| **Allow unauthenticated invocations** | Anyone with URL can access | ✅ Yes |
| Require authentication | Only GCP users can access | No |

We select "Allow unauthenticated" because our app has its own Firebase login.

### Ingress
| Option | Description | Select |
|--------|-------------|--------|
| **All** | Traffic from internet | ✅ Yes |
| Internal | Only from within GCP | No |
| Internal + Load Balancer | With external LB | No |

---

## STEP 9: Review & Create

Before clicking Create, verify this checklist:

```
✅ Source: GitHub - mancho19942020/8020rei-analytics
✅ Branch: main
✅ Build Type: Dockerfile
✅ Region: us-central1
✅ Memory: 512 MiB
✅ CPU: 1
✅ Min instances: 0 (IMPORTANT!)
✅ Max instances: 10
✅ Authentication: Allow unauthenticated
✅ Ingress: All
✅ Environment variables: GOOGLE_CLOUD_PROJECT, BIGQUERY_DATASET
```

Click the blue **"Create"** button!

---

## STEP 10: Wait for Build (~5 minutes)

You'll see a progress screen:

```
Building... ████████░░░░░░░░
```

**What's happening:**
1. Cloud Build clones your GitHub repo
2. Reads the Dockerfile
3. Runs `npm ci` and `npm run build`
4. Creates a container image
5. Pushes to Artifact Registry
6. Deploys to Cloud Run

---

## STEP 11: Get Your URL

Once complete, you'll see:

```
✅ Service analytics8020 deployed successfully

URL: https://analytics8020-798362859849.us-central1.run.app
```

Click the URL to test!

---

## STEP 12: Add Firebase Authorized Domain

If you see a Firebase auth error:

1. Go to: **https://console.firebase.google.com/project/rei-analytics-b4b8b/authentication/settings**
2. Scroll to **"Authorized domains"**
3. Click **"Add domain"**
4. Paste: `analytics8020-798362859849.us-central1.run.app`
5. Click **"Add"**

Now login should work!

---

## What You Just Learned

| Concept | What It Does |
|---------|--------------|
| **Cloud Run** | Runs your container, scales automatically |
| **Cloud Build** | Builds your code into a container |
| **Artifact Registry** | Stores your container images |
| **Dockerfile** | Instructions to build your app |
| **Continuous Deployment** | Auto-deploys when you push to GitHub |

---

## Bonus: Test Auto-Deploy

Now that it's set up, try this:

1. Make a small change to your code (e.g., change a title)
2. Push to GitHub: `git push origin main`
3. Watch Cloud Build automatically rebuild
4. New version appears in ~3-5 minutes!

To see builds: https://console.cloud.google.com/cloud-build/builds?project=web-app-production-451214

---

## Troubleshooting

### "Set up with Cloud Build" panel is blank
- Wait 10 seconds, it might be loading
- Try refreshing the page
- Try a different browser or incognito mode
- Check you have Cloud Build API enabled

### Build fails with "Firebase API key" error
- The fallback values are already in the code (we fixed this)
- If it happens, check `src/lib/firebase/config.ts` has the fallback values

### Login doesn't work
- Add the Cloud Run domain to Firebase authorized domains
- Check the domain is exactly right (no typos)

### Service costs too much
- Check min instances = 0
- Check max instances ≤ 10
- Delete unused services

---

## Cost Summary

With these settings, your costs should be:

| Scenario | Estimated Cost |
|----------|----------------|
| No traffic | $0/month (scales to zero) |
| Light usage (team testing) | $0-5/month |
| Heavy usage | $10-30/month |

Cloud Run has a generous free tier: 2 million requests/month free!

---

*Created: February 11, 2026*
*For: Germán Alvarez - Learning GCP deployment*
