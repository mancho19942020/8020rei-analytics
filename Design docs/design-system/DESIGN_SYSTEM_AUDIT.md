# Design System Compliance Audit

**Date:** 2026-02-24
**Scope:** Full codebase scan — all `.tsx` files under `src/`
**Agent:** design-kit-guardian
**Status:** Initial baseline audit

---

## Summary

| Check | Status | Violations | Severity |
|-------|--------|-----------|----------|
| 1. Hardcoded Hex Colors in `style={}` | ✅ PASS | 0 | — |
| 2. Tailwind Colors Bypassing Token System | ❌ FAIL | 20+ | MEDIUM/HIGH |
| 3. Raw HTML Elements (instead of Axis components) | ❌ FAIL | 7 | MEDIUM |
| 4. Direct Recharts Imports outside `charts/` | ⚠️ REVIEW | 2 | LOW |
| 5. Widget Architecture (`<Widget>` wrapper) | ✅ PASS | 0 | — |
| 6. Tab Architecture (`forwardRef` + `useImperativeHandle`) | ❌ FAIL | 1 | HIGH |
| 7. Custom Loading / Spinner Violations | ⚠️ MIXED | 2 | LOW |
| 8. Isolated/Duplicated Component Patterns | ⚠️ FINDINGS | 8 widgets | MEDIUM |

---

## Critical Issues

### CHECK 6 (HIGH): EngagementCallsTab Missing Tab Architecture

**File:** `src/components/dashboard/EngagementCallsTab.tsx`

**Problem:** Exported as a plain function, not using `forwardRef` or `useImperativeHandle`.

```tsx
// Current (WRONG):
export function EngagementCallsTab() {
  // ...
}

// Required:
export const EngagementCallsTab = forwardRef<TabHandle>((props, ref) => {
  useImperativeHandle(ref, () => ({
    resetLayout: () => { /* clear to default layout */ },
    openWidgetCatalog: () => { /* no-op if tab doesn't have widgets */ },
  }), [])
  // ...
})
```

**Impact:** The parent `page.tsx` creates a ref for this tab but it won't connect. Toolbar actions (Reset Layout, Add Widget) will silently fail for this tab.

**Note:** EngagementCallsTab is a document-focused tab, not a widget grid. `resetLayout` and `openWidgetCatalog` can be no-ops, but the `forwardRef` interface must be implemented for consistency.

---

## Medium Issues

### CHECK 2: Tailwind Semantic Colors in Widgets and Dashboard

The following files use hardcoded Tailwind `gray-*`, `neutral-*`, `white`, or `black` classes instead of semantic CSS variable tokens. This breaks theme consistency.

**In `src/components/workspace/widgets/` (HIGH — must fix):**

| File | Classes to Replace |
|------|-------------------|
| `ProjectsTableWidget.tsx` (lines 23, 45) | `bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300`, `bg-neutral-200 dark:bg-neutral-700` |
| `FeatureAdoptionWidget.tsx` (line 24) | `bg-neutral-200 dark:bg-neutral-700` (progress bar track) |
| `SessionSummaryWidget.tsx` (line 102) | `bg-neutral-500 dark:bg-neutral-600` (icon background) |
| `InsightsSummaryWidget.tsx` (lines 172, 200) | `bg-black/50`, `hover:bg-white/20` (overlay) |

**Replace with:**
```tsx
// Instead of bg-neutral-100 dark:bg-neutral-800
// Use: className="light-gray-bg"

// Instead of bg-neutral-200 dark:bg-neutral-700 (progress track)
// Use: style={{ backgroundColor: 'var(--surface-overlay)' }}

// Instead of bg-black/50 (overlay/modal backdrop)
// Use: style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} — this is acceptable for overlays

// Instead of bg-neutral-500 (icon background)
// Use: style={{ backgroundColor: 'var(--text-tertiary)' }}
```

**In `src/components/dashboard/EngagementCallsTab.tsx` (HIGH — most violations):**

Lines 57-58, 73, 79, 85-86, 181, 187, 202, 206, 445 use:
- `bg-white dark:bg-[#1e1e24]` — hardcoded dark hex and white
- `text-gray-900 dark:text-white`
- `text-gray-500 dark:text-gray-400`
- `border-gray-100 dark:border-gray-800`
- `bg-gray-100 dark:bg-gray-800`

**Replace with:**
```tsx
// bg-white dark:bg-[#1e1e24] → style={{ background: 'var(--surface-raised)' }}
// text-gray-900 dark:text-white → style={{ color: 'var(--text-primary)' }}
// text-gray-500 dark:text-gray-400 → style={{ color: 'var(--text-secondary)' }}
// border-gray-100 dark:border-gray-800 → style={{ borderColor: 'var(--border-subtle)' }}
// bg-gray-100 dark:bg-gray-800 → className="light-gray-bg"
```

**In `src/components/axis/` (MEDIUM — acceptable but worth tracking):**

These are inside the design system source components. The violations are for disabled states, hover states, and overlay modifiers (`bg-black/5`, `bg-white/10`). These are **acceptable** since Axis components are the source of truth, but should be migrated to tokens in the next Axis component revision.

Files: `AxisButton.tsx`, `AxisCallout.tsx`, `AxisToggle.tsx`, `AxisInput.tsx`, `AxisCheckbox.tsx`, `AxisNavigationTab.tsx`, `AxisSelect.tsx`, `AxisTable.tsx`, `AxisTag.tsx`

---

### CHECK 3: Raw `<button>` Elements Instead of `<AxisButton>`

| File | Location | Context |
|------|----------|---------|
| `src/components/workspace/widgets/DomainActivityTrendWidget.tsx` | Lines 104, 114 | Metric switcher tabs ("Properties", "Domain Count") |
| `src/components/workspace/widgets/ClientActivityTrendWidget.tsx` | Lines 133, 143 | Metric switcher tabs ("Users", "Events") |
| `src/components/workspace/widgets/InsightsSummaryWidget.tsx` | Lines 198, 273, 339 | Close, footer, "learn more" buttons |
| `src/components/workspace/widgets/AlertsFeedWidget.tsx` | Line 150 | Collapsible section header |
| `src/components/workspace/widgets/ClientsTableWidget.tsx` | Line 105 | "Clear selection" action |
| `src/components/workspace/widgets/DomainLeaderboardWidget.tsx` | Line 230 | "Show all" filter reset |
| `src/components/dashboard/EngagementCallsTab.tsx` | Lines 55, 144, 227 | Document card, upload card, file input area |

**Fix pattern:**
```tsx
// Before (raw button):
<button
  onClick={handleClick}
  className="px-3 py-1 text-sm bg-neutral-100 rounded ..."
>
  Label
</button>

// After (Axis component):
<AxisButton variant="ghost" size="small" onClick={handleClick}>
  Label
</AxisButton>
```

Note: For the metric switcher tabs in DomainActivityTrendWidget and ClientActivityTrendWidget — consider using `<AxisNavigationTab>` instead if they are tab-style buttons.

---

### CHECK 8: Metric Card Duplication — Promotion Candidate

The following 8+ widget files contain nearly identical "metric card" patterns (stat + trend indicator + optional sparkline):

1. `EventMetricsWidget.tsx` (lines 40–183)
2. `EngagementMetricsWidget.tsx` (lines 50–147)
3. `DomainActivityOverviewWidget.tsx` (lines 23–99)
4. `UserActivityWidget.tsx` (lines 41–148)
5. `SessionSummaryWidget.tsx`
6. `MetricsOverviewWidget.tsx`
7. `DeviceCategoryWidget.tsx`

**Recommendation:** Extract a shared `MetricCardCluster` component in `src/components/workspace/`:
- Accepts an array of metric configs (label, value, trend, delta, sparkline data)
- Renders a responsive grid of metric cards
- Handles trend direction (up/down) with appropriate colors
- Reduces duplication by ~60% across these widgets

Once extracted, register it in the design kit under **Workspace Components**.

---

## Low / Review Items

### CHECK 4: Direct Recharts Imports in Dashboard Helpers

| File | Import |
|------|--------|
| `src/components/dashboard/TimeSeriesChart.tsx` | `import { LineChart, Line, ... } from 'recharts'` |
| `src/components/dashboard/FeatureBarChart.tsx` | `import { BarChart, Bar, ... } from 'recharts'` |

These are dashboard-level helper components (not workspace widgets). They are potentially acceptable, but should be reviewed:
- If they are used only internally by tabs, they can stay as-is
- If they would ever be reused as widgets, they should be refactored to use `BaseLineChart` / `BaseHorizontalBarChart`

**Action:** Review usage — no immediate change needed.

### CHECK 7: Custom Spinner on page.tsx

`src/app/page.tsx` line 461 uses `animate-spin` for an inline loading indicator. This should use `<AxisSkeleton>` to remain consistent with the loading pattern across the platform.

**Action:** Low priority — replace when touching this area.

---

## Axis Components: Design Kit Coverage Status

As of this audit, the design kit (`public/design-kit.html` and `Design docs/design-system/DESIGN_SYSTEM.md`) documents **36 components** but the actual codebase has **90+ components**. The gap is primarily:

| Category | Documented | Actual | Gap |
|----------|-----------|--------|-----|
| Global (ThemeToggle, Logo, etc.) | 3 | 3 | 0 |
| Axis UI primitives | 12 | 14 | **+2** (AxisSkeleton, AxisTooltip) |
| Chart wrappers | 3 | 5 | **+2** (BaseStackedBarChart, BaseDonutChart) |
| Workspace components | 4 | 4 | 0 |
| Widget components | 8 | 48 | **+40** |
| Dashboard tab components | 6 | 16 | **+10** |

**Action:** Invoke `design-system-docs` agent to document the gap components — especially the 2 missing Axis UI components (AxisSkeleton, AxisTooltip) and the 2 missing chart wrappers.

---

## Action Plan

### Immediate (HIGH priority):
- [ ] Fix `EngagementCallsTab.tsx` — add `forwardRef` + `useImperativeHandle` with `TabHandle`

### Soon (MEDIUM priority):
- [ ] Replace hardcoded Tailwind colors in `ProjectsTableWidget.tsx`
- [ ] Replace hardcoded Tailwind colors in `FeatureAdoptionWidget.tsx`
- [ ] Replace hardcoded Tailwind colors in `SessionSummaryWidget.tsx`
- [ ] Replace hardcoded Tailwind colors in `InsightsSummaryWidget.tsx`
- [ ] Replace hardcoded Tailwind colors in `EngagementCallsTab.tsx` (15+ violations)
- [ ] Replace raw `<button>` with `<AxisButton>` in 7 widget/tab files
- [ ] Extract `MetricCardCluster` component from the 8 duplicated widget patterns

### Backlog (LOW priority):
- [ ] Replace `page.tsx` custom spinner with `<AxisSkeleton>`
- [ ] Review and migrate Axis component internal neutral/gray classes to tokens (next design system revision)
- [ ] Update `design-system-docs` to cover AxisSkeleton, AxisTooltip, BaseStackedBarChart, BaseDonutChart

---

*Generated by design-kit-guardian on 2026-02-24*
*Next audit: after next major feature or on demand*
