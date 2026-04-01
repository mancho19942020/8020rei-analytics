# Deploy to Cloud Run — Auto-Deploy Protocol

## WHEN THIS SKILL ACTIVATES

This skill is **automatically triggered** whenever the user asks to:
- Push code to the remote repository (`git push`)
- Deploy changes
- Update the live/production/remote app
- Any variation of "push this", "push everything", "update remote"

**NOTE**: As of April 2026, pushing to `main` triggers auto-deploy via GitHub Actions (`.github/workflows/deploy.yml`). The manual steps below are a **fallback** in case the GitHub Actions workflow fails. You do NOT need to run these after every push — only when auto-deploy is broken.

---

## DEPLOYMENT STEPS

### 1. Push to GitHub (if not already done)

```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics
git push origin main
```

### 2. Deploy to Cloud Run

```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics
gcloud run deploy analytics8020 \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file /tmp/env-vars.yaml
```

### 3. Before deploying, ALWAYS regenerate the env vars file

The env vars file must be regenerated every time because it uses credentials from `.env.local`. Run this **before** the deploy command:

**IMPORTANT:** Credentials are piped via stdin — do NOT pass them as a shell argument (`"\$VAR"` syntax silently passes the literal string `$VAR` instead of the value, which causes `Invalid credentials` errors in production).

```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics

python3 -c "
import json, sys, os

os.chdir('/Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics')

# --- Read BigQuery Product credentials from .env.local ---
bq_creds = None
with open('.env.local') as f:
    for line in f:
        if line.startswith('GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON='):
            bq_creds = line.split('=', 1)[1].strip()
            break

if not bq_creds:
    print('ERROR: GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON not found in .env.local')
    sys.exit(1)

try:
    j = json.loads(bq_creds)
    print('BigQuery creds valid — type:', j.get('type'), '| project:', j.get('project_id'))
except Exception as e:
    print('ERROR: BigQuery credentials JSON is invalid:', e)
    sys.exit(1)

# --- Read Google Drive credentials from JSON key file ---
drive_creds = None
try:
    with open('credentials/google-drive-key.json') as f:
        drive_creds = f.read().strip()
    j2 = json.loads(drive_creds)
    print('Drive creds valid — type:', j2.get('type'), '| project:', j2.get('project_id'))
except FileNotFoundError:
    print('ERROR: credentials/google-drive-key.json not found')
    sys.exit(1)
except Exception as e:
    print('ERROR: Drive credentials JSON is invalid:', e)
    sys.exit(1)

# --- Read Aurora credentials from .env.local ---
aurora_vars = {}
aurora_keys = ['DB_AURORA_RESOURCE_ARN', 'DB_AURORA_SECRET_ARN', 'DB_AURORA_ACCESS_KEY_ID',
               'DB_AURORA_SECRET_ACCESS_KEY', 'DB_AURORA_DEFAULT_REGION', 'AWS_AURORA_GRAFANA_DB']
with open('.env.local') as f:
    for line in f:
        for key in aurora_keys:
            if line.startswith(key + '='):
                aurora_vars[key] = line.split('=', 1)[1].strip()
if len(aurora_vars) == len(aurora_keys):
    print(f'Aurora creds valid — {len(aurora_vars)} vars loaded')
else:
    print(f'WARNING: Only {len(aurora_vars)}/{len(aurora_keys)} Aurora vars found — Properties API will not work')

# --- Build env vars ---
env_vars = {
    'GOOGLE_CLOUD_PROJECT': 'web-app-production-451214',
    'BIGQUERY_DATASET': 'analytics_489035450',
    'BIGQUERY_PRODUCT_PROJECT': 'bigquery-467404',
    'BIGQUERY_PRODUCT_DATASET': 'domain',
    'GOOGLE_DRIVE_FOLDER_ID': '1y0QT_u6zUIzZowqvqu_HiR4-MveBeFMH',
    'GOOGLE_DRIVE_CREDENTIALS_JSON': drive_creds,
    'GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON': bq_creds,
    **aurora_vars,
}
with open('/tmp/env-vars.yaml', 'w') as f:
    for k, v in env_vars.items():
        escaped = v.replace('\\\\', '\\\\\\\\').replace('\"', '\\\\\"')
        f.write(f'{k}: \"{escaped}\"\n')
print(f'Written {len(env_vars)} env vars to /tmp/env-vars.yaml')
"
```

**Expected output (all three lines must appear before proceeding):**
```
BigQuery creds valid — type: service_account | project: bigquery-467404
Drive creds valid — type: service_account | project: <project-id>
Aurora creds valid — 6 vars loaded
Written 13 env vars to /tmp/env-vars.yaml
```

If you see `ERROR:` or only one line of output, stop — do not deploy. The credentials were not read correctly.

### 4. Verify deployment

After deploy completes, confirm:
- Service URL: https://analytics8020-798362859849.us-central1.run.app
- Tell the user the deployment is live and they can check the URL

---

## ADDING NEW ENV VARS

When a new feature requires new environment variables:

1. Add them to `.env.local` for local development
2. **Also add them to the env vars dictionary in step 3 above** (update this skill file)
3. The deploy step will pick them up automatically

---

## CLOUD RUN SERVICE DETAILS

| Property | Value |
|----------|-------|
| Service name | `analytics8020` |
| Region | `us-central1` |
| Project | `web-app-production-451214` |
| Service account | `798362859849-compute@developer.gserviceaccount.com` |
| Service URL | https://analytics8020-798362859849.us-central1.run.app |
| Auth | Unauthenticated (public) |
| Port | 3000 (set in Dockerfile) |

## DATA SOURCES

| Purpose | Platform | Target | Credential Env Vars |
|---------|----------|--------|-------------------|
| GA4 Analytics | BigQuery | `web-app-production-451214` / `analytics_489035450` | Uses default service account |
| Product/opsHub | BigQuery | `bigquery-467404` / `domain` | `GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON` |
| Properties API Metrics | AWS Aurora | `aurora-services-8020rei` / `grafana8020db` | `DB_AURORA_*` (6 vars) |

---

## TROUBLESHOOTING

### "Access Denied" on BigQuery
- Check that the env vars file includes the correct credentials JSON
- The Product BigQuery project (`bigquery-467404`) requires its own service account key
- The GA4 project uses the Cloud Run default service account

### "Invalid GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON" on the live site
- **Root cause:** The env vars file was generated with the literal string `$PRODUCT_CREDS` instead of the actual JSON value. This happens when credentials are passed as a shell argument with `"\$VAR"` syntax — the `\$` escapes the dollar sign and prevents variable expansion.
- **Fix:** Always use the stdin pipe method (`... | python3 -c "creds = sys.stdin.read()"`). Never pass credentials as `sys.argv[1]`.
- **How to confirm before deploying:** The generation script must print `Credentials valid — type: service_account` before the "Written N env vars" line. If it doesn't, stop and fix before deploying.

### Engagement Calls / Google Drive errors in production
- The Google Drive credentials are passed via `GOOGLE_DRIVE_CREDENTIALS_JSON` env var (not a file path)
- `google-drive.ts` checks for the JSON env var first, then falls back to file path for local dev
- If the Drive credentials are missing, the deploy script will fail with a clear error message

### Deploy fails with YAML parsing error
- The credentials JSON contains special characters — ensure the Python script is used to generate the YAML
- Never pass JSON credentials directly via `--set-env-vars` (gcloud can't parse it)

### Changes not appearing after push
- **This is the #1 issue**: `git push` does NOT trigger deployment
- You must run the `gcloud run deploy` command after every push
