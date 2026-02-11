# 8020METRICS HUB

A comprehensive analytics and operations dashboard for 8020REI. Built with Next.js 16, TypeScript, and the Axis Design System. Features multi-source data integration, Firebase Authentication, and a modular widget-based architecture.

**Version:** 2.0.0 | **Stack:** Next.js 16 + Fastify Backend | **License:** MIT

---

## What is This?

8020METRICS HUB is the central dashboard for monitoring all 8020REI operations:

- **Analytics** - Google Analytics 4 data for 8020REI and 8020Roofing platforms
- **Salesforce** - CRM integrations, leads funnel, delivery tracking (coming soon)
- **Data Silos** - SILO scraping, Zillow market data (coming soon)
- **Tools** - Skip Trace, Rapid Response, Smart Drop (coming soon)
- **Pipelines** - ETL job monitoring, data processing status (coming soon)
- **QA** - Axiom validation, BuyBox verification, test results (coming soon)
- **ML Models** - Deal scoring, model performance, drift detection (coming soon)

---

## Project Structure

```
8020rei-analytics/
│
├── src/                    ← FRONTEND (what users see in browser)
│   ├── app/                   Pages and current API routes
│   ├── components/            UI components (Axis Design System)
│   ├── lib/                   Data fetching utilities
│   └── types/                 TypeScript definitions
│
├── backend/                ← BACKEND API (data processing hub)
│   └── src/
│       ├── routes/            API endpoints for each data source
│       ├── services/          Connections to BigQuery, Salesforce, etc.
│       └── config/            Environment configuration
│
├── shared-types/           ← SHARED (used by both frontend & backend)
│   └── src/                   Common TypeScript types
│
├── public/                 ← STATIC FILES
│   └── design-kit.html        Design system documentation
│
└── Design docs/            ← PLANNING & DOCUMENTATION
    └── Product plan/          Architecture plans, roadmaps
```

### How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend     │     │  Data Sources   │
│    (src/)       │ ──► │   (backend/)    │ ──► │                 │
│                 │     │                 │     │  • BigQuery     │
│  • Dashboard    │     │  • API Routes   │     │  • Salesforce   │
│  • Charts       │     │  • Caching      │     │  • AWS          │
│  • Widgets      │     │  • Auth         │     │  • Skip Trace   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Google Cloud account with BigQuery access
- Firebase project with Authentication enabled
- `@8020rei.com` email address for login

### Installation

```bash
# Clone and install
git clone https://github.com/8020rei/8020rei-analytics.git
cd 8020rei-analytics
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Authenticate with Google Cloud (for local development)
gcloud auth application-default login

# Start the frontend (port 4000)
npm run dev -- -p 4000
```

### Starting the Backend (Optional)

```bash
cd backend
npm install
npm run dev
# Backend runs on port 4001
```

---

## Navigation Structure

The dashboard uses a 3-level navigation system:

### Level 1: Main Sections
| Section | Status | Description |
|---------|--------|-------------|
| Analytics | Active | Google Analytics 4 data |
| Salesforce | Coming Soon | CRM and integrations |
| Data Silos | Coming Soon | External data (SILO, Zillow) |
| Tools | Coming Soon | Skip Trace, Direct Mail |
| Pipelines | Coming Soon | ETL job monitoring |
| QA | Coming Soon | Data quality checks |
| ML Models | Coming Soon | Model performance |

### Level 2: Sub-sections (varies by section)
Example for Analytics:
- 8020REI GA4 (active)
- 8020Roofing GA4 (coming soon)

### Level 3: Detail Tabs (for GA4 sections)
Overview | Users | Features | Clients | Traffic | Technology | Geography | Events | Insights

---

## Data Sources

### Currently Active

#### Google Analytics 4 (via BigQuery)
- **Project:** `web-app-production-451214`
- **Dataset:** `analytics_489035450`
- **Data Freshness:** 24-48 hours (GA4 limitation)
- **Authentication:** Service account or gcloud CLI

**Required Permissions:**
- BigQuery Data Viewer
- BigQuery Job User

### Future Integrations

| Data Source | Contact | Status |
|-------------|---------|--------|
| Salesforce | Job, Ignacio, Johan | Planned |
| AWS (Aurora/Athena) | Diego | Planned |
| Skip Trace (Batch Elites) | Johan | Planned |
| Skip Trace (Direct Skip) | Johan | Planned |
| Back Office (QA) | Johan, Nicolas | Planned |
| ML Models | Eduardo | Planned |

---

## Development

### Commands

```bash
# Frontend
npm run dev -- -p 4000    # Start dev server on port 4000
npm run build             # Production build
npm run lint              # Run linter

# Backend
cd backend
npm run dev               # Start backend on port 4001
npm run build             # Build for production
```

### Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main dashboard page with navigation |
| `src/lib/queries.ts` | BigQuery SQL queries |
| `src/components/axis/` | Design system components |
| `backend/src/services/` | Data source connections |
| `.claude/skills/dashboard-builder/SKILL.md` | Dashboard building guide |

---

## Design System

This project uses the **Axis Design System**. Key principles:

- **Semantic Tokens:** Use `main-700`, `success-500` (not `blue-500`)
- **Dark Mode:** All components support light/dark themes
- **Accessibility:** WCAG AA compliant

**Documentation:** Open the dashboard and click "Design Kit" in the header, or view `/public/design-kit.html`

---

## Documentation

| Document | Location | Description |
|----------|----------|-------------|
| Design Kit | `public/design-kit.html` | Component library & usage |
| Dashboard Builder | `.claude/skills/dashboard-builder/SKILL.md` | How to build new tabs |
| Strategic Plan | `Design docs/Product plan/STRATEGIC_ARCHITECTURE_PLAN.md` | Architecture & roadmap |
| Product Requirements | `Design docs/Product plan/product-ops-dashboard.md` | Full requirements |

---

## Contributing

When adding new features:

1. **New Data Source:** Add service in `backend/src/services/`, routes in `backend/src/routes/`
2. **New Dashboard Tab:** Follow patterns in `.claude/skills/dashboard-builder/SKILL.md`
3. **New Widget:** Add to `src/components/workspace/widgets/`

---

**Built with care by the 8020REI team**
