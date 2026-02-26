# Grafana Tab — Testing Action Plan

**Status:** Pending first real Grafana dashboard
**Prerequisite:** A Grafana dashboard must be published and accessible via a public or authenticated URL before end-to-end testing can be completed.

---

## Pre-Testing Checklist (Complete Now)

- [x] Firebase Firestore enabled in `rei-analytics-b4b8b` project
- [x] Firestore security rules published (read: any auth user; write: own doc only)
- [x] "Grafana" tab visible in platform navigation
- [x] Tab renders gallery view without errors

---

## Test Scenarios

### 1. Profile Creation (First Profile)

**When:** You or a team member has a Grafana dashboard URL ready.

**Steps:**
1. Go to the Grafana tab
2. Click **"Add Your Dashboards"**
3. Fill in:
   - Display Name (auto-filled from your account)
   - Title / Role (e.g., "Backend Lead")
   - Dashboard 1 — Name: anything, URL: your Grafana dashboard URL
4. Click **"Create Profile"**

**Expected:**
- Modal closes
- Your profile card appears in the gallery immediately
- Card shows your initials avatar, name, title, and "1 dashboard" tag
- No page refresh needed (optimistic update)

---

### 2. View Dashboards (Profile Detail)

**Steps:**
1. Click **"View Dashboards"** on any profile card

**Expected:**
- Transitions to detail view showing all linked dashboards as cards
- Each card shows dashboard name, optional description
- "Open in Grafana" button visible on each card

---

### 3. Open in Grafana

**Steps:**
1. From the profile detail view, click **"Open in Grafana"**

**Expected:**
- Opens the Grafana URL in a new browser tab
- Original platform tab stays open

---

### 4. Edit Your Profile

**Steps:**
1. On your own card in the gallery, click **"Edit"**
   — OR — from the detail view, click **"Edit Profile"** (only visible on own profile)
2. Change the title or add a second dashboard
3. Click **"Save Changes"**

**Expected:**
- Modal closes with updated data
- Gallery card reflects changes immediately (no refresh)
- Edit button only visible on your own card — not on other people's cards

---

### 5. Multiple Dashboards

**Steps:**
1. Edit your profile
2. Click **"Add Another Dashboard"** to add a second entry
3. Fill in Name + URL for dashboard 2
4. Save

**Expected:**
- Card in gallery now shows "2 dashboards" tag
- Detail view shows both dashboard cards in a 3-column grid

---

### 6. Cross-User Visibility

**Steps:**
1. Create a profile as user A (German)
2. Sign out, sign in as a different `@8020rei.com` user
3. Go to the Grafana tab

**Expected:**
- German's profile card is visible to the second user
- Second user can view the dashboards but has no Edit button on German's card

---

### 7. URL Validation

**Steps:**
1. Try to save a dashboard with URL = "not-a-url"

**Expected:**
- Error callout: "URL must start with http or https"
- Modal stays open, no data saved

---

### 8. Empty Required Fields

**Steps:**
1. Open "Add Your Dashboards"
2. Leave Title blank
3. Click "Create Profile"

**Expected:**
- Error callout: "Title / role is required."
- No data saved

---

### 9. Dark/Light Mode

**Steps:**
1. Toggle theme in the header
2. Verify the Grafana tab in both modes

**Expected:**
- Profile cards, dashboard cards, modal all respect the theme
- No pure-black or hard-coded color artifacts

---

## Known Limitation (Document for Later)

The current implementation does **not** support:
- Deleting a profile card (to be added if needed)
- Sorting/filtering contributor cards
- Real-time updates (requires a page refresh to see another user's new profile)

If real-time updates become a requirement, Firestore's `onSnapshot` listener can replace the `getDocs` call in `GrafanaTab.tsx:fetchContributors`.

---

## Files Involved

| File | Role |
|------|------|
| [src/components/dashboard/GrafanaTab.tsx](../../src/components/dashboard/GrafanaTab.tsx) | Main tab — gallery + detail views |
| [src/components/dashboard/grafana/GrafanaContributorCard.tsx](../../src/components/dashboard/grafana/GrafanaContributorCard.tsx) | Profile card |
| [src/components/dashboard/grafana/GrafanaDashboardCard.tsx](../../src/components/dashboard/grafana/GrafanaDashboardCard.tsx) | Dashboard link card |
| [src/components/dashboard/grafana/GrafanaProfileModal.tsx](../../src/components/dashboard/grafana/GrafanaProfileModal.tsx) | Add/Edit modal |
| [src/components/axis/AxisModal.tsx](../../src/components/axis/AxisModal.tsx) | Modal primitive |
| [src/lib/firebase/firestore.ts](../../src/lib/firebase/firestore.ts) | Firestore client |

---

*Created: February 26, 2026*
