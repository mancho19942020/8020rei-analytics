# Design Documentation

This folder contains the primary design and planning documentation for the 8020REI Analytics Hub.

## Active Documents

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| **COMPLETE_PROJECT_GUIDE.md** | Comprehensive guide describing the current implementation, architecture, and how everything works | Feb 9, 2026 |
| **MULTI_SOURCE_METRICS_HUB_ACTION_PLAN.md** | Future vision and action plan for evolving the platform into a multi-source metrics hub | Feb 10, 2026 |

## Document Overview

### COMPLETE_PROJECT_GUIDE.md
**What it covers:**
- Current state of the project (what works now)
- Complete technology stack (Next.js, BigQuery, Firebase, Axis Design System)
- System architecture and data flow
- Component architecture
- Development setup and deployment guide
- Troubleshooting guide
- Future enhancements

**Use this when:**
- Onboarding new developers
- Understanding how the current system works
- Looking up implementation details
- Troubleshooting issues
- Planning incremental improvements

### MULTI_SOURCE_METRICS_HUB_ACTION_PLAN.md
**What it covers:**
- Vision for multi-source data integration
- Proposed architecture for data source abstraction
- Implementation phases (6-7 weeks)
- Code examples for adapters (BigQuery, Salesforce, PostgreSQL)
- Migration strategy
- Future data source possibilities

**Use this when:**
- Planning the evolution to multi-source support
- Adding a new data source connector
- Understanding the abstraction layer design
- Estimating development effort
- Evaluating which data sources to integrate first

---

## Archive

The `_archive/` folder contains older handoff documents and action plans that have been superseded by the active documents above. They are kept for historical reference.

| Archived Document | Date | Reason |
|-------------------|------|--------|
| ACTION_PLAN_DEPLOYMENT_PRODUCTION.md | Feb 9, 2026 | Deployment steps now covered in COMPLETE_PROJECT_GUIDE.md |
| HANDOFF_DESIGN_SYSTEM_JAN22_2026.md | Jan 22, 2026 | Design system info now in COMPLETE_PROJECT_GUIDE.md |
| HANDOFF_TECHNICAL_ARCHITECTURE_FEB6_2026.md | Feb 6, 2026 | Architecture details now in COMPLETE_PROJECT_GUIDE.md |

---

## Quick Navigation

**I want to understand the current platform:**
→ Read `COMPLETE_PROJECT_GUIDE.md` (sections 1-8)

**I need to set up the development environment:**
→ Read `COMPLETE_PROJECT_GUIDE.md` (section 12: Development Setup)

**I want to deploy to production:**
→ Read `COMPLETE_PROJECT_GUIDE.md` (section 16: Deployment Architecture)

**I need to add a new metric to the dashboard:**
→ Read `COMPLETE_PROJECT_GUIDE.md` (section 18: Development Workflow → Adding a New Metric)

**I want to understand the multi-source vision:**
→ Read `MULTI_SOURCE_METRICS_HUB_ACTION_PLAN.md` (section 2: Proposed Architecture)

**I'm ready to implement multi-source support:**
→ Read `MULTI_SOURCE_METRICS_HUB_ACTION_PLAN.md` (section 4: Implementation Phases)

**I want to add a new data source (Salesforce, HubSpot, etc.):**
→ Read `MULTI_SOURCE_METRICS_HUB_ACTION_PLAN.md` (sections 3 & 6: Abstraction Design & Examples)

---

Last Updated: February 10, 2026
