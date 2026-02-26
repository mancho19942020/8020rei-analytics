# Session Update — 8020 Metrics Hub
## For Juliana — February 26, 2026

> **How to use this file:**
> Copy everything below the horizontal line and paste it into Claude Code (or your AI assistant) at the start of your work session. The AI will pull the latest code and understand exactly what changed.

---

---

Hello! I'm Juliana, a developer on the 8020 Metrics Hub project. Please read this entire message before doing anything else — it will orient you on the latest changes.

## Step 1 — Pull the latest code

```bash
cd /path/to/8020rei-analytics
git pull origin main
git log --oneline -8
```

The most recent commits you should see are:
- `feat: Grafana tab UI polish, faithful skeletons, and engagement calls alignment`
- `feat: add Auto Export sub-tab to Tools navigation` (older)

If `git pull` shows you are already up to date on `main`, you are ready.

---

## Step 2 — What changed (read this carefully)

Two tabs were updated in this session: the **Grafana** tab (a brand-new feature) and the **Engagement Calls** tab (alignment/cleanup). Here is what each one does and how it currently works.

---

### The Grafana Tab (new feature)

**What it is:** A shared directory where any authenticated `@8020rei.com` user can publish a profile listing their Grafana dashboards. Everyone on the team can browse the directory and open dashboards directly.

**Where it lives:** `src/components/dashboard/GrafanaTab.tsx` — rendered as a top-level navigation tab called "Grafana", positioned after "Engagement Calls".

**Data storage:** Firebase Firestore collection `grafana_contributors`. Document ID = Firebase Auth `uid`. Each document has the shape:
```typescript
interface GrafanaContributor {
  id: string;           // uid
  email: string;
  name: string;
  title: string;        // e.g. "Backend Lead"
  dashboards: GrafanaDashboard[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface GrafanaDashboard {
  id: string;           // crypto.randomUUID()
  name: string;
  url: string;
  description?: string;
}
```

**Firestore security rules** are already published: authenticated users can read all documents; each user can only write/delete their own document (matched by uid).

**How the UI is structured:**

*Gallery view (default):*
- Page header: "Grafana dashboards" + "Add your dashboards" / "Edit your dashboards" button
- A vertical list of contributor rows. Each row: [avatar initials circle] [name + title] [dashboard count tag] ["View dashboards" button]
- The edit button only appears in the header, not in individual rows

*Detail view (click "View dashboards"):*
- Back button at the top
- Profile name + title, with "Edit dashboards" button on the right (only if viewing own profile)
- Vertical list of dashboard rows. Each row: [Grafana icon circle] [name + description] ["Open in Grafana" button]

*Add/Edit modal:*
- Fields: Display name, Title / role, Email (read-only), Dashboard name, Grafana URL, Description (optional)
- Can add multiple dashboards with "Add another dashboard"
- In edit mode, there is a **Danger zone** section at the bottom with "Delete my profile" — clicking it shows a confirmation message before deleting

**Component files:**
- `src/components/dashboard/GrafanaTab.tsx` — main tab (gallery + detail views, Firestore read/write/delete)
- `src/components/dashboard/grafana/GrafanaContributorCard.tsx` — horizontal row card
- `src/components/dashboard/grafana/GrafanaDashboardCard.tsx` — horizontal row card for individual dashboards
- `src/components/dashboard/grafana/GrafanaProfileModal.tsx` — add/edit modal with delete
- `src/components/dashboard/grafana/types.ts` — shared types

---

### Engagement Calls Tab (updated)

**What changed:**
- Page title changed from `text-2xl font-bold` "Engagement Call Reports" → `text-xl font-semibold` "Engagement call reports" (sentence case, smaller)
- Removed the document count subtitle that was under the title
- Header margin changed from `mb-8` to `mb-6`
- Upload success/error feedback now uses `AxisCallout type="success"` / `type="error"` instead of hardcoded green/red Tailwind color classes
- Skeleton loader now faithfully mirrors the actual card grid: dashed upload card placeholder + 5 document cards (each with folder badge, 2-line title, 5 preview text lines, and a date footer)
- Fixed three pre-existing lint errors (unused catch variables, function declaration order)

**No logic changes** — only visual/style alignment. All data fetching, Google Drive integration, and document reading work exactly as before.

---

## Step 3 — Design system rules to follow

These are the rules established for all non-widget tabs (Grafana, Engagement Calls, etc.). They are also documented in `.claude/skills/dashboard-builder/SKILL.md`.

**Page title:** Always use `text-xl font-semibold text-content-primary`. Never `text-2xl` or `font-bold` for page-level titles.

**No subtitle under the title.** The header should contain only the title + one action button (if needed). Do not add a description or document count line below the title.

**Header margin:** `mb-6` — not `mb-8` (too much space) or `mb-4` (too tight).

**Header button:** `size="sm"` — not `size="md"`.

**Sentence case everywhere:**
- Page titles: "Grafana dashboards", "Engagement call reports"
- Buttons: "Add your dashboards", "View dashboards", "Edit your dashboards"
- Field labels: "Display name", "Title / role", "Dashboard name"
- Exception: proper nouns keep their casing ("Grafana URL", "Firebase")

**No outer padding on the tab wrapper.** The parent `<main>` in `page.tsx` already applies `px-6 py-4`. If a tab adds its own padding, content becomes double-padded and "flies" from the edges.

**Skeleton loaders must match the real content layout.** Do not use generic `variant="card"` blocks. Build each skeleton row/card to mirror the actual component structure.

---

## Step 4 — Deployment context

**There is no CI/CD.** Pushing to GitHub does NOT update the live site. Deployment is always manual.

The live site is: https://analytics8020-798362859849.us-central1.run.app

To deploy, read `.claude/skills/deploy-to-cloud-run/SKILL.md`. The critical rule: credentials must be piped via stdin to Python (never passed as a shell argument). The skill file has the exact commands.

A full deployment guide is also at `Design docs/deployment/CLOUD_RUN_DEPLOYMENT_GUIDE.md` — written for non-technical readers.

---

## Step 5 — Run the app locally

Open two terminals:

```bash
# Terminal 1 — Frontend (port 4000)
cd 8020rei-analytics
npm run dev

# Terminal 2 — Backend (port 4001)
cd 8020rei-analytics/backend
npm run dev
```

Open http://localhost:4000 and log in with your `@8020rei.com` Google account.

To see the Grafana tab: click "Grafana" in the top navigation. You can create your own profile and add dashboard links.

---

## What you can help me with

Now that you understand the codebase, here are things I might ask you to work on:

- Adding features to the Grafana tab (e.g., sorting, search, real-time updates)
- Building new tabs or widgets following the design system rules above
- Fixing bugs or making visual adjustments
- Working on the Engagement Calls tab or other existing tabs

If you need more context about a specific file, read it before making suggestions. The design system components are in `src/components/axis/` — always use those instead of building custom UI primitives.

---

*This file was generated on February 26, 2026. For setup from scratch (first time), see `Design docs/onboarding/JULIANA_ONBOARDING.md`.*
