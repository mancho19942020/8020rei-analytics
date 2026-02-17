# Design Documentation

Documentation hub for the 8020REI Analytics Dashboard (Metrics Hub).

---

## Folder Structure

```
Design docs/
├── architecture/        Project guides, architecture, and multi-source vision
├── design-system/       Axis Design System specs, tokens, and agent summary
├── deployment/          Cloud Run deployment guides and infrastructure
├── features/            Feature specs, implementation plans, and backlogs
├── onboarding/          Tutorials and onboarding materials
├── Logo/                Brand assets (SVG)
└── _archive/            Superseded handoff documents (historical reference)
```

---

## Key Documents by Topic

### Architecture & Project Overview
| Document | Description |
|----------|-------------|
| `architecture/COMPLETE_PROJECT_GUIDE.md` | Full project guide: stack, architecture, data flow, deployment |
| `architecture/STRATEGIC_ARCHITECTURE_PLAN.md` | Evolution plan from single-source to multi-source dashboard |
| `architecture/MULTI_SOURCE_METRICS_HUB_ACTION_PLAN.md` | Action plan for multi-source data integration |

### Design System
| Document | Description |
|----------|-------------|
| `design-system/DESIGN_SYSTEM.md` | Axis Design System specification (colors, typography, components) |
| `design-system/DESIGN_TOKENS_REFERENCE.md` | Complete token reference from Tailwind config |
| `design-system/DESIGN_SYSTEM_AGENT_SUMMARY.md` | Agent skill summary for maintaining the design system |

### Deployment & Infrastructure
| Document | Description |
|----------|-------------|
| `deployment/CLOUD_RUN_DEPLOYMENT_GUIDE.md` | Cloud Run deployment with GitHub autodeploy (Spanish) |
| `deployment/MANUAL_DEPLOYMENT_TUTORIAL.md` | Step-by-step Cloud Run deployment via Console |
| `deployment/COMPLETE_INFRASTRUCTURE_GUIDE.md` | Full infrastructure guide (Next.js, GCP, Firebase) |

### Features & Implementation
| Document | Description |
|----------|-------------|
| `features/8020REI_METRICS_PLAN.md` | GA4 metrics plan - 8 dashboard chapters |
| `features/PRODUCT_TAB_IMPLEMENTATION_PLAN.md` | Product tab implementation (Client Domains + Product Projects) |
| `features/PRODUCT_V2_IMPROVEMENTS.md` | **Backlog: Product tab v2 improvements** |
| `features/ENGAGEMENT_CALLS_FEATURE.md` | Engagement Calls feature assessment |
| `features/insights-tab.md` | Insights tab (automated anomaly detection) |
| `features/product-ops-dashboard.md` | Product Ops Dashboard architecture (Spanish) |

### Onboarding
| Document | Description |
|----------|-------------|
| `onboarding/ONBOARDING_TUTORIAL.html` | Interactive HTML onboarding tutorial |
| `onboarding/AGENT_INSTRUCTIONS_ONBOARDING_TUTORIAL.md` | Instructions for generating onboarding content |

### Archive
| Document | Archived Reason |
|----------|-----------------|
| `_archive/HANDOFF_DESIGN_SYSTEM_JAN22_2026.md` | Superseded by `design-system/DESIGN_SYSTEM.md` |
| `_archive/HANDOFF_TECHNICAL_ARCHITECTURE_FEB6_2026.md` | Superseded by `architecture/COMPLETE_PROJECT_GUIDE.md` |
| `_archive/ACTION_PLAN_DEPLOYMENT_PRODUCTION.md` | Superseded by `deployment/` guides |

---

Last Updated: February 17, 2026
