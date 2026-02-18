# Deploy to Cloud Run — Auto-Deploy Protocol

## WHEN THIS SKILL ACTIVATES

This skill is **automatically triggered** whenever the user asks to:
- Push code to the remote repository (`git push`)
- Deploy changes
- Update the live/production/remote app
- Any variation of "push this", "push everything", "update remote"

**CRITICAL**: After every `git push`, you MUST also deploy to Cloud Run. Pushing to GitHub does NOT auto-deploy. There is no CI/CD pipeline — deployment is manual via `gcloud`.

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

```bash
cd /Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics

PRODUCT_CREDS=$(grep "^GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON=" .env.local | cut -d'=' -f2-)

python3 -c "
import json, sys
creds = sys.argv[1]
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
" "\$PRODUCT_CREDS"
```

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

## BIGQUERY PROJECTS

| Purpose | GCP Project | Dataset | Credential Env Var |
|---------|-------------|---------|-------------------|
| GA4 Analytics | `web-app-production-451214` | `analytics_489035450` | Uses default service account |
| Product/opsHub | `bigquery-467404` | `domain` | `GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON` |

---

## TROUBLESHOOTING

### "Access Denied" on BigQuery
- Check that the env vars file includes the correct credentials JSON
- The Product BigQuery project (`bigquery-467404`) requires its own service account key
- The GA4 project uses the Cloud Run default service account

### Deploy fails with YAML parsing error
- The credentials JSON contains special characters — ensure the Python script is used to generate the YAML
- Never pass JSON credentials directly via `--set-env-vars` (gcloud can't parse it)

### Changes not appearing after push
- **This is the #1 issue**: `git push` does NOT trigger deployment
- You must run the `gcloud run deploy` command after every push
