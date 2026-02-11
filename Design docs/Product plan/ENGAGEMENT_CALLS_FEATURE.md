# Engagement Calls Feature - Feasibility Assessment

**Created**: February 11, 2026
**Status**: Planning
**Owner**: Product Design Lead

---

## Overview

Create a new "Engagement" chapter/tab in the 8020METRICS HUB dashboard to display qualitative insights from customer engagement calls.

### Background

As the lead product designer, I follow a protocol of joining monthly engagement calls that our success managers have with customers. During these calls, I:

1. Listen and take notes on anything relevant
2. Ask a structured set of questions at the end

### Questions Asked During Calls

- What do they think they're doing in their investing operation?
- What role does our product play today?
- Where do they feel we could support them better?
- What tools or information are they getting from other places that they feel we could help them with?
- **Key Question**: "If our product team worked exclusively for you, what would you want us to fix, improve, or build first?"
- Is there anything they expected the product to be doing by now that isn't happening yet?

### Current Data Storage

- **Location**: Google Drive folder
- **Format**: Word documents (.docx)
- **Contents**:
  - Call transcriptions
  - Summaries
  - Key insights and answers

### Goal

Create a dashboard where:
- These qualitative reports are visible to the broader team
- Patterns and insights can be discovered
- New ideas can emerge from aggregated feedback

---

## Implementation Options

### Option 1: Manual Upload + Display (Simplest)

**Effort**: Low

**How it works**:
- Upload Word files directly to the dashboard
- Parse and display the content in a readable format
- Basic search/filter by date, customer name

**Pros**:
- Quick to build
- No external authentication needed
- Can start immediately

**Cons**:
- Manual upload required each time there are new files
- No automatic sync

---

### Option 2: Google Drive Integration (Automatic Sync)

**Effort**: Medium

**How it works**:
- Connect via Google Drive API
- Automatically detect new files in the designated folder
- Parse Word documents server-side
- Display in a structured dashboard

**Technical Requirements**:
- Google Cloud project + OAuth2 credentials
- Service account or user authentication
- Word parsing library (`mammoth` for .docx)
- Background sync (periodic or on-demand)

**Pros**:
- Automatic updates
- Always up-to-date with Google Drive
- No manual intervention needed

**Cons**:
- OAuth setup complexity
- Needs credentials management
- Requires Google Cloud project

---

### Option 3: AI-Enhanced Analysis (Most Powerful)

**Effort**: Medium-High

**How it works**:
Everything in Option 2, plus:
- Use an LLM (Claude API or OpenAI) to:
  - Extract structured insights from unstructured text
  - Categorize feedback automatically (feature requests, pain points, praise)
  - Identify recurring themes across calls
  - Generate summary cards
  - Track sentiment over time

**Potential Dashboard Widgets**:

| Widget | Description |
|--------|-------------|
| **Calls Overview** | Total calls, customers interviewed, date range |
| **Recent Calls** | Chronological list with customer, date, key takeaway |
| **Insights Feed** | Aggregated insights, categorized by type |
| **Theme Clusters** | Common topics visualized (cards or word cloud) |
| **Feature Requests** | Extracted "what should we build" answers |
| **Pain Points** | Where customers feel unsupported |
| **Competitive Intel** | Tools they're using elsewhere |
| **Search** | Find specific topics across all calls |

**Pros**:
- Automated insight extraction
- Pattern detection across all calls
- Sentiment tracking over time
- Most valuable for team visibility

**Cons**:
- Requires AI API integration (additional cost)
- More complex implementation
- Needs prompt engineering for quality extraction

---

## Recommendation

**Start with Option 2 (Google Drive integration)** and add AI analysis incrementally.

**Rationale**:
1. The core value is making this data accessible to the team
2. Google Drive integration is well-documented and achievable
3. Word document parsing is straightforward
4. AI enhancement can be added later once the foundation works

---

## Technical Feasibility Summary

| Component | Feasible? | Complexity |
|-----------|-----------|------------|
| Google Drive API connection | ✅ Yes | Medium |
| Word document parsing | ✅ Yes | Low |
| Qualitative data display | ✅ Yes | Low |
| Search/filter functionality | ✅ Yes | Low |
| AI-powered insight extraction | ✅ Yes | Medium |
| Theme/pattern detection | ✅ Yes | Medium |
| Real-time sync | ✅ Yes | Medium |

---

## Next Steps (When Ready to Proceed)

1. **Provide sample files**: 2-3 example Word documents (anonymized if needed) to understand the structure
2. **Google Cloud access**: Determine if there's an existing Google Cloud project or create a new one
3. **Choose starting option**: Manual upload (faster MVP) or Google Drive integration (more automated)

---

## Decision Log

| Date | Decision | Notes |
|------|----------|-------|
| Feb 11, 2026 | Initial feasibility documented | Awaiting decision on implementation approach |

---

*This document will be updated as decisions are made and implementation progresses.*
