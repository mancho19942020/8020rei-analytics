# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metrics Hub — analytics dashboard for 8020REI. Next.js 16 (App Router) frontend with a Fastify backend. Uses the **Axis Design System**, Firebase Auth, BigQuery for data, and a widget-based drag-drop workspace (react-grid-layout).

## Commands

```bash
# Frontend dev server (port 4000)
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Backend dev server (port 4001)
cd backend && npm run dev
```

## Architecture

**Frontend (`src/`)** — Next.js App Router with `@/*` path alias to `./src/*`.

- `app/api/metrics/` — API routes per data category (users, events, features, geography, etc.)
- `app/api/engagement-calls/` — Engagement calls CRUD + file upload via Google Drive
- `components/axis/` — Axis Design System primitives (Button, Card, Table, etc.)
- `components/charts/` — Reusable Recharts wrappers (Line, StackedBar, HorizontalBar, Donut)
- `components/dashboard/` — Tab views (UsersTab, ClientsTab, FeaturesTab, etc.) rendered by main page
- `components/workspace/` — Grid-based widget system: `GridWorkspace` manages layout, `Widget` wraps each tile, 48+ widgets in `widgets/`
- `lib/bigquery.ts` + `lib/queries.ts` — BigQuery client and SQL queries for GA4 data
- `lib/firebase/` — Firebase Auth context and config
- `lib/workspace/defaultLayouts.ts` — Widget min/max sizes, default grid positions
- `types/` — Shared frontend types (metrics, widget, workspace, axis, table, product)

**Backend (`backend/`)** — Fastify API (port 4001) with BigQuery and caching services. Routes in `backend/src/routes/`, services in `backend/src/services/`.

**Shared types (`shared-types/`)** — TypeScript types used by both frontend and backend (api, metrics, navigation, widget).

## Key Patterns

### Sticky Header Layout (MANDATORY — Global Rule)

The header and all navigation tab rows are **always fixed at the top** of the viewport. Only the `<main>` content area scrolls. This applies to every tab, every screen size, and every section of the platform.

- Outer container: `h-screen flex flex-col` (NOT `min-h-screen`)
- Inner wrapper: `flex flex-col flex-1 min-h-0`
- Header + all nav bars: `flex-shrink-0`
- Main content: `flex-1 overflow-y-auto` (NOT `min-h-[calc(100vh-Npx)]`)

See the dashboard-builder skill (`SKILL.md`) for the full page structure template.

### Sentence Case for All Titles (MANDATORY — Global Rule)

All UI titles use **sentence case**: only the first word is capitalized. This applies to widget titles, tab labels, alert names, callout headlines, table headers, and any user-facing heading.

- "Key metrics" not "Key Metrics"
- "Is it running?" not "Is It Running?"
- "Critical issues detected" not "Critical Issues Detected"

**Exceptions:** Acronyms stay uppercase (API, PCM, DAU, WAU, MAU, US). Proper nouns stay capitalized (e.g. "Zillow", "Google").

### Styling: Custom CSS over Tailwind

Tailwind color classes (e.g. `bg-neutral-100`, `text-main-500`) **do not work reliably** in this project. Always use the custom CSS classes from `globals.css`:

- `chrome-bg` — header + nav tabs background (white in light, slightly darker than base in dark)
- `light-gray-bg` — scrollable content area background (gray `#f3f4f6` in light, `surface-base` in dark)
- `selected-tab-line` / `selected-tab-contained` — tab selection states
- Widget cards: `bg-surface-base` with `shadow-xs` (hover: `shadow-sm`)

### Light/Dark Mode

- Light: header + nav tabs are white (`chrome-bg`), content area is gray (`light-gray-bg`), cards white
- Dark: header + nav tabs use `--surface-chrome` (#0d1321, slightly darker), content uses `--surface-base` (#111827), no pure black

### Design System Tokens

Only use defined semantic color shades: 50, 100, 300, 500, 700, 900, 950. Use semantic names (`main-700`, `success-500`), not raw colors (`blue-500`).

### Dashboard Builder Skill

Before building any new dashboard tab, widget, or navigation item, read `.claude/skills/dashboard-builder/SKILL.md`. It contains required patterns for widgets (export support, settings, shadows) and corrections learned from prior work.

### Data Consistency Guardian

**MUST run after creating or modifying any DM Campaign metric, widget, or API endpoint.** Read `.claude/skills/data-consistency-guardian/SKILL.md`. It enforces that every metric pulls from the correct source-of-truth table (`dm_property_conversions` for conversions, `rr_*` tables for operational health), uses correct terminology ("Sent" = mail pieces, "Mailed" = unique properties), and has tooltips explaining what each number counts. Run BEFORE presenting DM-related work as complete.

### Widget Development

Widgets live in `src/components/workspace/widgets/`. Each widget receives data via props and must support the standard Widget wrapper. Register new widgets in the widgets `index.ts` and add layout config in `defaultLayouts.ts`.

## Data Sources

- **GA4 via BigQuery**: Project `web-app-production-451214`, dataset `analytics_489035450` (24-48h freshness)
- **Product BigQuery**: Project `bigquery-467404`, dataset `domain`
- **Firebase Auth**: `@8020rei.com` email domain required
- **Google Drive**: Engagement calls file storage

## Environment

- `.env.local` contains all credentials (BigQuery, Firebase, Google Drive)
- GCP auth for local dev: `gcloud auth application-default login`
- `credentials/` directory holds service account key files
- Next.js output mode: `standalone` (for Docker/Cloud Run deployment)

## Deploy Protocol

Pushing to `main` (directly or via merged PR) **automatically deploys** to Cloud Run via GitHub Actions (`.github/workflows/deploy.yml`). No manual deploy step is needed.

If auto-deploy fails, read `.claude/skills/deploy-to-cloud-run/SKILL.md` for the manual fallback protocol.

## Other Skills

- `.claude/skills/deploy-to-cloud-run/` — **Auto-deploy protocol (MUST run after every git push)**
- `.claude/skills/design-system-docs/` — Design system documentation and component patterns
- `.claude/skills/data-consistency-guardian/` — **MUST run after creating or modifying any DM Campaign metric, widget, or API endpoint.** Enforces source-of-truth alignment, terminology consistency, tooltip coverage, and cross-section data integrity.
- `.claude/skills/design-kit-guardian/` — **MUST run after creating or modifying any UI component** (widgets, tabs, charts). Audits Axis Design System compliance: correct component usage, CSS variable tokens, BaseChart wrappers, dark mode. Run BEFORE presenting UI work as complete.
- `.claude/skills/gcp-guardian/` — GCP security best practices

## Documentation

- `Design docs/architecture/` — Technical architecture and strategic plans
- `Design docs/deployment/` — Cloud Run deployment guides
- `Design docs/design-system/` — Design tokens and system specs
- `Design docs/features/` — Feature specs (engagement calls, product tabs, insights)
- `public/design-kit.html` — Interactive design system reference
