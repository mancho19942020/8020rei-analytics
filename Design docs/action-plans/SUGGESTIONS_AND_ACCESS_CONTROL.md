# Action Plan: Suggestions Feature & Design Kit Access Control

**Created:** 2026-04-01
**Status:** Planning
**Owner:** German Alvarez

---

## Overview

Two related changes to the header toolbar:

1. **Design Kit button** — restrict visibility to authorized collaborators only (by email)
2. **Suggestions button** — new button visible to all `@8020rei.com` users, allowing them to submit feedback/suggestions that are delivered via email to German

Current header toolbar order: `[Edit Layout] [User Type] [Date Range] | [Design Kit] [Theme Toggle] [User Info] [Sign Out]`

Target header toolbar order: `[Edit Layout] [User Type] [Date Range] | [Design Kit*] [Suggestions] [Theme Toggle] [User Info] [Sign Out]`

*Design Kit only visible to authorized emails

---

## Part 1: Design Kit Button — Email-Based Access Control

### Goal

Only show the Design Kit button to specific collaborators who work on design/development of the platform. All other `@8020rei.com` users should not see it — it's an internal tool for contributors.

### Authorized Emails

```
german@8020rei.com             (owner)
camilo.rico@8020rei.com       (repo collaborator)
juliana@8020rei.com            (repo collaborator)
nicolas.hernandez@8020rei.com  (future contributor)
johan.mujica@8020rei.com       (future contributor)
```

### Implementation

**Approach:** Client-side email allowlist. Simple, no backend changes needed. The Design Kit is a static HTML file (`public/design-kit.html`) — there's no sensitive data to protect server-side, so client-side gating is sufficient.

#### Step 1: Create access config

Create `src/lib/access.ts`:

```typescript
/**
 * Email-based access control for internal tools.
 * Design Kit is only visible to platform contributors.
 */

const DESIGN_KIT_AUTHORIZED_EMAILS: string[] = [
  'german.alvarez@8020rei.com',
  'camilo.rico@8020rei.com',
  'juliana@8020rei.com',
  'nicolas.hernandez@8020rei.com',
  'johan.mujica@8020rei.com',
];

export function canAccessDesignKit(email: string | null | undefined): boolean {
  if (!email) return false;
  return DESIGN_KIT_AUTHORIZED_EMAILS.includes(email.toLowerCase());
}
```

#### Step 2: Conditionally render DesignKitButton

In `src/app/[[...slug]]/page.tsx`, wrap the Design Kit button:

```tsx
import { canAccessDesignKit } from '@/lib/access';

// Inside the header toolbar, around line 441-444:
{canAccessDesignKit(user?.email) && (
  <div className="h-9 flex items-center">
    <DesignKitButton />
  </div>
)}
```

#### Files Changed
- `src/lib/access.ts` — **new** (access control config + helper)
- `src/app/[[...slug]]/page.tsx` — conditional render (~2 lines changed)

#### Maintenance
To add/remove authorized users, edit the array in `src/lib/access.ts`. No deploy needed beyond the normal process.

---

## Part 2: Suggestions Button — Email Feedback Feature

### Goal

Allow any `@8020rei.com` user to submit suggestions/feedback about the platform. Submissions are sent to German's email. The button should be visible to all authenticated users.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Delivery method** | Email via backend API route | Reliable, German gets notifications natively, no new service needed |
| **Email service** | Gmail API (existing GCP project) or Resend/SendGrid | GCP project already has service accounts; alternatively a lightweight transactional email service |
| **UI pattern** | Modal dialog triggered by header button | Consistent with existing patterns (e.g., Grafana profile modal), non-disruptive |
| **Storage** | Optional — Firestore collection | Keep a record of all suggestions for future reference; email is the primary delivery |

### Implementation

#### Step 1: Create the Suggestions Modal component

Create `src/components/SuggestionsModal.tsx`:

- **Trigger:** Icon button in header toolbar (lightbulb or chat-bubble icon), same `AxisButton` styling as Design Kit and Theme Toggle
- **Modal content:**
  - Category dropdown: `Bug Report`, `Feature Request`, `UI/UX Feedback`, `General Suggestion`
  - Subject line (text input)
  - Description (textarea, required, min 10 chars)
  - Optional screenshot upload (stretch goal — not in v1)
  - Submit button + Cancel button
- **On submit:** POST to `/api/suggestions`
- **Success state:** Toast notification "Suggestion sent — thank you!"
- **Modal styling:** Use existing Axis design tokens, match the Grafana profile modal pattern

#### Step 2: Create the API route

Create `src/app/api/suggestions/route.ts`:

```
POST /api/suggestions
Body: { category, subject, description, userEmail, userName }
```

**Flow:**
1. Validate the request body
2. Send email to `german.alvarez@8020rei.com` with the suggestion details
3. (Optional) Save to Firestore collection `suggestions` for record-keeping
4. Return success response

**Email content template:**
```
Subject: [Metrics Hub Suggestion] {category}: {subject}
From: noreply@8020rei.com (or service sender)
To: german@8020rei.com

New suggestion from {userName} ({userEmail})

Category: {category}
Subject: {subject}

Description:
{description}

---
Sent from Metrics Hub Suggestions
```

#### Step 3: Email delivery service

**Recommended approach — Resend (simplest):**
- Free tier: 100 emails/day (more than enough)
- Single API key in `.env.local`
- ~10 lines of code to send an email
- No complex OAuth/service account setup

**Alternative — Gmail API via existing GCP service account:**
- Already have GCP credentials in the project
- More complex setup (OAuth2, domain-wide delegation)
- Better if wanting to send "from" a real @8020rei.com address

**Decision:** Start with Resend for v1 (fast to implement), migrate to Gmail API later if needed.

#### Step 4: Add button to header

In `src/app/[[...slug]]/page.tsx`, add between Design Kit and Theme Toggle:

```tsx
{/* Suggestions */}
<div className="h-9 flex items-center">
  <SuggestionsButton onClick={() => setSuggestionsModalOpen(true)} />
</div>

{/* Suggestions Modal */}
<SuggestionsModal
  isOpen={suggestionsModalOpen}
  onClose={() => setSuggestionsModalOpen(false)}
  user={user}
/>
```

#### Step 5: (Optional) Firestore collection for record-keeping

Collection: `suggestions`
Document structure:
```json
{
  "category": "Feature Request",
  "subject": "Add export to CSV",
  "description": "It would be great if...",
  "userEmail": "someone@8020rei.com",
  "userName": "Someone",
  "createdAt": "2026-04-01T...",
  "status": "new"
}
```

This allows German to later build a suggestions dashboard or review history.

#### Files Changed
- `src/components/SuggestionsButton.tsx` — **new** (icon button component)
- `src/components/SuggestionsModal.tsx` — **new** (modal with form)
- `src/app/api/suggestions/route.ts` — **new** (API route for email + storage)
- `src/app/[[...slug]]/page.tsx` — add button + modal (~10 lines)
- `.env.local` — add `RESEND_API_KEY` (or equivalent email service key)

---

## Implementation Sequence

### Phase 1 — Design Kit Access Control (small, ship immediately)
1. Create `src/lib/access.ts` with email allowlist
2. Add conditional render in page.tsx
3. Test with authorized and non-authorized emails
4. Deploy

### Phase 2 — Suggestions Feature (1-2 sessions)
1. Set up Resend account and add API key to `.env.local`
2. Create API route (`/api/suggestions`)
3. Build SuggestionsButton component
4. Build SuggestionsModal component
5. Wire up in page.tsx header
6. Test end-to-end (submit suggestion, verify email received)
7. (Optional) Add Firestore storage
8. Deploy

### Phase 3 — Enhancements (future)
- Screenshot attachment support in suggestions
- Suggestions dashboard tab (view/manage all suggestions)
- Email notifications when suggestion status changes
- Slack notifications via Gmail integration (Gmail filter on `[Metrics Hub Suggestion]` subject → Slack channel via Gmail Slack app — no code, just configuration)

---

## Architecture Diagram

```
User clicks [Suggestions] button
        |
        v
  SuggestionsModal (form)
        |
        v
  POST /api/suggestions
        |
        +---> Resend API ---> Email to german@8020rei.com
        |
        +---> Firestore "suggestions" collection (optional record)
        |
        v
  Success toast to user
```

---

## Risk & Considerations

| Risk | Mitigation |
|------|-----------|
| Email service API key exposed client-side | API route runs server-side only (Next.js route handler) — key never reaches the browser |
| Spam / abuse of suggestions endpoint | All users are already authenticated `@8020rei.com` — low risk. Rate limiting can be added later if needed |
| Design Kit HTML still accessible via direct URL | Acceptable — the HTML contains no sensitive data, it's just design documentation. The button hiding is a UX choice, not a security boundary |
| Resend free tier limits | 100 emails/day is far more than needed for internal team suggestions |

---

## Notes

- The Design Kit access control is purely a **UX decision** — it declutters the toolbar for non-contributors. It is not a security gate.
- The Suggestions feature gives German a direct channel to receive feedback from the entire 8020REI team without needing a separate tool.
- Both features follow existing patterns: AxisButton for toolbar icons, modal pattern from Grafana profile, API routes for server-side operations.
