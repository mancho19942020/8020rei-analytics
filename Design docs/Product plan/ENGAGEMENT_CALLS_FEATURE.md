# Engagement Calls Feature - Feasibility Assessment

**Created**: February 11, 2026
**Updated**: February 13, 2026
**Status**: In Progress - Core Feature Complete, Enhancements Pending
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

- **Location**: Google Drive folder (with subfolders per report period)
- **Format**: Word documents (.docx) AND Google Docs (native)
- **Structure**: Each report lives in its own folder (e.g., "01 05-09 jan", "02 12-16 jan")
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

## Chosen Approach: Option 2 (Google Drive Integration)

**Decision Date**: February 13, 2026

Google Cloud setup has been completed:
- [x] Service Account created
- [x] JSON key file downloaded
- [x] Google Drive folder shared with service account
- [x] Credentials configured in project (`credentials/google-drive-key.json`)
- [x] Environment variables set (`GOOGLE_DRIVE_CREDENTIALS_PATH`, `GOOGLE_DRIVE_FOLDER_ID`)
- [x] Implementation started (Phase 1 complete)

---

## UI Specifications

### Navigation

- Add **"Engagement Calls"** as the last tab in the main navigation (after ML Models)
- Icon: Phone or chat bubble icon

### View 1: Cards View (Landing Page)

When clicking "Engagement Calls", users see a grid of preview cards:

| Element | Description |
|---------|-------------|
| Layout | Grid of cards (responsive: 3-4 columns on desktop, 1-2 on mobile) |
| Card content | Title, date, customer name, category (folder), preview snippet |
| Interaction | Click card to open document reader |
| Grouping | Documents grouped or filterable by folder (4 categories) |

### View 2: Document Reader (Notion-Style)

When clicking a card, users enter a focused reading view:

| Element | Description |
|---------|-------------|
| **Layout** | Centered content with max-width (~700-800px) on large screens |
| **Responsive** | Full-width on mobile/tablet, centered on desktop |
| **Header** | Document title (large), metadata (customer, date, category) |
| **Typography** | Clean hierarchy - H1, H2, paragraphs, lists, quotes |
| **Navigation** | Back button to return to cards view |

**Design Reference**: Notion document style
- Content is NOT full-width on large screens (maintains readable line length)
- Comfortable spacing between sections
- Images/diagrams centered within the content area

---

## Action Plan

### Phase 1: Backend Foundation - COMPLETE

| Step | Task | Status |
|------|------|--------|
| 1.1 | Set up Google Drive API integration in the project | Done |
| 1.2 | Securely store JSON credentials (environment variables) | Done |
| 1.3 | Create API endpoint to list all documents (folder + subfolders) | Done |
| 1.4 | Create API endpoint to fetch and parse documents | Done |
| 1.5 | Support both Word documents AND Google Docs | Done |
| 1.6 | Test with actual folder to confirm document reading works | Done |

### Phase 2: Frontend - Navigation & Cards View - COMPLETE

| Step | Task | Status |
|------|------|--------|
| 2.1 | Add "Engagement Calls" tab to main navigation | Done |
| 2.2 | Create cards grid layout for documents | Done |
| 2.3 | Design card component (title, date, folder, preview) | Done |
| 2.4 | Connect cards to API to display real documents | Done |
| 2.5 | Add loading states and empty states | Done |
| 2.6 | Card UI improvements (vertical design, better contrast) | Done |

### Phase 3: Frontend - Document Reader View - COMPLETE

| Step | Task | Status |
|------|------|--------|
| 3.1 | Create Notion-style reader layout (centered, max-width container) | Done |
| 3.2 | Build typography styles (headings, paragraphs, lists, quotes) | Done |
| 3.3 | Add metadata header section (customer, date, category) | Done |
| 3.4 | Handle responsive behavior (full-width on mobile) | Done |
| 3.5 | Add navigation back to cards view | Done |
| 3.6 | Typography improvements (larger text, more spacing) | Done |

### Phase 4: Polish & Enhancements - IN PROGRESS

| Step | Task | Status |
|------|------|--------|
| 4.1 | Dark/light mode verified working | Done |
| 4.2 | All documents displaying (4 total) | Done |
| 4.3 | Add search/filter functionality on cards view | Pending |
| 4.4 | Add "Refresh" button to manually sync with Drive | Pending |

### Phase 5: Upload Feature - COMPLETE

| Step | Task | Status |
|------|------|--------|
| 5.1 | Upgrade API scope from `drive.readonly` to `drive` (full access) | Done |
| 5.2 | Create upload API endpoint (`/api/engagement-calls/upload`) | Done |
| 5.3 | Auto-create folder in Google Drive with document name | Done |
| 5.4 | Upload document to the new folder | Done |
| 5.5 | Build upload UI (drag & drop or file picker) | Done |
| 5.6 | Add "Create New Doc" card with dashed border | Done |
| 5.7 | Show upload progress and success confirmation | Done |

### Phase 6: Future Enhancements - BACKLOG

| Step | Task | Status |
|------|------|--------|
| 6.1 | Real-time sync (Google Drive push notifications) | Backlog |
| 6.2 | AI-powered insight extraction (Option 3) | Backlog |
| 6.3 | Theme/pattern detection across documents | Backlog |
| 6.4 | Search across all document content | Backlog |

---

## Required Items to Start Implementation

| Item | Status | Notes |
|------|--------|-------|
| JSON key file | Configured | `credentials/google-drive-key.json` (gitignored) |
| Folder ID | Configured | `1y0QT_u6zUIzZowqvqu_HiR4-MveBeFMH` in `.env.local` |
| Sample .docx files | Ready | Will read directly from Drive |

---

## Answered Questions

1. **Card information**: Cards should show a **preview of the document content**

2. **Folder structure**: **No categories/filters for now** - display as a flat list of all documents

3. **Document metadata**: Documents have **similar but not identical structure** - parser needs to be flexible

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

## Next Steps (Immediate)

### Ready Now
- Core feature is **complete and usable**
- All 4 documents display with cards and Notion-style reader
- Auto-syncs with Google Drive on page load (5-min cache)
- **Upload feature complete** - drag & drop .docx files to add new documents

### Next Priority: Phase 4 Remaining Items
- Search/filter functionality
- Manual refresh button

### Later: Phase 6 (Future Enhancements)
- AI-powered insight extraction
- Theme/pattern detection
- Full-text search across documents

---

## Decision Log

| Date | Decision | Notes |
|------|----------|-------|
| Feb 11, 2026 | Initial feasibility documented | Three options outlined |
| Feb 13, 2026 | **Option 2 selected** (Google Drive Integration) | Service account created, JSON key downloaded, folder shared |
| Feb 13, 2026 | UI specifications defined | Notion-style document reader, cards grid for navigation |
| Feb 13, 2026 | Action plan created | 4 phases: Backend, Cards View, Reader View, Polish |
| Feb 13, 2026 | Folder ID provided | `1y0QT_u6zUIzZowqvqu_HiR4-MveBeFMH` |
| Feb 13, 2026 | Card design decided | Show document preview, no folder categories for now |
| Feb 13, 2026 | Credentials configured | Key file at `credentials/google-drive-key.json`, env vars set |
| Feb 13, 2026 | **Phase 1 Complete** | Backend API working - can list and read documents from Drive |
| Feb 13, 2026 | **Phases 2-3 Complete** | Frontend MVP: navigation tab, cards view, Notion-style reader |
| Feb 13, 2026 | **Google Docs support added** | Now supports both .docx AND native Google Docs |
| Feb 13, 2026 | All 4 documents working | Fixed query to find docs in all subfolders |
| Feb 13, 2026 | Card UI improvements | Vertical design, better contrast, main blue color |
| Feb 13, 2026 | **Upload feature planned** | Added Phase 5 for document upload to Drive |
| Feb 13, 2026 | **Phase 5 Complete** | Upload feature working with drag & drop UI, auto folder creation |

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `src/lib/google-drive.ts` | Google Drive API service (list, read, export) |
| `src/app/api/engagement-calls/route.ts` | List documents endpoint |
| `src/app/api/engagement-calls/[id]/route.ts` | Get document content endpoint |
| `src/app/api/engagement-calls/debug/route.ts` | Debug endpoint (can be removed) |
| `src/app/api/engagement-calls/upload/route.ts` | Upload document endpoint (Phase 5) |
| `src/components/dashboard/EngagementCallsTab.tsx` | Full UI component (cards + reader) |
| `src/app/page.tsx` | Added navigation tab |
| `credentials/google-drive-key.json` | Service account key (gitignored) |
| `.env.local` | Added Drive credentials and folder ID |

---

*Last updated: February 13, 2026*
