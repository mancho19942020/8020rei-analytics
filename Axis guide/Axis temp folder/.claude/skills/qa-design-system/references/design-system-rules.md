# Axis Design System Validation Rules

This reference contains the complete checklist for validating frontend code against the Axis design system. All rules are MANDATORY unless explicitly marked as optional.

## Color Validation

### Critical Rules

**NEVER use raw color names.** All color usage must use semantic tokens.

❌ **Forbidden:**
- `bg-blue-500`, `text-green-700`, `border-red-300`
- `bg-sky-100`, `text-emerald-600`, `border-purple-500`
- Any Tailwind default color names: blue, green, red, yellow, purple, pink, indigo, cyan, teal, orange, lime, emerald, sky, violet, fuchsia, rose, amber, slate, gray, zinc, stone

✅ **Required:**
- `bg-main-500`, `text-main-700`, `border-main-300`
- `bg-neutral-50`, `text-neutral-800`, `border-neutral-100`
- `bg-success-50`, `text-success-700`, `border-success-300`
- `bg-error-50`, `text-error-700`, `border-error-300`
- `bg-alert-50`, `text-alert-700`, `border-alert-300`
- `bg-info-50`, `text-info-700`, `border-info-300`
- `bg-accent-1-500`, `bg-accent-2-500`, `bg-accent-3-500`, `bg-accent-4-500`, `bg-accent-5-500`

### Semantic Token Reference

| Token | Purpose | Shades Available |
|-------|---------|-----------------|
| `main` | Primary brand color | 50, 100, 300, 500, 700, 900, 950 |
| `neutral` | Text, backgrounds, borders | 50, 100, 300, 500, 700, 900, 950 |
| `success` | Positive feedback | 50, 100, 300, 500, 700, 900, 950 |
| `error` | Errors, destructive actions | 50, 100, 300, 500, 700, 900, 950 |
| `alert` | Warnings, cautions | 50, 100, 300, 500, 700, 900, 950 |
| `info` | Informational, help | 50, 100, 300, 500, 700, 900, 950 |
| `accent-1` to `accent-5` | Charts, data viz | 50, 100, 300, 500, 700, 900, 950 |
| `white` / `black` | Pure white/black only | N/A |

### Shade Usage Rules

| Shade | Usage |
|-------|-------|
| 50-100 | Backgrounds, subtle fills |
| 300 | Borders, disabled states |
| 500 | Primary actions, icons |
| 700 | Hover states, emphasis |
| 900-950 | Text, high contrast |

### Search Patterns for Color Violations

```bash
# Find raw color usage (blue, green, red, etc.)
grep -rE "(bg|text|border|from|to|via)-(blue|green|red|yellow|purple|pink|indigo|cyan|teal|orange|lime|emerald|sky|violet|fuchsia|rose|amber|slate|gray|zinc|stone)-[0-9]+" frontend/ --include="*.vue"
```

## Typography Validation

### Critical Rules

**NEVER use raw Tailwind text size classes.** Use semantic typography tokens.

❌ **Forbidden:**
- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, etc.
- Hardcoded font sizes in style attributes

✅ **Required:**
- Headlines: `text-h1-alt`, `text-h1`, `text-h2`, `text-h3`, `text-h4`, `text-h5`
- Body: `text-body-large`, `text-body-regular`
- Labels: `text-label`, `text-label-bold`
- Small: `text-suggestion` (badges/tags only)

### Typography Token Reference

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-h1-alt` | 24px | 600 | 1.3 | Hero headlines |
| `text-h1` | 22px | 600 | 1.3 | Page titles |
| `text-h2` | 20px | 600 | 1.3 | Section headers |
| `text-h3` | 18px | 600 | 1.4 | Subsection headers |
| `text-h4` | 16px | 600 | 1.4 | Card titles |
| `text-h5` | 14px | 600 | 1.4 | Small headers |
| `text-body-large` | 16px | 400 | 1.5 | Lead paragraphs |
| `text-body-regular` | 14px | 400 | 1.5 | Default body text |
| `text-label` | 12px | 500 | 1.4 | Form labels, captions |
| `text-label-bold` | 12px | 600 | 1.4 | Bold labels |
| `text-suggestion` | 10px | 500 | 1.4 | Badges, tags, timestamps |

### Text Hierarchy Rules

**Page & Section Titles:**
- Page titles: `text-h2 text-neutral-800`
- Section headers: `text-h4 text-neutral-800`
- Subsection headers: `text-h5 text-neutral-700`

**Body & Description Text:**
- Primary body: `text-body-regular text-neutral-700`
- Large body/lead: `text-body-large text-neutral-700`
- Section descriptions: `text-body-regular text-neutral-600`

**Supporting Text:**
- Labels: `text-label text-neutral-600`
- Helper/meta text: `text-label text-neutral-500`
- Badges/tags: `text-suggestion text-neutral-500`

### Minimum Readable Sizes

| Content Type | Minimum Size | Token |
|--------------|--------------|-------|
| Body text | 14px | `text-body-regular` |
| Labels/captions | 12px | `text-label` |
| Metadata only | 10px | `text-suggestion` |

**⚠️ WARNING:** Never use `text-suggestion` (10px) for readable content. Use only for badges, tags, and timestamps.

### Search Patterns for Typography Violations

```bash
# Find raw text size classes
grep -rE "text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)" frontend/ --include="*.vue"
```

## Contrast & Accessibility Validation

### Critical Rules

All text must meet WCAG AA guidelines:
- Normal text (< 18px): 4.5:1 contrast ratio
- Large text (≥ 18px): 3:1 contrast ratio

### Safe Text/Background Combinations

| Background | Text Color | Pass/Fail |
|------------|------------|-----------|
| `white` / `neutral-50` | `neutral-800` | ✅ Pass |
| `white` / `neutral-50` | `neutral-700` | ✅ Pass |
| `white` / `neutral-50` | `neutral-600` | ✅ Pass |
| `white` / `neutral-50` | `neutral-500` | ⚠️ Helper text only |
| `white` / `neutral-50` | `neutral-400` | ❌ Fail |
| `neutral-100` | `neutral-800` | ✅ Pass |
| `neutral-100` | `neutral-700` | ✅ Pass |
| `main-50` | `main-900` | ✅ Pass |
| `main-50` | `main-700` | ✅ Pass |
| `main-50` | `main-500` | ❌ Fail |

### Forbidden Low-Contrast Combinations

❌ **NEVER use:**
- `text-{color}-500` on `bg-{color}-50`
- `text-{color}-300` on any light background
- `text-neutral-400` for readable text
- `text-neutral-500` for body text (helper text only)

✅ **Required:**
- Headings: `neutral-800` or darker
- Body text: `neutral-700` or `neutral-600`
- Helper text minimum: `neutral-500`
- Never use shades lighter than 500 for text on light backgrounds

### ARIA Attribute Requirements

**All interactive elements must have accessible labels:**

```vue
<!-- ✅ Good: Button with visible text -->
<AxisButton>Save</AxisButton>

<!-- ✅ Good: Icon button with aria-label -->
<AxisButton icon-only :icon-left="PlusIcon" aria-label="Add item" />

<!-- ❌ Bad: Icon button without label -->
<AxisButton icon-only :icon-left="PlusIcon" />

<!-- ✅ Good: Link with visible text -->
<a href="/dashboard">Dashboard</a>

<!-- ✅ Good: Icon link with aria-label -->
<a href="/settings" aria-label="Settings">
  <CogIcon />
</a>

<!-- ❌ Bad: Icon link without label -->
<a href="/settings">
  <CogIcon />
</a>
```

### Search Patterns for Accessibility Violations

```bash
# Find low contrast text colors
grep -rE "text-(neutral|main|accent-[1-5]|success|error|alert|info)-[1-4]00" frontend/ --include="*.vue"

# Find icon buttons without aria-label
grep -rE "<button.*<svg" frontend/ --include="*.vue" | grep -v "aria-label"
```

## Component Usage Validation

### Critical Rules

**NEVER use raw HTML form elements.** Use Axis components.

### Forbidden Raw Elements

❌ **NEVER use:**
- `<button>` (use `<AxisButton>`)
- `<input>` (use `<AxisInput>`)
- `<select>` (use `<AxisSelect>`)
- Inline callout patterns with `p-4 bg-{type}-50 border` (use `<AxisCallout>`)

### Allowed Exceptions

✅ **Exceptions allowed:**
- Structural/functional elements (sidebar toggles, menu controllers)
- Google sign-in button (requires Google brand colors)
- Design system documentation examples
- Color swatch buttons in design system docs

### AxisButton Requirements

```vue
<!-- ✅ Correct usage -->
<AxisButton>Save Changes</AxisButton>
<AxisButton variant="outlined">Cancel</AxisButton>
<AxisButton variant="ghost" size="sm">Edit</AxisButton>
<AxisButton destructive>Delete</AxisButton>
<AxisButton :loading="isLoading">Processing...</AxisButton>
<AxisButton icon-only :icon-left="PlusIcon" aria-label="Add" />

<!-- ❌ Incorrect: Raw button -->
<button class="px-4 py-2 bg-main-500 text-white rounded">Save</button>
```

**Required Props:**
- `aria-label` for icon-only buttons
- `variant`: 'filled' | 'outlined' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'

### AxisInput Requirements

```vue
<!-- ✅ Correct usage -->
<AxisInput v-model="name" label="Name" placeholder="Enter name" />
<AxisInput v-model="email" type="email" label="Email" :error="emailError" />
<AxisInput v-model="password" type="password" label="Password" />

<!-- ❌ Incorrect: Raw input -->
<input type="text" v-model="name" class="border rounded px-3 py-2" />
```

**Required Props:**
- `label` for all inputs (accessibility)
- `type` for non-text inputs
- `v-model` for data binding

### AxisSelect Requirements

```vue
<!-- ✅ Correct usage -->
<AxisSelect
  v-model="selectedType"
  :options="propertyTypes"
  label="Property Type"
  placeholder="Select type"
/>

<!-- ❌ Incorrect: Raw select -->
<select v-model="selectedType" class="border rounded px-3 py-2">
  <option value="">Select type</option>
  <option v-for="type in propertyTypes" :value="type.value">{{ type.label }}</option>
</select>
```

**Required Props:**
- `label` for accessibility
- `:options` array with `{ value, label }` structure
- `v-model` for data binding

### AxisCallout Requirements

```vue
<!-- ✅ Correct usage -->
<AxisCallout type="success" title="Success!">
  Your changes have been saved.
</AxisCallout>

<AxisCallout type="error" title="Error">
  Something went wrong.
  <template #actions>
    <AxisButton variant="ghost" size="sm">Retry</AxisButton>
  </template>
</AxisCallout>

<!-- ❌ Incorrect: Inline callout -->
<div class="p-4 bg-success-50 border border-success-300 rounded">
  <p class="text-success-700">Success! Your changes have been saved.</p>
</div>
```

**Required Props:**
- `type`: 'info' | 'success' | 'warning' | 'error'
- `title` for clarity

### Search Patterns for Component Violations

```bash
# Find raw buttons (excluding design system docs)
grep -r "<button" frontend/pages frontend/components frontend/layouts --include="*.vue" | grep -v "design-system"

# Find raw inputs (excluding design system docs)
grep -r "<input" frontend/pages frontend/components frontend/layouts --include="*.vue" | grep -v "design-system"

# Find raw selects (excluding design system docs)
grep -r "<select" frontend/pages frontend/components frontend/layouts --include="*.vue" | grep -v "design-system"

# Find inline callout patterns
grep -r "p-4 bg-.*-50 border" frontend/pages frontend/components frontend/layouts --include="*.vue"
```

## Motion & Animation Validation

### Critical Rules

**All animations must follow motion guidelines:**

1. Default duration: 200ms (`duration-200`)
2. Use specific transition properties (NOT `transition-all`)
3. Never exceed 500ms for UI feedback
4. Respect `prefers-reduced-motion`

### Duration Token Reference

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| instant | 0ms | `duration-0` | Immediate state changes |
| fast | 100ms | `duration-100` | Micro-interactions |
| normal | 200ms | `duration-200` | **DEFAULT** - Most UI |
| slow | 300ms | `duration-300` | Panel slides, modals |
| slower | 400ms | `duration-400` | Complex animations |
| slowest | 500ms | `duration-500` | Elaborate sequences |

### Easing Curve Reference

| Token | Tailwind | Usage |
|-------|----------|-------|
| ease-out | `ease-out` | **DEFAULT** - Elements entering |
| ease-in | `ease-in` | Elements exiting |
| ease-in-out | `ease-in-out` | Elements staying on screen |
| linear | `ease-linear` | Progress indicators |

### Standard Animation Patterns

```vue
<!-- ✅ Correct: Specific transition properties -->
<button class="transition-colors duration-200 ease-out hover:bg-main-700">
<div class="transition-shadow duration-200 ease-out hover:shadow-lg">
<div class="transition-opacity duration-200 ease-out">
<div class="transition-transform duration-200 ease-out hover:scale-105">

<!-- ❌ Incorrect: transition-all -->
<button class="transition-all duration-200">

<!-- ❌ Incorrect: Duration too long -->
<div class="transition-opacity duration-1000">

<!-- ✅ Correct: Respect prefers-reduced-motion -->
<div class="motion-safe:transition-opacity motion-safe:duration-200">
```

### Forbidden Patterns

❌ **NEVER:**
- Use `transition-all` (be specific: `transition-colors`, `transition-opacity`, etc.)
- Exceed 500ms duration for UI feedback
- Animate layout properties (width, height, margin, padding)
- Ignore `prefers-reduced-motion`

✅ **Required:**
- Use 200ms as default duration
- Use `ease-out` for entering, `ease-in` for exiting
- Use `motion-safe:` and `motion-reduce:` variants
- Animate only transform, opacity, colors, or shadow

### Search Patterns for Motion Violations

```bash
# Find transition-all usage
grep -r "transition-all" frontend/ --include="*.vue"

# Find excessive durations (>500ms)
grep -rE "duration-([6-9][0-9]{2}|[1-9][0-9]{3})" frontend/ --include="*.vue"

# Find missing motion-safe variants
grep -r "transition-" frontend/ --include="*.vue" | grep -v "motion-safe" | grep -v "motion-reduce"
```

## Layout & Spacing Validation

### Standard Section Pattern

```vue
<!-- ✅ Correct: Standard section with divider -->
<div class="px-6 py-4 border-b border-neutral-100">
  <h2 class="text-h4 text-neutral-800 mb-2">Section Title</h2>
  <p class="text-body-regular text-neutral-600 mb-4">Section description.</p>
  <!-- Content -->
</div>

<!-- ✅ Correct: Last section (no bottom border) -->
<div class="px-6 py-4">
  <!-- Content -->
</div>
```

### Sidebar State Pattern

```vue
<!-- ✅ Correct: Content responds to sidebar state -->
<script setup>
const sidebarExpanded = useState('sidebar-expanded')
</script>

<template>
  <main :class="['pt-12', sidebarExpanded ? 'pl-52' : 'pl-14']">
    <!-- Content -->
  </main>
</template>
```

### Component Naming Conventions

**Components:**
- PascalCase: `AppHeader.vue`, `UserMenu.vue`
- Axis prefix: `AxisButton.vue`, `AxisInput.vue`

**Composables:**
- camelCase with `use` prefix: `useAuth.ts`, `useSidebar.ts`

**Pages:**
- kebab-case: `design-system/colors.vue`, `user-profile.vue`

## Data Visualization Validation

### Categorical Palette Order

Use in order for comparing categories (max 6 colors):

1. `accent-1-500` (#3b82f6)
2. `accent-2-500` (#6366f1)
3. `accent-3-500` (#f97316)
4. `accent-4-500` (#84cc16)
5. `accent-5-500` (#ec4899)
6. `info-500` (#06b6d4)

### Semantic Colors for Status

| Meaning | Token | Usage |
|---------|-------|-------|
| Positive | `success-500` | Growth, gains |
| Negative | `error-500` | Decline, losses |
| Warning | `alert-500` | Caution, thresholds |
| Neutral | `neutral-400` | Baseline, unchanged |

### Accessibility Rules for Charts

1. Ensure 3:1 minimum contrast between adjacent colors
2. Don't rely solely on color—use patterns, labels, or icons
3. Avoid red/green as only differentiators (colorblindness)
4. Add direct labels to data series when possible
5. Test with colorblind simulation tools

## Validation Workflow

### Step 1: Automated Scan

Run the violation scanner:

```bash
python scripts/scan_violations.py frontend/ --format markdown
```

### Step 2: Manual Review

Check for violations that cannot be detected automatically:

1. **Semantic meaning**: Are colors used correctly (e.g., `error` for errors, not for regular content)?
2. **Accessibility**: Do all interactive elements have proper ARIA labels?
3. **Typography hierarchy**: Is the visual hierarchy clear and logical?
4. **Component usage**: Are Axis components used correctly with proper props?
5. **Motion**: Are animations smooth and respect user preferences?

### Step 3: Cross-Reference Documentation

Compare implementation against:
- [frontend/pages/design-system/colors.vue](frontend/pages/design-system/colors.vue)
- [frontend/pages/design-system/typography.vue](frontend/pages/design-system/typography.vue)
- [frontend/pages/design-system/components/](frontend/pages/design-system/components/)
- [frontend/pages/design-system/motion.vue](frontend/pages/design-system/motion.vue)

### Step 4: Generate Report

Create a structured report with:
- File path and line number
- Severity (critical/warning/suggestion)
- Rule violated
- Current implementation
- Recommended fix
- Reference to documentation

## Severity Levels

### Critical
Must be fixed before merge. Code that violates these rules is broken.
- Raw HTML elements instead of Axis components
- Non-semantic color tokens
- Low contrast text
- Missing accessibility attributes
- Layout properties animated

### Warning
Should be fixed, but not blocking.
- Hardcoded text sizes instead of tokens
- `transition-all` instead of specific properties
- Long animation durations (but < 1s)
- Missing `motion-safe` variants

### Suggestion
Nice to have, improves code quality.
- Inconsistent spacing
- Non-standard naming conventions
- Missing documentation comments
