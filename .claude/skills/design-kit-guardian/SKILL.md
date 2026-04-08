# Design Kit Guardian

**Audits design system compliance, supervises ongoing development, and enforces consistent use of Axis Design System components throughout the codebase.**

This agent is the enforcement layer. It does not write documentation — that is `design-system-docs`'s job. Its job is to **detect violations, identify isolated components, and supervise that every new feature uses the design system correctly**.

---

## Role Summary

| Skill | Responsibility |
|-------|---------------|
| `design-kit-guardian` | **Audit, supervise, and enforce compliance** |
| `design-system-docs` | Write and maintain documentation |
| `dashboard-builder` | Build new dashboard features correctly |

The guardian feeds discovered gaps back to `design-system-docs` for documentation, but its primary concern is **compliance and consistency**.

---

## When to Invoke

### Automatically (after any code change):
1. **After building a new feature or tab** — verify it uses design system components
2. **After creating any new `.tsx` file** — check for isolated components that should be promoted
3. **After any PR or session involving UI code** — run a spot audit
4. **When something "looks off"** — verify light/dark mode behavior

### On demand:
- `"Run a design system audit"`
- `"Check if this new feature uses the design system correctly"`
- `"Find any components that aren't in the design kit"`
- `"Audit dark mode compliance"`

### Phase 1 — Initial Full Audit (first-time run):
Run once to establish a baseline of compliance status across the entire codebase.

---

## What This Agent Checks

### 1. Component Usage Compliance

**Rule:** All UI must use Axis components from `src/components/axis/`. Do not reinvent wheels.

Scan for ad-hoc implementations of things that Axis already covers:
- Custom buttons (`<button>`, `<div onClick>`) → should use `<AxisButton>`
- Custom inputs (`<input>`) → should use `<AxisInput>`
- Custom selects (`<select>`) → should use `<AxisSelect>`
- Custom cards (inline div with shadow/border) → should use `<AxisCard>`
- Custom alerts/callouts → should use `<AxisCallout>`
- Custom loading states → should use `<AxisSkeleton>`
- Custom tables (`<table>`) → should use `<AxisTable>`
- Custom pills/badges → should use `<AxisTag>` or `<AxisPill>`
- Custom checkboxes → should use `<AxisCheckbox>`
- Custom toggles → should use `<AxisToggle>`
- Custom tooltips → should use `<AxisTooltip>`
- Custom tab navigation → should use `<AxisNavigationTab>`

**Rule:** All charts must use BaseChart components from `src/components/charts/`.

Scan for direct Recharts usage outside `src/components/charts/`:
- `<LineChart>`, `<BarChart>`, `<PieChart>` used directly in widgets or tabs
- Should always be wrapped: `<BaseLineChart>`, `<BaseHorizontalBarChart>`, `<BaseStackedBarChart>`, `<BaseDonutChart>`

### 2. CSS Token Compliance

**Rule:** Never use hardcoded hex colors or Tailwind semantic color classes. Always use CSS variables.

**VIOLATIONS to flag:**

```tsx
// ❌ Hardcoded hex
style={{ color: '#6b7280' }}
style={{ backgroundColor: '#f3f4f6' }}
style={{ borderColor: '#e5e7eb' }}

// ❌ Hardcoded Tailwind semantic colors (these often don't work in this codebase)
className="bg-neutral-100"
className="text-gray-500"
className="border-neutral-200"
className="bg-white"
className="text-black"

// ❌ Pure black/white backgrounds
style={{ backgroundColor: '#000000' }}
style={{ backgroundColor: '#ffffff' }}

// ✅ Correct — CSS variables
style={{ color: 'var(--text-secondary)' }}
style={{ backgroundColor: 'var(--surface-raised)' }}
className="light-gray-bg"
```

**Token Reference (from globals.css):**

Surface tokens:
- `var(--surface-base)` — main page background
- `var(--surface-raised)` — cards, panels
- `var(--surface-overlay)` — overlays, popovers
- `var(--surface-sunken)` — inset areas

Text tokens:
- `var(--text-primary)` — main text
- `var(--text-secondary)` — supporting text
- `var(--text-tertiary)` — placeholder, hints
- `var(--text-disabled)` — disabled state
- `var(--text-inverse)` — text on brand backgrounds

Border tokens:
- `var(--border-subtle)` — light dividers
- `var(--border-default)` — standard borders
- `var(--border-strong)` — emphasized borders

Custom CSS classes (use these instead of Tailwind background utilities):
- `light-gray-bg` — gray background that adapts to theme
- `selected-tab-line` — line-style tab indicator
- `selected-tab-contained` — pill-style tab indicator
- `skeleton-bg` + `skeleton-animate` / `skeleton-wave` — loading states

### 3. Dark Mode Compliance

**Rule:** Every component must work in both light and dark mode without hardcoded assumptions.

**Check for:**
- Inline `style` objects that contain color properties (can't respond to `.dark` class)
- Conditional theme logic that hardcodes hex values instead of using tokens
- Images or SVGs with hardcoded fill/stroke colors that won't adapt
- Text that uses `text-white` or `text-black` where semantic tokens should be used
- Backgrounds that use `bg-white` or `bg-black` instead of surface tokens

**Dark mode implementation pattern:**
```css
/* globals.css — correct pattern */
.some-class {
  background: var(--surface-raised);  /* adapts automatically */
  color: var(--text-primary);         /* adapts automatically */
}

/* .dark class overrides the CSS variables — components inherit this automatically */
```

**Known dark mode defaults:**
- Dark mode is the default for new users
- `localStorage['theme-preference']` stores 'light' | 'dark' | 'system'
- `.dark` class is applied to `<html>` element
- **NEVER use pure black** in dark mode — always `var(--surface-base)` = `#111827`

### 4. Isolated Component Detection

**Rule:** Any reusable UI pattern that appears in 2+ places should be a design system component.

Scan for:
- Repeated JSX patterns across different files (same structure duplicated)
- Components defined inside `src/app/` or `src/components/dashboard/` that could be generalized
- Inline render logic for scorecards, badges, or indicators that could be `AxisCardStat`, `AxisTag`, or `AxisPill`
- Locally-defined helper components inside widget files

When found, flag as: **"Candidate for promotion to design system"**

### 5. Widget Architecture Compliance

Every dashboard widget file in `src/components/workspace/widgets/` must follow the Widget pattern:

```tsx
// ✅ Required: wrapped in <Widget> component
<Widget
  title="Widget Title"
  onExport={onWidgetExport}
  onSettings={onWidgetSettings}
  editMode={editMode}
>
  {loading ? <AxisSkeleton variant="widget" /> : <content />}
</Widget>
```

**Violations:**
- Widget not wrapped in `<Widget>` component
- Custom loading indicator instead of `<AxisSkeleton>`
- Hardcoded title/header inside widget instead of using Widget's `title` prop
- Export logic implemented directly in widget instead of via `onWidgetExport` callback

### 5b. Flush Body Registration (MANDATORY for MetricCard widgets)

**Rule:** Any widget that renders `MetricCard` components inside a `flush-cards` flex row **MUST** be registered in the `FLUSH_BODY_WIDGETS` set in `src/components/workspace/GridWorkspace.tsx`.

Without this registration, the Widget wrapper adds `px-3 py-2` body padding that squeezes the cards, clips the numbers, and wastes space. With `flushBody=true`, cards go edge-to-edge inside the widget — matching the API Overview reference.

```tsx
// src/components/workspace/GridWorkspace.tsx
const FLUSH_BODY_WIDGETS = new Set<WidgetType>([
  'metrics',
  'api-overview',
  'asana-board-overview',
  // ... every MetricCard-based overview widget
]);
```

**This applies regardless of card count (2, 3, 4, 5, or 6 cards).** The cards will flex evenly to fill 100% width.

**Violations:**
- Widget uses `<MetricCard>` + `flush-cards` but is NOT in `FLUSH_BODY_WIDGETS` → cards will be clipped
- Widget renders overview cards with custom padding instead of relying on `flushBody`

### 6. Tab Architecture Compliance

Every tab in `src/components/dashboard/` must follow the Tab pattern:

```tsx
// ✅ Required structure
const SomeTab = forwardRef<TabHandle, SomeTabProps>((props, ref) => {
  useImperativeHandle(ref, () => ({
    resetLayout: () => { /* ... */ },
    openWidgetCatalog: () => { /* ... */ },
  }))
  // ...
  return <GridWorkspace ... />
})
```

**Violations:**
- Tab not using `forwardRef`
- Tab not exposing `resetLayout()` and `openWidgetCatalog()` via `useImperativeHandle`
- Tab rendering its own Reset/Add buttons (these must be in parent toolbar)
- Tab not using `GridWorkspace` for widget layout

### 7. Skeleton / Loading State Compliance

**Rule:** Use `AxisSkeleton` for all loading states. Never use spinners, custom CSS pulses, or placeholder divs.

Correct loading patterns:
```tsx
// Widget loading
<AxisSkeleton variant="widget" />

// Chart loading
<AxisSkeleton variant="chart" />

// Card loading
<AxisSkeleton variant="card" />

// Table loading
<AxisSkeleton variant="table" />

// Custom loading (minimalistic blocks only)
<AxisSkeleton variant="custom" lines={3} />
```

**Violations to flag:**
- `<div className="animate-pulse">` custom implementations
- Spinner components (loading.tsx with rotating icon)
- Empty divs as placeholders
- Conditional null returns during loading (should show skeleton instead)

---

## Audit Workflow

### Step 1: Component Inventory

```bash
# Find all tsx files in the project
find src/ -name "*.tsx" -type f | sort

# Count Axis components
find src/components/axis/ -name "*.tsx" | wc -l

# Count widgets
find src/components/workspace/widgets/ -name "*.tsx" | wc -l

# Count dashboard tabs
find src/components/dashboard/ -name "*.tsx" | wc -l
```

### Step 2: Scan for Hardcoded Colors

Search for violations across the codebase:

```
Pattern: style=\{\{.*#[0-9a-fA-F]{3,6}
Files: src/**/*.tsx
Purpose: Find inline style objects with hardcoded hex colors
```

```
Pattern: className="[^"]*bg-(white|black|gray-[0-9]+|neutral-[0-9]+)
Files: src/**/*.tsx
Purpose: Find Tailwind background color classes that bypass token system
```

```
Pattern: className="[^"]*text-(white|black|gray-[0-9]+|neutral-[0-9]+)
Files: src/**/*.tsx
Purpose: Find Tailwind text color classes that bypass token system
```

### Step 3: Scan for Raw HTML Elements (instead of Axis components)

```
Pattern: <button(?!\s*[^>]*AxisButton)
Files: src/**/*.tsx (excluding src/components/axis/)
Purpose: Find raw <button> elements that should use AxisButton
```

```
Pattern: <input(?!\s*[^>]*AxisInput)
Files: src/**/*.tsx (excluding src/components/axis/)
Purpose: Find raw <input> elements that should use AxisInput
```

```
Pattern: <select
Files: src/**/*.tsx (excluding src/components/axis/)
Purpose: Find raw <select> elements that should use AxisSelect
```

### Step 4: Scan for Direct Recharts Usage (outside charts/)

```
Pattern: import.*from 'recharts'
Files: src/components/workspace/widgets/**/*.tsx, src/components/dashboard/**/*.tsx
Purpose: Widgets and tabs should use BaseChart wrappers, not direct Recharts
```

### Step 5: Check Widget Architecture

For each file in `src/components/workspace/widgets/`:
- Verify it imports and uses `<Widget>` component
- Verify it uses `<AxisSkeleton>` for loading state
- Verify loading/error/data are passed as props (not fetched internally without caching)

### Step 6: Check Tab Architecture

For each file in `src/components/dashboard/`:
- Verify it uses `forwardRef`
- Verify it exposes `resetLayout` and `openWidgetCatalog`
- Verify it uses `GridWorkspace`

### Step 7: Identify Isolated Components

Look in:
- `src/app/**/*.tsx` — any locally-defined UI components
- `src/components/dashboard/**/*.tsx` — tab-specific components that could be generalized
- Widget files — any inline rendering that could be extracted

---

## Audit Report Format

After running a full audit, generate `Design docs/design-system/DESIGN_KIT_AUDIT.md`:

```markdown
# Design Kit Compliance Audit

**Date:** [current date]
**Scope:** Full codebase scan

---

## Summary

| Check | Pass | Violations | Notes |
|-------|------|------------|-------|
| Component Usage | ✅/❌ | N | ... |
| CSS Token Compliance | ✅/❌ | N | ... |
| Dark Mode Compliance | ✅/❌ | N | ... |
| Widget Architecture | ✅/❌ | N | ... |
| Tab Architecture | ✅/❌ | N | ... |
| Skeleton Usage | ✅/❌ | N | ... |
| Isolated Components | ✅/❌ | N candidates | ... |

---

## Violations

### [Category Name]

#### [file:line_number]
- **Violation:** Description of what's wrong
- **Rule:** Which rule it violates
- **Fix:** How to correct it

---

## Promotion Candidates

Components/patterns found in the codebase that are not in the design kit but should be:

### [Pattern Name]
- **Found in:** file1.tsx, file2.tsx
- **Description:** What it does
- **Recommendation:** Create `AxisXxx` component or document as pattern

---

## Actions Required

1. [ ] Fix violation in [file]
2. [ ] Promote [pattern] to design system component
3. [ ] Run design-system-docs to document new components
```

---

## Supervision Mode (Ongoing)

After the initial audit is complete, run in supervision mode after every new feature or component:

### Checklist for New Features

When a new tab, widget, or component is built, verify:

**Component usage:**
- [ ] Uses `AxisButton` for all buttons
- [ ] Uses `AxisInput` for all inputs
- [ ] Uses `AxisCard` or `Widget` for containers
- [ ] Uses `AxisSkeleton` for loading states
- [ ] Uses `AxisCallout` for alerts/notices
- [ ] Uses `AxisTable` for data tables
- [ ] Uses `AxisTag` or `AxisPill` for status indicators
- [ ] Uses `BaseLineChart` / `BaseHorizontalBarChart` / etc. for charts

**Styling:**
- [ ] No hardcoded hex colors in `style={}` props
- [ ] No Tailwind color classes that bypass the token system
- [ ] Uses `var(--surface-*)` for backgrounds
- [ ] Uses `var(--text-*)` for text colors
- [ ] Uses `var(--border-*)` for borders
- [ ] Uses `light-gray-bg` class instead of `bg-neutral-100` or similar

**Architecture (if a widget):**
- [ ] Wrapped in `<Widget>` component
- [ ] Uses `AxisSkeleton variant="widget"` for loading
- [ ] Exports via `onWidgetExport` callback
- [ ] Settings via `onWidgetSettings` callback

**Architecture (if a tab):**
- [ ] Uses `forwardRef` with `TabHandle`
- [ ] Exposes `resetLayout()` and `openWidgetCatalog()`
- [ ] Uses `GridWorkspace` for layout
- [ ] No inline Reset/Add buttons

**Dark mode:**
- [ ] Tested with dark mode active (`.dark` on html)
- [ ] No elements disappear or become invisible in dark mode
- [ ] No elements are unreadable (low contrast) in dark mode

---

## New Component Registration Flow

When a new reusable component is created or a promotion candidate is confirmed:

1. **Guardian confirms it's a genuine reusable component** (used in 2+ places OR is a meaningful primitive)
2. **Guardian hands off to `design-system-docs`**: "New component `AxisXxx` created at `src/components/axis/AxisXxx.tsx` — please document it in DESIGN_SYSTEM.md and design-kit.html"
3. **design-system-docs agent** handles the documentation update
4. **Guardian updates its promotion candidates list** to reflect the new component is now registered

---

## Key File Locations

| File | Purpose |
|------|---------|
| `src/components/axis/` | Axis UI primitives — the design system source |
| `src/components/charts/` | Reusable chart wrappers |
| `src/components/workspace/` | Grid workspace system |
| `src/components/workspace/widgets/` | All 48+ dashboard widgets |
| `src/components/dashboard/` | Dashboard tab components |
| `docs/DESIGN_SYSTEM.md` | Design system documentation |
| `public/design-kit.html` | Interactive design kit |
| `Design docs/design-system/DESIGN_KIT_AUDIT.md` | Compliance audit report (generated by this agent) |
| `src/app/globals.css` | All CSS variables and custom classes |
| `THEME_BEST_PRACTICES.md` | Light/dark mode implementation guide |

---

## Common Violations Reference

### Quick Lookup: What to use instead

| Violation Found | Use Instead |
|----------------|-------------|
| `<button>` | `<AxisButton variant="filled\|outlined\|ghost">` |
| `<input>` | `<AxisInput>` |
| `<select>` | `<AxisSelect>` |
| `<div className="... shadow ... rounded">` (card pattern) | `<AxisCard>` |
| `<div className="animate-pulse">` | `<AxisSkeleton>` |
| `<div className="bg-yellow-100 ...">` (alert) | `<AxisCallout variant="alert">` |
| `<table>` | `<AxisTable>` |
| `<span className="bg-green-100 text-green-800">` | `<AxisTag variant="success">` |
| `<span className="rounded-full bg-...">` | `<AxisPill>` |
| `<input type="checkbox">` | `<AxisCheckbox>` |
| `style={{ color: '#6b7280' }}` | `style={{ color: 'var(--text-secondary)' }}` |
| `className="bg-gray-50"` | `className="light-gray-bg"` |
| `className="bg-white"` | `style={{ background: 'var(--surface-base)' }}` |
| `className="bg-neutral-100"` | `className="light-gray-bg"` |
| `<LineChart>` (direct Recharts) | `<BaseLineChart>` |
| `<BarChart>` (direct Recharts) | `<BaseHorizontalBarChart>` or `<BaseStackedBarChart>` |
| `<PieChart>` (direct Recharts) | `<BaseDonutChart>` |

---

## Shadow Scale Reference

| Use Case | Class |
|----------|-------|
| Default widget | `shadow-xs` |
| Widget hover | `shadow-sm` |
| Widget being dragged | `shadow-md` |
| Modals/overlays | `shadow-lg` |

---

## Color Shades Reference

**Available shades:** 50, 100, 300, 500, 700, 900, 950
**NOT available:** 200, 400, 600, 800 — do not use these

```css
var(--color-main-500)   /* ✅ */
var(--color-main-600)   /* ❌ doesn't exist */
```

---

## Relationship with Other Skills

```
User builds a new feature
         │
         ▼
  dashboard-builder     ← How to build it correctly
         │
         ▼
  design-kit-guardian   ← Did they build it correctly?
         │
    (if gaps found)
         │
         ▼
  design-system-docs    ← Document new/missing components
         │
         ▼
  deploy-to-cloud-run   ← Ship it
```

---

**Created:** 2026-02-24
**Last Updated:** 2026-02-24
